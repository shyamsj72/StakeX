// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPlatform is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // APY Tiers based on lock duration
    // 0 = No lock, 1 = 30 days, 2 = 90 days, 3 = 180 days
    struct Tier {
        uint256 apy;        // e.g., 500 = 5%
        uint256 lockPeriod; // in seconds
    }

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 tierIndex;
        bool active;
    }

    mapping(uint256 => Tier) public tiers;
    uint256 public tierCount;

    // User => Stake ID => Stake Info
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    // User => Stake Count
    mapping(address => uint256) public stakeCounts;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 tierIndex, uint256 stakeId);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeId);
    event RewardClaimed(address indexed user, uint256 reward, uint256 stakeId);
    event RewardPoolFunded(uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 stakeId);

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        // Setup default tiers
        // Tier 0: Flexible, 5% APY
        addTier(500, 0);
        // Tier 1: 30 days, 10% APY
        addTier(1000, 30 days);
        // Tier 2: 90 days, 20% APY
        addTier(2000, 90 days);
        // Tier 3: 180 days, 40% APY
        addTier(4000, 180 days);
    }

    function addTier(uint256 _apy, uint256 _lockPeriod) public onlyOwner {
        tiers[tierCount] = Tier({
            apy: _apy,
            lockPeriod: _lockPeriod
        });
        tierCount++;
    }

    function updateTier(uint256 _tierIndex, uint256 _apy, uint256 _lockPeriod) external onlyOwner {
        require(_tierIndex < tierCount, "Invalid tier");
        tiers[_tierIndex].apy = _apy;
        tiers[_tierIndex].lockPeriod = _lockPeriod;
    }

    function stake(uint256 _amount, uint256 _tierIndex) external nonReentrant whenNotPaused {
        require(_amount > 0, "Amount must be greater than 0");
        require(_tierIndex < tierCount, "Invalid tier");

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 stakeId = stakeCounts[msg.sender];
        stakes[msg.sender][stakeId] = StakeInfo({
            amount: _amount,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            tierIndex: _tierIndex,
            active: true
        });

        stakeCounts[msg.sender]++;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount, _tierIndex, stakeId);
    }

    function unstake(uint256 _stakeId) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");
        
        Tier memory tier = tiers[userStake.tierIndex];
        require(block.timestamp >= userStake.startTime + tier.lockPeriod, "Lock period not ended");

        uint256 amount = userStake.amount;
        uint256 pendingReward = calculateReward(msg.sender, _stakeId);

        userStake.active = false;
        userStake.amount = 0;
        totalStaked -= amount;

        // Transfer staked tokens back
        stakingToken.safeTransfer(msg.sender, amount);
        
        // Transfer rewards if any
        if (pendingReward > 0) {
            require(rewardToken.balanceOf(address(this)) >= pendingReward, "Insufficient reward pool");
            rewardToken.safeTransfer(msg.sender, pendingReward);
        }

        emit Unstaked(msg.sender, amount, pendingReward, _stakeId);
    }

    function claimRewards(uint256 _stakeId) external nonReentrant whenNotPaused {
        StakeInfo storage userStake = stakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");

        uint256 pendingReward = calculateReward(msg.sender, _stakeId);
        require(pendingReward > 0, "No rewards to claim");
        require(rewardToken.balanceOf(address(this)) >= pendingReward, "Insufficient reward pool");

        userStake.lastClaimTime = block.timestamp;
        rewardToken.safeTransfer(msg.sender, pendingReward);

        emit RewardClaimed(msg.sender, pendingReward, _stakeId);
    }

    function emergencyWithdraw(uint256 _stakeId) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender][_stakeId];
        require(userStake.active, "Stake not active");

        uint256 amount = userStake.amount;
        userStake.active = false;
        userStake.amount = 0;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, amount, _stakeId);
    }

    function calculateReward(address _user, uint256 _stakeId) public view returns (uint256) {
        StakeInfo memory userStake = stakes[_user][_stakeId];
        if (!userStake.active) return 0;

        Tier memory tier = tiers[userStake.tierIndex];
        
        uint256 timeStaked = block.timestamp - userStake.lastClaimTime;
        // Reward = (amount * apy * timeStaked) / (10000 * 365 days)
        // Note: 10000 is used for 2 decimal precision (e.g., 500 = 5%)
        uint256 reward = (userStake.amount * tier.apy * timeStaked) / (10000 * 365 days);
        return reward;
    }

    function getPendingRewards(address _user, uint256 _stakeId) external view returns (uint256) {
        return calculateReward(_user, _stakeId);
    }

    function getUserStakes(address _user) external view returns (StakeInfo[] memory) {
        uint256 count = stakeCounts[_user];
        StakeInfo[] memory userStakes = new StakeInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            userStakes[i] = stakes[_user][i];
        }
        return userStakes;
    }

    function fundRewardPool(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit RewardPoolFunded(_amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Function to withdraw accidentally sent tokens (other than staking tokens)
    function recoverToken(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(stakingToken), "Cannot withdraw staking token");
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
}
