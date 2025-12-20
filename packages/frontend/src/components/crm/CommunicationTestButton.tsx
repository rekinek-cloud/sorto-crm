'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface CommunicationTestButtonProps {
  companyId: string;
  onCommunicationAdded?: () => void;
}

export function CommunicationTestButton({ companyId, onCommunicationAdded }: CommunicationTestButtonProps) {
  const [loading, setLoading] = useState(false);

  const createSampleCommunications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/test-communications/seed', {
        companyId: companyId
      });
      
      toast.success(`Created ${response.data.activities?.length || 0} sample communications`);
      
      // Refresh the activities
      if (onCommunicationAdded) {
        onCommunicationAdded();
      }
    } catch (error: any) {
      console.error('Error creating sample communications:', error);
      toast.error('Failed to create sample communications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">Test Communication Features</h3>
          <p className="text-xs text-blue-700">
            Click to create sample email, phone, and SMS activities to test the communication tracking
          </p>
        </div>
        <button
          onClick={createSampleCommunications}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <EnvelopeIcon className="w-4 h-4" />
              <PhoneIcon className="w-4 h-4" />
              <ChatBubbleLeftIcon className="w-4 h-4" />
            </>
          )}
          <span>{loading ? 'Creating...' : 'Add Sample Communications'}</span>
        </button>
      </div>
    </div>
  );
}