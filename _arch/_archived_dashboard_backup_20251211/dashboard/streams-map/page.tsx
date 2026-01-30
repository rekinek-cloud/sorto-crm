'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { streamsApi, StreamStats } from '@/lib/api/streams';
import { Stream } from '@/types/gtd';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  TreeStructure,
  Waves,
  Snowflake,
  Lightning,
  CheckCircle,
  Circle,
  ArrowRight,
  FunnelSimple,
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  Folder,
  ListChecks,
  Eye,
  PencilSimple,
  Plus,
  House,
  Target,
  Clock,
  Fire,
} from 'phosphor-react';

interface StreamNode {
  stream: Stream;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  children: StreamNode[];
}

export default function StreamsMapPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'flow' | 'grid'>('flow');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLOWING' | 'FROZEN'>('ALL');
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(new Set());
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [streamsResponse, statsResponse] = await Promise.all([
        streamsApi.getStreams({ limit: 100 }),
        streamsApi.getStreamStats(),
      ]);
      setStreams(streamsResponse.streams);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading streams:', error);
      toast.error('Nie udalo sie zaladowac strumieni');
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = useMemo(() => {
    return streams.filter((stream) => {
      const matchesSearch =
        !searchTerm ||
        stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stream.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'FLOWING' && (stream.status === 'ACTIVE' || stream.status === 'FLOWING')) ||
        (statusFilter === 'FROZEN' && (stream.status === 'FROZEN' || stream.status === 'ARCHIVED'));

      return matchesSearch && matchesStatus;
    });
  }, [streams, searchTerm, statusFilter]);

  const flowingStreams = useMemo(
    () => filteredStreams.filter((s) => s.status === 'ACTIVE' || s.status === 'FLOWING'),
    [filteredStreams]
  );

  const frozenStreams = useMemo(
    () => filteredStreams.filter((s) => s.status === 'FROZEN' || s.status === 'ARCHIVED'),
    [filteredStreams]
  );

  const toggleExpand = (streamId: string) => {
    setExpandedStreams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(streamId)) {
        newSet.delete(streamId);
      } else {
        newSet.add(streamId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'FLOWING':
        return <Waves size={16} weight="duotone" className="text-blue-500" />;
      case 'FROZEN':
      case 'ARCHIVED':
        return <Snowflake size={16} weight="duotone" className="text-slate-400" />;
      default:
        return <Circle size={16} weight="duotone" className="text-gray-400" />;
    }
  };

  const getStreamColor = (stream: Stream) => {
    if (stream.color) return stream.color;
    switch (stream.status) {
      case 'ACTIVE':
      case 'FLOWING':
        return '#3B82F6';
      case 'FROZEN':
      case 'ARCHIVED':
        return '#94A3B8';
      default:
        return '#6B7280';
    }
  };

  const StreamCard = ({ stream, compact = false }: { stream: Stream; compact?: boolean }) => {
    const isExpanded = expandedStreams.has(stream.id);
    const color = getStreamColor(stream);
    const taskCount = (stream as any)._count?.tasks || 0;
    const projectCount = (stream as any)._count?.projects || 0;

    return (
      <div
        className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
          selectedStream?.id === stream.id ? 'ring-2 ring-primary-500' : ''
        }`}
        style={{ borderColor: color + '40' }}
        onClick={() => setSelectedStream(stream)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                {stream.status === 'FROZEN' || stream.status === 'ARCHIVED' ? (
                  <Snowflake size={20} weight="duotone" style={{ color }} />
                ) : (
                  <Waves size={20} weight="duotone" style={{ color }} />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{stream.name}</h3>
                {!compact && stream.description && (
                  <p className="text-sm text-gray-500 line-clamp-1">{stream.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(stream.id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <CaretDown size={16} className="text-gray-400" />
              ) : (
                <CaretRight size={16} className="text-gray-400" />
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <ListChecks size={14} weight="duotone" />
              <span>{taskCount} zadan</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Folder size={14} weight="duotone" />
              <span>{projectCount} projektow</span>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Link
                  href={`/crm/dashboard/streams/${stream.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye size={14} weight="duotone" />
                  Szczegoly
                </Link>
                <Link
                  href={`/crm/dashboard/tasks?streamId=${stream.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListChecks size={14} weight="duotone" />
                  Zadania
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <TreeStructure size={48} weight="duotone" className="text-primary-600 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TreeStructure size={28} weight="duotone" className="text-primary-600" />
            Mapa strumieni
          </h1>
          <p className="text-gray-600 mt-1">Wizualizacja przepływu pracy i strumieni</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/dashboard/streams"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Waves size={16} weight="duotone" />
            Lista strumieni
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Waves size={20} weight="duotone" className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Wszystkie</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalStreams}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Lightning size={20} weight="duotone" className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Plynace</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeStreams}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Snowflake size={20} weight="duotone" className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Zamrozone</p>
                <p className="text-xl font-bold text-gray-900">{stats.archivedStreams}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ListChecks size={20} weight="duotone" className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Zadania</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Szukaj strumieni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelSimple size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">Wszystkie statusy</option>
              <option value="FLOWING">Plynace</option>
              <option value="FROZEN">Zamrozone</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('flow')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'flow'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Flow
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tree
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {viewMode === 'flow' && (
        <div className="space-y-8">
          {/* STREAMS Flow Diagram */}
          <Card className="p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Waves size={20} weight="duotone" className="text-primary-600" />
              Przeplyw STREAMS
            </h2>

            {/* Flow visualization */}
            <div className="flex items-start justify-between gap-4 min-w-[800px]">
              {/* Source */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
                  <Circle size={40} weight="duotone" className="text-amber-600" />
                </div>
                <span className="mt-2 font-semibold text-gray-700">Zrodlo</span>
                <span className="text-xs text-gray-500">Zbieranie</span>
              </div>

              <ArrowRight size={32} className="text-gray-300 mt-10" />

              {/* Flowing Streams */}
              <div className="flex-1">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Waves size={20} weight="duotone" className="text-blue-600" />
                    <span className="font-semibold text-blue-900">Plynace strumienie</span>
                    <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">
                      {flowingStreams.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {flowingStreams.slice(0, 4).map((stream) => (
                      <div
                        key={stream.id}
                        className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedStream(stream)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: getStreamColor(stream) + '20' }}
                          >
                            <Waves
                              size={14}
                              weight="duotone"
                              style={{ color: getStreamColor(stream) }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {stream.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {flowingStreams.length > 4 && (
                      <Link
                        href="/crm/dashboard/streams?status=FLOWING"
                        className="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-sm">+{flowingStreams.length - 4} wiecej</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <ArrowRight size={32} className="text-gray-300 mt-10" />

              {/* Tasks */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center shadow-lg border-2 border-green-300">
                  <CheckCircle size={40} weight="duotone" className="text-green-600" />
                </div>
                <span className="mt-2 font-semibold text-gray-700">Zadania</span>
                <span className="text-xs text-gray-500">Wykonanie</span>
              </div>
            </div>

            {/* Frozen streams below */}
            {frozenStreams.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Snowflake size={20} weight="duotone" className="text-slate-500" />
                    <span className="font-semibold text-slate-700">Zamrozone strumienie</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">
                      {frozenStreams.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {frozenStreams.slice(0, 4).map((stream) => (
                      <div
                        key={stream.id}
                        className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => setSelectedStream(stream)}
                      >
                        <div className="flex items-center gap-2">
                          <Snowflake size={14} weight="duotone" className="text-slate-400" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {stream.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Selected Stream Details */}
          {selectedStream && (
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: getStreamColor(selectedStream) + '20' }}
                  >
                    {selectedStream.status === 'FROZEN' || selectedStream.status === 'ARCHIVED' ? (
                      <Snowflake
                        size={28}
                        weight="duotone"
                        style={{ color: getStreamColor(selectedStream) }}
                      />
                    ) : (
                      <Waves
                        size={28}
                        weight="duotone"
                        style={{ color: getStreamColor(selectedStream) }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedStream.name}</h3>
                    {selectedStream.description && (
                      <p className="text-gray-600 mt-1">{selectedStream.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/crm/dashboard/streams/${selectedStream.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Eye size={16} weight="duotone" />
                    Otworz strumien
                  </Link>
                  <button
                    onClick={() => setSelectedStream(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <ListChecks size={16} weight="duotone" />
                    <span className="text-sm">Zadania</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedStream as any)._count?.tasks || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Folder size={16} weight="duotone" />
                    <span className="text-sm">Projekty</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(selectedStream as any)._count?.projects || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    {getStatusIcon(selectedStream.status)}
                    <span className="text-sm">Status</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedStream.status === 'ACTIVE' || selectedStream.status === 'FLOWING'
                      ? 'Plynacy'
                      : 'Zamrozony'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock size={16} weight="duotone" />
                    <span className="text-sm">Utworzony</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedStream.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStreams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
          {filteredStreams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Waves size={48} weight="duotone" className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nie znaleziono strumieni</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'tree' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TreeStructure size={20} weight="duotone" className="text-primary-600" />
            Struktura drzewa
          </h2>

          <div className="space-y-2">
            {/* Root node */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <House size={20} weight="duotone" className="text-gray-600" />
              <span className="font-semibold text-gray-900">Organizacja</span>
            </div>

            {/* Flowing streams branch */}
            <div className="ml-6 border-l-2 border-blue-200 pl-4 space-y-2">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg -ml-6 border-l-4 border-blue-500">
                <Waves size={20} weight="duotone" className="text-blue-600" />
                <span className="font-semibold text-blue-900">Plynace strumienie</span>
                <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs">
                  {flowingStreams.length}
                </span>
              </div>

              {flowingStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedStream(stream)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStreamColor(stream) }}
                  />
                  <span className="text-sm text-gray-900">{stream.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {(stream as any)._count?.tasks || 0} zadan
                  </span>
                </div>
              ))}
            </div>

            {/* Frozen streams branch */}
            {frozenStreams.length > 0 && (
              <div className="ml-6 border-l-2 border-slate-200 pl-4 space-y-2 mt-4">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg -ml-6 border-l-4 border-slate-400">
                  <Snowflake size={20} weight="duotone" className="text-slate-500" />
                  <span className="font-semibold text-slate-700">Zamrozone strumienie</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">
                    {frozenStreams.length}
                  </span>
                </div>

                {frozenStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors opacity-75"
                    onClick={() => setSelectedStream(stream)}
                  >
                    <Snowflake size={12} weight="duotone" className="text-slate-400" />
                    <span className="text-sm text-gray-700">{stream.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(stream as any)._count?.tasks || 0} zadan
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Circle size={16} weight="duotone" className="text-amber-500" />
            <span className="text-sm text-gray-600">Zrodlo - zbieranie informacji</span>
          </div>
          <div className="flex items-center gap-2">
            <Waves size={16} weight="duotone" className="text-blue-500" />
            <span className="text-sm text-gray-600">Plynacy strumien - aktywna praca</span>
          </div>
          <div className="flex items-center gap-2">
            <Snowflake size={16} weight="duotone" className="text-slate-400" />
            <span className="text-sm text-gray-600">Zamrozony strumien - wstrzymany</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} weight="duotone" className="text-green-500" />
            <span className="text-sm text-gray-600">Zadania - wykonanie akcji</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
