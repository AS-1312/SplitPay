"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import { ClientOnly } from "@/components/client-only"
import { useWalletConnection } from "@/lib/use-wallet"
import { Wallet, AlertTriangle, ExternalLink } from "lucide-react"

interface WalletButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

function WalletButtonInner({ className, size = "default" }: WalletButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const {
    isConnected,
    isConnecting,
    displayName,
    balance,
    balanceSymbol,
    isOnCorrectNetwork,
    switchToMainnet,
    disconnectWallet,
    isSwitching
  } = useWalletConnection()

  if (isConnected) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center space-x-3 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors ${className}`}
        >
          <Wallet className="w-4 h-4" />
          <div className="text-left">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-green-600">{balance} {balanceSymbol}</p>
          </div>
        </motion.button>

        {showDropdown && (
          <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[200px]">
            {!isOnCorrectNetwork && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2 text-amber-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Wrong Network</span>
                </div>
                <Button
                  size="sm"
                  onClick={switchToMainnet}
                  disabled={isSwitching}
                  className="w-full text-xs"
                >
                  {isSwitching ? "Switching..." : "Switch to Ethereum"}
                </Button>
              </div>
            )}

            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm font-mono text-gray-900 mb-2">{displayName}</p>
              <p className="text-xs text-gray-500 mb-1">Balance</p>
              <p className="text-sm text-gray-900">{balance} {balanceSymbol}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={() => {
                  disconnectWallet()
                  setShowDropdown(false)
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => setShowModal(true)}
          disabled={isConnecting}
          size={size}
          className={`gradient-primary text-white ${className}`}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </motion.div>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

export function WalletButton(props: WalletButtonProps) {
  return (
    <ClientOnly
      fallback={
        <div className={`h-10 w-32 bg-gray-200 animate-pulse rounded-lg ${props.className}`} />
      }
    >
      <WalletButtonInner {...props} />
    </ClientOnly>
  )
}