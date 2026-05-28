import StakeTokenABI from './abis/StakeToken.sol/StakeToken.json';
import StakingPlatformABI from './abis/StakingPlatform.sol/StakingPlatform.json';

// These addresses should be updated after deployment to Sepolia or Mainnet
export const CONTRACT_ADDRESSES = {
  // Hardhat local node mock addresses (replace with real after deployment)
  stakingPlatform: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  stakeToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3", 
  rewardToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};

export const STAKING_PLATFORM_ABI = StakingPlatformABI.abi;
export const STAKE_TOKEN_ABI = StakeTokenABI.abi;
