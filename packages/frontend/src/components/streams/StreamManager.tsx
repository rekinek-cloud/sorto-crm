'use client';

/**
 * StreamManager - Główny komponent do zarządzania strumieniami
 * Obsługuje tworzenie, edycję, konfigurację i wizualizację hierarchii
 * Metodologia: SORTO Streams v3.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Waves,
  Folder,
  Snowflake,
  CheckCircle2,
  ListTodo,
  Activity,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

import StreamCard from './StreamCard';
import StreamForm from './StreamForm';
import StreamConfigModal from './StreamConfigModal';
import StreamHierarchyModal from './StreamHierarchyModal';
import StreamMigrationModal from './StreamMigrationModal';
import { StreamRole, StreamType } from '@/types/streams';
import apiClient from '@/lib/api/client';

interface GTDStream {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: string;
  gtdRole?: StreamRole;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const StreamManager: React.FC = () => {
  const router = useRouter();
  const [streams, setStreams] = useState<GTDStream[]>([]);
  const [stats, setStats] = useState<GTDStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRole, setSelectedRole] = useState<StreamRole | 'all'>('all');
  const [selectedType, setSelectedType] = useState<StreamType | 'all'>('all');
  const [showOnlyGTD, setShowOnlyGTD] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      const response = await apiClient.get('/stream-management');
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
      toast.error('Nie udalo sie pobrac strumieni');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/stream-management/stats');
      setStats(response.data.data || response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStreams();
    fetchStats();
  }, [showOnlyGTD]);

  // Computed stats from streams
  const computedStats = useMemo(() => {
    const active = streams.filter(s => s.status === 'ACTIVE').length;
    const frozen = streams.filter(s => s.status === 'FROZEN' || s.status === 'SOMEDAY_MAYBE').length;
    const completed = streams.filter(s => s.status === 'COMPLETED' || s.status === 'ARCHIVED').length;
    const totalTasks = streams.reduce((sum, s) => sum + (s._count?.tasks || 0), 0);
    return { active, frozen, completed, totalTasks };
  }, [streams]);

  // Filter streams
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      if (selectedRole !== 'all' && stream.gtdRole !== selectedRole) return false;
      if (selectedType !== 'all' && stream.streamType !== selectedType) return false;
      if (showOnlyGTD && !stream.gtdRole) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = stream.name.toLowerCase().includes(q);
        const descMatch = stream.description?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [streams, selectedRole, selectedType, showOnlyGTD, searchQuery]);

  // Handle stream creation
  const handleCreateStream = async (streamData: any) => {
    try {
      await apiClient.post('/stream-management', streamData);

      toast.success('Strumien zostal utworzony');

      setShowCreateModal(false);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating stream:', error);
      toast.error('Nie udalo sie utworzyc strumienia');
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
        await apiClient.put(`/stream-management/${selectedStream.id}/role`, { gtdRole });
      }

      toast.success('Strumien zostal zaktualizowany');

      setShowEditModal(false);
      setSelectedStream(null);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error updating stream:', error);
      toast.error('Nie udalo sie zaktualizowac strumienia');
    }
  };

  // Handle stream deletion
  const handleDeleteStream = async (streamId: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten strumien?')) return;

    try {
      await apiClient.delete(`/streams/${streamId}`);

      toast.success('Strumien zostal usuniety');

      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      toast.error('Nie udalo sie usunac strumienia');
    }
  };

  // Handle config update
  const handleUpdateConfig = async (streamId: string, config: any) => {
    try {
      await apiClient.put(`/stream-management/${streamId}/config`, { config });

      toast.success('Konfiguracja zostala zaktualizowana');

      setShowConfigModal(false);
      fetchStreams();
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Nie udalo sie zaktualizowac konfiguracji');
    }
  };

  // Handle migration
  const handleMigrate = async (streamId: string, gtdRole: StreamRole, streamType: StreamType) => {
    try {
      await apiClient.post(`/stream-management/${streamId}/migrate`, { gtdRole, streamType });

      toast.success('Strumien zostal zmigrowany');

      setShowMigrationModal(false);
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error migrating stream:', error);
      toast.error('Nie udalo sie zmigrowac strumienia');
    }
  };

  // Handle stream open
  const handleOpenStream = (streamId: string) => {
    router.push(`/crm/dashboard/streams/${streamId}`);
  };

  // Handle freeze stream
  const handleFreezeStream = async (streamId: string) => {
    try {
      await apiClient.post(`/stream-management/${streamId}/freeze`);
      toast.success('Strumien zostal zamrozony');
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error freezing stream:', error);
      toast.error('Nie udalo sie zamrozic strumienia');
    }
  };

  // Handle unfreeze stream
  const handleUnfreezeStream = async (streamId: string) => {
    try {
      await apiClient.put(`/streams/${streamId}`, { status: 'ACTIVE' });
      toast.success('Strumien zostal odmrozony');
      fetchStreams();
      fetchStats();
    } catch (error: any) {
      console.error('Error unfreezing stream:', error);
      toast.error('Nie udalo sie odmrozic strumienia');
    }
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    if (key === 'role') {
      setSelectedRole(value as StreamRole | 'all');
    } else if (key === 'type') {
      setSelectedType(value as StreamType | 'all');
    } else if (key === 'configured') {
      setShowOnlyGTD(value === 'configured');
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Strumienie"
        subtitle="Zarzadzaj strumieniami pracy i produktywnosci"
        icon={Waves}
        iconColor="text-violet-600"
        breadcrumbs={[{ label: 'Strumienie' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={RefreshCw}
              onClick={() => {
                fetchStreams();
                fetchStats();
              }}
            >
              Odswiez
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Nowy strumien
            </ActionButton>
          </div>
        }
      />

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          label="Aktywne"
          value={computedStats.active}
          icon={Activity}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Zamrozone"
          value={computedStats.frozen}
          icon={Snowflake}
          iconColor="text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <StatCard
          label="Zakonczone"
          value={computedStats.completed}
          icon={CheckCircle2}
          iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
        />
        <StatCard
          label="Zadania lacznie"
          value={computedStats.totalTasks}
          icon={ListTodo}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </motion.div>

      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Szukaj strumieni..."
          filters={[
            {
              key: 'role',
              label: 'Wszystkie role',
              options: [
                { value: 'INBOX', label: 'Zrodlo' },
                { value: 'PROJECTS', label: 'Projektowe' },
                { value: 'AREAS', label: 'Ciagle' },
                { value: 'REFERENCE', label: 'Referencyjne' },
                { value: 'SOMEDAY_MAYBE', label: 'Zamrozone' },
                { value: 'NEXT_ACTIONS', label: 'Zadania' },
                { value: 'WAITING_FOR', label: 'Oczekujace' },
                { value: 'CUSTOM', label: 'Wlasne' },
              ],
            },
            {
              key: 'type',
              label: 'Wszystkie kategorie',
              options: [
                { value: 'WORKSPACE', label: 'Glowne' },
                { value: 'PROJECT', label: 'Projekty' },
                { value: 'AREA', label: 'Obszary' },
                { value: 'CONTEXT', label: 'Konteksty' },
                { value: 'CUSTOM', label: 'Wlasne' },
              ],
            },
            {
              key: 'configured',
              label: 'Wszystkie',
              options: [
                { value: 'configured', label: 'Tylko skonfigurowane' },
              ],
            },
          ]}
          filterValues={{
            role: selectedRole,
            type: selectedType,
            configured: showOnlyGTD ? 'configured' : 'all',
          }}
          onFilterChange={handleFilterChange}
          actions={
            <div className="flex items-center gap-1 ml-auto">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                onClick={() => setViewMode('grid')}
                title="Widok siatki"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                onClick={() => setViewMode('list')}
                title="Widok listy"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          }
        />
      </div>

      {/* Streams Grid/List */}
      {filteredStreams.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          }
        >
          {filteredStreams.map(stream => (
            <motion.div
              key={stream.id}
              variants={itemVariants}
              className="cursor-pointer"
              onClick={() => handleOpenStream(stream.id)}
            >
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
                <StreamCard
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
                    setSelectedStream(stream);
                    setShowHierarchyModal(true);
                  }}
                  onMigrate={(id) => {
                    setSelectedStream(stream);
                    setShowMigrationModal(true);
                  }}
                  onOpen={handleOpenStream}
                  onFreeze={handleFreezeStream}
                  onUnfreeze={handleUnfreezeStream}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={Folder}
          title="Brak strumieni do wyswietlenia"
          description={
            showOnlyGTD
              ? 'Nie masz jeszcze skonfigurowanych strumieni.'
              : 'Zmien filtry lub utworz nowy strumien.'
          }
          action={
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Utworz pierwszy strumien
            </ActionButton>
          }
        />
      )}

      {/* Modals */}
      {showCreateModal && (
        <StreamForm
          availableStreams={streams}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateStream}
        />
      )}

      {showEditModal && selectedStream && (
        <StreamForm
          stream={selectedStream}
          availableStreams={streams}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStream(null);
          }}
          onSubmit={handleUpdateStream}
        />
      )}

      {showConfigModal && selectedStream && (
        <StreamConfigModal
          stream={selectedStream}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedStream(null);
          }}
          onSave={(config) => handleUpdateConfig(selectedStream.id, config)}
        />
      )}

      {showHierarchyModal && selectedStream && (
        <StreamHierarchyModal
          isOpen={true}
          stream={selectedStream as any}
          onClose={() => {
            setShowHierarchyModal(false);
            setSelectedStream(null);
          }}
        />
      )}

      {showMigrationModal && selectedStream && (
        <StreamMigrationModal
          stream={selectedStream}
          onClose={() => {
            setShowMigrationModal(false);
            setSelectedStream(null);
          }}
          onMigrate={handleMigrate}
        />
      )}
    </PageShell>
  );
};

export default StreamManager;
