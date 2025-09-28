"use client"

import React, { createContext, useContext, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wallet-config'
import { useAppStore } from './store'
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi'

// Query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

interface WalletContextType {
  isConnected: boolean
  address?: string
  ensName?: string
  isLoading: boolean
  error?: string
  connect: (connectorId: string) => void
  disconnect: () => void
  connectors: any[]
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Internal component to handle wallet state synchronization
function WalletStateSync() {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { connectWallet, disconnectWallet } = useAppStore()

  useEffect(() => {
    if (isConnected && address) {
      connectWallet(address)
    } else {
      disconnectWallet()
    }
  }, [isConnected, address, connectWallet, disconnectWallet])

  return null
}

// Wallet provider component
function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId)
    if (connector) {
      connect({ connector })
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const value: WalletContextType = {
    isConnected,
    address,
    ensName: ensName || undefined,
    isLoading: isPending,
    error: error?.message,
    connect: handleConnect,
    disconnect: handleDisconnect,
    connectors: [...connectors],
  }

  return (
    <WalletContext.Provider value={value}>
      <WalletStateSync />
      {children}
    </WalletContext.Provider>
  )
}

// Main provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>
          {children}
        </WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}