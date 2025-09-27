"use client"

import { motion } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface QuickStatsProps {
  totalOwed: number
  totalToReceive: number
  totalGroups: number
}

export function QuickStats({ totalOwed, totalToReceive, totalGroups }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="gradient-card rounded-xl p-6 text-center"
      >
        <div className="text-2xl font-bold text-red-600 mb-2">{formatCurrency(totalOwed)}</div>
        <div className="text-sm text-gray-600">Total You Owe</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="gradient-card rounded-xl p-6 text-center"
      >
        <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(totalToReceive)}</div>
        <div className="text-sm text-gray-600">Total You're Owed</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="gradient-card rounded-xl p-6 text-center"
      >
        <div className="text-2xl font-bold text-blue-600 mb-2">{totalGroups}</div>
        <div className="text-sm text-gray-600">Active Groups</div>
      </motion.div>
    </div>
  )
}
