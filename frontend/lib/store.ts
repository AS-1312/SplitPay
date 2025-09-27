import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Group, Member, Expense, Debt } from "./types"

interface AppState {
  // Groups
  groups: Group[]
  currentGroup: Group | null

  // Wallet
  walletAddress: string | null
  isWalletConnected: boolean

  // Actions
  addGroup: (group: Group) => void
  updateGroup: (groupId: string, updates: Partial<Group>) => void
  deleteGroup: (groupId: string) => void
  setCurrentGroup: (group: Group | null) => void

  addExpense: (groupId: string, expense: Expense) => void
  updateExpense: (groupId: string, expenseId: string, updates: Partial<Expense>) => void
  deleteExpense: (groupId: string, expenseId: string) => void

  addMember: (groupId: string, member: Member) => void
  removeMember: (groupId: string, memberId: string) => void

  connectWallet: (address: string) => void
  disconnectWallet: () => void

  // Computed
  getGroupBalances: (groupId: string) => { [memberId: string]: number }
  getSimplifiedDebts: (groupId: string) => Debt[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
      walletAddress: null,
      isWalletConnected: false,

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) => (group.id === groupId ? { ...group, ...updates } : group)),
          currentGroup: state.currentGroup?.id === groupId ? { ...state.currentGroup, ...updates } : state.currentGroup,
        })),

      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== groupId),
          currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        })),

      setCurrentGroup: (group) => set({ currentGroup: group }),

      addExpense: (groupId, expense) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, expenses: [...group.expenses, expense] } : group,
          ),
          currentGroup:
            state.currentGroup?.id === groupId
              ? { ...state.currentGroup, expenses: [...state.currentGroup.expenses, expense] }
              : state.currentGroup,
        })),

      updateExpense: (groupId, expenseId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  expenses: group.expenses.map((expense) =>
                    expense.id === expenseId ? { ...expense, ...updates } : expense,
                  ),
                }
              : group,
          ),
          currentGroup:
            state.currentGroup?.id === groupId
              ? {
                  ...state.currentGroup,
                  expenses: state.currentGroup.expenses.map((expense) =>
                    expense.id === expenseId ? { ...expense, ...updates } : expense,
                  ),
                }
              : state.currentGroup,
        })),

      deleteExpense: (groupId, expenseId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, expenses: group.expenses.filter((expense) => expense.id !== expenseId) }
              : group,
          ),
          currentGroup:
            state.currentGroup?.id === groupId
              ? {
                  ...state.currentGroup,
                  expenses: state.currentGroup.expenses.filter((expense) => expense.id !== expenseId),
                }
              : state.currentGroup,
        })),

      addMember: (groupId, member) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, members: [...group.members, member] } : group,
          ),
          currentGroup:
            state.currentGroup?.id === groupId
              ? { ...state.currentGroup, members: [...state.currentGroup.members, member] }
              : state.currentGroup,
        })),

      removeMember: (groupId, memberId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, members: group.members.filter((member) => member.id !== memberId) }
              : group,
          ),
          currentGroup:
            state.currentGroup?.id === groupId
              ? {
                  ...state.currentGroup,
                  members: state.currentGroup.members.filter((member) => member.id !== memberId),
                }
              : state.currentGroup,
        })),

      connectWallet: (address) =>
        set({
          walletAddress: address,
          isWalletConnected: true,
        }),

      disconnectWallet: () =>
        set({
          walletAddress: null,
          isWalletConnected: false,
        }),

      getGroupBalances: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId)
        if (!group) return {}

        const balances: { [memberId: string]: number } = {}

        // Initialize balances
        group.members.forEach((member) => {
          balances[member.id] = 0
        })

        // Calculate balances from expenses
        group.expenses.forEach((expense) => {
          const splitAmount = expense.amount / expense.splitBetween.length

          // Person who paid gets credited
          balances[expense.paidBy] += expense.amount

          // Everyone who owes gets debited
          expense.splitBetween.forEach((memberId) => {
            balances[memberId] -= splitAmount
          })
        })

        return balances
      },

      getSimplifiedDebts: (groupId) => {
        const balances = get().getGroupBalances(groupId)
        const group = get().groups.find((g) => g.id === groupId)
        if (!group) return []

        // Convert balances to creditors and debtors
        const creditors: { id: string; amount: number }[] = []
        const debtors: { id: string; amount: number }[] = []

        Object.entries(balances).forEach(([memberId, balance]) => {
          if (balance > 0.01) {
            creditors.push({ id: memberId, amount: balance })
          } else if (balance < -0.01) {
            debtors.push({ id: memberId, amount: -balance })
          }
        })

        // Simplify debts using greedy algorithm
        const debts: Debt[] = []

        creditors.sort((a, b) => b.amount - a.amount)
        debtors.sort((a, b) => b.amount - a.amount)

        let i = 0,
          j = 0

        while (i < creditors.length && j < debtors.length) {
          const creditor = creditors[i]
          const debtor = debtors[j]

          const creditorMember = group.members.find((m) => m.id === creditor.id)
          const debtorMember = group.members.find((m) => m.id === debtor.id)

          if (!creditorMember || !debtorMember) continue

          const amount = Math.min(creditor.amount, debtor.amount)

          debts.push({
            from: debtorMember.ensName,
            to: creditorMember.ensName,
            amount: Math.round(amount * 100) / 100,
          })

          creditor.amount -= amount
          debtor.amount -= amount

          if (creditor.amount < 0.01) i++
          if (debtor.amount < 0.01) j++
        }

        return debts
      },
    }),
    {
      name: "splitpay-storage",
    },
  ),
)
