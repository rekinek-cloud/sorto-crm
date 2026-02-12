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
  ChevronLeft,
  Plus,
  Clock,
  Play,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Flame,
  Lightbulb,
  BarChart3,
  Eye,
  CalendarDays,
  FlaskConical,
  Inbox,
  Target,
  Zap,
  Search,
  FolderOpen,
  Mountain,
  BookOpen,
  Palette,
  CircleDot,
  CheckSquare,
  SkipForward,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface WeeklyReviewSprintItem {
  id: string;
  title: string;
  description: string;
  gtdCategory: 'COLLECT' | 'PROCESS' | 'ORGANIZE' | 'REFLECT' | 'ENGAGE';
  gtdPhase: 'COLLECT' | 'CLARIFY' | 'ORGANIZE' | 'REFLECT' | 'ENGAGE';
  itemType: 'TASK' | 'PROJECT' | 'AREA' | 'CONTEXT' | 'REFERENCE' | 'SOMEDAY_MAYBE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  energy: 'LOW' | 'MEDIUM' | 'HIGH' | 'CREATIVE';
  context: string;
  estimatedTime: number; // in minutes
  actualTime?: number;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  sprintPoints: number;
  weeklyGoal?: string;
  tags: string[];
  dueDate?: string;
  completedDate?: string;
  status: 'BACKLOG' | 'CURRENT_SPRINT' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'DEFERRED' | 'SOMEDAY';
  reviewNotes?: string;
  retrospectiveNotes?: string;
  blockers?: string[];
  outcomes?: string[];
  createdAt: string;
  weekNumber: number;
}

interface ReviewColumn {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  gtdPhase?: string;
  maxItems?: number;
}

const REVIEW_COLUMNS: ReviewColumn[] = [
  {
    id: 'BACKLOG',
    title: 'Weekly Backlog',
    description: 'Items collected for this week',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    icon: <Inbox className="w-4 h-4" />,
    gtdPhase: 'COLLECT',
  },
  {
    id: 'CURRENT_SPRINT',
    title: 'Current Sprint',
    description: 'This week\'s committed items',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: <Target className="w-4 h-4" />,
    gtdPhase: 'ORGANIZE',
  },
  {
    id: 'IN_PROGRESS',
    title: 'Doing Now',
    description: 'Currently being worked on',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: <Zap className="w-4 h-4" />,
    gtdPhase: 'ENGAGE',
    maxItems: 3, // STREAMS principle: focus on few items
  },
  {
    id: 'REVIEW',
    title: 'Weekly Review',
    description: 'Items under weekly review',
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    icon: <Search className="w-4 h-4" />,
    gtdPhase: 'REFLECT',
  },
  {
    id: 'DONE',
    title: 'Completed',
    description: 'Finished this week',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: <CheckCircle2 className="w-4 h-4" />,
    gtdPhase: 'REFLECT',
  },
  {
    id: 'DEFERRED',
    title: 'Next Week',
    description: 'Deferred to next sprint',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: <SkipForward className="w-4 h-4" />,
    gtdPhase: 'ORGANIZE',
  },
  {
    id: 'SOMEDAY',
    title: 'Someday/Maybe',
    description: 'Future considerations',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    icon: <Lightbulb className="w-4 h-4" />,
    gtdPhase: 'ORGANIZE',
  },
];

const GTD_CATEGORIES = [
  { id: 'COLLECT', name: 'Collect', icon: <Inbox className="w-4 h-4" />, color: '#6B7280', description: 'Capture everything' },
  { id: 'PROCESS', name: 'Process', icon: <SlidersHorizontal className="w-4 h-4" />, color: '#F59E0B', description: 'Clarify what it means' },
  { id: 'ORGANIZE', name: 'Organize', icon: <CheckSquare className="w-4 h-4" />, color: '#3B82F6', description: 'Put it where it belongs' },
  { id: 'REFLECT', name: 'Reflect', icon: <Search className="w-4 h-4" />, color: '#8B5CF6', description: 'Review and update' },
  { id: 'ENGAGE', name: 'Engage', icon: <Target className="w-4 h-4" />, color: '#10B981', description: 'Simply do' },
];

