"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, getInitials } from "@/lib/utils"
import type { Member } from "@/lib/types"

interface DebtArrowProps {
  fromMember: Member
  toMember: Member
  amount: number
  isSimplified?: boolean
  delay?: number
}

export function DebtArrow({ fromMember, toMember, amount, isSimplified = false, delay = 0 }: DebtArrowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all duration-300 ${
        isSimplified ? "bg-green-50 border-green-200 shadow-md" : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* From Member */}
      <div className="flex items-center space-x-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={fromMember.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-red-400 to-pink-500 text-white font-semibold">
            {getInitials(fromMember.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-gray-900">{fromMember.name}</div>
          <div className="text-xs text-gray-500">{fromMember.ensName}</div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className="flex items-center space-x-2"
        >
          <div className={`h-0.5 flex-1 ${isSimplified ? "bg-green-500" : "bg-gray-400"}`} />
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5, delay: delay + 0.5 }}
            className={`w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent ${
              isSimplified ? "border-b-green-500" : "border-b-gray-400"
            }`}
          />
        </motion.div>
      </div>

      {/* Amount */}
      <div
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isSimplified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
        }`}
      >
        {formatCurrency(amount)}
      </div>

      {/* To Member */}
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="font-medium text-gray-900">{toMember.name}</div>
          <div className="text-xs text-gray-500">{toMember.ensName}</div>
        </div>
        <Avatar className="w-10 h-10">
          <AvatarImage src={toMember.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
            {getInitials(toMember.name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </motion.div>
  )
}
