"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGroup } from "@/app/actions"
import { generateId } from "@/lib/utils"
import type { Group, Member } from "@/lib/types"
import { X, Plus } from "lucide-react"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (group: Group) => void
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<Partial<Member>[]>([{ name: "", ensName: "" }])
  const [isCreating, setIsCreating] = useState(false)

  const addMember = () => {
    setMembers([...members, { name: "", ensName: "" }])
  }

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members]
    updated[index] = { ...updated[index], [field]: value }
    setMembers(updated)
  }

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupName.trim() || isCreating) return

    const validMembers = members.filter((m) => m.name?.trim() && m.ensName?.trim())
    if (validMembers.length === 0) return

    setIsCreating(true)

    try {
      const newGroup: Group = {
        id: generateId(),
        name: groupName.trim(),
        members: validMembers.map((m) => ({
          id: generateId(),
          name: m.name!.trim(),
          ensName: m.ensName!.trim(),
          walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock address
        })),
        expenses: [],
        createdAt: new Date(),
      }

      const createdGroup = await createGroup(newGroup)
      onGroupCreated(createdGroup)

      // Reset form
      setGroupName("")
      setMembers([{ name: "", ensName: "" }])
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
                  {members.map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Name"
                          value={member.name || ""}
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="ENS (alice.eth)"
                          value={member.ensName || ""}
                          onChange={(e) => updateMember(index, "ensName", e.target.value)}
                          className="text-sm"
                        />
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
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gradient-primary text-white" disabled={isCreating}>
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
