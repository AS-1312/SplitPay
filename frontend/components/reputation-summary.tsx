"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useReputationScore, useReputationLevel, useTotalSettlements } from "@/lib/contract-hooks"
import type { Member } from "@/lib/types"
import { Star, Award, TrendingUp, Users } from "lucide-react"

interface ReputationSummaryProps {
  members: Member[]
}

export function ReputationSummary({ members }: ReputationSummaryProps) {
  // Get reputation data for all members with wallet addresses
  const membersWithWallets = members.filter(member => member.walletAddress)
  
  const getReputationColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'average':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'poor':
        return 'text-red-600 bg-red-100 border-red-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatReputationScore = (score: bigint | undefined) => {
    if (!score) return 0
    return Number(score)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Group Reputation Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersWithWallets.length === 0 ? (
            <div className="text-center py-4">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Connect wallets to view reputation data
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {membersWithWallets.map((member) => (
                <ReputationMemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ReputationMemberCardProps {
  member: Member
}

function ReputationMemberCard({ member }: ReputationMemberCardProps) {
  const memberAddress = member.walletAddress as `0x${string}` | undefined
  
  const { data: reputationScore, isLoading: scoreLoading } = useReputationScore(memberAddress)
  const { data: reputationLevel, isLoading: levelLoading } = useReputationLevel(memberAddress)
  const { data: totalSettlements, isLoading: settlementsLoading } = useTotalSettlements(memberAddress)

  const getReputationColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'average':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'poor':
        return 'text-red-600 bg-red-100 border-red-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const formatReputationScore = (score: bigint | undefined) => {
    if (!score) return 'N/A'
    return Number(score).toLocaleString()
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="font-medium text-sm">{member.name}</div>
      
      {/* Reputation Level */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Level:</span>
        {levelLoading ? (
          <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
        ) : reputationLevel ? (
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 ${getReputationColor(reputationLevel)}`}
          >
            {reputationLevel}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">N/A</span>
        )}
      </div>

      {/* Reputation Score */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>Score:</span>
        </span>
        {scoreLoading ? (
          <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span className="text-xs font-medium">
            {formatReputationScore(reputationScore)}
          </span>
        )}
      </div>

      {/* Total Settlements */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>Settlements:</span>
        </span>
        {settlementsLoading ? (
          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span className="text-xs font-medium">
            {totalSettlements ? Number(totalSettlements) : 0}
          </span>
        )}
      </div>
    </div>
  )
}