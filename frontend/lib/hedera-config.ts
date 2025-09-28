import { Client, PrivateKey, AccountId, Hbar } from '@hashgraph/sdk';

// Hedera testnet configuration
export const HEDERA_NETWORK = 'testnet';
export const HEDERA_MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
export const HEDERA_RECEIPT_CONTRACT_ADDRESS = '0x6b82008c86dd0f3e02ae731a4d9531a29bed1ab9';

// Environment variables validation - only validate when creating client
let envValidated = false;

function validateEnvVars() {
  if (envValidated) return;
  
  const requiredEnvVars = {
    HEDERA_ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID,
    HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
  };
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  envValidated = true;
}

// Export parsed values - these will be null until validateEnvVars is called
export let HEDERA_ACCOUNT_ID: AccountId | null = null;
export let HEDERA_PRIVATE_KEY: PrivateKey | null = null;

/**
 * Create and configure Hedera client for testnet
 */
export function createHederaClient(): Client {
  try {
    validateEnvVars();
    
    // Initialize the parsed values if not already done
    if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
      HEDERA_ACCOUNT_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
      HEDERA_PRIVATE_KEY = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);
    }
    
    const client = Client.forTestnet();
    
    // Set operator (the account that will pay for transactions)
    client.setOperator(HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY);
    
    // Set default transaction fee and query payment
    client.setDefaultMaxTransactionFee(new Hbar(10)); // 10 HBAR max fee
    client.setDefaultMaxQueryPayment(new Hbar(1)); // 1 HBAR max query payment
    
    return client;
  } catch (error) {
    console.error('Failed to create Hedera client:', error);
    throw new Error(`Hedera client initialization failed: ${error}`);
  }
}

/**
 * Get the operator's Hedera account ID
 */
export function getOperatorAccountId(): AccountId {
  validateEnvVars();
  if (!HEDERA_ACCOUNT_ID) {
    HEDERA_ACCOUNT_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  }
  return HEDERA_ACCOUNT_ID;
}

/**
 * Get the operator's private key
 */
export function getOperatorPrivateKey(): PrivateKey {
  validateEnvVars();
  if (!HEDERA_PRIVATE_KEY) {
    HEDERA_PRIVATE_KEY = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);
  }
  return HEDERA_PRIVATE_KEY;
}

/**
 * Convert Ethereum address format to Hedera contract ID
 * @param address - Ethereum-style address (0x...)
 * @returns Hedera contract ID string
 */
export function addressToContractId(address: string): string {
  // Remove 0x prefix and convert to uppercase
  const cleanAddress = address.replace('0x', '').toLowerCase();
  
  // For Hedera testnet, contracts are typically in format 0.0.xxxxxx
  // This is a simplified conversion - in production, you'd maintain a mapping
  // For now, we'll use the address as-is since Hedera supports EVM addresses
  return cleanAddress;
}

/**
 * Configuration for gas limits and transaction settings
 */
export const TRANSACTION_CONFIG = {
  // Gas limit for contract calls
  GAS_LIMIT: 300_000,
  
  // Maximum retry attempts for failed transactions
  MAX_RETRIES: 3,
  
  // Delay between retries (in milliseconds)
  RETRY_DELAY: 2000,
  
  // Transaction timeout (in milliseconds)
  TIMEOUT: 30_000,
} as const;

/**
 * Network-specific contract addresses
 */
export const CONTRACT_ADDRESSES = {
  RECEIPT_STORAGE: HEDERA_RECEIPT_CONTRACT_ADDRESS,
} as const;