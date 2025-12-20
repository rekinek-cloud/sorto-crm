'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  FunnelIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';

interface ProcessingRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  channelId?: string;
  conditions: {
    fromEmail?: string;
    subject?: string;
    keywords?: string[];
    urgencyThreshold?: number;
    bodyContains?: string[];
    attachmentRequired?: boolean;
  };
  actions: {
    createTask: boolean;
    assignTo?: string;
    setContext?: string;
    setPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    addTags?: string[];
    markAsRead?: boolean;
    autoReply?: {
      enabled: boolean;
      template?: string;
    };
    // CRM actions
    update_contact_status?: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'CUSTOMER';
    add_contact_tags?: string[];
    create_deal?: {
      stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
      value?: number;
    };
    update_company?: {
      status: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'INACTIVE';
    };
  };
  channel?: {
    name: string;
    type: string;
  };
  _count?: {
    processingResults: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateRuleData {
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  channelId?: string;
  conditions: ProcessingRule['conditions'];
  actions: ProcessingRule['actions'];
}

export default function ProcessingRulesPage() {
  const [rules, setRules] = useState<ProcessingRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<ProcessingRule[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ProcessingRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<CreateRuleData>({
    name: '',
    description: '',
    enabled: true,
    priority: 0,
    channelId: '',
    conditions: {},
    actions: {
      createTask: true
    }
  });

  // Condition form state
  const [newKeyword, setNewKeyword] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRules();
  }, [rules, searchTerm, statusFilter, channelFilter]);

  const loadData = async () => {
    setTimeout(() => {
      // Mock data with Polish examples
      const mockRules: ProcessingRule[] = [
        {
          id: '1',
          name: 'Pilne emaile od klientów',
          description: 'Automatyczne przetwarzanie pilnych wiadomości od klientów',
          enabled: true,
          priority: 10,
          channelId: '1',
          conditions: {
            fromEmail: '*@klient.pl',
            keywords: ['pilne', 'natychmiast', 'awaryjne', 'urgent'],
            urgencyThreshold: 80
          },
          actions: {
            createTask: true,
            setContext: '@telefon',
            setPriority: 'URGENT',
            addTags: ['klient', 'pilne']
          },
          channel: { name: 'Gmail - Firmowe', type: 'EMAIL' },
          _count: { processingResults: 23 },
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          name: 'Prośby o spotkania',
          description: 'Przetwarzanie zaproszeń na spotkania i próśb o terminy',
          enabled: true,
          priority: 5,
          channelId: '1',
          conditions: {
            subject: '*spotkanie*',
            keywords: ['termin', 'kalendarz', 'dostępność'],
            bodyContains: ['harmonogram', 'kalendarz', 'spotkanie']
          },
          actions: {
            createTask: true,
            setContext: '@kalendarz',
            setPriority: 'MEDIUM',
            addTags: ['spotkanie', 'kalendarz']
          },
          channel: { name: 'Gmail - Firmowe', type: 'EMAIL' },
          _count: { processingResults: 15 },
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '3',
          name: 'Zgłoszenia wsparcia technicznego',
          description: 'Automatyczne tworzenie zadań dla zgłoszeń technicznych',
          enabled: true,
          priority: 8,
          channelId: '3',
          conditions: {
            fromEmail: '*@support.example.com',
            keywords: ['błąd', 'problem', 'nie działa', 'awaria'],
            subject: '*support*'
          },
          actions: {
            createTask: true,
            setContext: '@komputer',
            setPriority: 'HIGH',
            addTags: ['wsparcie', 'techniczne', 'błąd'],
            assignTo: 'admin'
          },
          channel: { name: 'Outlook - Wsparcie', type: 'EMAIL' },
          _count: { processingResults: 31 },
          createdAt: new Date(Date.now() - 864000000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          name: 'Notyfikacje Slack - Development',
          description: 'Przetwarzanie ważnych wiadomości z kanału development',
          enabled: true,
          priority: 6,
          channelId: '2',
          conditions: {
            keywords: ['deploy', 'release', 'critical', 'production'],
            urgencyThreshold: 70
          },
          actions: {
            createTask: true,
            setContext: '@komputer',
            setPriority: 'HIGH',
            addTags: ['development', 'deploy']
          },
          channel: { name: 'Slack - Development', type: 'SLACK' },
          _count: { processingResults: 12 },
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '5',
          name: 'Faktury i płatności',
          description: 'Obsługa automatyczna faktur i powiadomień o płatnościach',
          enabled: false,
          priority: 4,
          channelId: '1',
          conditions: {
            subject: '*faktura*',
            keywords: ['płatność', 'faktura', 'invoice', 'payment'],
            fromEmail: '*@accounting.com'
          },
          actions: {
            createTask: true,
            setContext: '@biuro',
            setPriority: 'MEDIUM',
            addTags: ['księgowość', 'faktura']
          },
          channel: { name: 'Gmail - Firmowe', type: 'EMAIL' },
          _count: { processingResults: 7 },
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: '6',
          name: 'Automatyczne odpowiedzi poza godzinami',
          description: 'Automatyczne odpowiedzi po godzinach pracy',
          enabled: true,
          priority: 2,
          conditions: {
            urgencyThreshold: 30
          },
          actions: {
            createTask: false,
            autoReply: {
              enabled: true,
              template: 'out_of_hours'
            },
            addTags: ['auto-reply']
          },
          _count: { processingResults: 45 },
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 14400000).toISOString()
        }
      ];
      
      setRules(mockRules);
      setChannels([
        { id: '1', name: 'Gmail - Firmowe', type: 'EMAIL' },
        { id: '2', name: 'Slack - Development', type: 'SLACK' },
        { id: '3', name: 'Outlook - Wsparcie', type: 'EMAIL' },
        { id: '4', name: 'Teams - Zarząd', type: 'TEAMS' }
      ]);
      setLoading(false);
    }, 500);
  };

  const filterRules = () => {
    let filtered = rules.filter(rule => {
      const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && rule.enabled) ||
                           (statusFilter === 'inactive' && !rule.enabled);
      
      const matchesChannel = channelFilter === 'all' || rule.channelId === channelFilter;
      
      return matchesSearch && matchesStatus && matchesChannel;
    });

    setFilteredRules(filtered);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nazwa reguły jest wymagana');
      return;
    }

    const newRule: ProcessingRule = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description?.trim(),
      enabled: formData.enabled,
      priority: formData.priority,
      channelId: formData.channelId,
      conditions: formData.conditions,
      actions: formData.actions,
      channel: formData.channelId ? channels.find(c => c.id === formData.channelId) : undefined,
      _count: { processingResults: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRules(prev => [newRule, ...prev]);
    setShowCreateModal(false);
    resetForm();
    toast.success('Reguła przetwarzania została utworzona');
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRule) return;

    setRules(prev => prev.map(rule =>
      rule.id === selectedRule.id
        ? {
            ...rule,
            name: formData.name.trim(),
            description: formData.description?.trim(),
            enabled: formData.enabled,
            priority: formData.priority,
            channelId: formData.channelId,
            conditions: formData.conditions,
            actions: formData.actions,
            channel: formData.channelId ? channels.find(c => c.id === formData.channelId) : undefined,
            updatedAt: new Date().toISOString()
          }
        : rule
    ));

    setShowEditModal(false);
    setSelectedRule(null);
    resetForm();
    toast.success('Reguła przetwarzania została zaktualizowana');
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę regułę przetwarzania?')) {
      return;
    }

    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast.success('Reguła przetwarzania została usunięta');
  };

  const handleToggleRule = async (rule: ProcessingRule) => {
    setRules(prev => prev.map(r =>
      r.id === rule.id
        ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() }
        : r
    ));
    toast.success(`Reguła została ${rule.enabled ? 'wyłączona' : 'włączona'}`);
  };

  const openEditModal = (rule: ProcessingRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      priority: rule.priority,
      channelId: rule.channelId || '',
      conditions: rule.conditions,
      actions: rule.actions
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      enabled: true,
      priority: 0,
      channelId: '',
      conditions: {},
      actions: {
        createTask: true
      }
    });
    setNewKeyword('');
    setNewTag('');
  };

  const addKeyword = () => {
    if (newKeyword && !formData.conditions.keywords?.includes(newKeyword)) {
      setFormData({
        ...formData,
        conditions: {
          ...formData.conditions,
          keywords: [...(formData.conditions.keywords || []), newKeyword]
        }
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      conditions: {
        ...formData.conditions,
        keywords: formData.conditions.keywords?.filter(k => k !== keyword)
      }
    });
  };

  const addTag = () => {
    if (newTag && !formData.actions.addTags?.includes(newTag)) {
      setFormData({
        ...formData,
        actions: {
          ...formData.actions,
          addTags: [...(formData.actions.addTags || []), newTag]
        }
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      actions: {
        ...formData.actions,
        addTags: formData.actions.addTags?.filter(t => t !== tag)
      }
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 5) return 'text-orange-600 bg-orange-100';
    if (priority >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityName = (priority: number) => {
    if (priority >= 8) return 'Bardzo wysoki';
    if (priority >= 5) return 'Wysoki';
    if (priority >= 2) return 'Średni';
    return 'Niski';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getContextName = (context: string) => {
    const contextMap: { [key: string]: string } = {
      '@telefon': '@telefon',
      '@komputer': '@komputer',
      '@biuro': '@biuro',
      '@kalendarz': '@kalendarz',
      '@calls': '@telefon',
      '@computer': '@komputer',
      '@office': '@biuro',
      '@calendar': '@kalendarz',
      '@errands': '@sprawy',
      '@home': '@dom',
      '@waiting': '@oczekiwanie'
    };
    return contextMap[context] || context;
  };

  const getPriorityActionName = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'LOW': 'Niski',
      'MEDIUM': 'Średni',
      'HIGH': 'Wysoki',
      'URGENT': 'Pilny'
    };
    return priorityMap[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reguły przetwarzania</h1>
          <p className="text-gray-600">Automatyzuj przetwarzanie wiadomości za pomocą niestandardowych reguł</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Utwórz regułę
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj reguł..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie kanały</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Znaleziono: {filteredRules.length} z {rules.length}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie reguł</p>
              <p className="text-2xl font-semibold text-gray-900">{rules.length}</p>
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
                {rules.filter(r => r.enabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BoltIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Przetworzone</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules.reduce((sum, r) => sum + (r._count?.processingResults || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wysokiej priorytetu</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules.filter(r => r.priority >= 8).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Jak działają reguły przetwarzania</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>1. Warunki:</strong> Określ co wyzwala regułę (nadawca, słowa kluczowe, pilność)
          </div>
          <div>
            <strong>2. Akcje:</strong> Ustaw co się dzieje po wyzwoleniu (utwórz zadanie, ustaw priorytet, dodaj tagi)
          </div>
          <div>
            <strong>3. Automatyzacja:</strong> Reguły działają automatycznie na nowych wiadomościach
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Processing Rules</h3>
            <p className="text-gray-600">Create rules to automatically process incoming messages</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Rules ({rules.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {rule.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(rule.priority)}`}>
                        Priority: {rule.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        rule.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                      {rule.channel && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {rule.channel.name}
                        </span>
                      )}
                    </div>

                    {rule.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {rule.description}
                      </p>
                    )}

                    {/* Conditions */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Conditions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.conditions.fromEmail && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            From: {rule.conditions.fromEmail}
                          </span>
                        )}
                        {rule.conditions.subject && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Subject: {rule.conditions.subject}
                          </span>
                        )}
                        {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Keywords: {rule.conditions.keywords.join(', ')}
                          </span>
                        )}
                        {rule.conditions.urgencyThreshold && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Urgency ≥ {rule.conditions.urgencyThreshold}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Actions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.actions.createTask && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Create Task
                          </span>
                        )}
                        {rule.actions.setContext && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Context: {rule.actions.setContext}
                          </span>
                        )}
                        {rule.actions.setPriority && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Priority: {rule.actions.setPriority}
                          </span>
                        )}
                        {rule.actions.addTags && rule.actions.addTags.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Tags: {rule.actions.addTags.join(', ')}
                          </span>
                        )}
                        {rule.actions.update_contact_status && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Contact → {rule.actions.update_contact_status}
                          </span>
                        )}
                        {rule.actions.create_deal && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Create Deal: {rule.actions.create_deal.stage}
                          </span>
                        )}
                        {rule.actions.update_company && (
                          <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                            Company → {rule.actions.update_company.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {rule._count && (
                      <div className="text-sm text-gray-500">
                        Processed {rule._count.processingResults} messages
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`p-2 rounded-md ${
                        rule.enabled
                          ? 'text-yellow-600 hover:bg-yellow-100'
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.enabled ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9V6a4 4 0 118 0v3M5 12h14l-1 7H6l-1-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(rule)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                      title="Edit rule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                      title="Delete rule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {showCreateModal ? 'Create Processing Rule' : 'Edit Processing Rule'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedRule(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={showCreateModal ? handleCreateRule : handleUpdateRule} className="p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority (0-10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Channel (Optional)
                      </label>
                      <select
                        value={formData.channelId}
                        onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">All channels</option>
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name} ({channel.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                      Enable this rule
                    </label>
                  </div>
                </div>

                {/* Conditions */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Conditions</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Email Pattern
                      </label>
                      <input
                        type="text"
                        value={formData.conditions.fromEmail || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, fromEmail: e.target.value }
                        })}
                        placeholder="*@example.com or specific@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject Pattern
                      </label>
                      <input
                        type="text"
                        value={formData.conditions.subject || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, subject: e.target.value }
                        })}
                        placeholder="*urgent* or exact subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords
                      </label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {formData.conditions.keywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded flex items-center space-x-1"
                          >
                            <span>{keyword}</span>
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add keyword"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="px-3 py-2 text-sm bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Urgency Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.conditions.urgencyThreshold || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { 
                            ...formData.conditions, 
                            urgencyThreshold: e.target.value ? parseInt(e.target.value) : undefined 
                          }
                        })}
                        placeholder="e.g., 70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Actions</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="createTask"
                        checked={formData.actions.createTask}
                        onChange={(e) => setFormData({
                          ...formData,
                          actions: { ...formData.actions, createTask: e.target.checked }
                        })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="createTask" className="ml-2 block text-sm text-gray-900">
                        Create GTD task
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Set Context
                        </label>
                        <select
                          value={formData.actions.setContext || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            actions: { ...formData.actions, setContext: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">No context</option>
                          <option value="@calls">@calls</option>
                          <option value="@computer">@computer</option>
                          <option value="@errands">@errands</option>
                          <option value="@home">@home</option>
                          <option value="@office">@office</option>
                          <option value="@waiting">@waiting</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Set Priority
                        </label>
                        <select
                          value={formData.actions.setPriority || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            actions: { ...formData.actions, setPriority: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">No priority</option>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Add Tags
                      </label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {formData.actions.addTags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CRM Actions */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">CRM Actions</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Contact Status
                      </label>
                      <select
                        value={formData.actions.update_contact_status || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          actions: { ...formData.actions, update_contact_status: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No change</option>
                        <option value="LEAD">Lead</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!!formData.actions.create_deal}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                actions: {
                                  ...formData.actions,
                                  create_deal: { stage: 'PROSPECT', value: 0 }
                                }
                              });
                            } else {
                              const { create_deal, ...restActions } = formData.actions;
                              setFormData({
                                ...formData,
                                actions: restActions
                              });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Create Deal</span>
                      </label>
                      
                      {formData.actions.create_deal && (
                        <div className="mt-2 ml-6 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Deal Stage
                            </label>
                            <select
                              value={formData.actions.create_deal.stage}
                              onChange={(e) => setFormData({
                                ...formData,
                                actions: {
                                  ...formData.actions,
                                  create_deal: {
                                    ...formData.actions.create_deal!,
                                    stage: e.target.value as any
                                  }
                                }
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="PROSPECT">Prospect</option>
                              <option value="QUALIFIED">Qualified</option>
                              <option value="PROPOSAL">Proposal</option>
                              <option value="NEGOTIATION">Negotiation</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Deal Value
                            </label>
                            <input
                              type="number"
                              value={formData.actions.create_deal.value || 0}
                              onChange={(e) => setFormData({
                                ...formData,
                                actions: {
                                  ...formData.actions,
                                  create_deal: {
                                    ...formData.actions.create_deal!,
                                    value: parseFloat(e.target.value) || 0
                                  }
                                }
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Company Status
                      </label>
                      <select
                        value={formData.actions.update_company?.status || ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({
                              ...formData,
                              actions: {
                                ...formData.actions,
                                update_company: { status: e.target.value as any }
                              }
                            });
                          } else {
                            const { update_company, ...restActions } = formData.actions;
                            setFormData({
                              ...formData,
                              actions: restActions
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No change</option>
                        <option value="PROSPECT">Prospect</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="PARTNER">Partner</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {showCreateModal ? 'Create Rule' : 'Update Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}