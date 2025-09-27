import { useReadContract, useWriteContract, useWatchContractEvent, useAccount } from 'wagmi'
import { Address } from 'viem'
import abis from './abis'
import { getContractAddresses } from './contracts'
import { useChainId } from 'wagmi'

// Hook to get contract addresses for current chain
export function useContractAddresses() {
  const chainId = useChainId()
  return getContractAddresses(chainId)
}

// ======== SPLITPAY CONTRACT HOOKS ========

// Hook for reading SplitPay contract data
export function useSplitPayContract() {
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  
  return {
    address: addresses.splitPay,
    abi: abis.SplitPay,
  }
}

// Hook to get user's reputation score
export function useReputationScore(userAddress?: Address) {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'reputationScore',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get user's reputation level
export function useReputationLevel(userAddress?: Address) {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'getReputationLevel',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get total settlements for a user
export function useTotalSettlements(userAddress?: Address) {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'totalSettlements',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get late payments count for a user
export function useLatePayments(userAddress?: Address) {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'latePayments',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to check if contract is paused
export function useIsPaused() {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'paused',
  })
}

// Hook to get PYUSD token address from contract
export function usePyusdFromContract() {
  const contract = useSplitPayContract()
  
  return useReadContract({
    ...contract,
    functionName: 'pyusd',
  })
}

// Hook for settling a group
export function useSettleGroup() {
  const contract = useSplitPayContract()
  const { writeContract, ...rest } = useWriteContract()
  
  const settleGroup = (
    groupId: `0x${string}`,
    creditors: Address[],
    amounts: bigint[],
    dueDate: bigint
  ) => {
    return writeContract({
      ...contract,
      functionName: 'settleGroup',
      args: [groupId, creditors, amounts, dueDate],
    })
  }
  
  return {
    settleGroup,
    ...rest,
  }
}

// ======== PYUSD TOKEN CONTRACT HOOKS ========

// Hook for PYUSD contract
export function usePyusdContract() {
  const chainId = useChainId()
  const addresses = getContractAddresses(chainId)
  
  return {
    address: addresses.pyusd,
    abi: abis.ERC20,
  }
}

// Hook to get PYUSD balance
export function usePyusdBalance(userAddress?: Address) {
  const contract = usePyusdContract()
  
  return useReadContract({
    ...contract,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })
}

// Hook to get PYUSD allowance
export function usePyusdAllowance(owner?: Address, spender?: Address) {
  const contract = usePyusdContract()
  
  return useReadContract({
    ...contract,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!(owner && spender),
    },
  })
}

// Hook to get PYUSD token info
export function usePyusdInfo() {
  const contract = usePyusdContract()
  
  const name = useReadContract({
    ...contract,
    functionName: 'name',
  })
  
  const symbol = useReadContract({
    ...contract,
    functionName: 'symbol',
  })
  
  const decimals = useReadContract({
    ...contract,
    functionName: 'decimals',
  })
  
  const totalSupply = useReadContract({
    ...contract,
    functionName: 'totalSupply',
  })
  
  return {
    name: name.data,
    symbol: symbol.data,
    decimals: decimals.data,
    totalSupply: totalSupply.data,
    isLoading: name.isLoading || symbol.isLoading || decimals.isLoading || totalSupply.isLoading,
    error: name.error || symbol.error || decimals.error || totalSupply.error,
  }
}

// Hook for approving PYUSD spending
export function useApprovePyusd() {
  const contract = usePyusdContract()
  const { writeContract, ...rest } = useWriteContract()
  
  const approve = (spender: Address, amount: bigint) => {
    return writeContract({
      ...contract,
      functionName: 'approve',
      args: [spender, amount],
    })
  }
  
  return {
    approve,
    ...rest,
  }
}

// Hook for transferring PYUSD
export function useTransferPyusd() {
  const contract = usePyusdContract()
  const { writeContract, ...rest } = useWriteContract()
  
  const transfer = (to: Address, amount: bigint) => {
    return writeContract({
      ...contract,
      functionName: 'transfer',
      args: [to, amount],
    })
  }
  
  return {
    transfer,
    ...rest,
  }
}

// ======== EVENT HOOKS ========

// Hook to watch for GroupSettled events
export function useWatchGroupSettled(
  onGroupSettled: (log: any) => void,
  enabled: boolean = true
) {
  const contract = useSplitPayContract()
  
  useWatchContractEvent({
    ...contract,
    eventName: 'GroupSettled',
    onLogs: onGroupSettled,
    enabled,
  })
}

// Hook to watch for ReputationUpdated events
export function useWatchReputationUpdated(
  onReputationUpdated: (log: any) => void,
  enabled: boolean = true
) {
  const contract = useSplitPayContract()
  
  useWatchContractEvent({
    ...contract,
    eventName: 'ReputationUpdated',
    onLogs: onReputationUpdated,
    enabled,
  })
}

// Hook to watch for PYUSD Transfer events
export function useWatchPyusdTransfer(
  onTransfer: (log: any) => void,
  enabled: boolean = true
) {
  const contract = usePyusdContract()
  
  useWatchContractEvent({
    ...contract,
    eventName: 'Transfer',
    onLogs: onTransfer,
    enabled,
  })
}

// ======== UTILITY HOOKS ========

// Hook to get current user's data
export function useCurrentUserData() {
  const { address } = useAccount()
  
  const reputationScore = useReputationScore(address)
  const reputationLevel = useReputationLevel(address)
  const totalSettlements = useTotalSettlements(address)
  const latePayments = useLatePayments(address)
  const pyusdBalance = usePyusdBalance(address)
  
  return {
    address,
    reputationScore: reputationScore.data,
    reputationLevel: reputationLevel.data,
    totalSettlements: totalSettlements.data,
    latePayments: latePayments.data,
    pyusdBalance: pyusdBalance.data,
    isLoading: reputationScore.isLoading || reputationLevel.isLoading || 
               totalSettlements.isLoading || latePayments.isLoading || 
               pyusdBalance.isLoading,
    error: reputationScore.error || reputationLevel.error || 
           totalSettlements.error || latePayments.error || 
           pyusdBalance.error,
  }
}