'use client';

/**
 * GTDMigrationModal - Modal do migracji istniejącego streama do GTD
 * Pomaga użytkownikowi wybrać odpowiednią rolę i typ GTD dla streama
 */

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Inbox,
  CheckCircle,
  Clock,
  Star,
  Folder,
  LayoutGrid,
  BarChart3,
  Archive,
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';
import { StreamRole, StreamType } from '@/types/streams';
import Button from '../ui/Button';

interface GTDMigrationModalProps {
  stream: {
    id: string;
    name: string;
    description?: string;
    _count?: {
      tasks: number;
      projects: number;
    };
  };
  onClose: () => void;
  onMigrate: (streamId: string, gtdRole: StreamRole, streamType: StreamType) => void;
}

const GTD_ROLES = [
  {
    value: 'INBOX',
    label: 'Inbox',
    description: 'Punkt gromadzenia wszystkiego co wymaga przetworzenia',
    icon: <Inbox className="w-5 h-5" />,
    color: '#8B5CF6',
    when: 'Stream zbiera różnorodne elementy do późniejszego przetworzenia'
  },
  {
    value: 'NEXT_ACTIONS',
    label: 'Next Actions',
    description: 'Lista następnych konkretnych działań do wykonania',
    icon: <CheckCircle className="w-5 h-5" />,
    color: '#10B981',
    when: 'Stream zawiera konkretne zadania gotowe do wykonania'
  },
  {
    value: 'WAITING_FOR',
    label: 'Waiting For',
    description: 'Rzeczy delegowane lub oczekujące na kogoś/coś',
    icon: <Clock className="w-5 h-5" />,
    color: '#F59E0B',
    when: 'Stream śledzi zadania delegowane lub czekające na zewnętrzne działania'
  },
  {
    value: 'SOMEDAY_MAYBE',
    label: 'Someday/Maybe',
    description: 'Pomysły i projekty na przyszłość',
    icon: <Star className="w-5 h-5" />,
    color: '#EC4899',
    when: 'Stream zawiera pomysły, inspiracje lub projekty na przyszłość'
  },
  {
    value: 'PROJECTS',
    label: 'Projects',
    description: 'Zadania wymagające więcej niż jednego kroku',
    icon: <Folder className="w-5 h-5" />,
    color: '#3B82F6',
    when: 'Stream zawiera projekty wieloetapowe'
  },
  {
    value: 'CONTEXTS',
    label: 'Contexts',
    description: 'Konteksty wykonywania zadań (@computer, @phone, etc.)',
    icon: <LayoutGrid className="w-5 h-5" />,
    color: '#6366F1',
    when: 'Stream organizuje zadania według kontekstu wykonania'
  },
  {
    value: 'AREAS',
    label: 'Areas',
    description: 'Obszary odpowiedzialności do utrzymania',
    icon: <BarChart3 className="w-5 h-5" />,
    color: '#14B8A6',
    when: 'Stream reprezentuje obszar odpowiedzialności (np. "Finanse", "Marketing")'
  },
  {
    value: 'REFERENCE',
    label: 'Reference',
    description: 'Materiały referencyjne i dokumentacja',
    icon: <Archive className="w-5 h-5" />,
    color: '#6B7280',
    when: 'Stream przechowuje dokumenty referencyjne lub wiedzę'
  }
];

const STREAM_TYPES = [
  { 
    value: 'WORKSPACE', 
    label: 'Workspace', 
    description: 'Główny obszar roboczy lub departament',
    example: 'Marketing, IT, Sprzedaż'
  },
  { 
    value: 'PROJECT', 
    label: 'Project', 
    description: 'Konkretny projekt z określonym celem',
    example: 'Nowa strona www, Q1 Campaign'
  },
  { 
    value: 'AREA', 
    label: 'Area', 
    description: 'Obszar odpowiedzialności do stałego utrzymania',
    example: 'Obsługa klienta, Budżet, Zespół'
  },
  { 
    value: 'CONTEXT', 
    label: 'Context', 
    description: 'Kontekst wykonywania zadań',
    example: '@computer, @phone, @office'
  },
  { 
    value: 'CUSTOM', 
    label: 'Custom', 
    description: 'Niestandardowy typ streama',
    example: 'Własne potrzeby organizacyjne'
  }
];

