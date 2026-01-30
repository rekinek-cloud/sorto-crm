'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  PlusIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  FireIcon,
  LightBulbIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

interface FocusSprintItem {
  id: string;
  title: string;
  description: string;
  modeType: 'POMODORO' | 'DEEP_WORK' | 'SPRINT' | 'CREATIVE_FLOW';
  modeIcon: string;
  modeColor: string;
  duration: number; // in minutes
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
  icon: string;
  maxItems?: number;
}

const SCRUM_COLUMNS: ScrumColumn[] = [
  {
    id: 'TO_DO',
    title: 'To Do',
    description: 'Focus sessions ready to start',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    icon: '📋',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    description: 'Currently active focus sessions',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '⚡',
    maxItems: 1, // Only one active session at a time
  },
  {
    id: 'REVIEW',
    title: 'Review',
    description: 'Sessions needing evaluation',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '🔍',
  },
  {
    id: 'DONE',
    title: 'Done',
    description: 'Completed focus sessions',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: '✅',
  },
  {
    id: 'BLOCKED',
    title: 'Blocked',
    description: 'Sessions with obstacles',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: '🚫',
  },
];

const FOCUS_MODE_TYPES = [
  { id: 'POMODORO', name: 'Pomodoro', icon: '🍅', color: '#EF4444', duration: 25 },
  { id: 'DEEP_WORK', name: 'Deep Work', icon: '🧠', color: '#3B82F6', duration: 90 },
  { id: 'SPRINT', name: 'Sprint', icon: '⚡', color: '#10B981', duration: 15 },
  { id: 'CREATIVE_FLOW', name: 'Creative Flow', icon: '🎨', color: '#8B5CF6', duration: 50 },
];

