'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/context';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ChevronLeft,
  Plus,
  Clock,
  Calendar,
  Map,
  Flag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Rocket,
  Flame,
  Target,
  Compass,
  ClipboardList,
  Star,
} from 'lucide-react';

interface GTDHorizonRoadmapItem {
  id: string;
  title: string;
  description: string;
  horizonLevel: number;
  horizonName: string;
  horizonIcon: React.ReactNode;
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
  icon: React.ReactNode;
  duration: string;
}

const ROADMAP_TIMEFRAMES: RoadmapTimeframe[] = [
  {
    id: 'NOW',
    title: 'Teraz (0-3 mies.)',
    description: 'Biezace dzialania i natychmiastowe priorytety',
    timeRange: '0-3 miesiecy',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    icon: <Flame className="w-5 h-5" />,
    duration: 'Immediate'
  },
  {
    id: 'NEAR_TERM',
    title: 'Bliska perspektywa (3-12 mies.)',
    description: 'Planowane projekty i cele kwartalne',
    timeRange: '3-12 miesiecy',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    icon: <Target className="w-5 h-5" />,
    duration: 'Short-term'
  },
  {
    id: 'MEDIUM_TERM',
    title: 'Sredni termin (1-3 lata)',
    description: 'Strategiczne inicjatywy i transformacje',
    timeRange: '1-3 lata',
    color: '#CA8A04',
    bgColor: '#FFFBEB',
    icon: <Rocket className="w-5 h-5" />,
    duration: 'Medium-term'
  },
  {
    id: 'LONG_TERM',
    title: 'Dlugi termin (3-5 lat)',
    description: 'Wizja i fundamentalne zmiany',
    timeRange: '3-5 lat',
    color: '#7C3AED',
    bgColor: '#F3F4F6',
    icon: <Star className="w-5 h-5" />,
    duration: 'Long-term'
  },
  {
    id: 'VISION',
    title: 'Wizja (5+ lat)',
    description: 'Ostateczne cele i marzenia',
    timeRange: '5+ lat',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    icon: <Compass className="w-5 h-5" />,
    duration: 'Visionary'
  }
];

