"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useReputationScore, useReputationLevel, useTotalSettlements, useLatePayments } from "@/lib/contract-hooks"
import type { Member } from "@/lib/types"
import { formatCurrency, getInitials } from "@/lib/utils"
import { Star, TrendingUp, Award, AlertTriangle } from "lucide-react"

interface BalanceCardProps {
  member: Member
  balance: number
  delay?: number
}

export function BalanceCard({ member, balance, delay = 0 }: BalanceCardProps) {
  const isPositive = balance > 0
  const isNegative = balance < 0
  const isSettled = Math.abs(balance) < 0.01

  // Get member's wallet address for reputation data
  const memberAddress = member.walletAddress as `0x${string}` | undefined
  
  // Fetch reputation data using contract hooks
  const { data: reputationScore, isLoading: scoreLoading } = useReputationScore(memberAddress)
  const { data: reputationLevel, isLoading: levelLoading } = useReputationLevel(memberAddress)
  const { data: totalSettlements, isLoading: settlementsLoading } = useTotalSettlements(memberAddress)
  const { data: latePayments, isLoading: latePaymentsLoading } = useLatePayments(memberAddress)

  // Helper function to get reputation color
  const getReputationColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100'
      case 'good':
        return 'text-blue-600 bg-blue-100'
      case 'average':
        return 'text-yellow-600 bg-yellow-100'
      case 'poor':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatReputationScore = (score: bigint | undefined) => {
    if (!score) return 'N/A'
    return Number(score).toLocaleString()
  }

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
          
          {/* Reputation Information */}
          {memberAddress && (
            <div className="mt-2 space-y-1">
              {/* Reputation Level Badge */}
              {levelLoading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : reputationLevel ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-0.5 ${getReputationColor(reputationLevel)}`}
                        >
                          {reputationLevel}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reputation level based on settlement history</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              
              {/* Reputation Score and Settlements */}
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                {scoreLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : reputationScore ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{formatReputationScore(reputationScore)} pts</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total reputation points earned</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
                
                {settlementsLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : totalSettlements ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{Number(totalSettlements)} settlements</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total number of completed settlements</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
                
                {/* Late Payments Warning */}
                {!latePaymentsLoading && latePayments && Number(latePayments) > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center space-x-1 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{Number(latePayments)} late</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of late payments</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
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
