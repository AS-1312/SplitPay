"use client"

import type React from "react"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGroup } from "@/app/actions"
import { generateId, validateEnsNameFormat } from "@/lib/utils"
import { useWalletConnection, useEnsValidation } from "@/lib/use-wallet"
import type { Group } from "@/lib/types"
import { X, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (group: Group) => void
}

interface MemberFormData {
  name: string;
  ensName: string;
}

// Custom component for individual member validation
function MemberValidation({ member, currentUserEns, onValidationChange }: {
  member: MemberFormData;
  currentUserEns?: string | null;
  onValidationChange: (validation: { isValid: boolean; isLoading: boolean; error?: string }) => void;
}) {
  const ensValidation = useEnsValidation(member.ensName.trim() || "");
  const prevValidationRef = useRef<{ isValid: boolean; isLoading: boolean; error?: string } | null>(null);

  // Check format first for immediate feedback
  const formatValidation = useMemo(() => {
    if (!member.ensName.trim()) {
      return { isValid: true, error: undefined }; // Empty is OK
    }
    return validateEnsNameFormat(member.ensName);
  }, [member.ensName]);

  // Check if trying to add themselves
  const selfAddCheck = useMemo(() => {
    if (currentUserEns && member.ensName.trim() &&
        member.ensName.toLowerCase().trim() === currentUserEns.toLowerCase()) {
      return { isValid: false, error: "You cannot add yourself to the group" };
    }
    return { isValid: true, error: undefined };
  }, [member.ensName, currentUserEns]);

  // Combine all validations
  const finalValidation = useMemo(() => {
    if (!member.ensName.trim()) {
      return { isValid: true, isLoading: false, error: undefined };
    }

    // Format validation first
    if (!formatValidation.isValid) {
      return { isValid: false, isLoading: false, error: formatValidation.error };
    }

    // Self-add check
    if (!selfAddCheck.isValid) {
      return { isValid: false, isLoading: false, error: selfAddCheck.error };
    }

    // ENS validation (requires network call)
    if (ensValidation.isLoading) {
      return { isValid: false, isLoading: true, error: undefined };
    }

    if (!ensValidation.isValid && ensValidation.error) {
      return { isValid: false, isLoading: false, error: ensValidation.error };
    }

    return { isValid: ensValidation.isValid, isLoading: false, error: undefined };
  }, [formatValidation, selfAddCheck, ensValidation]);

  // Notify parent of validation changes only when they actually change
  useEffect(() => {
    const prev = prevValidationRef.current;
    if (!prev ||
        prev.isValid !== finalValidation.isValid ||
        prev.isLoading !== finalValidation.isLoading ||
        prev.error !== finalValidation.error) {
      prevValidationRef.current = finalValidation;
      onValidationChange(finalValidation);
    }
  }, [finalValidation, onValidationChange]);

  return null; // This component doesn't render anything
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<MemberFormData[]>([{ name: "", ensName: "" }])
  const [isCreating, setIsCreating] = useState(false)
  const [membersValidation, setMembersValidation] = useState<Array<{ isValid: boolean; isLoading: boolean; error?: string }>>([])
  const { address: walletAddress, ensName: currentUserEns, canCreateGroups } = useWalletConnection()

  // Handle validation updates from child components
  const handleValidationChange = useCallback((index: number, validation: { isValid: boolean; isLoading: boolean; error?: string }) => {
    setMembersValidation(prev => {
      const newValidations = [...prev];
      // Only update if the validation actually changed
      if (JSON.stringify(newValidations[index]) !== JSON.stringify(validation)) {
        newValidations[index] = validation;
        return newValidations;
      }
      return prev;
    });
  }, []);

  const addMember = () => {
    setMembers([...members, { name: "", ensName: "" }])
    setMembersValidation([...membersValidation, { isValid: true, isLoading: false }])
  }

  const updateMember = (index: number, field: keyof MemberFormData, value: string) => {
    const updated = [...members]
    updated[index] = { ...updated[index], [field]: value }
    setMembers(updated)
  }

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index))
      setMembersValidation(membersValidation.filter((_, i) => i !== index))
    }
  }

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!groupName.trim()) return false;
    if (!canCreateGroups) return false;

    const validMembers = members.filter((m, index) => {
      return m.name?.trim() && m.ensName?.trim() && membersValidation[index]?.isValid;
    });

    return validMembers.length > 0;
  }, [groupName, members, membersValidation, canCreateGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || isCreating) return

    setIsCreating(true)

    try {
      const validMembers = members.filter((m, index) =>
        m.name?.trim() && m.ensName?.trim() && membersValidation[index]?.isValid
      );

      // Add the current user as the first member
      const allMembers = [
        {
          id: generateId(),
          name: currentUserEns || "You",
          ensName: currentUserEns || "",
          walletAddress: walletAddress || "",
        },
        ...validMembers.map((m) => ({
          id: generateId(),
          name: m.name.trim(),
          ensName: m.ensName.trim(),
          walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`, // Mock address for other members
        }))
      ]

      const newGroup: Group = {
        id: generateId(),
        name: groupName.trim(),
        members: allMembers,
        expenses: [],
        createdAt: new Date(),
      }

      const createdGroup = await createGroup(newGroup)
      onGroupCreated(createdGroup)

      // Reset form
      setGroupName("")
      setMembers([{ name: "", ensName: "" }])
      setMembersValidation([{ isValid: true, isLoading: false }])
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
      // TODO: Show error message to user
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Weekend Trip, Dinner Party"
                  className="mt-1"
                  required
                />
              </div>

              {/* Current User Info */}
              {currentUserEns && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      You'll be added as: {currentUserEns}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    You don't need to add yourself to the member list below.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Members</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMember}
                    className="text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                <div className="space-y-3">
                  {members.map((member, index) => {
                    const validation = membersValidation[index];
                    const hasError = validation && !validation.isValid && member.ensName.trim() !== '';

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <MemberValidation
                          member={member}
                          currentUserEns={currentUserEns}
                          onValidationChange={(validation: { isValid: boolean; isLoading: boolean; error?: string }) =>
                            handleValidationChange(index, validation)}
                        />
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <Input
                              placeholder="Name"
                              value={member.name || ""}
                              onChange={(e) => updateMember(index, "name", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex-1 relative">
                            <Input
                              placeholder="ENS (alice.eth)"
                              value={member.ensName || ""}
                              onChange={(e) => updateMember(index, "ensName", e.target.value)}
                              className={`text-sm pr-8 ${hasError ? 'border-red-300 focus:border-red-500' :
                                validation?.isValid && member.ensName.trim() ? 'border-green-300 focus:border-green-500' : ''}`}
                            />
                            {member.ensName.trim() && validation && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                {validation.isLoading ? (
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : validation.isValid ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {members.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {hasError && validation?.error && (
                          <p className="text-xs text-red-600 ml-1">
                            {validation.error}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isCreating}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white"
                  disabled={isCreating || !isFormValid}
                  title={!isFormValid ? 'Please add at least one valid member with a valid ENS name' : ''}
                >
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
