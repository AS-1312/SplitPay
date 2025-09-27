import type { Group, Member, Expense } from './types';

const API_BASE_URL = '/api';

// Groups API
export const groupsApi = {
  // Get all groups
  getAll: async (): Promise<Group[]> => {
    const response = await fetch(`${API_BASE_URL}/groups`);
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    const data = await response.json();
    return data.groups;
  },

  // Get specific group
  getById: async (id: string): Promise<Group> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch group');
    }
    const data = await response.json();
    return data.group;
  },

  // Create new group
  create: async (group: Group): Promise<Group> => {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(group),
    });
    if (!response.ok) {
      throw new Error('Failed to create group');
    }
    const data = await response.json();
    return data.group;
  },

  // Update group
  update: async (id: string, updates: Partial<Group>): Promise<Group> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update group');
    }
    const data = await response.json();
    return data.group;
  },

  // Delete group
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete group');
    }
  },
};

// Expenses API
export const expensesApi = {
  // Get all expenses for a group
  getByGroupId: async (groupId: string): Promise<Expense[]> => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    const data = await response.json();
    return data.expenses;
  },

  // Add expense to group
  create: async (groupId: string, expense: Expense): Promise<{ expense: Expense; group: Group }> => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expense),
    });
    if (!response.ok) {
      throw new Error('Failed to create expense');
    }
    const data = await response.json();
    return data;
  },

  // Update expense
  update: async (groupId: string, expenseId: string, updates: Partial<Expense>): Promise<{ expense: Expense; group: Group }> => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    const data = await response.json();
    return data;
  },

  // Delete expense
  delete: async (groupId: string, expenseId: string): Promise<Group> => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
    const data = await response.json();
    return data.group;
  },
};

// Balance calculation utilities (moved from store)
export const calculateGroupBalances = (group: Group): { [memberId: string]: number } => {
  const balances: { [memberId: string]: number } = {};

  // Initialize balances
  group.members.forEach((member) => {
    balances[member.id] = 0;
  });

  // Calculate balances from expenses
  group.expenses.forEach((expense) => {
    const splitAmount = expense.amount / expense.splitBetween.length;

    // Person who paid gets credited
    balances[expense.paidBy] += expense.amount;

    // Everyone who owes gets debited
    expense.splitBetween.forEach((memberId) => {
      balances[memberId] -= splitAmount;
    });
  });

  return balances;
};

// Debt simplification utility
export const getSimplifiedDebts = (group: Group) => {
  const balances = calculateGroupBalances(group);

  // Convert balances to creditors and debtors
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([memberId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: memberId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: memberId, amount: -balance });
    }
  });

  // Simplify debts using greedy algorithm
  const debts: Array<{from: string; to: string; amount: number}> = [];

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const creditorMember = group.members.find((m) => m.id === creditor.id);
    const debtorMember = group.members.find((m) => m.id === debtor.id);

    if (!creditorMember || !debtorMember) continue;

    const amount = Math.min(creditor.amount, debtor.amount);

    debts.push({
      from: debtorMember.ensName,
      to: creditorMember.ensName,
      amount: Math.round(amount * 100) / 100,
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return debts;
};