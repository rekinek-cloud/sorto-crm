'use client';

import React from 'react';
import { LinkIcon, CalendarIcon, EnvelopeIcon, CircleStackIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  connected: boolean;
  category: 'communication' | 'calendar' | 'storage' | 'development';
}

const integrations: Integration[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Drive',
    icon: 'G',
    iconColor: 'text-red-500 bg-red-50',
    connected: false,
    category: 'communication',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    description: 'Outlook, Teams, OneDrive',
    icon: 'M',
    iconColor: 'text-blue-500 bg-blue-50',
    connected: false,
    category: 'communication',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Powiadomienia i komendy',
    icon: 'S',
    iconColor: 'text-purple-500 bg-purple-50',
    connected: false,
    category: 'communication',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Issues i Pull Requests',
    icon: 'GH',
    iconColor: 'text-gray-800 bg-gray-100',
    connected: false,
    category: 'development',
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <LinkIcon className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integracje</h1>
          <p className="text-sm text-gray-600">Połącz swoje ulubione narzędzia</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Zwiększ produktywność</h2>
        <p className="text-gray-700">
          Połącz swoje narzędzia pracy, aby automatycznie synchronizować zadania,
          otrzymywać powiadomienia i mieć wszystko w jednym miejscu.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg font-bold text-lg ${integration.iconColor}`}>
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </div>
              <div>
                {integration.connected ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    <CheckIcon className="h-3 w-3" />
                    Połączono
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    <XMarkIcon className="h-3 w-3" />
                    Niepołączono
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <button
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  integration.connected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {integration.connected ? 'Rozłącz' : 'Połącz'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wkrótce dostępne</h2>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex justify-center gap-4 mb-4">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <EnvelopeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <CircleStackIcon className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-600">
            Pracujemy nad nowymi integracjami z popularnymi narzędziami.
          </p>
        </div>
      </div>
    </div>
  );
}
