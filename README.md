# SCAI StakeX - DeFi Staking Platform

SCAI StakeX is a complete full-stack DeFi staking platform built for production. Users can connect their wallets, stake ERC20 tokens into multi-tier pools, earn time-based rewards, and unstake seamlessly. 

The project features a highly modern, futuristic dark theme with fluid animations and a responsive dashboard.

## Features
- **Multi-tier Staking Pools:** Flexible, 30-day, 90-day, and 180-day locks with varying APYs (5% to 40%).
- **Secure Smart Contracts:** Built with OpenZeppelin `ReentrancyGuard`, `Ownable`, and `Pausable` for production-grade security.
- **Premium UI/UX:** Responsive Next.js frontend with Tailwind CSS, Framer Motion, and Shadcn UI.
- **Wallet Connection:** Integrated with Wagmi & RainbowKit for MetaMask, WalletConnect, and Coinbase support.
- **Real-time Metrics:** TVL (Total Value Locked), pending rewards, and active stakes display.
- **Transaction Notifications:** Real-time toast notifications for blockchain events.

## Tech Stack
### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS & Shadcn UI
- Framer Motion (Animations)
- Wagmi & Ethers.js
- RainbowKit (Wallet integration)
- React Hot Toast

### Blockchain
- Solidity (v0.8.24)
- Hardhat (Development framework)
- OpenZeppelin Contracts
- Chai & Mocha (Testing)

---

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_REPO/SCAI-StakeX.git
cd SCAI-StakeX
```

### 2. Smart Contract Setup
```bash
cd blockchain
npm install
```
- Create a `.env` file in the `blockchain` directory based on `.env.example`.
- Run tests to ensure contracts are working:
```bash
npx hardhat test
```
- Deploy to Sepolia testnet:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
- Copy the deployed contract addresses from the deployment script and update `src/config/contracts.ts`.
- Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Deployment Guide (Vercel)

This frontend is optimized for zero-config Vercel deployment.

1. Ensure your Next.js app builds locally: `npm run build`
2. Install the Vercel CLI:
```bash
npm install -g vercel
```
3. Deploy to Vercel:
```bash
vercel --prod
```
4. Configure environment variables (like `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_CHAIN_ID`) in the Vercel dashboard.

---

## Git Push Commands
To push your project to GitHub, use the following commands from the root directory:

```bash
git init
git add .
git commit -m "Initial DeFi staking platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

## Security & Gas Optimization
- **Reentrancy Protection:** All external state-changing functions use `nonReentrant`.
- **Checks-Effects-Interactions:** Adhered strictly to prevent unexpected state bugs.
- **Safe Math:** Built into Solidity ^0.8.0, preventing overflow/underflow.
- **Gas Optimization:** Minimal storage updates, efficient loop designs, and compact structs used.

---
*Built for SCAI final project submission.*
