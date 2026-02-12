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
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  Link,
  Maximize2,
  LayoutGrid,
  List,
  GitBranch,
} from 'lucide-react';

interface ProjectWBS {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  structure: WBSTaskNode[];
  dependencies: TaskDependency[];
  criticalPath: string[];
  projectStart: string;
  projectEnd: string;
  lastUpdated: string;
}

interface WBSTaskNode {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: 'PHASE' | 'WORK_PACKAGE' | 'TASK' | 'MILESTONE';
  level: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  duration: number;
  effort?: number;

  assignedTo: string[];
  requiredSkills: string[];

  progress: number;

  dependencies: string[];
  dependencyTypes: { [taskId: string]: DependencyType };

  deliverables: string[];
  acceptanceCriteria: string[];
  notes?: string;

  children: WBSTaskNode[];
  isExpanded?: boolean;
  isCriticalPath?: boolean;
}

interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lag: number;
  description?: string;
}

type DependencyType = 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';

interface SortableTaskNodeProps {
  node: WBSTaskNode;
  level: number;
  allNodes: WBSTaskNode[];
  dependencies: TaskDependency[];
  onToggleExpand: (id: string) => void;
  onEdit: (node: WBSTaskNode) => void;
  onDelete: (id: string) => void;
  onAddDependency: (fromId: string, toId: string, type: DependencyType) => void;
  onViewDetails: (node: WBSTaskNode) => void;
}

