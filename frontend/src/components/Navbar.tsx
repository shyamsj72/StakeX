"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Coins } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <Coins className="h-6 w-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight">
            SCAI <span className="text-indigo-500">StakeX</span>
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <ConnectButton 
            chainStatus="icon"
            showBalance={true}
            accountStatus="address"
          />
        </div>
      </div>
    </nav>
  );
}
