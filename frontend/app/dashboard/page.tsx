"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { GroupCard } from "@/components/group-card";
import { CreateGroupModal } from "@/components/create-group-modal";
import { QuickStats } from "@/components/quick-stats";
import { Button } from "@/components/ui/button";
import { getAllGroups } from "@/app/actions";
import { calculateGroupBalances } from "@/lib/api";
import { Plus, Users, TrendingUp } from "lucide-react";
import type { Group } from "@/lib/types";

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch groups from MongoDB using server actions
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const fetchedGroups = await getAllGroups();
        setGroups(fetchedGroups);
        setError(null);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Handle group creation
  const handleGroupCreated = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  // Handle group exit
  const handleGroupExited = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  // For demo purposes, assume first member is current user
  const getCurrentUserId = (group: Group) => {
    return group.members.length > 0 ? group.members[0].id : undefined;
  };

  // Calculate user stats
  const stats = useMemo(() => {
    let totalOwed = 0;
    let totalToReceive = 0;

    groups.forEach((group) => {
      const balances = calculateGroupBalances(group);
      // For demo purposes, assume first member is current user
      const userBalance = Object.values(balances)[0] || 0;

      if (userBalance < 0) {
        totalOwed += -userBalance;
      } else if (userBalance > 0) {
        totalToReceive += userBalance;
      }
    });

    return {
      totalOwed,
      totalToReceive,
      totalGroups: groups.length,
    };
  }, [groups]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Manage your groups and track expenses
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Quick Stats */}
        <QuickStats
          totalOwed={stats.totalOwed}
          totalToReceive={stats.totalToReceive}
          totalGroups={stats.totalGroups}
        />

        {/* Groups Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Your Groups</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No groups yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first group to start splitting expenses with friends
                and family.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gradient-primary text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, index) => {
                const balances = calculateGroupBalances(group);
                const userBalance = Object.values(balances)[0] || 0;
                const currentUserId = getCurrentUserId(group);

                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    userBalance={userBalance}
                    delay={index * 0.1}
                    currentUserId={currentUserId}
                    onGroupExited={handleGroupExited}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {groups.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>

            <div className="gradient-card rounded-xl p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Activity Feed Coming Soon
                </h3>
                <p className="text-gray-600">
                  Track recent expenses, settlements, and group updates here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          size="lg"
          className="gradient-primary text-white rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
