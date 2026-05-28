import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("StakingPlatform", function () {
  let stakeToken;
  let rewardToken;
  let stakingPlatform;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy StakeToken
    const StakeToken = await ethers.getContractFactory("StakeToken");
    stakeToken = await StakeToken.deploy();

    // Deploy RewardToken (We'll use StakeToken contract for simplicity as another ERC20)
    rewardToken = await StakeToken.deploy();

    // Deploy StakingPlatform
    const StakingPlatform = await ethers.getContractFactory("StakingPlatform");
    stakingPlatform = await StakingPlatform.deploy(
      await stakeToken.getAddress(),
      await rewardToken.getAddress()
    );

    // Fund the StakingPlatform with reward tokens
    const fundAmount = ethers.parseUnits("100000", 18);
    await rewardToken.approve(await stakingPlatform.getAddress(), fundAmount);
    await stakingPlatform.fundRewardPool(fundAmount);

    // Distribute some staking tokens to addr1
    await stakeToken.transfer(addr1.address, ethers.parseUnits("1000", 18));
  });

  it("Should allow user to stake tokens", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await stakeToken.connect(addr1).approve(await stakingPlatform.getAddress(), stakeAmount);

    await expect(stakingPlatform.connect(addr1).stake(stakeAmount, 0))
      .to.emit(stakingPlatform, "Staked")
      .withArgs(addr1.address, stakeAmount, 0, 0);

    const stakeInfo = await stakingPlatform.stakes(addr1.address, 0);
    expect(stakeInfo.amount).to.equal(stakeAmount);
    expect(stakeInfo.active).to.be.true;
  });

  it("Should allow user to unstake after lock period", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await stakeToken.connect(addr1).approve(await stakingPlatform.getAddress(), stakeAmount);
    
    // Stake in Tier 0 (No lock)
    await stakingPlatform.connect(addr1).stake(stakeAmount, 0);

    // Fast forward 1 year to get rewards
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await expect(stakingPlatform.connect(addr1).unstake(0))
      .to.emit(stakingPlatform, "Unstaked");

    const stakeInfo = await stakingPlatform.stakes(addr1.address, 0);
    expect(stakeInfo.active).to.be.false;
  });

  it("Should not allow unstaking before lock period ends", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await stakeToken.connect(addr1).approve(await stakingPlatform.getAddress(), stakeAmount);
    
    // Stake in Tier 1 (30 days lock)
    await stakingPlatform.connect(addr1).stake(stakeAmount, 1);

    await expect(stakingPlatform.connect(addr1).unstake(0)).to.be.revertedWith("Lock period not ended");
  });

  it("Should calculate and claim rewards correctly", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);
    await stakeToken.connect(addr1).approve(await stakingPlatform.getAddress(), stakeAmount);
    
    // Stake in Tier 0 (5% APY)
    await stakingPlatform.connect(addr1).stake(stakeAmount, 0);

    // Fast forward 1 year
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const pendingRewards = await stakingPlatform.getPendingRewards(addr1.address, 0);
    
    // 5% of 100 = 5 tokens
    expect(pendingRewards).to.be.closeTo(ethers.parseUnits("5", 18), ethers.parseUnits("0.1", 18));

    await expect(stakingPlatform.connect(addr1).claimRewards(0))
      .to.emit(stakingPlatform, "RewardClaimed");
  });
});
