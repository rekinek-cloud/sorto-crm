'use client';

import React, { useState } from 'react';
import { UserWithHierarchy } from '@/lib/api/userHierarchy';
import UserHierarchyTree from './UserHierarchyTree';
import CreateUserRelationModal from './CreateUserRelationModal';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UserHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithHierarchy;
}

export default function UserHierarchyModal({
  isOpen,
  onClose,
  user
}: UserHierarchyModalProps) {
  const [showCreateRelation, setShowCreateRelation] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateRelation = (userId: string) => {
    setShowCreateRelation(true);
  };

  const handleRelationCreated = (relation: any) => {
    setShowCreateRelation(false);
    setRefreshKey(prev => prev + 1); // Force refresh hierarchy
  };

  const handleEditRelation = (relationId: string) => {
    // TODO: Implement edit relation modal
    console.log('Edit relation:', relationId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName} - Hierarchia
                </h2>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-6">
              <UserHierarchyTree
                key={refreshKey}
                userId={user.id}
                onCreateRelation={handleCreateRelation}
                onEditRelation={handleEditRelation}
                showPermissions={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Relation Modal */}
      {showCreateRelation && (
        <CreateUserRelationModal
          isOpen={showCreateRelation}
          onClose={() => setShowCreateRelation(false)}
          currentUserId={user.id}
          currentUserName={`${user.firstName} ${user.lastName}`}
          onSuccess={handleRelationCreated}
        />
      )}
    </>
  );
}