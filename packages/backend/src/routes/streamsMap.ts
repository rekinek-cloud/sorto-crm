import { Router } from 'express';
import { authenticateToken } from '../shared/middleware/auth';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Types for bucket views
interface BucketGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  items: any[];
  count: number;
  metadata?: Record<string, any>;
}

interface BucketViewDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  filterLogic: (items: any[]) => BucketGroup[];
}

// Helper function to get user's organization
const getUserOrganizationId = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user.organizationId;
};

// Bucket View: Horizon (Topographic) 🛩️
const createHorizonView = (tasks: any[]): BucketGroup[] => {
  const horizonMap = {
    0: { name: 'Runway (Działania)', description: 'Bieżące zadania i działania', color: '#10B981', icon: '🛫' },
    1: { name: '10,000ft (Projekty)', description: 'Projekty wieloetapowe', color: '#3B82F6', icon: '🏢' },
    2: { name: '20,000ft (Obszary)', description: 'Obszary odpowiedzialności', color: '#8B5CF6', icon: '🌍' },
    3: { name: '30,000ft (Cele)', description: 'Cele 1-2 letnie', color: '#F59E0B', icon: '🎯' },
    4: { name: '40,000ft (Wizja)', description: 'Wizja 3-5 lat', color: '#EF4444', icon: '🌟' },
    5: { name: '50,000ft (Misja)', description: 'Cel życiowy i misja', color: '#EC4899', icon: '🌌' }
  };

  const grouped = new Map<number, any[]>();
  
  // Initialize all horizon levels
  for (let i = 0; i <= 5; i++) {
    grouped.set(i, []);
  }

  // Group tasks by horizon level
  tasks.forEach(task => {
    const level = task.stream?.horizonLevel || 0;
    const items = grouped.get(level) || [];
    items.push(task);
    grouped.set(level, items);
  });

  // Convert to bucket groups
  const buckets: BucketGroup[] = [];
  for (let level = 0; level <= 5; level++) {
    const items = grouped.get(level) || [];
    const horizonInfo = horizonMap[level as keyof typeof horizonMap];
    
    buckets.push({
      id: `horizon-${level}`,
      name: horizonInfo.name,
      description: horizonInfo.description,
      color: horizonInfo.color,
      icon: horizonInfo.icon,
      items,
      count: items.length,
      metadata: { 
        horizonLevel: level,
        reviewFrequency: level === 0 ? 'daily' : level === 1 ? 'weekly' : level === 2 ? 'monthly' : 'quarterly'
      }
    });
  }

  return buckets;
};

// Bucket View: Urgency (Traffic) 🚦
const createUrgencyView = (tasks: any[]): BucketGroup[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue: any[] = [];
  const urgent: any[] = []; // Today
  const important: any[] = []; // This week  
  const normal: any[] = []; // Future

  tasks.forEach(task => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    
    if (!dueDate) {
      normal.push(task);
    } else if (dueDate < today) {
      overdue.push(task);
    } else if (dueDate < tomorrow) {
      urgent.push(task);
    } else if (dueDate < weekFromNow) {
      important.push(task);
    } else {
      normal.push(task);
    }
  });

  return [
    {
      id: 'overdue',
      name: 'Po terminie',
      description: 'Zadania przeterminowane - wymagają natychmiastowej uwagi',
      color: '#DC2626',
      icon: '🔴',
      items: overdue,
      count: overdue.length,
      metadata: { urgencyLevel: 'critical', priority: 1 }
    },
    {
      id: 'urgent',
      name: 'Dziś',
      description: 'Zadania na dziś - wysoka pilność',
      color: '#F59E0B',
      icon: '🟡',
      items: urgent,
      count: urgent.length,
      metadata: { urgencyLevel: 'high', priority: 2 }
    },
    {
      id: 'important',
      name: 'Ten tydzień',
      description: 'Zadania na najbliższy tydzień',
      color: '#3B82F6',
      icon: '🔵',
      items: important,
      count: important.length,
      metadata: { urgencyLevel: 'medium', priority: 3 }
    },
    {
      id: 'normal',
      name: 'Przyszłość',
      description: 'Zadania bez pilnego terminu',
      color: '#10B981',
      icon: '🟢',
      items: normal,
      count: normal.length,
      metadata: { urgencyLevel: 'low', priority: 4 }
    }
  ];
};

