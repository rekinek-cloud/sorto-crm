'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/context';
import {
  ChevronLeftIcon,
  PlusIcon,
  ClockIcon,
  CalendarDaysIcon,
  MapIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  HeartIcon,
  HomeIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface AreaRoadmapItem {
  id: string;
  name: string;
  description: string;
  category: 'WORK' | 'PERSONAL' | 'HEALTH' | 'LEARNING' | 'FINANCIAL' | 'SOCIAL' | 'SPIRITUAL' | 'FAMILY';
  status: 'ACTIVE' | 'MAINTAINING' | 'DEVELOPING' | 'ON_HOLD' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  maturityLevel: 'EMERGING' | 'DEVELOPING' | 'MATURE' | 'OPTIMIZING' | 'DECLINING';
  focusLevel: 'MINIMAL' | 'LIGHT' | 'MODERATE' | 'INTENSIVE' | 'DOMINANT';
  timeHorizon: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'LIFETIME';
  currentFocus: string[];
  keyMetrics: AreaMetric[];
  objectives: AreaObjective[];
  reviews: AreaReview[];
  dependencies: string[];
  stakeholders: string[];
  resources: AreaResource[];
  challenges: string[];
  opportunities: string[];
  tags: string[];
  createdAt: string;
  lastReviewed: string;
  nextReviewDate: string;
}

interface AreaMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastUpdated: string;
}

interface AreaObjective {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  keyResults: string[];
}

interface AreaReview {
  id: string;
  date: string;
  rating: number; // 1-5
  notes: string;
  achievements: string[];
  improvements: string[];
  nextActions: string[];
}

interface AreaResource {
  id: string;
  type: 'TIME' | 'BUDGET' | 'PEOPLE' | 'TOOLS' | 'KNOWLEDGE';
  name: string;
  allocation: string;
  efficiency: number; // 1-5
}

interface MaturityLevel {
  id: string;
  title: string;
  description: string;
  characteristics: string[];
  color: string;
  bgColor: string;
  icon: string;
}

const MATURITY_LEVELS: MaturityLevel[] = [
  {
    id: 'EMERGING',
    title: 'Emerging',
    description: 'Nowe obszary odpowiedzialności w fazie eksploracji',
    characteristics: ['Brak jasnych procesów', 'Uczenie się podstaw', 'Eksperymentowanie'],
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    icon: '🌱',
  },
  {
    id: 'DEVELOPING',
    title: 'Developing', 
    description: 'Obszary w fazie aktywnego rozwoju i budowania kompetencji',
    characteristics: ['Ustalanie procesów', 'Budowanie nawyków', 'Systematyczny rozwój'],
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '📈',
  },
  {
    id: 'MATURE',
    title: 'Mature',
    description: 'Ustabilizowane obszary z dobrze działającymi procesami',
    characteristics: ['Ugruntowane procesy', 'Przewidywalne wyniki', 'Efektywne działanie'],
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: '🎯',
  },
  {
    id: 'OPTIMIZING',
    title: 'Optimizing',
    description: 'Obszary w fazie ciągłego doskonalenia i innowacji',
    characteristics: ['Ciągłe ulepszenia', 'Innowacyjne podejścia', 'Benchmarking'],
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '⚡',
  },
  {
    id: 'DECLINING',
    title: 'Declining',
    description: 'Obszary tracące na znaczeniu lub wymagające rewitalizacji',
    characteristics: ['Spadająca wydajność', 'Brak motywacji', 'Potrzeba przemyślenia'],
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: '📉',
  }
];

