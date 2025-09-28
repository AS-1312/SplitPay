"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { receiptManager } from "@/lib/receipt-manager"
import type { StoredReceipt } from "@/lib/receipt-types"
import { 
  Receipt, 
  ExternalLink, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Hash,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface ReceiptCardProps {
  receiptId: string
  className?: string
}

export function ReceiptCard({ receiptId, className = "" }: ReceiptCardProps) {
  const [receipt, setReceipt] = useState<StoredReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const receiptData = await receiptManager.getReceipt(receiptId)
        
        if (receiptData) {
          setReceipt(receiptData)
        } else {
          setError("Receipt not found")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load receipt")
      } finally {
        setLoading(false)
      }
    }

    if (receiptId) {
      loadReceipt()
    }
  }, [receiptId])

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading receipt...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !receipt) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>{error || "Receipt not found"}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formattedReceipt = receiptManager.formatReceiptForDisplay(receipt)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Receipt className="w-5 h-5" />
              <span>Settlement Receipt</span>
            </CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Confirmed
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Amount and Savings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Total Settled</span>
              </div>
              <div className="text-lg font-bold text-green-800">
                {formattedReceipt.totalAmountUsd}
              </div>
              <div className="text-xs text-green-600">
                {formattedReceipt.totalAmount}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Savings</span>
              </div>
              <div className="text-lg font-bold text-green-800">
                {formattedReceipt.savings.savingsPercentage}%
              </div>
              <div className="text-xs text-green-600">
                {formattedReceipt.savings.transactionsSaved} tx saved
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Group ID</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {formattedReceipt.groupId}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Settlement Date</span>
              <div className="flex items-center space-x-1 text-gray-900">
                <Calendar className="w-3 h-3" />
                <span>{formattedReceipt.timestamp.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Original Debts</span>
              <span className="text-gray-900">{formattedReceipt.savings.originalCount}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Simplified To</span>
              <span className="text-gray-900">{formattedReceipt.savings.simplifiedCount}</span>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <Hash className="w-4 h-4" />
              <span className="text-sm font-medium">Ethereum Transaction</span>
            </div>
            <div className="font-mono text-xs text-gray-700 break-all mb-2">
              {formattedReceipt.ethTxHash}
            </div>
            {formattedReceipt.ethExplorerUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(formattedReceipt.ethExplorerUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Etherscan
              </Button>
            )}
          </div>

          {/* Receipt ID */}
          <div className="text-xs text-gray-500 text-center">
            Receipt ID: <span className="font-mono">{formattedReceipt.receiptId.slice(0, 16)}...</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface UserReceiptsProps {
  userAddress: string
  className?: string
}

export function UserReceipts({ userAddress, className = "" }: UserReceiptsProps) {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [receiptsData, statsData] = await Promise.all([
          receiptManager.getUserReceipts(userAddress),
          receiptManager.getUserStats(userAddress)
        ])
        
        setReceipts(receiptsData)
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load receipts")
      } finally {
        setLoading(false)
      }
    }

    if (userAddress) {
      loadUserData()
    }
  }, [userAddress])

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-32`}>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading receipts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center h-32`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts found</h3>
        <p className="text-gray-600">Settlement receipts will appear here after PYUSD settlements.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Stats Summary */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Settlement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalReceipts}</div>
                  <div className="text-sm text-gray-600">Settlements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ${(Number(stats.totalAmountSettled) / 1_000_000).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Settled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalTransactionsSaved}</div>
                  <div className="text-sm text-gray-600">Transactions Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.averageSavingsPercentage}%</div>
                  <div className="text-sm text-gray-600">Avg. Savings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Receipts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h3>
        <AnimatePresence>
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt.receiptId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ReceiptCard receiptId={receipt.receiptId} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}