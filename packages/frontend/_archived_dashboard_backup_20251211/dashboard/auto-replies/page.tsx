'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

interface AutoReply {
  id: string;
  name: string;
  subject: string;
  message: string;
  triggerConditions: {
    keywords: string[];
    senderDomains: string[];
    subjects: string[];
  };
  isActive: boolean;
  priority: number;
  createdAt: string;
  lastTriggered?: string;
  triggeredCount: number;
  tags: string[];
  scheduleSettings: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    daysOfWeek: string[];
  };
}

interface NewAutoReply {
  name: string;
  subject: string;
  message: string;
  keywords: string;
  senderDomains: string;
  subjects: string;
  priority: number;
  tags: string;
}

export default function AutoRepliesPage() {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [filteredReplies, setFilteredReplies] = useState<AutoReply[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState<AutoReply | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newReply, setNewReply] = useState<NewAutoReply>({
    name: '',
    subject: '',
    message: '',
    keywords: '',
    senderDomains: '',
    subjects: '',
    priority: 1,
    tags: ''
  });

  useEffect(() => {
    loadAutoReplies();
  }, []);

  useEffect(() => {
    filterReplies();
  }, [autoReplies, searchTerm, statusFilter]);

  const loadAutoReplies = async () => {
    setTimeout(() => {
      const mockReplies: AutoReply[] = [
        {
          id: '1',
          name: 'Potwierdzenie otrzymania zapytania',
          subject: 'Otrzymaliśmy Twoje zapytanie - odpowiemy wkrótce',
          message: 'Dzięki za kontakt! Otrzymaliśmy Twoje zapytanie i odpowiemy w ciągu 24 godzin. Jeśli sprawa jest pilna, zadzwoń pod numer +48 123 456 789.\n\nPozdrawiamy,\nZespół Obsługi Klienta',
          triggerConditions: {
            keywords: ['zapytanie', 'pytanie', 'kontakt', 'pomoc'],
            senderDomains: [],
            subjects: ['zapytanie', 'pytanie', 'wiadomość']
          },
          isActive: true,
          priority: 1,
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          lastTriggered: new Date(Date.now() - 3600000).toISOString(),
          triggeredCount: 234,
          tags: ['obsługa klienta', 'potwierdzenie'],
          scheduleSettings: {
            enabled: true,
            startTime: '08:00',
            endTime: '18:00',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        },
        {
          id: '2',
          name: 'Odpowiedź na zgłoszenie techniczne',
          subject: 'Zgłoszenie techniczne otrzymane - #{ticket_id}',
          message: 'Twoje zgłoszenie techniczne zostało zarejestrowane pod numerem #{ticket_id}.\n\nNasz zespół techniczny przeanalizuje problem i skontaktuje się z Tobą w ciągu 4 godzin roboczych.\n\nW pilnych przypadkach prosimy o kontakt telefoniczny.\n\nDział Techniczny',
          triggerConditions: {
            keywords: ['błąd', 'problem', 'nie działa', 'awaria', 'technical'],
            senderDomains: [],
            subjects: ['support', 'bug', 'błąd', 'problem']
          },
          isActive: true,
          priority: 2,
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          lastTriggered: new Date(Date.now() - 7200000).toISOString(),
          triggeredCount: 89,
          tags: ['techniczne', 'wsparcie'],
          scheduleSettings: {
            enabled: true,
            startTime: '07:00',
            endTime: '19:00',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        },
        {
          id: '3',
          name: 'Odpowiedź poza godzinami pracy',
          subject: 'Wiadomość otrzymana poza godzinami pracy',
          message: 'Dziękujemy za wiadomość!\n\nTwoja wiadomość została otrzymana poza naszymi godzinami pracy (pon-pt 8:00-18:00).\n\nOdpowiemy pierwszego dnia roboczego.\n\nW sprawach pilnych prosimy o kontakt pod numerem alarmowym: +48 999 888 777\n\nPozdrawiamy',
          triggerConditions: {
            keywords: [],
            senderDomains: [],
            subjects: []
          },
          isActive: true,
          priority: 3,
          createdAt: new Date(Date.now() - 864000000).toISOString(),
          lastTriggered: new Date(Date.now() - 86400000).toISOString(),
          triggeredCount: 156,
          tags: ['poza godzinami', 'automatyczne'],
          scheduleSettings: {
            enabled: true,
            startTime: '18:01',
            endTime: '07:59',
            daysOfWeek: ['saturday', 'sunday']
          }
        },
        {
          id: '4',
          name: 'Potwierdzenie zamówienia',
          subject: 'Potwierdzenie zamówienia #{order_id}',
          message: 'Dziękujemy za złożenie zamówienia!\n\nNumer zamówienia: #{order_id}\nData: #{order_date}\n\nZamówienie zostanie przetworzone w ciągu 2 dni roboczych.\nLink do śledzenia zostanie wysłany osobną wiadomością.\n\nDział Sprzedaży',
          triggerConditions: {
            keywords: ['zamówienie', 'order', 'kup', 'zakup'],
            senderDomains: [],
            subjects: ['zamówienie', 'order', 'purchase']
          },
          isActive: false,
          priority: 1,
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          lastTriggered: new Date(Date.now() - 172800000).toISOString(),
          triggeredCount: 67,
          tags: ['zamówienia', 'sprzedaż'],
          scheduleSettings: {
            enabled: false,
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          }
        },
        {
          id: '5',
          name: 'Informacja o współpracy',
          subject: 'Informacje o możliwościach współpracy',
          message: 'Dziękujemy za zainteresowanie współpracą!\n\nPrześlij nam:\n- Opis Twojej firmy\n- Propozycję współpracy\n- Oczekiwania\n\nNasz dział partnerski skontaktuje się z Tobą w ciągu 3 dni roboczych.\n\nDział Rozwoju Biznesu',
          triggerConditions: {
            keywords: ['współpraca', 'partnerstwo', 'biznes', 'proposal'],
            senderDomains: [],
            subjects: ['współpraca', 'partnership', 'biznes']
          },
          isActive: true,
          priority: 2,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          triggeredCount: 23,
          tags: ['biznes', 'partnerstwo'],
          scheduleSettings: {
            enabled: true,
            startTime: '09:00',
            endTime: '17:00',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        }
      ];

      setAutoReplies(mockReplies);
      setIsLoading(false);
    }, 500);
  };

  const filterReplies = () => {
    let filtered = autoReplies.filter(reply => {
      const matchesSearch = reply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reply.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reply.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && reply.isActive) ||
                           (statusFilter === 'inactive' && !reply.isActive);
      
      return matchesSearch && matchesStatus;
    });

    setFilteredReplies(filtered);
  };

  const handleCreateReply = () => {
    if (!newReply.name.trim() || !newReply.subject.trim() || !newReply.message.trim()) {
      toast.error('Nazwa, temat i treść są wymagane');
      return;
    }

    const reply: AutoReply = {
      id: Date.now().toString(),
      name: newReply.name.trim(),
      subject: newReply.subject.trim(),
      message: newReply.message.trim(),
      triggerConditions: {
        keywords: newReply.keywords.split(',').map(k => k.trim()).filter(k => k),
        senderDomains: newReply.senderDomains.split(',').map(d => d.trim()).filter(d => d),
        subjects: newReply.subjects.split(',').map(s => s.trim()).filter(s => s)
      },
      isActive: true,
      priority: newReply.priority,
      createdAt: new Date().toISOString(),
      triggeredCount: 0,
      tags: newReply.tags.split(',').map(t => t.trim()).filter(t => t),
      scheduleSettings: {
        enabled: false,
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    };

    setAutoReplies(prev => [reply, ...prev]);
    setNewReply({
      name: '',
      subject: '',
      message: '',
      keywords: '',
      senderDomains: '',
      subjects: '',
      priority: 1,
      tags: ''
    });
    setShowCreateModal(false);
    toast.success('Automatyczna odpowiedź została utworzona!');
  };

  const toggleReplyStatus = (replyId: string) => {
    setAutoReplies(prev => prev.map(reply =>
      reply.id === replyId ? { ...reply, isActive: !reply.isActive } : reply
    ));
    toast.success('Status automatycznej odpowiedzi został zmieniony');
  };

  const deleteReply = (replyId: string) => {
    setAutoReplies(prev => prev.filter(reply => reply.id !== replyId));
    toast.success('Automatyczna odpowiedź została usunięta');
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
          <h1 className="text-2xl font-bold text-gray-900">Auto Replies</h1>
          <p className="text-gray-600">Zarządzaj automatycznymi odpowiedziami email</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Utwórz Auto Odpowiedź
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj odpowiedzi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Znaleziono: {filteredReplies.length} z {autoReplies.length}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie</p>
              <p className="text-2xl font-semibold text-gray-900">{autoReplies.length}</p>
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
                {autoReplies.filter(r => r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nieaktywne</p>
              <p className="text-2xl font-semibold text-gray-900">
                {autoReplies.filter(r => !r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wysłane dziś</p>
              <p className="text-2xl font-semibold text-gray-900">47</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Replies List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Automatyczne odpowiedzi ({filteredReplies.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredReplies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak automatycznych odpowiedzi</h3>
              <p className="text-gray-600">Utwórz pierwszą automatyczną odpowiedź</p>
            </div>
          ) : (
            filteredReplies.map((reply, index) => (
              <motion.div
                key={reply.id}
                className="p-6 hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{reply.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reply.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {reply.isActive ? 'Aktywna' : 'Nieaktywna'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Priorytet {reply.priority}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{reply.subject}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reply.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Utworzona: {formatDate(reply.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        Wysłano: {reply.triggeredCount} razy
                      </div>
                      {reply.lastTriggered && (
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Ostatnio: {formatDate(reply.lastTriggered)} {formatTime(reply.lastTriggered)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReply(reply);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Zobacz szczegóły"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleReplyStatus(reply.id)}
                      className={`p-2 ${
                        reply.isActive
                          ? 'text-gray-400 hover:text-orange-600'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={reply.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                    >
                      <PowerIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReply(reply.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Usuń"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Utwórz automatyczną odpowiedź</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa *
                  </label>
                  <input
                    type="text"
                    value={newReply.name}
                    onChange={(e) => setNewReply({ ...newReply, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="np. Potwierdzenie zapytania"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temat wiadomości *
                  </label>
                  <input
                    type="text"
                    value={newReply.subject}
                    onChange={(e) => setNewReply({ ...newReply, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="np. Otrzymaliśmy Twoje zapytanie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treść wiadomości *
                  </label>
                  <textarea
                    value={newReply.message}
                    onChange={(e) => setNewReply({ ...newReply, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={6}
                    placeholder="Treść automatycznej odpowiedzi..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Słowa kluczowe (oddzielone przecinkami)
                    </label>
                    <input
                      type="text"
                      value={newReply.keywords}
                      onChange={(e) => setNewReply({ ...newReply, keywords: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="zapytanie, pytanie, pomoc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={newReply.priority}
                      onChange={(e) => setNewReply({ ...newReply, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={1}>1 - Najwyższy</option>
                      <option value={2}>2 - Wysoki</option>
                      <option value={3}>3 - Średni</option>
                      <option value={4}>4 - Niski</option>
                      <option value={5}>5 - Najniższy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagi (oddzielone przecinkami)
                  </label>
                  <input
                    type="text"
                    value={newReply.tags}
                    onChange={(e) => setNewReply({ ...newReply, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="obsługa klienta, potwierdzenie"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateReply}
                  className="btn btn-primary flex-1"
                  disabled={!newReply.name.trim() || !newReply.subject.trim() || !newReply.message.trim()}
                >
                  Utwórz odpowiedź
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedReply && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedReply.name}</h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Temat</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReply.subject}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Treść wiadomości</h4>
                  <div className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">
                    {selectedReply.message}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Warunki wyzwolenia</h4>
                    <div className="space-y-2 text-sm">
                      {selectedReply.triggerConditions.keywords.length > 0 && (
                        <div>
                          <span className="font-medium">Słowa kluczowe:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedReply.triggerConditions.keywords.map(keyword => (
                              <span key={keyword} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Statystyki</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Wysłano:</span>
                        <span className="font-medium">{selectedReply.triggeredCount} razy</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Priorytet:</span>
                        <span className="font-medium">{selectedReply.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${selectedReply.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedReply.isActive ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tagi</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedReply.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Zamknij
                </button>
                <button
                  onClick={() => toggleReplyStatus(selectedReply.id)}
                  className={`btn flex-1 ${
                    selectedReply.isActive ? 'btn-outline' : 'btn-primary'
                  }`}
                >
                  {selectedReply.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}