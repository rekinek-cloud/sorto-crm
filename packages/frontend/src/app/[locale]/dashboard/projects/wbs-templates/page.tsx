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
  Folder,
  FileText,
  Clock,
  User,
  Tag,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  Copy,
  FolderTree,
} from 'lucide-react';

interface WBSTemplate {
  id: string;
  name: string;
  description: string;
  category: 'SOFTWARE' | 'MARKETING' | 'BUSINESS' | 'RESEARCH' | 'OPERATIONS' | 'PERSONAL';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'ENTERPRISE';
  estimatedDuration: string;
  structure: WBSNode[];
  metadata: {
    version: string;
    author: string;
    created: string;
    lastModified: string;
    usageCount: number;
    tags: string[];
  };
  resources: {
    requiredSkills: string[];
    estimatedBudget?: number;
    teamSize: number;
    toolsRequired: string[];
  };
}

interface WBSNode {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: 'PHASE' | 'DELIVERABLE' | 'WORK_PACKAGE' | 'ACTIVITY';
  level: number;
  estimatedHours?: number;
  estimatedDays?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  skills: string[];
  dependencies: string[];
  deliverables: string[];
  notes?: string;
  children: WBSNode[];
  isExpanded?: boolean;
  templates?: {
    checklist: string[];
    documents: string[];
    resources: string[];
  };
}

interface SortableWBSNodeProps {
  node: WBSNode;
  level: number;
  onToggleExpand: (id: string) => void;
  onEdit: (node: WBSNode) => void;
  onDelete: (id: string) => void;
  onDuplicate: (node: WBSNode) => void;
}

// Helper function extracted to module level for reuse
const getTypeIcon = (type: WBSNode['type']) => {
  switch (type) {
    case 'PHASE': return <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'DELIVERABLE': return <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'WORK_PACKAGE': return <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    case 'ACTIVITY': return <PlayCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    default: return <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
  }
};

