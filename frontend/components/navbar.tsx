"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SimpleWalletButton } from "@/components/simple-wallet-button"
import { ClientOnly } from "@/components/client-only"
import { usePyusdBalance } from "@/lib/contract-hooks"
import { formatPyusdAmount } from "@/lib/contract-utils"
import { useAccount } from "wagmi"

// PYUSD Balance Display Component
function PyusdBalanceInner() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading, error, refetch } = usePyusdBalance(address)

  // Refresh balance every 30 seconds when connected
  React.useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(() => {
      refetch()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, address, refetch])

  if (!isConnected || !address) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-green-700">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
        onClick={() => refetch()}
        title="Click to retry"
      >
        <span className="text-sm text-red-700">Balance Error</span>
      </div>
    )
  }

  const formattedBalance = balance ? formatPyusdAmount(balance) : '0'
  const displayBalance = parseFloat(formattedBalance).toFixed(2)

  return (
    <motion.div 
      className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
      onClick={() => refetch()}
      title="Click to refresh balance"
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="w-2 h-2 bg-green-500 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="text-sm font-medium text-green-700">
        {displayBalance} PYUSD
      </span>
    </motion.div>
  )
}

// Wrapper component to prevent hydration issues
function PyusdBalance() {
  return (
    <ClientOnly
      fallback={
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg" />
      }
    >
      <PyusdBalanceInner />
    </ClientOnly>
  )
}

export function Navbar() {
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

            <PyusdBalance />
            <SimpleWalletButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
