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
  PlayIcon,
  CheckCircleIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  FireIcon,
  LightBulbIcon,
  CogIcon,
  UsersIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

interface StreamSprintItem {
  id: string;
  title: string;
  description: string;
  streamId: string;
  streamName: string;
  streamType: 'WORKSPACE' | 'PROJECT' | 'AREA' | 'CONTEXT' | 'CUSTOM';
  gtdRole: 'INBOX' | 'NEXT_ACTIONS' | 'WAITING_FOR' | 'SOMEDAY_MAYBE' | 'PROJECTS' | 'CONTEXTS' | 'AREAS' | 'REFERENCE' | 'CUSTOM';
  assignedTo?: string;
  assignedToName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'EPIC';
  estimatedHours: number;
  actualHours?: number;
  sprintPoints: number;
  tags: string[];
  dueDate?: string;
  status: 'BACKLOG' | 'SPRINT_READY' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE' | 'BLOCKED';
  blockers?: string[];
  notes?: string;
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
  wipLimit?: number;
}

const SCRUM_COLUMNS: ScrumColumn[] = [
  {
    id: 'BACKLOG',
    title: 'Product Backlog',
    description: 'All user stories and requirements',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    icon: '📋',
  },
  {
    id: 'SPRINT_READY',
    title: 'Sprint Ready',
    description: 'Items ready for sprint planning',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '🚀',
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    description: 'Actively being worked on',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '⚡',
    wipLimit: 3, // WIP limit for agile teams
  },
  {
    id: 'REVIEW',
    title: 'Code Review',
    description: 'Awaiting peer review',
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    icon: '👁️',
    wipLimit: 2,
  },
  {
    id: 'TESTING',
    title: 'Testing',
    description: 'QA and testing phase',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: '🧪',
  },
  {
    id: 'DONE',
    title: 'Done',
    description: 'Completed and deployed',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: '✅',
  },
  {
    id: 'BLOCKED',
    title: 'Blocked',
    description: 'Impediments preventing progress',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '🚫',
  },
];

const GTD_ROLES = [
  { id: 'INBOX', name: 'Inbox', icon: '📥', color: '#EF4444' },
  { id: 'NEXT_ACTIONS', name: 'Next Actions', icon: '✅', color: '#10B981' },
  { id: 'WAITING_FOR', name: 'Waiting For', icon: '⏳', color: '#F59E0B' },
  { id: 'PROJECTS', name: 'Projects', icon: '📁', color: '#3B82F6' },
  { id: 'SOMEDAY_MAYBE', name: 'Someday/Maybe', icon: '💡', color: '#8B5CF6' },
  { id: 'CONTEXTS', name: 'Contexts', icon: '🎯', color: '#6366F1' },
  { id: 'AREAS', name: 'Areas', icon: '🏞️', color: '#059669' },
];

const PRIORITY_CONFIG = {
  LOW: { color: '#6B7280', bg: '#F9FAFB', label: 'Low', icon: '🟢' },
  MEDIUM: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium', icon: '🟡' },
  HIGH: { color: '#EF4444', bg: '#FEF2F2', label: 'High', icon: '🟠' },
  URGENT: { color: '#DC2626', bg: '#FEE2E2', label: 'Urgent', icon: '🔴' },
};

const COMPLEXITY_CONFIG = {
  SIMPLE: { points: 1, color: '#10B981', label: 'Simple' },
  MEDIUM: { points: 3, color: '#F59E0B', label: 'Medium' },
  COMPLEX: { points: 8, color: '#EF4444', label: 'Complex' },
  EPIC: { points: 20, color: '#8B5CF6', label: 'Epic' },
};

interface SortableSprintItemProps {
  item: StreamSprintItem;
  onEdit: (item: StreamSprintItem) => void;
  onDelete: (id: string) => void;
  onStart: (item: StreamSprintItem) => void;
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