const ITEM_TYPES = [
  { id: 'TASK', name: 'Task', icon: <CheckCircle2 className="w-3 h-3" />, color: '#10B981' },
  { id: 'PROJECT', name: 'Project', icon: <FolderOpen className="w-3 h-3" />, color: '#3B82F6' },
  { id: 'AREA', name: 'Area', icon: <Mountain className="w-3 h-3" />, color: '#059669' },
  { id: 'CONTEXT', name: 'Context', icon: <Target className="w-3 h-3" />, color: '#6366F1' },
  { id: 'REFERENCE', name: 'Reference', icon: <BookOpen className="w-3 h-3" />, color: '#8B5CF6' },
  { id: 'SOMEDAY_MAYBE', name: 'Someday/Maybe', icon: <Lightbulb className="w-3 h-3" />, color: '#6B7280' },
];

const ENERGY_LEVELS = [
  { id: 'LOW', name: 'Low Energy', icon: <CircleDot className="w-3 h-3 text-green-500" />, color: '#6B7280', points: 1 },
  { id: 'MEDIUM', name: 'Medium Energy', icon: <CircleDot className="w-3 h-3 text-yellow-500" />, color: '#F59E0B', points: 2 },
  { id: 'HIGH', name: 'High Energy', icon: <CircleDot className="w-3 h-3 text-red-500" />, color: '#EF4444', points: 3 },
  { id: 'CREATIVE', name: 'Creative Energy', icon: <Palette className="w-3 h-3 text-purple-500" />, color: '#8B5CF6', points: 4 },
];

const COMPLEXITY_CONFIG = {
  SIMPLE: { points: 1, color: '#10B981', label: 'Simple' },
  MODERATE: { points: 3, color: '#F59E0B', label: 'Moderate' },
  COMPLEX: { points: 5, color: '#EF4444', label: 'Complex' },
};

interface SortableReviewItemProps {
  item: WeeklyReviewSprintItem;
  onEdit: (item: WeeklyReviewSprintItem) => void;
  onDelete: (id: string) => void;
  onComplete: (item: WeeklyReviewSprintItem) => void;
}

