"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAppStore } from "@/lib/store"
import { generateId } from "@/lib/utils"
import type { Group, Member, Expense } from "@/lib/types"

export default function DemoPage() {
  const router = useRouter()
  const { addGroup } = useAppStore()

  useEffect(() => {
    // Create demo data
    const demoMembers: Member[] = [
      {
        id: generateId(),
        name: "Alice Chen",
        ensName: "alice.eth",
        walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e",
        avatar: "/professional-woman.png",
      },
      {
        id: generateId(),
        name: "Bob Kumar",
        ensName: "bob.eth",
        walletAddress: "0x8ba1f109551bD432803012645Hac136c22C501e5",
        avatar: "/man-developer.png",
      },
      {
        id: generateId(),
        name: "Carol Smith",
        ensName: "carol.eth",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
        avatar: "/woman-designer.png",
      },
      {
        id: generateId(),
        name: "David Park",
        ensName: "david.eth",
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        avatar: "/man-entrepreneur.png",
      },
    ]

    const demoExpenses: Expense[] = [
      {
        id: generateId(),
        description: "Hotel booking for 3 nights",
        amount: 480.0,
        paidBy: demoMembers[0].id,
        splitBetween: demoMembers.map((m) => m.id),
        category: "accommodation",
        date: new Date("2024-01-15"),
      },
      {
        id: generateId(),
        description: "Dinner at Indian restaurant",
        amount: 85.5,
        paidBy: demoMembers[1].id,
        splitBetween: demoMembers.map((m) => m.id),
        category: "food",
        date: new Date("2024-01-15"),
      },
      {
        id: generateId(),
        description: "Uber to airport",
        amount: 45.0,
        paidBy: demoMembers[2].id,
        splitBetween: [demoMembers[2].id, demoMembers[3].id],
        category: "transport",
        date: new Date("2024-01-16"),
      },
      {
        id: generateId(),
        description: "Concert tickets",
        amount: 240.0,
        paidBy: demoMembers[3].id,
        splitBetween: demoMembers.map((m) => m.id),
        category: "entertainment",
        date: new Date("2024-01-16"),
      },
      {
        id: generateId(),
        description: "Breakfast at cafe",
        amount: 32.0,
        paidBy: demoMembers[0].id,
        splitBetween: [demoMembers[0].id, demoMembers[1].id],
        category: "food",
        date: new Date("2024-01-17"),
      },
      {
        id: generateId(),
        description: "Museum entry tickets",
        amount: 60.0,
        paidBy: demoMembers[1].id,
        splitBetween: [demoMembers[1].id, demoMembers[2].id, demoMembers[3].id],
        category: "entertainment",
        date: new Date("2024-01-17"),
      },
      {
        id: generateId(),
        description: "Lunch at food court",
        amount: 48.0,
        paidBy: demoMembers[2].id,
        splitBetween: demoMembers.map((m) => m.id),
        category: "food",
        date: new Date("2024-01-17"),
      },
      {
        id: generateId(),
        description: "Taxi to hotel",
        amount: 28.0,
        paidBy: demoMembers[3].id,
        splitBetween: demoMembers.map((m) => m.id),
        category: "transport",
        date: new Date("2024-01-17"),
      },
    ]

    const demoGroup: Group = {
      id: generateId(),
      name: "ETHGlobal Delhi Trip",
      members: demoMembers,
      expenses: demoExpenses,
      createdAt: new Date("2024-01-15"),
    }

    addGroup(demoGroup)

    // Redirect to the demo group
    router.push(`/group/${demoGroup.id}`)
  }, [addGroup, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Demo...</h1>
          <p className="text-gray-600">Setting up your demo group with sample expenses</p>
        </div>
      </div>
    </div>
  )
}
