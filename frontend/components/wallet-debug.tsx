"use client"

import React from "react"
import { getWalletInfo } from "@/lib/wallet-utils"

export function WalletDebug() {
  if (typeof window === 'undefined') {
    return <div className="text-xs text-gray-500">Server-side rendering</div>
  }

  const walletInfo = getWalletInfo()

  return (
    <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1 max-h-32 overflow-y-auto">
      <div className="font-semibold text-gray-700">Wallet Debug Info:</div>
      <div>window.ethereum: {walletInfo.hasEthereum ? '✅ Present' : '❌ Not found'}</div>
      <div>MetaMask detected: {walletInfo.hasMetaMask ? '✅ Yes' : '❌ No'}</div>
      <div>Providers: {walletInfo.providers.join(', ') || 'None'}</div>
      <div>Browser: {walletInfo.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</div>
      {walletInfo.ethereumObject && walletInfo.ethereumObject.length > 0 && (
        <div>Ethereum keys: {walletInfo.ethereumObject.slice(0, 5).join(', ')}...</div>
      )}
    </div>
  )
}