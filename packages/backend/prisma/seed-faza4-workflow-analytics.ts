import { PrismaClient, UnifiedRuleType, UnifiedRuleStatus, UnifiedTriggerType, 
         ExecutionStatus, RecommendationStatus, ComplaintStatus, BugPriority, BugStatus,
         Frequency, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Faza 4: Workflow & Analytics seeding...');

  // Get existing organization
  const organization = await prisma.organization.findFirst({
    where: { slug: 'demo-org' }
  });

  if (!organization) {
    throw new Error('Organization not found. Run basic seed first.');
  }

  // Get existing data
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id }
  });

  const messages = await prisma.message.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const channels = await prisma.communicationChannel.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  const streams = await prisma.stream.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // WORKFLOW & RULES SYSTEM (7 tabel)
  // ================================

  console.log('⚙️ Creating Processing Rules...');
  
  const processingRules = await Promise.all([
    prisma.processingRule.create({
      data: {
        name: 'High Priority Email Processing',
        description: 'Process emails with high priority keywords and create urgent tasks',
        active: true,
        conditions: {
          keywords: ['urgent', 'asap', 'emergency', 'critical'],
          sender_domain: ['techcorp.com', 'megacorp.com'],
          subject_contains: ['important', 'deadline']
        },
        actions: {
          create_task: true,
          priority: 'HIGH',
          context: '@calls',
          notify_user: true,
          add_tags: ['urgent-email', 'needs-response']
        },
        priority: 1,
        channelId: channels.length > 0 ? channels[0].id : null,
        streamId: streams.length > 0 ? streams[0].id : null,
        organizationId: organization.id
      }
    }),

    prisma.processingRule.create({
      data: {
        name: 'Customer Support Auto-Router',
        description: 'Automatically route support emails to appropriate team members',
        active: true,
        conditions: {
          sender_email: ['support@crm-gtd.com', 'help@crm-gtd.com'],
          keywords: ['bug', 'issue', 'problem', 'error'],
          not_keywords: ['feature', 'enhancement']
        },
        actions: {
          assign_to: 'support-team',
          create_task: true,
          priority: 'MEDIUM',
          add_tags: ['support-ticket', 'needs-triage'],
          send_auto_reply: true
        },
        priority: 2,
        channelId: channels.length > 1 ? channels[1].id : null,
        organizationId: organization.id
      }
    }),

    prisma.processingRule.create({
      data: {
        name: 'Lead Qualification Rule',
        description: 'Qualify leads based on email content and sender information',
        active: true,
        conditions: {
          keywords: ['pricing', 'quote', 'demo', 'trial', 'purchase'],
          sender_domain_type: 'business',
          body_length: { min: 100 }
        },
        actions: {
          create_deal: {
            stage: 'PROSPECT',
            value: 5000,
            probability: 25
          },
          assign_to_sales: true,
          priority: 'HIGH',
          add_contact_tags: ['qualified-lead'],
          schedule_follow_up: '2d'
        },
        priority: 3,
        organizationId: organization.id
      }
    }),

    prisma.processingRule.create({
      data: {
        name: 'Newsletter Auto-Archive',
        description: 'Automatically archive newsletter and marketing emails',
        active: true,
        conditions: {
          keywords: ['newsletter', 'unsubscribe', 'marketing'],
          sender_type: 'marketing',
          has_unsubscribe_link: true
        },
        actions: {
          auto_archive: true,
          mark_as_read: true,
          add_tags: ['newsletter', 'marketing'],
          skip_inbox: true
        },
        priority: 10,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${processingRules.length} processing rules`);

  console.log('🔄 Creating Unified Rules...');
  
  const unifiedRules = await Promise.all([
    prisma.unifiedRule.create({
      data: {
        name: 'VIP Customer Workflow',
        description: 'Complete workflow for VIP customer communications',
        ruleType: UnifiedRuleType.WORKFLOW,
        category: 'customer-management',
        status: UnifiedRuleStatus.ACTIVE,
        priority: 1,
        triggerType: UnifiedTriggerType.EVENT_BASED,
        triggerEvents: ['message_received', 'contact_updated'],
        conditions: {
          contact: {
            tags: ['vip', 'enterprise'],
            tier: 'premium'
          },
          message: {
            sender_importance: 'high',
            response_required: true
          }
        },
        actions: {
          immediate: {
            createTask: {
              title: 'Respond to VIP customer: {{sender_name}}',
              priority: 'HIGH',
              context: '@calls',
              dueDate: '+2h'
            },
            notifyTeam: ['sales-manager', 'account-manager'],
            escalate: true
          },
          followUp: {
            schedule: '+24h',
            createReminder: 'Check VIP response status'
          }
        },
        maxExecutionsPerHour: 50,
        maxExecutionsPerDay: 200,
        organizationId: organization.id
      }
    }),

    prisma.unifiedRule.create({
      data: {
        name: 'Smart Email Filter',
        description: 'Advanced email filtering with AI categorization',
        ruleType: UnifiedRuleType.EMAIL_FILTER,
        category: 'email-processing',
        status: UnifiedRuleStatus.ACTIVE,
        priority: 2,
        triggerType: UnifiedTriggerType.AUTOMATIC,
        triggerEvents: ['email_received'],
        conditions: {
          email: {
            spam_score: { max: 5 },
            has_attachments: false,
            sender_verified: true
          },
          ai_analysis: {
            sentiment: ['positive', 'neutral'],
            urgency_score: { min: 0.3 }
          }
        },
        actions: {
          categorize: {
            strategy: 'ai_enhanced',
            fallback: 'keyword_based'
          },
          route: {
            inbox: 'primary',
            notifications: true
          },
          enrich: {
            extract_entities: true,
            analyze_intent: true
          }
        },
        maxExecutionsPerHour: 1000,
        maxExecutionsPerDay: 5000,
        organizationId: organization.id
      }
    }),

    prisma.unifiedRule.create({
      data: {
        name: 'Project Status Auto-Reply',
        description: 'Automatic status updates for project inquiries',
        ruleType: UnifiedRuleType.AUTO_REPLY,
        category: 'project-communication',
        status: UnifiedRuleStatus.ACTIVE,
        priority: 3,
        triggerType: UnifiedTriggerType.EVENT_BASED,
        triggerEvents: ['message_received'],
        conditions: {
          subject: {
            contains: ['project status', 'progress update', 'timeline'],
            exclude: ['re:', 'fwd:']
          },
          sender: {
            is_stakeholder: true,
            project_access: true
          }
        },
        actions: {
          autoReply: {
            template: 'project-status-update',
            include_timeline: true,
            include_milestones: true,
            personalize: true
          },
          track: {
            log_inquiry: true,
            update_stakeholder_engagement: true
          }
        },
        cooldownPeriod: 3600, // 1 hour
        organizationId: organization.id
      }
    }),

    prisma.unifiedRule.create({
      data: {
        name: 'Weekly Team Sync Notification',
        description: 'Send weekly team sync reminders and prepare agenda',
        ruleType: UnifiedRuleType.NOTIFICATION,
        category: 'team-management',
        status: UnifiedRuleStatus.ACTIVE,
        priority: 5,
        triggerType: UnifiedTriggerType.SCHEDULED,
        triggerEvents: [],
        conditions: {
          team: {
            active_members: { min: 2 },
            has_pending_tasks: true
          },
          calendar: {
            week_has_meetings: true,
            conflicts_exist: false
          }
        },
        actions: {
          notify: {
            channels: ['email', 'slack'],
            recipients: 'team-leads',
            message: 'Weekly sync reminder with auto-generated agenda'
          },
          prepare: {
            generate_agenda: true,
            collect_updates: true,
            create_meeting_notes: true
          }
        },
        activeFrom: new Date('2024-07-01'),
        organizationId: organization.id
      }
    }),

    prisma.unifiedRule.create({
      data: {
        name: 'Integration Sync Handler',
        description: 'Handle data synchronization with external systems',
        ruleType: UnifiedRuleType.INTEGRATION,
        category: 'data-sync',
        status: UnifiedRuleStatus.TESTING,
        priority: 4,
        triggerType: UnifiedTriggerType.WEBHOOK,
        triggerEvents: ['webhook_received'],
        conditions: {
          webhook: {
            source: ['salesforce', 'hubspot', 'zapier'],
            event_type: ['contact.updated', 'deal.stage_changed'],
            validation: 'signature_verified'
          }
        },
        actions: {
          sync: {
            update_contact: true,
            merge_conflicts: 'newest_wins',
            log_changes: true
          },
          notify: {
            if_conflicts: true,
            channels: ['admin-alerts']
          }
        },
        maxExecutionsPerHour: 500,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${unifiedRules.length} unified rules`);

  console.log('⚡ Creating Unified Rule Executions...');
  
  const unifiedRuleExecutions = await Promise.all([
    prisma.unifiedRuleExecution.create({
      data: {
        ruleId: unifiedRules[0].id, // VIP Customer Workflow
        triggeredBy: 'message_received',
        triggerData: {
          messageId: messages.length > 0 ? messages[0].id : 'mock-message-1',
          sender: 'vip@techcorp.com',
          subject: 'Urgent: Need enterprise support',
          priority: 'HIGH'
        },
        executionTime: 1250.5,
        status: ExecutionStatus.SUCCESS,
        result: {
          taskCreated: 'task-uuid-123',
          notificationsSent: ['sales-manager', 'account-manager'],
          escalationTriggered: true,
          followUpScheduled: '2024-07-21T10:00:00Z'
        },
        entityType: 'message',
        entityId: messages.length > 0 ? messages[0].id : 'mock-message-1',
        organizationId: organization.id
      }
    }),

    prisma.unifiedRuleExecution.create({
      data: {
        ruleId: unifiedRules[1].id, // Smart Email Filter
        triggeredBy: 'email_received',
        triggerData: {
          from: 'customer@example.com',
          subject: 'Product inquiry - pricing information',
          aiAnalysis: {
            sentiment: 'positive',
            urgency: 0.6,
            category: 'sales_inquiry'
          }
        },
        executionTime: 890.2,
        status: ExecutionStatus.SUCCESS,
        result: {
          categorized: 'sales_inquiry',
          routedTo: 'primary_inbox',
          entitiesExtracted: ['pricing', 'product_demo'],
          intentAnalyzed: 'purchase_intent'
        },
        entityType: 'email',
        entityId: 'email-uuid-456',
        organizationId: organization.id
      }
    }),

    prisma.unifiedRuleExecution.create({
      data: {
        ruleId: unifiedRules[2].id, // Project Status Auto-Reply
        triggeredBy: 'message_received',
        triggerData: {
          from: 'stakeholder@client.com',
          subject: 'Project status update request',
          projectId: 'proj-123'
        },
        executionTime: 2100.8,
        status: ExecutionStatus.SUCCESS,
        result: {
          autoReplySent: true,
          templateUsed: 'project-status-update',
          timelineIncluded: true,
          milestonesAttached: true,
          stakeholderEngagementUpdated: true
        },
        entityType: 'project_inquiry',
        entityId: 'inquiry-789',
        organizationId: organization.id
      }
    }),

    prisma.unifiedRuleExecution.create({
      data: {
        ruleId: unifiedRules[4].id, // Integration Sync Handler
        triggeredBy: 'webhook_received',
        triggerData: {
          source: 'salesforce',
          eventType: 'contact.updated',
          contactId: 'sf-contact-123',
          changes: ['email', 'phone', 'company']
        },
        executionTime: 450.3,
        status: ExecutionStatus.PARTIAL_SUCCESS,
        result: {
          contactUpdated: true,
          conflictsDetected: ['phone_number'],
          conflictResolution: 'newest_wins',
          changesLogged: true
        },
        error: 'Phone number format validation failed',
        entityType: 'contact',
        entityId: 'contact-abc-789',
        organizationId: organization.id
      }
    }),

    prisma.unifiedRuleExecution.create({
      data: {
        ruleId: unifiedRules[3].id, // Weekly Team Sync
        triggeredBy: 'scheduled_trigger',
        triggerData: {
          scheduledTime: '2024-07-22T09:00:00Z',
          teamMembers: 8,
          pendingTasks: 23,
          weeklyMeetings: 4
        },
        executionTime: 3200.1,
        status: ExecutionStatus.SUCCESS,
        result: {
          notificationsSent: 8,
          agendaGenerated: true,
          updatesCollected: 23,
          meetingNotesCreated: true,
          slackMessageSent: true
        },
        entityType: 'team_sync',
        entityId: 'sync-week-30-2024',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${unifiedRuleExecutions.length} unified rule executions`);

  console.log('📊 Creating Message Processing Results...');
  
  let messageProcessingResults: any[] = [];
  if (messages.length > 0 && processingRules.length > 0) {
    messageProcessingResults = await Promise.all([
      prisma.messageProcessingResult.create({
        data: {
          messageId: messages[0].id,
          ruleId: processingRules[0].id,
          actionTaken: 'TASK_CREATED',
          success: true,
          taskCreated: tasks.length > 0 ? tasks[0].id : 'generated-task-1',
          contextAssigned: '@calls',
          prioritySet: Priority.HIGH
        }
      }),

      prisma.messageProcessingResult.create({
        data: {
          messageId: messages.length > 1 ? messages[1].id : messages[0].id,
          ruleId: processingRules[1].id,
          actionTaken: 'ASSIGNED_TO_TEAM',
          success: true,
          contextAssigned: '@support',
          prioritySet: Priority.MEDIUM
        }
      }),

      prisma.messageProcessingResult.create({
        data: {
          messageId: messages.length > 2 ? messages[2].id : messages[0].id,
          ruleId: processingRules[2].id,
          actionTaken: 'DEAL_CREATED',
          success: true,
          prioritySet: Priority.HIGH
        }
      }),

      prisma.messageProcessingResult.create({
        data: {
          messageId: messages.length > 3 ? messages[3].id : messages[0].id,
          ruleId: processingRules[3].id,
          actionTaken: 'ARCHIVED',
          success: true,
          contextAssigned: '@archive'
        }
      })
    ]);
  }

  console.log(`✅ Created ${messageProcessingResults.length} message processing results`);

  console.log('💡 Creating Recommendations...');
  
  const recommendations = await Promise.all([
    prisma.recommendation.create({
      data: {
        content: 'Consider implementing automated follow-up sequences for leads that go cold after initial contact. This could improve conversion rates by 15-20%.',
        status: RecommendationStatus.OPEN,
        priority: Priority.HIGH,
        referenceId: 'lead-process-optimization',
        referenceType: 'workflow',
        organizationId: organization.id
      }
    }),

    prisma.recommendation.create({
      data: {
        content: 'Your team responds to urgent emails 40% faster when using GTD contexts. Recommend training on @calls and @computer contexts for better productivity.',
        status: RecommendationStatus.ACCEPTED,
        priority: Priority.MEDIUM,
        referenceId: 'gtd-training-program',
        referenceType: 'training',
        organizationId: organization.id
      }
    }),

    prisma.recommendation.create({
      data: {
        content: 'Email volume analysis shows 60% of support tickets could be resolved with better self-service documentation. Invest in knowledge base expansion.',
        status: RecommendationStatus.IMPLEMENTED,
        priority: Priority.MEDIUM,
        referenceId: 'knowledge-base-expansion',
        referenceType: 'project',
        organizationId: organization.id
      }
    }),

    prisma.recommendation.create({
      data: {
        content: 'Voice TTS feature usage is low (15% adoption). Consider adding voice tutorials and onboarding prompts to increase engagement.',
        status: RecommendationStatus.OPEN,
        priority: Priority.LOW,
        referenceId: 'voice-tts-adoption',
        referenceType: 'feature',
        organizationId: organization.id
      }
    }),

    prisma.recommendation.create({
      data: {
        content: 'Task completion rates drop 30% on Fridays. Implement "Friday Focus Mode" with simplified task lists and energy-appropriate work.',
        status: RecommendationStatus.OPEN,
        priority: Priority.MEDIUM,
        referenceId: 'friday-focus-mode',
        referenceType: 'productivity',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${recommendations.length} recommendations`);

  console.log('😠 Creating Complaints...');
  
  const complaints = await Promise.all([
    prisma.complaint.create({
      data: {
        title: 'Slow performance during peak hours',
        description: 'The CRM system becomes very slow between 9-11 AM and 2-4 PM, affecting our team productivity. Page load times exceed 10 seconds.',
        customer: 'TechCorp Inc. - IT Department',
        product: 'CRM-GTD Smart Pro',
        status: ComplaintStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        organizationId: organization.id
      }
    }),

    prisma.complaint.create({
      data: {
        title: 'Voice TTS not working on mobile devices',
        description: 'The Voice TTS feature works perfectly on desktop but fails to function on mobile browsers (iOS Safari and Android Chrome). No audio output is produced.',
        customer: 'Mobile Sales Team',
        product: 'Voice TTS Add-on',
        status: ComplaintStatus.NEW,
        priority: Priority.MEDIUM,
        organizationId: organization.id
      }
    }),

    prisma.complaint.create({
      data: {
        title: 'Email integration stops working randomly',
        description: 'Our email integration with Gmail stops working randomly, requiring manual reconnection. This happens 2-3 times per week and disrupts our workflow.',
        customer: 'Creative Solutions Ltd.',
        product: 'Email Integration',
        status: ComplaintStatus.ESCALATED,
        priority: Priority.HIGH,
        organizationId: organization.id
      }
    }),

    prisma.complaint.create({
      data: {
        title: 'GTD weekly review reminders too frequent',
        description: 'The system sends weekly review reminders every day instead of weekly. We only need them on Fridays. This creates notification fatigue.',
        customer: 'Productivity Consultants LLC',
        product: 'GTD System',
        status: ComplaintStatus.RESOLVED,
        priority: Priority.LOW,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${complaints.length} complaints`);

  console.log('🐛 Creating Bug Reports...');
  
  const bugReports = await Promise.all([
    prisma.bugReport.create({
      data: {
        title: 'Task due dates reset to null when editing priority',
        description: 'When editing a task priority from the Kanban board, the due date field gets reset to null/empty. This causes tasks to disappear from deadline-based views.',
        priority: BugPriority.HIGH,
        status: BugStatus.OPEN,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        url: '/dashboard/projects/kanban',
        browserInfo: 'Chrome 91.0.4472.124 on Windows 10',
        deviceInfo: 'Desktop - Windows 10 Pro, 16GB RAM',
        screenshots: ['/screenshots/bug-001-kanban-due-date.png'],
        stepsToReproduce: `1. Open Kanban board for any project
2. Click on a task card to open details
3. Change priority from MEDIUM to HIGH
4. Save changes
5. Notice due date is now empty`,
        expectedBehavior: 'Due date should remain unchanged when editing other task properties',
        actualBehavior: 'Due date gets reset to null/empty when saving priority changes',
        reporterId: primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.bugReport.create({
      data: {
        title: 'Smart Mailboxes filters not persisting after browser refresh',
        description: 'Custom filters set in Smart Mailboxes (date range, priority, sender) get reset to default values after refreshing the browser page.',
        priority: BugPriority.MEDIUM,
        status: BugStatus.IN_PROGRESS,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        url: '/dashboard/smart-mailboxes',
        browserInfo: 'Safari 14.1.1 on macOS Big Sur',
        deviceInfo: 'MacBook Pro 13" 2020, macOS 11.4',
        stepsToReproduce: `1. Go to Smart Mailboxes
2. Set custom filters (date range: Last 7 days, priority: HIGH)
3. Apply filters and verify results
4. Refresh browser page (F5 or Cmd+R)
5. Notice filters are reset to default`,
        expectedBehavior: 'Filter settings should persist in localStorage and restore after page refresh',
        actualBehavior: 'All filters reset to default values after browser refresh',
        reporterId: users.length > 1 ? users[1].id : primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.bugReport.create({
      data: {
        title: 'Voice TTS stops abruptly for messages longer than 500 characters',
        description: 'When using Voice TTS to read long email messages, the speech stops abruptly around 500 characters without completing the full message.',
        priority: BugPriority.MEDIUM,
        status: BugStatus.RESOLVED,
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        url: '/dashboard/smart-mailboxes',
        browserInfo: 'Chrome 91 on Ubuntu 20.04',
        deviceInfo: 'Desktop Linux - Ubuntu 20.04 LTS, 32GB RAM',
        stepsToReproduce: `1. Open Smart Mailboxes
2. Find an email message longer than 500 characters
3. Click "Read" button to start Voice TTS
4. Listen as speech begins normally
5. Notice speech stops abruptly around 500 characters`,
        expectedBehavior: 'Voice TTS should read the complete message regardless of length',
        actualBehavior: 'Speech stops abruptly at approximately 500 character limit',
        reporterId: users.length > 2 ? users[2].id : primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.bugReport.create({
      data: {
        title: 'Drag and drop in Kanban columns occasionally fails',
        description: 'Sometimes when dragging tasks between Kanban columns, the task snaps back to original position instead of moving to the target column.',
        priority: BugPriority.LOW,
        status: BugStatus.OPEN,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        url: '/dashboard/projects/kanban',
        browserInfo: 'Firefox 89.0 on Windows 10',
        deviceInfo: 'Desktop - Windows 10 Home, 8GB RAM',
        stepsToReproduce: `1. Open project Kanban board
2. Attempt to drag a task from "In Progress" to "Done" column
3. Drop the task in the target column
4. Sometimes task snaps back to original column`,
        expectedBehavior: 'Task should move smoothly to target column and stay there',
        actualBehavior: 'Task occasionally snaps back to original position after attempted drag',
        reporterId: primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.bugReport.create({
      data: {
        title: 'Export function generates empty CSV files',
        description: 'When trying to export task lists or contact data to CSV format, the downloaded file is empty (0 bytes) despite showing successful export message.',
        priority: BugPriority.CRITICAL,
        status: BugStatus.OPEN,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55',
        url: '/dashboard/tasks/export',
        browserInfo: 'Microsoft Edge 92.0.902.55 on Windows 10',
        deviceInfo: 'Surface Pro 7, Windows 10 Pro, 16GB RAM',
        attachments: ['/attachments/empty-export-file.csv', '/attachments/browser-console-errors.txt'],
        stepsToReproduce: `1. Go to Tasks list view
2. Select multiple tasks using checkboxes
3. Click "Export" button in toolbar
4. Choose "CSV" format
5. Click "Download"
6. Check downloaded file - it's empty`,
        expectedBehavior: 'CSV file should contain all selected task data with proper headers and formatting',
        actualBehavior: 'Downloaded CSV file is completely empty (0 bytes) despite success message',
        reporterId: primaryUser.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${bugReports.length} bug reports`);

  // ================================
  // RECURRING & HABITS SYSTEM (3 tabel)
  // ================================

  console.log('🔄 Creating Recurring Tasks...');
  
  const recurringTasks = await Promise.all([
    prisma.recurringTask.create({
      data: {
        title: 'Weekly Team Stand-up Meeting',
        description: 'Regular team synchronization meeting to discuss progress, blockers, and plan for the week ahead',
        frequency: Frequency.WEEKLY,
        pattern: '0 9 * * 1', // Every Monday at 9:00 AM
        interval: 1,
        daysOfWeek: [1], // Monday
        time: '09:00',
        nextOccurrence: new Date('2024-07-29T09:00:00Z'),
        lastExecuted: new Date('2024-07-22T09:00:00Z'),
        executionCount: 15,
        context: '@meetings',
        priority: Priority.HIGH,
        estimatedMinutes: 60,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.recurringTask.create({
      data: {
        title: 'Monthly Client Health Check',
        description: 'Review client satisfaction metrics, usage patterns, and identify at-risk accounts',
        frequency: Frequency.MONTHLY,
        pattern: '0 10 1 * *', // First day of month at 10:00 AM
        interval: 1,
        dayOfMonth: 1,
        time: '10:00',
        nextOccurrence: new Date('2024-08-01T10:00:00Z'),
        lastExecuted: new Date('2024-07-01T10:00:00Z'),
        executionCount: 3,
        context: '@computer',
        priority: Priority.MEDIUM,
        estimatedMinutes: 180,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.recurringTask.create({
      data: {
        title: 'Daily Inbox Processing',
        description: 'Process email inbox according to GTD methodology - capture, clarify, organize',
        frequency: Frequency.DAILY,
        pattern: '0 8 * * 1-5', // Weekdays at 8:00 AM
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        time: '08:00',
        nextOccurrence: new Date('2024-07-23T08:00:00Z'),
        lastExecuted: new Date('2024-07-22T08:00:00Z'),
        executionCount: 45,
        context: '@computer',
        priority: Priority.HIGH,
        estimatedMinutes: 30,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.recurringTask.create({
      data: {
        title: 'Quarterly Business Review Preparation',
        description: 'Prepare comprehensive business review including metrics, goals progress, and strategic planning',
        frequency: Frequency.QUARTERLY,
        pattern: '0 14 15 */3 *', // 15th day of every 3rd month at 2:00 PM
        interval: 3,
        dayOfMonth: 15,
        months: [1, 4, 7, 10], // January, April, July, October
        time: '14:00',
        nextOccurrence: new Date('2024-10-15T14:00:00Z'),
        lastExecuted: new Date('2024-07-15T14:00:00Z'),
        executionCount: 2,
        context: '@computer',
        priority: Priority.MEDIUM,
        estimatedMinutes: 240,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.recurringTask.create({
      data: {
        title: 'Weekly GTD Review',
        description: 'Complete GTD weekly review: collect, process, organize, review projects and next actions',
        frequency: Frequency.WEEKLY,
        pattern: '0 17 * * 5', // Every Friday at 5:00 PM
        interval: 1,
        daysOfWeek: [5], // Friday
        time: '17:00',
        nextOccurrence: new Date('2024-07-26T17:00:00Z'),
        lastExecuted: new Date('2024-07-19T17:00:00Z'),
        executionCount: 8,
        context: '@computer',
        priority: Priority.HIGH,
        estimatedMinutes: 90,
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.recurringTask.create({
      data: {
        title: 'Bi-weekly Sprint Planning',
        description: 'Plan next development sprint: review backlog, estimate stories, assign tasks',
        frequency: Frequency.BIWEEKLY,
        pattern: '0 10 * * 1', // Every other Monday at 10:00 AM
        interval: 2,
        daysOfWeek: [1], // Monday
        time: '10:00',
        nextOccurrence: new Date('2024-08-05T10:00:00Z'),
        lastExecuted: new Date('2024-07-22T10:00:00Z'),
        executionCount: 6,
        context: '@meetings',
        priority: Priority.HIGH,
        estimatedMinutes: 120,
        isActive: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${recurringTasks.length} recurring tasks`);

  console.log('🎯 Creating Habits...');
  
  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        name: 'Daily GTD Inbox Processing',
        description: 'Process GTD inbox to zero every morning - capture, clarify, organize new items',
        frequency: Frequency.DAILY,
        currentStreak: 12,
        bestStreak: 28,
        startDate: new Date('2024-06-15'),
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.habit.create({
      data: {
        name: 'Weekly Client Check-ins',
        description: 'Proactive check-in with top 5 clients every week to maintain relationships',
        frequency: Frequency.WEEKLY,
        currentStreak: 6,
        bestStreak: 15,
        startDate: new Date('2024-05-01'),
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.habit.create({
      data: {
        name: 'Monthly Knowledge Base Updates',
        description: 'Review and update knowledge base articles based on new support tickets and feedback',
        frequency: Frequency.MONTHLY,
        currentStreak: 3,
        bestStreak: 8,
        startDate: new Date('2024-01-01'),
        isActive: true,
        organizationId: organization.id
      }
    }),

    prisma.habit.create({
      data: {
        name: 'Daily Team Communication Review',
        description: 'Review team Slack/email for important updates and respond to pending items',
        frequency: Frequency.DAILY,
        currentStreak: 0, // Broken streak
        bestStreak: 45,
        startDate: new Date('2024-03-01'),
        isActive: false, // Temporarily paused
        organizationId: organization.id
      }
    }),

    prisma.habit.create({
      data: {
        name: 'Quarterly Strategic Planning',
        description: 'Quarterly review of business goals, market analysis, and strategic direction planning',
        frequency: Frequency.QUARTERLY,
        currentStreak: 2,
        bestStreak: 4,
        startDate: new Date('2023-10-01'),
        isActive: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${habits.length} habits`);

  console.log('📝 Creating Habit Entries...');
  
  // Create habit entries for the last 2 weeks for some habits
  const habitEntries = [];
  
  // Daily GTD Inbox Processing (habit 0) - entries for last 14 days
  const gtdHabit = habits[0];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    habitEntries.push(
      prisma.habitEntry.create({
        data: {
          date: date,
          completed: i < 12, // Completed for last 12 days (current streak)
          notes: i < 12 ? `Processed ${15 + Math.floor(Math.random() * 20)} items` : 'Missed due to travel',
          habitId: gtdHabit.id
        }
      })
    );
  }

  // Weekly Client Check-ins (habit 1) - entries for last 6 weeks
  const clientHabit = habits[1];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7)); // Weekly intervals
    
    habitEntries.push(
      prisma.habitEntry.create({
        data: {
          date: date,
          completed: true,
          notes: `Contacted ${3 + Math.floor(Math.random() * 3)} clients - positive feedback overall`,
          habitId: clientHabit.id
        }
      })
    );
  }

  // Monthly Knowledge Base Updates (habit 2) - entries for last 3 months
  const kbHabit = habits[2];
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1); // First day of month
    
    habitEntries.push(
      prisma.habitEntry.create({
        data: {
          date: date,
          completed: true,
          notes: `Updated ${5 + Math.floor(Math.random() * 10)} articles, added ${2 + Math.floor(Math.random() * 5)} new ones`,
          habitId: kbHabit.id
        }
      })
    );
  }

  // Daily Team Communication (habit 3) - broken streak, some recent entries
  const teamHabit = habits[3];
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    habitEntries.push(
      prisma.habitEntry.create({
        data: {
          date: date,
          completed: i > 3, // Missed last 4 days
          notes: i > 3 ? 'Reviewed team updates and responded to messages' : 'Missed - too busy with client calls',
          habitId: teamHabit.id
        }
      })
    );
  }

  // Quarterly Strategic Planning (habit 4) - last 2 quarters
  const strategicHabit = habits[4];
  for (let i = 0; i < 2; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (i * 3)); // Quarterly intervals
    date.setDate(15); // Mid-month
    
    habitEntries.push(
      prisma.habitEntry.create({
        data: {
          date: date,
          completed: true,
          notes: `Completed Q${Math.ceil((new Date().getMonth() + 1 - i*3) / 3)} planning session - updated goals and priorities`,
          habitId: strategicHabit.id
        }
      })
    );
  }

  const createdHabitEntries = await Promise.all(habitEntries);
  console.log(`✅ Created ${createdHabitEntries.length} habit entries`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    processingRules.length + 
    unifiedRules.length + 
    unifiedRuleExecutions.length + 
    messageProcessingResults.length + 
    recommendations.length +
    complaints.length +
    bugReports.length +
    recurringTasks.length +
    habits.length +
    createdHabitEntries.length;

  console.log(`\n🎉 Faza 4 completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   Workflow & Rules: ${processingRules.length + unifiedRules.length + unifiedRuleExecutions.length + messageProcessingResults.length + recommendations.length + complaints.length + bugReports.length} records`);
  console.log(`   Recurring & Habits: ${recurringTasks.length + habits.length + createdHabitEntries.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Ready for Faza 5: Metadata & Final`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Faza 4 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });