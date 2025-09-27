export interface Member {
  id: string;
  name: string;
  ensName: string;
  walletAddress: string;
  avatar?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // member id
  splitBetween: string[]; // member ids
  category: "food" | "transport" | "accommodation" | "entertainment" | "other";
  date: Date;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  createdAt: Date;
}

export interface Debt {
  from: string; // ENS name
  to: string; // ENS name
  amount: number;
}

export interface Balance {
  memberId: string;
  balance: number; // positive = owed to them, negative = they owe
}
