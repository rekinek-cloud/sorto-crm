'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Stream } from '@/types/gtd';
import { StreamRelation } from '@/lib/api/streamHierarchy';
import StreamHierarchyTree from './StreamHierarchyTree';
import CreateStreamRelationModal from './CreateStreamRelationModal';
import { X } from 'lucide-react';

interface StreamHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream;
}

export default function StreamHierarchyModal({
  isOpen,
  onClose,
  stream
}: StreamHierarchyModalProps) {
  const [showCreateRelation, setShowCreateRelation] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateRelation = (streamId: string) => {
    setShowCreateRelation(true);
  };

  const handleRelationCreated = (relation: StreamRelation) => {
    setShowCreateRelation(false);
    setRefreshKey(prev => prev + 1); // Force refresh hierarchy
  };

  const handleEditRelation = (relationId: string) => {
    // Edycja relacji - w przyszłej wersji
    toast('Edycja relacji będzie dostępna w przyszłej wersji', { icon: 'ℹ️' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: stream.color }}
              ></div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {stream.name} - Hierarchy
                </h2>
                {stream.description && (
                  <p className="text-sm text-gray-600 mt-1">{stream.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Ładowanie hierarchii dla stream: <strong>{stream.name}</strong> (ID: {stream.id})
                </p>
              </div>
              <StreamHierarchyTree
                key={refreshKey}
                streamId={stream.id}
                onCreateRelation={handleCreateRelation}
                onEditRelation={handleEditRelation}
                showPermissions={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Relation Modal */}
      <CreateStreamRelationModal
        isOpen={showCreateRelation}
        onClose={() => setShowCreateRelation(false)}
        currentStreamId={stream.id}
        currentStreamName={stream.name}
        onSuccess={handleRelationCreated}
      />
    </>
  );
}