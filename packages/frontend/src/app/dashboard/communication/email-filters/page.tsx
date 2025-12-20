'use client';

import React, { useEffect } from 'react';
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function EmailFiltersPage() {
  // Auto redirect to Rules Manager with EMAIL_FILTER tab
  useEffect(() => {
    window.location.href = '/dashboard/rules-manager/';
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Filtry Email</h1>
          <p className="text-gray-600">
            Zarządzanie filtrami email zostało przeniesione do zunifikowanego Rules Manager
          </p>
        </div>
      </div>

      {/* Redirect Info */}
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <EnvelopeIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtry Email</h3>
        <p className="text-gray-600 mb-6">
          Filtry email zostały zintegrowane z zunifikowanym systemem reguł.<br/>
          Przekierowujemy Cię do Rules Manager → zakładka "Filtry Email"
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