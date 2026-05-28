import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy StakeToken (for staking)
  const StakeToken = await ethers.getContractFactory("StakeToken");
  const stakeToken = await StakeToken.deploy();
  await stakeToken.waitForDeployment();
  console.log("StakeToken deployed to:", await stakeToken.getAddress());

  // Deploy RewardToken
  // For this project, we are using StakeToken as both, or we can deploy another instance
  const rewardToken = await StakeToken.deploy();
  await rewardToken.waitForDeployment();
  console.log("RewardToken deployed to:", await rewardToken.getAddress());

  // Deploy StakingPlatform
  const StakingPlatform = await ethers.getContractFactory("StakingPlatform");
  const stakingPlatform = await StakingPlatform.deploy(
    await stakeToken.getAddress(),
    await rewardToken.getAddress()
  );
  await stakingPlatform.waitForDeployment();
  console.log("StakingPlatform deployed to:", await stakingPlatform.getAddress());

  // Fund Reward Pool with 500,000 Reward Tokens
  const fundAmount = ethers.parseUnits("500000", 18);
  await rewardToken.approve(await stakingPlatform.getAddress(), fundAmount);
  await stakingPlatform.fundRewardPool(fundAmount);
  console.log("Funded StakingPlatform reward pool with 500,000 tokens");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
