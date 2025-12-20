'use client';

import { InboxStats as InboxStatsType } from '@/lib/api/gtd';

interface InboxStatsProps {
  stats: InboxStatsType;
}

export default function InboxStats({ stats }: InboxStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Unprocessed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUnprocessed}</p>
          </div>
          <div className="text-3xl">📥</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Urgent Items</p>
            <p className="text-2xl font-bold text-red-600">{stats.urgentItems}</p>
          </div>
          <div className="text-3xl">🚨</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Processed Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.processedToday}</p>
          </div>
          <div className="text-3xl">✅</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Processing Rate</p>
            <p className="text-2xl font-bold text-blue-600">{stats.processingRate}%</p>
          </div>
          <div className="text-3xl">📊</div>
        </div>
      </div>
    </div>
  );
}