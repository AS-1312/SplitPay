/**
 * Receipt data interface matching the SplitPayReceipts contract structure
 */
export interface ReceiptData {
  /** Group ID from the settlement */
  groupId: string;
  /** Ethereum transaction hash from the settlement */
  ethTxHash: string;
  /** Total amount settled (in PYUSD wei) */
  totalAmount: bigint;
  /** Number of original debt relationships */
  originalDebts: bigint;
  /** Number of simplified debt relationships after optimization */
  simplifiedDebts: bigint;
}

/**
 * Complete receipt information as stored in the contract
 */
export interface StoredReceipt {
  /** Unique receipt ID (bytes32 hash) */
  receiptId: string;
  /** Group ID */
  groupId: string;
  /** Ethereum transaction hash */
  ethTxHash: string;
  /** Total amount settled */
  totalAmount: bigint;
  /** Original number of debts */
  originalDebts: bigint;
  /** Simplified number of debts */
  simplifiedDebts: bigint;
  /** Address that settled the group */
  settledBy: string;
  /** Timestamp when receipt was stored */
  timestamp: bigint;
}

/**
 * Receipt transaction result from Hedera
 */
export interface ReceiptStorageResult {
  /** Success status */
  success: boolean;
  /** Generated receipt ID if successful */
  receiptId?: string;
  /** Hedera transaction ID */
  transactionId?: string;
  /** Error message if failed */
  error?: string;
  /** Gas used for the transaction */
  gasUsed?: number;
}

/**
 * Input data for calculating receipt metrics
 */
export interface DebtCalculationData {
  /** List of individual debt relationships before simplification */
  originalDebts: Array<{
    debtor: string;
    creditor: string;
    amount: number;
  }>;
  /** List of optimized debt relationships after simplification */
  simplifiedDebts: Array<{
    debtor: string;
    creditor: string;
    amount: number;
  }>;
  /** Total amount being settled */
  totalAmount: number;
}

/**
 * Service configuration options
 */
export interface ReceiptServiceConfig {
  /** Contract address on Hedera testnet */
  contractAddress: string;
  /** Maximum retry attempts for failed transactions */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Transaction timeout (ms) */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Transaction status for monitoring
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * Transaction monitoring data
 */
export interface TransactionProgress {
  status: TransactionStatus;
  transactionId?: string;
  receiptId?: string;
  attempts: number;
  lastError?: string;
  startTime: number;
}

/**
 * Event listener callback types
 */
export type ReceiptStoredEventCallback = (receipt: StoredReceipt) => void;
export type TransactionProgressCallback = (progress: TransactionProgress) => void;

/**
 * Receipt query filters
 */
export interface ReceiptQuery {
  /** Filter by user address */
  userAddress?: string;
  /** Filter by group ID */
  groupId?: string;
  /** Filter by date range */
  dateRange?: {
    from: Date;
    to: Date;
  };
  /** Pagination */
  limit?: number;
  offset?: number;
}

/**
 * Utility functions for receipt data processing
 */
export interface ReceiptUtils {
  /** Calculate savings percentage from debt simplification */
  calculateSavingsPercentage(originalCount: number, simplifiedCount: number): number;
  
  /** Generate receipt ID from input data */
  generateReceiptId(groupId: string, ethTxHash: string, settledBy: string): string;
  
  /** Format amounts for display */
  formatAmount(amount: bigint, decimals?: number): string;
  
  /** Validate receipt data before storage */
  validateReceiptData(data: ReceiptData): { valid: boolean; errors: string[] };
}