"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { ExpenseCard } from "@/components/expense-card"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { BalanceCard } from "@/components/balance-card"
import { DebtSimplifier } from "@/components/debt-simplifier"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getGroupById } from "@/app/actions"
import { calculateGroupBalances } from "@/lib/api"
import type { Expense, Group } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Plus, Search, Users, Receipt, BarChart3, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch group data from API
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setIsLoading(true)
        const fetchedGroup = await getGroupById(groupId)
        if (fetchedGroup) {
          setGroup(fetchedGroup)
          setError(null)
        } else {
          setError("Group not found")
        }
      } catch (err) {
        console.error('Error fetching group:', err)
        setError("Failed to load group")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroup()
  }, [groupId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading group...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!group || error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Group not found"}</h1>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const balances = calculateGroupBalances(group)
  const totalSpent = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const filteredExpenses = group.expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setIsAddExpenseOpen(true)
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      // TODO: Implement expense deletion via API
      console.log("Delete expense:", expenseId)
    }
  }

  const handleCloseModal = () => {
    setIsAddExpenseOpen(false)
    setEditingExpense(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{group.members.length} members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Receipt className="w-4 h-4" />
                  <span>{group.expenses.length} expenses</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{formatCurrency(totalSpent)} total</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setIsAddExpenseOpen(true)} className="gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="simplify">Simplify</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No matching expenses" : "No expenses yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Add your first expense to start tracking group spending"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddExpenseOpen(true)} className="gradient-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Expense
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense, index) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    members={group.members}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.members.map((member, index) => {
                const memberBalance = Object.values(balances)[index] || 0
                return (
                  <BalanceCard key={member.id} member={member} balance={memberBalance} delay={index * 0.1} />
                )
              })}
            </div>
          </TabsContent>

          {/* Simplify Tab */}
          <TabsContent value="simplify" className="space-y-6">
            <DebtSimplifier groupId={groupId} members={group.members} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          onClick={() => setIsAddExpenseOpen(true)}
          size="lg"
          className="gradient-primary text-white rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={handleCloseModal}
        groupId={groupId}
        members={group.members}
        editingExpense={editingExpense}
      />
    </div>
  )
}
