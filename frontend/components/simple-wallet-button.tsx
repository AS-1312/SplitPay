"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SimpleWalletModal } from "@/components/simple-wallet-modal"
import { ClientOnly } from "@/components/client-only"
import { useSimpleWallet } from "@/lib/simple-wallet"
import { Wallet, AlertTriangle } from "lucide-react"

interface SimpleWalletButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

function SimpleWalletButtonInner({ className, size = "default" }: SimpleWalletButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const {
    isConnected,
    isConnecting,
    displayAddress,
    disconnect
  } = useSimpleWallet()

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
            <p className="text-sm font-medium">{displayAddress}</p>
            <p className="text-xs text-green-600">Connected</p>
          </div>
        </motion.button>

        {showDropdown && (
          <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[200px]">
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm font-mono text-gray-900 mb-2">{displayAddress}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={() => {
                  disconnect()
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

      <SimpleWalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}

export function SimpleWalletButton(props: SimpleWalletButtonProps) {
  return (
    <ClientOnly
      fallback={
        <div className={`h-10 w-32 bg-gray-200 animate-pulse rounded-lg ${props.className}`} />
      }
    >
      <SimpleWalletButtonInner {...props} />
    </ClientOnly>
  )
}