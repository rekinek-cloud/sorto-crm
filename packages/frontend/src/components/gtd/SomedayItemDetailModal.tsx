'use client';

import { useState } from 'react';
import { X, Lightbulb, Calendar, Tag, Edit, Trash2, Save, ArrowRight, Star, Archive } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface SomedayItem {
  id: string;
  title: string;
  description?: string;
  category: 'PROJECT' | 'IDEA' | 'GOAL' | 'LEARNING' | 'TRAVEL' | 'PURCHASE' | 'OTHER';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dateAdded: string;
  lastReviewed?: string;
  reviewFrequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  tags?: string[];
  estimatedCost?: number;
  estimatedTime?: string;
  prerequisites?: string[];
  notes?: string;
}

interface SomedayItemDetailModalProps {
  item: SomedayItem;
  onClose: () => void;
  onPromoteToAction: () => void;
  onMarkReviewed: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onUpdate?: (updates: Partial<SomedayItem>) => void;
}

const CATEGORIES = {
  PROJECT: { name: 'Projekt', icon: '🎯', color: 'bg-blue-100 text-blue-800' },
  IDEA: { name: 'Pomysł', icon: '💡', color: 'bg-yellow-100 text-yellow-800' },
  GOAL: { name: 'Cel', icon: '🏆', color: 'bg-green-100 text-green-800' },
  LEARNING: { name: 'Nauka', icon: '📚', color: 'bg-purple-100 text-purple-800' },
  TRAVEL: { name: 'Podróż', icon: '✈️', color: 'bg-indigo-100 text-indigo-800' },
  PURCHASE: { name: 'Zakup', icon: '🛒', color: 'bg-orange-100 text-orange-800' },
  OTHER: { name: 'Inne', icon: '📝', color: 'bg-gray-100 text-gray-800' }
};

export default function SomedayItemDetailModal({ 
  item, 
  onClose, 
  onPromoteToAction,
  onMarkReviewed,
  onArchive,
  onDelete,
  onUpdate 
}: SomedayItemDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedDescription, setEditedDescription] = useState(item.description || '');
  const [editedCategory, setEditedCategory] = useState(item.category);
  const [editedPriority, setEditedPriority] = useState(item.priority);
  const [editedReviewFrequency, setEditedReviewFrequency] = useState(item.reviewFrequency);
  const [editedCost, setEditedCost] = useState(item.estimatedCost?.toString() || '');
  const [editedTime, setEditedTime] = useState(item.estimatedTime || '');
  const [editedNotes, setEditedNotes] = useState(item.notes || '');
  const [editedTags, setEditedTags] = useState(item.tags?.join(', ') || '');
  const [editedPrerequisites, setEditedPrerequisites] = useState(item.prerequisites?.join('\n') || '');

  const category = CATEGORIES[item.category];

  const getCategoryBadge = (categoryKey: SomedayItem['category']) => {
    const cat = CATEGORIES[categoryKey];
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${cat.color}`}>
        {cat.icon} {cat.name}
      </span>
    );
  };

  const getPriorityBadge = (priority: SomedayItem['priority']) => {
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

  const getReviewFrequencyText = (frequency: SomedayItem['reviewFrequency']) => {
    const frequencies = {
      WEEKLY: 'Tygodniowy',
      MONTHLY: 'Miesięczny', 
      QUARTERLY: 'Kwartalny',
      YEARLY: 'Roczny'
    };
    return frequencies[frequency];
  };

  const needsReview = (() => {
    if (!item.lastReviewed) return true;
    const daysSinceReview = (Date.now() - new Date(item.lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
    const reviewDays = { WEEKLY: 7, MONTHLY: 30, QUARTERLY: 90, YEARLY: 365 };
    return daysSinceReview > reviewDays[item.reviewFrequency];
  })();

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        title: editedTitle,
        description: editedDescription,
        category: editedCategory,
        priority: editedPriority,
        reviewFrequency: editedReviewFrequency,
        estimatedCost: editedCost ? parseFloat(editedCost) : undefined,
        estimatedTime: editedTime || undefined,
        notes: editedNotes || undefined,
        tags: editedTags ? editedTags.split(',').map(t => t.trim()).filter(t => t) : undefined,
        prerequisites: editedPrerequisites ? editedPrerequisites.split('\n').map(p => p.trim()).filter(p => p) : undefined
      });
      toast.success('Element zaktualizowany');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(item.title);
    setEditedDescription(item.description || '');
    setEditedCategory(item.category);
    setEditedPriority(item.priority);
    setEditedReviewFrequency(item.reviewFrequency);
    setEditedCost(item.estimatedCost?.toString() || '');
    setEditedTime(item.estimatedTime || '');
    setEditedNotes(item.notes || '');
    setEditedTags(item.tags?.join(', ') || '');
    setEditedPrerequisites(item.prerequisites?.join('\n') || '');
    setIsEditing(false);
  };

  const handlePromote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPromoteToAction();
  };

  const handleReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkReviewed();
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten element?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{category.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Szczegóły elementu Someday/Maybe
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

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoria
              </label>
              {isEditing ? (
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value as SomedayItem['category'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              ) : (
                getCategoryBadge(item.category)
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet
              </label>
              {isEditing ? (
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as SomedayItem['priority'])}
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
                Częstotliwość przeglądu
              </label>
              {isEditing ? (
                <select
                  value={editedReviewFrequency}
                  onChange={(e) => setEditedReviewFrequency(e.target.value as SomedayItem['reviewFrequency'])}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="WEEKLY">Tygodniowy</option>
                  <option value="MONTHLY">Miesięczny</option>
                  <option value="QUARTERLY">Kwartalny</option>
                  <option value="YEARLY">Roczny</option>
                </select>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  📅 {getReviewFrequencyText(item.reviewFrequency)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status przeglądu
              </label>
              <div className="flex items-center gap-2">
                {needsReview ? (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800">
                    📋 Wymaga przeglądu
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    ✅ Aktualne
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cost and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szacowany koszt (PLN)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editedCost}
                  onChange={(e) => setEditedCost(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <span className="text-gray-600">
                  {item.estimatedCost ? `${item.estimatedCost.toLocaleString('pl-PL')} PLN` : 'Nie określono'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Szacowany czas
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  placeholder="np. 3 miesiące, 2 tygodnie"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <span className="text-gray-600">
                  {item.estimatedTime || 'Nie określono'}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagi
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">Brak tagów</span>
            )}
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wymagania wstępne
            </label>
            {isEditing ? (
              <textarea
                value={editedPrerequisites}
                onChange={(e) => setEditedPrerequisites(e.target.value)}
                rows={3}
                placeholder="Każde wymaganie w nowej linii"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : item.prerequisites && item.prerequisites.length > 0 ? (
              <ul className="text-gray-600 bg-gray-50 p-3 rounded-md list-disc ml-4">
                {item.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 bg-gray-50 p-3 rounded-md block">Brak wymagań</span>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notatki
            </label>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={3}
                placeholder="Dodatkowe notatki..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            ) : (
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md min-h-[3rem] italic">
                {item.notes || 'Brak notatek'}
              </p>
            )}
          </div>

          {/* Review History */}
          {item.lastReviewed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ostatni przegląd
              </label>
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700">
                  {format(new Date(item.lastReviewed), 'dd.MM.yyyy HH:mm')}
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
            <button
              onClick={handlePromote}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <ArrowRight className="w-4 h-4" />
              Do akcji
            </button>
            <button
              onClick={handleReview}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Star className="w-4 h-4" />
              Przejrzane
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              <Archive className="w-4 h-4" />
              Archiwizuj
            </button>
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