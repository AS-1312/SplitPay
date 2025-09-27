import { useCallback, useMemo } from 'react'
import { useAccount, useBalance, useEnsName, useEnsAddress, useDisconnect, useConnect, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'
import { sepolia } from './wallet-config'
import { normalizeEnsName, validateEnsNameFormat } from './utils'

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

  // Check if on correct network (Sepolia for ENS validation)
  const isOnCorrectNetwork = useMemo(() => {
    return chain?.id === sepolia.id
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

  // Switch to Sepolia
  const switchToSepolia = useCallback(() => {
    if (chain?.id !== sepolia.id) {
      switchChain({ chainId: sepolia.id })
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

  // Check if user has ENS name (required for group creation)
  const hasEnsName = useMemo(() => {
    return !!ensName && ensName.trim() !== '';
  }, [ensName]);

  // Check if user can create groups (has ENS and on correct network)
  const canCreateGroups = useMemo(() => {
    return isConnected && hasEnsName && isOnCorrectNetwork;
  }, [isConnected, hasEnsName, isOnCorrectNetwork]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    address,
    ensName,
    displayName,
    chain,
    isOnCorrectNetwork,
    hasEnsName,
    canCreateGroups,

    // Balance
    balance: formattedBalance,
    balanceSymbol: balance?.symbol || 'ETH',

    // Actions
    connectWallet,
    disconnectWallet,
    switchToSepolia,

    // UI helpers
    walletOptions,

    // Loading states
    isSwitching,

    // Errors
    connectError: connectError?.message,
    switchError: switchError?.message,
  }
}

// Hook for validating ENS names on Sepolia
export function useEnsValidation(ensName: string) {
  const formatValidation = useMemo(() => {
    if (!ensName || ensName.trim() === '') {
      return { isValid: true, error: undefined }; // Empty is OK for optional validation
    }
    return validateEnsNameFormat(ensName);
  }, [ensName]);

  const { data: resolvedAddress, isLoading, error } = useEnsAddress({
    name: formatValidation.isValid && ensName ? normalizeEnsName(ensName) : undefined,
    chainId: sepolia.id,
    query: {
      enabled: formatValidation.isValid && !!ensName && ensName.trim() !== '',
    },
  });

  const isValidEns = useMemo(() => {
    return formatValidation.isValid && !!resolvedAddress && !error;
  }, [formatValidation.isValid, resolvedAddress, error]);

  return {
    isValid: isValidEns,
    isLoading,
    error: formatValidation.error || (error ? 'ENS name not found on Sepolia testnet' : undefined),
    resolvedAddress,
    formatError: formatValidation.error,
  };
}

// Helper function to get connector icons
function getConnectorIcon(connectorId: string): string {
  return connectorId === 'metaMask' ? '🦊' : '💳'
}