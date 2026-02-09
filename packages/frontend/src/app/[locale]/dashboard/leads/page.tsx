'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { leadsApi, Lead } from '@/lib/api/leads';

interface NewLead {
  title: string;
  contactPerson: string;
  company: string;
  source: string;
  value: string;
  priority: string;
  description: string;
}

const STATUS_COLUMNS = [
  { id: 'NEW', title: 'Nowe', color: 'border-blue-200' },
  { id: 'CONTACTED', title: 'Kontakt', color: 'border-purple-200' },
  { id: 'QUALIFIED', title: 'Kwalifikacja', color: 'border-orange-200' },
  { id: 'PROPOSAL', title: 'Propozycja', color: 'border-yellow-200' },
  { id: 'NEGOTIATION', title: 'Negocjacje', color: 'border-indigo-200' },
  { id: 'WON', title: 'Wygrane', color: 'border-green-200' },
  { id: 'LOST', title: 'Przegrane', color: 'border-red-200' }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [newLead, setNewLead] = useState<NewLead>({
    title: '',
    contactPerson: '',
    company: '',
    source: 'WEBSITE',
    value: '',
    priority: 'MEDIUM',
    description: ''
  });

  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await leadsApi.getLeads({ limit: 100 });
      setLeads(response.leads);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Nie udało się załadować leadów');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    let filtered = leads;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.title.toLowerCase().includes(term) ||
        lead.contactPerson?.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'text-blue-600 bg-blue-100';
      case 'CONTACTED': return 'text-purple-600 bg-purple-100';
      case 'QUALIFIED': return 'text-orange-600 bg-orange-100';
      case 'PROPOSAL': return 'text-yellow-600 bg-yellow-100';
      case 'NEGOTIATION': return 'text-indigo-600 bg-indigo-100';
      case 'WON': return 'text-green-600 bg-green-100';
      case 'LOST': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleAddLead = async () => {
    if (!newLead.title.trim()) {
      toast.error('Nazwa leada jest wymagana');
      return;
    }

    try {
      const created = await leadsApi.createLead({
        title: newLead.title.trim(),
        contactPerson: newLead.contactPerson.trim() || undefined,
        company: newLead.company.trim() || undefined,
        source: newLead.source || undefined,
        value: newLead.value ? parseFloat(newLead.value) : undefined,
        priority: newLead.priority,
        description: newLead.description.trim() || undefined,
      });

      setLeads(prev => [created, ...prev]);
      setNewLead({
        title: '',
        contactPerson: '',
        company: '',
        source: 'WEBSITE',
        value: '',
        priority: 'MEDIUM',
        description: ''
      });
      setShowAddModal(false);
      toast.success('Lead dodany pomyślnie!');
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast.error('Nie udało się dodać leada');
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const updated = await leadsApi.updateLead(leadId, { status: newStatus });
      setLeads(prev => prev.map(lead => lead.id === leadId ? updated : lead));
      toast.success('Status leada zaktualizowany');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Nie udało się zaktualizować statusu');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await leadsApi.deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      setShowDetailsModal(false);
      toast.success('Lead usunięty');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Nie udało się usunąć leada');
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getLeadStats = () => {
    const total = leads.length;
    const won = leads.filter(l => l.status === 'WON').length;
    const lost = leads.filter(l => l.status === 'LOST').length;
    const active = total - won - lost;
    const totalValue = leads
      .filter(l => l.value && l.status === 'WON')
      .reduce((sum, l) => sum + (l.value || 0), 0);

    return { total, won, lost, active, totalValue };
  };

  const stats = getLeadStats();

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Leads CRM</h1>
          <p className="text-gray-600">Zarządzaj potencjalnymi klientami i możliwościami</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
            className="btn btn-outline"
          >
            <ChartBarIcon className="w-5 h-5 mr-2" />
            {viewMode === 'kanban' ? 'Tabela' : 'Kanban'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Dodaj Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FireIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wygrane</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.won}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Przegrane</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lost}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wartość</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj leadów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="ALL">Wszystkie statusy</option>
            {STATUS_COLUMNS.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="ALL">Wszystkie priorytety</option>
            <option value="URGENT">Pilne</option>
            <option value="HIGH">Wysokie</option>
            <option value="MEDIUM">Średnie</option>
            <option value="LOW">Niskie</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto">
          <div className="flex space-x-6 pb-4" style={{ minWidth: '1400px' }}>
            {STATUS_COLUMNS.map(column => (
              <div key={column.id} className="flex-1 min-w-64">
                <div className={`bg-white rounded-lg border-t-4 ${column.color} shadow-sm`}>
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <p className="text-sm text-gray-600">
                      {filteredLeads.filter(lead => lead.status === column.id).length} leadów
                    </p>
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {filteredLeads
                      .filter(lead => lead.status === column.id)
                      .map((lead, index) => (
                        <motion.div
                          key={lead.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDetailsModal(true);
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{lead.title}</h4>
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(lead.priority)}`}></span>
                          </div>

                          {lead.company && (
                            <p className="text-xs text-gray-600 mb-1">{lead.company}</p>
                          )}
                          {lead.contactPerson && (
                            <p className="text-xs text-gray-500 mb-2">{lead.contactPerson}</p>
                          )}

                          {lead.value != null && lead.value > 0 && (
                            <p className="text-sm font-semibold text-green-600 mb-2">
                              {formatCurrency(lead.value)}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(lead.updatedAt)}</span>
                            {lead.source && <span>{lead.source}</span>}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wartość</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorytet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktualizacja</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.title}</div>
                        {lead.contactPerson && (
                          <div className="text-sm text-gray-500">{lead.contactPerson}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.company || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {STATUS_COLUMNS.find(s => s.id === lead.status)?.title || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(lead.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Zobacz
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Dodaj nowy lead</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa leada *
                    </label>
                    <input
                      type="text"
                      value={newLead.title}
                      onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Np. Wdrożenie CRM dla klienta X"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Osoba kontaktowa
                    </label>
                    <input
                      type="text"
                      value={newLead.contactPerson}
                      onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Jan Kowalski"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firma
                    </label>
                    <input
                      type="text"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nazwa firmy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Źródło
                    </label>
                    <select
                      value={newLead.source}
                      onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="WEBSITE">Strona internetowa</option>
                      <option value="REFERRAL">Referencje</option>
                      <option value="SOCIAL_MEDIA">Social Media</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Telefon</option>
                      <option value="EVENT">Wydarzenie</option>
                      <option value="OTHER">Inne</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wartość (PLN)
                    </label>
                    <input
                      type="number"
                      value={newLead.value}
                      onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={newLead.priority}
                      onChange={(e) => setNewLead({ ...newLead, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                      <option value="URGENT">Pilny</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis / Notatki
                  </label>
                  <textarea
                    value={newLead.description}
                    onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Dodatkowe informacje o leadzie..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddLead}
                  className="btn btn-primary flex-1"
                  disabled={!newLead.title.trim()}
                >
                  Dodaj Lead
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedLead.title}</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Informacje</h4>
                    <div className="space-y-2 text-sm">
                      {selectedLead.contactPerson && (
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {selectedLead.contactPerson}
                        </div>
                      )}
                      {selectedLead.company && (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {selectedLead.company}
                        </div>
                      )}
                      {selectedLead.source && (
                        <div className="text-gray-600">Źródło: {selectedLead.source}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Status i priorytet</h4>
                    <div className="space-y-2">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLead.status)}`}>
                          {STATUS_COLUMNS.find(s => s.id === selectedLead.status)?.title || selectedLead.status}
                        </span>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${getPriorityColor(selectedLead.priority)}`}>
                          Priorytet: {selectedLead.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLead.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Opis</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedLead.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Wartość</h4>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedLead.value)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Utworzono</h4>
                    <p className="text-sm text-gray-700">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Zmień status</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_COLUMNS.map(status => (
                      <button
                        key={status.id}
                        onClick={() => {
                          updateLeadStatus(selectedLead.id, status.id);
                          setSelectedLead({ ...selectedLead, status: status.id as any });
                        }}
                        className={`btn text-xs ${selectedLead.status === status.id ? 'btn-primary' : 'btn-outline'}`}
                        disabled={selectedLead.status === status.id}
                      >
                        {status.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-end">
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm"
                  >
                    Usuń lead
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
