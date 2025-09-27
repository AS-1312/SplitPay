"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExitGroupModal } from "@/components/exit-group-modal"
import type { Group } from "@/lib/types"
import { formatCurrency, getInitials } from "@/lib/utils"
import Link from "next/link"
import { MoreVertical, LogOut } from "lucide-react"

interface GroupCardProps {
  group: Group
  userBalance: number
  delay?: number
  currentUserId?: string
  onGroupExited?: (groupId: string) => void
}

export function GroupCard({ group, userBalance, delay = 0, currentUserId, onGroupExited }: GroupCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const totalSpent = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const handleGroupExited = (groupId: string) => {
    setShowExitModal(false)
    onGroupExited?.(groupId)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="gradient-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm text-gray-500">{group.members.length} members</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">{group.expenses.length} expenses</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentUserId && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {showDropdown && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowExitModal(true)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Exit Group</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex -space-x-2">
          {group.members.slice(0, 3).map((member) => (
            <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
              <AvatarImage src={member.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {group.members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs text-gray-600">+{group.members.length - 3}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total spent</span>
          <span className="font-semibold text-gray-900">{formatCurrency(totalSpent)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your balance</span>
          <div className="flex items-center space-x-2">
            {userBalance > 0 ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                You're owed {formatCurrency(userBalance)}
              </Badge>
            ) : userBalance < 0 ? (
              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                You owe {formatCurrency(-userBalance)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                All settled up
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Link href={`/group/${group.id}`}>
        <Button className="w-full gradient-primary text-white">View Group</Button>
      </Link>

      {/* Exit Group Modal */}
      {currentUserId && (
        <ExitGroupModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          group={group}
          currentUserId={currentUserId}
          onGroupExited={handleGroupExited}
        />
      )}
    </motion.div>
  )
}
