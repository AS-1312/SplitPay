import { useCallback, useMemo } from 'react'
import { useAccount, useBalance, useEnsName, useDisconnect, useConnect, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'
import { mainnet } from './wallet-config'

export function useWalletConnection() {
  const { address, isConnected, chain } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect()
  const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain()

  // Format balance for display
  const formattedBalance = useMemo(() => {
    if (!balance) return '0.00'
    const eth = formatEther(balance.value)
    return parseFloat(eth).toFixed(4)
  }, [balance])

  // Check if on correct network (mainnet for production)
  const isOnCorrectNetwork = useMemo(() => {
    return chain?.id === mainnet.id
  }, [chain])

  // Connect to wallet
  const connectWallet = useCallback(async (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId)
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`)
    }

    try {
      await connect({ connector })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }, [connect, connectors])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect()
  }, [disconnect])

  // Switch to mainnet
  const switchToMainnet = useCallback(() => {
    if (chain?.id !== mainnet.id) {
      switchChain({ chainId: mainnet.id })
    }
  }, [switchChain, chain])

  // Get display name (ENS name or shortened address)
  const displayName = useMemo(() => {
    if (ensName) return ensName
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`
    return ''
  }, [ensName, address])

  // Available wallet connectors with simple real-time detection
  const walletOptions = connectors.map(connector => ({
    id: connector.id,
    name: connector.name,
    icon: getConnectorIcon(connector.id),
    ready: typeof window !== 'undefined' && connector.id === 'metaMask'
      ? !!(window as any).ethereum?.isMetaMask
      : false,
    installed: typeof window !== 'undefined' && connector.id === 'metaMask'
      ? !!(window as any).ethereum?.isMetaMask
      : false,
  }))

  return {
    // Connection state
    isConnected,
    isConnecting,
    address,
    ensName,
    displayName,
    chain,
    isOnCorrectNetwork,

    // Balance
    balance: formattedBalance,
    balanceSymbol: balance?.symbol || 'ETH',

    // Actions
    connectWallet,
    disconnectWallet,
    switchToMainnet,

    // UI helpers
    walletOptions,

    // Loading states
    isSwitching,

    // Errors
    connectError: connectError?.message,
    switchError: switchError?.message,
  }
}

// Helper function to get connector icons
function getConnectorIcon(connectorId: string): string {
  return connectorId === 'metaMask' ? '🦊' : '💳'
}