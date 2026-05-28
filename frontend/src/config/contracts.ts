import StakeTokenABI from './abis/StakeToken.sol/StakeToken.json';
import StakingPlatformABI from './abis/StakingPlatform.sol/StakingPlatform.json';

// These addresses should be updated after deployment to Sepolia or Mainnet
export const CONTRACT_ADDRESSES = {
  // Real Sepolia Deployed Addresses
  stakingPlatform: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xCAF7DDbB2654C182cA26b37ACcC3f4c1f5a2C342",
  stakeToken: "0x4cE68738477FF8C9a8D6a8677e8A9AD0eE898f9d", 
  rewardToken: "0x0fC7144012B65B8eC6789cDe068481f96267f71D",
};

export const STAKING_PLATFORM_ABI = StakingPlatformABI.abi;
export const STAKE_TOKEN_ABI = StakeTokenABI.abi;
