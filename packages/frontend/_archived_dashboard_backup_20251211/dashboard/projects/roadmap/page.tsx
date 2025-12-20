'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  CogIcon,
  UsersIcon,
  DocumentTextIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

interface ProjectRoadmapItem {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'EPIC';
  category: 'DEVELOPMENT' | 'BUSINESS' | 'INFRASTRUCTURE' | 'RESEARCH' | 'MARKETING' | 'OPERATIONS';
  phase: 'DISCOVERY' | 'PLANNING' | 'EXECUTION' | 'DELIVERY' | 'MAINTENANCE';
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  progress: number;
  milestones: ProjectMilestone[];
  dependencies: string[];
  assignedTeam: string[];
  budget?: number;
  actualCost?: number;
  risks: string[];
  outcomes: string[];
  tags: string[];
  createdAt: string;
  lastUpdated: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  actualDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  deliverables: string[];
  dependencies: string[];
  responsible: string;
  criticalPath: boolean;
}

interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  color: string;
  bgColor: string;
  icon: string;
  order: number;
}

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'DISCOVERY',
    title: 'Discovery',
    description: 'Badania, analiza wymagań i eksploracja rozwiązań',
    duration: '2-4 tygodnie',
    color: '#8B5CF6',
    bgColor: '#F3F4F6',
    icon: '🔍',
    order: 1
  },
  {
    id: 'PLANNING',
    title: 'Planning',
    description: 'Planowanie architektury, timeline i zasobów',
    duration: '1-3 tygodnie',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '📋',
    order: 2
  },
  {
    id: 'EXECUTION',
    title: 'Execution',
    description: 'Implementacja, rozwój i realizacja projektu',
    duration: '4-12 tygodni',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '⚡',
    order: 3
  },
  {
    id: 'DELIVERY',
    title: 'Delivery',
    description: 'Testowanie, wdrożenie i przekazanie',
    duration: '1-2 tygodnie',
    color: '#10B981',
    bgColor: '#ECFDF5',
    icon: '🚀',
    order: 4
  },
  {
    id: 'MAINTENANCE',
    title: 'Maintenance',
    description: 'Wsparcie, monitoring i optymalizacja',
    duration: 'Ciągłe',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    icon: '🔧',
    order: 5
  }
];

const PROJECT_CATEGORIES = [
  { id: 'DEVELOPMENT', name: 'Development', icon: '💻', color: '#3B82F6' },
  { id: 'BUSINESS', name: 'Business', icon: '💼', color: '#8B5CF6' },
  { id: 'INFRASTRUCTURE', name: 'Infrastructure', icon: '🏗️', color: '#6B7280' },
  { id: 'RESEARCH', name: 'Research', icon: '🔬', color: '#EC4899' },
  { id: 'MARKETING', name: 'Marketing', icon: '📢', color: '#10B981' },
  { id: 'OPERATIONS', name: 'Operations', icon: '⚙️', color: '#F59E0B' }
];

interface SortableProjectProps {
  project: ProjectRoadmapItem;
  phase: RoadmapPhase;
  onEdit: (project: ProjectRoadmapItem) => void;
  onStatusChange: (projectId: string, status: ProjectRoadmapItem['status']) => void;
  onProgressChange: (projectId: string, progress: number) => void;
}

