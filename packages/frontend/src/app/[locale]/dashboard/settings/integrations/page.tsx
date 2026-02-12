'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { Link, Calendar, Mail, Database, Check, X } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
    iconColor: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    connected: false,
    category: 'communication',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365',
    description: 'Outlook, Teams, OneDrive',
    icon: 'M',
    iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    connected: false,
    category: 'communication',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Powiadomienia i komendy',
    icon: 'S',
    iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    connected: false,
    category: 'communication',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Issues i Pull Requests',
    icon: 'GH',
    iconColor: 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700',
    connected: false,
    category: 'development',
  },
];

export default function IntegrationsSettingsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Integracje"
        subtitle="Połącz swoje ulubione narzędzia"
        icon={Link}
        iconColor="text-green-600"
        breadcrumbs={[{ label: 'Ustawienia', href: '/dashboard/settings' }, { label: 'Integracje' }]}
      />

      {/* Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/30 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Zwiększ produktywność</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Połącz swoje narzędzia pracy, aby automatycznie synchronizować zadania,
          otrzymywać powiadomienia i mieć wszystko w jednym miejscu.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg font-bold text-lg ${integration.iconColor}`}>
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{integration.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{integration.description}</p>
                </div>
              </div>
              <div>
                {integration.connected ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                    <Check className="h-3 w-3" />
                    Połączono
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs">
                    <X className="h-3 w-3" />
                    Niepołączono
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => toast(`Integracja z ${integration.name} - wkrótce dostępna`)}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  integration.connected
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Wkrótce dostępne</h2>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="flex justify-center gap-4 mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Mail className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Database className="h-6 w-6 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Pracujemy nad nowymi integracjami z popularnymi narzędziami.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
