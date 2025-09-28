"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Confetti } from "@/components/confetti"
import { formatCurrency, getInitials, shortenAddress } from "@/lib/utils"
import { TransactionStatus } from "@/components/transaction-status"
import {
  usePyusdBalance,
  usePyusdAllowance,
  useApprovePyusd,
  useSettleGroup,
  useContractAddresses,
} from "@/lib/contract-hooks"
import { expensesApi } from "@/lib/api"
import { generateId } from "@/lib/utils"
import {
  formatPyusdAmount,
  parsePyusdAmount,
  calculateRequiredAllowance,
  isAllowanceSufficient,
  parseContractError,
  createSettlementData,
  dateToTimestamp,
} from "@/lib/contract-utils"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import type { Member, Debt } from "@/lib/types"
import { X, Wallet, CheckCircle, AlertCircle, Loader2, Zap, Shield, ArrowRight, Sparkles, ExternalLink } from "lucide-react"

interface SettlementModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  debts: Debt[]
  onSettlementComplete?: () => void
}

type SettlementStep = "review" | "connect" | "approve" | "confirm" | "processing" | "success"

export function SettlementModal({ isOpen, onClose, groupId, members, debts, onSettlementComplete }: SettlementModalProps) {
  const [currentStep, setCurrentStep] = useState<SettlementStep>("review")
  const [approvalTxHash, setApprovalTxHash] = useState<string>("")
  const [settlementTxHash, setSettlementTxHash] = useState<string>("")
  const [showConfetti, setShowConfetti] = useState(false)
  const [settlementError, setSettlementError] = useState<string>("")

  // Wallet connection
  const { address, isConnected } = useAccount()
  const addresses = useContractAddresses()

  // Contract hooks
  const { data: pyusdBalance, isLoading: isBalanceLoading } = usePyusdBalance(address)
  const { data: currentAllowance, isLoading: isAllowanceLoading } = usePyusdAllowance(address, addresses.splitPay)
  const { approve, isPending: isApproving, error: approvalError, data: approvalTx } = useApprovePyusd()
  const { settleGroup, isPending: isSettling, error: contractSettlementError, data: settlementTx } = useSettleGroup()

  // Transaction receipts
  const { data: approvalReceipt, isLoading: isApprovalConfirming } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}`,
    query: {
      enabled: !!approvalTxHash,
    }
  })
  
  const { data: settlementReceipt, isLoading: isSettlementConfirming } = useWaitForTransactionReceipt({
    hash: settlementTxHash as `0x${string}`,
    query: {
      enabled: !!settlementTxHash,
    }
  })

  // Calculate settlement data
  const settlementData = useMemo(() => {
    try {
      // Convert debts to settlement format
      const debtsByUser: { [key: string]: { creditor: `0x${string}`; amount: number }[] } = {}
      
      debts.forEach(debt => {
        const fromMember = members.find(m => 
          (m.ensName && m.ensName === debt.from) || m.name === debt.from
        )
        const toMember = members.find(m => 
          (m.ensName && m.ensName === debt.to) || m.name === debt.to
        )
        
        if (fromMember && toMember && fromMember.walletAddress && toMember.walletAddress) {
          if (!debtsByUser[fromMember.walletAddress]) {
            debtsByUser[fromMember.walletAddress] = []
          }
          debtsByUser[fromMember.walletAddress].push({
            creditor: toMember.walletAddress as `0x${string}`,
            amount: debt.amount // Keep as number, the utility function handles conversion
          })
        }
      })

      // For now, focus on current user's debts
      if (!address || !debtsByUser[address]) {
        return null
      }

      const dueDate = Date.now() / 1000 + 86400 // 24 hours from now
      return createSettlementData(groupId, debtsByUser[address], Math.floor(dueDate))
    } catch (error) {
      console.error('Error creating settlement data:', error)
      return null
    }
  }, [debts, members, address, groupId])

  const totalAmount = settlementData ? settlementData.totalAmount : BigInt(0)
  const formattedBalance = pyusdBalance ? formatPyusdAmount(pyusdBalance) : '0'
  const formattedTotal = formatPyusdAmount(totalAmount)
  
  // Check if user has sufficient balance
  const hasSufficientBalance = pyusdBalance && pyusdBalance >= totalAmount
  
  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!currentAllowance || !settlementData) return true
    return !isAllowanceSufficient(currentAllowance, settlementData.totalAmount)
  }, [currentAllowance, settlementData])

  const totalAmountInCurrency = debts.reduce((sum, debt) => sum + debt.amount, 0)
  const mockPYUSDBalance = 1250.5 // Remove this later

  // Effect to watch for transaction hashes from the hooks
  useEffect(() => {
    if (approvalTx && !approvalTxHash) {
      console.log('Setting approval tx hash from hook:', approvalTx)
      setApprovalTxHash(approvalTx)
    }
  }, [approvalTx, approvalTxHash])

  useEffect(() => {
    if (settlementTx && !settlementTxHash) {
      console.log('Setting settlement tx hash from hook:', settlementTx)
      setSettlementTxHash(settlementTx)
    }
  }, [settlementTx, settlementTxHash])

  // Effect to handle transaction confirmations
  useEffect(() => {
    console.log('Approval effect:', { approvalReceipt, currentStep, approvalTxHash })
    if (approvalReceipt && currentStep === "approve") {
      console.log('Moving to confirm step')
      setCurrentStep("confirm")
    }
  }, [approvalReceipt, currentStep])

  useEffect(() => {
    console.log('Settlement effect:', { settlementReceipt, currentStep, settlementTxHash })
    if (settlementReceipt && currentStep === "processing") {
      console.log('Moving to success step')
      setCurrentStep("success")
      setShowConfetti(true)
      
      // Note: Settlement recording is handled by TransactionStatus onSuccess callback
      
      // Call the completion callback to refresh data
      if (onSettlementComplete) {
        console.log('Calling settlement completion callback')
        // Delay the refresh to allow database update to complete
        setTimeout(() => {
          onSettlementComplete()
        }, 1000)
      }
    }
  }, [settlementReceipt, currentStep, onSettlementComplete])

  // Effect to handle errors
  useEffect(() => {
    if (approvalError) {
      setSettlementError(parseContractError(approvalError))
    }
  }, [approvalError])

  useEffect(() => {
    if (contractSettlementError) {
      setSettlementError(parseContractError(contractSettlementError))
    }
  }, [contractSettlementError])

  const getMemberByEns = (ensName: string) => members.find((m) => m.ensName === ensName || m.name === ensName)

  // Function to record settlement in the database
  const recordSettlement = async () => {
    if (!address || !settlementData) return

    try {
      console.log('Recording settlement - called once via TransactionStatus')
      
      // Find the current user member
      const currentMember = members.find(m => 
        m.walletAddress?.toLowerCase() === address.toLowerCase()
      )
      
      if (!currentMember) return

      // Create a settlement expense that reverses the debts
      const settlementExpense = {
        id: generateId(),
        description: `PYUSD Settlement - Group Debts Paid`,
        amount: Number(formatPyusdAmount(settlementData.totalAmount)),
        paidBy: currentMember.id, // Current user paid
        splitBetween: settlementData.creditors
          .map(creditorAddress => 
            members.find(m => m.walletAddress?.toLowerCase() === creditorAddress.toLowerCase())
          )
          .filter(Boolean)
          .map(member => member!.id), // Who received the payments
        category: "other" as const,
        date: new Date(),
      }

      console.log('Recording settlement expense:', settlementExpense)
      
      // Add the settlement expense to the group
      await expensesApi.create(groupId, settlementExpense)
      
      console.log('Settlement recorded successfully')
    } catch (error) {
      console.error('Failed to record settlement:', error)
      // Don't throw error - settlement on blockchain succeeded, recording is just for bookkeeping
    }
  }

  const steps = [
    { id: "review", label: "Review", icon: CheckCircle },
    { id: "connect", label: "Connect", icon: Wallet },
    { id: "approve", label: "Approve", icon: Shield },
    { id: "confirm", label: "Confirm", icon: Zap },
    { id: "success", label: "Complete", icon: Sparkles },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  // Handler functions
  const handleApprove = () => {
    if (!settlementData) return
    
    try {
      setSettlementError("")
      const requiredAllowance = calculateRequiredAllowance(settlementData.totalAmount)
      console.log('Starting approval for:', { requiredAllowance, splitPayAddress: addresses.splitPay })
      
      // Call approve - the transaction hash will be available in the hook's data
      approve(addresses.splitPay, requiredAllowance)
    } catch (error) {
      console.error('Approval failed:', error)
      setSettlementError(parseContractError(error))
    }
  }

  const handleConfirm = () => {
    if (!settlementData) return
    
    try {
      setSettlementError("")
      setCurrentStep("processing")
      console.log('Starting settlement for:', settlementData)
      
      // Call settleGroup - the transaction hash will be available in the hook's data
      settleGroup(
        settlementData.groupId,
        settlementData.creditors,
        settlementData.amounts,
        settlementData.dueDate
      )
    } catch (error) {
      console.error('Settlement failed:', error)
      setSettlementError(parseContractError(error))
      setCurrentStep("confirm") // Go back to confirm step
    }
  }

  const handleClose = () => {
    setCurrentStep("review")
    setApprovalTxHash("")
    setSettlementTxHash("")
    setShowConfetti(false)
    setSettlementError("")
    onClose()
  }

  const nextStep = () => {
    if (currentStep === "review") {
      if (isConnected) {
        setCurrentStep("approve")
      } else {
        setCurrentStep("connect")
      }
    }
  }

  // Loading states
  const isProcessing = isApproving || isApprovalConfirming || isSettling || isSettlementConfirming

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isActive={showConfetti} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={!isProcessing ? handleClose : undefined}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settle with PYUSD</h2>
                  <p className="text-gray-600">Complete all settlements in one transaction</p>
                </div>
                {!isProcessing && (
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Progress Steps */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = index === currentStepIndex
                    const isCompleted = index < currentStepIndex
                    const isSuccess = currentStep === "success"

                    return (
                      <div key={step.id} className="flex items-center">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            backgroundColor:
                              isCompleted || (isSuccess && step.id === "success")
                                ? "#10B981"
                                : isActive
                                  ? "#3B82F6"
                                  : "#E5E7EB",
                          }}
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                            isCompleted || (isSuccess && step.id === "success")
                              ? "border-green-500 text-white"
                              : isActive
                                ? "border-blue-500 text-white"
                                : "border-gray-300 text-gray-500"
                          }`}
                        >
                          <StepIcon className="w-4 h-4" />
                        </motion.div>
                        <span
                          className={`ml-2 text-sm font-medium transition-colors ${
                            isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </span>
                        {index < steps.length - 1 && (
                          <motion.div
                            animate={{
                              backgroundColor: isCompleted ? "#10B981" : "#E5E7EB",
                            }}
                            className="w-8 h-0.5 mx-4 transition-colors"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Review Step */}
                {currentStep === "review" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {!address && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Connect Wallet Required</span>
                        </div>
                        <p className="text-sm text-yellow-600 mt-1">
                          Please connect your wallet to proceed with settlement.
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Settlement Summary</h3>
                      <div className="space-y-3">
                        {debts.map((debt, index) => {
                          const fromMember = getMemberByEns(debt.from)
                          const toMember = getMemberByEns(debt.to)

                          if (!fromMember || !toMember) return null

                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={fromMember.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-red-400 to-pink-500 text-white">
                                    {getInitials(fromMember.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={toMember.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                                    {getInitials(toMember.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {fromMember.name} → {toMember.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {debt.from} → {debt.to}
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold text-gray-900">{formatCurrency(debt.amount)}</div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-green-800">Total Settlement Amount</span>
                        <span className="text-xl font-bold text-green-800">{formatCurrency(totalAmountInCurrency)}</span>
                      </div>
                    </motion.div>

                    <Button 
                      onClick={nextStep} 
                      className="w-full gradient-primary text-white"
                      disabled={!address}
                    >
                      Continue to Settlement
                    </Button>
                  </motion.div>
                )}

                {/* Connect Wallet Step */}
                {currentStep === "connect" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                      className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center"
                    >
                      <Wallet className="w-10 h-10 text-blue-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
                      <p className="text-gray-600">Connect your wallet to proceed with PYUSD settlement</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Please use your wallet's connect button or refresh the page
                    </div>
                  </motion.div>
                )}

                {/* Approve Step */}
                {currentStep === "approve" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-10 h-10 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Approve PYUSD Spending</h3>
                      <p className="text-gray-600">Approve the contract to spend PYUSD on your behalf</p>
                    </div>

                    {isBalanceLoading || isAllowanceLoading ? (
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading balance information...</p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-blue-800">Connected Wallet</span>
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {shortenAddress(address || "")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-800">PYUSD Balance</span>
                          <span className="font-semibold text-blue-900">{formattedBalance} PYUSD</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-blue-800">Required Amount</span>
                          <span className="font-semibold text-blue-900">{formattedTotal} PYUSD</span>
                        </div>
                      </div>
                    )}

                    {!hasSufficientBalance && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Insufficient PYUSD Balance</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          You need {totalAmount > (pyusdBalance || BigInt(0)) ? 
                            formatPyusdAmount(totalAmount - (pyusdBalance || BigInt(0))) : '0'} more PYUSD to complete this settlement.
                        </p>
                      </div>
                    )}

                    {settlementError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Error</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{settlementError}</p>
                      </div>
                    )}

                    {approvalTxHash && (
                      <div className="space-y-4">
                        <TransactionStatus
                          hash={approvalTxHash}
                          type="approval"
                          onSuccess={() => {
                            // Approval confirmed, move to next step
                            setCurrentStep("confirm")
                          }}
                          onError={(error) => {
                            console.error('Approval transaction failed:', error)
                            setSettlementError(parseContractError(error))
                          }}
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleApprove}
                      disabled={isApproving || !hasSufficientBalance || isApprovalConfirming || !!approvalTxHash}
                      className="w-full gradient-primary text-white"
                    >
                      {isApproving || isApprovalConfirming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isApproving ? 'Approving...' : 'Confirming...'}
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Approve PYUSD Spending
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Confirm Step */}
                {currentStep === "confirm" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Zap className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Settlement</h3>
                      <p className="text-gray-600">Review and confirm your settlement transaction</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Settlement Amount</span>
                        <span className="font-semibold text-gray-900">{formattedTotal} PYUSD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Network Fee (Est.)</span>
                        <span className="font-semibold text-gray-900">~$0.50</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Total PYUSD Required</span>
                          <span className="text-lg font-bold text-gray-900">{formattedTotal} PYUSD</span>
                        </div>
                      </div>
                    </div>

                    {settlementError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Transaction Error</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{settlementError}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleConfirm}
                      disabled={isSettling}
                      className="w-full gradient-primary text-white"
                    >
                      {isSettling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming Settlement...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Confirm Settlement
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Processing Step */}
                {currentStep === "processing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Settlement</h3>
                      <p className="text-gray-600 mb-4">Your transaction is being processed on the blockchain</p>
                      <Progress value={isSettlementConfirming ? 85 : 45} className="w-full" />
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
                    </div>

                    {/* Show transaction status */}
                    {settlementTxHash && (
                      <div className="space-y-4">
                        <TransactionStatus
                          hash={settlementTxHash}
                          type="settlement"
                          onSuccess={() => {
                            setCurrentStep("success")
                            setShowConfetti(true)
                            
                            // Record the settlement in the database
                            recordSettlement()
                            
                            // Call the completion callback to refresh data
                            if (onSettlementComplete) {
                              console.log('Calling settlement completion callback from TransactionStatus')
                              setTimeout(() => {
                                onSettlementComplete()
                              }, 1000)
                            }
                          }}
                          onError={(error) => {
                            console.error('Settlement transaction failed:', error)
                            setSettlementError(parseContractError(error))
                            setCurrentStep("confirm")
                          }}
                        />
                      </div>
                    )}

                    {settlementError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Transaction Failed</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">{settlementError}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3" 
                          onClick={() => setCurrentStep("confirm")}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Success Step */}
                {currentStep === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center"
                    >
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, delay: 0.5 }}>
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </motion.div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Settlement Complete!</h3>
                      <p className="text-gray-600">All debts have been settled successfully with PYUSD</p>
                    </motion.div>

                    {settlementTxHash && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4"
                      >
                        <div className="text-sm text-green-800 mb-2">Transaction Hash</div>
                        <div className="font-mono text-xs text-green-700 break-all mb-2">
                          {settlementTxHash}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://sepolia.etherscan.io/tx/${settlementTxHash}`, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View on Explorer
                        </Button>
                      </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                      <Button onClick={handleClose} className="w-full gradient-primary text-white">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
