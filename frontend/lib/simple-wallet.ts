"use client"

import { useState, useEffect, useCallback } from 'react'

interface WalletState {
  isConnected: boolean
  address: string | null
  isMetaMaskInstalled: boolean
  isConnecting: boolean
  error: string | null
}

export function useSimpleWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isMetaMaskInstalled: false,
    isConnecting: false,
    error: null
  })

  // Check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window === 'undefined') return false
    return !!(window as any).ethereum?.isMetaMask
  }, [])

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isInstalled = checkMetaMask()
      setState(prev => ({ ...prev, isMetaMaskInstalled: isInstalled }))

      if (isInstalled) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_accounts'
          })

          if (accounts.length > 0) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              address: accounts[0]
            }))
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()
  }, [checkMetaMask])

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!checkMetaMask()) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed'
      }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length > 0) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          isConnecting: false
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false
      }))
    }
  }, [checkMetaMask])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      error: null
    }))
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !checkMetaMask()) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          address: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0]
        }))
      }
    }

    ;(window as any).ethereum.on('accountsChanged', handleAccountsChanged)

    return () => {
      ;(window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [checkMetaMask])

  return {
    ...state,
    connect,
    disconnect,
    displayAddress: state.address ?
      `${state.address.slice(0, 6)}...${state.address.slice(-4)}` :
      null
  }
}