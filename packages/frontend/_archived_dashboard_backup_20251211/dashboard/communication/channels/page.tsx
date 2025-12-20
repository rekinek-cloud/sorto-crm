'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import {
  PlusIcon,
  XMarkIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  WifiIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface ChannelConfig {
  // Email config
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useSSL?: boolean;
  
  // Slack config
  token?: string;
  signingSecret?: string;
  appToken?: string;
  botToken?: string;
  workspace?: string;
  channels?: string[];
}

interface CommunicationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'WHATSAPP' | 'SMS';
  active: boolean;
  config: ChannelConfig;
  emailAddress?: string;
  displayName?: string;
  autoProcess: boolean;
  createTasks: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<CommunicationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SLACK' | 'TEAMS' | 'WHATSAPP' | 'SMS',
    emailAddress: '',
    displayName: '',
    autoProcess: true,
    createTasks: false,
    config: {} as ChannelConfig
  });

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    filterChannels();
  }, [channels, searchTerm, typeFilter, statusFilter]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/communication/channels');
      const channelsData = response.data;
      
      // Add mock unread counts and last messages for display
      const channelsWithMockData = channelsData.map((channel: any) => ({
        ...channel,
        unreadCount: channel._count?.messages || Math.floor(Math.random() * 20),
        lastMessage: 'Ostatnia wiadomość...',
        lastMessageAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }));
      setChannels(channelsWithMockData);
    } catch (error: any) {
      console.error('Error loading channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = () => {
    let filtered = channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (channel.emailAddress && channel.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (channel.displayName && channel.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || channel.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && channel.active) ||
                           (statusFilter === 'inactive' && !channel.active);
      
      return matchesSearch && matchesType && matchesStatus;
    });

    setFilteredChannels(filtered);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nazwa kanału jest wymagana');
      return;
    }

    try {
      const response = await apiClient.post('/communication/channels', {
        name: formData.name.trim(),
        type: formData.type,
        config: formData.config,
        emailAddress: formData.emailAddress || undefined,
        displayName: formData.displayName || undefined,
        autoProcess: formData.autoProcess,
        createTasks: formData.createTasks
      });

      const newChannel = response.data;
      setChannels(prev => [{ ...newChannel, unreadCount: 0, lastMessage: '', lastMessageAt: new Date().toISOString() }, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Kanał został utworzony pomyślnie');
      
      // Optionally trigger initial sync for email channels
      if (formData.type === 'EMAIL' && formData.autoProcess) {
        toast('Uruchamiam początkową synchronizację...', { duration: 3000 });
        // Add a small delay to ensure the channel is fully created
        setTimeout(() => {
          handleSyncChannel({ ...newChannel, unreadCount: 0, lastMessage: '', lastMessageAt: new Date().toISOString() });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error creating channel:', error);
      toast.error('Błąd podczas tworzenia kanału');
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChannel) return;

    try {
      const response = await apiClient.put(`/communication/channels/${selectedChannel.id}`, {
        name: formData.name.trim(),
        type: formData.type,
        config: formData.config,
        emailAddress: formData.emailAddress || undefined,
        displayName: formData.displayName || undefined,
        autoProcess: formData.autoProcess,
        createTasks: formData.createTasks
      });

      const updatedChannel = response.data;
      setChannels(prev => prev.map(channel =>
        channel.id === selectedChannel.id
          ? { ...updatedChannel, unreadCount: channel.unreadCount, lastMessage: channel.lastMessage, lastMessageAt: channel.lastMessageAt }
          : channel
      ));

      setShowEditModal(false);
      setSelectedChannel(null);
      resetForm();
      toast.success('Kanał został zaktualizowany pomyślnie');
    } catch (error: any) {
      console.error('Error updating channel:', error);
      toast.error('Błąd podczas aktualizacji kanału');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kanał?')) {
      return;
    }

    try {
      await apiClient.delete(`/communication/channels/${channelId}`);
      setChannels(prev => prev.filter(channel => channel.id !== channelId));
      toast.success('Kanał został usunięty');
    } catch (error: any) {
      console.error('Error deleting channel:', error);
      toast.error('Błąd podczas usuwania kanału');
    }
  };

  const handleTestConnection = async (channel: CommunicationChannel) => {
    setTestingConnection(channel.id);
    
    try {
      if (channel.type === 'EMAIL') {
        const response = await apiClient.post('/communication/channels/test-email', channel.config);
        if (response.data.valid) {
          toast.success('Test połączenia email zakończony sukcesem');
        } else {
          toast.error('Test połączenia nieudany - sprawdź konfigurację email');
        }
      } else if (channel.type === 'SLACK') {
        const response = await apiClient.post('/communication/channels/test-slack', channel.config);
        if (response.data.valid) {
          toast.success('Test połączenia Slack zakończony sukcesem');
        } else {
          toast.error('Test połączenia nieudany - sprawdź konfigurację Slack');
        }
      } else {
        toast('Test połączenia dla tego typu kanału nie jest jeszcze dostępny', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast.error('Błąd podczas testowania połączenia');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSyncChannel = async (channel: CommunicationChannel) => {
    try {
      console.log('Starting sync for channel:', channel.id, channel.name, channel.type);
      toast('Synchronizuję wiadomości...', { duration: 3000 });
      
      const response = await apiClient.post(`/communication/channels/${channel.id}/sync`);
      const { syncedCount, errors, message } = response.data;
      
      console.log('Sync response:', { syncedCount, errors, message });
      
      if (errors && errors.length > 0) {
        console.warn('Sync completed with errors:', errors);
        toast.error(`Synchronizacja zakończona z błędami: ${errors.join(', ')}`);
      } else {
        console.log(`Sync successful: ${syncedCount} messages synced`);
        toast.success(`Zsynchronizowano ${syncedCount} wiadomości z kanału ${channel.type}`);
      }
      
      // Reload channels to update message counts
      await loadChannels();
    } catch (error: any) {
      console.error('Error syncing channel:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.data?.error) {
        toast.error(`Błąd synchronizacji: ${error.response.data.error}`);
      } else {
        toast.error('Błąd podczas synchronizacji kanału');
      }
    }
  };

  const toggleChannelStatus = async (channelId: string) => {
    try {
      const channel = channels.find(ch => ch.id === channelId);
      if (!channel) return;

      const response = await apiClient.put(`/communication/channels/${channelId}`, {
        ...channel,
        active: !channel.active
      });

      const updatedChannel = response.data;
      setChannels(prev => prev.map(ch =>
        ch.id === channelId
          ? { ...updatedChannel, unreadCount: ch.unreadCount, lastMessage: ch.lastMessage, lastMessageAt: ch.lastMessageAt }
          : ch
      ));
      toast.success('Status kanału został zmieniony');
    } catch (error: any) {
      console.error('Error toggling channel status:', error);
      toast.error('Błąd podczas zmiany statusu kanału');
    }
  };

  const openEditModal = (channel: CommunicationChannel) => {
    setSelectedChannel(channel);
    setFormData({
      name: channel.name,
      type: channel.type,
      emailAddress: channel.emailAddress || '',
      displayName: channel.displayName || '',
      autoProcess: channel.autoProcess,
      createTasks: channel.createTasks,
      config: channel.config
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EMAIL',
      emailAddress: '',
      displayName: '',
      autoProcess: true,
      createTasks: false,
      config: {}
    });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <EnvelopeIcon className="w-6 h-6 text-blue-600" />;
      case 'SLACK': return <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />;
      case 'TEAMS': return <UserGroupIcon className="w-6 h-6 text-blue-500" />;
      case 'WHATSAPP': return <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />;
      case 'SMS': return <DevicePhoneMobileIcon className="w-6 h-6 text-orange-600" />;
      default: return <SignalIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getChannelTypeName = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'Email';
      case 'SLACK': return 'Slack';
      case 'TEAMS': return 'Teams';
      case 'WHATSAPP': return 'WhatsApp';
      case 'SMS': return 'SMS';
      default: return 'Nieznany';
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Przed chwilą';
    if (diffInMinutes < 60) return `${diffInMinutes} min temu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} godz. temu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dni temu`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanały komunikacji</h1>
          <p className="text-gray-600">Zarządzaj kanałami email, Slack i innych platform komunikacyjnych</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Dodaj kanał
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj kanałów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <SignalIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie typy</option>
              <option value="EMAIL">Email</option>
              <option value="SLACK">Slack</option>
              <option value="TEAMS">Teams</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Znaleziono: {filteredChannels.length} z {channels.length}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SignalIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie kanałów</p>
              <p className="text-2xl font-semibold text-gray-900">{channels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {channels.filter(c => c.active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nieprzeczytane</p>
              <p className="text-2xl font-semibold text-gray-900">
                {channels.reduce((sum, c) => sum + c.unreadCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Auto-tworzenie zadań</p>
              <p className="text-2xl font-semibold text-gray-900">
                {channels.filter(c => c.createTasks).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Kanały komunikacji ({filteredChannels.length})
          </h3>
        </div>

        {filteredChannels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak kanałów komunikacji</h3>
            <p className="text-gray-600">Połącz swoje konta email, Slack lub inne platformy komunikacyjne</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChannels.map((channel, index) => (
              <motion.div
                key={channel.id}
                className="p-6 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {getChannelIcon(channel.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{channel.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(channel.active)}`}>
                          {channel.active ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {getChannelTypeName(channel.type)}
                        </span>
                      </div>

                      {channel.displayName && (
                        <p className="text-sm text-gray-600 mb-1">{channel.displayName}</p>
                      )}

                      {channel.emailAddress && (
                        <p className="text-sm text-gray-500 mb-3">{channel.emailAddress}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-gray-600">Nieprzeczytane:</span>
                          <span className="font-medium ml-1">{channel.unreadCount}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Cog6ToothIcon className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-600">Auto-przetwarzanie:</span>
                          <span className={`font-medium ml-1 ${channel.autoProcess ? 'text-green-600' : 'text-gray-500'}`}>
                            {channel.autoProcess ? 'Tak' : 'Nie'}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 text-purple-500 mr-2" />
                          <span className="text-gray-600">Tworzenie zadań:</span>
                          <span className={`font-medium ml-1 ${channel.createTasks ? 'text-green-600' : 'text-gray-500'}`}>
                            {channel.createTasks ? 'Tak' : 'Nie'}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 text-orange-500 mr-2" />
                          <span className="text-gray-600">Utworzony:</span>
                          <span className="font-medium ml-1">{formatDate(channel.createdAt)}</span>
                        </div>
                      </div>

                      {channel.lastMessage && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Ostatnia wiadomość: {channel.lastMessageAt && getTimeAgo(channel.lastMessageAt)}
                          </div>
                          <p className="text-sm text-gray-700 truncate">{channel.lastMessage}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleTestConnection(channel)}
                      disabled={testingConnection === channel.id}
                      className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="Testuj połączenie"
                    >
                      {testingConnection === channel.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <WifiIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {(channel.type === 'SLACK' || channel.type === 'EMAIL') && (
                      <button
                        onClick={() => handleSyncChannel(channel)}
                        className="p-2 text-gray-400 hover:text-purple-600"
                        title="Synchronizuj"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => toggleChannelStatus(channel.id)}
                      className={`p-2 ${
                        channel.active
                          ? 'text-gray-400 hover:text-orange-600'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={channel.active ? 'Dezaktywuj' : 'Aktywuj'}
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => openEditModal(channel)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edytuj kanał"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Usuń kanał"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Channel Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showCreateModal ? 'Dodaj kanał komunikacji' : 'Edytuj kanał komunikacji'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedChannel(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

            <form onSubmit={showCreateModal ? handleCreateChannel : handleUpdateChannel} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa kanału *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="np. Gmail - Główne konto"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Typ kanału *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="EMAIL">Email (IMAP/SMTP)</option>
                    <option value="SLACK">Slack</option>
                    <option value="TEAMS">Microsoft Teams</option>
                    <option value="WHATSAPP">WhatsApp Business</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>

                {formData.type === 'EMAIL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres email
                      </label>
                      <input
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="twoj@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serwer IMAP
                      </label>
                      <input
                        type="text"
                        value={formData.config.host || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, host: e.target.value }
                        })}
                        placeholder="imap.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port
                        </label>
                        <input
                          type="number"
                          value={formData.config.port || 993}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, port: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          id="useSSL"
                          checked={formData.config.useSSL !== false}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, useSSL: e.target.checked }
                          })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="useSSL" className="ml-2 block text-sm text-gray-900">
                          Użyj SSL
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa użytkownika
                      </label>
                      <input
                        type="text"
                        value={formData.config.username || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="twoj@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hasło
                      </label>
                      <input
                        type="password"
                        value={formData.config.password || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Hasło do konta email"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'SLACK' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Token bota *
                      </label>
                      <input
                        type="password"
                        value={formData.config.token || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, token: e.target.value }
                        })}
                        placeholder="xoxb-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Signing Secret
                      </label>
                      <input
                        type="password"
                        value={formData.config.signingSecret || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, signingSecret: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Podpisywanie wiadomości"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa workspace
                      </label>
                      <input
                        type="text"
                        value={formData.config.workspace || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, workspace: e.target.value }
                        })}
                        placeholder="nazwa-workspace"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa wyświetlana
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Przyjazna nazwa kanału"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoProcess"
                      checked={formData.autoProcess}
                      onChange={(e) => setFormData({ ...formData, autoProcess: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoProcess" className="ml-2 block text-sm text-gray-900">
                      Automatyczne przetwarzanie wiadomości
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createTasks"
                      checked={formData.createTasks}
                      onChange={(e) => setFormData({ ...formData, createTasks: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createTasks" className="ml-2 block text-sm text-gray-900">
                      Automatyczne tworzenie zadań z wiadomości
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedChannel(null);
                    resetForm();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  {showCreateModal ? 'Dodaj kanał' : 'Aktualizuj kanał'}
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}