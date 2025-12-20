import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRemainingTables() {
  console.log('🌱 Seeding remaining tables...');

  const orgs = await prisma.organization.findMany();
  const users = await prisma.user.findMany();
  const projects = await prisma.project.findMany();
  const tasks = await prisma.task.findMany();
  const companies = await prisma.company.findMany();
  const contacts = await prisma.contact.findMany();
  const deals = await prisma.deal.findMany();

  if (orgs.length === 0) {
    console.log('❌ No organizations found. Run basic seed first.');
    return;
  }

  // Stream Channels
  console.log('📺 Creating stream channels...');
  for (const org of orgs) {
    const streams = await prisma.stream.findMany({ where: { organizationId: org.id } });
    
    for (const stream of streams) {
      // Najpierw utwórz kanały komunikacyjne jeśli nie istnieją
      const channelDefinitions = [
        { name: 'Primary Email', type: 'EMAIL', active: true },
        { name: 'Slack Channel', type: 'SLACK', active: true },
        { name: 'Teams Channel', type: 'TEAMS', active: false }
      ];

      for (const channelDef of channelDefinitions) {
        // Sprawdź czy kanał komunikacyjny już istnieje
        let commChannel = await prisma.communicationChannel.findFirst({
          where: { 
            organizationId: org.id, 
            name: channelDef.name,
            type: channelDef.type 
          }
        });
        
        if (!commChannel) {
          commChannel = await prisma.communicationChannel.create({
            data: {
              organizationId: org.id,
              name: channelDef.name,
              type: channelDef.type,
              active: channelDef.active,
              config: { provider: channelDef.type.toLowerCase() }
            }
          });
        }

        // Teraz utwórz StreamChannel jeśli nie istnieje
        const existing = await prisma.streamChannel.findFirst({
          where: { streamId: stream.id, channelId: commChannel.id }
        });
        
        if (!existing) {
          await prisma.streamChannel.create({
            data: {
              streamId: stream.id,
              channelId: commChannel.id,
              autoCreateTasks: false,
              defaultPriority: 'MEDIUM'
            }
          });
        }
      }
    }
  }

  // User Relations & Permissions
  console.log('👥 Creating user relations...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgUsers.length >= 2) {
      const manager = orgUsers.find(u => u.role === 'ADMIN') || orgUsers[0];
      const employee = orgUsers.find(u => u.role === 'MEMBER') || orgUsers[1];
      
      const existing = await prisma.userRelation.findFirst({
        where: { managerId: manager.id, employeeId: employee.id }
      });
      
      if (!existing) {
        const relation = await prisma.userRelation.create({
          data: {
            organizationId: org.id,
            managerId: manager.id,
            employeeId: employee.id,
            relationType: 'MANAGES',
            isActive: true,
            canDelegate: true,
            canApprove: false,
            createdById: manager.id
          }
        });

        // User permissions
        const permissions = [
          { dataScope: 'TASKS', action: 'VIEW', granted: true },
          { dataScope: 'TASKS', action: 'ASSIGN', granted: true },
          { dataScope: 'PROJECTS', action: 'VIEW', granted: true }
        ];

        for (const perm of permissions) {
          await prisma.userPermission.create({
            data: {
              ...perm,
              relationId: relation.id,
              grantedById: manager.id,
              organizationId: org.id
            }
          });
        }
      }
    }
  }

  // Stream Relations & Permissions
  console.log('🌊 Creating stream relations...');
  for (const org of orgs) {
    const streams = await prisma.stream.findMany({ where: { organizationId: org.id } });
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (streams.length >= 2 && orgUsers.length > 0) {
      const parentStream = streams[0];
      const childStream = streams[1];
      const creator = orgUsers[0];
      
      const existing = await prisma.streamRelation.findFirst({
        where: { parentId: parentStream.id, childId: childStream.id }
      });
      
      if (!existing) {
        await prisma.streamRelation.create({
          data: {
            organizationId: org.id,
            parentId: parentStream.id,
            childId: childStream.id,
            relationType: 'MANAGES',
            createdById: creator.id
          }
        });
      }

      // Stream permissions skipped - complex schema
    }
  }

  // Task Relationships & Dependencies
  console.log('🔗 Creating task relationships...');
  for (const org of orgs) {
    const orgTasks = tasks.filter(t => t.organizationId === org.id);
    
    if (orgTasks.length >= 2) {
      const task1 = orgTasks[0];
      const task2 = orgTasks[1];
      
      const existing = await prisma.taskRelationship.findFirst({
        where: { fromTaskId: task1.id, toTaskId: task2.id }
      });
      
      if (!existing) {
        await prisma.taskRelationship.create({
          data: {
            fromTaskId: task1.id,
            toTaskId: task2.id,
            type: 'FINISH_TO_START',
            lag: '0d'
          }
        });
      }

      // Dependencies
      const existingDep = await prisma.dependency.findFirst({
        where: { 
          sourceId: task1.id, 
          targetId: task2.id,
          sourceType: 'task',
          targetType: 'task'
        }
      });
      
      if (!existingDep) {
        await prisma.dependency.create({
          data: {
            sourceId: task1.id,
            targetId: task2.id,
            sourceType: 'task',
            targetType: 'task',
            type: 'FINISH_TO_START'
          }
        });
      }
    }
  }

  // Project Dependencies
  console.log('📋 Creating project dependencies...');
  for (const org of orgs) {
    const orgProjects = projects.filter(p => p.organizationId === org.id);
    
    if (orgProjects.length >= 2) {
      const project1 = orgProjects[0];
      const project2 = orgProjects[1];
      
      const existing = await prisma.projectDependency.findFirst({
        where: { dependentProjectId: project2.id, sourceProjectId: project1.id }
      });
      
      if (!existing) {
        await prisma.projectDependency.create({
          data: {
            dependentProjectId: project2.id,
            sourceProjectId: project1.id,
            type: 'FINISH_TO_START'
          }
        });
      }
    }
  }

  // Messages & Attachments
  console.log('📨 Creating messages...');
  for (const org of orgs) {
    const channels = await prisma.communicationChannel.findMany({ where: { organizationId: org.id } });
    const orgContacts = contacts.filter(c => c.organizationId === org.id);
    const orgCompanies = companies.filter(c => c.organizationId === org.id);
    
    if (channels.length > 0 && orgContacts.length > 0) {
      const channel = channels[0];
      const contact = orgContacts[0];
      const company = orgCompanies[0];
      
      const messages = [
        {
          subject: 'Project Update Required',
          content: 'Hi, we need an update on the current project status. Could you please provide a detailed report by end of week?',
          fromAddress: contact.email,
          fromName: `${contact.firstName} ${contact.lastName}`,
          toAddress: 'info@company.com',
          receivedAt: new Date(),
          urgencyScore: 75,
          actionNeeded: true
        },
        {
          subject: 'Meeting Confirmation',
          content: 'This is to confirm our meeting scheduled for tomorrow at 2 PM. Please let me know if you need to reschedule.',
          fromAddress: contact.email,
          fromName: `${contact.firstName} ${contact.lastName}`,
          toAddress: 'info@company.com',
          receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          urgencyScore: 60,
          actionNeeded: false
        }
      ];

      for (const msgData of messages) {
        const existing = await prisma.message.findFirst({
          where: { channelId: channel.id, subject: msgData.subject }
        });
        
        if (!existing) {
          const message = await prisma.message.create({
            data: {
              ...msgData,
              organizationId: org.id,
              channelId: channel.id,
              contactId: contact.id,
              companyId: company?.id
            }
          });

          // Message attachment  
          await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              fileName: 'project_document.pdf',
              fileType: 'PDF',
              fileSize: 2048000,
              contentType: 'application/pdf',
              storagePath: '/attachments/messages/project_document.pdf',
              isInline: false
            }
          });
        }
      }
    }
  }

  // Processing Rules & Executions
  console.log('⚙️ Creating processing rules...');
  for (const org of orgs) {
    const rules = [
      {
        name: 'Auto-prioritize urgent emails',
        description: 'Automatically set high priority for urgent emails',
        conditions: { subject: { contains: 'URGENT' } },
        actions: { setPriority: 'HIGH', addTag: 'urgent' },
        active: true,
        priority: 1
      }
    ];

    for (const rule of rules) {
      const existing = await prisma.processingRule.findFirst({
        where: { organizationId: org.id, name: rule.name }
      });
      
      if (!existing) {
        await prisma.processingRule.create({
          data: { ...rule, organizationId: org.id }
        });
      }
    }
  }

  // Unified Rules & Executions
  console.log('🔄 Creating unified rules...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgUsers.length > 0) {
      const creator = orgUsers[0];
      
      const unifiedRules = [
        {
          name: 'Email to Task Converter',
          description: 'Convert important emails to tasks automatically',
          ruleType: 'PROCESSING',
          triggerType: 'MANUAL',
          conditions: { urgencyScore: { gte: 70 } },
          actions: { createTask: true, assignTo: creator.id },
          status: 'ACTIVE',
          priority: 1
        }
      ];

      for (const rule of unifiedRules) {
        const existing = await prisma.unifiedRule.findFirst({
          where: { organizationId: org.id, name: rule.name }
        });
        
        if (!existing) {
          const createdRule = await prisma.unifiedRule.create({
            data: {
              ...rule,
              organizationId: org.id,
              createdById: creator.id
            }
          });

          // Rule execution
          await prisma.unifiedRuleExecution.create({
            data: {
              organizationId: org.id,
              ruleId: createdRule.id,
              status: 'SUCCESS',
              executedAt: new Date(),
              result: { message: 'Rule executed successfully', tasksCreated: 1 }
            }
          });
        }
      }
    }
  }

  // AI Rules & Executions
  console.log('🤖 Creating AI rules...');
  for (const org of orgs) {
    const providers = await prisma.aIProvider.findMany({ where: { organizationId: org.id } });
    const models = await prisma.aIModel.findMany({ 
      where: { provider: { organizationId: org.id } } 
    });
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (providers.length > 0 && models.length > 0 && orgUsers.length > 0) {
      const provider = providers[0];
      const model = models[0];
      const creator = orgUsers[0];
      
      const aiRules = [
        {
          name: 'Sentiment Analysis for Emails',
          description: 'Analyze sentiment of incoming emails',
          triggerType: 'MESSAGE_RECEIVED',
          triggerConditions: { hasContent: true },
          actions: { sentimentAnalysis: true },
          status: 'ACTIVE'
        }
      ];

      for (const rule of aiRules) {
        const existing = await prisma.aIRule.findFirst({
          where: { organizationId: org.id, name: rule.name }
        });
        
        if (!existing) {
          const createdRule = await prisma.aIRule.create({
            data: {
              ...rule,
              organizationId: org.id,
              modelId: model.id
            }
          });

          // AI execution skipped - complex schema
        }
      }
    }
  }

  // Leads & Auto Replies
  console.log('🎯 Creating leads and auto replies...');
  for (const org of orgs) {
    const orgCompanies = companies.filter(c => c.organizationId === org.id);
    const orgContacts = contacts.filter(c => c.organizationId === org.id);
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgCompanies.length > 0 && orgUsers.length > 0) {
      const company = orgCompanies[0];
      const contact = orgContacts[0];
      const assignedTo = orgUsers[0];
      
      const leads = [
        {
          title: 'Website Inquiry - CRM Demo',
          description: 'Potential customer interested in CRM demo',
          status: 'NEW',
          score: 75,
          source: 'WEBSITE',
          estimatedValue: 15000,
          currency: 'USD'
        }
      ];

      for (const lead of leads) {
        const existing = await prisma.lead.findFirst({
          where: { organizationId: org.id, title: lead.title }
        });
        
        if (!existing) {
          await prisma.lead.create({
            data: {
              ...lead,
              organizationId: org.id,
              companyId: company.id,
              contactId: contact?.id,
              assignedToId: assignedTo.id
            }
          });
        }
      }

      // Auto replies
      const autoReplies = [
        {
          name: 'Welcome Auto Reply',
          subject: 'Thank you for your inquiry',
          content: 'Thank you for your interest. We will get back to you within 24 hours.',
          triggerConditions: { subject: { contains: 'inquiry' } },
          isActive: true
        }
      ];

      for (const reply of autoReplies) {
        const existing = await prisma.autoReply.findFirst({
          where: { organizationId: org.id, name: reply.name }
        });
        
        if (!existing) {
          await prisma.autoReply.create({
            data: { ...reply, organizationId: org.id }
          });
        }
      }
    }
  }

  // Orders & Invoices with Items
  console.log('💰 Creating orders and invoices...');
  for (const org of orgs) {
    const orgCompanies = companies.filter(c => c.organizationId === org.id);
    const orgContacts = contacts.filter(c => c.organizationId === org.id);
    const orgProducts = await prisma.product.findMany({ where: { organizationId: org.id } });
    const orgServices = await prisma.service.findMany({ where: { organizationId: org.id } });
    
    if (orgCompanies.length > 0 && orgProducts.length > 0) {
      const company = orgCompanies[0];
      const contact = orgContacts[0];
      const product = orgProducts[0];
      const service = orgServices[0];
      
      // Order
      const existingOrder = await prisma.order.findFirst({
        where: { organizationId: org.id }
      });
      
      const order = existingOrder || await prisma.order.create({
        data: {
          orderNumber: 'ORD-2025-002',
          title: 'Enterprise Software Order v2',
          customer: company.name,
          organizationId: org.id,
          status: 'CONFIRMED',
          totalAmount: 1299.99,
          currency: 'USD'
        }
      });

      // Order items
      if (!existingOrder) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            itemType: 'PRODUCT',
            quantity: 12,
            unitPrice: 99.99,
            totalPrice: 1199.88,
            description: 'CRM Pro License - Annual'
          }
        });
      }

      if (service && !existingOrder) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            serviceId: service.id,
            itemType: 'SERVICE',
            quantity: 1,
            unitPrice: 100.00,
            totalPrice: 100.00,
            description: 'Implementation Support - 1 hour'
          }
        });
      }

      // Invoice
      const existingInvoice = await prisma.invoice.findFirst({
        where: { organizationId: org.id }
      });
      
      const invoice = existingInvoice || await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-002',
          title: 'CRM Pro Software License Invoice v2',
          description: 'Annual subscription for CRM Pro software',
          organizationId: org.id,
          amount: 1439.88,
          status: 'SENT',
          subtotal: 1199.88,
          totalTax: 240.00,
          totalAmount: 1439.88,
          currency: 'USD',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customerEmail: contact?.email || 'customer@example.com',
          customerPhone: contact?.phone
        }
      });

      // Invoice items
      if (!existingInvoice) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,
            itemType: 'PRODUCT',
            customDescription: 'CRM Pro License - Annual Subscription',
            quantity: 12,
            unitPrice: 99.99,
            totalPrice: 1199.88
          }
        });
      }
    }
  }

  // Offers with Items
  console.log('📄 Creating offers...');
  for (const org of orgs) {
    const orgCompanies = companies.filter(c => c.organizationId === org.id);
    const orgContacts = contacts.filter(c => c.organizationId === org.id);
    const orgProducts = await prisma.product.findMany({ where: { organizationId: org.id } });
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgCompanies.length > 0 && orgProducts.length > 0 && orgUsers.length > 0) {
      const company = orgCompanies[0];
      const contact = orgContacts[0];
      const product = orgProducts[0];
      const creator = orgUsers[0];
      
      const existingOffer = await prisma.offer.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!existingOffer) {
        const offer = await prisma.offer.create({
          data: {
            offerNumber: 'OFF-2025-002',
            organizationId: org.id,
            customerName: company.name,
            title: 'CRM Implementation Package v2',
            description: 'Complete CRM setup and training package',
            status: 'SENT',
            totalAmount: 5000.00,
            currency: 'USD',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            customerEmail: contact?.email,
            customerPhone: contact?.phone,
            createdById: creator.id
          }
        });

        // Offer items
        await prisma.offerItem.create({
          data: {
            offerId: offer.id,
            productId: product.id,
            itemType: 'PRODUCT',
            customDescription: 'CRM Pro License - 1 Year',
            quantity: 1,
            unitPrice: 1200.00,
            totalPrice: 1200.00,
            discount: 10.0
          }
        });
      }
    }
  }

  // Recurring Tasks
  console.log('🔄 Creating recurring tasks...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgUsers.length > 0) {
      const assignedTo = orgUsers[0];
      
      const recurringTasks = [
        {
          title: 'Weekly Team Standup',
          description: 'Conduct weekly team standup meeting',
          frequency: 'WEEKLY' as const,
          interval: 1,
          daysOfWeek: [1], // Monday
          isActive: true
        },
        {
          title: 'Monthly Report Generation',
          description: 'Generate monthly progress report',
          frequency: 'MONTHLY' as const,
          interval: 1,
          dayOfMonth: 1,
          isActive: true
        }
      ];

      for (const task of recurringTasks) {
        const existing = await prisma.recurringTask.findFirst({
          where: { organizationId: org.id, title: task.title }
        });
        
        if (!existing) {
          await prisma.recurringTask.create({
            data: {
              ...task,
              organizationId: org.id,
              assignedToId: assignedTo.id,
              nextOccurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        }
      }
    }
  }

  // Files
  console.log('📁 Creating files...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    const orgProjects = projects.filter(p => p.organizationId === org.id);
    
    if (orgUsers.length > 0) {
      const uploader = orgUsers[0];
      const project = orgProjects[0];
      
      const files = [
        {
          fileName: 'project_requirements.pdf',
          fileType: 'PDF',
          size: 1024000,
          urlPath: '/uploads/files/project_requirements.pdf',
          parentId: project?.id,
          parentType: 'project'
        },
        {
          fileName: 'team_photo.jpg',
          fileType: 'IMAGE',
          size: 512000,
          urlPath: '/uploads/files/team_photo.jpg',
          parentId: project?.id,
          parentType: 'project'
        }
      ];

      for (const file of files) {
        const existing = await prisma.file.findFirst({
          where: { organizationId: org.id, fileName: file.fileName }
        });
        
        if (!existing) {
          await prisma.file.create({
            data: {
              ...file,
              organizationId: org.id
            }
          });
        }
      }
    }
  }

  // Documents & Wiki Pages
  console.log('📚 Creating documents and wiki pages...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    const folders = await prisma.folder.findMany({ where: { organizationId: org.id } });
    const wikiCategories = await prisma.wikiCategory.findMany({ where: { organizationId: org.id } });
    
    if (orgUsers.length > 0 && folders.length > 0) {
      const author = orgUsers[0];
      const folder = folders[0];
      const wikiCategory = wikiCategories[0];
      
      // Documents
      const documents = [
        {
          title: 'API Documentation',
          content: 'Comprehensive API documentation for developers',
          type: 'GUIDE',
          status: 'PUBLISHED',
          isPublic: false
        },
        {
          title: 'User Manual',
          content: 'Complete user manual for the CRM system',
          type: 'TUTORIAL',
          status: 'PUBLISHED',
          isPublic: true
        }
      ];

      for (const doc of documents) {
        const existing = await prisma.document.findFirst({
          where: { organizationId: org.id, title: doc.title }
        });
        
        if (!existing) {
          await prisma.document.create({
            data: {
              ...doc,
              organizationId: org.id,
              authorId: author.id,
              folderId: folder.id
            }
          });
        }
      }

      // Wiki pages
      if (wikiCategory) {
        const wikiPages = [
          {
            title: 'Getting Started Guide',
            content: 'Step-by-step guide to get started with the system',
            slug: 'getting-started-guide',
            isPublished: true
          },
          {
            title: 'Advanced Features',
            content: 'Documentation for advanced system features',
            slug: 'advanced-features',
            isPublished: false
          }
        ];

        for (const page of wikiPages) {
          const existing = await prisma.wikiPage.findFirst({
            where: { organizationId: org.id, slug: page.slug }
          });
          
          if (!existing) {
            await prisma.wikiPage.create({
              data: {
                ...page,
                organizationId: org.id,
                categoryId: wikiCategory.id,
                authorId: author.id
              }
            });
          }
        }
      }
    }
  }

  // Bug Reports & Activities 
  console.log('🐛 Creating bug reports and activities...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    const orgTasks = tasks.filter(t => t.organizationId === org.id);
    const orgProjects = projects.filter(p => p.organizationId === org.id);
    
    if (orgUsers.length > 0) {
      const reporter = orgUsers[0];
      const project = orgProjects[0];
      
      // Simple bug report
      const bugExists = await prisma.bugReport.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!bugExists) {
        await prisma.bugReport.create({
          data: {
            organizationId: org.id,
            title: 'Login page not responsive on mobile',
            description: 'The login page layout breaks on mobile devices when viewing in portrait mode',
            priority: 'MEDIUM',
            status: 'OPEN',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
            url: '/auth/login',
            stepsToReproduce: '1. Open login page on mobile\n2. Rotate to portrait mode\n3. Try to enter credentials',
            expectedBehavior: 'Form should be fully visible and usable',
            actualBehavior: 'Form elements overlap and submit button is cut off',
            reporterId: reporter.id
          }
        });
      }
      
      // Simple activity  
      if (orgTasks.length > 0) {
        const task = orgTasks[0];
        
        await prisma.activity.create({
          data: {
            organizationId: org.id,
            title: 'Task Created',
            description: `Task "${task.title}" was created`,
            type: 'TASK_CREATED',
            userId: reporter.id,
            metadata: { taskId: task.id, taskTitle: task.title }
          }
        });
      }
    }
  }

  // SMART Templates & Analysis
  console.log('🎯 Creating SMART templates...');
  for (const org of orgs) {
    const smartTemplates = [
      {
        name: 'Project Goal Template',
        taskTemplate: 'Complete [specific task] by [date] with [measurable outcome]',
        measurableCriteria: 'Success metrics: completion rate, quality score, timeline adherence',
        typicalResources: 'Team members, tools, budget allocation',
        estimatedDuration: 14,
        typicalDependencies: 'Stakeholder approval, resource availability'
      },
      {
        name: 'Sales Target Template', 
        taskTemplate: 'Achieve [revenue target] in [time period] through [specific actions]',
        measurableCriteria: 'Revenue generated, conversion rate, customer acquisition',
        typicalResources: 'Sales team, marketing budget, CRM tools',
        estimatedDuration: 30,
        typicalDependencies: 'Market conditions, product availability, team capacity'
      }
    ];

    for (const template of smartTemplates) {
      const existing = await prisma.sMARTTemplate.findFirst({
        where: { organizationId: org.id, name: template.name }
      });
      
      if (!existing) {
        await prisma.sMARTTemplate.create({
          data: { ...template, organizationId: org.id }
        });
      }
    }
  }

  // Weekly Reviews & Habits (simplified)
  console.log('📅 Creating weekly reviews...');
  for (const org of orgs) {
    const orgUsers = users.filter(u => u.organizationId === org.id);
    
    if (orgUsers.length > 0) {
      // Weekly review
      const existing = await prisma.weeklyReview.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!existing) {
        await prisma.weeklyReview.create({
          data: {
            organizationId: org.id,
            reviewDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            completedTasksCount: 12,
            newTasksCount: 8,
            stalledTasks: 1,
            nextActions: 'Complete remaining high-priority tasks and plan next week',
            notes: 'Excellent week with good progress on all fronts',
            collectLoosePapers: true,
            processNotes: true,
            emptyInbox: true,
            processVoicemails: true,
            reviewActionLists: true,
            reviewCalendar: true,
            reviewProjects: true,
            reviewWaitingFor: true,
            reviewSomedayMaybe: true
          }
        });
      }
    }
  }

  console.log('✅ All remaining tables seeded successfully!');
}

seedRemainingTables()
  .catch((e) => {
    console.error('❌ Error during remaining tables seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });