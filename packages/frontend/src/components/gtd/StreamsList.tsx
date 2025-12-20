'use client';

import React, { useState, useEffect } from 'react';
import { Stream } from '@/types/gtd';
import StreamItem from './StreamItem';
import StreamForm from './StreamForm';
import { streamsApi } from '@/lib/api/streams';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface StreamsListProps {
  showCreateForm?: boolean;
  onStreamSelect?: (stream: Stream) => void;
}

export default function StreamsList({ showCreateForm = true, onStreamSelect }: StreamsListProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN' | 'TEMPLATE'>('ALL');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStreams();
    loadStats();
  }, [searchTerm, statusFilter]);

  const loadStreams = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      
      const response = await streamsApi.getStreams(filters);
      setStreams(response.streams);
    } catch (error: any) {
      console.error('Error loading streams:', error);
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const streamStats = await streamsApi.getStreamStats();
      setStats(streamStats);
    } catch (error: any) {
      console.error('Error loading stream stats:', error);
    }
  };

  const handleCreateStream = async (data: any) => {
    try {
      const newStream = await streamsApi.createStream(data);
      setStreams(prev => [newStream, ...prev]);
      setShowForm(false);
      toast.success('Stream created successfully');
      loadStats();
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream');
    }
  };

  const handleUpdateStream = async (data: any) => {
    if (!editingStream) return;
    
    try {
      const updatedStream = await streamsApi.updateStream(editingStream.id, data);
      setStreams(prev => 
        prev.map(stream => 
          stream.id === editingStream.id ? updatedStream : stream
        )
      );
      setEditingStream(null);
      setShowForm(false);
      toast.success('Stream updated successfully');
      loadStats();
    } catch (error: any) {
      console.error('Error updating stream:', error);
      toast.error('Failed to update stream');
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) return;
    
    try {
      await streamsApi.deleteStream(streamId);
      setStreams(prev => prev.filter(stream => stream.id !== streamId));
      toast.success('Stream deleted successfully');
      loadStats();
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to delete stream');
      }
    }
  };

  const handleArchiveStream = async (streamId: string, archive: boolean) => {
    try {
      const updatedStream = await streamsApi.archiveStream(streamId, archive);
      setStreams(prev =>
        prev.map(stream =>
          stream.id === streamId ? updatedStream : stream
        )
      );
      toast.success(`Stream ${archive ? 'archived' : 'unarchived'} successfully`);
      loadStats();
    } catch (error: any) {
      console.error('Error archiving stream:', error);
      toast.error(`Failed to ${archive ? 'archive' : 'unarchive'} stream`);
    }
  };

  const handleDuplicateStream = async (streamId: string) => {
    const name = prompt('Enter name for duplicated stream:');
    if (!name) return;

    try {
      const duplicatedStream = await streamsApi.duplicateStream(streamId, name);
      setStreams(prev => [duplicatedStream, ...prev]);
      toast.success('Stream duplicated successfully');
      loadStats();
    } catch (error: any) {
      console.error('Error duplicating stream:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to duplicate stream');
      }
    }
  };

  const handleEdit = (stream: Stream) => {
    setEditingStream(stream);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingStream(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strumienie</h2>
          <p className="text-gray-600">Zarządzaj przepływem pracy</p>
        </div>
        {showCreateForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nowy strumień
          </button>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Wszystkie strumienie</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStreams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Płynące</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStreams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Zamrożone</p>
                <p className="text-2xl font-bold text-gray-900">{stats.archivedStreams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Wszystkie zadania</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search streams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Wszystkie statusy</option>
              <option value="ACTIVE">Aktywne</option>
              <option value="FROZEN">Zamrożone</option>
              <option value="TEMPLATE">Szablony</option>
            </select>
          </div>
        </div>
      </div>

      {/* Streams List */}
      <div className="bg-white rounded-lg shadow border">
        {streams.length === 0 ? (
          <div className="p-8 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nie znaleziono strumieni</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Spróbuj zmienić wyszukiwanie lub filtry.'
                : 'Rozpocznij tworząc swój pierwszy strumień.'}
            </p>
            {showCreateForm && !searchTerm && statusFilter === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Utwórz strumień
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {streams.map((stream) => (
              <StreamItem
                key={stream.id}
                stream={stream}
                onEdit={handleEdit}
                onDelete={handleDeleteStream}
                onArchive={handleArchiveStream}
                onDuplicate={handleDuplicateStream}
                onSelect={onStreamSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stream Form Modal */}
      {showForm && (
        <StreamForm
          stream={editingStream || undefined}
          onSubmit={editingStream ? handleUpdateStream : handleCreateStream}
          onCancel={cancelForm}
        />
      )}
    </div>
  );
}