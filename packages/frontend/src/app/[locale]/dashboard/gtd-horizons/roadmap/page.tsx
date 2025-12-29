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
  SparklesIcon,
  RocketLaunchIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

interface GTDHorizonRoadmapItem {
  id: string;
  title: string;
  description: string;
  horizonLevel: number;
  horizonName: string;
  horizonIcon: string;
  horizonColor: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: 'SMALL' | 'MEDIUM' | 'LARGE' | 'TRANSFORMATIVE';
  effort: 'MINIMAL' | 'MODERATE' | 'SIGNIFICANT' | 'MAJOR';
  timeframe: 'NOW' | 'NEAR_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'VISION';
  startDate: string;
  targetDate?: string;
  completedDate?: string;
  progress: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  dependencies: string[];
  milestones: HorizonMilestone[];
  alignment: 'PERFECT' | 'GOOD' | 'MODERATE' | 'POOR';
  tags: string[];
  createdAt: string;
}

interface HorizonMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
}

interface RoadmapTimeframe {
  id: string;
  title: string;
  description: string;
  timeRange: string;
  color: string;
  bgColor: string;
  icon: string;
  duration: string;
}

const ROADMAP_TIMEFRAMES: RoadmapTimeframe[] = [
  {
    id: 'NOW',
    title: 'Teraz (0-3 mies.)',
    description: 'Bieżące działania i natychmiastowe priorytety',
    timeRange: '0-3 miesięcy',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: '🔥',
    duration: 'Immediate'
  },
  {
    id: 'NEAR_TERM',
    title: 'Bliska perspektywa (3-12 mies.)',
    description: 'Planowane projekty i cele kwartalne',
    timeRange: '3-12 miesięcy',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    icon: '🎯',
    duration: 'Short-term'
  },
  {
    id: 'MEDIUM_TERM',
    title: 'Średni termin (1-3 lata)',
    description: 'Strategiczne inicjatywy i transformacje',
    timeRange: '1-3 lata',
    color: '#CA8A04',
    bgColor: '#FFFBEB',
    icon: '🚀',
    duration: 'Medium-term'
  },
  {
    id: 'LONG_TERM',
    title: 'Długi termin (3-5 lat)',
    description: 'Wizja i fundamentalne zmiany',
    timeRange: '3-5 lat',
    color: '#7C3AED',
    bgColor: '#F3F4F6',
    icon: '🌟',
    duration: 'Long-term'
  },
  {
    id: 'VISION',
    title: 'Wizja (5+ lat)',
    description: 'Ostateczne cele i marzenia',
    timeRange: '5+ lat',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    icon: '🧭',
    duration: 'Visionary'
  }
];

const GTD_HORIZONS = [
  { level: 0, name: 'Działania (Runway)', icon: '🏃‍♂️', color: '#EF4444' },
  { level: 1, name: 'Projekty (10k ft)', icon: '📋', color: '#F59E0B' },
  { level: 2, name: 'Obszary (20k ft)', icon: '🎯', color: '#10B981' },
  { level: 3, name: 'Cele 1-2 lata (30k ft)', icon: '🚀', color: '#8B5CF6' },
  { level: 4, name: 'Wizja 3-5 lat (40k ft)', icon: '🌟', color: '#6366F1' },
  { level: 5, name: 'Cel Życia (50k ft)', icon: '🧭', color: '#EC4899' }
];