const PRIORITY_CONFIG = {
  LOW: { color: '#6B7280', bg: '#F9FAFB', label: 'Low' },
  MEDIUM: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium' },
  HIGH: { color: '#EF4444', bg: '#FEF2F2', label: 'High' },
  URGENT: { color: '#DC2626', bg: '#FEE2E2', label: 'Urgent' },
};

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
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: modeType?.color }}
          >
            {modeType?.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
            <p className="text-xs text-gray-500">{modeType?.name}</p>
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
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Sessions Progress</span>
          <span className="text-xs font-medium text-gray-900">
            {item.completedSessions}/{item.estimatedSessions}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
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
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center">
          <ClockIcon className="w-3 h-3 mr-1" />
          {item.duration} min
        </div>
        {item.dueDate && (
          <div className="flex items-center">
            📅 {new Date(item.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          {item.status === 'TO_DO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart(item);
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Start session"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit item"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete item"
        >
          <XMarkIcon className="w-4 h-4" />
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
      
      // Mock data for demo
      setTimeout(() => {
        const mockItems: FocusSprintItem[] = [
          {
            id: '1',
            title: 'Complete Project Proposal',
            description: 'Focus on writing and structuring the Q4 project proposal document',
            modeType: 'DEEP_WORK',
            modeIcon: '🧠',
            modeColor: '#3B82F6',
            duration: 90,
            estimatedSessions: 2,
            completedSessions: 0,
            priority: 'HIGH',
            tags: ['writing', 'strategic'],
            dueDate: '2024-02-15',
            status: 'TO_DO',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Code Review Sprint',
            description: 'Review pending pull requests and provide feedback',
            modeType: 'POMODORO',
            modeIcon: '🍅',
            modeColor: '#EF4444',
            duration: 25,
            estimatedSessions: 4,
            completedSessions: 2,
            priority: 'MEDIUM',
            tags: ['code', 'review'],
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'Design System Updates',
            description: 'Creative session for updating UI components and design tokens',
            modeType: 'CREATIVE_FLOW',
            modeIcon: '🎨',
            modeColor: '#8B5CF6',
            duration: 50,
            estimatedSessions: 3,
            completedSessions: 3,
            priority: 'LOW',
            tags: ['design', 'ui', 'creative'],
            status: 'REVIEW',
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Bug Fixes Sprint',
            description: 'Quick sprint to resolve critical bugs',
            modeType: 'SPRINT',
            modeIcon: '⚡',
            modeColor: '#10B981',
            duration: 15,
            estimatedSessions: 6,
            completedSessions: 6,
            priority: 'URGENT',
            tags: ['bugs', 'urgent'],
            status: 'DONE',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '5',
            title: 'Research & Analysis',
            description: 'Market research blocked by missing access credentials',
            modeType: 'DEEP_WORK',
            modeIcon: '🧠',
            modeColor: '#3B82F6',
            duration: 90,
            estimatedSessions: 2,
            completedSessions: 0,
            priority: 'MEDIUM',
            tags: ['research', 'blocked'],
            status: 'BLOCKED',
            createdAt: new Date().toISOString(),
          },
        ];

        setSprintItems(mockItems);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error('Error loading sprint data:', error);
      toast.error('Failed to load focus sprint data');
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
    
    // Check constraints
    if (newStatus === 'IN_PROGRESS') {
      const activeProgressItems = sprintItems.filter(item => item.status === 'IN_PROGRESS');
      if (activeProgressItems.length >= 1 && activeItem.status !== 'IN_PROGRESS') {
        toast.error('Only one focus session can be in progress at a time');
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
      toast.success(`Moved "${activeItem.title}" to ${newStatus.replace('_', ' ').toLowerCase()}`);
    }
  };

  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const modeType = FOCUS_MODE_TYPES.find(mode => mode.id === newItem.modeType);
    
    const item: FocusSprintItem = {
      id: Date.now().toString(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      modeType: newItem.modeType,
      modeIcon: modeType?.icon || '🎯',
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
    toast.success('Focus sprint item created!');
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
      toast.error('Title is required');
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
          modeIcon: modeType?.icon || '🎯',
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
    toast.success('Focus sprint item updated!');
  };

  const handleDeleteItem = (id: string) => {
    const item = sprintItems.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete "${item?.title}"?`)) {
      setSprintItems(prev => prev.filter(item => item.id !== id));
      toast.success('Focus sprint item deleted');
    }
  };

  const handleStartSession = (item: FocusSprintItem) => {
    // Move to in progress and update started time
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
    toast.success(`Started focus session: ${item.title}`);
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/dashboard/gtd/focus-modes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Focus Modes Scrum Board</h1>
              <p className="text-gray-600">Manage focus sessions with agile methodology</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Focus Item
        </button>
      </div>

      {/* Sprint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CogIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <PlayIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-xl font-semibold text-gray-900">{stats.inProgressItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completedItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Blocked</p>
              <p className="text-xl font-semibold text-gray-900">{stats.blockedItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FireIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sessions</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <LightBulbIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Complete %</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completionRate}%</p>
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
                  className="rounded-lg p-4 mb-4 border-l-4"
                  style={{ 
                    backgroundColor: column.bgColor,
                    borderLeftColor: column.color
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{column.icon}</span>
                      <h3 className="font-semibold text-gray-900">{column.title}</h3>
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
                  <p className="text-sm text-gray-600">{column.description}</p>
                  {column.maxItems && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {column.maxItems} item{column.maxItems !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <SortableContext items={columnItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex-1 space-y-3 min-h-[400px] bg-gray-50 rounded-lg p-3">
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
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        Drop items here
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
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg transform rotate-3">
              <div className="font-semibold text-gray-900">
                {sprintItems.find(item => item.id === activeId)?.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Edit Focus Item' : 'Create Focus Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Complete project documentation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe what you'll focus on during this session"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Focus Mode Type
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {FOCUS_MODE_TYPES.map((mode) => (
                      <option key={mode.id} value={mode.id}>
                        {mode.icon} {mode.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newItem.duration}
                    onChange={(e) => setNewItem({ ...newItem, duration: parseInt(e.target.value) || 25 })}
                    min="5"
                    max="180"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Sessions
                  </label>
                  <input
                    type="number"
                    value={newItem.estimatedSessions}
                    onChange={(e) => setNewItem({ ...newItem, estimatedSessions: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newItem.dueDate}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newItem.tags.join(', ')}
                  onChange={(e) => setNewItem({ 
                    ...newItem, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="coding, urgent, creative"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleSaveEdit : handleCreateItem}
                className="btn btn-primary flex-1"
                disabled={!newItem.title.trim()}
              >
                {editingItem ? 'Update' : 'Create'} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}