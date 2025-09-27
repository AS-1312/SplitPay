"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useWalletConnection } from "@/lib/use-wallet"
import { X, AlertCircle, ExternalLink } from "lucide-react"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connectWallet, isConnecting, connectError, walletOptions } = useWalletConnection()
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedWallet(null)
      setLocalError(null)
    }
  }, [isOpen])

  // Reset loading state if connection stops without success
  useEffect(() => {
    if (!isConnecting && selectedWallet) {
      const timer = setTimeout(() => {
        setSelectedWallet(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isConnecting, selectedWallet])

  const handleConnect = async (connectorId: string) => {
    if (isConnecting) return // Prevent multiple simultaneous connections

    setSelectedWallet(connectorId)
    setLocalError(null)

    try {
      await connectWallet(connectorId)
      // If we get here, connection was successful, close modal
      onClose()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setLocalError(error instanceof Error ? error.message : 'Failed to connect wallet')
      setSelectedWallet(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-auto my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isConnecting}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                Choose a wallet to connect to SplitPay and start managing your shared expenses.
              </p>

              {(connectError || localError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 text-sm">{localError || connectError}</p>
                  </div>
                </div>
              )}

            </div>

            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <motion.button
                  key={wallet.id}
                  whileHover={{ scale: wallet.ready ? 1.02 : 1 }}
                  whileTap={{ scale: wallet.ready ? 0.98 : 1 }}
                  onClick={() => wallet.ready && handleConnect(wallet.id)}
                  disabled={isConnecting || !wallet.ready}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                    wallet.ready
                      ? 'border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                  } ${selectedWallet === wallet.id ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="text-left">
                      <p className={`font-medium ${wallet.ready ? 'text-gray-900' : 'text-gray-400'}`}>
                        {wallet.name}
                      </p>
                      {!wallet.ready && (
                        <p className="text-xs text-red-500">MetaMask not detected</p>
                      )}
                      {wallet.ready && (
                        <p className="text-xs text-green-600">Ready to connect</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {!wallet.ready && (
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>Install</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedWallet === wallet.id && isConnecting && (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                <span>Don't have a wallet?</span>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                >
                  <span>Get MetaMask</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}