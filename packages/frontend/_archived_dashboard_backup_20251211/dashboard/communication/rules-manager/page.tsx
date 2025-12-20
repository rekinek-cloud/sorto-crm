'use client';

import React, { useEffect } from 'react';
import { Cog6ToothIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CommunicationRulesManagerRedirect() {
  // Auto redirect to new Rules Manager location
  useEffect(() => {
    window.location.href = '/crm/dashboard/rules-manager/';
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Cog6ToothIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules Manager</h3>
        <p className="text-gray-600 mb-6">
          Strona została przeniesiona do nowej lokalizacji
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <span>Przekierowanie...</span>
          <ArrowRightIcon className="w-5 h-5" />
          <span>Rules Manager</span>
        </div>
      </div>
    </div>
  );
}