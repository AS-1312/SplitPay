# Hedera Receipt Service Documentation

## Overview

The Hedera Receipt Service provides functionality to store settlement receipt data on Hedera testnet after successful PYUSD settlements. This creates an immutable record of debt simplification and settlement transactions.

## Architecture

The service consists of several components:

1. **hedera-config.ts** - Hedera client configuration and environment setup
2. **receipt-types.ts** - TypeScript interfaces and types
3. **hedera-receipt-service.ts** - Core service for contract interactions
4. **receipt-manager.ts** - High-level utility functions
5. **receipt-display.tsx** - React components for displaying receipts

## Environment Variables

Add these to your `.env.local` file:

```bash
HEDERA_ACCOUNT_ID=0.0.6916599
HEDERA_PRIVATE_KEY=0x12396e89c34e65ef6383aa286bf9df5e397bba55d40b3472c4f1e89339aea45a
```

## Contract Details

- **Network**: Hedera Testnet
- **Contract Address**: `0x6b82008c86dd0f3e02ae731a4d9531a29bed1ab9`
- **ABI**: Available in `lib/abis.ts` as `SplitPayReceiptsABI`

## Usage

### Basic Receipt Storage

```typescript
import { hederaReceiptService } from '@/lib/hedera-receipt-service'

// Store a receipt after settlement
const result = await hederaReceiptService.storeReceipt(
  {
    groupId: "group_123",
    ethTxHash: "0x...",
    totalAmount: BigInt(1000000), // 1 PYUSD in wei (6 decimals)
    originalDebts: BigInt(5),
    simplifiedDebts: BigInt(2)
  },
  {
    originalDebts: [...], // Array of original debt relationships
    simplifiedDebts: [...], // Array of simplified debt relationships  
    totalAmount: 1.0 // Total in USD
  }
)

if (result.success) {
  console.log('Receipt stored with ID:', result.receiptId)
}
```

### Using the Receipt Manager (Recommended)

```typescript
import { receiptManager } from '@/lib/receipt-manager'

// Store receipt with enhanced error handling
const result = await receiptManager.storeSettlementReceipt(
  "group_123",
  "0x...", // Ethereum transaction hash
  1.0, // Total amount in USD
  5, // Original debts count
  2, // Simplified debts count
  (progress) => {
    console.log('Progress:', progress.status)
  }
)
```

### Retrieving Receipts

```typescript
// Get all receipts for a user
const userReceipts = await receiptManager.getUserReceipts("0x...")

// Get a specific receipt
const receipt = await receiptManager.getReceipt("receipt_id")

// Get user statistics
const stats = await receiptManager.getUserStats("0x...")
```

### React Components

```tsx
import { UserReceipts, ReceiptCard } from '@/components/receipt-display'

// Display all receipts for a user
<UserReceipts userAddress="0x..." />

// Display a specific receipt
<ReceiptCard receiptId="receipt_id" />
```

## Integration in Settlement Flow

The service is automatically integrated in the settlement modal (`settlement-modal.tsx`):

1. User completes PYUSD settlement on Ethereum
2. Transaction is confirmed on blockchain
3. Settlement is recorded in database
4. Receipt is stored on Hedera testnet with metadata:
   - Group ID
   - Ethereum transaction hash
   - Total settlement amount
   - Original debt count vs simplified debt count
   - Settled by address
   - Timestamp

## Receipt Data Structure

Each receipt contains:

```typescript
interface StoredReceipt {
  receiptId: string      // Unique identifier (bytes32 hash)
  groupId: string        // Group ID from settlement
  ethTxHash: string      // Ethereum transaction hash
  totalAmount: bigint    // Total amount in PYUSD wei (6 decimals)
  originalDebts: bigint  // Number of original debt relationships
  simplifiedDebts: bigint // Number of simplified debt relationships
  settledBy: string      // Address that performed settlement
  timestamp: bigint      // Unix timestamp
}
```

## Error Handling

The service includes comprehensive error handling:

- **Retry Logic**: Up to 3 attempts for failed transactions
- **Validation**: Input data validation before contract calls
- **Graceful Degradation**: Settlement succeeds even if receipt storage fails
- **Progress Monitoring**: Real-time transaction status updates

## Gas and Fees

- **Gas Limit**: 300,000 per transaction
- **Max Fee**: 10 HBAR per transaction
- **Network**: Hedera testnet (free for development)

## Monitoring and Verification

```typescript
// Verify receipt integrity
const verification = await receiptManager.verifyReceipt("receipt_id")
console.log('Valid:', verification.valid)
console.log('Errors:', verification.errors)

// Calculate savings from debt simplification  
const savings = receiptManager.calculateSavings(receipt)
console.log('Transactions saved:', savings.transactionsSaved)
console.log('Savings percentage:', savings.savingsPercentage)
```

## Development vs Production

For development:
- Uses Hedera testnet
- Free transactions
- Debug logging enabled

For production:
- Switch to Hedera mainnet
- Update contract addresses
- Configure proper gas fees
- Disable debug logging

## Security Considerations

1. **Private Key Management**: Store private keys securely in environment variables
2. **Hot Wallet**: Use dedicated wallet for receipt storage only
3. **Rate Limiting**: Implement rate limiting for contract calls
4. **Input Validation**: Always validate input data before blockchain calls
5. **Error Logging**: Log errors for monitoring but don't expose sensitive data

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY are set

2. **"Transaction failed with status: INSUFFICIENT_ACCOUNT_BALANCE"**
   - Fund the Hedera account with HBAR for transaction fees

3. **"Contract revert"**
   - Check if receipt ID already exists (duplicate prevention)
   - Verify contract address and ABI

4. **"Timeout"**
   - Increase timeout configuration
   - Check network connectivity

### Debug Mode

Enable debug logging:

```typescript
const service = new HederaReceiptService({ debug: true })
```

## Future Enhancements

Potential improvements:

1. **Batch Processing**: Store multiple receipts in single transaction
2. **Event Listening**: Real-time event monitoring from contract
3. **IPFS Integration**: Store detailed receipt data on IPFS
4. **Analytics Dashboard**: Advanced receipt analytics and reporting
5. **Cross-chain Support**: Extend to other networks beyond Ethereum

## Support

For issues or questions:
1. Check the error logs for detailed error messages
2. Verify environment configuration
3. Test on Hedera testnet before mainnet deployment
4. Monitor transaction status on Hedera explorer