"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Expense, Member } from "@/lib/types"
import { formatCurrency, formatDate, getCategoryIcon, getInitials } from "@/lib/utils"
import { Edit, Trash2 } from "lucide-react"

interface ExpenseCardProps {
  expense: Expense
  members: Member[]
  onEdit?: (expense: Expense) => void
  onDelete?: (expenseId: string) => void
  delay?: number
}

export function ExpenseCard({ expense, members, onEdit, onDelete, delay = 0 }: ExpenseCardProps) {
  const paidByMember = members.find((m) => m.id === expense.paidBy)
  const splitBetweenMembers = members.filter((m) => expense.splitBetween.includes(m.id))
  const splitAmount = expense.amount / expense.splitBetween.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="gradient-card rounded-xl p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-lg">
            {getCategoryIcon(expense.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
            <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="font-bold text-lg text-gray-900">{formatCurrency(expense.amount)}</div>
            <div className="text-xs text-gray-500">{formatCurrency(splitAmount)} each</div>
          </div>

          <div className="flex flex-col space-y-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(expense)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense.id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Paid by</span>
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={paidByMember?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                {paidByMember ? getInitials(paidByMember.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-900">{paidByMember?.name || "Unknown"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Split between</span>
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              {splitBetweenMembers.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="w-6 h-6 border border-white">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {splitBetweenMembers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{splitBetweenMembers.length - 3}</span>
                </div>
              )}
            </div>
            <span className="text-gray-500 ml-2">({splitBetweenMembers.length} people)</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Badge variant="secondary" className="text-xs">
          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
        </Badge>
      </div>
    </motion.div>
  )
}
