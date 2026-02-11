// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { eventsApi, CreateEventRequest, EventFilters } from '@/lib/api/events';
import { Event } from '@/types/gtd';

const EVENT_TYPES = [
  { value: 'CONFERENCE', label: 'Konferencja' },
  { value: 'TRADE_SHOW', label: 'Targi' },
  { value: 'EXHIBITION', label: 'Wystawa' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'WORKSHOP', label: 'Warsztaty' },
  { value: 'COMPANY_EVENT', label: 'Event firmowy' },
  { value: 'OTHER', label: 'Inne' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Szkic' },
  { value: 'PLANNING', label: 'Planowanie' },
  { value: 'CONFIRMED', label: 'Potwierdzone' },
  { value: 'IN_PROGRESS', label: 'W trakcie' },
  { value: 'COMPLETED', label: 'Zakonczone' },
  { value: 'CANCELLED', label: 'Anulowane' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'bg-gray-100 text-gray-700';
    case 'PLANNING': return 'bg-blue-100 text-blue-700';
    case 'CONFIRMED': return 'bg-green-100 text-green-700';
    case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
    case 'COMPLETED': return 'bg-gray-100 text-gray-600';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
};

const getEventTypeLabel = (type: string) => {
  return EVENT_TYPES.find(t => t.value === type)?.label || type;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency || 'PLN',
  }).format(amount);
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'CONFERENCE' as string,
    venue: '',
    city: '',
    country: 'Polska',
    startDate: '',
    endDate: '',
    budgetPlanned: '',
    currency: 'PLN',
    status: 'PLANNING' as string,
  });

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: EventFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.eventType = typeFilter;

      const response = await eventsApi.getEvents(filters);
      let sorted = [...response.events];
      sorted.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      setEvents(sorted);
      setPagination(prev => ({ ...prev, total: response.pagination.total, pages: response.pagination.pages }));
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Nie udalo sie zaladowac eventow');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nazwa eventu jest wymagana');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Daty poczatkowa i koncowa sa wymagane');
      return;
    }

    try {
      const data: CreateEventRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        eventType: formData.eventType as any,
        venue: formData.venue.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetPlanned: formData.budgetPlanned ? parseFloat(formData.budgetPlanned) : undefined,
        currency: formData.currency || 'PLN',
        status: formData.status as any,
      };

      await eventsApi.createEvent(data);
      toast.success('Event utworzony pomyslnie!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        eventType: 'CONFERENCE',
        venue: '',
        city: '',
        country: 'Polska',
        startDate: '',
        endDate: '',
        budgetPlanned: '',
        currency: 'PLN',
        status: 'PLANNING',
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Nie udalo sie utworzyc eventu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten event?')) return;
    try {
      await eventsApi.deleteEvent(id);
      toast.success('Event usuniety');
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Nie udalo sie usunac eventu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventy / Targi</h1>
          <p className="text-gray-600">Zarzadzaj wydarzeniami i targami</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Wszystkie</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Planowane</p>
          <p className="text-2xl font-bold text-blue-600">{events.filter(e => e.status === 'PLANNING').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Potwierdzone</p>
          <p className="text-2xl font-bold text-green-600">{events.filter(e => e.status === 'CONFIRMED').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">W trakcie</p>
          <p className="text-2xl font-bold text-yellow-600">{events.filter(e => e.status === 'IN_PROGRESS').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Wszystkie statusy</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Wszystkie typy</option>
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Data: {sortOrder === 'asc' ? 'rosnaco' : 'malejaco'} {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <div className="text-sm text-gray-500 ml-auto">
            Znaleziono: {events.length}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nazwa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miejsce</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budzet</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-4xl mb-3">📅</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Brak eventow</h3>
                    <p className="text-gray-600">Dodaj pierwszy event aby rozpoczac</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {event.name}
                      </Link>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{event.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getEventTypeLabel(event.eventType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{event.venue || '-'}</div>
                      {event.city && <div className="text-xs text-gray-500">{event.city}{event.country ? `, ${event.country}` : ''}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{formatDate(event.startDate)}</div>
                      <div className="text-xs text-gray-500">do {formatDate(event.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(event.budgetPlanned, event.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Usun
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Strona {pagination.page} z {pagination.pages} (lacznie {pagination.total})
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100 text-sm"
            >
              Poprzednia
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100 text-sm"
            >
              Nastepna
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nowy event</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa eventu *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Np. Targi ITM Poznan 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Krotki opis wydarzenia..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ wydarzenia *</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miejsce</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hala Expo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Miasto</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Poznan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kraj</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Polska"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczecia *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data zakonczenia *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planowany budzet</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budgetPlanned}
                    onChange={(e) => setFormData({ ...formData, budgetPlanned: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!formData.name.trim() || !formData.startDate || !formData.endDate}
              >
                Utworz event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
