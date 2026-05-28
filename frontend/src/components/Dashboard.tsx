/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CONTRACT_ADDRESSES, STAKING_PLATFORM_ABI, STAKE_TOKEN_ABI } from "@/config/contracts";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Coins, TrendingUp, Lock, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Read User Balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.stakeToken as `0x${string}`,
    abi: STAKE_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Read Total Staked (TVL)
  const { data: totalStakedData } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`,
    abi: STAKING_PLATFORM_ABI,
    functionName: "totalStaked",
  });

  // Read User Stakes
  const { data: userStakesData, refetch: refetchStakes } = useReadContract({
    address: CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`,
    abi: STAKING_PLATFORM_ABI,
    functionName: "getUserStakes",
    args: address ? [address] : undefined,
  });

  const { writeContractAsync } = useWriteContract();

  const handleStake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const toastId = toast.loading("Approving tokens...");
      const parsedAmount = parseUnits(amount, 18);
      
      // First Approve
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakeToken as `0x${string}`,
        abi: STAKE_TOKEN_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`, parsedAmount],
      });

      toast.loading("Staking tokens...", { id: toastId });

      // Then Stake
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`,
        abi: STAKING_PLATFORM_ABI,
        functionName: "stake",
        args: [parsedAmount, BigInt(selectedTier)],
      });

      toast.success("Successfully staked!", { id: toastId });
      setAmount("");
      refetchBalance();
      refetchStakes();
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || "Transaction failed");
    }
  };

  const handleClaim = async (stakeId: number) => {
    try {
      const toastId = toast.loading("Claiming rewards...");
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`,
        abi: STAKING_PLATFORM_ABI,
        functionName: "claimRewards",
        args: [BigInt(stakeId)],
      });
      toast.success("Rewards claimed!", { id: toastId });
      refetchStakes();
      refetchBalance();
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || "Transaction failed");
    }
  };

  const handleUnstake = async (stakeId: number) => {
    try {
      const toastId = toast.loading("Unstaking tokens...");
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakingPlatform as `0x${string}`,
        abi: STAKING_PLATFORM_ABI,
        functionName: "unstake",
        args: [BigInt(stakeId)],
      });
      toast.success("Tokens unstaked!", { id: toastId });
      refetchStakes();
      refetchBalance();
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || "Transaction failed");
    }
  };

  const refreshAll = () => {
    refetchBalance();
    refetchStakes();
    toast.success("Data refreshed");
  };

  const tiers = [
    { id: 0, name: "Flexible", apy: 5, lock: 0 },
    { id: 1, name: "30 Days", apy: 10, lock: 30 * 24 * 60 * 60 },
    { id: 2, name: "90 Days", apy: 20, lock: 90 * 24 * 60 * 60 },
    { id: 3, name: "180 Days", apy: 40, lock: 180 * 24 * 60 * 60 },
  ];

  const stakes = (userStakesData as any[]) || [];
  
  // Calculate stats
  let myTotalStaked = BigInt(0);
  let myPendingRewards = BigInt(0);

  stakes.forEach((stake) => {
    if (stake.active) {
      const amount = BigInt(stake.amount);
      myTotalStaked += amount;
      
      const tier = tiers[Number(stake.tierIndex)];
      if (tier) {
        const timeStaked = BigInt(currentTimestamp) - BigInt(stake.lastClaimTime);
        const reward = (amount * BigInt(tier.apy * 100) * timeStaked) / (BigInt(10000) * BigInt(365) * BigInt(24) * BigInt(60) * BigInt(60));
        myPendingRewards += reward > BigInt(0) ? reward : BigInt(0);
      }
    }
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur border-indigo-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value Locked</CardTitle>
              <Lock className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStakedData ? parseFloat(formatUnits(totalStakedData as bigint, 18)).toFixed(2) : "0"} STK
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur border-indigo-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Staked Balance</CardTitle>
              <Coins className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isConnected ? `${parseFloat(formatUnits(myTotalStaked, 18)).toFixed(2)} STK` : "---"}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur border-indigo-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Pending Rewards</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {isConnected ? `${parseFloat(formatUnits(myPendingRewards, 18)).toFixed(6)} RWD` : "---"}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Action Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle>Stake Tokens</CardTitle>
              <CardDescription>Lock your tokens to earn high APY rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span>Balance: {balanceData ? parseFloat(formatUnits(balanceData as bigint, 18)).toFixed(2) : "0"} STK</span>
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-300"
                    onClick={() => setAmount(balanceData ? formatUnits(balanceData as bigint, 18) : "0")}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm text-muted-foreground">Select Tier</span>
                <div className="grid grid-cols-2 gap-3">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                        selectedTier === tier.id 
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" 
                          : "border-border/40 bg-background/30 hover:border-indigo-500/50"
                      }`}
                    >
                      <span className="font-bold">{tier.apy}% APY</span>
                      <span className="text-xs text-muted-foreground">{tier.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg"
                onClick={handleStake}
                disabled={!isConnected}
              >
                {isConnected ? "Stake Now" : "Connect Wallet to Stake"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Stakes List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur border-border/40 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Stakes</CardTitle>
                <CardDescription>Manage your staked positions.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={refreshAll}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Lock className="h-8 w-8 mb-2 opacity-20" />
                  <p>Connect wallet to view your stakes</p>
                </div>
              ) : stakes.filter(s => s.active).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No active stakes found.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {stakes.map((stake, index) => {
                    if (!stake.active) return null;
                    const tier = tiers[Number(stake.tierIndex)];
                    const lockedUntil = Number(stake.startTime) + tier.lock;
                    const isLocked = currentTimestamp < lockedUntil;
                    
                    return (
                      <div key={index} className="p-4 rounded-lg border border-border/40 bg-background/30 flex justify-between items-center">
                        <div>
                          <div className="font-bold">{parseFloat(formatUnits(BigInt(stake.amount), 18)).toFixed(2)} STK</div>
                          <div className="text-xs text-muted-foreground">Tier {tier.id} ({tier.name}) - {tier.apy}% APY</div>
                          {isLocked && tier.lock > 0 && (
                            <div className="text-xs text-amber-500 mt-1">
                              Locked until: {new Date(lockedUntil * 1000).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleClaim(index)}>Claim</Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleUnstake(index)}
                            disabled={isLocked && tier.lock > 0}
                          >
                            Unstake
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
