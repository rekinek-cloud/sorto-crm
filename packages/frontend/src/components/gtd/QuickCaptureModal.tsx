'use client';

import { useState } from 'react';
import { gtdApi } from '@/lib/api/gtd';
import { toast } from 'react-hot-toast';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickCaptureModal({ isOpen, onClose, onSuccess }: QuickCaptureModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TASK' as 'TASK' | 'IDEA' | 'REQUEST',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    estimatedTime: '',
    context: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Tytuł jest wymagany');
      return;
    }

    setLoading(true);
    try {
      await gtdApi.createInboxItem({
        ...formData,
        dueDate: formData.dueDate || undefined
      });
      
      toast.success('Element dodany do Źródła');
      setFormData({
        title: '',
        description: '',
        type: 'TASK',
        priority: 'MEDIUM',
        estimatedTime: '',
        context: '',
        dueDate: ''
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating inbox item:', error);
      toast.error('Nie udało się utworzyć elementu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Szybkie przechwytywanie</h3>
              <p className="text-sm text-gray-600 mt-1">Dodaj nowy element do Źródła</p>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Tytuł <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Co chcesz przechwycić?"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Dodaj dodatkowe szczegóły..."
                />
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Typ
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="TASK">Zadanie</option>
                    <option value="IDEA">Pomysł</option>
                    <option value="REQUEST">Prośba</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priorytet
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="LOW">Niski</option>
                    <option value="MEDIUM">Średni</option>
                    <option value="HIGH">Wysoki</option>
                    <option value="URGENT">Pilny</option>
                  </select>
                </div>
              </div>

              {/* Context and Estimated Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                    Kontekst
                  </label>
                  <input
                    type="text"
                    id="context"
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="@biuro, @dom..."
                  />
                </div>

                <div>
                  <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Szacowany czas
                  </label>
                  <input
                    type="text"
                    id="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="15m, 1h, 2d..."
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Termin
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Dodawanie...' : 'Dodaj do Źródła'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}