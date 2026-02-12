'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft,
  Plus,
  Clock,
  Play,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Flame,
  Lightbulb,
  Settings,
  ClipboardList,
  Zap,
  Search,
  Ban,
  Timer,
  Brain,
  Palette,
  CalendarDays,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface FocusSprintItem {
  id: string;
  title: string;
  description: string;
  modeType: 'POMODORO' | 'DEEP_WORK' | 'SPRINT' | 'CREATIVE_FLOW';
  modeIcon: string;
  modeColor: string;
  duration: number;
  estimatedSessions: number;
  completedSessions: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ScrumColumn {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  maxItems?: number;
}

const SCRUM_COLUMNS: ScrumColumn[] = [
  {
    id: 'TO_DO',
    title: 'Do Zrobienia',
    description: 'Sesje fokusowe gotowe do rozpoczecia',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    id: 'IN_PROGRESS',
    title: 'W Trakcie',
    description: 'Aktywne sesje fokusowe',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: <Zap className="w-5 h-5" />,
    maxItems: 1,
  },
  {
    id: 'REVIEW',
    title: 'Przeglad',
    description: 'Sesje wymagajace oceny',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: 'DONE',
    title: 'Gotowe',
    description: 'Ukonczone sesje fokusowe',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: 'BLOCKED',
    title: 'Zablokowane',
    description: 'Sesje z przeszkodami',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: <Ban className="w-5 h-5" />,
  },
];

const FOCUS_MODE_TYPES = [
  { id: 'POMODORO', name: 'Pomodoro', icon: <Timer className="w-4 h-4" />, color: '#EF4444', duration: 25 },
  { id: 'DEEP_WORK', name: 'Deep Work', icon: <Brain className="w-4 h-4" />, color: '#3B82F6', duration: 90 },
  { id: 'SPRINT', name: 'Sprint', icon: <Zap className="w-4 h-4" />, color: '#10B981', duration: 15 },
  { id: 'CREATIVE_FLOW', name: 'Creative Flow', icon: <Palette className="w-4 h-4" />, color: '#8B5CF6', duration: 50 },
];

const PRIORITY_CONFIG = {
  LOW: { color: '#6B7280', bg: '#F9FAFB', label: 'Niski' },
  MEDIUM: { color: '#F59E0B', bg: '#FFFBEB', label: 'Sredni' },
  HIGH: { color: '#EF4444', bg: '#FEF2F2', label: 'Wysoki' },
  URGENT: { color: '#DC2626', bg: '#FEE2E2', label: 'Pilny' },
};

function getModeTypeIcon(modeType: string) {
  switch (modeType) {
    case 'POMODORO': return <Timer className="w-4 h-4 text-white" />;
    case 'DEEP_WORK': return <Brain className="w-4 h-4 text-white" />;
    case 'SPRINT': return <Zap className="w-4 h-4 text-white" />;
    case 'CREATIVE_FLOW': return <Palette className="w-4 h-4 text-white" />;
    default: return <Clock className="w-4 h-4 text-white" />;
  }
}

interface SortableSprintItemProps {
  item: FocusSprintItem;
  onEdit: (item: FocusSprintItem) => void;
  onDelete: (id: string) => void;
  onStart: (item: FocusSprintItem) => void;
}

function SortableSprintItem({ item, onEdit, onDelete, onStart }: SortableSprintItemProps) {
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

  const modeType = FOCUS_MODE_TYPES.find(mode => mode.id === item.modeType);
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const progressPercentage = item.estimatedSessions > 0 ? (item.completedSessions / item.estimatedSessions) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-move"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: modeType?.color }}
          >
            {getModeTypeIcon(item.modeType)}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{modeType?.name}</p>
          </div>
        </div>
        <div
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: priorityConfig.bg,
            color: priorityConfig.color
          }}
        >
          {priorityConfig.label}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Postep sesji</span>
          <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
            {item.completedSessions}/{item.estimatedSessions}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              backgroundColor: modeType?.color,
              width: `${progressPercentage}%`
            }}
          ></div>
        </div>
      </div>

      {/* Duration & Due Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {item.duration} min
        </div>
        {item.dueDate && (
          <div className="flex items-center">
            <CalendarDays className="w-3 h-3 mr-1" />
            {new Date(item.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">+{item.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center space-x-1">
          {item.status === 'TO_DO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart(item);
              }}
              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Rozpocznij sesje"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edytuj element"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Usun element"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FocusModesScrumPage() {
  const router = useRouter();
  const [sprintItems, setSprintItems] = useState<FocusSprintItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FocusSprintItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    modeType: 'POMODORO' as 'DEEP_WORK' | 'POMODORO' | 'SPRINT' | 'CREATIVE_FLOW',
    duration: 25,
    estimatedSessions: 1,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    tags: [] as string[],
    dueDate: '',
    notes: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadSprintData();
  }, []);

  const loadSprintData = async () => {
    try {
      setLoading(true);

      setTimeout(() => {
        const mockItems: FocusSprintItem[] = [
          {
            id: '1',
            title: 'Ukonczenie propozycji projektu',
            description: 'Skupienie na pisaniu i strukturze propozycji projektu Q4',
            modeType: 'DEEP_WORK',
            modeIcon: 'brain',
            modeColor: '#3B82F6',
            duration: 90,
            estimatedSessions: 2,
            completedSessions: 0,
            priority: 'HIGH',
            tags: ['pisanie', 'strategia'],
            dueDate: '2024-02-15',
            status: 'TO_DO',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Sprint przegladu kodu',
            description: 'Przeglad oczekujacych pull requestow i przekazanie informacji zwrotnej',
            modeType: 'POMODORO',
            modeIcon: 'timer',
            modeColor: '#EF4444',
            duration: 25,
            estimatedSessions: 4,
            completedSessions: 2,
            priority: 'MEDIUM',
            tags: ['kod', 'przeglad'],
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Aktualizacja Design System',
            description: 'Sesja kreatywna na aktualizacje komponentow UI i tokenow designu',
            modeType: 'CREATIVE_FLOW',
            modeIcon: 'palette',
            modeColor: '#8B5CF6',
            duration: 50,
            estimatedSessions: 3,
            completedSessions: 3,
            priority: 'LOW',
            tags: ['design', 'ui', 'kreatywne'],
            status: 'REVIEW',
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Sprint naprawy bledow',
            description: 'Szybki sprint na rozwiazanie krytycznych bledow',
            modeType: 'SPRINT',
            modeIcon: 'zap',
            modeColor: '#10B981',
            duration: 15,
            estimatedSessions: 6,
            completedSessions: 6,
            priority: 'URGENT',
            tags: ['bledy', 'pilne'],
            status: 'DONE',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '5',
            title: 'Badania i analiza',
            description: 'Badania rynku zablokowane przez brak dostepu',
            modeType: 'DEEP_WORK',
            modeIcon: 'brain',
            modeColor: '#3B82F6',
            duration: 90,
            estimatedSessions: 2,
            completedSessions: 0,
            priority: 'MEDIUM',
            tags: ['badania', 'zablokowane'],
            status: 'BLOCKED',
            createdAt: new Date().toISOString(),
          },
        ];

        setSprintItems(mockItems);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error('Error loading sprint data:', error);
      toast.error('Nie udalo sie zaladowac danych sprintu');
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = sprintItems.find(item => item.id === active.id);
    if (!activeItem) return;

    const newStatus = over.id as FocusSprintItem['status'];

    if (newStatus === 'IN_PROGRESS') {
      const activeProgressItems = sprintItems.filter(item => item.status === 'IN_PROGRESS');
      if (activeProgressItems.length >= 1 && activeItem.status !== 'IN_PROGRESS') {
        toast.error('Tylko jedna sesja fokusowa moze byc aktywna jednoczesnie');
        return;
      }
    }

    if (activeItem.status !== newStatus) {
      const updatedItems = sprintItems.map(item => {
        if (item.id === active.id) {
          const updates: Partial<FocusSprintItem> = { status: newStatus };

          if (newStatus === 'IN_PROGRESS' && !item.startedAt) {
            updates.startedAt = new Date().toISOString();
          }

          if (newStatus === 'DONE' && !item.completedAt) {
            updates.completedAt = new Date().toISOString();
            updates.completedSessions = item.estimatedSessions;
          }

          return { ...item, ...updates };
        }
        return item;
      });

      setSprintItems(updatedItems);
      toast.success(`Przeniesiono "${activeItem.title}" do ${newStatus.replace('_', ' ').toLowerCase()}`);
    }
  };

  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast.error('Tytul jest wymagany');
      return;
    }

    const modeType = FOCUS_MODE_TYPES.find(mode => mode.id === newItem.modeType);

    const item: FocusSprintItem = {
      id: Date.now().toString(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      modeType: newItem.modeType,
      modeIcon: newItem.modeType.toLowerCase(),
      modeColor: modeType?.color || '#3B82F6',
      duration: newItem.duration,
      estimatedSessions: newItem.estimatedSessions,
      completedSessions: 0,
      priority: newItem.priority,
      tags: newItem.tags,
      dueDate: newItem.dueDate || undefined,
      notes: newItem.notes || undefined,
      status: 'TO_DO',
      createdAt: new Date().toISOString(),
    };

    setSprintItems(prev => [...prev, item]);
    setNewItem({
      title: '',
      description: '',
      modeType: 'POMODORO',
      duration: 25,
      estimatedSessions: 1,
      priority: 'MEDIUM',
      tags: [],
      dueDate: '',
      notes: '',
    });
    setShowCreateModal(false);
    toast.success('Element sprintu fokusowego utworzony!');
  };

  const handleEditItem = (item: FocusSprintItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      modeType: item.modeType,
      duration: item.duration,
      estimatedSessions: item.estimatedSessions,
      priority: item.priority,
      tags: item.tags,
      dueDate: item.dueDate || '',
      notes: item.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !newItem.title.trim()) {
      toast.error('Tytul jest wymagany');
      return;
    }

    const modeType = FOCUS_MODE_TYPES.find(mode => mode.id === newItem.modeType);

    const updatedItems = sprintItems.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          title: newItem.title.trim(),
          description: newItem.description.trim(),
          modeType: newItem.modeType,
          modeIcon: newItem.modeType.toLowerCase(),
          modeColor: modeType?.color || '#3B82F6',
          duration: newItem.duration,
          estimatedSessions: newItem.estimatedSessions,
          priority: newItem.priority,
          tags: newItem.tags,
          dueDate: newItem.dueDate || undefined,
          notes: newItem.notes || undefined,
        };
      }
      return item;
    });

    setSprintItems(updatedItems);
    setEditingItem(null);
    setNewItem({
      title: '',
      description: '',
      modeType: 'POMODORO',
      duration: 25,
      estimatedSessions: 1,
      priority: 'MEDIUM',
      tags: [],
      dueDate: '',
      notes: '',
    });
    setShowCreateModal(false);
    toast.success('Element sprintu fokusowego zaktualizowany!');
  };

  const handleDeleteItem = (id: string) => {
    const item = sprintItems.find(item => item.id === id);
    if (window.confirm(`Czy na pewno chcesz usunac "${item?.title}"?`)) {
      setSprintItems(prev => prev.filter(item => item.id !== id));
      toast.success('Element sprintu fokusowego usuniety');
    }
  };

  const handleStartSession = (item: FocusSprintItem) => {
    const updatedItems = sprintItems.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'IN_PROGRESS' as const,
          startedAt: new Date().toISOString(),
        };
      }
      return i;
    });

    setSprintItems(updatedItems);
    toast.success(`Rozpoczeto sesje fokusowa: ${item.title}`);
  };

  const getColumnItems = (status: string) => {
    return sprintItems.filter(item => item.status === status);
  };

  const getSprintStats = () => {
    const totalItems = sprintItems.length;
    const completedItems = sprintItems.filter(item => item.status === 'DONE').length;
    const inProgressItems = sprintItems.filter(item => item.status === 'IN_PROGRESS').length;
    const blockedItems = sprintItems.filter(item => item.status === 'BLOCKED').length;
    const totalSessions = sprintItems.reduce((sum, item) => sum + item.completedSessions, 0);

    return {
      totalItems,
      completedItems,
      inProgressItems,
      blockedItems,
      totalSessions,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  };

  const stats = getSprintStats();

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Tablica Scrum Trybow Fokusowych"
        subtitle="Zarzadzaj sesjami fokusowymi z metodologia agile"
        icon={Flame}
        iconColor="text-orange-600"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Dodaj Element Fokusowy
          </button>
        }
        breadcrumbs={[
          { label: 'Tryby Fokusowe', href: '/dashboard/gtd/focus-modes' },
          { label: 'Tablica Scrum' }
        ]}
      />

      {/* Sprint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lacznie</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Play className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">W Trakcie</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.inProgressItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ukonczone</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.completedItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zablokowane</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.blockedItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sesje</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ukonczenie %</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrum Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
          {SCRUM_COLUMNS.map((column) => {
            const columnItems = getColumnItems(column.id);

            return (
              <div key={column.id} className="flex flex-col">
                <div
                  className="bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 rounded-xl p-4 mb-4 border-l-4"
                  style={{
                    borderLeftColor: column.color
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span style={{ color: column.color }}>{column.icon}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{column.title}</h3>
                    </div>
                    <span
                      className="text-sm font-medium px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: column.color + '20',
                        color: column.color
                      }}
                    >
                      {columnItems.length}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{column.description}</p>
                  {column.maxItems && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Maks: {column.maxItems} {column.maxItems !== 1 ? 'elementow' : 'element'}
                    </p>
                  )}
                </div>

                <SortableContext items={columnItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 space-y-3 min-h-[400px] bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3">
                    {columnItems.map((item) => (
                      <SortableSprintItem
                        key={item.id}
                        item={item}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onStart={handleStartSession}
                      />
                    ))}
                    {columnItems.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                        Upusc elementy tutaj
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-lg transform rotate-3">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {sprintItems.find(item => item.id === activeId)?.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl dark:bg-slate-800/95 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-700/30">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingItem ? 'Edytuj Element Fokusowy' : 'Utworz Element Fokusowy'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tytul *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="np. Ukonczenie dokumentacji projektu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opis
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Opisz na czym sie skupisz podczas tej sesji"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Typ Trybu Fokusowego
                  </label>
                  <select
                    value={newItem.modeType}
                    onChange={(e) => {
                      const selectedMode = FOCUS_MODE_TYPES.find(mode => mode.id === e.target.value);
                      setNewItem({
                        ...newItem,
                        modeType: e.target.value as any,
                        duration: selectedMode?.duration || 25
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                  >
                    {FOCUS_MODE_TYPES.map((mode) => (
                      <option key={mode.id} value={mode.id}>
                        {mode.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priorytet
                  </label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Czas trwania (minuty)
                  </label>
                  <input
                    type="number"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: parseInt(e.target.value) || 25 })}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Szacowane sesje
                  </label>
                  <input
                    type="number"
                    value={newItem.estimatedSessions}
                    onChange={(e) => setNewItem({ ...newItem, estimatedSessions: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Termin (opcjonalnie)
                </label>
                <input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tagi (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  value={newItem.tags.join(', ')}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="kodowanie, pilne, kreatywne"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={editingItem ? handleSaveEdit : handleCreateItem}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                disabled={!newItem.title.trim()}
              >
                {editingItem ? 'Zaktualizuj' : 'Utworz'} Element
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