const SortableWBSNode: React.FC<SortableWBSNodeProps> = ({
  node,
  level,
  onToggleExpand,
  onEdit,
  onDelete,
  onDuplicate,
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

  const getPriorityColor = (priority: WBSNode['priority']) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700';
      case 'LOW': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const paddingLeft = level * 24;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="flex items-center p-3 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl hover:shadow-sm transition-shadow"
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

        {/* Type Icon */}
        <div className="mr-3">
          {getTypeIcon(node.type)}
        </div>

        {/* WBS Code */}
        <div className="min-w-0 mr-3">
          <span className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
            {node.code}
          </span>
        </div>

        {/* Node Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {node.title}
              </h4>
              {node.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                  {node.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {/* Priority Badge */}
              <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(node.priority)}`}>
                {node.priority}
              </span>

              {/* Estimated Time */}
              {node.estimatedHours && (
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {node.estimatedHours}h
                </div>
              )}

              {/* Skills Count */}
              {node.skills.length > 0 && (
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <User className="w-3 h-3 mr-1" />
                  {node.skills.length}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEdit(node)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDuplicate(node)}
                  className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(node.id)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Info */}
          {node.isExpanded && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Dependencies */}
                {node.dependencies.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Dependencies:</span>
                    <div className="mt-1 space-y-1">
                      {node.dependencies.map((dep, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded mr-1">
                          {dep}
                        </span>
                      ))}
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

                {/* Skills */}
                {node.skills.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Required Skills:</span>
                    <div className="mt-1 space-y-1">
                      {node.skills.map((skill, idx) => (
                        <span key={idx} className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded mr-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {node.templates && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Templates:</span>
                    <div className="mt-1">
                      {node.templates.checklist.length > 0 && (
                        <div className="mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Checklist:</span> {node.templates.checklist.join(', ')}
                        </div>
                      )}
                      {node.templates.documents.length > 0 && (
                        <div className="mb-1">
                          <span className="text-slate-600 dark:text-slate-400">Documents:</span> {node.templates.documents.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {node.notes && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
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

const WBSTemplatesPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WBSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WBSTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [activeTemplate, setActiveTemplate] = useState<WBSTemplate | null>(null);
  const [draggedNode, setDraggedNode] = useState<WBSNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterComplexity, setFilterComplexity] = useState<string>('ALL');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    setTimeout(() => {
      const mockTemplates: WBSTemplate[] = [
        {
          id: '1',
          name: 'Web Application Development',
          description: 'Kompleksowy szablon dla rozwoju aplikacji webowej',
          category: 'SOFTWARE',
          complexity: 'COMPLEX',
          estimatedDuration: '12-16 tygodni',
          metadata: {
            version: '2.1',
            author: 'Engineering Team',
            created: '2024-01-15',
            lastModified: '2024-06-15',
            usageCount: 15,
            tags: ['web', 'development', 'react', 'api']
          },
          resources: {
            requiredSkills: ['Frontend Development', 'Backend Development', 'DevOps', 'UI/UX Design'],
            estimatedBudget: 150000,
            teamSize: 6,
            toolsRequired: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']
          },
          structure: [
            {
              id: '1.0',
              code: '1.0',
              title: 'Project Initiation',
              type: 'PHASE',
              level: 0,
              priority: 'HIGH',
              estimatedDays: 5,
              skills: ['Project Management'],
              dependencies: [],
              deliverables: ['Project Charter', 'Team Setup', 'Environment Setup'],
              isExpanded: true,
              children: [
                {
                  id: '1.1',
                  code: '1.1',
                  title: 'Requirements Analysis',
                  description: 'Szczegółowa analiza wymagań biznesowych i technicznych',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  priority: 'CRITICAL',
                  estimatedHours: 40,
                  skills: ['Business Analysis', 'System Analysis'],
                  dependencies: [],
                  deliverables: ['Requirements Document', 'Use Cases', 'Technical Specification'],
                  children: [],
                  templates: {
                    checklist: ['Gather stakeholder requirements', 'Create user stories', 'Define acceptance criteria'],
                    documents: ['Requirements Template', 'Use Case Template'],
                    resources: ['Stakeholder List', 'Business Rules']
                  }
                },
                {
                  id: '1.2',
                  code: '1.2',
                  title: 'System Architecture Design',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  priority: 'HIGH',
                  estimatedHours: 32,
                  skills: ['System Architecture', 'Database Design'],
                  dependencies: ['1.1'],
                  deliverables: ['Architecture Document', 'Database Schema', 'API Design'],
                  children: [],
                  templates: {
                    checklist: ['Design system architecture', 'Create database schema', 'Define API endpoints'],
                    documents: ['Architecture Template', 'Database Design Template'],
                    resources: ['Architecture Patterns', 'Best Practices Guide']
                  }
                }
              ]
            },
            {
              id: '2.0',
              code: '2.0',
              title: 'Development Phase',
              type: 'PHASE',
              level: 0,
              priority: 'HIGH',
              estimatedDays: 60,
              skills: ['Frontend Development', 'Backend Development'],
              dependencies: ['1.0'],
              deliverables: ['Working Application', 'API Documentation', 'Test Suite'],
              isExpanded: false,
              children: [
                {
                  id: '2.1',
                  code: '2.1',
                  title: 'Frontend Development',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  priority: 'HIGH',
                  estimatedHours: 200,
                  skills: ['React', 'TypeScript', 'CSS'],
                  dependencies: ['1.2'],
                  deliverables: ['React Components', 'UI Styling', 'Client-side Routing'],
                  children: []
                },
                {
                  id: '2.2',
                  code: '2.2',
                  title: 'Backend Development',
                  type: 'WORK_PACKAGE',
                  level: 1,
                  priority: 'HIGH',
                  estimatedHours: 180,
                  skills: ['Node.js', 'Express', 'PostgreSQL'],
                  dependencies: ['1.2'],
                  deliverables: ['REST API', 'Database Implementation', 'Authentication'],
                  children: []
                }
              ]
            },
            {
              id: '3.0',
              code: '3.0',
              title: 'Testing & Deployment',
              type: 'PHASE',
              level: 0,
              priority: 'MEDIUM',
              estimatedDays: 15,
              skills: ['Testing', 'DevOps'],
              dependencies: ['2.0'],
              deliverables: ['Test Reports', 'Deployed Application', 'Documentation'],
              children: []
            }
          ]
        },
        {
          id: '2',
          name: 'Marketing Campaign Launch',
          description: 'Szablon do uruchamiania kampanii marketingowych',
          category: 'MARKETING',
          complexity: 'MODERATE',
          estimatedDuration: '8-12 tygodni',
          metadata: {
            version: '1.3',
            author: 'Marketing Team',
            created: '2024-02-01',
            lastModified: '2024-05-20',
            usageCount: 8,
            tags: ['marketing', 'campaign', 'digital', 'analytics']
          },
          resources: {
            requiredSkills: ['Digital Marketing', 'Content Creation', 'Analytics', 'Design'],
            estimatedBudget: 50000,
            teamSize: 4,
            toolsRequired: ['Google Ads', 'Facebook Ads', 'Analytics', 'Canva', 'Mailchimp']
          },
          structure: [
            {
              id: '1.0',
              code: '1.0',
              title: 'Campaign Strategy',
              type: 'PHASE',
              level: 0,
              priority: 'CRITICAL',
              estimatedDays: 10,
              skills: ['Strategy', 'Market Research'],
              dependencies: [],
              deliverables: ['Campaign Strategy', 'Target Audience Analysis', 'Budget Plan'],
              children: []
            },
            {
              id: '2.0',
              code: '2.0',
              title: 'Content Creation',
              type: 'PHASE',
              level: 0,
              priority: 'HIGH',
              estimatedDays: 20,
              skills: ['Content Writing', 'Graphic Design', 'Video Production'],
              dependencies: ['1.0'],
              deliverables: ['Ad Creatives', 'Landing Pages', 'Email Templates'],
              children: []
            },
            {
              id: '3.0',
              code: '3.0',
              title: 'Campaign Execution',
              type: 'PHASE',
              level: 0,
              priority: 'HIGH',
              estimatedDays: 30,
              skills: ['Paid Advertising', 'Social Media', 'Email Marketing'],
              dependencies: ['2.0'],
              deliverables: ['Live Campaigns', 'Performance Reports', 'Optimization Reports'],
              children: []
            }
          ]
        }
      ];

      setTemplates(mockTemplates);
      setActiveTemplate(mockTemplates[0]);
      setIsLoading(false);
    }, 1000);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (activeTemplate) {
      const node = findNodeById(activeTemplate.structure, active.id as string);
      setDraggedNode(node);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !activeTemplate) return;

    toast.success('Node reordered successfully');
    setDraggedNode(null);
  };

  const findNodeById = (nodes: WBSNode[], id: string): WBSNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const toggleNodeExpansion = (id: string) => {
    if (!activeTemplate) return;

    const updateNodes = (nodes: WBSNode[]): WBSNode[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: node.id === id ? !node.isExpanded : node.isExpanded,
        children: updateNodes(node.children)
      }));
    };

    setActiveTemplate({
      ...activeTemplate,
      structure: updateNodes(activeTemplate.structure)
    });
  };

  const renderWBSTree = (nodes: WBSNode[], level: number = 0): React.ReactNode => {
    return nodes.map(node => (
      <div key={node.id}>
        <SortableWBSNode
          node={node}
          level={level}
          onToggleExpand={toggleNodeExpansion}
          onEdit={(node) => toast(`Edit node: ${node.title}`)}
          onDelete={(id) => toast(`Delete node: ${id}`)}
          onDuplicate={(node) => toast(`Duplicate node: ${node.title}`)}
        />
        {node.isExpanded && node.children.length > 0 && (
          <div className="ml-6 mt-2 space-y-2">
            {renderWBSTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || template.category === filterCategory;
    const matchesComplexity = filterComplexity === 'ALL' || template.complexity === filterComplexity;
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  const getCategoryColor = (category: WBSTemplate['category']) => {
    switch (category) {
      case 'SOFTWARE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'MARKETING': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'BUSINESS': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'RESEARCH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
      case 'OPERATIONS': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'PERSONAL': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getComplexityColor = (complexity: WBSTemplate['complexity']) => {
    switch (complexity) {
      case 'SIMPLE': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'COMPLEX': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
      case 'ENTERPRISE': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Szablony WBS"
        subtitle="Biblioteka szablonów struktury podziału pracy"
        icon={FolderTree}
        iconColor="text-indigo-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projekty', href: '/dashboard/projects' },
          { label: 'Szablony WBS' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">
              <Plus className="w-4 h-4 mr-2" />
              Nowy szablon
            </button>
            <button className="btn btn-primary btn-sm">
              <Copy className="w-4 h-4 mr-2" />
              Importuj szablon
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Templates Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Biblioteka szablonów</h3>

              {/* Search & Filters */}
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Szukaj szablonów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md text-sm"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md text-sm"
                >
                  <option value="ALL">Wszystkie kategorie</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="BUSINESS">Business</option>
                  <option value="RESEARCH">Research</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="PERSONAL">Personal</option>
                </select>

                <select
                  value={filterComplexity}
                  onChange={(e) => setFilterComplexity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md text-sm"
                >
                  <option value="ALL">Wszystkie złożoności</option>
                  <option value="SIMPLE">Simple</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="COMPLEX">Complex</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setActiveTemplate(template)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeTemplate?.id === template.id
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {template.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getComplexityColor(template.complexity)}`}>
                          {template.complexity}
                        </span>
                      </div>

                      <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {template.estimatedDuration}
                        <span className="mx-2">|</span>
                        <User className="w-3 h-3 mr-1" />
                        {template.resources.teamSize}
                        <span className="mx-2">|</span>
                        <span>Użyto {template.metadata.usageCount}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTemplate ? (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
              {/* Template Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{activeTemplate.name}</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{activeTemplate.description}</p>

                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-md ${getCategoryColor(activeTemplate.category)}`}>
                        {activeTemplate.category}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-md ${getComplexityColor(activeTemplate.complexity)}`}>
                        {activeTemplate.complexity}
                      </span>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {activeTemplate.estimatedDuration}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <User className="w-4 h-4 mr-1" />
                        Team: {activeTemplate.resources.teamSize}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="btn btn-outline btn-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Podgląd
                    </button>
                    <button className="btn btn-primary btn-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Użyj szablonu
                    </button>
                  </div>
                </div>

                {/* Template Metadata */}
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Wersja:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{activeTemplate.metadata.version}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Autor:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{activeTemplate.metadata.author}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Utworzony:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{activeTemplate.metadata.created}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Użyto:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">{activeTemplate.metadata.usageCount} razy</span>
                  </div>
                </div>
              </div>

              {/* WBS Structure */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Struktura podziału pracy</h3>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        viewMode === 'tree' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Widok drzewa
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm rounded-md ${
                        viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Widok listy
                    </button>
                  </div>
                </div>

                {/* WBS Tree */}
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={activeTemplate.structure.map(n => n.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {renderWBSTree(activeTemplate.structure)}
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

              {/* Template Resources */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-4">Wymagane zasoby</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wymagane umiejętności</h5>
                    <div className="space-y-1">
                      {activeTemplate.resources.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs mr-1 mb-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wymagane narzędzia</h5>
                    <div className="space-y-1">
                      {activeTemplate.resources.toolsRequired.map((tool, idx) => (
                        <span key={idx} className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs mr-1 mb-1">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {activeTemplate.resources.estimatedBudget && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Szacowany budżet:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">${activeTemplate.resources.estimatedBudget.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
              <Folder className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Wybierz szablon</h3>
              <p className="text-slate-600 dark:text-slate-400">Wybierz szablon WBS z panelu bocznego aby zobaczyć jego strukturę</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default WBSTemplatesPage;