const SortableProject: React.FC<SortableProjectProps> = ({ 
  project, 
  phase, 
  onEdit, 
  onStatusChange, 
  onProgressChange 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-700';
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-purple-100 text-purple-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE': return 'bg-green-100 text-green-700';
      case 'MODERATE': return 'bg-blue-100 text-blue-700';
      case 'COMPLEX': return 'bg-orange-100 text-orange-700';
      case 'EPIC': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const category = PROJECT_CATEGORIES.find(c => c.id === project.category);
  const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length;
  const totalMilestones = project.milestones.length;
  
  const daysRemaining = Math.ceil(
    (new Date(project.targetEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

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
          <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(project.priority)}`}>
            {project.priority}
          </span>
        </div>
      </div>

      {/* Project Name and Description */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Postęp</span>
          <span className="font-medium text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Kamienie milowe</span>
          <span>{completedMilestones}/{totalMilestones}</span>
        </div>
        {project.milestones.slice(0, 3).map(milestone => (
          <div key={milestone.id} className="flex items-center space-x-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${
              milestone.status === 'COMPLETED' ? 'bg-green-500' :
              milestone.status === 'IN_PROGRESS' ? 'bg-blue-500' :
              milestone.status === 'OVERDUE' ? 'bg-red-500' :
              'bg-gray-300'
            }`}></div>
            <span className={`text-xs ${
              milestone.status === 'COMPLETED' ? 'text-green-700 line-through' : 'text-gray-600'
            }`}>
              {milestone.title}
            </span>
            {milestone.criticalPath && (
              <span className="text-xs bg-red-100 text-red-700 px-1 rounded">CP</span>
            )}
          </div>
        ))}
        {project.milestones.length > 3 && (
          <div className="text-xs text-gray-500">+{project.milestones.length - 3} więcej...</div>
        )}
      </div>

      {/* Team and Timeline */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <UsersIcon className="w-3 h-3" />
          <span>{project.assignedTeam.length} członków zespołu</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <CalendarDaysIcon className="w-3 h-3" />
          <span>
            {daysRemaining > 0 ? `${daysRemaining} dni do końca` : 
             daysRemaining === 0 ? 'Kończy się dziś' : 
             `${Math.abs(daysRemaining)} dni po terminie`}
          </span>
        </div>
        {project.budget && (
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>💰</span>
            <span>Budżet: {project.budget.toLocaleString()} PLN</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getComplexityColor(project.complexity)}`}>
            {project.complexity}
          </span>
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        {project.dependencies.length > 0 && (
          <div className="text-xs text-gray-500 flex items-center">
            <ArrowRightIcon className="w-3 h-3 mr-1" />
            {project.dependencies.length} zależności
          </div>
        )}
      </div>

      {/* Progress slider */}
      <div className="mt-3">
        <input
          type="range"
          min="0"
          max="100"
          value={project.progress}
          onChange={(e) => onProgressChange(project.id, parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${project.progress}%, #E5E7EB ${project.progress}%, #E5E7EB 100%)`
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Status selector */}
      <div className="mt-2">
        <select
          value={project.status}
          onChange={(e) => onStatusChange(project.id, e.target.value as ProjectRoadmapItem['status'])}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="PLANNING">Planowanie</option>
          <option value="ACTIVE">Aktywny</option>
          <option value="ON_HOLD">Wstrzymany</option>
          <option value="COMPLETED">Ukończony</option>
          <option value="CANCELLED">Anulowany</option>
        </select>
      </div>
    </div>
  );
};

