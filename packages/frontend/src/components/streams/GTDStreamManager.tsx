'use client';

/**
 * StreamManager - Główny komponent do zarządzania strumieniami
 * Obsługuje tworzenie, edycję, konfigurację i wizualizację hierarchii
 * Metodologia: SORTO Streams v3.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
// import { FiFolder } from 'react-icons/fi'; // Tymczasowo wyłączone
import { FolderIcon as FiFolder } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import GTDStreamCard from './GTDStreamCard';
import GTDStreamForm from './GTDStreamForm';
import GTDConfigModal from './GTDConfigModal';
import StreamHierarchyModal from './StreamHierarchyModal';
import GTDMigrationModal from './GTDMigrationModal';
import { GTDRole, StreamType } from '@/types/gtd';
import apiClient from '@/lib/api/client';

interface GTDStream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: string;
  gtdRole?: GTDRole;
  streamType?: StreamType;
  gtdConfig?: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    projects: number;
    messages?: number;
  };
  stats?: {
    taskCompletionRate?: number;
    avgProcessingTime?: number;
    pendingItems?: number;
  };
}

interface GTDStats {
  totalStreams: number;
  streamsByRole: Record<string, number>;
  streamsByType: Record<string, number>;
  configuredStreams: number;
  unconfiguredStreams: number;
}

const GTDStreamManager: React.FC = () => {
  const router = useRouter();
  const [streams, setStreams] = useState<GTDStream[]>([]);
  const [stats, setStats] = useState<GTDStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<GTDRole | 'all'>('all');
  const [selectedType, setSelectedType] = useState<StreamType | 'all'>('all');
  const [showOnlyGTD, setShowOnlyGTD] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<GTDStream | null>(null);

  // Fetch streams
  const fetchStreams = async () => {
    try {
      setLoading(true);
      
      // Fetch GTD streams
      const response = await apiClient.get('/gtd-streams');
      const gtdStreams = response.data.data || [];
      
      // Fetch regular streams if needed
      if (!showOnlyGTD) {
        try {
          const regularResponse = await apiClient.get('/streams');
          const regularData = regularResponse.data;
          // Merge with GTD streams
          const gtdStreamIds = new Set(gtdStreams.map((s: any) => s.id));
          const nonGTDStreams = (regularData.streams || []).filter((s: any) => !gtdStreamIds.has(s.id));
          setStreams([...gtdStreams, ...nonGTDStreams]);
        } catch (error: any) {
          setStreams(gtdStreams);
        }
      } else {
        setStreams(gtdStreams);
      }
      
    } catch (error: any) {
      console.error('Error fetching streams:', error);
      toast.error('Nie udało się pobrać streamów');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/gtd-streams/stats');
      setStats(response.data.data || response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStreams();
    fetchStats();
  }, [showOnlyGTD]);

  // Filter streams
  const filteredStreams = streams.filter(stream => {
    if (selectedRole !== 'all' && stream.gtdRole !== selectedRole) return false;
    if (selectedType !== 'all' && stream.streamType !== selectedType) return false;
    if (showOnlyGTD && !stream.gtdRole) return false;
    return true;
  });

  // Handle stream creation
  const handleCreateStream = async (streamData: any) => {
    try {
      await apiClient.post('/gtd-streams', streamData);
      
      toast.success('Stream został utworzony');
      
      setShowCreateModal(false);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast.error('Nie udało się utworzyć streama');
    }
  };

  // Handle stream update
  const handleUpdateStream = async (streamData: any) => {
    if (!selectedStream) return;

    try {
      // Extract basic stream data (for /streams endpoint)
      const { gtdConfig, gtdRole, streamType, parentStreamId, ...basicData } = streamData;

      // Update basic stream data
      await apiClient.put(`/streams/${selectedStream.id}`, basicData);

      // If gtdRole or streamType changed, update via gtd-streams endpoint
      if (gtdRole && gtdRole !== selectedStream.gtdRole) {
        await apiClient.put(`/gtd-streams/${selectedStream.id}/role`, { gtdRole });
      }

      toast.success('Stream został zaktualizowany');

      setShowEditModal(false);
      setSelectedStream(null);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error updating stream:', error);
      toast.error('Nie udało się zaktualizować streama');
    }
  };

  // Handle stream deletion
  const handleDeleteStream = async (streamId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten stream?')) return;
    
    try {
      await apiClient.delete(`/streams/${streamId}`);
      
      toast.success('Stream został usunięty');
      
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      toast.error('Nie udało się usunąć streama');
    }
  };

  // Handle config update
  const handleUpdateConfig = async (streamId: string, config: any) => {
    try {
      await apiClient.put(`/gtd-streams/${streamId}/config`, { config });
      
      toast.success('Konfiguracja została zaktualizowana');
      
      setShowConfigModal(false);
      fetchStreams();
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Nie udało się zaktualizować konfiguracji');
    }
  };

  // Handle migration
  const handleMigrate = async (streamId: string, gtdRole: GTDRole, streamType: StreamType) => {
    try {
      await apiClient.post(`/gtd-streams/${streamId}/migrate`, { gtdRole, streamType });
      
      toast.success('Stream został zmigrowany');
      
      setShowMigrationModal(false);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error migrating stream:', error);
      toast.error('Nie udało się zmigrować streama');
    }
  };

  // Handle stream open
  const handleOpenStream = (streamId: string) => {
    console.log('Opening stream:', streamId);
    console.log('Target URL:', `/crm/dashboard/streams/${streamId}`);

    // Bezpośrednio używaj router.push jak w CompanyItem
    router.push(`/crm/dashboard/streams/${streamId}`);
  };

  // Handle freeze stream
  const handleFreezeStream = async (streamId: string) => {
    try {
      await apiClient.post(`/gtd-streams/${streamId}/freeze`);
      toast.success('Strumień został zamrożony');
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error freezing stream:', error);
      toast.error('Nie udało się zamrozić strumienia');
    }
  };

  // Handle unfreeze stream
  const handleUnfreezeStream = async (streamId: string) => {
    try {
      await apiClient.put(`/streams/${streamId}`, { status: 'ACTIVE' });
      toast.success('Strumień został odmrożony');
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error unfreezing stream:', error);
      toast.error('Nie udało się odmrozić strumienia');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">STRUMIENIE</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj swoimi strumieniami pracy
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '/dashboard/gtd-streams/scrum'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Squares2X2Icon className="w-4 h-4 mr-2" />
            Scrum Board
          </button>
          
          <Button
            variant="outline"
            onClick={() => {
              fetchStreams();
              fetchStats();
            }}
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Odśwież
          </Button>
          
          <Button
            variant="default"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nowy strumień
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-3xl font-bold text-gray-900">{stats.totalStreams}</div>
            <div className="text-sm text-gray-600">Wszystkie strumienie</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{stats.configuredStreams}</div>
            <div className="text-sm text-blue-600">Płynące</div>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
            <div className="text-3xl font-bold text-cyan-600">{stats.unconfiguredStreams}</div>
            <div className="text-sm text-cyan-600">Zamrożone</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-600">
              {stats.streamsByRole['PROJECTS'] || 0}
            </div>
            <div className="text-sm text-green-600">Projektowe</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">
              {stats.streamsByRole['INBOX'] || 0}
            </div>
            <div className="text-sm text-purple-600">Źródło</div>
          </div>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="bg-white rounded-lg p-4 border flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtry:</span>
          </div>

          <select
            className="text-sm border rounded-md px-3 py-1"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as GTDRole | 'all')}
          >
            <option value="all">Wszystkie typy</option>
            <option value="INBOX">Źródło</option>
            <option value="PROJECTS">Projektowe</option>
            <option value="AREAS">Ciągłe</option>
            <option value="REFERENCE">Referencyjne</option>
            <option value="SOMEDAY_MAYBE">Zamrożone</option>
            <option value="NEXT_ACTIONS">Zadania</option>
            <option value="WAITING_FOR">Oczekujące</option>
            <option value="CUSTOM">Własne</option>
          </select>

          <select
            className="text-sm border rounded-md px-3 py-1"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as StreamType | 'all')}
          >
            <option value="all">Wszystkie kategorie</option>
            <option value="WORKSPACE">Główne</option>
            <option value="PROJECT">Projekty</option>
            <option value="AREA">Obszary</option>
            <option value="CONTEXT">Konteksty</option>
            <option value="CUSTOM">Własne</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyGTD}
              onChange={(e) => setShowOnlyGTD(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Tylko skonfigurowane</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            onClick={() => setViewMode('grid')}
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
          <button
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            onClick={() => setViewMode('list')}
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streams Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {filteredStreams.map(stream => (
          <GTDStreamCard
            key={stream.id}
            stream={stream}
            onEdit={(id) => {
              setSelectedStream(stream);
              setShowEditModal(true);
            }}
            onDelete={handleDeleteStream}
            onOpenConfig={(id) => {
              setSelectedStream(stream);
              setShowConfigModal(true);
            }}
            onViewHierarchy={(id) => {
              console.log('Opening hierarchy modal for stream:', stream.name, 'ID:', stream.id);
              setSelectedStream(stream);
              setShowHierarchyModal(true);
              console.log('Modal state set to true, selectedStream:', stream);
            }}
            onMigrate={(id) => {
              setSelectedStream(stream);
              setShowMigrationModal(true);
            }}
            onOpen={handleOpenStream}
            onFreeze={handleFreezeStream}
            onUnfreeze={handleUnfreezeStream}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredStreams.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Brak strumieni do wyświetlenia
          </h3>
          <p className="text-gray-600 mb-4">
            {showOnlyGTD ? 'Nie masz jeszcze skonfigurowanych strumieni.' : 'Zmień filtry lub utwórz nowy strumień.'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Utwórz pierwszy strumień
          </Button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <GTDStreamForm
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateStream}
        />
      )}
      
      {showEditModal && selectedStream && (
        <GTDStreamForm
          stream={selectedStream}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStream(null);
          }}
          onSubmit={handleUpdateStream}
        />
      )}
      
      {showConfigModal && selectedStream && (
        <GTDConfigModal
          stream={selectedStream}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedStream(null);
          }}
          onSave={(config) => handleUpdateConfig(selectedStream.id, config)}
        />
      )}
      
      {showHierarchyModal && selectedStream && (
        <>
          {console.log('Rendering hierarchy modal for:', selectedStream.name)}
          <StreamHierarchyModal
            isOpen={true}
            stream={selectedStream as any}
            onClose={() => {
              console.log('Closing hierarchy modal');
              setShowHierarchyModal(false);
              setSelectedStream(null);
            }}
          />
        </>
      )}
      
      {showMigrationModal && selectedStream && (
        <GTDMigrationModal
          stream={selectedStream}
          onClose={() => {
            setShowMigrationModal(false);
            setSelectedStream(null);
          }}
          onMigrate={handleMigrate}
        />
      )}
    </div>
  );
};

export default GTDStreamManager;