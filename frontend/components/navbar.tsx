"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { shortenAddress } from "@/lib/utils"

export function Navbar() {
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet } = useAppStore()

  const handleConnectWallet = () => {
    // Mock wallet connection for demo
    const mockAddress = "0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e"
    connectWallet(mockAddress)
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center"
            >
              <span className="text-white font-bold text-lg">S</span>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              SplitPay
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hover:bg-green-50 hover:text-green-700 transition-colors">
                Dashboard
              </Button>
            </Link>

            {isWalletConnected ? (
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {shortenAddress(walletAddress || "")}
                </motion.div>
                <Button
                  variant="outline"
                  onClick={disconnectWallet}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors bg-transparent"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleConnectWallet} className="gradient-primary text-white">
                  Connect Wallet
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
