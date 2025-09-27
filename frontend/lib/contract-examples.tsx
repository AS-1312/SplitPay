/**
 * Example usage of SplitPay contract integration
 * 
 * This file demonstrates how to use the contract hooks and utilities
 * in your React components for common operations like:
 * - Reading user data
 * - Settling groups
 * - Managing PYUSD approvals
 * - Handling transactions
 */

import React, { useState, useEffect } from 'react';
import { Address } from 'viem';
import {
  useCurrentUserData,
  useSettleGroup,
  useApprovePyusd,
  usePyusdAllowance,
  useContractAddresses,
} from './contract-hooks';
import {
  createSettlementData,
  formatPyusdAmount,
  parsePyusdAmount,
  calculateRequiredAllowance,
  isAllowanceSufficient,
  parseContractError,
  createTransactionSummary,
  dateToTimestamp,
} from './contract-utils';
import { useAccount } from 'wagmi';

// Example: User Profile Component
export function UserProfile() {
  const userData = useCurrentUserData();
  
  if (userData.isLoading) return <div>Loading user data...</div>;
  
  if (userData.error) {
    return <div>Error: {parseContractError(userData.error)}</div>;
  }
  
  return (
    <div className="user-profile">
      <h2>Your Profile</h2>
      <p>Address: {userData.address}</p>
      <p>Reputation Level: {userData.reputationLevel}</p>
      <p>Reputation Score: {userData.reputationScore?.toString()}</p>
      <p>Total Settlements: {userData.totalSettlements?.toString()}</p>
      <p>Late Payments: {userData.latePayments?.toString()}</p>
      <p>PYUSD Balance: {userData.pyusdBalance ? formatPyusdAmount(userData.pyusdBalance) : '0'} PYUSD</p>
    </div>
  );
}

