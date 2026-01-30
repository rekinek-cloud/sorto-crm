'use client';

import React from 'react';
import { InformationCircleIcon, CpuChipIcon, ServerIcon, CodeBracketIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function InfoPage() {
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <InformationCircleIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informacje o systemie</h1>
          <p className="text-sm text-gray-600">Szczegóły techniczne i wersja aplikacji</p>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <CpuChipIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">STREAMS</h2>
            <p className="text-gray-600">Platforma produktywności i zarządzania strumieniami pracy</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-500">Wersja</div>
            <div className="text-lg font-semibold text-gray-900">1.0.0</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-gray-500">Metodologia</div>
            <div className="text-lg font-semibold text-gray-900">SORTO STREAMS</div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CodeBracketIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Stack technologiczny</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <div>
              <div className="font-medium">Next.js 14</div>
              <div className="text-sm text-gray-500">App Router</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">TS</div>
            <div>
              <div className="font-medium">TypeScript</div>
              <div className="text-sm text-gray-500">Type Safety</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <div>
              <div className="font-medium">Tailwind CSS</div>
              <div className="text-sm text-gray-500">Styling</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <div>
              <div className="font-medium">Node.js</div>
              <div className="text-sm text-gray-500">Backend</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">PG</div>
            <div>
              <div className="font-medium">PostgreSQL</div>
              <div className="text-sm text-gray-500">Database</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <div>
              <div className="font-medium">Redis</div>
              <div className="text-sm text-gray-500">Cache</div>
            </div>
          </div>
        </div>
      </div>

      {/* Server Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ServerIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Informacje o serwerze</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Frontend</span>
            <span className="font-medium">Port 9025</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Backend API</span>
            <span className="font-medium">Port 3004</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Database</span>
            <span className="font-medium">PostgreSQL 14</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Cache</span>
            <span className="font-medium">Redis 7</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bezpieczeństwo</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Wszystkie połączenia są szyfrowane (HTTPS/TLS)</span>
        </div>
      </div>
    </div>
  );
}
