import {
  Client,
  ContractExecuteTransaction,
  ContractCallQuery,
  TransactionId,
  TransactionReceipt,
  ContractFunctionParameters,
  ContractId,
  Hbar,
} from '@hashgraph/sdk';
import { AbiCoder, keccak256, toUtf8Bytes } from 'ethers';
import { createHederaClient, TRANSACTION_CONFIG, CONTRACT_ADDRESSES } from './hedera-config';
import { SplitPayReceiptsABI } from './abis';
import {
  ReceiptData,
  StoredReceipt,
  ReceiptStorageResult,
  DebtCalculationData,
  ReceiptServiceConfig,
  TransactionStatus,
  TransactionProgress,
  ReceiptQuery,
  ReceiptStoredEventCallback,
  TransactionProgressCallback,
} from './receipt-types';

/**
 * Service for storing and retrieving settlement receipts on Hedera testnet
 */
export class HederaReceiptService {
  private client: Client;
  private contractId: ContractId;
  private config: Required<ReceiptServiceConfig>;
  private eventListeners: Map<string, ReceiptStoredEventCallback[]> = new Map();
  private progressListeners: Map<string, TransactionProgressCallback[]> = new Map();

  constructor(config?: Partial<ReceiptServiceConfig>) {
    this.config = {
      contractAddress: CONTRACT_ADDRESSES.RECEIPT_STORAGE,
      maxRetries: TRANSACTION_CONFIG.MAX_RETRIES,
      retryDelay: TRANSACTION_CONFIG.RETRY_DELAY,
      timeout: TRANSACTION_CONFIG.TIMEOUT,
      debug: false,
      ...config,
    };

    this.client = createHederaClient();
    this.contractId = ContractId.fromEvmAddress(0, 0, this.config.contractAddress);
    
    if (this.config.debug) {
      console.log('HederaReceiptService initialized with config:', this.config);
    }
  }

