import { Address } from 'viem'
import { formatUnits, parseUnits, stringToHex, pad } from 'viem'
import { CONTRACT_INFO } from './contracts'

// ======== FORMATTING UTILITIES ========

/**
 * Format PYUSD amount from wei to human readable format
 * PYUSD uses 6 decimals
 */
export function formatPyusdAmount(amount: bigint): string {
  return formatUnits(amount, CONTRACT_INFO.pyusd.decimals)
}

/**
 * Parse PYUSD amount from human readable to wei
 * PYUSD uses 6 decimals
 */
export function parsePyusdAmount(amount: string | number): bigint {
  // Convert to string if it's a number
  const amountStr = typeof amount === 'string' ? amount : amount.toString()
  return parseUnits(amountStr, CONTRACT_INFO.pyusd.decimals)
}

/**
 * Format PYUSD amount with symbol
 */
export function formatPyusdWithSymbol(amount: bigint): string {
  return `${formatPyusdAmount(amount)} ${CONTRACT_INFO.pyusd.symbol}`
}

// ======== VALIDATION UTILITIES ========

/**
 * Check if an address is valid (not zero address)
 */
export function isValidAddress(address: Address): boolean {
  return address !== '0x0000000000000000000000000000000000000000'
}

/**
 * Validate contract addresses are configured
 */
export function validateContractAddresses(splitPayAddress: Address, pyusdAddress: Address): void {
  if (!isValidAddress(splitPayAddress)) {
    throw new Error('SplitPay contract address is not configured')
  }
  if (!isValidAddress(pyusdAddress)) {
    throw new Error('PYUSD contract address is not configured')
  }
}

/**
 * Check if arrays have equal length (for creditors/amounts validation)
 */
export function validateArraysLength<T, U>(arr1: T[], arr2: U[], name1: string, name2: string): void {
  if (arr1.length !== arr2.length) {
    throw new Error(`${name1} and ${name2} arrays must have the same length`)
  }
}

// ======== GROUP SETTLEMENT UTILITIES ========

/**
 * Calculate total amount for settlement
 */
export function calculateTotalAmount(amounts: bigint[]): bigint {
  return amounts.reduce((sum, amount) => sum + amount, BigInt(0))
}

/**
 * Create settlement data for a group
 */
export interface SettlementData {
  groupId: `0x${string}`
  creditors: Address[]
  amounts: bigint[]
  totalAmount: bigint
  dueDate: bigint
}

export function createSettlementData(
  groupId: string,
  debts: Array<{ creditor: Address; amount: string | number }>,
  dueDateTimestamp: number // Unix timestamp in seconds (will be converted to integer)
): SettlementData {
  // Convert group ID to bytes32 using viem utilities
  // This properly converts a string to a 32-byte hex value
  const groupIdBytes = pad(stringToHex(groupId), { size: 32 })
  
  // Extract creditors and amounts
  const creditors = debts.map(debt => debt.creditor)
  const amounts = debts.map(debt => parsePyusdAmount(debt.amount))
  
  // Validate inputs
  validateArraysLength(creditors, amounts, 'creditors', 'amounts')
  
  // Calculate total
  const totalAmount = calculateTotalAmount(amounts)
  
  // Convert due date to bigint (ensure it's an integer first)
  const dueDate = BigInt(Math.floor(dueDateTimestamp))
  
  return {
    groupId: groupIdBytes,
    creditors,
    amounts,
    totalAmount,
    dueDate,
  }
}

// ======== APPROVAL UTILITIES ========

/**
 * Calculate required allowance for settlement
 * Adds a small buffer to account for potential precision issues
 */
export function calculateRequiredAllowance(totalAmount: bigint, bufferPercent: number = 1): bigint {
  const buffer = (totalAmount * BigInt(bufferPercent)) / BigInt(100)
  return totalAmount + buffer
}

/**
 * Check if current allowance is sufficient
 */
export function isAllowanceSufficient(currentAllowance: bigint, requiredAmount: bigint): boolean {
  return currentAllowance >= requiredAmount
}

// ======== REPUTATION UTILITIES ========

/**
 * Parse reputation level string to get numerical score
 */
export function parseReputationLevel(level: string): number {
  const levels: Record<string, number> = {
    'Beginner': 1,
    'Reliable': 2,
    'Trusted': 3,
    'Expert': 4,
    'Master': 5,
  }
  return levels[level] || 0
}

/**
 * Get reputation color based on level
 */
export function getReputationColor(level: string): string {
  const colors: Record<string, string> = {
    'Beginner': '#ef4444', // red-500
    'Reliable': '#f97316', // orange-500
    'Trusted': '#eab308', // yellow-500
    'Expert': '#22c55e', // green-500
    'Master': '#8b5cf6', // violet-500
  }
  return colors[level] || '#6b7280' // gray-500
}

// ======== ERROR HANDLING UTILITIES ========

/**
 * Parse contract error messages
 */
export function parseContractError(error: any): string {
  if (typeof error === 'string') return error
  
  // Handle wagmi/viem errors
  if (error?.shortMessage) return error.shortMessage
  if (error?.message) return error.message
  
  // Handle specific contract errors
  if (error?.name === 'CreditorAmountMismatch') {
    return 'Creditors and amounts arrays do not match'
  }
  if (error?.name === 'EnforcedPause') {
    return 'Contract is currently paused'
  }
  if (error?.name === 'ERC20InsufficientBalance') {
    return 'Insufficient PYUSD balance'
  }
  if (error?.name === 'ERC20InsufficientAllowance') {
    return 'Insufficient PYUSD allowance'
  }
  
  return 'An unknown error occurred'
}

// ======== TRANSACTION UTILITIES ========

/**
 * Create a transaction summary for UI display
 */
export interface TransactionSummary {
  type: 'settlement' | 'approval' | 'transfer'
  amount: string
  recipient?: Address
  groupId?: string
  status: 'pending' | 'confirmed' | 'failed'
  hash?: string
}

export function createTransactionSummary(
  type: TransactionSummary['type'],
  amount: bigint,
  options: {
    recipient?: Address
    groupId?: string
    status?: TransactionSummary['status']
    hash?: string
  } = {}
): TransactionSummary {
  return {
    type,
    amount: formatPyusdAmount(amount),
    recipient: options.recipient,
    groupId: options.groupId,
    status: options.status || 'pending',
    hash: options.hash,
  }
}

// ======== DATE UTILITIES ========

/**
 * Convert JavaScript Date to blockchain timestamp (seconds)
 */
export function dateToTimestamp(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000))
}

/**
 * Convert blockchain timestamp to JavaScript Date
 */
export function timestampToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp) * 1000)
}

/**
 * Check if a due date has passed
 */
export function isOverdue(dueDate: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return now > dueDate
}

/**
 * Calculate days until due date
 */
export function daysUntilDue(dueDate: bigint): number {
  const now = Math.floor(Date.now() / 1000)
  const dueDateSeconds = Number(dueDate)
  const diffSeconds = dueDateSeconds - now
  return Math.ceil(diffSeconds / (24 * 60 * 60))
}