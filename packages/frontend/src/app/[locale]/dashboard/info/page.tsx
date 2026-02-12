'use client';

import React from 'react';
import { Info, Cpu, Server, Code, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InfoPage() {
  return (
    <PageShell>
      <PageHeader
        title="Informacje o systemie"
        subtitle="Szczegoly techniczne i wersja aplikacji"
        icon={Info}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Informacje o systemie' },
        ]}
      />

      {/* App Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Cpu className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">STREAMS</h2>
            <p className="text-slate-600 dark:text-slate-400">Platforma produktywnosci i zarzadzania strumieniami pracy</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">Wersja</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">1.0.0</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">Metodologia</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">SORTO STREAMS</div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Stack technologiczny</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Next.js 14</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">App Router</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">TS</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">TypeScript</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Type Safety</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Tailwind CSS</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Styling</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Node.js</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Backend</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">PG</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">PostgreSQL</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Database</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">Redis</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Cache</div>
            </div>
          </div>
        </div>
      </div>

      {/* Server Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Informacje o serwerze</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Frontend</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Port 9025</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Backend API</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Port 3004</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-400">Database</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">PostgreSQL 14</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600 dark:text-slate-400">Cache</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Redis 7</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bezpieczenstwo</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <ShieldCheck className="h-5 w-5" />
          <span>Wszystkie polaczenia sa szyfrowane (HTTPS/TLS)</span>
        </div>
      </div>
    </PageShell>
  );
}
