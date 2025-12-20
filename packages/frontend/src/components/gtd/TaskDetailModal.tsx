'use client';

import { useState } from 'react';
import { X, Calendar, Clock, User, Tag, Save, Edit, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Task } from '@/lib/api/tasks';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<Task>) => void;
}

export default function TaskDetailModal({ 
  task, 
  onClose, 
  onComplete, 
  onDelete,
  onUpdate 
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedContext, setEditedContext] = useState(task.context || '');
  const [editedDueDate, setEditedDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  );

  const getPriorityBadge = (priority: Task['priority']) => {
    const badges = {
      LOW: { text: 'Niski', className: 'bg-blue-100 text-blue-800', icon: '🔵' },
      MEDIUM: { text: 'Średni', className: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      HIGH: { text: 'Wysoki', className: 'bg-red-100 text-red-800', icon: '🔴' },
      URGENT: { text: 'Pilny', className: 'bg-purple-100 text-purple-800', icon: '🚨' }
    };
    
    const badge = badges[priority];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getStatusBadge = (status: Task['status']) => {
    const badges = {
      TODO: { text: 'Do zrobienia', className: 'bg-gray-100 text-gray-800', icon: '📋' },
      IN_PROGRESS: { text: 'W trakcie', className: 'bg-blue-100 text-blue-800', icon: '⚡' },
      WAITING: { text: 'Oczekuje', className: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      DONE: { text: 'Ukończone', className: 'bg-green-100 text-green-800', icon: '✅' },
      CANCELLED: { text: 'Anulowane', className: 'bg-red-100 text-red-800', icon: '❌' }
    };
    
    const badge = badges[status];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getContextIcon = (context?: string) => {
    if (!context) return '📝';
    switch (context) {
      case '@computer': return '💻';
      case '@calls': return '📞';
      case '@office': return '🏢';
      case '@home': return '🏠';
      case '@errands': return '🚗';
      case '@online': return '🌐';
      case '@waiting': return '⏳';
      case '@reading': return '📚';
      default: return '📝';
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        title: editedTitle,
        description: editedDescription,
        priority: editedPriority,
        context: editedContext,
        dueDate: editedDueDate ? new Date(editedDueDate).toISOString() : undefined
      });
      toast.success('Zadanie zaktualizowane');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
    setEditedContext(task.context || '');
    setEditedDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setIsEditing(false);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      onDelete();
    }
  };

  const contexts = [
    { value: '', label: 'Brak kontekstu' },
    { value: '@computer', label: '💻 @computer' },
    { value: '@calls', label: '📞 @calls' },
    { value: '@office', label: '🏢 @office' },
    { value: '@home', label: '🏠 @home' },
    { value: '@errands', label: '🚗 @errands' },
    { value: '@online', label: '🌐 @online' },
    { value: '@waiting', label: '⏳ @waiting' },
    { value: '@reading', label: '📚 @reading' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getContextIcon(task.context)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Szczegóły zadania
              </h2>
              <p className="text-sm text-gray-500">
                Utworzone {format(new Date(task.createdAt), 'dd.MM.yyyy HH:mm')}
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
              Tytuł zadania
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
                {task.title}
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
                placeholder="Dodaj opis zadania..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md min-h-[3rem]">
                {task.description || 'Brak opisu'}
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {getStatusBadge(task.status)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet
              </label>
              {isEditing ? (
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as Task['priority'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="LOW">🔵 Niski</option>
                  <option value="MEDIUM">🟡 Średni</option>
                  <option value="HIGH">🔴 Wysoki</option>
                  <option value="URGENT">🚨 Pilny</option>
                </select>
              ) : (
                getPriorityBadge(task.priority)
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontekst
              </label>
              {isEditing ? (
                <select
                  value={editedContext}
                  onChange={(e) => setEditedContext(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {contexts.map(ctx => (
                    <option key={ctx.value} value={ctx.value}>{ctx.label}</option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {getContextIcon(task.context)} {task.context || 'Brak kontekstu'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Termin
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : task.dueDate ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(task.dueDate), 'dd.MM.yyyy')}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Brak terminu</span>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data utworzenia
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {format(new Date(task.createdAt), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
            </div>

            {task.completedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data ukończenia
                </label>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(task.completedAt), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              </div>
            )}
          </div>
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
            {task.status !== 'DONE' && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Ukończ
              </button>
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