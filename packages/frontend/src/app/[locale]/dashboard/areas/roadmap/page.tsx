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
  PlayCircle,
  PauseCircle,
  BarChart3,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Settings,
  Sprout,
  Target,
  Zap,
  TrendingDown,
  Wallet,
  User,
  Smile,
} from 'lucide-react';

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
  icon: React.ReactNode;
}

const MATURITY_LEVELS: MaturityLevel[] = [
  {
    id: 'EMERGING',
    title: 'Emerging',
    description: 'Nowe obszary odpowiedzialnosci w fazie eksploracji',
    characteristics: ['Brak jasnych procesow', 'Uczenie sie podstaw', 'Eksperymentowanie'],
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    icon: <Sprout className="w-5 h-5" />,
  },
  {
    id: 'DEVELOPING',
    title: 'Developing',
    description: 'Obszary w fazie aktywnego rozwoju i budowania kompetencji',
    characteristics: ['Ustalanie procesow', 'Budowanie nawykow', 'Systematyczny rozwoj'],
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'MATURE',
    title: 'Mature',
    description: 'Ustabilizowane obszary z dobrze dzialajacymi procesami',
    characteristics: ['Ugruntowane procesy', 'Przewidywalne wyniki', 'Efektywne dzialanie'],
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'OPTIMIZING',
    title: 'Optimizing',
    description: 'Obszary w fazie ciaglego doskonalenia i innowacji',
    characteristics: ['Ciagle ulepszenia', 'Innowacyjne podejscia', 'Benchmarking'],
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'DECLINING',
    title: 'Declining',
    description: 'Obszary tracace na znaczeniu lub wymagajace rewitalizacji',
    characteristics: ['Spadajaca wydajnosc', 'Brak motywacji', 'Potrzeba przemyslenia'],
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: <TrendingDown className="w-5 h-5" />,
  }
];