const AREA_CATEGORIES = [
  { id: 'WORK', name: 'Praca', icon: '💼', color: '#3B82F6' },
  { id: 'PERSONAL', name: 'Osobiste', icon: '🧘', color: '#8B5CF6' },
  { id: 'HEALTH', name: 'Zdrowie', icon: '💪', color: '#10B981' },
  { id: 'LEARNING', name: 'Nauka', icon: '📚', color: '#F59E0B' },
  { id: 'FINANCIAL', name: 'Finanse', icon: '💰', color: '#6B7280' },
  { id: 'SOCIAL', name: 'Społeczne', icon: '👥', color: '#EC4899' },
  { id: 'SPIRITUAL', name: 'Duchowe', icon: '🧘‍♀️', color: '#8B5CF6' },
  { id: 'FAMILY', name: 'Rodzina', icon: '👨‍👩‍👧‍👦', color: '#F59E0B' }
];

interface SortableAreaProps {
  area: AreaRoadmapItem;
  maturityLevel: MaturityLevel;
  onEdit: (area: AreaRoadmapItem) => void;
  onStatusChange: (areaId: string, status: AreaRoadmapItem['status']) => void;
  onMaturityChange: (areaId: string, maturity: AreaRoadmapItem['maturityLevel']) => void;
}

