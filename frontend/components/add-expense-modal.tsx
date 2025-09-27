"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/store"
import { generateId } from "@/lib/utils"
import type { Expense, Member } from "@/lib/types"
import { X, DollarSign, Calendar, Users, Tag } from "lucide-react"

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  editingExpense?: Expense | null
}

const categories = [
  { value: "food", label: "Food & Dining", icon: "🍽️" },
  { value: "transport", label: "Transportation", icon: "🚗" },
  { value: "accommodation", label: "Accommodation", icon: "🏠" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "other", label: "Other", icon: "📝" },
]

export function AddExpenseModal({ isOpen, onClose, groupId, members, editingExpense }: AddExpenseModalProps) {
  const [amount, setAmount] = useState(editingExpense?.amount.toString() || "")
  const [description, setDescription] = useState(editingExpense?.description || "")
  const [paidBy, setPaidBy] = useState(editingExpense?.paidBy || "")
  const [splitBetween, setSplitBetween] = useState<string[]>(editingExpense?.splitBetween || [])
  const [category, setCategory] = useState<string>(editingExpense?.category || "food")
  const [date, setDate] = useState(
    editingExpense?.date ? editingExpense.date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  )

  const { addExpense, updateExpense } = useAppStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !description || !paidBy || splitBetween.length === 0) return

    const expenseData = {
      id: editingExpense?.id || generateId(),
      description: description.trim(),
      amount: Number.parseFloat(amount),
      paidBy,
      splitBetween,
      category: category as Expense["category"],
      date: new Date(date),
    }

    if (editingExpense) {
      updateExpense(groupId, editingExpense.id, expenseData)
    } else {
      addExpense(groupId, expenseData as Expense)
    }

    // Reset form
    setAmount("")
    setDescription("")
    setPaidBy("")
    setSplitBetween([])
    setCategory("food")
    setDate(new Date().toISOString().split("T")[0])
    onClose()
  }

  const toggleMemberInSplit = (memberId: string) => {
    setSplitBetween((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const selectAllMembers = () => {
    setSplitBetween(members.map((m) => m.id))
  }

  const splitAmount = amount ? Number.parseFloat(amount) / splitBetween.length : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div>
                <Label htmlFor="amount" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Amount</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 text-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this expense for?"
                  className="mt-1"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Category</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center space-x-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {/* Paid By */}
              <div>
                <Label>Who paid?</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center space-x-2">
                          <span>{member.name}</span>
                          <span className="text-sm text-gray-500">({member.ensName})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Split Between */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Split between</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllMembers}
                    className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                  >
                    Select All
                  </Button>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={splitBetween.includes(member.id)}
                          onCheckedChange={() => toggleMemberInSplit(member.id)}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.ensName}</div>
                        </div>
                      </div>
                      {splitBetween.includes(member.id) && splitAmount > 0 && (
                        <div className="text-sm font-medium text-green-600">${splitAmount.toFixed(2)}</div>
                      )}
                    </div>
                  ))}
                </div>

                {splitBetween.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-800">
                      Split between {splitBetween.length} people • ${splitAmount.toFixed(2)} each
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white"
                  disabled={!amount || !description || !paidBy || splitBetween.length === 0}
                >
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