// Bucket View: Business (Companies) 🏢
const createBusinessView = (tasks: any[]): BucketGroup[] => {
  const grouped = new Map<string, any[]>();
  const companyMap = new Map<string, any>();

  // Group by company
  tasks.forEach(task => {
    const companyId = task.companyId || 'internal';
    const companyName = task.company?.name || 'Projekty wewnętrzne';
    
    if (!grouped.has(companyId)) {
      grouped.set(companyId, []);
      companyMap.set(companyId, {
        id: companyId,
        name: companyName,
        industry: task.company?.industry || 'Internal',
        status: task.company?.status || 'ACTIVE'
      });
    }
    
    grouped.get(companyId)!.push(task);
  });

  const buckets: BucketGroup[] = [];
  
  grouped.forEach((items, companyId) => {
    const company = companyMap.get(companyId)!;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const colorIndex = Array.from(grouped.keys()).indexOf(companyId) % colors.length;
    
    buckets.push({
      id: `company-${companyId}`,
      name: company.name,
      description: `Zadania i projekty dla ${company.name}`,
      color: colors[colorIndex],
      icon: companyId === 'internal' ? '🏠' : '🏢',
      items,
      count: items.length,
      metadata: {
        companyId,
        industry: company.industry,
        status: company.status,
        revenueImpact: items.filter(t => t.priority === 'HIGH').length
      }
    });
  });

  // Sort by task count (descending)
  return buckets.sort((a, b) => b.count - a.count);
};

// Bucket View: Energy Level ⚡
const createEnergyView = (tasks: any[]): BucketGroup[] => {
  const highEnergy: any[] = [];
  const mediumEnergy: any[] = [];
  const lowEnergy: any[] = [];

  tasks.forEach(task => {
    const estimatedHours = task.estimatedHours || 1;
    const priority = task.priority || 'MEDIUM';
    const hasContext = task.context?.name || '';
    
    // Energy calculation logic
    let energyLevel = 'medium';
    
    if (priority === 'HIGH' || estimatedHours > 4 || hasContext.includes('@computer') || hasContext.includes('@calls')) {
      energyLevel = 'high';
    } else if (priority === 'LOW' || estimatedHours < 1 || hasContext.includes('@waiting') || hasContext.includes('@reading')) {
      energyLevel = 'low';
    }
    
    if (energyLevel === 'high') {
      highEnergy.push(task);
    } else if (energyLevel === 'low') {
      lowEnergy.push(task);
    } else {
      mediumEnergy.push(task);
    }
  });

  return [
    {
      id: 'high-energy',
      name: 'Wysoka energia',
      description: 'Zadania wymagające pełnej koncentracji i energii',
      color: '#DC2626',
      icon: '🔋',
      items: highEnergy,
      count: highEnergy.length,
      metadata: { 
        energyLevel: 'high',
        bestTime: 'morning',
        focusRequired: true
      }
    },
    {
      id: 'medium-energy',
      name: 'Średnia energia',
      description: 'Standardowe zadania wymagające umiarkowanego wysiłku',
      color: '#F59E0B',
      icon: '🔄',
      items: mediumEnergy,
      count: mediumEnergy.length,
      metadata: { 
        energyLevel: 'medium',
        bestTime: 'afternoon',
        focusRequired: false
      }
    },
    {
      id: 'low-energy',
      name: 'Niska energia',
      description: 'Proste zadania do wykonania w czasie odpoczynku',
      color: '#10B981',
      icon: '🪫',
      items: lowEnergy,
      count: lowEnergy.length,
      metadata: { 
        energyLevel: 'low',
        bestTime: 'evening',
        focusRequired: false
      }
    }
  ];
};

// Bucket View: Stream Infrastructure 🌊
const createStreamView = (tasks: any[]): BucketGroup[] => {
  const streamMap = new Map<string, any[]>();
  const streamInfo = new Map<string, any>();

  tasks.forEach(task => {
    const streamId = task.streamId || 'unassigned';
    const streamName = task.stream?.name || 'Nieprzypisane';
    const gtdRole = task.stream?.gtdRole || 'CUSTOM';
    
    if (!streamMap.has(streamId)) {
      streamMap.set(streamId, []);
      streamInfo.set(streamId, {
        name: streamName,
        gtdRole,
        color: task.stream?.color || '#6B7280',
        icon: getStreamIcon(gtdRole)
      });
    }
    
    streamMap.get(streamId)!.push(task);
  });

  const buckets: BucketGroup[] = [];
  
  streamMap.forEach((items, streamId) => {
    const stream = streamInfo.get(streamId)!;
    
    buckets.push({
      id: `stream-${streamId}`,
      name: stream.name,
      description: `Zadania w strumieniu ${stream.name} (${stream.gtdRole})`,
      color: stream.color,
      icon: stream.icon,
      items,
      count: items.length,
      metadata: {
        streamId,
        gtdRole: stream.gtdRole,
        efficiency: calculateStreamEfficiency(items)
      }
    });
  });

  return buckets.sort((a, b) => a.metadata?.gtdRole?.localeCompare(b.metadata?.gtdRole) || 0);
};

// Helper functions
const getStreamIcon = (gtdRole: string): string => {
  const iconMap: Record<string, string> = {
    'INBOX': '📥',
    'NEXT_ACTIONS': '⚡',
    'PROJECTS': '📁',
    'WAITING_FOR': '⏳',
    'SOMEDAY_MAYBE': '🌟',
    'CONTEXTS': '🎯',
    'AREAS': '🏠',
    'REFERENCE': '📚',
    'CUSTOM': '🔧'
  };
  return iconMap[gtdRole] || '📋';
};

