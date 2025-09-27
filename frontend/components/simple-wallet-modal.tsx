"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useSimpleWallet } from "@/lib/simple-wallet"
import { X, AlertCircle, ExternalLink } from "lucide-react"

interface SimpleWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SimpleWalletModal({ isOpen, onClose }: SimpleWalletModalProps) {
  const { isMetaMaskInstalled, isConnecting, error, connect } = useSimpleWallet()

  const handleConnect = async () => {
    await connect()
    if (!error) {
      onClose()
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
                Connect your MetaMask wallet to start using SplitPay.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: isMetaMaskInstalled ? 1.02 : 1 }}
                whileTap={{ scale: isMetaMaskInstalled ? 0.98 : 1 }}
                onClick={isMetaMaskInstalled ? handleConnect : undefined}
                disabled={isConnecting || !isMetaMaskInstalled}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                  isMetaMaskInstalled
                    ? 'border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🦊</span>
                  <div className="text-left">
                    <p className={`font-medium ${isMetaMaskInstalled ? 'text-gray-900' : 'text-gray-400'}`}>
                      MetaMask
                    </p>
                    {!isMetaMaskInstalled && (
                      <p className="text-xs text-red-500">MetaMask not detected</p>
                    )}
                    {isMetaMaskInstalled && (
                      <p className="text-xs text-green-600">Ready to connect</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  {!isMetaMaskInstalled && (
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
                  {isConnecting && (
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </motion.button>
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