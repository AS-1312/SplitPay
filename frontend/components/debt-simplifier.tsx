"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DebtArrow } from "@/components/debt-arrow"
import { SettlementModal } from "@/components/settlement-modal"
import { useAppStore } from "@/lib/store"
import type { Member, Debt } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight, Zap, TrendingDown } from "lucide-react"

interface DebtSimplifierProps {
  groupId: string
  members: Member[]
}

export function DebtSimplifier({ groupId, members }: DebtSimplifierProps) {
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const { getGroupBalances, getSimplifiedDebts } = useAppStore()

  const balances = getGroupBalances(groupId)
  const simplifiedDebts = getSimplifiedDebts(groupId)

  // Calculate original debts (all possible debts before simplification)
  const originalDebts: Debt[] = []

  members.forEach((fromMember) => {
    const fromBalance = balances[fromMember.id] || 0
    if (fromBalance < -0.01) {
      // This person owes money
      members.forEach((toMember) => {
        const toBalance = balances[toMember.id] || 0
        if (toMember.id !== fromMember.id && toBalance > 0.01) {
          // This person is owed money
          // Calculate what portion of the debt should go to this creditor
          const totalCredits = Object.values(balances).reduce((sum, bal) => sum + (bal > 0 ? bal : 0), 0)
          const debtPortion = (toBalance / totalCredits) * Math.abs(fromBalance)

          if (debtPortion > 0.01) {
            originalDebts.push({
              from: fromMember.ensName,
              to: toMember.ensName,
              amount: debtPortion,
            })
          }
        }
      })
    }
  })

  const totalOriginalTransfers = originalDebts.length
  const totalSimplifiedTransfers = simplifiedDebts.length
  const reductionPercentage =
    totalOriginalTransfers > 0
      ? Math.round(((totalOriginalTransfers - totalSimplifiedTransfers) / totalOriginalTransfers) * 100)
      : 0

  const getMemberByEns = (ensName: string) => members.find((m) => m.ensName === ensName)

  const hasDebts = simplifiedDebts.length > 0

  return (
    <div className="space-y-8">
      {/* Stats Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <TrendingDown className="w-4 h-4 mr-2" />
            {reductionPercentage}% Reduction
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Debt Simplification</h2>
        <p className="text-gray-600">
          Reduced from {totalOriginalTransfers} to {totalSimplifiedTransfers} transfers
        </p>
      </motion.div>

      {!hasDebts ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <Zap className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Settled Up!</h3>
          <p className="text-gray-600">No outstanding debts in this group. Everyone is even!</p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Original Debts */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                Original Debts ({totalOriginalTransfers} transfers)
              </h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {originalDebts.map((debt, index) => {
                const fromMember = getMemberByEns(debt.from)
                const toMember = getMemberByEns(debt.to)

                if (!fromMember || !toMember) return null

                return (
                  <DebtArrow
                    key={`${debt.from}-${debt.to}-${index}`}
                    fromMember={fromMember}
                    toMember={toMember}
                    amount={debt.amount}
                    delay={index * 0.1}
                  />
                )
              })}
            </div>
          </motion.div>

          {/* Arrow Separator */}
          <div className="hidden lg:flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col items-center space-y-2"
            >
              <ArrowRight className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-green-600">Simplified</span>
            </motion.div>
          </div>

          {/* Simplified Debts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                Simplified Debts ({totalSimplifiedTransfers} transfers)
              </h3>
            </div>

            <div className="space-y-3">
              {simplifiedDebts.map((debt, index) => {
                const fromMember = getMemberByEns(debt.from)
                const toMember = getMemberByEns(debt.to)

                if (!fromMember || !toMember) return null

                return (
                  <DebtArrow
                    key={`${debt.from}-${debt.to}-simplified`}
                    fromMember={fromMember}
                    toMember={toMember}
                    amount={debt.amount}
                    isSimplified={true}
                    delay={index * 0.1 + 0.5}
                  />
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Settlement CTA */}
      {hasDebts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center pt-8 border-t border-gray-200"
        >
          <div className="gradient-card rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Settle?</h3>
            <p className="text-gray-600 mb-6">
              Use PYUSD to settle all debts instantly with just one transaction per person.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="gradient-primary text-white px-8" onClick={() => setIsSettlementOpen(true)}>
                <Zap className="w-4 h-4 mr-2" />
                Settle with PYUSD
              </Button>
              <div className="text-sm text-gray-500">
                Total to settle: {formatCurrency(simplifiedDebts.reduce((sum, debt) => sum + debt.amount, 0))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <SettlementModal
        isOpen={isSettlementOpen}
        onClose={() => setIsSettlementOpen(false)}
        groupId={groupId}
        members={members}
        debts={simplifiedDebts}
      />
    </div>
  )
}