const AREA_CATEGORIES = [
  { id: 'WORK', name: 'Praca', icon: <Briefcase className="w-4 h-4" />, color: '#3B82F6' },
  { id: 'PERSONAL', name: 'Osobiste', icon: <User className="w-4 h-4" />, color: '#8B5CF6' },
  { id: 'HEALTH', name: 'Zdrowie', icon: <Heart className="w-4 h-4" />, color: '#10B981' },
  { id: 'LEARNING', name: 'Nauka', icon: <GraduationCap className="w-4 h-4" />, color: '#F59E0B' },
  { id: 'FINANCIAL', name: 'Finanse', icon: <Wallet className="w-4 h-4" />, color: '#6B7280' },
  { id: 'SOCIAL', name: 'Spoleczne', icon: <Users className="w-4 h-4" />, color: '#EC4899' },
  { id: 'SPIRITUAL', name: 'Duchowe', icon: <Smile className="w-4 h-4" />, color: '#8B5CF6' },
  { id: 'FAMILY', name: 'Rodzina', icon: <Home className="w-4 h-4" />, color: '#F59E0B' }
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
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'MAINTAINING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DEVELOPING': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'ARCHIVED': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'MINIMAL': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
      case 'LIGHT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'INTENSIVE': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'DOMINANT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
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
      className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span style={{ color: category?.color }}>
            {category?.icon}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400">
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
        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{area.name}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{area.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-600 dark:text-slate-400">Sredni postep celow</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{avgProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Objectives */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span>Cele</span>
          <span>{completedObjectives}/{totalObjectives}</span>
        </div>
        {area.objectives.slice(0, 3).map(objective => (
          <div key={objective.id} className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              objective.status === 'COMPLETED' ? 'bg-green-500' :
              objective.status === 'IN_PROGRESS' ? 'bg-blue-500' :
              objective.status === 'PLANNING' ? 'bg-yellow-500' :
              'bg-slate-300 dark:bg-slate-600'
            }`}></div>
            <span className={`text-xs ${
              objective.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400 line-through' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {objective.title}
            </span>
          </div>
        ))}
        {area.objectives.length > 3 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">+{area.objectives.length - 3} wiecej...</div>
        )}
      </div>

      {/* Key Metrics */}
      {area.keyMetrics.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">Kluczowe metryki</div>
          <div className="space-y-1">
            {area.keyMetrics.slice(0, 2).map(metric => (
              <div key={metric.id} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">{metric.name}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                    {metric.value} / {metric.target} {metric.unit}
                  </span>
                  <span className={`text-xs ${
                    metric.trend === 'IMPROVING' ? 'text-green-600 dark:text-green-400' :
                    metric.trend === 'DECLINING' ? 'text-red-600 dark:text-red-400' :
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {metric.trend === 'IMPROVING' ? <TrendingUp className="w-3 h-3 inline" /> :
                     metric.trend === 'DECLINING' ? <TrendingDown className="w-3 h-3 inline" /> : <ArrowRight className="w-3 h-3 inline" />}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources & Review Status */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <Users className="w-3 h-3" />
          <span>{area.stakeholders.length} stakeholders</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="w-3 h-3" />
          <span className={isReviewOverdue ? 'text-red-600 dark:text-red-400' : ''}>
            Przeglad: {daysSinceReview} dni temu
            {isReviewOverdue && ' (przeterminowany)'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <Settings className="w-3 h-3" />
          <span>{area.resources.length} zasobow</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(area.status)}`}>
            {area.status}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {area.timeHorizon}
          </span>
        </div>

        {area.dependencies.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <ArrowRight className="w-3 h-3 mr-1" />
            {area.dependencies.length} zaleznosci
          </div>
        )}
      </div>

      {/* Maturity selector */}
      <div className="mt-3">
        <select
          value={area.maturityLevel}
          onChange={(e) => onMaturityChange(area.id, e.target.value as AreaRoadmapItem['maturityLevel'])}
          className="text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="EMERGING">Emerging</option>
          <option value="DEVELOPING">Developing</option>
          <option value="MATURE">Mature</option>
          <option value="OPTIMIZING">Optimizing</option>
          <option value="DECLINING">Declining</option>
        </select>
      </div>

      {/* Status selector */}
      <div className="mt-2">
        <select
          value={area.status}
          onChange={(e) => onStatusChange(area.id, e.target.value as AreaRoadmapItem['status'])}
          className="text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="ACTIVE">Aktywny</option>
          <option value="MAINTAINING">Utrzymanie</option>
          <option value="DEVELOPING">Rozwoj</option>
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
        {
          id: '1',
          name: 'Public Speaking & Presentations',
          description: 'Rozwoj umiejetnosci publicznego mowienia i prowadzenia prezentacji biznesowych',
          category: 'LEARNING',
          status: 'DEVELOPING',
          priority: 'MEDIUM',
          maturityLevel: 'EMERGING',
          focusLevel: 'LIGHT',
          timeHorizon: 'MEDIUM_TERM',
          currentFocus: ['Warsztat prezentacji', 'Toastmasters Club', 'Feedback od kolegow'],
          keyMetrics: [
            { id: 'km1', name: 'Prezentacje miesiecznie', value: 2, unit: 'szt', target: 4, trend: 'IMPROVING', lastUpdated: new Date().toISOString() },
            { id: 'km2', name: 'Ocena zaufania (1-5)', value: 3, unit: '', target: 4, trend: 'IMPROVING', lastUpdated: new Date().toISOString() }
          ],
          objectives: [
            { id: 'obj1', title: 'Ukonczenie kursu public speaking', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), progress: 25, status: 'IN_PROGRESS', keyResults: ['8/12 modulow ukonczonych', 'Przygotowanie 3 prezentacji', 'Otrzymanie certyfikatu'] },
            { id: 'obj2', title: 'Przeprowadzenie prezentacji dla zarzadu', targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), progress: 10, status: 'PLANNING', keyResults: ['Przygotowanie tematu', 'Przecwiczenie z mentorem', 'Successful delivery'] }
          ],
          reviews: [{ id: 'rev1', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), rating: 3, notes: 'Pierwszy miesiac eksploracji.', achievements: ['Zapisanie sie na kurs'], improvements: ['Lepsze przygotowanie slajdow'], nextActions: ['Kontynuacja kursu'] }],
          dependencies: [],
          stakeholders: ['Mentor Public Speaking', 'Zespol projektowy', 'HR'],
          resources: [
            { id: 'res1', type: 'TIME', name: 'Czas na praktyke', allocation: '3h/tydzien', efficiency: 3 },
            { id: 'res2', type: 'BUDGET', name: 'Kurs online', allocation: '500 PLN', efficiency: 4 },
            { id: 'res3', type: 'PEOPLE', name: 'Mentor', allocation: '1h/tydzien', efficiency: 5 }
          ],
          challenges: ['Trema przed publicznoscia', 'Brak doswiadczenia', 'Ograniczony czas'],
          opportunities: ['Awans w karierze', 'Lepsza komunikacja w zespole'],
          tags: ['Public Speaking', 'Career Development'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'Product Management',
          description: 'Zarzadzanie cyklem zycia produktow IT i strategia produktowa w organizacji',
          category: 'WORK',
          status: 'ACTIVE',
          priority: 'HIGH',
          maturityLevel: 'DEVELOPING',
          focusLevel: 'MODERATE',
          timeHorizon: 'MEDIUM_TERM',
          currentFocus: ['Roadmapa produktowa Q4', 'Customer research', 'Feature prioritization'],
          keyMetrics: [
            { id: 'km3', name: 'User satisfaction', value: 4.2, unit: '/5', target: 4.5, trend: 'IMPROVING', lastUpdated: new Date().toISOString() },
            { id: 'km4', name: 'Feature adoption rate', value: 65, unit: '%', target: 80, trend: 'IMPROVING', lastUpdated: new Date().toISOString() },
            { id: 'km5', name: 'Time to market', value: 6, unit: 'weeks', target: 4, trend: 'STABLE', lastUpdated: new Date().toISOString() }
          ],
          objectives: [
            { id: 'obj3', title: 'Launch nowego modulu CRM', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), progress: 70, status: 'IN_PROGRESS', keyResults: ['Beta testing ukonczone', 'User feedback incorporated', 'Go-to-market plan ready'] },
            { id: 'obj4', title: 'Wzrost user engagement o 25%', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), progress: 45, status: 'IN_PROGRESS', keyResults: ['New onboarding flow', 'Gamification elements', 'Push notifications'] },
            { id: 'obj5', title: 'Product-market fit validation', targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), progress: 30, status: 'IN_PROGRESS', keyResults: ['Customer interviews', 'Usage analytics', 'Retention analysis'] }
          ],
          reviews: [{ id: 'rev2', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), rating: 4, notes: 'Dobry postep w Q3.', achievements: ['Successful product launch'], improvements: ['Faster decision making'], nextActions: ['Finalize Q4 roadmap'] }],
          dependencies: ['Engineering Team', 'Design Team', 'Marketing'],
          stakeholders: ['Engineering Team', 'Design Team', 'Marketing', 'Sales', 'Customer Success', 'CEO'],
          resources: [
            { id: 'res4', type: 'TIME', name: 'Management time', allocation: '40h/tydzien', efficiency: 4 },
            { id: 'res5', type: 'PEOPLE', name: 'Cross-functional team', allocation: '15 osob', efficiency: 4 },
            { id: 'res6', type: 'BUDGET', name: 'Product development', allocation: '100k PLN/Q', efficiency: 4 },
            { id: 'res7', type: 'TOOLS', name: 'Product tools suite', allocation: 'Jira, Figma, Mixpanel', efficiency: 5 }
          ],
          challenges: ['Competing priorities', 'Technical debt', 'Market competition'],
          opportunities: ['New market segments', 'AI/ML integration', 'Mobile expansion'],
          tags: ['Product Management', 'Strategy'],
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Team Leadership & Management',
          description: 'Zarzadzanie zespolem deweloperskim 12 osob - coaching, development, performance management',
          category: 'WORK',
          status: 'ACTIVE',
          priority: 'HIGH',
          maturityLevel: 'MATURE',
          focusLevel: 'INTENSIVE',
          timeHorizon: 'LONG_TERM',
          currentFocus: ['Q4 performance reviews', 'Team capacity planning', 'Leadership development'],
          keyMetrics: [
            { id: 'km6', name: 'Team satisfaction', value: 4.6, unit: '/5', target: 4.5, trend: 'STABLE', lastUpdated: new Date().toISOString() },
            { id: 'km7', name: 'Employee retention', value: 95, unit: '%', target: 90, trend: 'STABLE', lastUpdated: new Date().toISOString() },
            { id: 'km8', name: 'Delivery velocity', value: 42, unit: 'SP/sprint', target: 40, trend: 'IMPROVING', lastUpdated: new Date().toISOString() }
          ],
          objectives: [
            { id: 'obj6', title: 'Wszyscy czlonkowie zespolu maja career path', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), progress: 90, status: 'IN_PROGRESS', keyResults: ['12/12 individual development plans', '100% 1:1 meetings regularity'] },
            { id: 'obj7', title: 'Zero krytycznych bugow w produkcji', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), progress: 85, status: 'IN_PROGRESS', keyResults: ['Code review process optimization', 'Automated testing coverage >90%'] }
          ],
          reviews: [{ id: 'rev3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), rating: 5, notes: 'Zespol funkcjonuje doskonale.', achievements: ['Zero critical incidents'], improvements: ['Knowledge sharing sessions'], nextActions: ['Q4 career discussions'] }],
          dependencies: ['HR Department', 'Engineering Budget', 'Company Strategy'],
          stakeholders: ['Development Team', 'Product Owner', 'HR', 'Other Team Leads', 'CTO'],
          resources: [
            { id: 'res8', type: 'TIME', name: 'Leadership time', allocation: '35h/tydzien', efficiency: 5 },
            { id: 'res9', type: 'PEOPLE', name: 'Development team', allocation: '12 deweloperow', efficiency: 5 }
          ],
          challenges: ['Burnout prevention', 'Skill gap management'],
          opportunities: ['Mentorship programs', 'Technical leadership development'],
          tags: ['Leadership', 'Team Management'],
          createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString()
        },
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
            { id: 'km9', name: 'Weekly training sessions', value: 5, unit: 'sesji', target: 5, trend: 'STABLE', lastUpdated: new Date().toISOString() },
            { id: 'km10', name: 'Body fat percentage', value: 12, unit: '%', target: 10, trend: 'IMPROVING', lastUpdated: new Date().toISOString() }
          ],
          objectives: [
            { id: 'obj8', title: 'Ukonczenie maratonu w czasie <3:30', targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), progress: 75, status: 'IN_PROGRESS', keyResults: ['16-week training plan completion', 'Long runs >30km'] },
            { id: 'obj9', title: 'Osiagniecie 10% body fat', targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), progress: 60, status: 'IN_PROGRESS', keyResults: ['Consistent caloric deficit', 'Strength training 3x/week'] }
          ],
          reviews: [{ id: 'rev4', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), rating: 4, notes: 'Swietny postep w treningu maratonskim.', achievements: ['Completed 35km long run'], improvements: ['Post-workout nutrition'], nextActions: ['Taper phase planning'] }],
          dependencies: [],
          stakeholders: ['Personal Trainer', 'Nutritionist', 'Running Club', 'Family'],
          resources: [
            { id: 'res12', type: 'TIME', name: 'Training time', allocation: '8h/tydzien', efficiency: 5 },
            { id: 'res13', type: 'BUDGET', name: 'Fitness expenses', allocation: '500 PLN/miesiac', efficiency: 4 }
          ],
          challenges: ['Time management', 'Injury prevention'],
          opportunities: ['Ultra-marathon goals', 'Triathlon expansion'],
          tags: ['Health', 'Fitness', 'Running'],
          createdAt: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString(),
          lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          nextReviewDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          name: 'Side Project - Mobile App',
          description: 'Aplikacja mobilna side project, ktora stracila na priorytecie i wymaga decyzji o przyszlosci',
          category: 'PERSONAL',
          status: 'ON_HOLD',
          priority: 'LOW',
          maturityLevel: 'DECLINING',
          focusLevel: 'MINIMAL',
          timeHorizon: 'SHORT_TERM',
          currentFocus: ['Decision making', 'Code maintenance', 'User retention analysis'],
          keyMetrics: [
            { id: 'km12', name: 'Monthly active users', value: 45, unit: 'users', target: 100, trend: 'DECLINING', lastUpdated: new Date().toISOString() },
            { id: 'km13', name: 'Time invested', value: 2, unit: 'h/tydzien', target: 8, trend: 'DECLINING', lastUpdated: new Date().toISOString() }
          ],
          objectives: [
            { id: 'obj10', title: 'Decyzja o przyszlosci projektu', targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), progress: 50, status: 'IN_PROGRESS', keyResults: ['User feedback analysis', 'Cost-benefit evaluation', 'Strategic decision'] }
          ],
          reviews: [{ id: 'rev5', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), rating: 2, notes: 'Projekt stracil na priorytecie.', achievements: ['Basic maintenance completed'], improvements: ['Need clear strategy'], nextActions: ['Final decision meeting'] }],
          dependencies: [],
          stakeholders: ['App Users', 'Co-founder'],
          resources: [
            { id: 'res16', type: 'TIME', name: 'Development time', allocation: '2h/tydzien', efficiency: 2 },
            { id: 'res17', type: 'BUDGET', name: 'Hosting costs', allocation: '50 PLN/miesiac', efficiency: 2 }
          ],
          challenges: ['Declining motivation', 'Limited time'],
          opportunities: ['Learning from failure', 'Code reuse'],
          tags: ['Side Project', 'Mobile App'],
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
    <PageShell>
      <PageHeader
        title="Roadmap Obszarow Odpowiedzialnosci"
        subtitle="Zarzadzanie wszystkimi obszarami zycia wedlug poziomow dojrzalosci"
        icon={Map}
        iconColor="text-blue-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Obszary', href: '/dashboard/areas' },
          { label: 'Roadmap' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600">
              <button
                onClick={() => setViewMode('roadmap')}
                className={`px-3 py-2 text-sm rounded-l-lg ${
                  viewMode === 'roadmap'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Map className="w-4 h-4 mr-1 inline" />
                Roadmap
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'matrix'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1 inline" />
                Matrix
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm rounded-r-lg ${
                  viewMode === 'timeline'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 mr-1 inline" />
                Timeline
              </button>
            </div>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nowy obszar
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Flag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkie</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <PlayCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aktywne</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Rozwoj</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.developing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Utrzymanie</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.maintaining}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <PauseCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wstrzymane</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.onHold}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Przeglady</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.overdueReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtruj:</span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md px-3 py-1"
            >
              <option value="ALL">Wszystkie kategorie</option>
              {AREA_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTimeHorizon}
              onChange={(e) => setSelectedTimeHorizon(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md px-3 py-1"
            >
              <option value="ALL">Wszystkie horyzonty</option>
              <option value="IMMEDIATE">Natychmiastowy</option>
              <option value="SHORT_TERM">Krotkoterminowy</option>
              <option value="MEDIUM_TERM">Srednioterminowy</option>
              <option value="LONG_TERM">Dlugoterminowy</option>
              <option value="LIFETIME">Cale zycie</option>
            </select>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Pokazano: {getFilteredAreas().length} z {areas.length} obszarow
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
                    className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
                  >
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
                              <span className="mr-1">-</span>
                              <span>{char}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 bg-white bg-opacity-20 px-2 py-1 rounded text-center">
                          {levelAreas.length} obszarow
                        </div>
                      </div>
                    </div>

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
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <div className="text-2xl mb-2">{level.icon}</div>
                          <div className="text-sm">Brak obszarow na tym poziomie</div>
                          <div className="text-xs mt-1">Przeciagnij obszary tutaj</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeArea ? (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-lg border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{activeArea.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activeArea.description}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {activeArea.objectives.length} celow - {activeArea.keyMetrics.length} metryk
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Matrix View Placeholder */}
        {viewMode === 'matrix' && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Matryca Obszarow</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Dwuwymiarowa matryca: Dojrzalosc vs Poziom skupienia z heatmapa priorytetow
              </p>
              <button className="btn btn-primary">
                <Settings className="w-4 h-4 mr-2" />
                Konfiguruj matrycee
              </button>
            </div>
          </div>
        )}

        {/* Timeline View Placeholder */}
        {viewMode === 'timeline' && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
            <div className="text-center">
              <Clock className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Timeline Obszarow</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Chronologiczny rozwoj obszarow odpowiedzialnosci z kluczowymi momentami
              </p>
              <button className="btn btn-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Konfiguruj timeline
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
