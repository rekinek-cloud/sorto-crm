'use client';

import { useState } from 'react';
import { X, Calendar, User, Tag, ExternalLink, Edit, Trash2, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { InboxItem } from '@/lib/api/sourceInbox';

interface InboxItemDetailModalProps {
  item: InboxItem;
  onClose: () => void;
  onProcess: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<InboxItem>) => void;
}

export default function InboxItemDetailModal({ 
  item, 
  onClose, 
  onProcess, 
  onDelete,
  onUpdate 
}: InboxItemDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(item.content);
  const [editedNote, setEditedNote] = useState(item.note || '');

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'voice': return '🎤';
      case 'scan': return '📄';
      case 'quick-capture': return '⚡';
      case 'meeting': return '📋';
      case 'phone': return '📞';
      case 'idea': return '💡';
      case 'document': return '📄';
      case 'photo': return '📷';
      case 'other': return '📦';
      default: return '📝';
    }
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    
    const badges: Record<string, { text: string; className: string }> = {
      DO: { text: 'Zrobione', className: 'bg-green-100 text-green-800' },
      DEFER: { text: 'Odłożone', className: 'bg-yellow-100 text-yellow-800' },
      DELEGATE: { text: 'Delegowane', className: 'bg-blue-100 text-blue-800' },
      DELETE: { text: 'Usunięte', className: 'bg-red-100 text-red-800' },
      REFERENCE: { text: 'Referencja', className: 'bg-purple-100 text-purple-800' },
      PROJECT: { text: 'Projekt', className: 'bg-indigo-100 text-indigo-800' },
      SOMEDAY: { text: 'Kiedyś/Może', className: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[decision];
    if (!badge) return null;
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        content: editedContent,
        note: editedNote
      });
      toast.success('Element zaktualizowany');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(item.content);
    setEditedNote(item.note || '');
    setIsEditing(false);
  };

  const handleProcess = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProcess();
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
            <div className="text-3xl">{getSourceIcon(item.source)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Szczegóły elementu
              </h2>
              <p className="text-sm text-gray-500">
                {item.source} • {formatDistanceToNow(new Date(item.capturedAt), { 
                  addSuffix: true, 
                  locale: pl 
                })}
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
          {/* Main Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treść
            </label>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                {item.content}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notatka
            </label>
            {isEditing ? (
              <textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                rows={2}
                placeholder="Dodaj notatkę..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md min-h-[3rem]">
                {item.note || 'Brak notatki'}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center gap-2">
                {item.processed ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    ✅ Przetworzone
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                    ⏳ Nieprzetworzone
                  </span>
                )}
                {item.processingDecision && getDecisionBadge(item.processingDecision)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autor
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {item.capturedBy.firstName} {item.capturedBy.lastName}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data przechwycenia
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {format(new Date(item.capturedAt), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
            </div>

            {item.processedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data przetworzenia
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(item.processedAt), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Source URL */}
          {item.sourceUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Źródło
              </label>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:text-primary-800"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">{item.sourceUrl}</span>
              </a>
            </div>
          )}

          {/* Resulting Task */}
          {item.resultingTask && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utworzone zadanie
              </label>
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900">{item.resultingTask.title}</h4>
                <p className="text-sm text-blue-600">Status: {item.resultingTask.status}</p>
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
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
            {!item.processed && (
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Przetwórz
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