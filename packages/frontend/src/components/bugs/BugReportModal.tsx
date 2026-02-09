'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface BugReportForm {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: 'UI_UX' | 'FUNCTIONALITY' | 'PERFORMANCE' | 'SECURITY' | 'DATA' | 'INTEGRATION' | 'OTHER';
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}

export default function BugReportModal({ isOpen, onClose, onSuccess }: BugReportModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BugReportForm>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: undefined,
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.description.trim()) {
      setError('Tytuł i opis są wymagane');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Collect browser and environment info
      const browserInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        browserInfo: JSON.stringify({
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screenResolution: `${screen.width}x${screen.height}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`
        }),
        deviceInfo: JSON.stringify({
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          screen: `${screen.width}x${screen.height}`,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth
        })
      };

      const bugReportData = {
        ...form,
        ...browserInfo,
        stepsToReproduce: form.stepsToReproduce || undefined,
        expectedBehavior: form.expectedBehavior || undefined,
        actualBehavior: form.actualBehavior || undefined
      };

      await apiClient.post('/admin/bug-reports', bugReportData);
      
      // Reset form
      setForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: undefined,
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: ''
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to submit bug report:', error);
      setError(error.response?.data?.error || 'Nie udało się wysłać zgłoszenia');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BugReportForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-medium text-gray-900">Zgłoś błąd</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XMarkIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tytuł błędu *</label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Krótki opis problemu"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Średni</option>
                <option value="HIGH">Wysoki</option>
                <option value="CRITICAL">Krytyczny</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
              <select
                id="category"
                value={form.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Wybierz kategorię</option>
                <option value="UI_UX">Interfejs użytkownika</option>
                <option value="FUNCTIONALITY">Funkcjonalność</option>
                <option value="PERFORMANCE">Wydajność</option>
                <option value="SECURITY">Bezpieczeństwo</option>
                <option value="DATA">Dane</option>
                <option value="INTEGRATION">Integracja</option>
                <option value="OTHER">Inne</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Opis problemu *</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Opisz szczegółowo problem, który napotkałeś"
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-1">Kroki do odtworzenia</label>
            <textarea
              id="stepsToReproduce"
              value={form.stepsToReproduce}
              onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
              placeholder="1. Kliknij w..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-1">Oczekiwane zachowanie</label>
              <textarea
                id="expectedBehavior"
                value={form.expectedBehavior}
                onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                placeholder="Co powinno się stać?"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-1">Rzeczywiste zachowanie</label>
              <textarea
                id="actualBehavior"
                value={form.actualBehavior}
                onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                placeholder="Co się stało w rzeczywistości?"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Informacje techniczne</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Przeglądarka:</strong> {navigator.userAgent}</p>
              <p><strong>Strona:</strong> {window.location.href}</p>
              <p><strong>Rozdzielczość:</strong> {window.innerWidth}x{window.innerHeight}</p>
              <p className="text-gray-500">Te informacje zostaną automatycznie dołączone do zgłoszenia</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim() || !form.description.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}