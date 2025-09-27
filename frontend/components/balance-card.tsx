"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Member } from "@/lib/types"
import { formatCurrency, getInitials } from "@/lib/utils"

interface BalanceCardProps {
  member: Member
  balance: number
  delay?: number
}

export function BalanceCard({ member, balance, delay = 0 }: BalanceCardProps) {
  const isPositive = balance > 0
  const isNegative = balance < 0
  const isSettled = Math.abs(balance) < 0.01

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="gradient-card rounded-xl p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={member.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{member.name}</h3>
          <p className="text-sm text-gray-500">{member.ensName}</p>
        </div>

        <div className="text-right">
          {isSettled ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              Settled up
            </Badge>
          ) : isPositive ? (
            <div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-1">Gets back</Badge>
              <div className="font-bold text-green-600">{formatCurrency(balance)}</div>
            </div>
          ) : (
            <div>
              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 mb-1">
                Owes
              </Badge>
              <div className="font-bold text-red-600">{formatCurrency(-balance)}</div>
            </div>
          )}
        </div>
      </div>

      {!isSettled && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((Math.abs(balance) / 100) * 100, 100)}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2 }}
              className={`h-2 rounded-full balance-bar ${isPositive ? "bg-green-500" : "bg-red-500"}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