const GTD_HORIZONS = [
  { level: 0, name: 'Dzialania (Runway)', icon: <ArrowRight className="w-4 h-4" />, color: '#EF4444' },
  { level: 1, name: 'Projekty (10k ft)', icon: <ClipboardList className="w-4 h-4" />, color: '#F59E0B' },
  { level: 2, name: 'Obszary (20k ft)', icon: <Target className="w-4 h-4" />, color: '#10B981' },
  { level: 3, name: 'Cele 1-2 lata (30k ft)', icon: <Rocket className="w-4 h-4" />, color: '#8B5CF6' },
  { level: 4, name: 'Wizja 3-5 lat (40k ft)', icon: <Star className="w-4 h-4" />, color: '#6366F1' },
  { level: 5, name: 'Cel Zycia (50k ft)', icon: <Compass className="w-4 h-4" />, color: '#EC4899' }
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
      case 'SMALL': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'LARGE': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'TRANSFORMATIVE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'MINIMAL': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'SIGNIFICANT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MAJOR': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'PERFECT': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'GOOD': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'POOR': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const horizon = GTD_HORIZONS.find(h => h.level === item.horizonLevel);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span style={{ color: horizon?.color }}>
            {horizon?.icon}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Poziom {item.horizonLevel} - {horizon?.name}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactColor(item.impact)}`}>
            {item.impact}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{item.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-400">Postep</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{item.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${item.progress}%` }}
          ></div>
        </div>
      </div>

      {item.milestones.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
            Kamienie milowe ({item.milestones.filter(m => m.completed).length}/{item.milestones.length})
          </div>
          <div className="space-y-1">
            {item.milestones.slice(0, 2).map(milestone => (
              <div key={milestone.id} className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <span className={`text-xs ${milestone.completed ? 'text-green-700 dark:text-green-400 line-through' : 'text-slate-600 dark:text-slate-400'}`}>
                  {milestone.title}
                </span>
              </div>
            ))}
            {item.milestones.length > 2 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">+{item.milestones.length - 2} wiecej...</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
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
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date(item.targetDate).toLocaleDateString('pl-PL', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item.id, e.target.value as GTDHorizonRoadmapItem['status'])}
          className="text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="PLANNED">Planowane</option>
          <option value="IN_PROGRESS">W trakcie</option>
          <option value="COMPLETED">Ukonczone</option>
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
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadRoadmapItems();
  }, []);

  const loadRoadmapItems = async () => {
    setTimeout(() => {
      const mockItems: GTDHorizonRoadmapItem[] = [
        {
          id: '1', title: 'Wdrozenie Zrodla', description: 'Implementacja systemu zbierania wszystkich zadan w jednym miejscu',
          horizonLevel: 0, horizonName: 'Dzialania (Runway)', horizonIcon: <ArrowRight className="w-4 h-4" />, horizonColor: '#EF4444',
          priority: 'HIGH', impact: 'MEDIUM', effort: 'MODERATE', timeframe: 'NOW',
          startDate: new Date().toISOString(), targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 85, status: 'IN_PROGRESS', dependencies: [],
          milestones: [
            { id: 'm1', title: 'Konfiguracja systemu', targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm2', title: 'Migracja istniejacych zadan', targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm3', title: 'Szkolenie zespolu', targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm4', title: 'Pelne wdrozenie', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), completed: false }
          ],
          alignment: 'PERFECT', tags: ['STREAMS', 'Produktywnosc', 'Workflow'], createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2', title: 'Optymalizacja procesow komunikacji', description: 'Reorganizacja przeplywu informacji w zespole',
          horizonLevel: 0, horizonName: 'Dzialania (Runway)', horizonIcon: <ArrowRight className="w-4 h-4" />, horizonColor: '#EF4444',
          priority: 'MEDIUM', impact: 'MEDIUM', effort: 'MINIMAL', timeframe: 'NOW',
          startDate: new Date().toISOString(), targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 60, status: 'IN_PROGRESS', dependencies: [],
          milestones: [
            { id: 'm5', title: 'Analiza istniejacych procesow', targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
            { id: 'm6', title: 'Projekt nowych standardow', targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
          ],
          alignment: 'GOOD', tags: ['Komunikacja', 'Zespol'], createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3', title: 'Modernizacja systemu CRM', description: 'Kompleksowe ulepszenie platformy CRM z integracja AI',
          horizonLevel: 1, horizonName: 'Projekty (10k ft)', horizonIcon: <ClipboardList className="w-4 h-4" />, horizonColor: '#F59E0B',
          priority: 'HIGH', impact: 'LARGE', effort: 'SIGNIFICANT', timeframe: 'NEAR_TERM',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 25, status: 'PLANNED', dependencies: ['1'],
          milestones: [
            { id: 'm8', title: 'Analiza wymagan', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
            { id: 'm9', title: 'Projektowanie architektury', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), completed: false },
          ],
          alignment: 'GOOD', tags: ['CRM', 'Modernizacja', 'AI'], createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4', title: 'Certyfikacja ISO 27001', description: 'Uzyskanie certyfikatu bezpieczenstwa informacji',
          horizonLevel: 1, horizonName: 'Projekty (10k ft)', horizonIcon: <ClipboardList className="w-4 h-4" />, horizonColor: '#F59E0B',
          priority: 'MEDIUM', impact: 'MEDIUM', effort: 'SIGNIFICANT', timeframe: 'NEAR_TERM',
          startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 15, status: 'PLANNED', dependencies: [],
          milestones: [{ id: 'm12', title: 'Audit wstepny', targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), completed: false }],
          alignment: 'GOOD', tags: ['Bezpieczenstwo', 'ISO'], createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5', title: 'Transformacja cyfrowa organizacji', description: 'Kompleksowa modernizacja procesow biznesowych',
          horizonLevel: 3, horizonName: 'Cele 1-2 lata (30k ft)', horizonIcon: <Rocket className="w-4 h-4" />, horizonColor: '#8B5CF6',
          priority: 'CRITICAL', impact: 'TRANSFORMATIVE', effort: 'MAJOR', timeframe: 'MEDIUM_TERM',
          startDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 10, status: 'PLANNED', dependencies: ['3', '4'],
          milestones: [{ id: 'm15', title: 'Strategia transformacji', targetDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(), completed: false }],
          alignment: 'PERFECT', tags: ['Transformacja', 'Digitalizacja'], createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6', title: 'Budowa zespolu ekspertow AI', description: 'Rozbudowa kompetencji organizacji w dziedzinie AI',
          horizonLevel: 2, horizonName: 'Obszary (20k ft)', horizonIcon: <Target className="w-4 h-4" />, horizonColor: '#10B981',
          priority: 'HIGH', impact: 'LARGE', effort: 'SIGNIFICANT', timeframe: 'MEDIUM_TERM',
          startDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 5, status: 'PLANNED', dependencies: ['3'],
          milestones: [{ id: 'm18', title: 'Rekrutacja specjalistow', targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), completed: false }],
          alignment: 'PERFECT', tags: ['AI', 'Zespol'], createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '7', title: 'Liderowanie rynkiem technologicznym', description: 'Osiagniecie pozycji #1 w innowacjach technologicznych',
          horizonLevel: 4, horizonName: 'Wizja 3-5 lat (40k ft)', horizonIcon: <Star className="w-4 h-4" />, horizonColor: '#6366F1',
          priority: 'HIGH', impact: 'TRANSFORMATIVE', effort: 'MAJOR', timeframe: 'LONG_TERM',
          startDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 1460 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 3, status: 'PLANNED', dependencies: ['5', '6'],
          milestones: [{ id: 'm21', title: 'R&D investment strategy', targetDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000).toISOString(), completed: false }],
          alignment: 'GOOD', tags: ['Liderstwo', 'Innowacje'], createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '8', title: 'Budowanie lepszego swiata przez technologie', description: 'Wykorzystanie technologii do rozwiazywania globalnych problemow',
          horizonLevel: 5, horizonName: 'Cel Zycia (50k ft)', horizonIcon: <Compass className="w-4 h-4" />, horizonColor: '#EC4899',
          priority: 'CRITICAL', impact: 'TRANSFORMATIVE', effort: 'MAJOR', timeframe: 'VISION',
          startDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(), targetDate: new Date(Date.now() + 2190 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 1, status: 'PLANNED', dependencies: ['7'],
          milestones: [{ id: 'm25', title: 'Impact measurement framework', targetDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString(), completed: false }],
          alignment: 'PERFECT', tags: ['Purpose', 'Social Impact'], createdAt: new Date().toISOString()
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
    if (selectedTimeframe !== 'ALL') filtered = filtered.filter(item => item.timeframe === selectedTimeframe);
    if (selectedHorizon !== -1) filtered = filtered.filter(item => item.horizonLevel === selectedHorizon);
    return filtered;
  };

  const getItemsByTimeframe = (timeframeId: string) => {
    return getFilteredItems().filter(item => item.timeframe === timeframeId);
  };

  const getAlignmentStats = () => {
    const filtered = getFilteredItems();
    return {
      total: filtered.length,
      perfect: filtered.filter(item => item.alignment === 'PERFECT').length,
      good: filtered.filter(item => item.alignment === 'GOOD').length,
      moderate: filtered.filter(item => item.alignment === 'MODERATE').length,
      poor: filtered.filter(item => item.alignment === 'POOR').length,
    };
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
    <PageShell>
      <PageHeader
        title="Roadmap GTD Horizons"
        subtitle="Strategiczne planowanie wedlug 6 poziomow perspektywy"
        icon={Map}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Horyzonty GTD', href: '/dashboard/gtd-horizons' },
          { label: 'Roadmap' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600">
              <button
                onClick={() => setViewMode('roadmap')}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  viewMode === 'roadmap' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Map className="w-4 h-4 mr-1 inline" />
                Roadmap
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm rounded-r-lg ${
                  viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-1 inline" />
                Timeline
              </button>
            </div>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nowy element
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Flag className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lacznie elementow</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{alignmentStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Perfekcyjne dopasowanie</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{alignmentStats.perfect}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Dobre dopasowanie</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{alignmentStats.good}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">W trakcie</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{getFilteredItems().filter(item => item.status === 'IN_PROGRESS').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sredni postep</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {getFilteredItems().length > 0 ? Math.round(getFilteredItems().reduce((sum, item) => sum + item.progress, 0) / getFilteredItems().length) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtruj:</span>
            <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)} className="text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md px-3 py-1">
              <option value="ALL">Wszystkie okresy</option>
              {ROADMAP_TIMEFRAMES.map(tf => (<option key={tf.id} value={tf.id}>{tf.title}</option>))}
            </select>
            <select value={selectedHorizon} onChange={(e) => setSelectedHorizon(parseInt(e.target.value))} className="text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md px-3 py-1">
              <option value={-1}>Wszystkie horyzonty</option>
              {GTD_HORIZONS.map(horizon => (<option key={horizon.level} value={horizon.level}>Poziom {horizon.level}: {horizon.name}</option>))}
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400">Pokazano: {getFilteredItems().length} z {items.length} elementow</span>
          </div>
        </div>

        {/* Roadmap View */}
        {viewMode === 'roadmap' && (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {ROADMAP_TIMEFRAMES.map(timeframe => {
                const timeframeItems = getItemsByTimeframe(timeframe.id);
                return (
                  <div key={timeframe.id} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 text-white" style={{ backgroundColor: timeframe.color }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">{timeframe.icon}</span>
                        <h3 className="font-semibold text-sm">{timeframe.title}</h3>
                      </div>
                      <p className="text-xs opacity-90">{timeframe.description}</p>
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span>{timeframe.timeRange}</span>
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded">{timeframeItems.length} elementow</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3 min-h-[400px]" style={{ backgroundColor: timeframe.bgColor }}>
                      <SortableContext items={timeframeItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        {timeframeItems.map(item => (
                          <SortableItem key={item.id} item={item} timeframe={timeframe} onEdit={(item) => console.log('Edit item:', item)} onStatusChange={handleStatusChange} />
                        ))}
                      </SortableContext>
                      {timeframeItems.length === 0 && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <div className="text-2xl mb-2">{timeframe.icon}</div>
                          <div className="text-sm">Brak elementow w tym okresie</div>
                          <div className="text-xs mt-1">Przeciagnij elementy tutaj</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <DragOverlay>
              {activeItem ? (
                <div className="bg-white/80 backdrop-blur-xl border-2 border-blue-500 dark:bg-slate-800/80 rounded-2xl shadow-lg p-4 opacity-90 transform rotate-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{activeItem.title}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activeItem.description}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="space-y-8">
              {ROADMAP_TIMEFRAMES.map((timeframe, index) => {
                const timeframeItems = getItemsByTimeframe(timeframe.id);
                return (
                  <div key={timeframe.id} className="relative">
                    {index < ROADMAP_TIMEFRAMES.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-full bg-slate-200 dark:bg-slate-700"></div>
                    )}
                    <div className="relative flex items-start">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full text-white text-lg" style={{ backgroundColor: timeframe.color }}>
                        {timeframe.icon}
                      </div>
                      <div className="ml-6 flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{timeframe.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{timeframe.description}</p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{timeframe.timeRange}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{timeframeItems.length} elementow</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {timeframeItems.map(item => {
                            const horizon = GTD_HORIZONS.find(h => h.level === item.horizonLevel);
                            return (
                              <div key={item.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span style={{ color: horizon?.color }}>{horizon?.icon}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Poziom {item.horizonLevel}</span>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    item.impact === 'TRANSFORMATIVE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                    item.impact === 'LARGE' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    item.impact === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400'
                                  }`}>{item.impact}</span>
                                </div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{item.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">{item.progress}%</span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    item.status === 'PLANNED' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>{item.status}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-2">
                                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }}></div>
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
    </PageShell>
  );
}