const GTDMigrationModal: React.FC<GTDMigrationModalProps> = ({
  stream,
  onClose,
  onMigrate
}) => {
  const [selectedRole, setSelectedRole] = useState<StreamRole | null>(null);
  const [selectedType, setSelectedType] = useState<StreamType>('CUSTOM');
  const [showRecommendations, setShowRecommendations] = useState(true);

  // AI-based recommendations based on stream content
  const getRecommendations = () => {
    const recommendations = [];
    const taskCount = stream._count?.tasks || 0;
    const projectCount = stream._count?.projects || 0;
    const name = stream.name.toLowerCase();
    const description = stream.description?.toLowerCase() || '';
    const content = `${name} ${description}`;

    // Analyze name and content for recommendations
    if (content.includes('inbox') || content.includes('input') || content.includes('collect')) {
      recommendations.push({
        role: 'INBOX',
        type: 'WORKSPACE',
        confidence: 90,
        reason: 'Nazwa sugeruje funkcję zbierania/gromadzenia'
      });
    }

    if (content.includes('next') || content.includes('action') || content.includes('todo')) {
      recommendations.push({
        role: 'NEXT_ACTIONS',
        type: 'WORKSPACE',
        confidence: 85,
        reason: 'Nazwa sugeruje listę następnych działań'
      });
    }

    if (content.includes('wait') || content.includes('pending') || content.includes('delegat')) {
      recommendations.push({
        role: 'WAITING_FOR',
        type: 'WORKSPACE',
        confidence: 85,
        reason: 'Nazwa sugeruje elementy oczekujące'
      });
    }

    if (content.includes('project') || projectCount > 3) {
      recommendations.push({
        role: 'PROJECTS',
        type: 'PROJECT',
        confidence: Math.min(90, 60 + projectCount * 5),
        reason: `Zawiera ${projectCount} projektów`
      });
    }

    if (content.includes('someday') || content.includes('maybe') || content.includes('future')) {
      recommendations.push({
        role: 'SOMEDAY_MAYBE',
        type: 'WORKSPACE',
        confidence: 80,
        reason: 'Nazwa sugeruje przyszłe możliwości'
      });
    }

    if (content.includes('area') || content.includes('responsibility') || content.includes('maintain')) {
      recommendations.push({
        role: 'AREAS',
        type: 'AREA',
        confidence: 75,
        reason: 'Nazwa sugeruje obszar odpowiedzialności'
      });
    }

    if (content.includes('context') || content.includes('@')) {
      recommendations.push({
        role: 'CONTEXTS',
        type: 'CONTEXT',
        confidence: 80,
        reason: 'Nazwa sugeruje kontekst'
      });
    }

    if (content.includes('reference') || content.includes('doc') || content.includes('knowledge')) {
      recommendations.push({
        role: 'REFERENCE',
        type: 'WORKSPACE',
        confidence: 75,
        reason: 'Nazwa sugeruje materiały referencyjne'
      });
    }

    // Default recommendation if no specific patterns found
    if (recommendations.length === 0) {
      if (taskCount > 10) {
        recommendations.push({
          role: 'NEXT_ACTIONS',
          type: 'WORKSPACE',
          confidence: 60,
          reason: `Zawiera ${taskCount} zadań - prawdopodobnie Next Actions`
        });
      } else {
        recommendations.push({
          role: 'PROJECTS',
          type: 'PROJECT',
          confidence: 50,
          reason: 'Domyślna rekomendacja dla streamów z zawartością'
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  };

  const recommendations = getRecommendations();
  const topRecommendation = recommendations[0];

  const handleMigrate = () => {
    if (!selectedRole) return;
    onMigrate(stream.id, selectedRole, selectedType);
  };

  const applyRecommendation = (rec: any) => {
    setSelectedRole(rec.role as StreamRole);
    setSelectedType(rec.type as StreamType);
    setShowRecommendations(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Migracja streamu - {stream.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Przekształć stream w element systemu STREAMS
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Rekomendacje AI
                </h3>
              </div>
              
              <div className="grid gap-3">
                {recommendations.map((rec, index) => {
                  const roleData = GTD_ROLES.find(r => r.value === rec.role);
                  const typeData = STREAM_TYPES.find(t => t.value === rec.type);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => applyRecommendation(rec)}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                        ${index === 0 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ 
                              backgroundColor: `${roleData?.color}20`,
                              color: roleData?.color
                            }}
                          >
                            {roleData?.icon}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {roleData?.label} ({typeData?.label})
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {rec.reason}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {rec.confidence}% pewności
                          </div>
                          {index === 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Rekomendowane
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  💡 <strong>Wskazówka:</strong> Kliknij rekomendację aby ją zastosować, 
                  lub przewiń w dół aby wybrać ręcznie.
                </div>
              </div>
            </div>
          )}

          {/* Manual Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Wybierz rolę streamu *
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {GTD_ROLES.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value as StreamRole)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${selectedRole === role.value 
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
                        <div className="text-xs text-gray-500 mt-2">
                          <strong>Kiedy używać:</strong> {role.when}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Wybierz typ streama
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {STREAM_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value as StreamType)}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${selectedType === type.value 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs mt-1">{type.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      np. {type.example}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {selectedRole && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Podgląd migracji</span>
                </div>
                <div className="text-sm text-green-700">
                  Stream <strong>"{stream.name}"</strong> zostanie przekształcony w <strong>{selectedRole.replace('_', ' ')}</strong> typu <strong>{selectedType}</strong>.
                  {stream._count && (
                    <div className="mt-2">
                      Istniejące dane: {stream._count.tasks} zadań, {stream._count.projects} projektów.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">Co się stanie podczas migracji?</div>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Stream otrzyma rolę i domyślną konfigurację</li>
                    <li>• Istniejące zadania i projekty zostaną zachowane</li>
                    <li>• Włączą się funkcje automatyzacji STREAMS</li>
                    <li>• Będziesz mógł dostosować konfigurację po migracji</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {topRecommendation && (
              <span>
                💡 Rekomendowane: <strong>{GTD_ROLES.find(r => r.value === topRecommendation.role)?.label}</strong>
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              variant="default"
              onClick={handleMigrate}
              disabled={!selectedRole}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Migruj stream
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GTDMigrationModal;