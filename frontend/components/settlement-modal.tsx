"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Confetti } from "@/components/confetti"
import { useAppStore } from "@/lib/store"
import { formatCurrency, getInitials, shortenAddress } from "@/lib/utils"
import type { Member, Debt } from "@/lib/types"
import { X, Wallet, CheckCircle, AlertCircle, Loader2, Zap, Shield, ArrowRight, Sparkles } from "lucide-react"

interface SettlementModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  members: Member[]
  debts: Debt[]
}

type SettlementStep = "review" | "connect" | "approve" | "confirm" | "processing" | "success"

export function SettlementModal({ isOpen, onClose, groupId, members, debts }: SettlementModalProps) {
  const [currentStep, setCurrentStep] = useState<SettlementStep>("review")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const { isWalletConnected, walletAddress, connectWallet } = useAppStore()

  const totalAmount = debts.reduce((sum, debt) => sum + debt.amount, 0)
  const mockPYUSDBalance = 1250.5 // Mock PYUSD balance

  const getMemberByEns = (ensName: string) => members.find((m) => m.ensName === ensName)

  const steps = [
    { id: "review", label: "Review", icon: CheckCircle },
    { id: "connect", label: "Connect", icon: Wallet },
    { id: "approve", label: "Approve", icon: Shield },
    { id: "confirm", label: "Confirm", icon: Zap },
    { id: "success", label: "Complete", icon: Sparkles },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const handleConnectWallet = async () => {
    setIsProcessing(true)
    // Mock wallet connection
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const mockAddress = "0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e"
    connectWallet(mockAddress)
    setIsProcessing(false)
    setCurrentStep("approve")
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    // Mock approval transaction
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsProcessing(false)
    setCurrentStep("confirm")
  }

  const handleConfirm = async () => {
    setCurrentStep("processing")
    setIsProcessing(true)
    // Mock settlement transaction
    await new Promise((resolve) => setTimeout(resolve, 4000))
    setIsProcessing(false)
    setCurrentStep("success")
    setShowConfetti(true)
  }

  const handleClose = () => {
    setCurrentStep("review")
    setIsProcessing(false)
    setShowConfetti(false)
    onClose()
  }

  const nextStep = () => {
    if (currentStep === "review") {
      if (isWalletConnected) {
        setCurrentStep("approve")
      } else {
        setCurrentStep("connect")
      }
    }
  }

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
                        <span className="text-xl font-bold text-green-800">{formatCurrency(totalAmount)}</span>
                      </div>
                    </motion.div>

                    <Button onClick={nextStep} className="w-full gradient-primary text-white">
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
                    <Button
                      onClick={handleConnectWallet}
                      disabled={isProcessing}
                      className="gradient-primary text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-800">Connected Wallet</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          {shortenAddress(walletAddress || "")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">PYUSD Balance</span>
                        <span className="font-semibold text-blue-900">{formatCurrency(mockPYUSDBalance)}</span>
                      </div>
                    </div>

                    {mockPYUSDBalance < totalAmount && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Insufficient PYUSD Balance</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          You need {formatCurrency(totalAmount - mockPYUSDBalance)} more PYUSD to complete this
                          settlement.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing || mockPYUSDBalance < totalAmount}
                      className="w-full gradient-primary text-white"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving...
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
                        <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Network Fee (Est.)</span>
                        <span className="font-semibold text-gray-900">$0.50</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount + 0.5)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleConfirm}
                      disabled={isProcessing}
                      className="w-full gradient-primary text-white"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Confirm Settlement
                    </Button>
                  </motion.div>
                )}

                {/* Processing Step */}
                {currentStep === "processing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Settlement</h3>
                      <p className="text-gray-600 mb-4">Your transaction is being processed on the blockchain</p>
                      <Progress value={75} className="w-full" />
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
                    </div>
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

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <div className="text-sm text-green-800 mb-2">Transaction Hash</div>
                      <div className="font-mono text-xs text-green-700 break-all">
                        0x1234567890abcdef1234567890abcdef12345678
                      </div>
                    </motion.div>

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