const SortableArea: React.FC<SortableAreaProps> = ({ 
  area, 
  maturityLevel, 
  onEdit, 
  onStatusChange, 
  onMaturityChange 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'MAINTAINING': return 'bg-blue-100 text-blue-700';
      case 'DEVELOPING': return 'bg-orange-100 text-orange-700';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'MINIMAL': return 'bg-gray-100 text-gray-700';
      case 'LIGHT': return 'bg-blue-100 text-blue-700';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700';
      case 'INTENSIVE': return 'bg-orange-100 text-orange-700';
      case 'DOMINANT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const category = AREA_CATEGORIES.find(c => c.id === area.category);
  const completedObjectives = area.objectives.filter(o => o.status === 'COMPLETED').length;
  const totalObjectives = area.objectives.length;
  const avgProgress = totalObjectives > 0 ? 
    Math.round(area.objectives.reduce((sum, obj) => sum + obj.progress, 0) / totalObjectives) : 0;
  
  const daysSinceReview = Math.ceil(
    (new Date().getTime() - new Date(area.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isReviewOverdue = daysSinceReview > 30; // Assuming monthly reviews

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span style={{ color: category?.color }} className="text-lg">
            {category?.icon}
          </span>
          <div className="text-xs text-gray-500">
            {category?.name}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getFocusColor(area.focusLevel)}`}>
            {area.focusLevel}
          </span>
        </div>
      </div>

      {/* Area Name and Description */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1">{area.name}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{area.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Średni postęp celów</span>
          <span className="font-medium text-gray-900">{avgProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Objectives */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Cele</span>
          <span>{completedObjectives}/{totalObjectives}</span>
        </div>
        {area.objectives.slice(0, 3).map(objective => (
          <div key={objective.id} className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              objective.status === 'COMPLETED' ? 'bg-green-500' :
              objective.status === 'IN_PROGRESS' ? 'bg-blue-500' :
              objective.status === 'PLANNING' ? 'bg-yellow-500' :
              'bg-gray-300'
            }`}></div>
            <span className={`text-xs ${
              objective.status === 'COMPLETED' ? 'text-green-700 line-through' : 'text-gray-600'
            }`}>
              {objective.title}
            </span>
          </div>
        ))}
        {area.objectives.length > 3 && (
          <div className="text-xs text-gray-500">+{area.objectives.length - 3} więcej...</div>
        )}
      </div>

      {/* Key Metrics */}
      {area.keyMetrics.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2">Kluczowe metryki</div>
          <div className="space-y-1">
            {area.keyMetrics.slice(0, 2).map(metric => (
              <div key={metric.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{metric.name}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-900">
                    {metric.value} / {metric.target} {metric.unit}
                  </span>
                  <span className={`text-xs ${
                    metric.trend === 'IMPROVING' ? 'text-green-600' :
                    metric.trend === 'DECLINING' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {metric.trend === 'IMPROVING' ? '↗️' :
                     metric.trend === 'DECLINING' ? '↘️' : '➡️'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources & Review Status */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <UserGroupIcon className="w-3 h-3" />
          <span>{area.stakeholders.length} stakeholders</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <ClockIcon className="w-3 h-3" />
          <span className={isReviewOverdue ? 'text-red-600' : ''}>
            Przegląd: {daysSinceReview} dni temu
            {isReviewOverdue && ' (przeterminowany)'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <CogIcon className="w-3 h-3" />
          <span>{area.resources.length} zasobów</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(area.status)}`}>
            {area.status}
          </span>
          <span className="text-xs text-gray-500">
            {area.timeHorizon}
          </span>
        </div>
        
        {area.dependencies.length > 0 && (
          <div className="text-xs text-gray-500 flex items-center">
            <ArrowRightIcon className="w-3 h-3 mr-1" />
            {area.dependencies.length} zależności
          </div>
        )}
      </div>

      {/* Maturity selector */}
      <div className="mt-3">
        <select
          value={area.maturityLevel}
          onChange={(e) => onMaturityChange(area.id, e.target.value as AreaRoadmapItem['maturityLevel'])}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="EMERGING">🌱 Emerging</option>
          <option value="DEVELOPING">📈 Developing</option>
          <option value="MATURE">🎯 Mature</option>
          <option value="OPTIMIZING">⚡ Optimizing</option>
          <option value="DECLINING">📉 Declining</option>
        </select>
      </div>

      {/* Status selector */}
      <div className="mt-2">
        <select
          value={area.status}
          onChange={(e) => onStatusChange(area.id, e.target.value as AreaRoadmapItem['status'])}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="ACTIVE">Aktywny</option>
          <option value="MAINTAINING">Utrzymanie</option>
          <option value="DEVELOPING">Rozwój</option>
          <option value="ON_HOLD">Wstrzymany</option>
          <option value="ARCHIVED">Zarchiwizowany</option>
        </select>
      </div>
    </div>
  );
};

export default function AreasRoadmapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [areas, setAreas] = useState<AreaRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'roadmap' | 'matrix' | 'timeline'>('roadmap');
  const [activeArea, setActiveArea] = useState<AreaRoadmapItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadRoadmapAreas();
  }, []);

  const loadRoadmapAreas = async () => {
    setTimeout(() => {
      const mockAreas: AreaRoadmapItem[] = [
        // EMERGING Areas
        {
          id: '1',
          name: 'Public Speaking & Presentations',
          description: 'Rozwój umiejętności publicznego mówienia i prowadzenia prezentacji biznesowych',
          category: 'LEARNING',
          status: 'DEVELOPING',
          priority: 'MEDIUM',
          maturityLevel: 'EMERGING',
          focusLevel: 'LIGHT',
          timeHorizon: 'MEDIUM_TERM',
          currentFocus: ['Warsztat prezentacji', 'Toastmasters Club', 'Feedback od kolegów'],
          keyMetrics: [
            {
              id: 'km1',
              name: 'Prezentacje miesięcznie',
              value: 2,
              unit: 'szt',
              target: 4,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km2',
              name: 'Ocena zaufania (1-5)',
              value: 3,
              unit: '',
              target: 4,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            }
          ],
          objectives: [
            {
              id: 'obj1',
              title: 'Ukończenie kursu public speaking',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 25,
              status: 'IN_PROGRESS',
              keyResults: ['8/12 modułów ukończonych', 'Przygotowanie 3 prezentacji', 'Otrzymanie certyfikatu']
            },
            {
              id: 'obj2',
              title: 'Przeprowadzenie prezentacji dla zarządu',
              targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 10,
              status: 'PLANNING',
              keyResults: ['Przygotowanie tematu', 'Przećwiczenie z mentorem', 'Successful delivery']
            }
          ],
          reviews: [
            {
              id: 'rev1',
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              rating: 3,
              notes: 'Pierwszy miesiąc eksploracji. Dużo do nauki ale widzę postępy.',
              achievements: ['Zapisanie się na kurs', 'Pierwsza prezentacja w zespole'],
              improvements: ['Lepsze przygotowanie slajdów', 'Praca nad gestami'],
              nextActions: ['Kontynuacja kursu', 'Praktyka przed lustrem', 'Feedback od mentora']
            }
          ],
          dependencies: [],
          stakeholders: ['Mentor Public Speaking', 'Zespół projektowy', 'HR'],
          resources: [
            { id: 'res1', type: 'TIME', name: 'Czas na praktykę', allocation: '3h/tydzień', efficiency: 3 },
            { id: 'res2', type: 'BUDGET', name: 'Kurs online', allocation: '500 PLN', efficiency: 4 },
            { id: 'res3', type: 'PEOPLE', name: 'Mentor', allocation: '1h/tydzień', efficiency: 5 }
          ],
          challenges: ['Trema przed publicznością', 'Brak doświadczenia', 'Ograniczony czas'],
          opportunities: ['Awans w karierze', 'Lepsze komunikacja w zespole', 'Możliwość prowadzenia szkoleń'],
          tags: ['Public Speaking', 'Career Development', 'Communication', 'Leadership'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        },

        // DEVELOPING Areas
        {
          id: '2',
          name: 'Product Management',
          description: 'Zarządzanie cyklem życia produktów IT i strategią produktową w organizacji',
          category: 'WORK',
          status: 'ACTIVE',
          priority: 'HIGH',
          maturityLevel: 'DEVELOPING',
          focusLevel: 'MODERATE',
          timeHorizon: 'MEDIUM_TERM',
          currentFocus: ['Roadmapa produktowa Q4', 'Customer research', 'Feature prioritization'],
          keyMetrics: [
            {
              id: 'km3',
              name: 'User satisfaction',
              value: 4.2,
              unit: '/5',
              target: 4.5,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km4',
              name: 'Feature adoption rate',
              value: 65,
              unit: '%',
              target: 80,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km5',
              name: 'Time to market',
              value: 6,
              unit: 'weeks',
              target: 4,
              trend: 'STABLE',
              lastUpdated: new Date().toISOString()
            }
          ],
          objectives: [
            {
              id: 'obj3',
              title: 'Launch nowego modułu CRM',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 70,
              status: 'IN_PROGRESS',
              keyResults: ['Beta testing ukończone', 'User feedback incorporated', 'Go-to-market plan ready']
            },
            {
              id: 'obj4',
              title: 'Wzrost user engagement o 25%',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 45,
              status: 'IN_PROGRESS',
              keyResults: ['New onboarding flow', 'Gamification elements', 'Push notifications']
            },
            {
              id: 'obj5',
              title: 'Product-market fit validation',
              targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 30,
              status: 'IN_PROGRESS',
              keyResults: ['Customer interviews', 'Usage analytics', 'Retention analysis']
            }
          ],
          reviews: [
            {
              id: 'rev2',
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              rating: 4,
              notes: 'Dobry postęp w Q3. Product roadmap na dobrej ścieżce.',
              achievements: ['Successful product launch', 'Improved customer feedback', 'Team collaboration'],
              improvements: ['Faster decision making', 'Better market research', 'More user testing'],
              nextActions: ['Finalize Q4 roadmap', 'Customer advisory board setup', 'Analytics dashboard']
            }
          ],
          dependencies: ['Engineering Team', 'Design Team', 'Marketing'],
          stakeholders: ['Engineering Team', 'Design Team', 'Marketing', 'Sales', 'Customer Success', 'CEO'],
          resources: [
            { id: 'res4', type: 'TIME', name: 'Management time', allocation: '40h/tydzień', efficiency: 4 },
            { id: 'res5', type: 'PEOPLE', name: 'Cross-functional team', allocation: '15 osób', efficiency: 4 },
            { id: 'res6', type: 'BUDGET', name: 'Product development', allocation: '100k PLN/Q', efficiency: 4 },
            { id: 'res7', type: 'TOOLS', name: 'Product tools suite', allocation: 'Jira, Figma, Mixpanel', efficiency: 5 }
          ],
          challenges: ['Competing priorities', 'Technical debt', 'Market competition', 'Resource constraints'],
          opportunities: ['New market segments', 'AI/ML integration', 'Mobile expansion', 'Partnership opportunities'],
          tags: ['Product Management', 'Strategy', 'Customer Focus', 'Innovation'],
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
        },

        // MATURE Areas
        {
          id: '3',
          name: 'Team Leadership & Management',
          description: 'Zarządzanie zespołem deweloperskim 12 osób - coaching, development, performance management',
          category: 'WORK',
          status: 'ACTIVE',
          priority: 'HIGH',
          maturityLevel: 'MATURE',
          focusLevel: 'INTENSIVE',
          timeHorizon: 'LONG_TERM',
          currentFocus: ['Q4 performance reviews', 'Team capacity planning', 'Leadership development'],
          keyMetrics: [
            {
              id: 'km6',
              name: 'Team satisfaction',
              value: 4.6,
              unit: '/5',
              target: 4.5,
              trend: 'STABLE',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km7',
              name: 'Employee retention',
              value: 95,
              unit: '%',
              target: 90,
              trend: 'STABLE',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km8',
              name: 'Delivery velocity',
              value: 42,
              unit: 'SP/sprint',
              target: 40,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            }
          ],
          objectives: [
            {
              id: 'obj6',
              title: 'Wszyscy członkowie zespołu mają career path',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 90,
              status: 'IN_PROGRESS',
              keyResults: ['12/12 individual development plans', '100% 1:1 meetings regularity', 'Career ladders defined']
            },
            {
              id: 'obj7',
              title: 'Zero krytycznych bugów w produkcji',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 85,
              status: 'IN_PROGRESS',
              keyResults: ['Code review process optimization', 'Automated testing coverage >90%', 'Quality gates implementation']
            }
          ],
          reviews: [
            {
              id: 'rev3',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              rating: 5,
              notes: 'Zespół funkcjonuje doskonale. Wysokie morale i efektywność.',
              achievements: ['Zero critical incidents', 'Successful sprint deliveries', 'Team bonding events'],
              improvements: ['Knowledge sharing sessions', 'Cross-team collaboration', 'Innovation time'],
              nextActions: ['Q4 career discussions', 'Team retreat planning', 'Succession planning']
            }
          ],
          dependencies: ['HR Department', 'Engineering Budget', 'Company Strategy'],
          stakeholders: ['Development Team', 'Product Owner', 'HR', 'Other Team Leads', 'CTO'],
          resources: [
            { id: 'res8', type: 'TIME', name: 'Leadership time', allocation: '35h/tydzień', efficiency: 5 },
            { id: 'res9', type: 'PEOPLE', name: 'Development team', allocation: '12 developerów', efficiency: 5 },
            { id: 'res10', type: 'BUDGET', name: 'Team development', allocation: '50k PLN/rok', efficiency: 4 },
            { id: 'res11', type: 'TOOLS', name: 'Management tools', allocation: 'Slack, Jira, 1:1 tools', efficiency: 4 }
          ],
          challenges: ['Burnout prevention', 'Skill gap management', 'Remote work challenges', 'Career progression'],
          opportunities: ['Mentorship programs', 'Technical leadership development', 'Innovation projects', 'Cross-team initiatives'],
          tags: ['Leadership', 'Team Management', 'People Development', 'Performance'],
          createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString()
        },

        // OPTIMIZING Areas
        {
          id: '4',
          name: 'Personal Health & Fitness',
          description: 'Utrzymanie optymalnej kondycji fizycznej i zdrowia - sport, dieta, well-being',
          category: 'HEALTH',
          status: 'ACTIVE',
          priority: 'HIGH',
          maturityLevel: 'OPTIMIZING',
          focusLevel: 'MODERATE',
          timeHorizon: 'LIFETIME',
          currentFocus: ['Marathon training', 'Nutrition optimization', 'Sleep quality improvement'],
          keyMetrics: [
            {
              id: 'km9',
              name: 'Weekly training sessions',
              value: 5,
              unit: 'sesji',
              target: 5,
              trend: 'STABLE',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km10',
              name: 'Body fat percentage',
              value: 12,
              unit: '%',
              target: 10,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km11',
              name: 'Sleep quality score',
              value: 8.2,
              unit: '/10',
              target: 8.5,
              trend: 'IMPROVING',
              lastUpdated: new Date().toISOString()
            }
          ],
          objectives: [
            {
              id: 'obj8',
              title: 'Ukończenie maratonu w czasie <3:30',
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 75,
              status: 'IN_PROGRESS',
              keyResults: ['16-week training plan completion', 'Long runs >30km', 'Nutritional strategy tested']
            },
            {
              id: 'obj9',
              title: 'Osiągnięcie 10% body fat',
              targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 60,
              status: 'IN_PROGRESS',
              keyResults: ['Consistent caloric deficit', 'Strength training 3x/week', 'Monthly body composition tracking']
            }
          ],
          reviews: [
            {
              id: 'rev4',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              rating: 4,
              notes: 'Świetny postęp w treningu maratońskim. Dieta wymaga drobnych korekt.',
              achievements: ['Completed 35km long run', 'Improved sleep routine', 'Weight loss on track'],
              improvements: ['Post-workout nutrition', 'Recovery protocols', 'Mental training'],
              nextActions: ['Taper phase planning', 'Race day strategy', 'Recovery plan post-marathon']
            }
          ],
          dependencies: [],
          stakeholders: ['Personal Trainer', 'Nutritionist', 'Running Club', 'Family'],
          resources: [
            { id: 'res12', type: 'TIME', name: 'Training time', allocation: '8h/tydzień', efficiency: 5 },
            { id: 'res13', type: 'BUDGET', name: 'Fitness expenses', allocation: '500 PLN/miesiąc', efficiency: 4 },
            { id: 'res14', type: 'TOOLS', name: 'Fitness equipment', allocation: 'Garmin, gym membership', efficiency: 5 },
            { id: 'res15', type: 'KNOWLEDGE', name: 'Training expertise', allocation: 'Coach + courses', efficiency: 4 }
          ],
          challenges: ['Time management', 'Injury prevention', 'Weather conditions', 'Motivation consistency'],
          opportunities: ['Ultra-marathon goals', 'Triathlon expansion', 'Coaching others', 'Health advocacy'],
          tags: ['Health', 'Fitness', 'Running', 'Marathon', 'Nutrition', 'Well-being'],
          createdAt: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
        },

        // DECLINING Area
        {
          id: '5',
          name: 'Side Project - Mobile App',
          description: 'Aplikacja mobilna side project, która straciła na priorytecie i wymaga decyzji o przyszłości',
          category: 'PERSONAL',
          status: 'ON_HOLD',
          priority: 'LOW',
          maturityLevel: 'DECLINING',
          focusLevel: 'MINIMAL',
          timeHorizon: 'SHORT_TERM',
          currentFocus: ['Decision making', 'Code maintenance', 'User retention analysis'],
          keyMetrics: [
            {
              id: 'km12',
              name: 'Monthly active users',
              value: 45,
              unit: 'users',
              target: 100,
              trend: 'DECLINING',
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'km13',
              name: 'Time invested',
              value: 2,
              unit: 'h/tydzień',
              target: 8,
              trend: 'DECLINING',
              lastUpdated: new Date().toISOString()
            }
          ],
          objectives: [
            {
              id: 'obj10',
              title: 'Decyzja o przyszłości projektu',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              progress: 50,
              status: 'IN_PROGRESS',
              keyResults: ['User feedback analysis', 'Cost-benefit evaluation', 'Strategic decision']
            }
          ],
          reviews: [
            {
              id: 'rev5',
              date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
              rating: 2,
              notes: 'Projekt stracił na priorytecie. Czas na trudną decyzję.',
              achievements: ['Basic maintenance completed', 'User data analyzed'],
              improvements: ['Need clear strategy', 'Resource allocation decision'],
              nextActions: ['Final decision meeting', 'Sunset plan if needed', 'Lessons learned documentation']
            }
          ],
          dependencies: [],
          stakeholders: ['App Users', 'Co-founder'],
          resources: [
            { id: 'res16', type: 'TIME', name: 'Development time', allocation: '2h/tydzień', efficiency: 2 },
            { id: 'res17', type: 'BUDGET', name: 'Hosting costs', allocation: '50 PLN/miesiąc', efficiency: 2 }
          ],
          challenges: ['Declining motivation', 'Limited time', 'Market competition', 'Technical debt'],
          opportunities: ['Learning from failure', 'Code reuse', 'Portfolio piece', 'Teaching others'],
          tags: ['Side Project', 'Mobile App', 'Entrepreneurship', 'Decision Making'],
          createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setAreas(mockAreas);
      setLoading(false);
    }, 500);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const area = areas.find(a => a.id === active.id);
    setActiveArea(area || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveArea(null);

    if (!over) return;

    const activeArea = areas.find(a => a.id === active.id);
    if (!activeArea) return;

    // Find which maturity level the area was dropped in
    const newMaturity = over.id as string;
    
    if (MATURITY_LEVELS.some(level => level.id === newMaturity)) {
      setAreas(prev => prev.map(area =>
        area.id === activeArea.id
          ? { ...area, maturityLevel: newMaturity as AreaRoadmapItem['maturityLevel'] }
          : area
      ));
      
      toast.success(`Obszar przeniesiony do poziomu: ${MATURITY_LEVELS.find(l => l.id === newMaturity)?.title}`);
    }
  };

  const handleStatusChange = (areaId: string, status: AreaRoadmapItem['status']) => {
    setAreas(prev => prev.map(area =>
      area.id === areaId ? { ...area, status } : area
    ));
  };

  const handleMaturityChange = (areaId: string, maturity: AreaRoadmapItem['maturityLevel']) => {
    setAreas(prev => prev.map(area =>
      area.id === areaId ? { ...area, maturityLevel: maturity } : area
    ));
  };

  const getFilteredAreas = () => {
    let filtered = areas;
    
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(area => area.category === selectedCategory);
    }
    
    if (selectedTimeHorizon !== 'ALL') {
      filtered = filtered.filter(area => area.timeHorizon === selectedTimeHorizon);
    }
    
    return filtered;
  };

  const getAreasByMaturity = (maturityId: string) => {
    return getFilteredAreas().filter(area => area.maturityLevel === maturityId);
  };

  const getAreaStats = () => {
    const filtered = getFilteredAreas();
    const total = filtered.length;
    const active = filtered.filter(a => a.status === 'ACTIVE').length;
    const developing = filtered.filter(a => a.status === 'DEVELOPING').length;
    const maintaining = filtered.filter(a => a.status === 'MAINTAINING').length;
    const onHold = filtered.filter(a => a.status === 'ON_HOLD').length;
    const overdueReviews = filtered.filter(a => {
      const daysSinceReview = Math.ceil(
        (new Date().getTime() - new Date(a.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceReview > 30;
    }).length;
    
    return { total, active, developing, maintaining, onHold, overdueReviews };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = getAreaStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapIcon className="w-6 h-6 mr-2 text-blue-600" />
              Roadmap Obszarów Odpowiedzialności
            </h1>
            <p className="text-gray-600">Zarządzanie wszystkimi obszarami życia według poziomów dojrzałości</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('roadmap')}
              className={`px-3 py-2 text-sm rounded-l-lg ${
                viewMode === 'roadmap' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapIcon className="w-4 h-4 mr-1 inline" />
              Roadmap
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'matrix' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-1 inline" />
              Matrix
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 text-sm rounded-r-lg ${
                viewMode === 'timeline' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ClockIcon className="w-4 h-4 mr-1 inline" />
              Timeline
            </button>
          </div>

          {/* Add New Area */}
          <button className="btn btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nowy obszar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FlagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Wszystkie</p>
              <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Aktywne</p>
              <p className="text-xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rozwój</p>
              <p className="text-xl font-semibold text-gray-900">{stats.developing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CogIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Utrzymanie</p>
              <p className="text-xl font-semibold text-gray-900">{stats.maintaining}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <PauseCircleIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Wstrzymane</p>
              <p className="text-xl font-semibold text-gray-900">{stats.onHold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Przeglądy</p>
              <p className="text-xl font-semibold text-gray-900">{stats.overdueReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtruj:</span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="ALL">Wszystkie kategorie</option>
            {AREA_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTimeHorizon}
            onChange={(e) => setSelectedTimeHorizon(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="ALL">Wszystkie horyzonty</option>
            <option value="IMMEDIATE">Natychmiastowy</option>
            <option value="SHORT_TERM">Krótkoterminowy</option>
            <option value="MEDIUM_TERM">Średnioterminowy</option>
            <option value="LONG_TERM">Długoterminowy</option>
            <option value="LIFETIME">Całe życie</option>
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Pokazano: {getFilteredAreas().length} z {areas.length} obszarów
            </span>
          </div>
        </div>
      </div>

      {/* Roadmap View */}
      {viewMode === 'roadmap' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {MATURITY_LEVELS.map(level => {
              const levelAreas = getAreasByMaturity(level.id);
              
              return (
                <div
                  key={level.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Maturity Level Header */}
                  <div 
                    className="p-4 text-white"
                    style={{ backgroundColor: level.color }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{level.icon}</span>
                      <h3 className="font-semibold text-sm">{level.title}</h3>
                    </div>
                    <p className="text-xs opacity-90">{level.description}</p>
                    <div className="mt-3 text-xs">
                      <div className="space-y-1">
                        {level.characteristics.map((char, index) => (
                          <div key={index} className="flex items-center">
                            <span className="mr-1">•</span>
                            <span>{char}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 bg-white bg-opacity-20 px-2 py-1 rounded text-center">
                        {levelAreas.length} obszarów
                      </div>
                    </div>
                  </div>

                  {/* Areas Container */}
                  <div 
                    className="p-4 space-y-3 min-h-[500px]"
                    style={{ backgroundColor: level.bgColor }}
                  >
                    <SortableContext items={levelAreas.map(a => a.id)} strategy={verticalListSortingStrategy}>
                      {levelAreas.map(area => (
                        <SortableArea
                          key={area.id}
                          area={area}
                          maturityLevel={level}
                          onEdit={(area) => console.log('Edit area:', area)}
                          onStatusChange={handleStatusChange}
                          onMaturityChange={handleMaturityChange}
                        />
                      ))}
                    </SortableContext>
                    
                    {levelAreas.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">{level.icon}</div>
                        <div className="text-sm">Brak obszarów na tym poziomie</div>
                        <div className="text-xs mt-1">Przeciągnij obszary tutaj</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeArea ? (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                <div className="font-medium text-gray-900">{activeArea.name}</div>
                <div className="text-sm text-gray-600 mt-1">{activeArea.description}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {activeArea.objectives.length} celów • {activeArea.keyMetrics.length} metryk
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Matrix View Placeholder */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Matryca Obszarów</h3>
            <p className="text-gray-600 mb-4">
              Dwuwymiarowa matryca: Dojrzałość vs Poziom skupienia z heatmapą priorytetów
            </p>
            <button className="btn btn-primary">
              <CogIcon className="w-4 h-4 mr-2" />
              Konfiguruj matrycę
            </button>
          </div>
        </div>
      )}

      {/* Timeline View Placeholder */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline Obszarów</h3>
            <p className="text-gray-600 mb-4">
              Chronologiczny rozwój obszarów odpowiedzialności z kluczowymi momentami
            </p>
            <button className="btn btn-primary">
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              Konfiguruj timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}