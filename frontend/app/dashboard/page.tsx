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
import { useWalletConnection } from "@/lib/use-wallet";
import { Plus, Users, TrendingUp } from "lucide-react";
import type { Group } from "@/lib/types";

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const {
    address: walletAddress,
    isConnected,
    ensName,
    hasEnsName,
    canCreateGroups,
    isOnCorrectNetwork,
    switchToSepolia
  } = useWalletConnection();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Get current user ID based on ENS name (primary) or wallet address (fallback)
  const getCurrentUserId = (group: Group) => {
    if (!walletAddress) return undefined;

    // First try to match by ENS name if available
    if (ensName) {
      const memberByEns = group.members.find(m =>
        m.ensName && m.ensName.toLowerCase() === ensName.toLowerCase()
      );
      if (memberByEns) return memberByEns.id;
    }

    // Fallback to wallet address matching
    const memberByAddress = group.members.find(m =>
      m.walletAddress && m.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    return memberByAddress?.id;
  };

  // Check if current user is a member of the group
  const isUserMemberOfGroup = (group: Group) => {
    return getCurrentUserId(group) !== undefined;
  };

  // Filter groups to only show ones the current user is a member of
  const userGroups = useMemo(() => {
    if (!walletAddress) return [];
    return groups.filter(isUserMemberOfGroup);
  }, [groups, walletAddress, ensName]);

  // Calculate user stats
  const stats = useMemo(() => {
    let totalOwed = 0;
    let totalToReceive = 0;

    if (walletAddress) {
      userGroups.forEach((group) => {
        const balances = calculateGroupBalances(group);
        const currentUserId = getCurrentUserId(group);
        const userBalance = currentUserId ? balances[currentUserId] || 0 : 0;

        if (userBalance < 0) {
          totalOwed += -userBalance;
        } else if (userBalance > 0) {
          totalToReceive += userBalance;
        }
      });
    }

    return {
      totalOwed,
      totalToReceive,
      totalGroups: userGroups.length,
    };
  }, [userGroups, walletAddress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show loading state during hydration */}
        {!mounted && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {/* Wallet Connection Required */}
        {mounted && !isConnected && (
          <div className="text-center py-12 mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your crypto wallet to start creating groups and managing shared expenses.
            </p>
          </div>
        )}

        {/* Network Requirement */}
        {mounted && isConnected && !isOnCorrectNetwork && (
          <div className="text-center py-12 mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Switch to Sepolia Testnet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              SplitPay requires Sepolia testnet for ENS name validation. Please switch networks to continue.
            </p>
            <Button
              onClick={switchToSepolia}
              className="gradient-primary text-white"
            >
              Switch to Sepolia
            </Button>
          </div>
        )}

        {/* ENS Requirement */}
        {mounted && isConnected && isOnCorrectNetwork && !hasEnsName && (
          <div className="text-center py-12 mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ENS Name Required
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You need an ENS name (like yourname.eth) to create groups and manage expenses.
              Get one at <a href="https://app.ens.domains" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">app.ens.domains</a>
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your current wallet address: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
            </p>
          </div>
        )}

        {mounted && isConnected && isOnCorrectNetwork && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">
                  {hasEnsName ? `Welcome, ${ensName}` : 'Manage your groups and track expenses'}
                </p>
              </div>

              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gradient-primary text-white"
                disabled={!canCreateGroups}
                title={!canCreateGroups ? 'ENS name required to create groups' : ''}
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
          ) : userGroups.length === 0 ? (
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
                disabled={!canCreateGroups}
                title={!canCreateGroups ? 'ENS name required to create groups' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups.map((group, index) => {
                const balances = calculateGroupBalances(group);
                const currentUserId = getCurrentUserId(group);
                const userBalance = currentUserId ? balances[currentUserId] || 0 : 0;

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
            {userGroups.length > 0 && (
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

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-6 right-6 md:hidden">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="lg"
                className="gradient-primary text-white rounded-full w-14 h-14 shadow-lg"
                disabled={!canCreateGroups}
                title={!canCreateGroups ? 'ENS name required to create groups' : ''}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>

            <CreateGroupModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onGroupCreated={handleGroupCreated}
            />
          </>
        )}
      </div>
    </div>
  );
}