const calculateStreamEfficiency = (tasks: any[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  return Math.round((completed / tasks.length) * 100);
};

// API Routes

// Get all available bucket view types
router.get('/views', authenticateToken, async (req, res) => {
  try {
    const viewTypes = [
      {
        id: 'horizon',
        name: 'Mapa wysokości',
        description: 'Grupowanie według poziomów perspektywy GTD (0-5)',
        icon: '🛩️',
        color: '#3B82F6',
        category: 'perspective'
      },
      {
        id: 'urgency',
        name: 'Mapa ruchu',
        description: 'Pilność i deadlines - jak ruch uliczny',
        icon: '🚦',
        color: '#DC2626',
        category: 'time'
      },
      {
        id: 'business',
        name: 'Mapa biznesowa',
        description: 'Według firm i projektów biznesowych',
        icon: '🏢',
        color: '#10B981',
        category: 'organization'
      },
      {
        id: 'energy',
        name: 'Mapa energii',
        description: 'Według poziomu wymaganej energii',
        icon: '⚡',
        color: '#F59E0B',
        category: 'execution'
      },
      {
        id: 'stream',
        name: 'Mapa infrastruktury',
        description: 'Według streamów GTD (workflow)',
        icon: '🌊',
        color: '#8B5CF6',
        category: 'workflow'
      }
    ];

    res.json({
      success: true,
      data: viewTypes
    });
  } catch (error) {
    logger.error('Error getting bucket view types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bucket view types'
    });
  }
});

// Get bucket view data for specific view type
router.get('/views/:viewType', authenticateToken, async (req, res) => {
  try {
    const { viewType } = req.params;
    const organizationId = await getUserOrganizationId(req.user.id);

    // Fetch tasks with all necessary relations
    const tasks = await prisma.task.findMany({
      where: {
        organizationId,
        status: {
          notIn: ['COMPLETED', 'CANCELED']
        }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true
          }
        },
        stream: {
          select: {
            id: true,
            name: true,
            color: true,
            gtdRole: true,
            horizonLevel: true
          }
        },
        context: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    let buckets: BucketGroup[] = [];

    // Apply appropriate bucket view logic
    switch (viewType) {
      case 'horizon':
        buckets = createHorizonView(tasks);
        break;
      case 'urgency':
        buckets = createUrgencyView(tasks);
        break;
      case 'business':
        buckets = createBusinessView(tasks);
        break;
      case 'energy':
        buckets = createEnergyView(tasks);
        break;
      case 'stream':
        buckets = createStreamView(tasks);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown view type: ${viewType}`
        });
    }

    const response = {
      success: true,
      data: {
        viewType,
        buckets,
        totalTasks: tasks.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          organizationId,
          activeTasksOnly: true
        }
      }
    };

    res.json(response);

  } catch (error) {
    logger.error(`Error getting bucket view ${req.params.viewType}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to get bucket view: ${req.params.viewType}`
    });
  }
});

// Get 3D visualization data (enhanced bucket view with depth/elevation)
router.get('/views/:viewType/3d', authenticateToken, async (req, res) => {
  try {
    const { viewType } = req.params;
    
    // Get standard bucket view
    const standardResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/gtd-map/views/${viewType}`, {
      headers: {
        'Authorization': req.headers.authorization!
      }
    });
    
    const standardData = await standardResponse.json();
    
    if (!standardData.success) {
      return res.status(500).json(standardData);
    }

    // Enhance with 3D coordinates and elevation data
    const enhanced3DBuckets = standardData.data.buckets.map((bucket: BucketGroup, index: number) => ({
      ...bucket,
      position3D: {
        x: (index % 3) * 300, // Grid layout
        y: Math.floor(index / 3) * 200,
        z: bucket.count * 10, // Height based on task count
        elevation: bucket.metadata?.horizonLevel || 0
      },
      visualization: {
        shape: viewType === 'horizon' ? 'mountain' : viewType === 'urgency' ? 'traffic-light' : 'building',
        height: Math.max(50, bucket.count * 5),
        opacity: bucket.count > 0 ? 1.0 : 0.3,
        animation: bucket.metadata?.urgencyLevel === 'critical' ? 'pulse' : 'none'
      }
    }));

    res.json({
      success: true,
      data: {
        ...standardData.data,
        buckets: enhanced3DBuckets,
        view3D: {
          camera: {
            position: { x: 0, y: -500, z: 300 },
            target: { x: 300, y: 200, z: 0 }
          },
          lighting: {
            ambient: 0.4,
            directional: { intensity: 0.8, position: { x: 100, y: 100, z: 100 } }
          },
          controls: {
            zoom: true,
            rotate: true,
            pan: true
          }
        }
      }
    });

  } catch (error) {
    logger.error(`Error getting 3D bucket view ${req.params.viewType}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to get 3D bucket view: ${req.params.viewType}`
    });
  }
});

export default router;