interface SortableItemProps {
  item: GTDHorizonRoadmapItem;
  timeframe: RoadmapTimeframe;
  onEdit: (item: GTDHorizonRoadmapItem) => void;
  onStatusChange: (itemId: string, status: GTDHorizonRoadmapItem['status']) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, timeframe, onEdit, onStatusChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'SMALL': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'LARGE': return 'bg-orange-100 text-orange-700';
      case 'TRANSFORMATIVE': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'MINIMAL': return 'bg-green-100 text-green-700';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700';
      case 'SIGNIFICANT': return 'bg-orange-100 text-orange-700';
      case 'MAJOR': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'PERFECT': return 'bg-green-100 text-green-700';
      case 'GOOD': return 'bg-blue-100 text-blue-700';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700';
      case 'POOR': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const horizon = GTD_HORIZONS.find(h => h.level === item.horizonLevel);

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
          <span style={{ color: horizon?.color }} className="text-lg">
            {horizon?.icon}
          </span>
          <div className="text-xs text-gray-500">
            Poziom {item.horizonLevel} • {horizon?.name}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactColor(item.impact)}`}>
            {item.impact}
          </span>
        </div>
      </div>

      {/* Title and Description */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Postęp</span>
          <span className="font-medium text-gray-900">{item.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Milestones */}
      {item.milestones.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-1">
            Kamienie milowe ({item.milestones.filter(m => m.completed).length}/{item.milestones.length})
          </div>
          <div className="space-y-1">
            {item.milestones.slice(0, 2).map(milestone => (
              <div key={milestone.id} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className={`text-xs ${milestone.completed ? 'text-green-700 line-through' : 'text-gray-600'}`}>
                  {milestone.title}
                </span>
              </div>
            ))}
            {item.milestones.length > 2 && (
              <div className="text-xs text-gray-500">+{item.milestones.length - 2} więcej...</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getEffortColor(item.effort)}`}>
            {item.effort}
          </span>
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getAlignmentColor(item.alignment)}`}>
            {item.alignment}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {item.targetDate && (
            <div className="text-xs text-gray-500">
              <CalendarDaysIcon className="w-3 h-3 inline mr-1" />
              {new Date(item.targetDate).toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Status selector */}
      <div className="mt-2">
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value as GTDHorizonRoadmapItem['status'])}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="PLANNED">Planowane</option>
          <option value="IN_PROGRESS">W trakcie</option>
          <option value="COMPLETED">Ukończone</option>
          <option value="ON_HOLD">Wstrzymane</option>
          <option value="CANCELLED">Anulowane</option>
        </select>
      </div>
    </div>
  );
};

export default function GTDHorizonsRoadmapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<GTDHorizonRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<'roadmap' | 'timeline'>('roadmap');
  const [activeItem, setActiveItem] = useState<GTDHorizonRoadmapItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadRoadmapItems();
  }, []);

  const loadRoadmapItems = async () => {
    setTimeout(() => {
      const mockItems: GTDHorizonRoadmapItem[] = [
        // NOW - Immediate Actions (0-3 months)
        {
          id: '1',
          title: 'Wdrożenie Źródła',
          description: 'Implementacja systemu zbierania wszystkich zadań w jednym miejscu',
          horizonLevel: 0,
          horizonName: 'Działania (Runway)',
          horizonIcon: '🏃‍♂️',
          horizonColor: '#EF4444',
          priority: 'HIGH',
          impact: 'MEDIUM',
          effort: 'MODERATE',
          timeframe: 'NOW',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 85,
          status: 'IN_PROGRESS',
          dependencies: [],
          milestones: [
            { id: 'm1', title: 'Konfiguracja systemu', targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm2', title: 'Migracja istniejących zadań', targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm3', title: 'Szkolenie zespołu', targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm4', title: 'Pełne wdrożenie', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'PERFECT',
          tags: ['STREAMS', 'Produktywność', 'Workflow'],
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Optymalizacja procesów komunikacji',
          description: 'Reorganizacja przepływu informacji w zespole dla lepszej wydajności',
          horizonLevel: 0,
          horizonName: 'Działania (Runway)',
          horizonIcon: '🏃‍♂️',
          horizonColor: '#EF4444',
          priority: 'MEDIUM',
          impact: 'MEDIUM',
          effort: 'MINIMAL',
          timeframe: 'NOW',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 60,
          status: 'IN_PROGRESS',
          dependencies: [],
          milestones: [
            { id: 'm5', title: 'Analiza istniejących procesów', targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm6', title: 'Projekt nowych standardów', targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm7', title: 'Implementacja zmian', targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'GOOD',
          tags: ['Komunikacja', 'Zespół', 'Efektywność'],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },

        // NEAR_TERM - Short-term Projects (3-12 months)
        {
          id: '3',
          title: 'Modernizacja systemu CRM',
          description: 'Kompleksowe ulepszenie platformy CRM z integracją AI i automatyzacją procesów',
          horizonLevel: 1,
          horizonName: 'Projekty (10k ft)',
          horizonIcon: '📋',
          horizonColor: '#F59E0B',
          priority: 'HIGH',
          impact: 'LARGE',
          effort: 'SIGNIFICANT',
          timeframe: 'NEAR_TERM',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 25,
          status: 'PLANNED',
          dependencies: ['1'],
          milestones: [
            { id: 'm8', title: 'Analiza wymagań', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm9', title: 'Projektowanie architektury', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm10', title: 'Rozwój MVP', targetDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm11', title: 'Testy i wdrożenie', targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'GOOD',
          tags: ['CRM', 'Modernizacja', 'AI', 'Automatyzacja'],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: 'Certyfikacja ISO 27001',
          description: 'Uzyskanie certyfikatu bezpieczeństwa informacji dla całej organizacji',
          horizonLevel: 1,
          horizonName: 'Projekty (10k ft)',
          horizonIcon: '📋',
          horizonColor: '#F59E0B',
          priority: 'MEDIUM',
          impact: 'MEDIUM',
          effort: 'SIGNIFICANT',
          timeframe: 'NEAR_TERM',
          startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 15,
          status: 'PLANNED',
          dependencies: [],
          milestones: [
            { id: 'm12', title: 'Audit wstępny', targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm13', title: 'Przygotowanie dokumentacji', targetDate: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm14', title: 'Audit certyfikacyjny', targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'GOOD',
          tags: ['Bezpieczeństwo', 'ISO', 'Certyfikacja', 'Compliance'],
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },

        // MEDIUM_TERM - Strategic Initiatives (1-3 years)
        {
          id: '5',
          title: 'Transformacja cyfrowa organizacji',
          description: 'Kompleksowa modernizacja procesów biznesowych z wykorzystaniem najnowszych technologii',
          horizonLevel: 3,
          horizonName: 'Cele 1-2 lata (30k ft)',
          horizonIcon: '🚀',
          horizonColor: '#8B5CF6',
          priority: 'CRITICAL',
          impact: 'TRANSFORMATIVE',
          effort: 'MAJOR',
          timeframe: 'MEDIUM_TERM',
          startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 10,
          status: 'PLANNED',
          dependencies: ['3', '4'],
          milestones: [
            { id: 'm15', title: 'Strategia transformacji', targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm16', title: 'Pilotażowe wdrożenia', targetDate: new Date(Date.now() + 450 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm17', title: 'Pełna transformacja', targetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'PERFECT',
          tags: ['Transformacja', 'Digitalizacja', 'Strategia', 'Innowacje'],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          title: 'Budowa zespołu ekspertów AI',
          description: 'Rozbudowa kompetencji organizacji w dziedzinie sztucznej inteligencji',
          horizonLevel: 2,
          horizonName: 'Obszary (20k ft)',
          horizonIcon: '🎯',
          horizonColor: '#10B981',
          priority: 'HIGH',
          impact: 'LARGE',
          effort: 'SIGNIFICANT',
          timeframe: 'MEDIUM_TERM',
          startDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 5,
          status: 'PLANNED',
          dependencies: ['3'],
          milestones: [
            { id: 'm18', title: 'Rekrutacja specjalistów', targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm19', title: 'Programy szkoleniowe', targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm20', title: 'Pierwsze projekty AI', targetDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'PERFECT',
          tags: ['AI', 'Zespół', 'Eksperci', 'Rozwój'],
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },

        // LONG_TERM - Visionary Goals (3-5 years)
        {
          id: '7',
          title: 'Liderowanie rynkiem technologicznym',
          description: 'Osiągnięcie pozycji #1 w innowacjach technologicznych w naszej branży',
          horizonLevel: 4,
          horizonName: 'Wizja 3-5 lat (40k ft)',
          horizonIcon: '🌟',
          horizonColor: '#6366F1',
          priority: 'HIGH',
          impact: 'TRANSFORMATIVE',
          effort: 'MAJOR',
          timeframe: 'LONG_TERM',
          startDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 1460 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 3,
          status: 'PLANNED',
          dependencies: ['5', '6'],
          milestones: [
            { id: 'm21', title: 'R&D investment strategy', targetDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm22', title: 'Patent applications', targetDate: new Date(Date.now() + 910 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm23', title: 'Industry partnerships', targetDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm24', title: 'Market leadership', targetDate: new Date(Date.now() + 1460 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'GOOD',
          tags: ['Liderstwo', 'Innowacje', 'Market', 'Strategia'],
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },

        // VISION - Life Purpose (5+ years)
        {
          id: '8',
          title: 'Budowanie lepszego świata przez technologię',
          description: 'Wykorzystanie technologii do rozwiązywania globalnych problemów społecznych i środowiskowych',
          horizonLevel: 5,
          horizonName: 'Cel Życia (50k ft)',
          horizonIcon: '🧭',
          horizonColor: '#EC4899',
          priority: 'CRITICAL',
          impact: 'TRANSFORMATIVE',
          effort: 'MAJOR',
          timeframe: 'VISION',
          startDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
          targetDate: new Date(Date.now() + 2190 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 1,
          status: 'PLANNED',
          dependencies: ['7'],
          milestones: [
            { id: 'm25', title: 'Impact measurement framework', targetDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm26', title: 'Social initiative programs', targetDate: new Date(Date.now() + 1460 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm27', title: 'Sustainable practices adoption', targetDate: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm28', title: 'Legacy building', targetDate: new Date(Date.now() + 2190 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'PERFECT',
          tags: ['Purpose', 'Social Impact', 'Legacy', 'Sustainability'],
          createdAt: new Date().toISOString()
        }
      ];

      setItems(mockItems);
      setLoading(false);
    }, 500);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = items.find(item => item.id === active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeItem = items.find(item => item.id === active.id);
    if (!activeItem) return;

    // Find which timeframe the item was dropped in
    const newTimeframe = over.id as string;
    
    if (ROADMAP_TIMEFRAMES.some(tf => tf.id === newTimeframe)) {
      setItems(prev => prev.map(item =>
        item.id === activeItem.id
          ? { ...item, timeframe: newTimeframe as GTDHorizonRoadmapItem['timeframe'] }
          : item
      ));
      
      toast.success(`Element przeniesiony do: ${ROADMAP_TIMEFRAMES.find(tf => tf.id === newTimeframe)?.title}`);
    }
  };

  const handleStatusChange = (itemId: string, status: GTDHorizonRoadmapItem['status']) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status } : item
    ));
  };

  const getFilteredItems = () => {
    let filtered = items;
    
    if (selectedTimeframe !== 'ALL') {
      filtered = filtered.filter(item => item.timeframe === selectedTimeframe);
    }
    
    if (selectedHorizon !== -1) {
      filtered = filtered.filter(item => item.horizonLevel === selectedHorizon);
    }
    
    return filtered;
  };

  const getItemsByTimeframe = (timeframeId: string) => {
    return getFilteredItems().filter(item => item.timeframe === timeframeId);
  };

  const getAlignmentStats = () => {
    const filtered = getFilteredItems();
    const total = filtered.length;
    const perfect = filtered.filter(item => item.alignment === 'PERFECT').length;
    const good = filtered.filter(item => item.alignment === 'GOOD').length;
    const moderate = filtered.filter(item => item.alignment === 'MODERATE').length;
    const poor = filtered.filter(item => item.alignment === 'POOR').length;
    
    return { total, perfect, good, moderate, poor };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const alignmentStats = getAlignmentStats();

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
              Roadmap GTD Horizons
            </h1>
            <p className="text-gray-600">Strategiczne planowanie według 6 poziomów perspektywy</p>
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

          {/* Add New Item */}
          <button className="btn btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nowy element
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FlagIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Łącznie elementów</p>
              <p className="text-xl font-semibold text-gray-900">{alignmentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Perfekcyjne dopasowanie</p>
              <p className="text-xl font-semibold text-gray-900">{alignmentStats.perfect}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Dobre dopasowanie</p>
              <p className="text-xl font-semibold text-gray-900">{alignmentStats.good}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">W trakcie</p>
              <p className="text-xl font-semibold text-gray-900">
                {getFilteredItems().filter(item => item.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Średni postęp</p>
              <p className="text-xl font-semibold text-gray-900">
                {getFilteredItems().length > 0 ? 
                  Math.round(getFilteredItems().reduce((sum, item) => sum + item.progress, 0) / getFilteredItems().length)
                  : 0}%
              </p>
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
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="ALL">Wszystkie okresy</option>
            {ROADMAP_TIMEFRAMES.map(timeframe => (
              <option key={timeframe.id} value={timeframe.id}>{timeframe.title}</option>
            ))}
          </select>

          <select
            value={selectedHorizon}
            onChange={(e) => setSelectedHorizon(parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value={-1}>Wszystkie horyzonty</option>
            {GTD_HORIZONS.map(horizon => (
              <option key={horizon.level} value={horizon.level}>
                {horizon.icon} Poziom {horizon.level}: {horizon.name}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Pokazano: {getFilteredItems().length} z {items.length} elementów
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
            {ROADMAP_TIMEFRAMES.map(timeframe => {
              const timeframeItems = getItemsByTimeframe(timeframe.id);
              
              return (
                <div
                  key={timeframe.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Timeframe Header */}
                  <div 
                    className="p-4 text-white"
                    style={{ backgroundColor: timeframe.color }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{timeframe.icon}</span>
                      <h3 className="font-semibold text-sm">{timeframe.title}</h3>
                    </div>
                    <p className="text-xs opacity-90">{timeframe.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span>{timeframe.timeRange}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                        {timeframeItems.length} elementów
                      </span>
                    </div>
                  </div>

                  {/* Items Container */}
                  <div 
                    className="p-4 space-y-3 min-h-[400px]"
                    style={{ backgroundColor: timeframe.bgColor }}
                  >
                    <SortableContext items={timeframeItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                      {timeframeItems.map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          timeframe={timeframe}
                          onEdit={(item) => console.log('Edit item:', item)}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </SortableContext>
                    
                    {timeframeItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">{timeframe.icon}</div>
                        <div className="text-sm">Brak elementów w tym okresie</div>
                        <div className="text-xs mt-1">Przeciągnij elementy tutaj</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                <div className="font-medium text-gray-900">{activeItem.title}</div>
                <div className="text-sm text-gray-600 mt-1">{activeItem.description}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-8">
            {ROADMAP_TIMEFRAMES.map((timeframe, index) => {
              const timeframeItems = getItemsByTimeframe(timeframe.id);
              
              return (
                <div key={timeframe.id} className="relative">
                  {/* Timeline Line */}
                  {index < ROADMAP_TIMEFRAMES.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200"></div>
                  )}
                  
                  {/* Timeline Dot */}
                  <div className="relative flex items-start">
                    <div 
                      className="flex items-center justify-center w-12 h-12 rounded-full text-white text-lg"
                      style={{ backgroundColor: timeframe.color }}
                    >
                      {timeframe.icon}
                    </div>
                    
                    <div className="ml-6 flex-1">
                      {/* Timeframe Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{timeframe.title}</h3>
                          <p className="text-sm text-gray-600">{timeframe.description}</p>
                          <span className="text-xs text-gray-500">{timeframe.timeRange}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {timeframeItems.length} elementów
                        </span>
                      </div>
                      
                      {/* Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {timeframeItems.map(item => {
                          const horizon = GTD_HORIZONS.find(h => h.level === item.horizonLevel);
                          
                          return (
                            <div
                              key={item.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span style={{ color: horizon?.color }} className="text-lg">
                                    {horizon?.icon}
                                  </span>
                                  <span className="text-xs text-gray-500">Poziom {item.horizonLevel}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  item.impact === 'TRANSFORMATIVE' ? 'bg-purple-100 text-purple-700' :
                                  item.impact === 'LARGE' ? 'bg-orange-100 text-orange-700' :
                                  item.impact === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.impact}
                                </span>
                              </div>
                              
                              <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{item.progress}%</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                  item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                  item.status === 'PLANNED' ? 'bg-gray-100 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}