  /**
   * Store receipt data after successful settlement
   */
  async storeReceipt(
    receiptData: ReceiptData,
    debtData: DebtCalculationData
  ): Promise<ReceiptStorageResult> {
    const progressId = this.generateProgressId(receiptData.groupId, receiptData.ethTxHash);
    
    try {
      this.notifyProgress(progressId, {
        status: TransactionStatus.PENDING,
        attempts: 0,
        startTime: Date.now(),
      });

      // Validate input data
      const validation = this.validateReceiptData(receiptData);
      if (!validation.valid) {
        throw new Error(`Invalid receipt data: ${validation.errors.join(', ')}`);
      }

      // Calculate debt metrics
      const originalDebtsCount = BigInt(debtData.originalDebts.length);
      const simplifiedDebtsCount = BigInt(debtData.simplifiedDebts.length);

      if (this.config.debug) {
        console.log('Storing receipt:', {
          groupId: receiptData.groupId,
          ethTxHash: receiptData.ethTxHash,
          totalAmount: receiptData.totalAmount.toString(),
          originalDebts: originalDebtsCount.toString(),
          simplifiedDebts: simplifiedDebtsCount.toString(),
        });
      }

      // Prepare contract function parameters
      const functionParameters = new ContractFunctionParameters()
        .addString(receiptData.groupId)
        .addString(receiptData.ethTxHash)
        .addUint256(Number(receiptData.totalAmount))
        .addUint256(Number(originalDebtsCount))
        .addUint256(Number(simplifiedDebtsCount));

      let lastError: string | undefined;
      
      // Retry logic
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          this.notifyProgress(progressId, {
            status: TransactionStatus.PENDING,
            attempts: attempt,
            startTime: Date.now(),
          });

          // Create and execute transaction
          const transaction = new ContractExecuteTransaction()
            .setContractId(this.contractId)
            .setFunction('storeReceipt', functionParameters)
            .setGas(TRANSACTION_CONFIG.GAS_LIMIT)
            .setMaxTransactionFee(new Hbar(10))
            .setTransactionId(TransactionId.generate(this.client.operatorAccountId!));

          const response = await transaction.execute(this.client);
          const receipt = await response.getReceipt(this.client);

          if (receipt.status.toString() === 'SUCCESS') {
            // Get the receipt ID from transaction logs/events
            const receiptId = await this.extractReceiptIdFromTransaction(response.transactionId);
            
            const result: ReceiptStorageResult = {
              success: true,
              receiptId,
              transactionId: response.transactionId.toString(),
              gasUsed: TRANSACTION_CONFIG.GAS_LIMIT, // Approximation
            };

            this.notifyProgress(progressId, {
              status: TransactionStatus.SUCCESS,
              transactionId: response.transactionId.toString(),
              receiptId,
              attempts: attempt,
              startTime: Date.now(),
            });

            if (this.config.debug) {
              console.log('Receipt stored successfully:', result);
            }

            return result;
          } else {
            throw new Error(`Transaction failed with status: ${receipt.status}`);
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          
          if (this.config.debug) {
            console.warn(`Attempt ${attempt} failed:`, lastError);
          }

          if (attempt < this.config.maxRetries) {
            await this.delay(this.config.retryDelay);
          }
        }
      }

      // All retries failed
      this.notifyProgress(progressId, {
        status: TransactionStatus.FAILED,
        attempts: this.config.maxRetries,
        startTime: Date.now(),
        lastError,
      });

      return {
        success: false,
        error: lastError || 'Unknown error occurred',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.notifyProgress(progressId, {
        status: TransactionStatus.FAILED,
        attempts: 1,
        startTime: Date.now(),
        lastError: errorMessage,
      });

      if (this.config.debug) {
        console.error('Failed to store receipt:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Retrieve a specific receipt by ID
   */
  async getReceipt(receiptId: string): Promise<StoredReceipt | null> {
    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setFunction('getReceipt', new ContractFunctionParameters().addBytes32(this.hexToBytes32(receiptId)))
        .setGas(100_000);

      const result = await query.execute(this.client);
      
      if (result && result.getUint256(0).toNumber() > 0) { // Check if receipt exists
        return {
          receiptId,
          groupId: result.getString(0),
          ethTxHash: result.getString(1),
          totalAmount: BigInt(result.getUint256(2).toString()),
          originalDebts: BigInt(result.getUint256(3).toString()),
          simplifiedDebts: BigInt(result.getUint256(4).toString()),
          settledBy: result.getAddress(5),
          timestamp: BigInt(result.getUint256(6).toString()),
        };
      }
      
      return null;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to retrieve receipt:', error);
      }
      return null;
    }
  }

  /**
   * Get all receipts for a specific user
   */
  async getUserReceipts(userAddress: string): Promise<StoredReceipt[]> {
    try {
      const query = new ContractCallQuery()
        .setContractId(this.contractId)
        .setFunction('getUserReceipts', new ContractFunctionParameters().addAddress(userAddress))
        .setGas(200_000);

      const result = await query.execute(this.client);
      
      // For now, let's use a simple approach to get receipt IDs
      // The exact method depends on how the contract returns the array
      const receiptIds: string[] = [];
      try {
        // Try to get the first receipt ID to check if any exist
        const firstId = result.getBytes32(0);
        if (firstId && firstId.length > 0) {
          receiptIds.push(this.bytes32ToHex(firstId));
        }
      } catch {
        // No receipts found for user
      }

      // Fetch full receipt data for each ID
      const receipts: StoredReceipt[] = [];
      for (const receiptId of receiptIds) {
        const receipt = await this.getReceipt(receiptId);
        if (receipt) {
          receipts.push(receipt);
        }
      }

      return receipts;
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to retrieve user receipts:', error);
      }
      return [];
    }
  }

  /**
   * Calculate savings percentage from debt simplification
   */
  calculateSavingsPercentage(originalCount: number, simplifiedCount: number): number {
    if (originalCount === 0) return 0;
    return Math.round(((originalCount - simplifiedCount) / originalCount) * 100);
  }

  /**
   * Generate receipt ID from input data (deterministic)
   */
  generateReceiptId(groupId: string, ethTxHash: string, settledBy: string): string {
    const abiCoder = new AbiCoder();
    const data = abiCoder.encode(
      ['string', 'string', 'address'],
      [groupId, ethTxHash, settledBy]
    );
    return keccak256(data);
  }

  /**
   * Validate receipt data before storage
   */
  private validateReceiptData(data: ReceiptData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.groupId || data.groupId.trim() === '') {
      errors.push('Group ID is required');
    }

    if (!data.ethTxHash || !data.ethTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      errors.push('Valid Ethereum transaction hash is required');
    }

    if (data.totalAmount <= BigInt(0)) {
      errors.push('Total amount must be greater than zero');
    }

    if (data.originalDebts < BigInt(0) || data.simplifiedDebts < BigInt(0)) {
      errors.push('Debt counts cannot be negative');
    }

    if (data.simplifiedDebts > data.originalDebts) {
      errors.push('Simplified debts cannot exceed original debts');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract receipt ID from transaction events
   */
  private async extractReceiptIdFromTransaction(transactionId: TransactionId): Promise<string> {
    try {
      // For now, generate a deterministic ID based on transaction
      // In production, you'd parse the transaction logs for the actual event
      const txString = transactionId.toString();
      return keccak256(toUtf8Bytes(txString));
    } catch (error) {
      if (this.config.debug) {
        console.warn('Failed to extract receipt ID from transaction, generating fallback:', error);
      }
      return keccak256(toUtf8Bytes(transactionId.toString()));
    }
  }

  /**
   * Add event listener for receipt storage events
   */
  onReceiptStored(callback: ReceiptStoredEventCallback): () => void {
    const eventName = 'receiptStored';
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Add progress listener for transaction monitoring
   */
  onTransactionProgress(progressId: string, callback: TransactionProgressCallback): () => void {
    if (!this.progressListeners.has(progressId)) {
      this.progressListeners.set(progressId, []);
    }
    this.progressListeners.get(progressId)!.push(callback);

    return () => {
      const listeners = this.progressListeners.get(progressId);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(progressId: string, progress: TransactionProgress): void {
    const listeners = this.progressListeners.get(progressId);
    if (listeners) {
      listeners.forEach(callback => callback(progress));
    }
  }

  /**
   * Generate unique progress ID
   */
  private generateProgressId(groupId: string, ethTxHash: string): string {
    return `${groupId}-${ethTxHash}`;
  }

  /**
   * Utility: Convert hex string to bytes32
   */
  private hexToBytes32(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const padded = cleanHex.padStart(64, '0');
    return new Uint8Array(Buffer.from(padded, 'hex'));
  }

  /**
   * Utility: Convert bytes32 to hex string
   */
  private bytes32ToHex(bytes: Uint8Array): string {
    return '0x' + Buffer.from(bytes).toString('hex');
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.eventListeners.clear();
    this.progressListeners.clear();
    this.client.close();
  }
}

// Export singleton instance with lazy initialization
let _hederaReceiptService: HederaReceiptService | null = null;

export const hederaReceiptService = {
  get instance(): HederaReceiptService {
    if (!_hederaReceiptService) {
      _hederaReceiptService = new HederaReceiptService({
        debug: process.env.NODE_ENV === 'development',
      });
    }
    return _hederaReceiptService;
  },
  
  // Convenience methods that delegate to the instance
  storeReceipt: (receiptData: ReceiptData, debtData: DebtCalculationData) => 
    hederaReceiptService.instance.storeReceipt(receiptData, debtData),
  getReceipt: (receiptId: string) => 
    hederaReceiptService.instance.getReceipt(receiptId),
  getUserReceipts: (userAddress: string) => 
    hederaReceiptService.instance.getUserReceipts(userAddress),
  calculateSavingsPercentage: (originalCount: number, simplifiedCount: number) => 
    hederaReceiptService.instance.calculateSavingsPercentage(originalCount, simplifiedCount),
  generateReceiptId: (groupId: string, ethTxHash: string, settledBy: string) => 
    hederaReceiptService.instance.generateReceiptId(groupId, ethTxHash, settledBy),
  onReceiptStored: (callback: ReceiptStoredEventCallback) => 
    hederaReceiptService.instance.onReceiptStored(callback),
  onTransactionProgress: (progressId: string, callback: TransactionProgressCallback) => 
    hederaReceiptService.instance.onTransactionProgress(progressId, callback),
  dispose: () => {
    if (_hederaReceiptService) {
      _hederaReceiptService.dispose();
      _hederaReceiptService = null;
    }
  }
};