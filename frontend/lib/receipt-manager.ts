import { hederaReceiptService } from './hedera-receipt-service';
import type { 
  StoredReceipt, 
  ReceiptQuery, 
  ReceiptStorageResult,
  TransactionStatus,
  TransactionProgress 
} from './receipt-types';

/**
 * High-level utility service for receipt management
 * Provides convenient methods for common receipt operations
 */
export class ReceiptManager {
  private static instance: ReceiptManager;
  
  private constructor() {}
  
  public static getInstance(): ReceiptManager {
    if (!ReceiptManager.instance) {
      ReceiptManager.instance = new ReceiptManager();
    }
    return ReceiptManager.instance;
  }

  /**
   * Store receipt with automatic retry and enhanced error handling
   */
  async storeSettlementReceipt(
    groupId: string,
    ethTxHash: string,
    totalAmountUsd: number,
    originalDebtsCount: number,
    simplifiedDebtsCount: number,
    onProgress?: (progress: TransactionProgress) => void
  ): Promise<{ success: boolean; receiptId?: string; error?: string }> {
    try {
      // Convert USD to PYUSD wei (6 decimals)
      const totalAmountWei = BigInt(Math.floor(totalAmountUsd * 1_000_000));
      
      const receiptData = {
        groupId,
        ethTxHash,
        totalAmount: totalAmountWei,
        originalDebts: BigInt(originalDebtsCount),
        simplifiedDebts: BigInt(simplifiedDebtsCount),
      };

      const debtCalculationData = {
        originalDebts: Array(originalDebtsCount).fill(null).map((_, i) => ({
          debtor: `user_${i}`,
          creditor: `creditor_${i}`,
          amount: totalAmountUsd / originalDebtsCount,
        })),
        simplifiedDebts: Array(simplifiedDebtsCount).fill(null).map((_, i) => ({
          debtor: `user_${i}`,
          creditor: `creditor_${i}`,
          amount: totalAmountUsd / simplifiedDebtsCount,
        })),
        totalAmount: totalAmountUsd,
      };

      // Setup progress monitoring if callback provided
      if (onProgress) {
        const progressId = this.generateProgressId(groupId, ethTxHash);
        const unsubscribe = hederaReceiptService.instance.onTransactionProgress(progressId, onProgress);
        
        try {
          const result = await hederaReceiptService.storeReceipt(receiptData, debtCalculationData);
          unsubscribe();
          return result;
        } catch (error) {
          unsubscribe();
          throw error;
        }
      } else {
        return await hederaReceiptService.instance.storeReceipt(receiptData, debtCalculationData);
      }
    } catch (error) {
      console.error('ReceiptManager: Failed to store receipt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get receipts for a user with enhanced error handling
   */
  async getUserReceipts(userAddress: string): Promise<StoredReceipt[]> {
    try {
      if (!this.isValidAddress(userAddress)) {
        console.warn('ReceiptManager: Invalid user address provided:', userAddress);
        return [];
      }

      const receipts = await hederaReceiptService.instance.getUserReceipts(userAddress);
      console.log(`ReceiptManager: Retrieved ${receipts.length} receipts for user ${userAddress}`);
      return receipts;
    } catch (error) {
      console.error('ReceiptManager: Failed to get user receipts:', error);
      return [];
    }
  }

  /**
   * Get a specific receipt with validation
   */
  async getReceipt(receiptId: string): Promise<StoredReceipt | null> {
    try {
      if (!receiptId || receiptId.trim() === '') {
        console.warn('ReceiptManager: Empty receipt ID provided');
        return null;
      }

      const receipt = await hederaReceiptService.instance.getReceipt(receiptId);
      
      if (receipt) {
        console.log('ReceiptManager: Retrieved receipt:', receiptId);
      } else {
        console.warn('ReceiptManager: Receipt not found:', receiptId);
      }
      
      return receipt;
    } catch (error) {
      console.error('ReceiptManager: Failed to get receipt:', error);
      return null;
    }
  }

  /**
   * Calculate savings metrics from receipt
   */
  calculateSavings(receipt: StoredReceipt): {
    originalCount: number;
    simplifiedCount: number;
    savingsPercentage: number;
    transactionsSaved: number;
  } {
    const originalCount = Number(receipt.originalDebts);
    const simplifiedCount = Number(receipt.simplifiedDebts);
    const transactionsSaved = Math.max(0, originalCount - simplifiedCount);
    const savingsPercentage = hederaReceiptService.instance.calculateSavingsPercentage(
      originalCount, 
      simplifiedCount
    );

    return {
      originalCount,
      simplifiedCount,
      savingsPercentage,
      transactionsSaved,
    };
  }

  /**
   * Format receipt for display
   */
  formatReceiptForDisplay(receipt: StoredReceipt): {
    receiptId: string;
    groupId: string;
    ethTxHash: string;
    totalAmount: string;
    totalAmountUsd: string;
    settledBy: string;
    timestamp: Date;
    savings: ReturnType<ReceiptManager['calculateSavings']>;
    hederaExplorerUrl?: string;
    ethExplorerUrl?: string;
  } {
    const savings = this.calculateSavings(receipt);
    
    // Convert wei to PYUSD (6 decimals)
    const totalAmountPyusd = Number(receipt.totalAmount) / 1_000_000;
    
    return {
      receiptId: receipt.receiptId,
      groupId: receipt.groupId,
      ethTxHash: receipt.ethTxHash,
      totalAmount: `${totalAmountPyusd.toFixed(6)} PYUSD`,
      totalAmountUsd: `$${totalAmountPyusd.toFixed(2)}`,
      settledBy: receipt.settledBy,
      timestamp: new Date(Number(receipt.timestamp) * 1000),
      savings,
      ethExplorerUrl: this.getEthExplorerUrl(receipt.ethTxHash),
    };
  }

  /**
   * Verify receipt integrity
   */
  async verifyReceipt(receiptId: string): Promise<{
    valid: boolean;
    exists: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      const receipt = await this.getReceipt(receiptId);
      
      if (!receipt) {
        return {
          valid: false,
          exists: false,
          errors: ['Receipt not found'],
        };
      }

      // Validate receipt data
      if (!receipt.groupId || receipt.groupId.trim() === '') {
        errors.push('Invalid group ID');
      }

      if (!receipt.ethTxHash || !receipt.ethTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        errors.push('Invalid Ethereum transaction hash');
      }

      if (receipt.totalAmount <= BigInt(0)) {
        errors.push('Invalid total amount');
      }

      if (receipt.originalDebts < BigInt(0) || receipt.simplifiedDebts < BigInt(0)) {
        errors.push('Invalid debt counts');
      }

      if (receipt.simplifiedDebts > receipt.originalDebts) {
        errors.push('Simplified debts cannot exceed original debts');
      }

      if (!this.isValidAddress(receipt.settledBy)) {
        errors.push('Invalid settler address');
      }

      const timestampMs = Number(receipt.timestamp) * 1000;
      const now = Date.now();
      if (timestampMs > now || timestampMs < now - (365 * 24 * 60 * 60 * 1000)) {
        errors.push('Invalid timestamp');
      }

      return {
        valid: errors.length === 0,
        exists: true,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        exists: false,
        errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Get receipt statistics for a user
   */
  async getUserStats(userAddress: string): Promise<{
    totalReceipts: number;
    totalAmountSettled: bigint;
    totalTransactionsSaved: number;
    averageSavingsPercentage: number;
    latestSettlement?: Date;
  }> {
    try {
      const receipts = await this.getUserReceipts(userAddress);
      
      if (receipts.length === 0) {
        return {
          totalReceipts: 0,
          totalAmountSettled: BigInt(0),
          totalTransactionsSaved: 0,
          averageSavingsPercentage: 0,
        };
      }

      const totalAmountSettled = receipts.reduce(
        (sum, receipt) => sum + receipt.totalAmount, 
        BigInt(0)
      );

      const totalTransactionsSaved = receipts.reduce((sum, receipt) => {
        const savings = this.calculateSavings(receipt);
        return sum + savings.transactionsSaved;
      }, 0);

      const averageSavingsPercentage = receipts.reduce((sum, receipt) => {
        const savings = this.calculateSavings(receipt);
        return sum + savings.savingsPercentage;
      }, 0) / receipts.length;

      const latestSettlement = receipts.length > 0 
        ? new Date(Math.max(...receipts.map(r => Number(r.timestamp) * 1000)))
        : undefined;

      return {
        totalReceipts: receipts.length,
        totalAmountSettled,
        totalTransactionsSaved,
        averageSavingsPercentage: Math.round(averageSavingsPercentage),
        latestSettlement,
      };
    } catch (error) {
      console.error('ReceiptManager: Failed to get user stats:', error);
      return {
        totalReceipts: 0,
        totalAmountSettled: BigInt(0),
        totalTransactionsSaved: 0,
        averageSavingsPercentage: 0,
      };
    }
  }

  /**
   * Private helper methods
   */
  private generateProgressId(groupId: string, ethTxHash: string): string {
    return `${groupId}-${ethTxHash}`;
  }

  private isValidAddress(address: string): boolean {
    return Boolean(address && /^0x[a-fA-F0-9]{40}$/.test(address));
  }

  private getEthExplorerUrl(txHash: string): string {
    // Assuming Sepolia testnet - adjust based on your network
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    hederaReceiptService.dispose();
  }
}

// Export singleton instance
export const receiptManager = ReceiptManager.getInstance();

// Export commonly used functions for convenience
export const {
  storeSettlementReceipt,
  getUserReceipts,
  getReceipt,
  calculateSavings,
  formatReceiptForDisplay,
  verifyReceipt,
  getUserStats,
} = receiptManager;