import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting consolidated seed...');

  // Check for existing organizations
  const existingOrgs = await prisma.organization.findMany();

  if (existingOrgs.length === 0) {
    console.log('❌ No existing organizations found. Please run basic seed first.');
    return;
  }

  console.log(`📊 Working with ${existingOrgs.length} organizations`);

  // Run the comprehensive data seeding
  try {
    // Import and run the working seed script
    await import('./seed-complete-data');
    console.log('✅ Comprehensive data seeding completed!');
  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
    throw error;
  }

  // Additional data for remaining important tables
  for (const org of existingOrgs) {
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    const tasks = await prisma.task.findMany({ where: { organizationId: org.id } });
    const projects = await prisma.project.findMany({ where: { organizationId: org.id } });
    const companies = await prisma.company.findMany({ where: { organizationId: org.id } });
    const contacts = await prisma.contact.findMany({ where: { organizationId: org.id } });
    const streams = await prisma.stream.findMany({ where: { organizationId: org.id } });
    const channels = await prisma.communicationChannel.findMany({ where: { organizationId: org.id } });

    if (users.length === 0) continue;

    const creator = users[0];
    const assignee = users.length > 1 ? users[1] : users[0];

    // Stream Channels (simplified)
    console.log('📺 Creating stream channels...');
    for (const stream of streams) {
      const channelExists = await prisma.streamChannel.findFirst({
        where: { streamId: stream.id }
      });
      
      if (!channelExists && channels.length > 0) {
        await prisma.streamChannel.create({
          data: {
            streamId: stream.id,
            channelId: channels[0].id
          }
        });
      }
    }

    // Task Dependencies (simplified)
    console.log('🔗 Creating task dependencies...');
    if (tasks.length >= 2) {
      const task1 = tasks[0];
      const task2 = tasks[1];
      
      const existing = await prisma.dependency.findFirst({
        where: { 
          sourceId: task1.id, 
          targetId: task2.id,
          sourceType: 'task',
          targetType: 'task'
        }
      });
      
      if (!existing) {
        await prisma.dependency.create({
          data: {
            sourceId: task1.id,
            targetId: task2.id,
            sourceType: 'task',
            targetType: 'task',
            type: 'FINISH_TO_START' as const
          }
        });
      }
    }

    // Messages (simplified)
    console.log('📨 Creating messages...');
    if (channels.length > 0 && contacts.length > 0) {
      const channel = channels[0];
      const contact = contacts[0];
      const company = companies[0];
      
      const messageExists = await prisma.message.findFirst({
        where: { channelId: channel.id }
      });
      
      if (!messageExists) {
        await prisma.message.create({
          data: {
            organizationId: org.id,
            channelId: channel.id,
            contactId: contact.id,
            companyId: company?.id,
            subject: 'Project Update Required',
            content: 'Hi, we need an update on the current project status.',
            fromAddress: contact.email || 'unknown@example.com',
            fromName: `${contact.firstName} ${contact.lastName}`,
            toAddress: 'info@company.com',
            receivedAt: new Date(),
            urgencyScore: 75,
            actionNeeded: true
          }
        });
      }
    }

    // Processing Rules (simplified)
    console.log('⚙️ Creating processing rules...');
    const processingRuleExists = await prisma.processingRule.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!processingRuleExists) {
      await prisma.processingRule.create({
        data: {
          organizationId: org.id,
          name: 'Auto-prioritize urgent emails',
          description: 'Automatically set high priority for urgent emails',
          conditions: { subject: { contains: 'URGENT' } },
          actions: { setPriority: 'HIGH', addTag: 'urgent' },
          active: true,
          priority: 1
        }
      });
    }

    // Unified Rules (simplified)
    console.log('🔄 Creating unified rules...');
    const unifiedRuleExists = await prisma.unifiedRule.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!unifiedRuleExists) {
      const rule = await prisma.unifiedRule.create({
        data: {
          organizationId: org.id,
          name: 'Email to Task Converter',
          description: 'Convert important emails to tasks automatically',
          ruleType: 'PROCESSING' as const,
          triggerType: 'MANUAL' as const,
          conditions: { urgencyScore: { gte: 70 } },
          actions: { createTask: true, assignTo: creator.id },
          status: 'ACTIVE',
          priority: 1,
          createdBy: creator.id
        }
      });

      // Rule execution
      await prisma.unifiedRuleExecution.create({
        data: {
          organizationId: org.id,
          ruleId: rule.id,
          status: 'SUCCESS' as const,
          executionTime: 125.5,
          result: { message: 'Rule executed successfully', tasksCreated: 1 }
        }
      });
    }

    // AI Rules & Executions (simplified)
    console.log('🤖 Creating AI rules...');
    const providers = await prisma.aIProvider.findMany({ where: { organizationId: org.id } });
    const models = await prisma.aIModel.findMany({ 
      where: { provider: { organizationId: org.id } } 
    });
    
    if (providers.length > 0 && models.length > 0) {
      const provider = providers[0];
      const model = models[0];
      
      const aiRuleExists = await prisma.aIRule.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!aiRuleExists) {
        const aiRule = await prisma.aIRule.create({
          data: {
            organizationId: org.id,
            name: 'Sentiment Analysis for Emails',
            description: 'Analyze sentiment of incoming emails',
            triggerType: 'EMAIL_RECEIVED' as const,
            conditions: { hasContent: true },
            aiPrompt: 'Analyze the sentiment of this email and provide a score from 1-10',
            isActive: true,
            providerId: provider.id,
            modelId: model.id,
            createdById: creator.id
          }
        });

        // AI execution
        await prisma.aIExecution.create({
          data: {
            organizationId: org.id,
            ruleId: aiRule.id,
            status: 'COMPLETED' as const,
            input: { emailContent: 'Sample email content for sentiment analysis' },
            output: { sentiment: 'positive', score: 8.5 },
            tokensUsed: 150,
            cost: 0.0045,
            executedAt: new Date()
          }
        });
      }
    }

    // Leads (simplified)
    console.log('🎯 Creating leads...');
    if (companies.length > 0) {
      const company = companies[0];
      const contact = contacts[0];
      
      const leadExists = await prisma.lead.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!leadExists) {
        await prisma.lead.create({
          data: {
            organizationId: org.id,
            title: 'Website Inquiry - CRM Demo',
            description: 'Potential customer interested in CRM demo',
            status: 'NEW' as const,
            source: 'Website',
            value: 15000,
            company: company.name,
            contactPerson: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'
          }
        });
      }
    }

    // Auto Replies (simplified)
    console.log('📧 Creating auto replies...');
    const autoReplyExists = await prisma.autoReply.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!autoReplyExists) {
      await prisma.autoReply.create({
        data: {
          organizationId: org.id,
          name: 'Welcome Auto Reply',
          subject: 'Thank you for your inquiry',
          content: 'Thank you for your interest. We will get back to you within 24 hours.',
          triggerConditions: { subject: { contains: 'inquiry' } },
          status: 'ACTIVE'
        }
      });
    }

    // Orders & Invoices (simplified)
    console.log('💰 Creating orders and invoices...');
    const products = await prisma.product.findMany({ where: { organizationId: org.id } });
    
    if (companies.length > 0 && products.length > 0) {
      const company = companies[0];
      const contact = contacts[0];
      const product = products[0];
      
      const orderExists = await prisma.order.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!orderExists) {
        const order = await prisma.order.create({
          data: {
            organizationId: org.id,
            orderNumber: 'ORD-2025-001',
            title: 'Enterprise Software Order',
            customer: company.name,
            status: 'CONFIRMED' as const,
            totalAmount: 1299.99,
            currency: 'USD',
            customerEmail: contact?.email,
            customerPhone: contact?.phone
          }
        });

        // Order item
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

        // Invoice
        const invoice = await prisma.invoice.create({
          data: {
            organizationId: org.id,
            invoiceNumber: 'INV-2025-001',
            title: 'CRM Pro Software License Invoice',
            description: 'Annual subscription for CRM Pro software',
            amount: 1439.88,
            status: 'SENT' as const,
            subtotal: 1199.88,
            totalTax: 240.00,
            totalAmount: 1439.88,
            currency: 'USD',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            customerEmail: contact?.email || 'customer@example.com',
            customerPhone: contact?.phone
          }
        });

        // Invoice item
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

    // Offers (simplified)
    console.log('📄 Creating offers...');
    if (companies.length > 0 && products.length > 0) {
      const company = companies[0];
      const contact = contacts[0];
      const product = products[0];
      
      const offerExists = await prisma.offer.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!offerExists) {
        const offer = await prisma.offer.create({
          data: {
            organizationId: org.id,
            offerNumber: 'OFF-2025-001',
            customerName: company.name,
            title: 'CRM Implementation Package',
            description: 'Complete CRM setup and training package',
            status: 'SENT' as const,
            totalAmount: 5000.00,
            currency: 'USD',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            customerEmail: contact?.email,
            customerPhone: contact?.phone,
            createdById: creator.id
          }
        });

        // Offer item
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

    // Recurring Tasks (simplified)
    console.log('🔄 Creating recurring tasks...');
    const recurringTaskExists = await prisma.recurringTask.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!recurringTaskExists) {
      await prisma.recurringTask.create({
        data: {
          organizationId: org.id,
          title: 'Weekly Team Standup',
          description: 'Conduct weekly team standup meeting',
          frequency: 'WEEKLY' as const,
          interval: 1,
          daysOfWeek: [1], // Monday
          time: '09:00',
          assignedToId: creator.id,
          nextOccurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Files (simplified)
    console.log('📁 Creating files...');
    const fileExists = await prisma.file.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!fileExists && projects.length > 0) {
      await prisma.file.create({
        data: {
          organizationId: org.id,
          fileName: 'project_requirements.pdf',
          fileType: 'PDF',
          size: 1024000,
          urlPath: '/uploads/files/project_requirements.pdf',
          parentId: projects[0].id,
          parentType: 'project'
        }
      });
    }

    // Documents & Wiki Pages (simplified)
    console.log('📚 Creating documents and wiki pages...');
    const folders = await prisma.folder.findMany({ where: { organizationId: org.id } });
    const wikiCategories = await prisma.wikiCategory.findMany({ where: { organizationId: org.id } });
    
    if (folders.length > 0) {
      const docExists = await prisma.document.findFirst({
        where: { organizationId: org.id }
      });
      
      if (!docExists) {
        await prisma.document.create({
          data: {
            organizationId: org.id,
            title: 'API Documentation',
            content: 'Comprehensive API documentation for developers',
            type: 'GUIDE' as const,
            status: 'PUBLISHED' as const,
            isPublic: false,
            authorId: creator.id,
            folderId: folders[0].id
          }
        });
      }

      if (wikiCategories.length > 0) {
        const wikiExists = await prisma.wikiPage.findFirst({
          where: { organizationId: org.id }
        });
        
        if (!wikiExists) {
          await prisma.wikiPage.create({
            data: {
              organizationId: org.id,
              title: 'Getting Started Guide',
              content: 'Step-by-step guide to get started with the system',
              slug: 'getting-started-guide',
              isPublished: true,
              categoryId: wikiCategories[0].id,
              authorId: creator.id
            }
          });
        }
      }
    }

    // Bug Reports skipped - too many complex fields

    // Activities (simplified)
    if (tasks.length > 0) {
      await prisma.activity.create({
        data: {
          organizationId: org.id,
          title: 'Task Created',
          description: `Task "${tasks[0].title}" was created`,
          type: 'TASK_CREATED' as const,
          userId: creator.id,
          metadata: { taskId: tasks[0].id, taskTitle: tasks[0].title }
        }
      });
    }

    // SMART Templates (simplified)
    console.log('🎯 Creating SMART templates...');
    const smartTemplateExists = await prisma.sMARTTemplate.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!smartTemplateExists) {
      await prisma.sMARTTemplate.create({
        data: {
          organizationId: org.id,
          name: 'Project Goal Template',
          taskTemplate: 'Complete [specific task] by [date] with [measurable outcome]',
          measurableCriteria: 'Success metrics: completion rate, quality score, timeline adherence',
          typicalResources: 'Team members, tools, budget allocation',
          estimatedDuration: 14, // 2 weeks
          typicalDependencies: 'Stakeholder approval, resource availability, technical requirements'
        }
      });
    }

    // Weekly Reviews (simplified)  
    console.log('📅 Creating weekly reviews...');
    const weeklyReviewExists = await prisma.weeklyReview.findFirst({
      where: { organizationId: org.id }
    });
    
    if (!weeklyReviewExists) {
      await prisma.weeklyReview.create({
        data: {
          organizationId: org.id,
          reviewDate: new Date(),
          completedTasksCount: 8,
          newTasksCount: 5,
          stalledTasks: 2,
          nextActions: 'Focus on completing high-priority projects and clearing inbox',
          notes: 'Good progress this week. Need to improve task delegation.',
          collectLoosePapers: true,
          processNotes: true,
          emptyInbox: false,
          processVoicemails: true,
          reviewActionLists: true,
          reviewCalendar: true,
          reviewProjects: false,
          reviewWaitingFor: true,
          reviewSomedayMaybe: false
        }
      });
    }
  }

  console.log('✅ Consolidated seed completed successfully!');
  console.log('📊 Database now contains comprehensive sample data for 97+ tables');
  
  // Count total records
  const counts = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.task.count(),
    prisma.project.count(),
    prisma.company.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.message.count(),
    prisma.activity.count()
  ]);
  
  console.log(`📈 Total records created:`);
  console.log(`   Organizations: ${counts[0]}`);
  console.log(`   Users: ${counts[1]}`);
  console.log(`   Tasks: ${counts[2]}`);
  console.log(`   Projects: ${counts[3]}`);
  console.log(`   Companies: ${counts[4]}`);
  console.log(`   Contacts: ${counts[5]}`);
  console.log(`   Deals: ${counts[6]}`);
  console.log(`   Messages: ${counts[7]}`);
  console.log(`   Activities: ${counts[8]}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during consolidated seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });