'use client';

import { useState } from 'react';
import { X, User, Calendar, Bell, CheckCircle, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface WaitingItem {
  id: string;
  title: string;
  description?: string;
  waitingForPerson: string;
  waitingForPersonEmail?: string;
  dateAdded: string;
  followUpDate?: string;
  lastFollowUp?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'WAITING' | 'FOLLOWED_UP' | 'COMPLETED' | 'OVERDUE';
  context?: string;
  tags?: string[];
}

interface WaitingItemDetailModalProps {
  item: WaitingItem;
  onClose: () => void;
  onComplete: () => void;
  onFollowUp: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<WaitingItem>) => void;
}

export default function WaitingItemDetailModal({ 
  item, 
  onClose, 
  onComplete, 
  onFollowUp,
  onDelete,
  onUpdate 
}: WaitingItemDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedDescription, setEditedDescription] = useState(item.description || '');
  const [editedPerson, setEditedPerson] = useState(item.waitingForPerson);
  const [editedEmail, setEditedEmail] = useState(item.waitingForPersonEmail || '');
  const [editedPriority, setEditedPriority] = useState(item.priority);
  const [editedContext, setEditedContext] = useState(item.context || '');
  const [editedFollowUpDate, setEditedFollowUpDate] = useState(
    item.followUpDate ? item.followUpDate.split('T')[0] : ''
  );

  const getStatusBadge = (status: WaitingItem['status']) => {
    const badges = {
      WAITING: { text: 'Oczekuje', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      FOLLOWED_UP: { text: 'Upomnienie', className: 'bg-blue-100 text-blue-800', icon: '📧' },
      OVERDUE: { text: 'Przeterminowane', className: 'bg-red-100 text-red-800', icon: '🚨' },
      COMPLETED: { text: 'Ukończone', className: 'bg-green-100 text-green-800', icon: '✅' }
    };
    
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: WaitingItem['priority']) => {
    const badges = {
      LOW: { text: 'Niski', className: 'bg-blue-100 text-blue-800', icon: '🔵' },
      MEDIUM: { text: 'Średni', className: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      HIGH: { text: 'Wysoki', className: 'bg-red-100 text-red-800', icon: '🔴' }
    };
    
    const badge = badges[priority];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        title: editedTitle,
        description: editedDescription,
        waitingForPerson: editedPerson,
        waitingForPersonEmail: editedEmail,
        priority: editedPriority,
        context: editedContext,
        followUpDate: editedFollowUpDate ? new Date(editedFollowUpDate).toISOString() : undefined
      });
      toast.success('Element zaktualizowany');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(item.title);
    setEditedDescription(item.description || '');
    setEditedPerson(item.waitingForPerson);
    setEditedEmail(item.waitingForPersonEmail || '');
    setEditedPriority(item.priority);
    setEditedContext(item.context || '');
    setEditedFollowUpDate(item.followUpDate ? item.followUpDate.split('T')[0] : '');
    setIsEditing(false);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  const handleFollowUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowUp();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten element?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⏳</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Szczegóły elementu oczekującego
              </h2>
              <p className="text-sm text-gray-500">
                Dodano {format(new Date(item.dateAdded), 'dd.MM.yyyy HH:mm')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tytuł
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <h3 className="text-lg font-medium text-gray-900 bg-gray-50 p-3 rounded-md">
                {item.title}
              </h3>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opis
            </label>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                placeholder="Dodaj opis..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md min-h-[3rem]">
                {item.description || 'Brak opisu'}
              </p>
            )}
          </div>

          {/* Person Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Osoba odpowiedzialna
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPerson}
                  onChange={(e) => setEditedPerson(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{item.waitingForPerson}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-gray-600">{item.waitingForPersonEmail || 'Brak emaila'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {getStatusBadge(item.status)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet
              </label>
              {isEditing ? (
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as WaitingItem['priority'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="LOW">🔵 Niski</option>
                  <option value="MEDIUM">🟡 Średni</option>
                  <option value="HIGH">🔴 Wysoki</option>
                </select>
              ) : (
                getPriorityBadge(item.priority)
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontekst
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedContext}
                  onChange={(e) => setEditedContext(e.target.value)}
                  placeholder="@calls, @office, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {item.context || 'Brak kontekstu'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data follow-up
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedFollowUpDate}
                  onChange={(e) => setEditedFollowUpDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : item.followUpDate ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(item.followUpDate), 'dd.MM.yyyy')}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Nie ustawiono</span>
              )}
            </div>
          </div>

          {/* Last Follow Up */}
          {item.lastFollowUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ostatnie upomnienie
              </label>
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700">
                  {format(new Date(item.lastFollowUp), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Save className="w-4 h-4" />
                  Zapisz
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Anuluj
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <Edit className="w-4 h-4" />
                Edytuj
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item.status !== 'COMPLETED' && (
              <>
                <button
                  onClick={handleFollowUp}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Bell className="w-4 h-4" />
                  Upomnienie
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Ukończ
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Usuń
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}