// Example: Group Settlement Component
export function GroupSettlement() {
  const { address } = useAccount();
  const addresses = useContractAddresses();
  
  // Contract interactions
  const { settleGroup, isPending: isSettling, error: settlementError } = useSettleGroup();
  const { approve, isPending: isApproving, error: approvalError } = useApprovePyusd();
  
  // Check current allowance
  const { data: currentAllowance } = usePyusdAllowance(address, addresses.splitPay);
  
  // State
  const [groupId, setGroupId] = useState('');
  const [debts, setDebts] = useState<Array<{ creditor: Address; amount: string }>>([]);
  const [dueDate, setDueDate] = useState('');
  
  // Calculate settlement data
  const settlementData = React.useMemo(() => {
    try {
      if (!groupId || debts.length === 0 || !dueDate) return null;
      
      const dueDateTimestamp = new Date(dueDate).getTime() / 1000;
      return createSettlementData(groupId, debts, dueDateTimestamp);
    } catch (error) {
      console.error('Error creating settlement data:', error);
      return null;
    }
  }, [groupId, debts, dueDate]);
  
  // Check if approval is needed
  const needsApproval = React.useMemo(() => {
    if (!settlementData || !currentAllowance) return false;
    return !isAllowanceSufficient(currentAllowance, settlementData.totalAmount);
  }, [settlementData, currentAllowance]);
  
  // Handle approval
  const handleApproval = async () => {
    if (!settlementData) return;
    
    try {
      const requiredAllowance = calculateRequiredAllowance(settlementData.totalAmount);
      await approve(addresses.splitPay, requiredAllowance);
    } catch (error) {
      console.error('Approval failed:', parseContractError(error));
    }
  };
  
  // Handle settlement
  const handleSettlement = async () => {
    if (!settlementData) return;
    
    try {
      await settleGroup(
        settlementData.groupId,
        settlementData.creditors,
        settlementData.amounts,
        settlementData.dueDate
      );
    } catch (error) {
      console.error('Settlement failed:', parseContractError(error));
    }
  };
  
  // Add debt entry
  const addDebt = () => {
    setDebts([...debts, { creditor: '0x' as Address, amount: '0' }]);
  };
  
  // Update debt
  const updateDebt = (index: number, field: 'creditor' | 'amount', value: string) => {
    const newDebts = [...debts];
    newDebts[index] = { ...newDebts[index], [field]: value };
    setDebts(newDebts);
  };
  
  return (
    <div className="group-settlement">
      <h2>Settle Group</h2>
      
      {/* Group ID Input */}
      <div>
        <label>Group ID:</label>
        <input
          type="text"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Enter group ID"
        />
      </div>
      
      {/* Due Date Input */}
      <div>
        <label>Due Date:</label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      
      {/* Debts */}
      <div>
        <h3>Debts</h3>
        {debts.map((debt, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Creditor address"
              value={debt.creditor}
              onChange={(e) => updateDebt(index, 'creditor', e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount in PYUSD"
              value={debt.amount}
              onChange={(e) => updateDebt(index, 'amount', e.target.value)}
              step="0.000001"
            />
          </div>
        ))}
        <button onClick={addDebt}>Add Debt</button>
      </div>
      
      {/* Settlement Summary */}
      {settlementData && (
        <div>
          <h3>Settlement Summary</h3>
          <p>Total Amount: {formatPyusdAmount(settlementData.totalAmount)} PYUSD</p>
          <p>Creditors: {settlementData.creditors.length}</p>
          <p>Current Allowance: {currentAllowance ? formatPyusdAmount(currentAllowance) : '0'} PYUSD</p>
          {needsApproval && <p style={{ color: 'orange' }}>⚠️ Approval needed</p>}
        </div>
      )}
      
      {/* Action Buttons */}
      <div>
        {needsApproval && (
          <button
            onClick={handleApproval}
            disabled={isApproving || !settlementData}
          >
            {isApproving ? 'Approving...' : 'Approve PYUSD'}
          </button>
        )}
        
        <button
          onClick={handleSettlement}
          disabled={isSettling || !settlementData || needsApproval}
        >
          {isSettling ? 'Settling...' : 'Settle Group'}
        </button>
      </div>
      
      {/* Error Display */}
      {(approvalError || settlementError) && (
        <div style={{ color: 'red' }}>
          Error: {parseContractError(approvalError || settlementError)}
        </div>
      )}
    </div>
  );
}

// Example: Simple Balance Checker
export function BalanceChecker({ userAddress }: { userAddress: Address }) {
  const userData = useCurrentUserData();
  
  return (
    <div>
      <h3>Balance for {userAddress}</h3>
      {userData.pyusdBalance ? (
        <p>{formatPyusdAmount(userData.pyusdBalance)} PYUSD</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

// Example: Transaction Helper Hook
export function useTransactionManager() {
  const [transactions, setTransactions] = useState<Array<any>>([]);
  
  const addTransaction = (tx: any) => {
    const summary = createTransactionSummary(
      tx.type,
      tx.amount,
      {
        recipient: tx.recipient,
        groupId: tx.groupId,
        status: 'pending',
        hash: tx.hash,
      }
    );
    setTransactions(prev => [...prev, { ...summary, id: Date.now() }]);
  };
  
  const updateTransaction = (id: number, updates: Partial<any>) => {
    setTransactions(prev =>
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  };
  
  return {
    transactions,
    addTransaction,
    updateTransaction,
  };
}

// Example: Configuration Instructions Component
export function ContractSetupInstructions() {
  const addresses = useContractAddresses();
  
  return (
    <div className="setup-instructions">
      <h2>Contract Setup Instructions</h2>
      
      <div>
        <h3>1. Update Contract Addresses</h3>
        <p>Edit <code>/lib/contracts.ts</code> to add your deployed contract addresses:</p>
        <pre>{`
// Current addresses (update these):
SplitPay: ${addresses.splitPay}
PYUSD: ${addresses.pyusd}
        `}</pre>
      </div>
      
      <div>
        <h3>2. Network Configuration</h3>
        <p>Make sure your wallet is connected to the correct network and the addresses match your deployment.</p>
      </div>
      
      <div>
        <h3>3. Usage Examples</h3>
        <ul>
          <li>Use <code>useCurrentUserData()</code> to get user profile information</li>
          <li>Use <code>useSettleGroup()</code> to settle group expenses</li>
          <li>Use <code>useApprovePyusd()</code> to approve PYUSD spending</li>
          <li>Use <code>formatPyusdAmount()</code> to display amounts correctly</li>
        </ul>
      </div>
    </div>
  );
}