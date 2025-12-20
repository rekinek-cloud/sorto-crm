import { apiClient } from './client';
import { KanbanColumn, Deal, Task } from '@/types/views';
import { CalendarEvent } from '@/components/views/Calendar/Calendar';

export const viewsApi = {
  // Kanban Views
  async getKanbanViews() {
    const response = await apiClient.get('/views/kanban');
    return response.data;
  },

  async getKanbanData(viewId: string) {
    const response = await apiClient.get(`/views/kanban/${viewId}/data`);
    return response.data;
  },

  async moveKanbanCard(viewId: string, data: {
    dealId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
  }) {
    const response = await apiClient.post(`/views/kanban/${viewId}/move`, data);
    return response.data;
  },

  // List Views
  async getTasks(filters?: {
    priority?: string;
    context?: string;
    completed?: boolean;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get(`/views/list/tasks?${params.toString()}`);
    return response.data;
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    const response = await apiClient.put(`/views/tasks/${taskId}`, updates);
    return response.data;
  },

  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>) {
    const response = await apiClient.post('/views/tasks/bulk-update', {
      taskIds,
      updates
    });
    return response.data;
  },

  // View Configurations
  async getViews(type: 'kanban' | 'gantt' | 'scrum' | 'calendar' | 'list') {
    const response = await apiClient.get(`/views/${type}`);
    return response.data;
  },

  async createView(type: string, data: {
    viewName: string;
    configuration: any;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    const response = await apiClient.post(`/views/${type}`, data);
    return response.data;
  }
};

// Helper functions to convert existing data to new format
export const dataConverters = {
  // Convert deals API response to Kanban format
  convertDealsToKanban(deals: any[], pipeline: any[]): any[] {
    const stageMap: { [key: string]: string } = {
      'PROSPECT': 'Prospecting',
      'QUALIFIED': 'Qualified',
      'PROPOSAL': 'Proposal',
      'NEGOTIATION': 'Negotiation',
      'CLOSED_WON': 'Closed Won',
      'CLOSED_LOST': 'Closed Lost'
    };

    const stageColors: { [key: string]: string } = {
      'PROSPECT': '#3B82F6',
      'QUALIFIED': '#10B981',
      'PROPOSAL': '#F59E0B',
      'NEGOTIATION': '#EF4444',
      'CLOSED_WON': '#8B5CF6',
      'CLOSED_LOST': '#6B7280'
    };

    return pipeline.map((stage, index) => {
      const stageDeals = deals.filter(deal => deal.stage === stage.stage);
      
      return {
        id: stage.stage.toLowerCase(),
        title: stageMap[stage.stage] || stage.stage,
        deals: stageDeals.map(deal => ({
          id: deal.id,
          title: deal.title,
          company: deal.company?.name || 'Unknown Company',
          value: deal.value || 0,
          probability: deal.probability || 50,
          assignee: {
            id: deal.assignedTo?.id || '1',
            name: deal.assignedTo?.name || 'Unassigned',
            email: deal.assignedTo?.email || ''
          },
          priority: deal.priority?.toLowerCase() || 'medium',
          dueDate: deal.closeDate ? new Date(deal.closeDate) : undefined,
          nextAction: {
            id: Math.random().toString(),
            type: 'follow_up',
            description: 'Follow up with client',
            context: '@calls' as any,
            estimatedTime: 30
          },
          aiInsights: []
        })) as any,
        totalValue: stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        color: stageColors[stage.stage] || '#6B7280',
        order: index + 1
      };
    });
  },

  // Convert projects API response to Kanban format
  convertProjectsToKanban(projects: any[]): any[] {
    const statusMap: { [key: string]: string } = {
      'PLANNING': 'Planning',
      'IN_PROGRESS': 'In Progress',
      'ON_HOLD': 'On Hold',
      'COMPLETED': 'Completed',
      'ARCHIVED': 'Archived'
    };

    const statusColors: { [key: string]: string } = {
      'PLANNING': '#3B82F6',
      'IN_PROGRESS': '#F59E0B',
      'ON_HOLD': '#6B7280',
      'COMPLETED': '#10B981',
      'ARCHIVED': '#8B5CF6'
    };

    const statuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

    return statuses.map((status, index) => {
      const statusProjects = projects.filter(project => project.status === status);
      
      return {
        id: status.toLowerCase(),
        title: statusMap[status] || status,
        deals: statusProjects.map(project => ({
          id: project.id,
          title: project.name,
          company: project.stream?.name || 'No Stream',
          value: project.budget || 0,
          probability: Math.round(project.stats?.progress || 0),
          assignee: {
            id: project.createdBy?.id || '1',
            name: project.createdBy?.firstName ? `${project.createdBy.firstName} ${project.createdBy.lastName}` : 'Unassigned',
            email: project.createdBy?.email || ''
          },
          priority: project.priority?.toLowerCase() || 'medium',
          dueDate: project.endDate ? new Date(project.endDate) : undefined,
          nextAction: {
            id: Math.random().toString(),
            type: 'task',
            description: project.description || 'Work on project',
            context: '@computer',
            estimatedTime: 60
          }
        })),
        totalValue: statusProjects.reduce((sum, project) => sum + (project.budget || 0), 0),
        color: statusColors[status] || '#6B7280',
        order: index + 1
      };
    });
  },

  // Convert companies API response to Kanban format
  convertCompaniesToKanban(companies: any[]): any[] {
    const statusMap: { [key: string]: string } = {
      'PROSPECT': 'Prospects',
      'CUSTOMER': 'Customers',
      'PARTNER': 'Partners',
      'INACTIVE': 'Inactive',
      'ARCHIVED': 'Archived'
    };

    const statusColors: { [key: string]: string } = {
      'PROSPECT': '#3B82F6',
      'CUSTOMER': '#10B981',
      'PARTNER': '#8B5CF6',
      'INACTIVE': '#6B7280',
      'ARCHIVED': '#9CA3AF'
    };

    const statuses = ['PROSPECT', 'CUSTOMER', 'PARTNER', 'INACTIVE', 'ARCHIVED'];

    return statuses.map((status, index) => {
      const statusCompanies = companies.filter(company => company.status === status);
      
      return {
        id: status.toLowerCase(),
        title: statusMap[status] || status,
        deals: statusCompanies.map(company => ({
          id: company.id,
          title: company.name,
          company: company.industry || 'Unknown Industry',
          value: company.revenue ? parseFloat(company.revenue.replace(/[^0-9.-]+/g, '')) : 0,
          probability: 50, // Default probability for companies
          assignee: {
            id: company.primaryContact?.id || '1',
            name: company.primaryContact ? `${company.primaryContact.firstName} ${company.primaryContact.lastName}` : 'No Contact',
            email: company.primaryContact?.email || ''
          },
          priority: company.size === 'ENTERPRISE' ? 'high' : company.size === 'LARGE' ? 'medium' : 'low',
          dueDate: undefined,
          nextAction: {
            id: Math.random().toString(),
            type: 'contact',
            description: 'Follow up with company',
            context: '@calls',
            estimatedTime: 30
          }
        })),
        totalValue: statusCompanies.reduce((sum, company) => sum + (company.revenue ? parseFloat(company.revenue.replace(/[^0-9.-]+/g, '')) : 0), 0),
        color: statusColors[status] || '#6B7280',
        order: index + 1
      };
    });
  },

  // Convert contacts API response to Kanban format (grouped by company)
  convertContactsToKanban(contacts: any[], companies: any[]): any[] {
    // Group contacts by company
    const contactsByCompany = contacts.reduce((acc: any, contact) => {
      const companyId = contact.companyId || 'no_company';
      const companyName = contact.assignedCompany?.name || 'No Company';
      
      if (!acc[companyId]) {
        acc[companyId] = {
          id: companyId,
          name: companyName,
          contacts: []
        };
      }
      acc[companyId].contacts.push(contact);
      return acc;
    }, {});

    // Convert to kanban columns
    return Object.values(contactsByCompany).map((group: any, index) => ({
      id: group.id,
      title: group.name,
      deals: group.contacts.map((contact: any) => ({
        id: contact.id,
        title: `${contact.firstName} ${contact.lastName}`,
        company: contact.position || 'No Position',
        value: 0, // Contacts don't have monetary value
        probability: 100, // Contacts are confirmed
        assignee: {
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email || ''
        },
        priority: contact.status === 'LEAD' ? 'high' : contact.status === 'CUSTOMER' ? 'medium' : 'low',
        dueDate: undefined,
        nextAction: {
          id: Math.random().toString(),
          type: 'call',
          description: 'Contact follow-up',
          context: '@calls',
          estimatedTime: 15
        }
      })),
      totalValue: group.contacts.length, // Number of contacts in this company
      color: `hsl(${(index * 137.5) % 360}, 50%, 50%)`, // Generate different colors
      order: index + 1
    }));
  },

  // Convert meetings API response to Kanban format (grouped by status)
  convertMeetingsToKanban(meetings: any[]): any[] {
    const statusMap: { [key: string]: string } = {
      'SCHEDULED': 'Scheduled',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELED': 'Canceled'
    };

    const statusColors: { [key: string]: string } = {
      'SCHEDULED': '#3B82F6',
      'IN_PROGRESS': '#F59E0B',
      'COMPLETED': '#10B981',
      'CANCELED': '#EF4444'
    };

    const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];

    return statuses.map((status, index) => {
      const statusMeetings = meetings.filter(meeting => meeting.status === status);
      
      return {
        id: status.toLowerCase(),
        title: statusMap[status] || status,
        deals: statusMeetings.map(meeting => ({
          id: meeting.id,
          title: meeting.title,
          company: meeting.type || 'Meeting',
          value: meeting.duration || 60, // Duration in minutes as "value"
          probability: meeting.status === 'COMPLETED' ? 100 : meeting.status === 'SCHEDULED' ? 75 : 50,
          assignee: {
            id: meeting.organizer?.id || '1',
            name: meeting.organizer ? `${meeting.organizer.firstName} ${meeting.organizer.lastName}` : 'Unassigned',
            email: meeting.organizer?.email || ''
          },
          priority: meeting.priority?.toLowerCase() || 'medium',
          dueDate: meeting.startTime ? new Date(meeting.startTime) : undefined,
          nextAction: {
            id: Math.random().toString(),
            type: 'meeting',
            description: 'Prepare for meeting',
            context: '@meetings',
            estimatedTime: 30
          }
        })),
        totalValue: statusMeetings.reduce((sum, meeting) => sum + (meeting.duration || 60), 0), // Total duration
        color: statusColors[status] || '#6B7280',
        order: index + 1
      };
    });
  },

  // Convert leads API response to Kanban format (grouped by status)
  convertLeadsToKanban(leads: any[]): any[] {
    const statusMap: { [key: string]: string } = {
      'NEW': 'New',
      'CONTACTED': 'Contacted',
      'QUALIFIED': 'Qualified',
      'PROPOSAL': 'Proposal',
      'NEGOTIATION': 'Negotiation',
      'CLOSED_WON': 'Closed Won',
      'CLOSED_LOST': 'Closed Lost'
    };

    const statusColors: { [key: string]: string } = {
      'NEW': '#3B82F6',
      'CONTACTED': '#10B981',
      'QUALIFIED': '#F59E0B',
      'PROPOSAL': '#8B5CF6',
      'NEGOTIATION': '#EF4444',
      'CLOSED_WON': '#22C55E',
      'CLOSED_LOST': '#6B7280'
    };

    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

    return statuses.map((status, index) => {
      const statusLeads = leads.filter(lead => lead.status === status);
      
      return {
        id: status.toLowerCase(),
        title: statusMap[status] || status,
        deals: statusLeads.map(lead => ({
          id: lead.id,
          title: lead.name,
          company: lead.company || 'No Company',
          value: lead.value || 0,
          probability: status === 'CLOSED_WON' ? 100 : status === 'CLOSED_LOST' ? 0 : 
                      status === 'NEGOTIATION' ? 80 : status === 'PROPOSAL' ? 60 :
                      status === 'QUALIFIED' ? 40 : status === 'CONTACTED' ? 20 : 10,
          assignee: {
            id: lead.assignedTo || '1',
            name: lead.assignedTo || 'Unassigned',
            email: lead.email || ''
          },
          priority: lead.priority?.toLowerCase() || 'medium',
          dueDate: lead.nextActionDate ? new Date(lead.nextActionDate) : undefined,
          nextAction: {
            id: Math.random().toString(),
            type: 'follow_up',
            description: lead.nextAction || 'Follow up with lead',
            context: '@calls',
            estimatedTime: 30
          }
        })),
        totalValue: statusLeads.reduce((sum, lead) => sum + (lead.value || 0), 0),
        color: statusColors[status] || '#6B7280',
        order: index + 1
      };
    });
  },

  // Convert tasks API response to List format
  convertTasksToList(tasks: any[]): any[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority?.toLowerCase() || 'medium',
      gtdContext: task.context || '@computer',
      estimatedTime: task.estimatedTime || 30,
      assignee: {
        id: task.assignedTo?.id || '1',
        name: task.assignedTo?.name || 'Unassigned',
        email: task.assignedTo?.email || ''
      },
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      deal: task.deal ? {
        id: task.deal.id,
        title: task.deal.title,
        company: task.deal.company?.name || '',
        value: task.deal.value || 0,
        probability: task.deal.probability || 50,
        assignee: task.assignee,
        priority: task.priority?.toLowerCase() || 'medium'
      } : undefined,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name,
        description: task.project.description,
        status: task.project.status
      } : undefined,
      completed: task.status === 'COMPLETED',
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    }));
  },

  // Convert meetings API response to Calendar format
  convertMeetingsToCalendar(meetings: any[]): CalendarEvent[] {
    return meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      start: new Date(meeting.startTime),
      end: meeting.endTime ? new Date(meeting.endTime) : undefined,
      type: 'meeting' as const,
      status: meeting.status,
      description: meeting.description,
      location: meeting.location || meeting.meetingUrl,
      allDay: false,
      color: meeting.status === 'COMPLETED' ? '#10B981' : 
             meeting.status === 'CANCELLED' ? '#6B7280' : '#3B82F6'
    }));
  },

  // Convert tasks API response to Calendar format
  convertTasksToCalendar(tasks: any[]): CalendarEvent[] {
    return tasks
      .filter(task => task.dueDate) // Only tasks with due dates
      .map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.dueDate),
        type: 'task' as const,
        status: task.status,
        priority: task.priority?.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
        description: task.description,
        allDay: true,
        color: task.priority === 'URGENT' ? '#EF4444' :
               task.priority === 'HIGH' ? '#F59E0B' :
               task.priority === 'MEDIUM' ? '#3B82F6' : '#10B981'
      }));
  },

  // Convert projects API response to Calendar format
  convertProjectsToCalendar(projects: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    projects.forEach(project => {
      // Add start date event
      if (project.startDate) {
        events.push({
          id: `${project.id}-start`,
          title: `📅 ${project.name} - Start`,
          start: new Date(project.startDate),
          type: 'project' as const,
          status: project.status,
          description: `Project start: ${project.description || ''}`,
          allDay: true,
          color: '#8B5CF6'
        });
      }

      // Add end date event
      if (project.endDate) {
        events.push({
          id: `${project.id}-end`,
          title: `🏁 ${project.name} - Deadline`,
          start: new Date(project.endDate),
          type: 'project' as const,
          status: project.status,
          description: `Project deadline: ${project.description || ''}`,
          allDay: true,
          color: project.status === 'COMPLETED' ? '#10B981' : '#F59E0B'
        });
      }
    });

    return events;
  },

  // Convert leads API response to Calendar format
  convertLeadsToCalendar(leads: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    
    leads.forEach(lead => {
      // Add next action date
      if (lead.nextActionDate) {
        events.push({
          id: `${lead.id}-action`,
          title: `📞 Follow-up: ${lead.name}`,
          start: new Date(lead.nextActionDate),
          type: 'lead' as const,
          status: lead.status,
          priority: lead.priority?.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
          description: `Follow-up with ${lead.name} (${lead.company || 'No company'})`,
          allDay: true,
          color: '#EF4444'
        });
      }

      // Add last contact date for reference
      if (lead.lastContact) {
        events.push({
          id: `${lead.id}-contact`,
          title: `📋 Last contact: ${lead.name}`,
          start: new Date(lead.lastContact),
          type: 'lead' as const,
          status: lead.status,
          description: `Last contact with ${lead.name}`,
          allDay: true,
          color: '#6B7280'
        });
      }
    });

    return events;
  },

  // Convert deals API response to Calendar format
  convertDealsToCalendar(deals: any[]): CalendarEvent[] {
    return deals
      .filter(deal => deal.closeDate || deal.expectedCloseDate)
      .map(deal => {
        const closeDate = deal.actualCloseDate || deal.expectedCloseDate || deal.closeDate;
        return {
          id: deal.id,
          title: `💰 ${deal.title} - ${deal.actualCloseDate ? 'Closed' : 'Expected Close'}`,
          start: new Date(closeDate),
          type: 'deal' as const,
          status: deal.stage || deal.status,
          description: `Deal: ${deal.title} (${deal.company?.name || 'No company'}) - ${deal.value || 0} ${deal.currency || 'USD'}`,
          allDay: true,
          color: deal.actualCloseDate ? 
                 (deal.stage === 'CLOSED_WON' ? '#10B981' : '#6B7280') : '#F59E0B'
        };
      });
  },

  // Convert unified events for dashboard calendar
  convertUnifiedToCalendar(data: {
    meetings?: any[];
    tasks?: any[];
    projects?: any[];
    leads?: any[];
    deals?: any[];
  }): CalendarEvent[] {
    const allEvents: CalendarEvent[] = [];

    if (data.meetings) {
      allEvents.push(...this.convertMeetingsToCalendar(data.meetings));
    }
    
    if (data.tasks) {
      allEvents.push(...this.convertTasksToCalendar(data.tasks));
    }
    
    if (data.projects) {
      allEvents.push(...this.convertProjectsToCalendar(data.projects));
    }
    
    if (data.leads) {
      allEvents.push(...this.convertLeadsToCalendar(data.leads));
    }
    
    if (data.deals) {
      allEvents.push(...this.convertDealsToCalendar(data.deals));
    }

    // Sort by date
    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }
};