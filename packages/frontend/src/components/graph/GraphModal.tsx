'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RelationshipGraph } from './RelationshipGraph';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: 'project' | 'task' | 'contact' | 'company' | 'deal' | 'stream';
  entityName: string;
}

export function GraphModal({ isOpen, onClose, entityId, entityType, entityName }: GraphModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-7xl mx-4 max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Mapa Powiązań: {entityName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Interaktywna wizualizacja relacji i zależności
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <RelationshipGraph
                entityId={entityId}
                entityType={entityType}
                depth={2}
                onNodeClick={(node) => {
                  // Optionally handle node clicks in modal
                  console.log('Clicked node in modal:', node);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}