export default function ProjectsRoadmapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'roadmap' | 'gantt' | 'timeline'>('roadmap');
  const [activeProject, setActiveProject] = useState<ProjectRoadmapItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadRoadmapProjects();
  }, []);

  const loadRoadmapProjects = async () => {
    setTimeout(() => {
      const mockProjects: ProjectRoadmapItem[] = [
        // DISCOVERY Phase
        {
          id: '1',
          name: 'AI-Powered Analytics Platform',
          description: 'Platforma analityki biznesowej z wykorzystaniem sztucznej inteligencji do automatycznego generowania insights',
          status: 'PLANNING',
          priority: 'HIGH',
          complexity: 'EPIC',
          category: 'DEVELOPMENT',
          phase: 'DISCOVERY',
          startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 15,
          milestones: [
            {
              id: 'm1',
              title: 'Analiza wymagań biznesowych',
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Business Requirements Document', 'User Stories', 'Acceptance Criteria'],
              dependencies: [],
              responsible: 'Business Analyst',
              criticalPath: true
            },
            {
              id: 'm2',
              title: 'Research technologii AI/ML',
              targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              deliverables: ['Technology Assessment', 'Architecture Proposal'],
              dependencies: ['m1'],
              responsible: 'Tech Lead',
              criticalPath: true
            },
            {
              id: 'm3',
              title: 'Prototyp MVP',
              targetDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              deliverables: ['Working Prototype', 'Demo'],
              dependencies: ['m2'],
              responsible: 'Development Team',
              criticalPath: false
            }
          ],
          dependencies: [],
          assignedTeam: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'],
          budget: 250000,
          actualCost: 15000,
          risks: ['Złożoność integracji', 'Dostępność danych', 'Performance requirements'],
          outcomes: ['Automated reporting', 'Predictive analytics', 'Real-time dashboards'],
          tags: ['AI', 'Analytics', 'Machine Learning', 'Big Data'],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },

        // PLANNING Phase
        {
          id: '2',
          name: 'Customer Portal Redesign',
          description: 'Kompleksowa modernizacja portalu klienta z nowym UX/UI, mobile-first approach i integracją z CRM',
          status: 'ACTIVE',
          priority: 'HIGH',
          complexity: 'COMPLEX',
          category: 'DEVELOPMENT',
          phase: 'PLANNING',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 35,
          milestones: [
            {
              id: 'm4',
              title: 'User Experience Research',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              actualDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: ['User Journey Maps', 'Persona Definitions', 'Usability Study'],
              dependencies: [],
              responsible: 'UX Designer',
              criticalPath: true
            },
            {
              id: 'm5',
              title: 'UI Design System',
              targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Component Library', 'Style Guide', 'Design Tokens'],
              dependencies: ['m4'],
              responsible: 'UI Designer',
              criticalPath: true
            },
            {
              id: 'm6',
              title: 'Technical Architecture',
              targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              deliverables: ['Architecture Document', 'API Specification', 'Database Schema'],
              dependencies: ['m5'],
              responsible: 'Solution Architect',
              criticalPath: true
            }
          ],
          dependencies: [],
          assignedTeam: ['Alice Cooper', 'Bob Martin', 'Carol Johnson', 'David Lee'],
          budget: 180000,
          actualCost: 45000,
          risks: ['Browser compatibility', 'Performance on mobile', 'Data migration'],
          outcomes: ['Improved user experience', 'Mobile optimization', 'Increased engagement'],
          tags: ['Frontend', 'UX/UI', 'Mobile', 'React'],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },

        {
          id: '3',
          name: 'Security Compliance Initiative',
          description: 'Implementacja standardów bezpieczeństwa ISO 27001 i przygotowanie do audytu certyfikacyjnego',
          status: 'ACTIVE',
          priority: 'CRITICAL',
          complexity: 'COMPLEX',
          category: 'INFRASTRUCTURE',
          phase: 'PLANNING',
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 25,
          milestones: [
            {
              id: 'm7',
              title: 'Gap Analysis',
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              actualDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: ['Security Assessment Report', 'Compliance Gap Analysis'],
              dependencies: [],
              responsible: 'Security Officer',
              criticalPath: true
            },
            {
              id: 'm8',
              title: 'Policy Documentation',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Security Policies', 'Procedures Manual', 'Training Materials'],
              dependencies: ['m7'],
              responsible: 'Compliance Team',
              criticalPath: true
            }
          ],
          dependencies: [],
          assignedTeam: ['Security Team', 'Compliance Officer', 'IT Admin'],
          budget: 120000,
          actualCost: 25000,
          risks: ['Regulatory changes', 'Employee compliance', 'Third-party integrations'],
          outcomes: ['ISO 27001 certification', 'Enhanced security posture', 'Compliance framework'],
          tags: ['Security', 'Compliance', 'ISO 27001', 'Governance'],
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString()
        },

        // EXECUTION Phase
        {
          id: '4',
          name: 'E-commerce Platform Migration',
          description: 'Migracja sklepu internetowego na nową platformę z lepszą wydajnością i nowoczesnymi funkcjonalnościami',
          status: 'ACTIVE',
          priority: 'HIGH',
          complexity: 'COMPLEX',
          category: 'DEVELOPMENT',
          phase: 'EXECUTION',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 65,
          milestones: [
            {
              id: 'm9',
              title: 'Data Migration',
              targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              actualDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: ['Migrated Product Catalog', 'Customer Data', 'Order History'],
              dependencies: [],
              responsible: 'Database Team',
              criticalPath: true
            },
            {
              id: 'm10',
              title: 'Payment Integration',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Payment Gateway Setup', 'Testing Suite', 'Security Audit'],
              dependencies: ['m9'],
              responsible: 'Backend Team',
              criticalPath: true
            },
            {
              id: 'm11',
              title: 'Performance Optimization',
              targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              deliverables: ['Load Testing Results', 'Optimization Report', 'CDN Setup'],
              dependencies: ['m10'],
              responsible: 'DevOps Team',
              criticalPath: false
            }
          ],
          dependencies: [],
          assignedTeam: ['Development Team', 'DevOps', 'QA Team', 'Product Manager'],
          budget: 300000,
          actualCost: 180000,
          risks: ['Downtime during migration', 'Data loss', 'Performance degradation'],
          outcomes: ['Improved performance', 'Modern tech stack', 'Better user experience'],
          tags: ['E-commerce', 'Migration', 'Performance', 'Modern Stack'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },

        {
          id: '5',
          name: 'Marketing Automation System',
          description: 'Wdrożenie zaawansowanego systemu automatyzacji marketingu z personalizacją i lead scoring',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          complexity: 'MODERATE',
          category: 'MARKETING',
          phase: 'EXECUTION',
          startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 70,
          milestones: [
            {
              id: 'm12',
              title: 'Email Campaign Setup',
              targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              actualDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: ['Email Templates', 'Automation Workflows', 'Segmentation Rules'],
              dependencies: [],
              responsible: 'Marketing Team',
              criticalPath: false
            },
            {
              id: 'm13',
              title: 'Lead Scoring Implementation',
              targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Scoring Model', 'Integration with CRM', 'Reporting Dashboard'],
              dependencies: ['m12'],
              responsible: 'Marketing Ops',
              criticalPath: true
            }
          ],
          dependencies: [],
          assignedTeam: ['Marketing Team', 'Marketing Ops', 'Data Analyst'],
          budget: 80000,
          actualCost: 50000,
          risks: ['Data quality issues', 'Integration complexity', 'User adoption'],
          outcomes: ['Automated lead nurturing', 'Improved conversion rates', 'Better lead quality'],
          tags: ['Marketing', 'Automation', 'Lead Generation', 'CRM'],
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },

        // DELIVERY Phase
        {
          id: '6',
          name: 'Mobile App Launch',
          description: 'Finalizacja i uruchomienie aplikacji mobilnej dla klientów z pełną funkcjonalnością CRM',
          status: 'ACTIVE',
          priority: 'HIGH',
          complexity: 'MODERATE',
          category: 'DEVELOPMENT',
          phase: 'DELIVERY',
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 85,
          milestones: [
            {
              id: 'm14',
              title: 'Beta Testing',
              targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Beta Version', 'Testing Results', 'Bug Fixes'],
              dependencies: [],
              responsible: 'QA Team',
              criticalPath: true
            },
            {
              id: 'm15',
              title: 'App Store Submission',
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'PENDING',
              deliverables: ['App Store Package', 'Submission Documents', 'Marketing Materials'],
              dependencies: ['m14'],
              responsible: 'Product Manager',
              criticalPath: true
            }
          ],
          dependencies: ['2'],
          assignedTeam: ['Mobile Team', 'QA', 'Product Manager', 'DevOps'],
          budget: 150000,
          actualCost: 140000,
          risks: ['App store approval', 'Launch bugs', 'User adoption'],
          outcomes: ['Mobile app availability', 'Enhanced customer experience', 'Mobile channel'],
          tags: ['Mobile', 'React Native', 'App Store', 'Launch'],
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date().toISOString()
        },

        // MAINTENANCE Phase
        {
          id: '7',
          name: 'Legacy System Modernization',
          description: 'Utrzymanie i stopniowa modernizacja starszych systemów z zapewnieniem ciągłości działania',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          complexity: 'COMPLEX',
          category: 'INFRASTRUCTURE',
          phase: 'MAINTENANCE',
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          targetEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 40,
          milestones: [
            {
              id: 'm16',
              title: 'System Health Monitoring',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED',
              actualDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              deliverables: ['Monitoring Dashboard', 'Alert System', 'Performance Metrics'],
              dependencies: [],
              responsible: 'Operations Team',
              criticalPath: false
            },
            {
              id: 'm17',
              title: 'Incremental Modernization',
              targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'IN_PROGRESS',
              deliverables: ['Modernized Components', 'Migration Plan', 'Testing Framework'],
              dependencies: ['m16'],
              responsible: 'Architecture Team',
              criticalPath: true
            }
          ],
          dependencies: [],
          assignedTeam: ['Operations', 'Architecture Team', 'DevOps', 'Support'],
          budget: 200000,
          actualCost: 75000,
          risks: ['System downtime', 'Data corruption', 'Performance impact'],
          outcomes: ['Improved reliability', 'Reduced technical debt', 'Modern architecture'],
          tags: ['Legacy', 'Modernization', 'Infrastructure', 'Maintenance'],
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setProjects(mockProjects);
      setLoading(false);
    }, 500);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    setActiveProject(project || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const activeProject = projects.find(p => p.id === active.id);
    if (!activeProject) return;

    // Find which phase the project was dropped in
    const newPhase = over.id as string;
    
    if (ROADMAP_PHASES.some(phase => phase.id === newPhase)) {
      setProjects(prev => prev.map(project =>
        project.id === activeProject.id
          ? { ...project, phase: newPhase as ProjectRoadmapItem['phase'] }
          : project
      ));
      
      toast.success(`Projekt przeniesiony do fazy: ${ROADMAP_PHASES.find(p => p.id === newPhase)?.title}`);
    }
  };

  const handleStatusChange = (projectId: string, status: ProjectRoadmapItem['status']) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId ? { ...project, status } : project
    ));
  };

  const handleProgressChange = (projectId: string, progress: number) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId ? { ...project, progress } : project
    ));
  };

  const getFilteredProjects = () => {
    let filtered = projects;
    
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }
    
    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(project => project.priority === selectedPriority);
    }
    
    return filtered;
  };

  const getProjectsByPhase = (phaseId: string) => {
    return getFilteredProjects().filter(project => project.phase === phaseId);
  };

  const getProjectStats = () => {
    const filtered = getFilteredProjects();
    const total = filtered.length;
    const active = filtered.filter(p => p.status === 'ACTIVE').length;
    const completed = filtered.filter(p => p.status === 'COMPLETED').length;
    const onHold = filtered.filter(p => p.status === 'ON_HOLD').length;
    const totalBudget = filtered.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalCost = filtered.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const avgProgress = filtered.length > 0 ? 
      Math.round(filtered.reduce((sum, p) => sum + p.progress, 0) / filtered.length) : 0;
    
    return { total, active, completed, onHold, totalBudget, totalCost, avgProgress };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = getProjectStats();

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
              Roadmap Projektów
            </h1>
            <p className="text-gray-600">Zarządzanie projektami według faz rozwoju z kamieniami milowymi</p>
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
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'gantt' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-1 inline" />
              Gantt
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

          {/* Add New Project */}
          <button className="btn btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nowy projekt
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ukończone</p>
              <p className="text-xl font-semibold text-gray-900">{stats.completed}</p>
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
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Śr. postęp</p>
              <p className="text-xl font-semibold text-gray-900">{stats.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 font-semibold">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Budżet</p>
              <p className="text-lg font-semibold text-gray-900">
                {(stats.totalBudget / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600 font-semibold">💸</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Wydane</p>
              <p className="text-lg font-semibold text-gray-900">
                {(stats.totalCost / 1000).toFixed(0)}K
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="ALL">Wszystkie kategorie</option>
            {PROJECT_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="ALL">Wszystkie priorytety</option>
            <option value="LOW">Niski</option>
            <option value="MEDIUM">Średni</option>
            <option value="HIGH">Wysoki</option>
            <option value="CRITICAL">Krytyczny</option>
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Pokazano: {getFilteredProjects().length} z {projects.length} projektów
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
            {ROADMAP_PHASES.map(phase => {
              const phaseProjects = getProjectsByPhase(phase.id);
              
              return (
                <div
                  key={phase.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Phase Header */}
                  <div 
                    className="p-4 text-white"
                    style={{ backgroundColor: phase.color }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{phase.icon}</span>
                      <h3 className="font-semibold text-sm">{phase.title}</h3>
                    </div>
                    <p className="text-xs opacity-90">{phase.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span>{phase.duration}</span>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                        {phaseProjects.length} projektów
                      </span>
                    </div>
                  </div>

                  {/* Projects Container */}
                  <div 
                    className="p-4 space-y-3 min-h-[500px]"
                    style={{ backgroundColor: phase.bgColor }}
                  >
                    <SortableContext items={phaseProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {phaseProjects.map(project => (
                        <SortableProject
                          key={project.id}
                          project={project}
                          phase={phase}
                          onEdit={(project) => console.log('Edit project:', project)}
                          onStatusChange={handleStatusChange}
                          onProgressChange={handleProgressChange}
                        />
                      ))}
                    </SortableContext>
                    
                    {phaseProjects.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-2xl mb-2">{phase.icon}</div>
                        <div className="text-sm">Brak projektów w tej fazie</div>
                        <div className="text-xs mt-1">Przeciągnij projekty tutaj</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeProject ? (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                <div className="font-medium text-gray-900">{activeProject.name}</div>
                <div className="text-sm text-gray-600 mt-1">{activeProject.description}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {activeProject.progress}% • {activeProject.milestones.length} kamieni milowych
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Gantt View Placeholder */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Widok Gantt</h3>
            <p className="text-gray-600 mb-4">
              Zaawansowany widok Gantt z zależnościami projektów i kamieniami milowymi
            </p>
            <button className="btn btn-primary">
              <CogIcon className="w-4 h-4 mr-2" />
              Konfiguruj widok Gantt
            </button>
          </div>
        </div>
      )}

      {/* Timeline View Placeholder */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Widok Timeline</h3>
            <p className="text-gray-600 mb-4">
              Chronologiczny widok projektów z kamieniami milowymi i kluczowymi wydarzeniami
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