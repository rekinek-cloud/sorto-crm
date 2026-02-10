'use client';

/**
 * StreamForm - Formularz tworzenia/edycji strumienia
 * Obsługuje wybór typu strumienia zgodnie z metodologią SORTO Streams
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  SnowflakeIcon,
  FolderIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ArchiveBoxIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { GTDRole, StreamType } from '@/types/gtd';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Ikona śnieżynki (Heroicons nie ma tej ikony, więc używamy alternatywy)
const FrozenIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m0-18l-4 4m4-4l4 4m-4 14l-4-4m4 4l4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
  </svg>
);

interface AvailableStream {
  id: string;
  name: string;
  gtdRole?: GTDRole;
  color?: string;
}

interface GTDStreamFormProps {
  stream?: {
    id: string;
    name: string;
    description?: string;
    color: string;
    gtdRole?: GTDRole;
    streamType?: StreamType;
  };
  initialData?: {
    name: string;
    description?: string;
    color: string;
    gtdRole?: GTDRole;
    streamType?: StreamType;
    parentStreamId?: string;
  };
  availableStreams?: AvailableStream[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

// SORTO Streams - typy strumieni zgodne z dokumentacją v3.0
const STREAM_ROLES = [
  {
    value: 'INBOX',
    label: 'Źródło',
    description: 'Pojedynczy punkt wejścia dla wszystkich nowych elementów do przetworzenia',
    icon: <InboxIcon className="w-5 h-5" />,
    color: '#8B5CF6'
  },
  {
    value: 'PROJECTS',
    label: 'Strumień projektowy',
    description: 'Strumień dla konkretnego projektu z określonym końcem',
    icon: <FolderIcon className="w-5 h-5" />,
    color: '#3B82F6'
  },
  {
    value: 'AREAS',
    label: 'Strumień ciągły',
    description: 'Obszar odpowiedzialności bez określonego końca (np. zdrowie, finanse)',
    icon: <ChartBarIcon className="w-5 h-5" />,
    color: '#14B8A6'
  },
  {
    value: 'REFERENCE',
    label: 'Strumień referencyjny',
    description: 'Materiały informacyjne, dokumentacja, zasoby',
    icon: <ArchiveBoxIcon className="w-5 h-5" />,
    color: '#6B7280'
  },
  {
    value: 'SOMEDAY_MAYBE',
    label: 'Zamrożony strumień',
    description: 'Pomysły i projekty na przyszłość (status: Zamarznięty)',
    icon: <FrozenIcon />,
    color: '#60A5FA'
  },
  {
    value: 'NEXT_ACTIONS',
    label: 'Strumień zadań',
    description: 'Konkretne zadania do wykonania (Płynie)',
    icon: <CheckCircleIcon className="w-5 h-5" />,
    color: '#10B981'
  },
  {
    value: 'WAITING_FOR',
    label: 'Strumień oczekujący',
    description: 'Elementy delegowane lub oczekujące na zewnętrzne działanie',
    icon: <ClockIcon className="w-5 h-5" />,
    color: '#F59E0B'
  },
  {
    value: 'CUSTOM',
    label: 'Niestandardowy',
    description: 'Własny typ strumienia dopasowany do potrzeb',
    icon: <Squares2X2Icon className="w-5 h-5" />,
    color: '#6366F1'
  }
];

// Typy strumieni
const STREAM_TYPES = [
  { value: 'WORKSPACE', label: 'Główny strumień', description: 'Obszar roboczy najwyższego poziomu' },
  { value: 'PROJECT', label: 'Projekt', description: 'Strumień projektowy z końcem' },
  { value: 'AREA', label: 'Obszar', description: 'Strumień ciągły bez końca' },
  { value: 'CONTEXT', label: 'Kontekst', description: 'Strumień kontekstowy (@komputer, @telefon)' },
  { value: 'CUSTOM', label: 'Własny', description: 'Niestandardowy typ strumienia' }
];

const GTDStreamForm: React.FC<GTDStreamFormProps> = ({
  stream,
  initialData,
  availableStreams = [],
  onClose,
  onSubmit
}) => {
  const editMode = !!stream;
  const data = stream || initialData;

  const [formData, setFormData] = useState({
    name: data?.name || '',
    description: data?.description || '',
    color: data?.color || '#3B82F6',
    gtdRole: data?.gtdRole || 'PROJECTS' as GTDRole, // Domyślnie strumień projektowy
    streamType: data?.streamType || 'PROJECT' as StreamType,
    parentStreamId: initialData?.parentStreamId || '',
    gtdConfig: {
      inboxBehavior: {
        autoProcessing: false,
        autoCreateTasks: true,
        processAfterDays: 3,
        purgeAfterDays: 30,
        defaultContext: '@computer',
        defaultEnergyLevel: 'MEDIUM'
      },
      reviewFrequency: 'WEEKLY',
      advanced: {
        enableAI: true,
        autoAssignContext: true,
        autoSetEnergyLevel: true,
        enableBulkProcessing: false,
        maxInboxItems: 100
      }
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedRole = STREAM_ROLES.find(role => role.value === formData.gtdRole);

  // Filter available streams for parent selection (exclude self in edit mode)
  const parentStreamOptions = availableStreams.filter(s => !stream || s.id !== stream.id);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Nazwa jest za długa (max 100 znaków)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Use selected role's color if not customized
    const roleColor = selectedRole?.color || formData.color;

    // Prepare data - remove empty parentStreamId (must be UUID or undefined)
    const submitData = {
      ...formData,
      color: roleColor,
      parentStreamId: formData.parentStreamId || undefined
    };

    onSubmit(submitData);
  };

  const handleRoleSelect = (role: GTDRole) => {
    setFormData(prev => ({
      ...prev,
      gtdRole: role,
      // Auto-ustaw typ strumienia na podstawie roli
      streamType: role === 'CONTEXTS' ? 'CONTEXT' :
                  role === 'AREAS' ? 'AREA' :
                  role === 'PROJECTS' ? 'PROJECT' :
                  role === 'INBOX' ? 'WORKSPACE' :
                  prev.streamType
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editMode ? 'Edytuj strumień' : 'Nowy strumień'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Skonfiguruj strumień zgodnie z metodologią SORTO Streams
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa strumienia *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Projekt: Nowa Aplikacja"
                error={!!errors.name}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis (opcjonalny)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Krótki opis przeznaczenia strumienia..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>

          {/* Strumień nadrzędny */}
          {parentStreamOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strumień nadrzędny (opcjonalny)
              </label>
              <select
                value={formData.parentStreamId}
                onChange={(e) => setFormData({ ...formData, parentStreamId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Brak (strumień główny)</option>
                {parentStreamOptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.gtdRole ? ` (${STREAM_ROLES.find(r => r.value === s.gtdRole)?.label || s.gtdRole})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Wybierz strumień nadrzędny, aby utworzyć hierarchię
              </p>
            </div>
          )}

          {/* Typ strumienia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Typ strumienia *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STREAM_ROLES.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleSelect(role.value as GTDRole)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${formData.gtdRole === role.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${role.color}20`,
                        color: role.color
                      }}
                    >
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{role.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{role.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Podtyp strumienia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Kategoria strumienia
            </label>
            <div className="grid grid-cols-3 gap-3">
              {STREAM_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, streamType: type.value as StreamType })}
                  className={`
                    p-3 rounded-lg border text-center transition-all
                    ${formData.streamType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Informacja o strumieniu */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-gray-900 mb-1">Informacje o strumieniu</div>
                <ul className="space-y-1 text-gray-600">
                  <li>• Status: Płynie (aktywny)</li>
                  <li>• Częstotliwość przeglądu: {formData.gtdConfig.reviewFrequency === 'WEEKLY' ? 'Tygodniowo' : formData.gtdConfig.reviewFrequency === 'DAILY' ? 'Codziennie' : 'Miesięcznie'}</li>
                  <li>• Analiza AI: {formData.gtdConfig.advanced.enableAI ? 'Włączona' : 'Wyłączona'}</li>
                </ul>
                <p className="mt-2 text-xs">
                  Strumień można zamrozić lub odmrozić po utworzeniu. Zamrożone strumienie nie wymagają uwagi.
                </p>
              </div>
            </div>
          </div>

          {/* Color customization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolor (zostaw pusty dla domyślnego)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20"
              />
              <span className="text-sm text-gray-600">
                Aktualny: {selectedRole?.label || 'Custom'}
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
          >
            {editMode ? 'Zapisz zmiany' : 'Utwórz strumień'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GTDStreamForm;