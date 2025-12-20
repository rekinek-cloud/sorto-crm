'use client';

import React, { useEffect, useState } from 'react';
import { PauseCircleIcon, RectangleStackIcon, PlayIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { streamsApi } from '@/lib/api/streams';
import { Stream } from '@/types/gtd';
import { toast } from 'react-hot-toast';

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
      toast.error('Nie udało się załadować zamrożonych strumieni');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async (streamId: string) => {
    try {
      await streamsApi.updateStream(streamId, { status: 'ACTIVE' });
      toast.success('Strumień został odmrożony');
      loadFrozenStreams();
    } catch (error: any) {
      console.error('Error unfreezing stream:', error);
      toast.error('Nie udało się odmrozić strumienia');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PauseCircleIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zamrożone Strumienie</h1>
            <p className="text-sm text-gray-600">Strumienie wstrzymane lub odłożone na później</p>
          </div>
        </div>
        <Link
          href="/dashboard/streams"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RectangleStackIcon className="h-4 w-4" />
          Wszystkie strumienie
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <PauseCircleIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Stan FROZEN</h2>
            <p className="text-gray-700">
              Zamrożone strumienie to te, które zostały tymczasowo wstrzymane. Możesz je odmrozić
              w każdej chwili, gdy będziesz gotowy do kontynuacji pracy.
            </p>
          </div>
        </div>
      </div>

      {/* Streams List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : frozenStreams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <PauseCircleIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak zamrożonych strumieni</h3>
            <p className="text-gray-600 max-w-md">
              Wszystkie Twoje strumienie są aktywne. Możesz zamrozić strumień, gdy chcesz go tymczasowo wstrzymać.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {frozenStreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stream.color }}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{stream.name}</h3>
                    {stream.description && (
                      <p className="text-sm text-gray-600">{stream.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUnfreeze(stream.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Odmroź
                  </button>
                  <Link
                    href={`/dashboard/streams/${stream.id}`}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Szczegóły
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