  const gtdRole = GTD_ROLES.find(role => role.id === item.gtdRole);
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const complexityConfig = COMPLEXITY_CONFIG[item.complexity];

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
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: gtdRole?.color }}
            title={gtdRole?.name}
          >
            {gtdRole?.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
            <p className="text-xs text-gray-500">{item.streamName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs">{priorityConfig.icon}</span>
          <span className="text-xs font-medium text-gray-600">
            {complexityConfig.points}pt
          </span>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Assignee */}
      {item.assignedToName && (
        <div className="flex items-center space-x-2 mb-2">
          <UsersIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{item.assignedToName}</span>
        </div>
      )}

      {/* Progress & Time */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {item.actualHours ? `${item.actualHours}h / ${item.estimatedHours}h` : `${item.estimatedHours}h`}
          </div>
          {item.dueDate && (
            <div className="flex items-center">
              📅 {new Date(item.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Blockers */}
      {item.blockers && item.blockers.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-1">
            <XMarkIcon className="w-3 h-3 text-red-500" />
            <span className="text-xs font-medium text-red-600">Blockers:</span>
          </div>
          {item.blockers.slice(0, 2).map((blocker, index) => (
            <div key={index} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-1">
              {blocker}
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
          {item.status === 'SPRINT_READY' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart(item);
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Start working"
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

export default function StreamsScrumPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sprintItems, setSprintItems] = useState<StreamSprintItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StreamSprintItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    streamId: '',
    streamName: '',
    streamType: 'PROJECT' as 'PROJECT' | 'CUSTOM' | 'WORKSPACE' | 'AREA' | 'CONTEXT',
    gtdRole: 'NEXT_ACTIONS' as 'INBOX' | 'CUSTOM' | 'REFERENCE' | 'PROJECTS' | 'NEXT_ACTIONS' | 'WAITING_FOR' | 'SOMEDAY_MAYBE' | 'CONTEXTS' | 'AREAS',
    assignedTo: '',
    assignedToName: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT',
    complexity: 'MEDIUM' as 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'EPIC',
    estimatedHours: 4,
    sprintPoints: 3,
    tags: [] as string[],
    dueDate: '',
    blockers: [] as string[],
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
      
      // Mock data for demo - representing different streams as agile teams
      setTimeout(() => {
        const mockItems: StreamSprintItem[] = [
          {
            id: '1',
            title: 'User Authentication System',
            description: 'Implement secure login and registration flow with JWT tokens',
            streamId: 'auth-stream',
            streamName: 'Authentication Team',
            streamType: 'PROJECT',
            gtdRole: 'NEXT_ACTIONS',
            assignedTo: 'dev1',
            assignedToName: 'Anna Kowalska',
            priority: 'HIGH',
            complexity: 'COMPLEX',
            estimatedHours: 16,
            sprintPoints: 8,
            tags: ['security', 'backend', 'frontend'],
            dueDate: '2024-02-20',
            status: 'BACKLOG',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Dashboard UI Components',
            description: 'Create reusable React components for main dashboard',
            streamId: 'ui-stream',
            streamName: 'Frontend Team',
            streamType: 'PROJECT',
            gtdRole: 'PROJECTS',
            assignedTo: 'dev2',
            assignedToName: 'Tomasz Nowak',
            priority: 'MEDIUM',
            complexity: 'MEDIUM',
            estimatedHours: 12,
            actualHours: 8,
            sprintPoints: 5,
            tags: ['react', 'ui', 'components'],
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'API Documentation',
            description: 'Complete OpenAPI documentation for all endpoints',
            streamId: 'docs-stream',
            streamName: 'Documentation Team',
            streamType: 'AREA',
            gtdRole: 'WAITING_FOR',
            assignedTo: 'dev3',
            assignedToName: 'Marcin Wiśniewski',
            priority: 'LOW',
            complexity: 'SIMPLE',
            estimatedHours: 6,
            actualHours: 6,
            sprintPoints: 2,
            tags: ['docs', 'api'],
            status: 'REVIEW',
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            title: 'Database Migration Scripts',
            description: 'Create migration scripts for production deployment',
            streamId: 'devops-stream',
            streamName: 'DevOps Team',
            streamType: 'PROJECT',
            gtdRole: 'NEXT_ACTIONS',
            assignedTo: 'dev4',
            assignedToName: 'Katarzyna Zielińska',
            priority: 'URGENT',
            complexity: 'COMPLEX',
            estimatedHours: 8,
            actualHours: 8,
            sprintPoints: 5,
            tags: ['database', 'migration', 'devops'],
            status: 'DONE',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '5',
            title: 'Performance Testing',
            description: 'Load testing for API endpoints under high traffic',
            streamId: 'qa-stream',
            streamName: 'QA Team',
            streamType: 'PROJECT',
            gtdRole: 'PROJECTS',
            assignedTo: 'dev5',
            assignedToName: 'Piotr Kowalczyk',
            priority: 'MEDIUM',
            complexity: 'MEDIUM',
            estimatedHours: 10,
            sprintPoints: 5,
            tags: ['testing', 'performance'],
            status: 'SPRINT_READY',
            createdAt: new Date().toISOString(),
          },
          {
            id: '6',
            title: 'Third-party Integration',
            description: 'Integration with external payment provider blocked by API access',
            streamId: 'integration-stream',
            streamName: 'Integration Team',
            streamType: 'PROJECT',
            gtdRole: 'WAITING_FOR',
            priority: 'HIGH',
            complexity: 'COMPLEX',
            estimatedHours: 20,
            sprintPoints: 13,
            tags: ['integration', 'payments'],
            blockers: ['Waiting for API access from vendor', 'Legal approval pending'],
            status: 'BLOCKED',
            createdAt: new Date().toISOString(),
          },
        ];

        setSprintItems(mockItems);
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error('Error loading sprint data:', error);
      toast.error('Failed to load sprint data');
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

    const newStatus = over.id as StreamSprintItem['status'];
    const targetColumn = SCRUM_COLUMNS.find(col => col.id === newStatus);
    
    // Check WIP limits
    if (targetColumn?.wipLimit) {
      const itemsInColumn = sprintItems.filter(item => item.status === newStatus);
      if (itemsInColumn.length >= targetColumn.wipLimit && activeItem.status !== newStatus) {
        toast.error(`WIP limit reached for ${targetColumn.title} (max ${targetColumn.wipLimit})`);
        return;
      }
    }

    if (activeItem.status !== newStatus) {
      const updatedItems = sprintItems.map(item => {
        if (item.id === active.id) {
          const updates: Partial<StreamSprintItem> = { status: newStatus };
          
          if (newStatus === 'IN_PROGRESS' && !item.startedAt) {
            updates.startedAt = new Date().toISOString();
          }
          
          if (newStatus === 'DONE' && !item.completedAt) {
            updates.completedAt = new Date().toISOString();
            updates.actualHours = item.estimatedHours; // Default to estimated if not tracked
          }

          return { ...item, ...updates };
        }
        return item;
      });

      setSprintItems(updatedItems);
      toast.success(`Moved "${activeItem.title}" to ${targetColumn?.title || newStatus}`);
    }
  };

  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const complexityConfig = COMPLEXITY_CONFIG[newItem.complexity];
    
    const item: StreamSprintItem = {
      id: Date.now().toString(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      streamId: newItem.streamId || 'default-stream',
      streamName: newItem.streamName || 'Default Team',
      streamType: newItem.streamType,
      gtdRole: newItem.gtdRole,
      assignedTo: newItem.assignedTo || undefined,
      assignedToName: newItem.assignedToName || undefined,
      priority: newItem.priority,
      complexity: newItem.complexity,
      estimatedHours: newItem.estimatedHours,
      sprintPoints: complexityConfig.points,
      tags: newItem.tags,
      dueDate: newItem.dueDate || undefined,
      blockers: newItem.blockers.length > 0 ? newItem.blockers : undefined,
      notes: newItem.notes || undefined,
      status: 'BACKLOG',
      createdAt: new Date().toISOString(),
    };

    setSprintItems(prev => [...prev, item]);
    setNewItem({
      title: '',
      description: '',
      streamId: '',
      streamName: '',
      streamType: 'PROJECT',
      gtdRole: 'NEXT_ACTIONS',
      assignedTo: '',
      assignedToName: '',
      priority: 'MEDIUM',
      complexity: 'MEDIUM',
      estimatedHours: 4,
      sprintPoints: 3,
      tags: [],
      dueDate: '',
      blockers: [],
      notes: '',
    });
    setShowCreateModal(false);
    toast.success('Sprint item created!');
  };

  const handleEditItem = (item: StreamSprintItem) => {
    setEditingItem(item);
    setNewItem({
      title: item.title,
      description: item.description,
      streamId: item.streamId,
      streamName: item.streamName,
      streamType: item.streamType,
      gtdRole: item.gtdRole,
      assignedTo: item.assignedTo || '',
      assignedToName: item.assignedToName || '',
      priority: item.priority,
      complexity: item.complexity,
      estimatedHours: item.estimatedHours,
      sprintPoints: item.sprintPoints,
      tags: item.tags,
      dueDate: item.dueDate || '',
      blockers: item.blockers || [],
      notes: item.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !newItem.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const complexityConfig = COMPLEXITY_CONFIG[newItem.complexity];

    const updatedItems = sprintItems.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          title: newItem.title.trim(),
          description: newItem.description.trim(),
          streamId: newItem.streamId,
          streamName: newItem.streamName,
          streamType: newItem.streamType,
          gtdRole: newItem.gtdRole,
          assignedTo: newItem.assignedTo || undefined,
          assignedToName: newItem.assignedToName || undefined,
          priority: newItem.priority,
          complexity: newItem.complexity,
          estimatedHours: newItem.estimatedHours,
          sprintPoints: complexityConfig.points,
          tags: newItem.tags,
          dueDate: newItem.dueDate || undefined,
          blockers: newItem.blockers.length > 0 ? newItem.blockers : undefined,
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
      streamId: '',
      streamName: '',
      streamType: 'PROJECT',
      gtdRole: 'NEXT_ACTIONS',
      assignedTo: '',
      assignedToName: '',
      priority: 'MEDIUM',
      complexity: 'MEDIUM',
      estimatedHours: 4,
      sprintPoints: 3,
      tags: [],
      dueDate: '',
      blockers: [],
      notes: '',
    });
    setShowCreateModal(false);
    toast.success('Sprint item updated!');
  };

  const handleDeleteItem = (id: string) => {
    const item = sprintItems.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete "${item?.title}"?`)) {
      setSprintItems(prev => prev.filter(item => item.id !== id));
      toast.success('Sprint item deleted');
    }
  };

  const handleStartWork = (item: StreamSprintItem) => {
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
    toast.success(`Started working on: ${item.title}`);
  };

  const getColumnItems = (status: string) => {
    return sprintItems.filter(item => item.status === status);
  };

  const getSprintStats = () => {
    const totalItems = sprintItems.length;
    const completedItems = sprintItems.filter(item => item.status === 'DONE').length;
    const inProgressItems = sprintItems.filter(item => item.status === 'IN_PROGRESS').length;
    const blockedItems = sprintItems.filter(item => item.status === 'BLOCKED').length;
    const totalPoints = sprintItems.reduce((sum, item) => sum + item.sprintPoints, 0);
    const completedPoints = sprintItems
      .filter(item => item.status === 'DONE')
      .reduce((sum, item) => sum + item.sprintPoints, 0);
    
    return {
      totalItems,
      completedItems,
      inProgressItems,
      blockedItems,
      totalPoints,
      completedPoints,
      velocity: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
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
              onClick={() => router.push('/crm/dashboard/gtd-streams')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Streams Scrum Board</h1>
              <p className="text-gray-600">Agile development workflow for GTD streams</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User Story
        </button>
      </div>

      {/* Sprint Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CogIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Stories</p>
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
              <p className="text-sm font-medium text-gray-600">Story Points</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completedPoints}/{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <LightBulbIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Velocity</p>
              <p className="text-xl font-semibold text-gray-900">{stats.velocity}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrum Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[600px]">
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
                      <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
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
                  <p className="text-xs text-gray-600">{column.description}</p>
                  {column.wipLimit && (
                    <p className="text-xs text-gray-500 mt-1">
                      WIP: {columnItems.length}/{column.wipLimit}
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
                        onStart={handleStartWork}
                      />
                    ))}
                    {columnItems.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        Drop stories here
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Edit User Story' : 'Create User Story'}
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
                  User Story Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="As a user, I want to..."
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
                  placeholder="Detailed description of the user story and acceptance criteria"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stream/Team
                  </label>
                  <input
                    type="text"
                    value={newItem.streamName}
                    onChange={(e) => setNewItem({ ...newItem, streamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Frontend Team"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GTD Role
                  </label>
                  <select
                    value={newItem.gtdRole}
                    onChange={(e) => setNewItem({ ...newItem, gtdRole: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {GTD_ROLES.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.icon} {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complexity
                  </label>
                  <select
                    value={newItem.complexity}
                    onChange={(e) => setNewItem({ ...newItem, complexity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.entries(COMPLEXITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label} ({config.points} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={newItem.estimatedHours}
                    onChange={(e) => setNewItem({ ...newItem, estimatedHours: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={newItem.assignedToName}
                    onChange={(e) => setNewItem({ ...newItem, assignedToName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Developer name"
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
                  placeholder="frontend, api, testing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blockers (one per line)
                </label>
                <textarea
                  value={newItem.blockers.join('\n')}
                  onChange={(e) => setNewItem({ 
                    ...newItem, 
                    blockers: e.target.value.split('\n').map(blocker => blocker.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="List any blockers preventing progress..."
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
                {editingItem ? 'Update' : 'Create'} Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}