const SortableTaskNode: React.FC<SortableTaskNodeProps> = ({
  node,
  level,
  allNodes,
  dependencies,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddDependency,
  onViewDetails,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = (type: WBSTaskNode['type']) => {
    switch (type) {
      case 'PHASE': return <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'WORK_PACKAGE': return <List className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'TASK': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'MILESTONE': return <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default: return <CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusColor = (status: WBSTaskNode['status']) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700';
      case 'BLOCKED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const getPriorityColor = (priority: WBSTaskNode['priority']) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getDependencyTypeIcon = (type: DependencyType) => {
    switch (type) {
      case 'FINISH_TO_START': return '→';
      case 'START_TO_START': return '⇉';
      case 'FINISH_TO_FINISH': return '⇇';
      case 'START_TO_FINISH': return '↺';
      default: return '→';
    }
  };

  const taskDependencies = dependencies.filter(dep => dep.toTaskId === node.id);
  const dependentTasks = dependencies.filter(dep => dep.fromTaskId === node.id);

  const paddingLeft = level * 24;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`flex items-center p-4 bg-white/80 backdrop-blur-xl border rounded-2xl hover:shadow-sm transition-all ${
          node.isCriticalPath ? 'border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20' : 'border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30'
        }`}
        style={{ marginLeft: `${paddingLeft}px` }}
      >
        {/* Drag Handle */}
        <div {...listeners} className="mr-3 cursor-grab hover:cursor-grabbing">
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => onToggleExpand(node.id)}
          className="mr-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          disabled={node.children.length === 0}
        >
          {node.children.length > 0 ? (
            node.isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>

        {/* Critical Path Indicator */}
        {node.isCriticalPath && (
          <div className="mr-2 w-2 h-2 bg-red-500 rounded-full" title="Critical Path" />
        )}

        {/* Type Icon */}
        <div className="mr-3">
          {getTypeIcon(node.type)}
        </div>

        {/* WBS Code */}
        <div className="min-w-0 mr-3">
          <span className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
            {node.code}
          </span>
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {node.title}
                </h4>

                {/* Priority Indicator */}
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(node.priority)}`} title={node.priority} />

                {/* Status Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(node.status)}`}>
                  {node.status.replace('_', ' ')}
                </span>
              </div>

              {node.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                  {node.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mt-2 flex items-center space-x-2">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 min-w-0">{node.progress}%</span>
              </div>

              {/* Task Details */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                {/* Duration */}
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {node.duration}d
                </div>

                {/* Planned Dates */}
                {node.plannedStart && node.plannedEnd && (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(node.plannedStart).toLocaleDateString()} - {new Date(node.plannedEnd).toLocaleDateString()}
                  </div>
                )}

                {/* Assigned Users */}
                {node.assignedTo.length > 0 && (
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {node.assignedTo.length}
                  </div>
                )}

                {/* Dependencies Count */}
                {taskDependencies.length > 0 && (
                  <div className="flex items-center text-orange-600 dark:text-orange-400">
                    <Link className="w-3 h-3 mr-1" />
                    {taskDependencies.length} deps
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4">
              <button
                onClick={() => onViewDetails(node)}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                title="View Details"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={() => onEdit(node)}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                title="Edit Task"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => {/* Add dependency modal */}}
                className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                title="Add Dependency"
              >
                <Link className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(node.id)}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                title="Delete Task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Expanded Details */}
          {node.isExpanded && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs space-y-3">
              {/* Dependencies */}
              {taskDependencies.length > 0 && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Dependencies:</span>
                  <div className="mt-1 space-y-1">
                    {taskDependencies.map((dep) => {
                      const fromTask = allNodes.find(t => t.id === dep.fromTaskId);
                      return (
                        <div key={dep.id} className="flex items-center text-orange-700 dark:text-orange-400">
                          <span className="mr-2">{getDependencyTypeIcon(dep.type)}</span>
                          <span className="bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded">
                            {fromTask?.code} {fromTask?.title}
                          </span>
                          {dep.lag !== 0 && (
                            <span className="ml-2 text-slate-600 dark:text-slate-400">
                              ({dep.lag > 0 ? '+' : ''}{dep.lag}d)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dependent Tasks */}
              {dependentTasks.length > 0 && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Blocks:</span>
                  <div className="mt-1 space-y-1">
                    {dependentTasks.map((dep) => {
                      const toTask = allNodes.find(t => t.id === dep.toTaskId);
                      return (
                        <div key={dep.id} className="flex items-center text-blue-700 dark:text-blue-400">
                          <span className="mr-2">{getDependencyTypeIcon(dep.type)}</span>
                          <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">
                            {toTask?.code} {toTask?.title}
                          </span>
                          {dep.lag !== 0 && (
                            <span className="ml-2 text-slate-600 dark:text-slate-400">
                              ({dep.lag > 0 ? '+' : ''}{dep.lag}d)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {node.deliverables.length > 0 && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Deliverables:</span>
                  <ul className="mt-1 space-y-1">
                    {node.deliverables.map((deliverable, idx) => (
                      <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400 mr-1 flex-shrink-0" />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Acceptance Criteria */}
              {node.acceptanceCriteria.length > 0 && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Acceptance Criteria:</span>
                  <ul className="mt-1 space-y-1">
                    {node.acceptanceCriteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300">
                        <AlertTriangle className="w-3 h-3 text-yellow-600 dark:text-yellow-400 mr-1 flex-shrink-0" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Skills */}
              {node.requiredSkills.length > 0 && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Required Skills:</span>
                  <div className="mt-1">
                    {node.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded mr-1 mb-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {node.notes && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                  <span className="font-medium text-yellow-800 dark:text-yellow-300">Notes:</span>
                  <p className="text-yellow-700 dark:text-yellow-400 mt-1">{node.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WBSDependenciesPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWBS[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWBS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'wbs' | 'gantt' | 'network'>('wbs');
  const [draggedNode, setDraggedNode] = useState<WBSTaskNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<WBSTaskNode | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setTimeout(() => {
      const mockProjects: ProjectWBS[] = [
        {
          id: '1',
          projectId: 'proj-1',
          name: 'CRM Integration Project',
          description: 'Integration of new CRM system with existing infrastructure',
          status: 'ACTIVE',
          projectStart: '2024-07-01',
          projectEnd: '2024-10-15',
          lastUpdated: '2024-07-02',
          criticalPath: ['1.1', '1.2', '2.1', '2.3', '3.1'],
          dependencies: [
            {
              id: 'dep-1',
              fromTaskId: '1.1',
              toTaskId: '1.2',
              type: 'FINISH_TO_START',
              lag: 0,
              description: 'Requirements must be complete before design'
            },
            {
              id: 'dep-2',
              fromTaskId: '1.2',
              toTaskId: '2.1',
              type: 'FINISH_TO_START',
              lag: 2,
              description: 'Design review and approval needed'
            },
            {
              id: 'dep-3',
              fromTaskId: '2.1',
              toTaskId: '2.2',
              type: 'FINISH_TO_START',
              lag: 0
            },
            {
              id: 'dep-4',
              fromTaskId: '2.1',
              toTaskId: '2.3',
              type: 'START_TO_START',
              lag: 5,
              description: 'Backend can start after frontend scaffolding'
            },
            {
              id: 'dep-5',
              fromTaskId: '2.2',
              toTaskId: '3.1',
              type: 'FINISH_TO_START',
              lag: 0
            },
            {
              id: 'dep-6',
              fromTaskId: '2.3',
              toTaskId: '3.1',
              type: 'FINISH_TO_START',
              lag: 0
            }
          ],
          structure: [
            {
              id: '1.0',
              code: '1.0',
              title: 'Project Planning',
              type: 'PHASE',
              level: 0,
              status: 'COMPLETED',
              priority: 'HIGH',
              duration: 15,
              progress: 100,
              plannedStart: '2024-07-01',
              plannedEnd: '2024-07-15',
              actualStart: '2024-07-01',
              actualEnd: '2024-07-14',
              assignedTo: ['project-manager', 'business-analyst'],
              requiredSkills: ['Project Management', 'Business Analysis'],
              dependencies: [],
              dependencyTypes: {},
              deliverables: ['Project Charter', 'WBS', 'Schedule'],
              acceptanceCriteria: ['Stakeholder approval', 'Resource allocation confirmed'],
              isExpanded: true,
              isCriticalPath: true,
              children: [
                {
                  id: '1.1',
                  code: '1.1',
                  title: 'Requirements Gathering',
                  description: 'Gather and document detailed business requirements',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'COMPLETED',
                  priority: 'CRITICAL',
                  duration: 8,
                  effort: 64,
                  progress: 100,
                  plannedStart: '2024-07-01',
                  plannedEnd: '2024-07-08',
                  actualStart: '2024-07-01',
                  actualEnd: '2024-07-08',
                  assignedTo: ['business-analyst', 'stakeholder-1'],
                  requiredSkills: ['Requirements Analysis', 'Stakeholder Management'],
                  dependencies: [],
                  dependencyTypes: {},
                  deliverables: ['Requirements Document', 'Use Cases', 'Acceptance Criteria'],
                  acceptanceCriteria: ['100% stakeholder sign-off', 'Requirements traceability established'],
                  children: [],
                  isCriticalPath: true,
                  notes: 'Key stakeholders include Sales, Marketing, and Customer Service teams'
                },
                {
                  id: '1.2',
                  code: '1.2',
                  title: 'System Design',
                  description: 'Create technical architecture and system design',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'COMPLETED',
                  priority: 'HIGH',
                  duration: 7,
                  effort: 56,
                  progress: 100,
                  plannedStart: '2024-07-09',
                  plannedEnd: '2024-07-15',
                  actualStart: '2024-07-09',
                  actualEnd: '2024-07-14',
                  assignedTo: ['solution-architect', 'senior-developer'],
                  requiredSkills: ['System Architecture', 'Integration Design'],
                  dependencies: ['1.1'],
                  dependencyTypes: { '1.1': 'FINISH_TO_START' },
                  deliverables: ['Architecture Document', 'Integration Specifications', 'Database Design'],
                  acceptanceCriteria: ['Architecture review passed', 'Security approval obtained'],
                  children: [],
                  isCriticalPath: true
                }
              ]
            },
            {
              id: '2.0',
              code: '2.0',
              title: 'Development Phase',
              type: 'PHASE',
              level: 0,
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              duration: 45,
              progress: 35,
              plannedStart: '2024-07-17',
              plannedEnd: '2024-08-30',
              assignedTo: ['dev-team-lead', 'frontend-dev', 'backend-dev'],
              requiredSkills: ['Software Development', 'Testing'],
              dependencies: ['1.0'],
              dependencyTypes: { '1.0': 'FINISH_TO_START' },
              deliverables: ['Working Software', 'Unit Tests', 'Documentation'],
              acceptanceCriteria: ['All tests passing', 'Code review completed'],
              isExpanded: true,
              children: [
                {
                  id: '2.1',
                  code: '2.1',
                  title: 'Frontend Development',
                  description: 'Develop user interface and user experience components',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'IN_PROGRESS',
                  priority: 'HIGH',
                  duration: 20,
                  effort: 160,
                  progress: 60,
                  plannedStart: '2024-07-17',
                  plannedEnd: '2024-08-05',
                  assignedTo: ['frontend-dev-1', 'frontend-dev-2'],
                  requiredSkills: ['React', 'TypeScript', 'CSS'],
                  dependencies: ['1.2'],
                  dependencyTypes: { '1.2': 'FINISH_TO_START' },
                  deliverables: ['React Components', 'Responsive UI', 'Unit Tests'],
                  acceptanceCriteria: ['Cross-browser compatibility', 'Accessibility standards met'],
                  children: [],
                  isCriticalPath: true
                },
                {
                  id: '2.2',
                  code: '2.2',
                  title: 'API Integration',
                  description: 'Integrate with external CRM APIs and services',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'NOT_STARTED',
                  priority: 'MEDIUM',
                  duration: 15,
                  effort: 120,
                  progress: 0,
                  plannedStart: '2024-08-06',
                  plannedEnd: '2024-08-20',
                  assignedTo: ['integration-specialist'],
                  requiredSkills: ['API Integration', 'Authentication'],
                  dependencies: ['2.1'],
                  dependencyTypes: { '2.1': 'FINISH_TO_START' },
                  deliverables: ['API Connectors', 'Data Mapping', 'Error Handling'],
                  acceptanceCriteria: ['All endpoints tested', 'Rate limiting handled'],
                  children: []
                },
                {
                  id: '2.3',
                  code: '2.3',
                  title: 'Backend Services',
                  description: 'Develop backend services and business logic',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'IN_PROGRESS',
                  priority: 'HIGH',
                  duration: 25,
                  effort: 200,
                  progress: 25,
                  plannedStart: '2024-07-22',
                  plannedEnd: '2024-08-15',
                  assignedTo: ['backend-dev-1', 'backend-dev-2'],
                  requiredSkills: ['Node.js', 'Database Design', 'API Development'],
                  dependencies: ['2.1'],
                  dependencyTypes: { '2.1': 'START_TO_START' },
                  deliverables: ['REST APIs', 'Database Schema', 'Business Logic'],
                  acceptanceCriteria: ['Performance benchmarks met', 'Security audit passed'],
                  children: [],
                  isCriticalPath: true
                }
              ]
            },
            {
              id: '3.0',
              code: '3.0',
              title: 'Testing & Deployment',
              type: 'PHASE',
              level: 0,
              status: 'NOT_STARTED',
              priority: 'MEDIUM',
              duration: 20,
              progress: 0,
              plannedStart: '2024-08-21',
              plannedEnd: '2024-09-09',
              assignedTo: ['qa-lead', 'devops-engineer'],
              requiredSkills: ['Testing', 'DevOps', 'Deployment'],
              dependencies: ['2.0'],
              dependencyTypes: { '2.0': 'FINISH_TO_START' },
              deliverables: ['Test Reports', 'Deployed System', 'User Documentation'],
              acceptanceCriteria: ['User acceptance testing passed', 'Production deployment successful'],
              children: [
                {
                  id: '3.1',
                  code: '3.1',
                  title: 'System Testing',
                  description: 'Comprehensive testing including integration and user acceptance testing',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  status: 'NOT_STARTED',
                  priority: 'HIGH',
                  duration: 15,
                  effort: 120,
                  progress: 0,
                  plannedStart: '2024-08-21',
                  plannedEnd: '2024-09-04',
                  assignedTo: ['qa-tester-1', 'qa-tester-2'],
                  requiredSkills: ['Manual Testing', 'Automated Testing'],
                  dependencies: ['2.2', '2.3'],
                  dependencyTypes: { '2.2': 'FINISH_TO_START', '2.3': 'FINISH_TO_START' },
                  deliverables: ['Test Cases', 'Bug Reports', 'Test Execution Reports'],
                  acceptanceCriteria: ['Zero critical bugs', '95% test coverage'],
                  children: [],
                  isCriticalPath: true
                }
              ]
            }
          ]
        }
      ];

      setProjects(mockProjects);
      setSelectedProject(mockProjects[0]);
      setIsLoading(false);
    }, 1000);
  };

  const flattenNodes = (nodes: WBSTaskNode[]): WBSTaskNode[] => {
    const result: WBSTaskNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        result.push(...flattenNodes(node.children));
      }
    }
    return result;
  };

  const getAllNodes = (project: ProjectWBS): WBSTaskNode[] => {
    return flattenNodes(project.structure);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (selectedProject) {
      const allNodes = getAllNodes(selectedProject);
      const node = allNodes.find(n => n.id === active.id);
      setDraggedNode(node || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !selectedProject) return;

    toast.success('Task reordered successfully');
    setDraggedNode(null);
  };

  const toggleNodeExpansion = (id: string) => {
    if (!selectedProject) return;

    const updateNodes = (nodes: WBSTaskNode[]): WBSTaskNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: node.id === id ? !node.isExpanded : node.isExpanded,
        children: updateNodes(node.children)
      }));
    };

    setSelectedProject({
      ...selectedProject,
      structure: updateNodes(selectedProject.structure)
    });
  };

  const renderWBSTree = (nodes: WBSTaskNode[], level: number = 0): React.ReactNode => {
    if (!selectedProject) return null;

    const allNodes = getAllNodes(selectedProject);

    return nodes.map(node => (
      <div key={node.id}>
        <SortableTaskNode
          node={node}
          level={level}
          allNodes={allNodes}
          dependencies={selectedProject.dependencies}
          onToggleExpand={toggleNodeExpansion}
          onEdit={(node) => toast(`Edit task: ${node.title}`)}
          onDelete={(id) => toast(`Delete task: ${id}`)}
          onAddDependency={(fromId, toId, type) => toast(`Add dependency: ${fromId} → ${toId}`)}
          onViewDetails={(node) => {
            setSelectedNode(node);
            setShowNodeDetails(true);
          }}
        />
        {node.isExpanded && node.children.length > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {renderWBSTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderNetworkDiagram = () => {
    if (!selectedProject) return null;

    const allNodes = getAllNodes(selectedProject);
    const criticalPathNodes = allNodes.filter(node => selectedProject.criticalPath.includes(node.code));

    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Network Diagram</h3>

        {/* Critical Path Visualization */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Critical Path</h4>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {criticalPathNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <div className="flex-shrink-0 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-xs">
                  <div className="font-mono text-red-700 dark:text-red-400">{node.code}</div>
                  <div className="text-red-600 dark:text-red-300 truncate">{node.title}</div>
                  <div className="text-red-500 dark:text-red-400">{node.duration}d</div>
                </div>
                {index < criticalPathNodes.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dependencies Overview */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Task Dependencies</h4>
          <div className="space-y-2">
            {selectedProject.dependencies.map(dep => {
              const fromTask = allNodes.find(t => t.id === dep.fromTaskId);
              const toTask = allNodes.find(t => t.id === dep.toTaskId);

              return (
                <div key={dep.id} className="flex items-center text-sm">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                    {fromTask?.code} {fromTask?.title}
                  </span>
                  <div className="mx-2 flex items-center">
                    <span className="text-slate-400 mr-1">{getDependencyTypeIcon(dep.type)}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                    {toTask?.code} {toTask?.title}
                  </span>
                  {dep.lag !== 0 && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      ({dep.lag > 0 ? '+' : ''}{dep.lag}d lag)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getDependencyTypeIcon = (type: DependencyType) => {
    switch (type) {
      case 'FINISH_TO_START': return '→';
      case 'START_TO_START': return '⇉';
      case 'FINISH_TO_FINISH': return '⇇';
      case 'START_TO_FINISH': return '↺';
      default: return '→';
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="WBS z Zależnościami"
        subtitle="Struktura podziału pracy z wizualizacją zależności i ścieżki krytycznej"
        icon={GitBranch}
        iconColor="text-purple-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projekty', href: '/dashboard/projects' },
          { label: 'WBS z Zależnościami' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setViewMode('wbs')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'wbs' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                WBS Tree
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'network' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Network
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'gantt' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Gantt
              </button>
            </div>

            <button className="btn btn-outline btn-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
            <button className="btn btn-primary btn-sm">
              <Link className="w-4 h-4 mr-2" />
              Add Dependency
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Project Selector */}
        <div>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
            className="w-64 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md"
          >
            <option value="">Wybierz projekt...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject ? (
          <>
            {/* Project Info */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selectedProject.name}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedProject.description}</p>

                  <div className="flex items-center space-x-6 mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(selectedProject.projectStart).toLocaleDateString()} - {new Date(selectedProject.projectEnd).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {Math.ceil((new Date(selectedProject.projectEnd).getTime() - new Date(selectedProject.projectStart).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${
                      selectedProject.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700' :
                      selectedProject.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Critical Path Length</div>
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {selectedProject.criticalPath.length} tasks
                  </div>
                </div>
              </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'wbs' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Work Breakdown Structure</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Tasks highlighted in red are on the critical path
                  </p>
                </div>

                <div className="p-6">
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedProject.structure.map(n => n.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {renderWBSTree(selectedProject.structure)}
                      </div>
                    </SortableContext>

                    <DragOverlay>
                      {draggedNode ? (
                        <div className="p-3 bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg opacity-95">
                          <div className="flex items-center">
                            {getTypeIcon(draggedNode.type)}
                            <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{draggedNode.title}</span>
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              </div>
            )}

            {viewMode === 'network' && renderNetworkDiagram()}

            {viewMode === 'gantt' && (
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Gantt Chart</h3>
                <div className="text-slate-500 dark:text-slate-400 text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                  <p>Wizualizacja Gantt zostanie zaimplementowana tutaj</p>
                  <p className="text-sm mt-2">Widok timeline z zależnościami</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
            <Maximize2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Wybierz projekt</h3>
            <p className="text-slate-600 dark:text-slate-400">Wybierz projekt aby zobaczyć strukturę WBS i zależności</p>
          </div>
        )}
      </div>

      {/* Node Details Modal */}
      {showNodeDetails && selectedNode && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Szczegóły zadania</h3>
                <button
                  onClick={() => setShowNodeDetails(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">{selectedNode.code} - {selectedNode.title}</h4>
                  {selectedNode.description && (
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedNode.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedNode.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Priority:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedNode.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedNode.duration} days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Progress:</span>
                    <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedNode.progress}%</span>
                  </div>
                </div>

                {selectedNode.assignedTo.length > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Assigned to:</span>
                    <div className="mt-1">
                      {selectedNode.assignedTo.map(person => (
                        <span key={person} className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs mr-1">
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const getTypeIcon = (type: WBSTaskNode['type']) => {
  switch (type) {
    case 'PHASE': return <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'WORK_PACKAGE': return <List className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    case 'TASK': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'MILESTONE': return <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    default: return <CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
  }
};

export default WBSDependenciesPage;
