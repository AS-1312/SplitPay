import { Address } from 'viem'

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet (Chain ID: 11155111)  
  11155111: {
    splitPay: '0xac40e4674343Ea7BB00A18E3E94849CFa07dB167' as Address, // Replace with your deployed address
    pyusd: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as Address, // Replace with testnet PYUSD address
  },
} as const

// Helper function to get contract addresses for current chain
export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  
  if (!addresses) {
    throw new Error(`Contract addresses not configured for chain ID: ${chainId}`)
  }
  
  return addresses
}

// Individual address getters
export function getSplitPayAddress(chainId: number): Address {
  return getContractAddresses(chainId).splitPay
}

export function getPyusdAddress(chainId: number): Address {
  return getContractAddresses(chainId).pyusd
}

// Contract deployment info (useful for debugging)
export const CONTRACT_INFO = {
  splitPay: {
    name: 'SplitPay',
    description: 'Smart contract for managing group expenses and settlements',
    version: '1.0.0',
  },
  pyusd: {
    name: 'PayPal USD',
    description: 'PYUSD stablecoin token contract',
    symbol: 'PYUSD',
    decimals: 6, // PYUSD uses 6 decimals
  },
} as const