function SortableReviewItem({ item, onEdit, onDelete, onComplete }: SortableReviewItemProps) {
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

  const gtdCategory = GTD_CATEGORIES.find(cat => cat.id === item.gtdCategory);
  const itemType = ITEM_TYPES.find(type => type.id === item.itemType);
  const energyLevel = ENERGY_LEVELS.find(energy => energy.id === item.energy);
  const complexityConfig = COMPLEXITY_CONFIG[item.complexity];

  const progressPercentage = item.actualTime && item.estimatedTime > 0
    ? Math.min((item.actualTime / item.estimatedTime) * 100, 100)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: gtdCategory?.color }}
            title={gtdCategory?.name}
          >
            {gtdCategory?.icon}
          </div>
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: itemType?.color }}
            title={itemType?.name}
          >
            {itemType?.icon}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Week {item.weekNumber} - {item.context}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs" title={energyLevel?.name}>{energyLevel?.icon}</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {complexityConfig.points}pt
          </span>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Weekly Goal */}
      {item.weeklyGoal && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Weekly Goal:</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">{item.weeklyGoal}</p>
        </div>
      )}

      {/* Time Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Time Progress</span>
          <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
            {item.actualTime || 0}min / {item.estimatedTime}min
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              backgroundColor: complexityConfig.color,
              width: `${Math.min(progressPercentage, 100)}%`
            }}
          ></div>
        </div>
      </div>

      {/* Due Date & Completion */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
        <div className="flex items-center space-x-3">
          {item.dueDate && (
            <div className="flex items-center">
              <CalendarDays className="w-3 h-3 mr-1" />
              {new Date(item.dueDate).toLocaleDateString()}
            </div>
          )}
          {item.completedDate && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {new Date(item.completedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Review Notes */}
      {item.reviewNotes && (
        <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Review Notes:</p>
          <p className="text-sm text-purple-600 dark:text-purple-400 line-clamp-2">{item.reviewNotes}</p>
        </div>
      )}

      {/* Blockers */}
      {item.blockers && item.blockers.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-1">
            <X className="w-3 h-3 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Blockers:</span>
          </div>
          {item.blockers.slice(0, 2).map((blocker, index) => (
            <div key={index} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1">
              {blocker}
            </div>
          ))}
        </div>
      )}

      {/* Outcomes */}
      {item.outcomes && item.outcomes.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Outcomes:</span>
          </div>
          {item.outcomes.slice(0, 2).map((outcome, index) => (
            <div key={index} className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 mb-1">
              {outcome}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-slate-400">+{item.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center space-x-1">
          {item.status !== 'DONE' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(item);
              }}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
              title="Mark complete"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit item"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Delete item"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function WeeklyReviewScrumPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviewItems, setReviewItems] = useState<WeeklyReviewSprintItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WeeklyReviewSprintItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const [newItem, setNewItem] = useState<{
    title: string;
    description: string;
    gtdCategory: 'COLLECT' | 'PROCESS' | 'ORGANIZE' | 'REFLECT' | 'ENGAGE';
    gtdPhase: 'COLLECT' | 'CLARIFY' | 'ORGANIZE' | 'REFLECT' | 'ENGAGE';
    itemType: 'TASK' | 'PROJECT' | 'AREA' | 'CONTEXT' | 'REFERENCE' | 'SOMEDAY_MAYBE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    energy: 'LOW' | 'MEDIUM' | 'HIGH' | 'CREATIVE';
    context: string;
    estimatedTime: number;
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
    weeklyGoal: string;
    tags: string[];
    dueDate: string;
    reviewNotes: string;
    blockers: string[];
    outcomes: string[];
  }>({
    title: '',
    description: '',
    gtdCategory: 'COLLECT',
    gtdPhase: 'CLARIFY',
    itemType: 'TASK',
    priority: 'MEDIUM',
    energy: 'MEDIUM',
    context: '@computer',
    estimatedTime: 30,
    complexity: 'MODERATE',
    weeklyGoal: '',
    tags: [],
    dueDate: '',
    reviewNotes: '',
    blockers: [],
    outcomes: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadReviewData();
  }, [currentWeek]);

  const getWeekNumber = (date: Date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const loadReviewData = async () => {
    try {
      setLoading(true);

      // Mock data for demo - representing GTD weekly review as sprint
      setTimeout(() => {
        const weekNumber = getWeekNumber(currentWeek);

        const mockItems: WeeklyReviewSprintItem[] = [
          {
            id: '1',
            title: 'Process Inbox to Zero',
            description: 'Clear all items from physical and digital inboxes, clarify next actions',
            gtdCategory: 'PROCESS',
            gtdPhase: 'CLARIFY',
            itemType: 'TASK',
            priority: 'HIGH',
            energy: 'MEDIUM',
            context: '@computer',
            estimatedTime: 45,
            actualTime: 30,
            complexity: 'MODERATE',
            sprintPoints: 3,
            weeklyGoal: 'Achieve inbox zero by Wednesday',
            tags: ['gtd', 'inbox', 'weekly'],
            status: 'CURRENT_SPRINT',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '2',
            title: 'Review Project Lists',
            description: 'Go through all active projects and ensure each has a clear next action',
            gtdCategory: 'REFLECT',
            gtdPhase: 'REFLECT',
            itemType: 'PROJECT',
            priority: 'HIGH',
            energy: 'HIGH',
            context: '@review',
            estimatedTime: 60,
            actualTime: 60,
            complexity: 'COMPLEX',
            sprintPoints: 5,
            weeklyGoal: 'All projects have defined next actions',
            tags: ['projects', 'review', 'planning'],
            status: 'DONE',
            completedDate: new Date().toISOString(),
            reviewNotes: 'Found 3 projects that need clarification on outcomes',
            outcomes: ['Updated 12 project next actions', 'Archived 2 completed projects'],
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '3',
            title: 'Update Waiting For List',
            description: 'Review all items waiting for others and follow up as needed',
            gtdCategory: 'ORGANIZE',
            gtdPhase: 'ORGANIZE',
            itemType: 'CONTEXT',
            priority: 'MEDIUM',
            energy: 'LOW',
            context: '@calls',
            estimatedTime: 30,
            actualTime: 20,
            complexity: 'SIMPLE',
            sprintPoints: 1,
            tags: ['waiting-for', 'follow-up'],
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '4',
            title: 'Review Someday/Maybe Lists',
            description: 'Check if any someday items are now actionable',
            gtdCategory: 'REFLECT',
            gtdPhase: 'REFLECT',
            itemType: 'SOMEDAY_MAYBE',
            priority: 'LOW',
            energy: 'CREATIVE',
            context: '@anywhere',
            estimatedTime: 20,
            complexity: 'SIMPLE',
            sprintPoints: 1,
            weeklyGoal: 'Activate 2-3 someday items',
            tags: ['someday', 'creative', 'planning'],
            status: 'REVIEW',
            reviewNotes: 'Several items ready to become projects',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '5',
            title: 'Plan Next Week Priorities',
            description: 'Set focus areas and key objectives for upcoming week',
            gtdCategory: 'ORGANIZE',
            gtdPhase: 'ORGANIZE',
            itemType: 'AREA',
            priority: 'HIGH',
            energy: 'HIGH',
            context: '@planning',
            estimatedTime: 40,
            complexity: 'MODERATE',
            sprintPoints: 3,
            weeklyGoal: 'Define 3 key areas of focus',
            tags: ['planning', 'priorities', 'weekly'],
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'DEFERRED',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '6',
            title: 'Brainstorm Creative Projects',
            description: 'Generate new ideas for creative side projects',
            gtdCategory: 'COLLECT',
            gtdPhase: 'COLLECT',
            itemType: 'SOMEDAY_MAYBE',
            priority: 'LOW',
            energy: 'CREATIVE',
            context: '@creative',
            estimatedTime: 25,
            complexity: 'SIMPLE',
            sprintPoints: 1,
            tags: ['creative', 'brainstorm', 'inspiration'],
            status: 'SOMEDAY',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
          {
            id: '7',
            title: 'Digital File Organization',
            description: 'Organize desktop files and digital references',
            gtdCategory: 'ORGANIZE',
            gtdPhase: 'ORGANIZE',
            itemType: 'REFERENCE',
            priority: 'MEDIUM',
            energy: 'LOW',
            context: '@computer',
            estimatedTime: 35,
            complexity: 'MODERATE',
            sprintPoints: 3,
            blockers: ['Need to install new file organization software'],
            tags: ['organization', 'digital', 'files'],
            status: 'BACKLOG',
            createdAt: new Date().toISOString(),
            weekNumber,
          },
        ];

        setReviewItems(mockItems);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error('Error loading review data:', error);
      toast.error('Failed to load weekly review data');
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

    const activeItem = reviewItems.find(item => item.id === active.id);
    if (!activeItem) return;

    const newStatus = over.id as WeeklyReviewSprintItem['status'];
    const targetColumn = REVIEW_COLUMNS.find(col => col.id === newStatus);

    // Check constraints for focused work (STREAMS principle)
    if (targetColumn?.maxItems) {
      const itemsInColumn = reviewItems.filter(item => item.status === newStatus);
      if (itemsInColumn.length >= targetColumn.maxItems && activeItem.status !== newStatus) {
        toast.error(`Focus limit reached for ${targetColumn.title} (max ${targetColumn.maxItems} - STREAMS principle)`);
        return;
      }
    }

    if (activeItem.status !== newStatus) {
      const updatedItems = reviewItems.map(item => {
        if (item.id === active.id) {
          const updates: Partial<WeeklyReviewSprintItem> = { status: newStatus };

          if (newStatus === 'DONE' && !item.completedDate) {
            updates.completedDate = new Date().toISOString();
            updates.actualTime = item.estimatedTime; // Default completion time
          }

          return { ...item, ...updates };
        }
        return item;
      });

      setReviewItems(updatedItems);
      toast.success(`Moved "${activeItem.title}" to ${targetColumn?.title || newStatus}`);
    }
  };

  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const complexityConfig = COMPLEXITY_CONFIG[newItem.complexity];
    const weekNumber = getWeekNumber(currentWeek);

    const item: WeeklyReviewSprintItem = {
      id: Date.now().toString(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      gtdCategory: newItem.gtdCategory,
      gtdPhase: newItem.gtdPhase,
      itemType: newItem.itemType,
      priority: newItem.priority,
      energy: newItem.energy,
      context: newItem.context,
      estimatedTime: newItem.estimatedTime,
      complexity: newItem.complexity,
      sprintPoints: complexityConfig.points,
      weeklyGoal: newItem.weeklyGoal || undefined,
      tags: newItem.tags,
      dueDate: newItem.dueDate || undefined,
      reviewNotes: newItem.reviewNotes || undefined,
      blockers: newItem.blockers.length > 0 ? newItem.blockers : undefined,
      outcomes: newItem.outcomes.length > 0 ? newItem.outcomes : undefined,
      status: 'BACKLOG',
      createdAt: new Date().toISOString(),
      weekNumber,
    };

    setReviewItems(prev => [...prev, item]);
    setNewItem({
      title: '',
      description: '',
      gtdCategory: 'COLLECT',
      gtdPhase: 'CLARIFY',
      itemType: 'TASK',
      priority: 'MEDIUM',
      energy: 'MEDIUM',
      context: '@computer',
      estimatedTime: 30,
      complexity: 'MODERATE',
      weeklyGoal: '',
      tags: [],
      dueDate: '',
      reviewNotes: '',
      blockers: [],
      outcomes: [],
    });
    setShowCreateModal(false);
    toast.success('Review item created!');
  };

  const handleEditItem = (item: WeeklyReviewSprintItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      gtdCategory: item.gtdCategory,
      gtdPhase: item.gtdPhase,
      itemType: item.itemType,
      priority: item.priority,
      energy: item.energy,
      context: item.context,
      estimatedTime: item.estimatedTime,
      complexity: item.complexity,
      weeklyGoal: item.weeklyGoal || '',
      tags: item.tags,
      dueDate: item.dueDate || '',
      reviewNotes: item.reviewNotes || '',
      blockers: item.blockers || [],
      outcomes: item.outcomes || [],
    });
    setShowCreateModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const complexityConfig = COMPLEXITY_CONFIG[newItem.complexity];

    const updatedItems = reviewItems.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          title: newItem.title.trim(),
          description: newItem.description.trim(),
          gtdCategory: newItem.gtdCategory,
          gtdPhase: newItem.gtdPhase,
          itemType: newItem.itemType,
          priority: newItem.priority,
          energy: newItem.energy,
          context: newItem.context,
          estimatedTime: newItem.estimatedTime,
          complexity: newItem.complexity,
          sprintPoints: complexityConfig.points,
          weeklyGoal: newItem.weeklyGoal || undefined,
          tags: newItem.tags,
          dueDate: newItem.dueDate || undefined,
          reviewNotes: newItem.reviewNotes || undefined,
          blockers: newItem.blockers.length > 0 ? newItem.blockers : undefined,
          outcomes: newItem.outcomes.length > 0 ? newItem.outcomes : undefined,
        };
      }
      return item;
    });

    setReviewItems(updatedItems);
    setEditingItem(null);
    setNewItem({
      title: '',
      description: '',
      gtdCategory: 'COLLECT',
      gtdPhase: 'CLARIFY',
      itemType: 'TASK',
      priority: 'MEDIUM',
      energy: 'MEDIUM',
      context: '@computer',
      estimatedTime: 30,
      complexity: 'MODERATE',
      weeklyGoal: '',
      tags: [],
      dueDate: '',
      reviewNotes: '',
      blockers: [],
      outcomes: [],
    });
    setShowCreateModal(false);
    toast.success('Review item updated!');
  };

  const handleDeleteItem = (id: string) => {
    const item = reviewItems.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete "${item?.title}"?`)) {
      setReviewItems(prev => prev.filter(item => item.id !== id));
      toast.success('Review item deleted');
    }
  };

  const handleCompleteItem = (item: WeeklyReviewSprintItem) => {
    const updatedItems = reviewItems.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: 'DONE' as const,
          completedDate: new Date().toISOString(),
          actualTime: i.actualTime || i.estimatedTime,
        };
      }
      return i;
    });

    setReviewItems(updatedItems);
    toast.success(`Completed: ${item.title}`);
  };

  const getColumnItems = (status: string) => {
    return reviewItems.filter(item => item.status === status);
  };

  const getReviewStats = () => {
    const totalItems = reviewItems.length;
    const completedItems = reviewItems.filter(item => item.status === 'DONE').length;
    const inProgressItems = reviewItems.filter(item => item.status === 'IN_PROGRESS').length;
    const deferredItems = reviewItems.filter(item => item.status === 'DEFERRED').length;
    const totalPoints = reviewItems.reduce((sum, item) => sum + item.sprintPoints, 0);
    const completedPoints = reviewItems
      .filter(item => item.status === 'DONE')
      .reduce((sum, item) => sum + item.sprintPoints, 0);

    const currentSprintItems = reviewItems.filter(item => item.status === 'CURRENT_SPRINT').length;

    return {
      totalItems,
      completedItems,
      inProgressItems,
      deferredItems,
      currentSprintItems,
      totalPoints,
      completedPoints,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      sprintProgress: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
    };
  };

  const stats = getReviewStats();
  const weekNumber = getWeekNumber(currentWeek);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Weekly Review Sprint"
        subtitle={`Przeglad tygodniowy jako sprint (Tydzien ${weekNumber})`}
        icon={BarChart3}
        iconColor="text-indigo-600"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard/reviews/weekly')}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4 inline mr-1" />
              Powrot
            </button>
            <button
              onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Poprzedni tydzien
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {currentWeek.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <button
              onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Nastepny tydzien
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Dodaj element
            </button>
          </div>
        }
      />

      {/* Sprint Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total Items', value: stats.totalItems, icon: BarChart3, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Sprint Items', value: stats.currentSprintItems, icon: FlaskConical, bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'In Progress', value: stats.inProgressItems, icon: Play, bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Completed', value: stats.completedItems, icon: CheckCircle2, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
          { label: 'Deferred', value: stats.deferredItems, icon: Clock, bgColor: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
          { label: 'Points', value: `${stats.completedPoints}/${stats.totalPoints}`, icon: Flame, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
          { label: 'Progress', value: `${stats.completionRate}%`, icon: Lightbulb, bgColor: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <div className="flex items-center">
              <div className={`p-2 ${metric.bgColor} rounded-lg`}>
                <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Phases Overview */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 mt-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Fazy Workflow</h3>
        <div className="grid grid-cols-5 gap-4">
          {GTD_CATEGORIES.map((category) => {
            const itemsInPhase = reviewItems.filter(item => item.gtdCategory === category.id).length;
            return (
              <div key={category.id} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-white"
                  style={{ backgroundColor: category.color + '40' }}
                >
                  {category.icon}
                </div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{category.name}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{category.description}</p>
                <span className="text-lg font-bold" style={{ color: category.color }}>
                  {itemsInPhase}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sprint Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[600px] mt-6">
          {REVIEW_COLUMNS.map((column) => {
            const columnItems = getColumnItems(column.id);

            return (
              <div key={column.id} className="flex flex-col">
                <div
                  className="rounded-lg p-4 mb-4 border-l-4"
                  style={{
                    backgroundColor: column.bgColor,
                    borderLeftColor: column.color
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span style={{ color: column.color }}>{column.icon}</span>
                      <h3 className="font-semibold text-slate-900 text-sm">{column.title}</h3>
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
                  <p className="text-xs text-slate-600">{column.description}</p>
                  {column.gtdPhase && (
                    <p className="text-xs text-slate-500 mt-1">
                      Faza: {column.gtdPhase}
                    </p>
                  )}
                  {column.maxItems && (
                    <p className="text-xs text-slate-500 mt-1">
                      Focus: max {column.maxItems}
                    </p>
                  )}
                </div>

                <SortableContext items={columnItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 space-y-3 min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                    {columnItems.map((item) => (
                      <SortableReviewItem
                        key={item.id}
                        item={item}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onComplete={handleCompleteItem}
                      />
                    ))}
                    {columnItems.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                        Drop review items here
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
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg transform rotate-3">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {reviewItems.find(item => item.id === activeId)?.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingItem ? 'Edytuj element' : 'Utworz element'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="np. Process inbox to zero"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Szczegolowy opis aktywnosci"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={newItem.gtdCategory}
                    onChange={(e) => setNewItem({ ...newItem, gtdCategory: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {GTD_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Typ elementu
                  </label>
                  <select
                    value={newItem.itemType}
                    onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Poziom energii
                  </label>
                  <select
                    value={newItem.energy}
                    onChange={(e) => setNewItem({ ...newItem, energy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {ENERGY_LEVELS.map((energy) => (
                      <option key={energy.id} value={energy.id}>
                        {energy.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kontekst
                  </label>
                  <input
                    type="text"
                    value={newItem.context}
                    onChange={(e) => setNewItem({ ...newItem, context: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="@computer, @calls, @anywhere"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Szacowany czas (minuty)
                  </label>
                  <input
                    type="number"
                    value={newItem.estimatedTime}
                    onChange={(e) => setNewItem({ ...newItem, estimatedTime: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="240"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Zlozonosc
                  </label>
                  <select
                    value={newItem.complexity}
                    onChange={(e) => setNewItem({ ...newItem, complexity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.entries(COMPLEXITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label} ({config.points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cel tygodniowy (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={newItem.weeklyGoal}
                  onChange={(e) => setNewItem({ ...newItem, weeklyGoal: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Co chcesz osiagnac w tym tygodniu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Termin (opcjonalnie)
                </label>
                <input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tagi (oddzielone przecinkiem)
                </label>
                <input
                  type="text"
                  value={newItem.tags.join(', ')}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="gtd, weekly, review, planning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notatki z przegladu (opcjonalnie)
                </label>
                <textarea
                  value={newItem.reviewNotes}
                  onChange={(e) => setNewItem({ ...newItem, reviewNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Notatki z sesji przegladu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Blokery (jedna na linie)
                </label>
                <textarea
                  value={newItem.blockers.join('\n')}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    blockers: e.target.value.split('\n').map(blocker => blocker.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Lista przeszkod uniemozliwiajacych ukonczenie..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                className="btn btn-outline flex-1"
              >
                Anuluj
              </button>
              <button
                onClick={editingItem ? handleSaveEdit : handleCreateItem}
                className="btn btn-primary flex-1"
                disabled={!newItem.title.trim()}
              >
                {editingItem ? 'Zaktualizuj' : 'Utworz'} element
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
