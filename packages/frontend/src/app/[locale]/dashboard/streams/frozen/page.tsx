'use client';

import React, { useEffect, useState } from 'react';
import { PauseCircle, Layers, Play } from 'lucide-react';
import Link from 'next/link';
import { streamsApi } from '@/lib/api/streams';
import { Stream } from '@/types/gtd';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

export default function FrozenStreamsPage() {
  const [frozenStreams, setFrozenStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFrozenStreams();
  }, []);

  const loadFrozenStreams = async () => {
    try {
      setLoading(true);
      const response = await streamsApi.getStreams({ status: 'FROZEN' });
      setFrozenStreams(response.streams || []);
    } catch (error: any) {
      console.error('Error loading frozen streams:', error);
      toast.error('Nie udalo sie zaladowac zamrozonych strumieni');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async (streamId: string) => {
    try {
      await streamsApi.updateStream(streamId, { status: 'ACTIVE' });
      toast.success('Strumien zostal odmrozony');
      loadFrozenStreams();
    } catch (error: any) {
      console.error('Error unfreezing stream:', error);
      toast.error('Nie udalo sie odmrozic strumienia');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Zamrozone Strumienie"
        subtitle="Strumienie wstrzymane lub odlozone na pozniej"
        icon={PauseCircle}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Strumienie', href: '/dashboard/streams' },
          { label: 'Zamrozone' },
        ]}
        actions={
          <Link
            href="/dashboard/streams"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <Layers className="h-4 w-4" />
            Wszystkie strumienie
          </Link>
        }
      />

      {/* Info Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <PauseCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Stan FROZEN</h2>
            <p className="text-slate-700 dark:text-slate-300">
              Zamrozone strumienie to te, ktore zostaly tymczasowo wstrzymane. Mozesz je odmrozic
              w kazdej chwili, gdy bedziesz gotowy do kontynuacji pracy.
            </p>
          </div>
        </div>
      </div>

      {/* Streams List */}
      {loading ? (
        <SkeletonPage />
      ) : frozenStreams.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
              <PauseCircle className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak zamrozonych strumieni</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Wszystkie Twoje strumienie sa aktywne. Mozesz zamrozic strumien, gdy chcesz go tymczasowo wstrzymac.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {frozenStreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stream.color }}
                  />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{stream.name}</h3>
                    {stream.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{stream.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUnfreeze(stream.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Odmroz
                  </button>
                  <Link
                    href={`/dashboard/streams/${stream.id}`}
                    className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Szczegoly
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
