"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { exitGroup } from "@/app/actions";
import type { Group } from "@/lib/types";
import { X, AlertTriangle } from "lucide-react";

interface ExitGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUserId: string;
  onGroupExited: (groupId: string) => void;
}

export function ExitGroupModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onGroupExited,
}: ExitGroupModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = group.members.find(member => member.id === currentUserId);

  const handleExitGroup = async () => {
    if (!currentUser || isExiting) return;

    setIsExiting(true);
    setError(null);

    try {
      const result = await exitGroup(group.id, currentUserId);

      if (result === null) {
        // Group was deleted because no members left
        onGroupExited(group.id);
      } else {
        // Group still exists, just user left
        onGroupExited(group.id);
      }

      onClose();
    } catch (err) {
      console.error("Error exiting group:", err);
      setError(err instanceof Error ? err.message : "Failed to exit group");
    } finally {
      setIsExiting(false);
    }
  };

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
            className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Exit Group</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isExiting}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to exit "<strong>{group.name}</strong>"?
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Before you exit:</p>
                    <ul className="space-y-1 text-yellow-700">
                      <li>• Make sure all your expenses are settled</li>
                      <li>• You won't be able to rejoin without an invitation</li>
                      <li>• If you're the last member, the group will be deleted</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
                disabled={isExiting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExitGroup}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isExiting}
              >
                {isExiting ? "Exiting..." : "Exit Group"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}