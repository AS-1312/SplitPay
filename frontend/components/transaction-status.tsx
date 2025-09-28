import { useState, useEffect } from 'react'
import { useWaitForTransactionReceipt, useAccount, useBlockNumber } from 'wagmi'
import { CheckCircle, Clock, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface TransactionStatusProps {
  hash?: string
  onSuccess?: () => void
  onError?: (error: any) => void
  showExplorer?: boolean
  type?: 'approval' | 'settlement' | 'transfer'
}

export function TransactionStatus({ 
  hash, 
  onSuccess, 
  onError, 
  showExplorer = true, 
  type = 'settlement' 
}: TransactionStatusProps) {
  const [startTime] = useState(Date.now())
  const { chain } = useAccount()
  
  const { data: receipt, error, isLoading } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
    query: {
      enabled: !!hash,
    }
  })

  // Get current block for real-time updates
  const { data: blockNumber } = useBlockNumber({ 
    watch: true,
    query: {
      enabled: !!hash && !receipt 
    }
  })

  useEffect(() => {
    if (receipt && onSuccess) {
      onSuccess()
    }
  }, [receipt, onSuccess])

  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  if (!hash) return null

  const getExplorerUrl = () => {
    if (!chain) return '#'
    
    // Default to Sepolia for development
    const baseUrl = chain.id === 11155111 ? 'https://sepolia.etherscan.io' : 'https://etherscan.io'
    return `${baseUrl}/tx/${hash}`
  }

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertTriangle,
        label: 'Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }

    if (receipt) {
      return {
        icon: CheckCircle,
        label: 'Confirmed',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    }

    return {
      icon: Loader2,
      label: 'Pending',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon
  
  // Simple time elapsed calculation
  const getElapsedTime = () => {
    const now = Date.now()
    const elapsed = now - startTime
    const seconds = Math.floor(elapsed / 1000)
    
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  const elapsed = getElapsedTime()

  const getTypeLabel = () => {
    switch (type) {
      case 'approval': return 'PYUSD Approval'
      case 'settlement': return 'Settlement'
      case 'transfer': return 'Transfer'
      default: return 'Transaction'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <StatusIcon 
                  className={`w-5 h-5 ${statusInfo.color} ${isLoading ? 'animate-spin' : ''}`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className={`text-sm font-medium ${statusInfo.color}`}>
                    {getTypeLabel()}
                  </p>
                  <Badge variant="outline" className={`text-xs ${statusInfo.color} ${statusInfo.borderColor}`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 font-mono break-all mb-2">
                  {hash}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{elapsed} ago</span>
                  </span>
                  
                  {receipt && (
                    <span>
                      Block: {receipt.blockNumber.toString()}
                    </span>
                  )}
                  
                  {isLoading && blockNumber && (
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>Block #{blockNumber.toString()}</span>
                    </span>
                  )}
                </div>

                {error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                    <strong>Error:</strong> {error.message || 'Transaction failed'}
                  </div>
                )}

                {receipt && (
                  <div className="mt-2 text-xs text-green-700">
                    <strong>Success!</strong> Transaction confirmed in block {receipt.blockNumber.toString()}
                    {receipt.gasUsed && (
                      <span className="ml-2">
                        Gas used: {receipt.gasUsed.toString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {showExplorer && (
              <div className="flex-shrink-0 ml-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(), '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Explorer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hook for managing multiple transaction statuses
export function useTransactionTracker() {
  const [transactions, setTransactions] = useState<Array<{
    id: string
    hash: string
    type: 'approval' | 'settlement' | 'transfer'
    timestamp: number
    status: 'pending' | 'confirmed' | 'failed'
  }>>([])

  const addTransaction = (hash: string, type: 'approval' | 'settlement' | 'transfer') => {
    const id = `${hash}-${Date.now()}`
    setTransactions(prev => [...prev, {
      id,
      hash,
      type,
      timestamp: Date.now(),
      status: 'pending'
    }])
    return id
  }

  const updateTransaction = (id: string, status: 'pending' | 'confirmed' | 'failed') => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, status } : tx)
    )
  }

  const clearTransactions = () => {
    setTransactions([])
  }

  const getPendingTransactions = () => {
    return transactions.filter(tx => tx.status === 'pending')
  }

  return {
    transactions,
    addTransaction,
    updateTransaction,
    clearTransactions,
    getPendingTransactions
  }
}