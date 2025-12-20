import { PrismaClient, LeadStatus, MeetingStatus, TimelineStatus, ActivityType,
         DependencyType, RelationshipType, SprintStatus, ViewType, TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Faza 2: CRM Extended & Project Management seeding...');

  // Get existing organization
  const organization = await prisma.organization.findFirst({
    where: { slug: 'demo-org' }
  });

  if (!organization) {
    throw new Error('Organization not found. Run basic seed first.');
  }

  // Get existing users, companies, contacts, tasks, projects
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id }
  });

  const companies = await prisma.company.findMany({
    where: { organizationId: organization.id }
  });

  const contacts = await prisma.contact.findMany({
    where: { organizationId: organization.id }
  });

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id }
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id }
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // CRM EXTENDED SYSTEM (4 tabel)
  // ================================

  console.log('🎯 Creating Leads...');
  
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        title: 'Enterprise CRM Implementation - FinTech Startup',
        description: 'Young fintech company looking for comprehensive CRM solution to manage their growing customer base and complex sales processes.',
        company: 'MoneyFlow Technologies Inc.',
        contactPerson: 'Sarah Johnson, CTO',
        status: LeadStatus.QUALIFIED,
        priority: Priority.HIGH,
        source: 'LinkedIn outreach campaign',
        value: 15000.00,
        organizationId: organization.id
      }
    }),

    prisma.lead.create({
      data: {
        title: 'CRM-GTD Pro License - Marketing Agency',
        description: 'Digital marketing agency needs productivity solution for managing multiple client campaigns and internal projects.',
        company: 'Creative Digital Solutions',
        contactPerson: 'Michael Chen, Operations Director',
        status: LeadStatus.PROPOSAL,
        priority: Priority.MEDIUM,
        source: 'Trade show contact - MarTech 2024',
        value: 8500.00,
        organizationId: organization.id
      }
    }),

    prisma.lead.create({
      data: {
        title: 'Voice TTS Integration - Healthcare Provider',
        description: 'Regional healthcare network interested in voice accessibility features for their patient communication system.',
        company: 'Regional Health Network',
        contactPerson: 'Dr. Emily Rodriguez, Chief Medical Officer',
        status: LeadStatus.CONTACTED,
        priority: Priority.MEDIUM,
        source: 'Healthcare technology webinar',
        value: 4200.00,
        organizationId: organization.id
      }
    }),

    prisma.lead.create({
      data: {
        title: 'Multi-Department Productivity Training - Manufacturing',
        description: 'Large manufacturing company wants to implement GTD methodology across 5 departments to improve operational efficiency.',
        company: 'Industrial Solutions Corp',
        contactPerson: 'Robert Thompson, HR Director',
        status: LeadStatus.NEGOTIATION,
        priority: Priority.HIGH,
        source: 'Direct referral from existing client',
        value: 22000.00,
        organizationId: organization.id
      }
    }),

    prisma.lead.create({
      data: {
        title: 'Custom Integration Development - E-commerce Platform',
        description: 'E-commerce platform needs custom integration with their existing inventory and customer support systems.',
        company: 'ShopEasy Platform',
        contactPerson: 'Lisa Wang, Technical Lead',
        status: LeadStatus.NEW,
        priority: Priority.LOW,
        source: 'Cold email campaign',
        value: 12000.00,
        organizationId: organization.id
      }
    }),

    prisma.lead.create({
      data: {
        title: 'Enterprise Support Contract - Financial Services',
        description: 'Investment firm looking for premium technical support with dedicated account manager and SLA guarantees.',
        company: 'Sterling Investment Partners',
        contactPerson: 'James Mitchell, IT Director',
        status: LeadStatus.WON,
        priority: Priority.HIGH,
        source: 'Partner referral program',
        value: 18000.00,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${leads.length} leads`);

  console.log('📅 Creating Meetings...');
  
  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'Enterprise Demo - MoneyFlow Technologies',
        description: 'Comprehensive product demonstration focusing on financial services specific features and compliance requirements.',
        startTime: new Date('2024-07-20T14:00:00Z'),
        endTime: new Date('2024-07-20T15:30:00Z'),
        location: 'Client office - Downtown Financial District',
        meetingUrl: 'https://zoom.us/j/1234567890',
        agenda: `
        1. Welcome and introductions (10 min)
        2. FinTech industry challenges overview (15 min)
        3. CRM-GTD Enterprise demo (45 min)
        4. Compliance and security features (15 min)
        5. Q&A and next steps (15 min)
        `,
        notes: 'High-value prospect. CEO and CTO will attend. Focus on ROI and regulatory compliance.',
        status: MeetingStatus.SCHEDULED,
        organizationId: organization.id,
        organizedById: primaryUser.id,
        contactId: contacts.length > 0 ? contacts[0].id : null
      }
    }),

    prisma.meeting.create({
      data: {
        title: 'Weekly Sales Pipeline Review',
        description: 'Internal team meeting to review current sales pipeline, discuss deal progression, and plan follow-up actions.',
        startTime: new Date('2024-07-22T09:00:00Z'),
        endTime: new Date('2024-07-22T10:00:00Z'),
        location: 'Conference Room A',
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/...',
        agenda: `
        1. Pipeline overview and metrics (15 min)
        2. Deal progression updates (20 min)
        3. Blockers and challenges (15 min)
        4. Action items for next week (10 min)
        `,
        notes: 'Regular Monday morning pipeline review. All sales team members required.',
        status: MeetingStatus.SCHEDULED,
        organizationId: organization.id,
        organizedById: primaryUser.id
      }
    }),

    prisma.meeting.create({
      data: {
        title: 'Healthcare Integration Planning - Regional Health',
        description: 'Technical planning session to discuss Voice TTS integration requirements and implementation timeline.',
        startTime: new Date('2024-07-18T11:00:00Z'),
        endTime: new Date('2024-07-18T12:30:00Z'),
        location: 'Virtual meeting',
        meetingUrl: 'https://webex.com/meet/crm-gtd-health-integration',
        agenda: `
        1. Current system architecture review (20 min)
        2. Voice TTS integration requirements (30 min)
        3. Security and HIPAA compliance (20 min)
        4. Implementation timeline (20 min)
        `,
        notes: 'Technical deep-dive with their IT team. Need to address HIPAA compliance thoroughly.',
        status: MeetingStatus.COMPLETED,
        organizationId: organization.id,
        organizedById: primaryUser.id,
        contactId: contacts.length > 1 ? contacts[1].id : null
      }
    }),

    prisma.meeting.create({
      data: {
        title: 'Product Roadmap Planning - Q3 2024',
        description: 'Strategic planning session to define product development priorities for Q3 2024 based on customer feedback and market demands.',
        startTime: new Date('2024-07-16T13:00:00Z'),
        endTime: new Date('2024-07-16T16:00:00Z'),
        location: 'Innovation Lab',
        agenda: `
        1. Q2 achievements review (30 min)
        2. Customer feedback analysis (45 min)
        3. Market trends and competition (30 min)
        4. Q3 feature prioritization (90 min)
        5. Resource allocation (45 min)
        `,
        notes: 'Cross-functional meeting with Product, Engineering, Sales, and Marketing teams.',
        status: MeetingStatus.COMPLETED,
        organizationId: organization.id,
        organizedById: primaryUser.id
      }
    }),

    prisma.meeting.create({
      data: {
        title: 'Customer Success Check-in - TechCorp Inc.',
        description: 'Quarterly business review with our enterprise client to discuss usage metrics, satisfaction, and expansion opportunities.',
        startTime: new Date('2024-07-25T10:00:00Z'),
        endTime: new Date('2024-07-25T11:00:00Z'),
        location: 'TechCorp headquarters',
        meetingUrl: 'https://gotomeeting.com/join/...',
        agenda: `
        1. Usage metrics and ROI analysis (15 min)
        2. User feedback and satisfaction survey (15 min)
        3. New features overview (15 min)
        4. Expansion opportunities discussion (15 min)
        `,
        notes: 'Opportunity to discuss additional licenses and premium features. Prepare ROI report.',
        status: MeetingStatus.SCHEDULED,
        organizationId: organization.id,
        organizedById: primaryUser.id,
        contactId: contacts.length > 2 ? contacts[2].id : null
      }
    })
  ]);

  console.log(`✅ Created ${meetings.length} meetings`);

  console.log('📈 Creating Timeline events...');
  
  const timelineEvents = await Promise.all([
    prisma.timeline.create({
      data: {
        eventId: 'PROD-LAUNCH-V2.1',
        eventType: 'product_launch',
        title: 'CRM-GTD Smart v2.1 Release',
        startDate: new Date('2024-08-01T00:00:00Z'),
        endDate: new Date('2024-08-01T23:59:59Z'),
        status: TimelineStatus.SCHEDULED,
        organizationId: organization.id
      }
    }),

    prisma.timeline.create({
      data: {
        eventId: 'DEMO-MONEYFLOW-001',
        eventType: 'sales_demo',
        title: 'MoneyFlow Technologies Enterprise Demo',
        startDate: new Date('2024-07-20T14:00:00Z'),
        endDate: new Date('2024-07-20T15:30:00Z'),
        status: TimelineStatus.SCHEDULED,
        organizationId: organization.id
      }
    }),

    prisma.timeline.create({
      data: {
        eventId: 'MAINT-DB-UPGRADE',
        eventType: 'maintenance',
        title: 'Database Infrastructure Upgrade',
        startDate: new Date('2024-07-28T02:00:00Z'),
        endDate: new Date('2024-07-28T06:00:00Z'),
        status: TimelineStatus.SCHEDULED,
        organizationId: organization.id
      }
    }),

    prisma.timeline.create({
      data: {
        eventId: 'TRAIN-GTD-WORKSHOP',
        eventType: 'training',
        title: 'Internal GTD Methodology Workshop',
        startDate: new Date('2024-07-19T09:00:00Z'),
        endDate: new Date('2024-07-19T17:00:00Z'),
        status: TimelineStatus.COMPLETED,
        organizationId: organization.id
      }
    }),

    prisma.timeline.create({
      data: {
        eventId: 'CONF-MARTECH-2024',
        eventType: 'conference',
        title: 'MarTech Conference 2024 - Booth Exhibition',
        startDate: new Date('2024-09-15T08:00:00Z'),
        endDate: new Date('2024-09-17T18:00:00Z'),
        status: TimelineStatus.SCHEDULED,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${timelineEvents.length} timeline events`);

  console.log('⚡ Creating Activities...');
  
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        type: ActivityType.DEAL_CREATED,
        title: 'New Enterprise Deal - MoneyFlow Technologies',
        description: 'Created high-value enterprise deal for fintech implementation project',
        metadata: {
          dealValue: 15000,
          expectedCloseDate: '2024-08-15',
          dealStage: 'qualification',
          probabilityScore: 75
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        companyId: companies.length > 0 ? companies[0].id : null,
        contactId: contacts.length > 0 ? contacts[0].id : null
      }
    }),

    prisma.activity.create({
      data: {
        type: ActivityType.EMAIL_SENT,
        title: 'Follow-up Email - Healthcare Integration',
        description: 'Sent technical proposal and compliance documentation to Regional Health Network',
        metadata: {
          emailSubject: 'Voice TTS Integration Proposal - HIPAA Compliant Solution',
          recipientCount: 3,
          attachments: ['TechnicalProposal_v2.pdf', 'HIPAA_Compliance_Guide.pdf']
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        communicationType: 'email',
        communicationDirection: 'outbound',
        communicationSubject: 'Voice TTS Integration Proposal - HIPAA Compliant Solution',
        communicationBody: 'Dear Dr. Rodriguez, Please find attached our technical proposal for the Voice TTS integration. We have included comprehensive HIPAA compliance documentation...',
        communicationStatus: 'sent'
      }
    }),

    prisma.activity.create({
      data: {
        type: ActivityType.MEETING_COMPLETED,
        title: 'Q3 Product Roadmap Planning Session Completed',
        description: 'Successfully completed strategic planning session with cross-functional team',
        metadata: {
          attendeeCount: 12,
          duration: 180,
          decisions: ['Voice TTS v2.0 prioritized', 'Mobile app moved to Q4', 'API v3 development approved'],
          actionItems: 8
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        meetingId: meetings[3].id,
        communicationType: 'meeting',
        communicationDuration: 180,
        communicationStatus: 'completed'
      }
    }),

    prisma.activity.create({
      data: {
        type: ActivityType.TASK_COMPLETED,
        title: 'Technical Documentation Update Completed',
        description: 'Updated Voice TTS integration documentation with new security features',
        metadata: {
          taskCategory: 'documentation',
          timeSpent: 4.5,
          filesUpdated: ['VoiceTTS_API_Guide.md', 'Security_Features.md', 'Integration_Examples.md']
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        taskId: tasks.length > 0 ? tasks[0].id : null
      }
    }),

    prisma.activity.create({
      data: {
        type: ActivityType.CONTACT_UPDATED,
        title: 'Contact Information Updated - Sterling Investment',
        description: 'Updated contact details and preferences for James Mitchell',
        metadata: {
          fieldsUpdated: ['phone', 'communicationPreference', 'timezone'],
          updatedBy: primaryUser.id,
          reason: 'client request during onboarding call'
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        contactId: contacts.length > 1 ? contacts[1].id : null
      }
    }),

    prisma.activity.create({
      data: {
        type: ActivityType.DEAL_STAGE_CHANGED,
        title: 'Deal Advanced to Negotiation - Industrial Solutions',
        description: 'Manufacturing deal progressed from Proposal to Negotiation stage',
        metadata: {
          previousStage: 'proposal',
          currentStage: 'negotiation',
          stageChangeReason: 'positive response to training proposal',
          nextMilestone: 'contract review meeting'
        },
        organizationId: organization.id,
        userId: primaryUser.id,
        companyId: companies.length > 1 ? companies[1].id : null
      }
    })
  ]);

  console.log(`✅ Created ${activities.length} activities`);

  // ================================
  // PROJECT MANAGEMENT SYSTEM (7 tabel)
  // ================================

  console.log('🔗 Creating Project Dependencies...');
  
  let projectDependencies: any[] = [];
  if (projects.length >= 2) {
    projectDependencies = await Promise.all([
      prisma.projectDependency.create({
        data: {
          type: DependencyType.FINISH_TO_START,
          isCriticalPath: true,
          sourceProjectId: projects[0].id, // First project must finish
          dependentProjectId: projects[1].id // Before second can start
        }
      }),

      prisma.projectDependency.create({
        data: {
          type: DependencyType.START_TO_START,
          isCriticalPath: false,
          sourceProjectId: projects[1].id,
          dependentProjectId: projects.length > 2 ? projects[2].id : projects[0].id
        }
      })
    ]);
  }

  console.log(`✅ Created ${projectDependencies.length} project dependencies`);

  console.log('🔗 Creating Task Dependencies...');
  
  let taskDependencies: any[] = [];
  if (tasks.length >= 4) {
    taskDependencies = await Promise.all([
      prisma.taskDependency.create({
        data: {
          predecessorId: tasks[0].id,
          successorId: tasks[1].id,
          dependencyType: 'finish_to_start',
          lagDays: 1
        }
      }),

      prisma.taskDependency.create({
        data: {
          predecessorId: tasks[1].id,
          successorId: tasks[2].id,
          dependencyType: 'finish_to_start',
          lagDays: 0
        }
      }),

      prisma.taskDependency.create({
        data: {
          predecessorId: tasks[0].id,
          successorId: tasks[3].id,
          dependencyType: 'start_to_start',
          lagDays: 2
        }
      })
    ]);
  }

  console.log(`✅ Created ${taskDependencies.length} task dependencies`);

  console.log('🔗 Creating Task Relationships...');
  
  let taskRelationships: any[] = [];
  if (tasks.length >= 3) {
    taskRelationships = await Promise.all([
      prisma.taskRelationship.create({
        data: {
          type: RelationshipType.FINISH_TO_START,
          lag: '1d',
          isCriticalPath: true,
          notes: 'Database setup must complete before API development can begin',
          fromTaskId: tasks[0].id,
          toTaskId: tasks[1].id
        }
      }),

      prisma.taskRelationship.create({
        data: {
          type: RelationshipType.START_TO_START,
          lag: '2d',
          isCriticalPath: false,
          notes: 'UI development can start 2 days after API development begins',
          fromTaskId: tasks[1].id,
          toTaskId: tasks[2].id
        }
      })
    ]);
  }

  console.log(`✅ Created ${taskRelationships.length} task relationships`);

  console.log('📜 Creating Task History...');
  
  let taskHistory: any[] = [];
  if (tasks.length > 0) {
    taskHistory = await Promise.all([
      prisma.taskHistory.create({
        data: {
          fieldName: 'status',
          oldValue: 'NEW',
          newValue: 'IN_PROGRESS',
          changedBy: primaryUser.id,
          changeDate: new Date('2024-07-15T10:30:00Z'),
          taskId: tasks[0].id
        }
      }),

      prisma.taskHistory.create({
        data: {
          fieldName: 'priority',
          oldValue: 'MEDIUM',
          newValue: 'HIGH',
          changedBy: primaryUser.id,
          changeDate: new Date('2024-07-16T14:15:00Z'),
          taskId: tasks[0].id
        }
      }),

      prisma.taskHistory.create({
        data: {
          fieldName: 'assignedTo',
          oldValue: null,
          newValue: users.length > 1 ? users[1].id : primaryUser.id,
          changedBy: primaryUser.id,
          changeDate: new Date('2024-07-17T09:45:00Z'),
          taskId: tasks.length > 1 ? tasks[1].id : tasks[0].id
        }
      }),

      prisma.taskHistory.create({
        data: {
          fieldName: 'dueDate',
          oldValue: '2024-07-30',
          newValue: '2024-07-25',
          changedBy: primaryUser.id,
          changeDate: new Date('2024-07-18T16:20:00Z'),
          taskId: tasks.length > 1 ? tasks[1].id : tasks[0].id
        }
      }),

      prisma.taskHistory.create({
        data: {
          fieldName: 'status',
          oldValue: 'IN_PROGRESS',
          newValue: 'COMPLETED',
          changedBy: users.length > 1 ? users[1].id : primaryUser.id,
          changeDate: new Date('2024-07-19T17:30:00Z'),
          taskId: tasks.length > 2 ? tasks[2].id : tasks[0].id
        }
      })
    ]);
  }

  console.log(`✅ Created ${taskHistory.length} task history records`);

  console.log('🔗 Creating General Dependencies...');
  
  const dependencies = await Promise.all([
    prisma.dependency.create({
      data: {
        type: DependencyType.FINISH_TO_START,
        isCriticalPath: true,
        sourceId: projects.length > 0 ? projects[0].id : 'mock-project-1',
        sourceType: 'project',
        targetId: tasks.length > 0 ? tasks[0].id : 'mock-task-1',
        targetType: 'task'
      }
    }),

    prisma.dependency.create({
      data: {
        type: DependencyType.START_TO_START,
        isCriticalPath: false,
        sourceId: tasks.length > 0 ? tasks[0].id : 'mock-task-1',
        sourceType: 'task',
        targetId: tasks.length > 1 ? tasks[1].id : 'mock-task-2',
        targetType: 'task'
      }
    }),

    prisma.dependency.create({
      data: {
        type: DependencyType.FINISH_TO_FINISH,
        isCriticalPath: false,
        sourceId: projects.length > 1 ? projects[1].id : 'mock-project-2',
        sourceType: 'project',
        targetId: projects.length > 2 ? projects[2].id : projects[0].id,
        targetType: 'project'
      }
    })
  ]);

  console.log(`✅ Created ${dependencies.length} general dependencies`);

  console.log('🛤️ Creating Critical Path...');
  
  let criticalPaths: any[] = [];
  if (projects.length > 0 && tasks.length >= 3) {
    criticalPaths = await Promise.all([
      prisma.criticalPath.create({
        data: {
          tasks: [tasks[0].id, tasks[1].id, tasks[2].id],
          totalDuration: '15d',
          earliestCompletion: new Date('2024-08-10T17:00:00Z'),
          slack: '0d',
          projectId: projects[0].id
        }
      }),

      prisma.criticalPath.create({
        data: {
          tasks: projects.length > 1 && tasks.length >= 4 ? [tasks[1].id, tasks[3].id] : [tasks[0].id, tasks[1].id],
          totalDuration: '8d',
          earliestCompletion: new Date('2024-07-30T17:00:00Z'),
          slack: '2d',
          projectId: projects.length > 1 ? projects[1].id : projects[0].id
        }
      })
    ]);
  }

  console.log(`✅ Created ${criticalPaths.length} critical paths`);

  console.log('🏃 Creating Sprints...');
  
  const sprints = await Promise.all([
    prisma.sprint.create({
      data: {
        organizationId: organization.id,
        name: 'Sprint 15 - Voice TTS Enhancement',
        goal: 'Complete Voice TTS v2.0 features including multilingual support and improved speech quality',
        startDate: new Date('2024-07-15T00:00:00Z'),
        endDate: new Date('2024-07-29T00:00:00Z'),
        velocity: 42,
        status: SprintStatus.ACTIVE
      }
    }),

    prisma.sprint.create({
      data: {
        organizationId: organization.id,
        name: 'Sprint 16 - Enterprise Security Features',
        goal: 'Implement advanced security features for enterprise clients including SSO and audit logging',
        startDate: new Date('2024-07-30T00:00:00Z'),
        endDate: new Date('2024-08-13T00:00:00Z'),
        velocity: 38,
        status: SprintStatus.PLANNED
      }
    }),

    prisma.sprint.create({
      data: {
        organizationId: organization.id,
        name: 'Sprint 14 - Smart Mailboxes Polish',
        goal: 'Finalize Smart Mailboxes features and prepare for production release',
        startDate: new Date('2024-07-01T00:00:00Z'),
        endDate: new Date('2024-07-14T00:00:00Z'),
        velocity: 45,
        status: SprintStatus.COMPLETED
      }
    }),

    prisma.sprint.create({
      data: {
        organizationId: organization.id,
        name: 'Sprint 17 - Mobile App Foundation',
        goal: 'Begin mobile application development with basic authentication and dashboard views',
        startDate: new Date('2024-08-14T00:00:00Z'),
        endDate: new Date('2024-08-28T00:00:00Z'),
        velocity: 35,
        status: SprintStatus.PLANNED
      }
    })
  ]);

  console.log(`✅ Created ${sprints.length} sprints`);

  // ================================
  // KANBAN & VIEWS SYSTEM (3 tabel)
  // ================================

  console.log('📋 Creating View Configurations...');
  
  const viewConfigurations = await Promise.all([
    prisma.viewConfiguration.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.KANBAN,
        viewName: 'Sales Pipeline Kanban',
        configuration: {
          columns: [
            { id: '1', title: 'Prospects', status: 'NEW', color: '#6366F1' },
            { id: '2', title: 'Qualified', status: 'QUALIFIED', color: '#8B5CF6' },
            { id: '3', title: 'Proposal', status: 'PROPOSAL', color: '#A855F7' },
            { id: '4', title: 'Negotiation', status: 'NEGOTIATION', color: '#EC4899' },
            { id: '5', title: 'Closed Won', status: 'WON', color: '#10B981' },
            { id: '6', title: 'Closed Lost', status: 'LOST', color: '#EF4444' }
          ],
          filters: {
            priority: ['HIGH', 'MEDIUM'],
            dateRange: 'current_quarter'
          },
          sorting: {
            field: 'value',
            direction: 'desc'
          }
        },
        isDefault: true,
        isPublic: false
      }
    }),

    prisma.viewConfiguration.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.GANTT,
        viewName: 'Project Timeline - Q3 2024',
        configuration: {
          timeframe: {
            start: '2024-07-01',
            end: '2024-09-30',
            scale: 'weeks'
          },
          showDependencies: true,
          showCriticalPath: true,
          groupBy: 'project',
          filters: {
            status: ['IN_PROGRESS', 'PLANNING'],
            priority: ['HIGH', 'MEDIUM']
          }
        },
        isDefault: false,
        isPublic: true
      }
    }),

    prisma.viewConfiguration.create({
      data: {
        userId: users.length > 1 ? users[1].id : primaryUser.id,
        viewType: ViewType.SCRUM,
        viewName: 'Development Sprint Board',
        configuration: {
          sprintId: sprints[0].id,
          swimlanes: {
            groupBy: 'assignee',
            showSubtasks: true
          },
          columns: [
            { id: '1', title: 'Backlog', status: 'NEW', wipLimit: null },
            { id: '2', title: 'In Progress', status: 'IN_PROGRESS', wipLimit: 3 },
            { id: '3', title: 'Code Review', status: 'WAITING', wipLimit: 2 },
            { id: '4', title: 'Testing', status: 'WAITING', wipLimit: 2 },
            { id: '5', title: 'Done', status: 'COMPLETED', wipLimit: null }
          ],
          burndownChart: {
            showIdealLine: true,
            includeWeekends: false
          }
        },
        isDefault: false,
        isPublic: true
      }
    }),

    prisma.viewConfiguration.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.CALENDAR,
        viewName: 'Team Schedule Overview',
        configuration: {
          defaultView: 'month',
          eventTypes: ['meetings', 'deadlines', 'milestones'],
          colorCoding: {
            meetings: '#3B82F6',
            deadlines: '#EF4444',
            milestones: '#10B981'
          },
          filters: {
            teams: ['sales', 'development', 'marketing'],
            priorities: ['HIGH', 'MEDIUM']
          }
        },
        isDefault: false,
        isPublic: true
      }
    })
  ]);

  console.log(`✅ Created ${viewConfigurations.length} view configurations`);

  console.log('📋 Creating Kanban Columns...');
  
  // Create kanban columns for the Sales Pipeline view
  const kanbanColumns = await Promise.all([
    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[0].id, // Sales Pipeline Kanban
        title: 'New Prospects',
        position: 1,
        color: '#6366F1',
        wipLimit: null,
        columnType: 'stage',
        configuration: {
          autoAssignRules: {
            leadSource: ['website', 'referral'],
            valueThreshold: 5000
          },
          notifications: {
            onAdd: true,
            onAging: 7 // days
          }
        }
      }
    }),

    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[0].id,
        title: 'Qualified Leads',
        position: 2,
        color: '#8B5CF6',
        wipLimit: 10,
        columnType: 'stage',
        configuration: {
          qualificationCriteria: {
            budget: 'confirmed',
            authority: 'identified',
            need: 'validated',
            timeline: 'defined'
          }
        }
      }
    }),

    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[0].id,
        title: 'Proposal Sent',
        position: 3,
        color: '#A855F7',
        wipLimit: 8,
        columnType: 'stage',
        configuration: {
          slaRules: {
            responseTime: 48, // hours
            followUpSchedule: [3, 7, 14] // days
          }
        }
      }
    }),

    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[0].id,
        title: 'Negotiation',
        position: 4,
        color: '#EC4899',
        wipLimit: 5,
        columnType: 'stage',
        configuration: {
          escalationRules: {
            managerReview: true,
            discountApproval: 15 // percent
          }
        }
      }
    }),

    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[2].id, // Development Sprint Board
        title: 'Sprint Backlog',
        position: 1,
        color: '#6B7280',
        wipLimit: null,
        columnType: 'priority',
        configuration: {
          sortBy: 'priority',
          groupBy: 'epic'
        }
      }
    }),

    prisma.kanbanColumn.create({
      data: {
        viewId: viewConfigurations[2].id,
        title: 'In Development',
        position: 2,
        color: '#3B82F6',
        wipLimit: 3,
        columnType: 'stage',
        configuration: {
          timeTracking: true,
          dailyStandupRequired: true
        }
      }
    })
  ]);

  console.log(`✅ Created ${kanbanColumns.length} kanban columns`);

  console.log('👤 Creating User View Preferences...');
  
  const userViewPreferences = await Promise.all([
    prisma.userViewPreference.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.KANBAN,
        preferences: {
          defaultFilters: {
            assignedToMe: true,
            priority: ['HIGH', 'MEDIUM']
          },
          columnWidth: 280,
          showCardDetails: true,
          autoRefresh: 30, // seconds
          compactMode: false,
          colorScheme: 'default'
        }
      }
    }),

    prisma.userViewPreference.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.GANTT,
        preferences: {
          defaultTimeframe: 'quarter',
          showWeekends: false,
          showDependencies: true,
          showCriticalPath: true,
          zoomLevel: 'weeks',
          groupBy: 'project',
          autoScrollToday: true
        }
      }
    }),

    prisma.userViewPreference.create({
      data: {
        userId: users.length > 1 ? users[1].id : primaryUser.id,
        viewType: ViewType.SCRUM,
        preferences: {
          showBurndownChart: true,
          swimlaneGrouping: 'assignee',
          estimationUnit: 'story_points',
          showSubtasks: true,
          autoMoveCompleted: true,
          dailyGoalTracking: true
        }
      }
    }),

    prisma.userViewPreference.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.LIST,
        preferences: {
          defaultSorting: {
            field: 'priority',
            direction: 'desc'
          },
          itemsPerPage: 50,
          showAvatars: true,
          enableQuickEdit: true,
          groupHeaders: true,
          densityMode: 'comfortable'
        }
      }
    }),

    prisma.userViewPreference.create({
      data: {
        userId: primaryUser.id,
        viewType: ViewType.CALENDAR,
        preferences: {
          defaultView: 'month',
          startWeek: 'monday',
          showTimeSlots: true,
          eventColorCoding: 'by_priority',
          showAllDayEvents: true,
          timeZone: 'America/New_York'
        }
      }
    })
  ]);

  console.log(`✅ Created ${userViewPreferences.length} user view preferences`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    leads.length + 
    meetings.length + 
    timelineEvents.length + 
    activities.length + 
    projectDependencies.length +
    taskDependencies.length +
    taskRelationships.length +
    taskHistory.length +
    dependencies.length +
    criticalPaths.length +
    sprints.length +
    viewConfigurations.length +
    kanbanColumns.length +
    userViewPreferences.length;

  console.log(`\n🎉 Faza 2 completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   CRM Extended: ${leads.length + meetings.length + timelineEvents.length + activities.length} records`);
  console.log(`   Project Management: ${projectDependencies.length + taskDependencies.length + taskRelationships.length + taskHistory.length + dependencies.length + criticalPaths.length + sprints.length} records`);
  console.log(`   Kanban & Views: ${viewConfigurations.length + kanbanColumns.length + userViewPreferences.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Ready for Faza 3: Email & AI Systems`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Faza 2 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });