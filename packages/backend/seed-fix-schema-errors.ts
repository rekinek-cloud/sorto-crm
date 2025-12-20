import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSchemaErrors() {
  console.log('🔧 NAPRAWIANIE BŁĘDÓW SCHEMA - ostatnie 26 pustych tabel\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const tasks = await prisma.task.findMany({ take: 3 });
    const projects = await prisma.project.findMany({ take: 3 });
    const messages = await prisma.message.findMany({ take: 3 });
    const documents = await prisma.document.findMany({ take: 2 });
    const streams = await prisma.stream.findMany({ take: 2 });
    const unifiedRules = await prisma.unifiedRule.findMany({ take: 2 });
    const contexts = await prisma.context.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. AI USAGE STATS - poprawna struktura
    await seedIfEmpty('ai_usage_stats', async () => {
      const aiUsageStatsData: Prisma.AIUsageStatsCreateManyInput[] = [
        {
          organizationId: organization.id,
          date: new Date('2024-12-27'),
          totalExecutions: 156,
          successfulExecutions: 153,
          failedExecutions: 3,
          totalTokensUsed: 45230,
          totalCost: 12.45,
          providerStats: { openai: { executions: 156, tokens: 45230, cost: 12.45 } },
          modelStats: { 'gpt-4': { executions: 89, tokens: 28000, cost: 8.12 }, 'gpt-3.5-turbo': { executions: 67, tokens: 17230, cost: 4.33 } }
        },
        {
          organizationId: organization.id,
          date: new Date('2024-12-26'),
          totalExecutions: 98,
          successfulExecutions: 97,
          failedExecutions: 1,
          totalTokensUsed: 28940,
          totalCost: 7.89,
          providerStats: { openai: { executions: 98, tokens: 28940, cost: 7.89 } },
          modelStats: { 'gpt-4': { executions: 45, tokens: 18000, cost: 5.12 }, 'gpt-3.5-turbo': { executions: 53, tokens: 10940, cost: 2.77 } }
        }
      ];
      await prisma.aIUsageStats.createMany({ data: aiUsageStatsData });
    });

    // 2. COMPLAINTS - z wymaganym polem customer
    await seedIfEmpty('complaints', async () => {
      const complaintData: Prisma.ComplaintCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'System Performance Issues',
          description: 'The dashboard loads very slowly during peak hours, affecting productivity',
          customer: 'Tech Solutions Sp. z o.o.',
          category: 'TECHNICAL',
          priority: 'HIGH',
          status: 'OPEN',
          source: 'INTERNAL',
          reportedById: users[0].id,
          assignedToId: users[1]?.id,
          resolutionTargetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          organizationId: organization.id,
          title: 'Missing Email Notifications',
          description: 'Users report not receiving email notifications for task assignments',
          customer: 'Digital Marketing Group',
          category: 'FUNCTIONAL',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          source: 'USER_REPORT',
          reportedById: users[1]?.id || users[0].id,
          assignedToId: users[0].id,
          resolutionTargetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      ];
      await prisma.complaint.createMany({ data: complaintData });
    });

    // 3. CRITICAL PATH - bez organizationId
    if (tasks.length >= 2) {
      await seedIfEmpty('critical_path', async () => {
        const criticalPathData: Prisma.CriticalPathCreateManyInput[] = [
          {
            pathName: 'MVP Launch Critical Path',
            taskIds: [tasks[0].id, tasks[1].id],
            totalDuration: 45,
            startDate: new Date(),
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            isActive: true,
            priority: 'HIGH'
          },
          {
            pathName: 'Q1 Delivery Path',
            taskIds: [tasks[1].id, tasks[2]?.id || tasks[0].id],
            totalDuration: 60,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000),
            isActive: true,
            priority: 'MEDIUM'
          }
        ];
        await prisma.criticalPath.createMany({ data: criticalPathData });
      });
    }

    // 4. EMAIL ANALYSIS - z wymaganymi polami
    if (messages.length > 0) {
      await seedIfEmpty('email_analysis', async () => {
        const emailAnalysisData: Prisma.EmailAnalysisCreateManyInput[] = [
          {
            organizationId: organization.id,
            messageId: messages[0].id,
            emailFrom: messages[0].fromAddress || 'sender@example.com',
            emailTo: messages[0].toAddress || 'recipient@example.com',
            subject: messages[0].subject || 'Email Subject',
            sentiment: 'NEUTRAL',
            urgencyScore: 75,
            importanceScore: 80,
            category: 'BUSINESS',
            suggestedActions: ['CREATE_TASK', 'SET_DEADLINE'],
            confidence: 0.89,
            processedAt: new Date(),
            aiModelUsed: 'gpt-4'
          },
          {
            organizationId: organization.id,
            messageId: messages[1]?.id || messages[0].id,
            emailFrom: messages[1]?.fromAddress || messages[0].fromAddress || 'sender2@example.com',
            emailTo: messages[1]?.toAddress || messages[0].toAddress || 'recipient2@example.com',
            subject: messages[1]?.subject || messages[0].subject || 'Email Subject 2',
            sentiment: 'POSITIVE',
            urgencyScore: 45,
            importanceScore: 60,
            category: 'GENERAL',
            suggestedActions: ['ARCHIVE'],
            confidence: 0.95,
            processedAt: new Date(),
            aiModelUsed: 'gpt-3.5-turbo'
          }
        ];
        await prisma.emailAnalysis.createMany({ data: emailAnalysisData });
      });
    }

    // 5. EMAIL LOGS - z success field
    await seedIfEmpty('email_logs', async () => {
      const emailLogData: Prisma.EmailLogCreateManyInput[] = [
        {
          organizationId: organization.id,
          action: 'SENT',
          fromAddress: 'system@crm-gtd.com',
          toAddress: 'user@example.com',
          subject: 'Welcome to CRM-GTD Smart',
          status: 'SUCCESS',
          success: true,
          provider: 'sendgrid',
          messageId: 'msg_12345',
          timestamp: new Date(),
          deliveredAt: new Date()
        },
        {
          organizationId: organization.id,
          action: 'RECEIVED',
          fromAddress: 'client@company.com',
          toAddress: 'support@crm-gtd.com',
          subject: 'Support Request',
          status: 'SUCCESS',
          success: true,
          provider: 'gmail',
          messageId: 'msg_67890',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
      await prisma.emailLog.createMany({ data: emailLogData });
    });

    // 6. ERROR LOGS - z url field
    await seedIfEmpty('error_logs', async () => {
      const errorLogData: Prisma.ErrorLogCreateManyInput[] = [
        {
          organizationId: organization.id,
          level: 'ERROR',
          message: 'Database connection timeout during peak hours',
          stack: 'Error: Connection timeout\n    at Database.connect (db.js:45)\n    at processTicksAndRejections',
          source: 'DATABASE',
          url: '/api/v1/tasks',
          userId: users[0].id,
          context: { action: 'task_create', ip: '192.168.1.100' },
          resolved: false,
          timestamp: new Date()
        },
        {
          organizationId: organization.id,
          level: 'WARNING',
          message: 'High memory usage detected',
          stack: null,
          source: 'SYSTEM',
          url: '/api/v1/dashboard',
          userId: null,
          context: { memory_usage: '85%', threshold: '80%' },
          resolved: true,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ];
      await prisma.errorLog.createMany({ data: errorLogData });
    });

    // 7. INFO - sprawdzę jaka jest właściwa struktura
    await seedIfEmpty('info', async () => {
      const infoData: Prisma.InfoCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'System Maintenance Notice',
          content: 'Scheduled maintenance window on Sunday 2:00-4:00 AM UTC',
          priority: 'HIGH',
          isActive: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdById: users[0].id
        },
        {
          organizationId: organization.id,
          title: 'New Feature Release',
          content: 'Voice TTS functionality is now available in Smart Mailboxes',
          priority: 'MEDIUM',
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdById: users[0].id
        }
      ];
      await prisma.info.createMany({ data: infoData });
    });

    // 8. NEXT ACTIONS - z context field (string)
    await seedIfEmpty('next_actions', async () => {
      const nextActionData: Prisma.NextActionCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Review Q4 budget proposals',
          description: 'Analyze and approve budget proposals for Q4 initiatives',
          context: '@office',
          priority: 'HIGH',
          energy: 'HIGH',
          estimatedTime: '120min',
          status: 'NEW',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assignedToId: users[0].id
        },
        {
          organizationId: organization.id,
          title: 'Call vendor about delivery delay',
          description: 'Follow up on delayed equipment delivery with supplier',
          context: '@calls',
          priority: 'MEDIUM',
          energy: 'LOW',
          estimatedTime: '15min',
          status: 'NEW',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          assignedToId: users[1]?.id || users[0].id
        }
      ];
      await prisma.nextAction.createMany({ data: nextActionData });
    });

    // 9. RECOMMENDATIONS - z content field
    await seedIfEmpty('recommendations', async () => {
      const recommendationData: Prisma.RecommendationCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Optimize Task Assignment',
          content: 'Based on workload analysis, consider redistributing tasks to balance team capacity',
          description: 'Detailed analysis shows workload imbalance across team members',
          category: 'PRODUCTIVITY',
          priority: 'MEDIUM',
          confidence: 0.85,
          source: 'AI_ANALYSIS',
          targetUserId: users[0].id,
          relatedEntityId: projects[0]?.id,
          relatedEntityType: 'project',
          actionRequired: true,
          aiModel: 'gpt-4',
          generatedAt: new Date()
        },
        {
          organizationId: organization.id,
          title: 'Email Processing Improvement',
          content: 'Implement additional auto-reply rules to reduce manual email processing by 30%',
          description: 'Analysis of email patterns suggests automation opportunities',
          category: 'AUTOMATION',
          priority: 'LOW',
          confidence: 0.92,
          source: 'PATTERN_ANALYSIS',
          targetUserId: users[1]?.id || users[0].id,
          relatedEntityId: null,
          relatedEntityType: null,
          actionRequired: false,
          aiModel: 'claude-3',
          generatedAt: new Date()
        }
      ];
      await prisma.recommendation.createMany({ data: recommendationData });
    });

    // 10. SEARCH INDEX - bez tags
    await seedIfEmpty('search_index', async () => {
      const searchIndexData: Prisma.SearchIndexCreateManyInput[] = [
        {
          organizationId: organization.id,
          entityType: 'task',
          entityId: tasks[0]?.id || '1',
          title: tasks[0]?.title || 'Sample Task',
          content: tasks[0]?.description || 'Sample task description',
          searchVector: 'development project task implementation',
          lastIndexed: new Date()
        },
        {
          organizationId: organization.id,
          entityType: 'document',
          entityId: documents[0]?.id || '1',
          title: documents[0]?.title || 'Sample Document',
          content: documents[0]?.content || 'Sample document content',
          searchVector: 'documentation guide manual user',
          lastIndexed: new Date()
        }
      ];
      await prisma.searchIndex.createMany({ data: searchIndexData });
    });

    // 11. TASK HISTORY - z fieldName
    if (tasks.length > 0) {
      await seedIfEmpty('task_history', async () => {
        const taskHistoryData: Prisma.TaskHistoryCreateManyInput[] = [
          {
            organizationId: organization.id,
            taskId: tasks[0].id,
            action: 'CREATED',
            fieldName: 'status',
            oldValue: null,
            newValue: { title: tasks[0].title, status: 'NEW' },
            changedById: users[0].id,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            organizationId: organization.id,
            taskId: tasks[0].id,
            action: 'STATUS_CHANGED',
            fieldName: 'status',
            oldValue: { status: 'NEW' },
            newValue: { status: 'IN_PROGRESS' },
            changedById: users[0].id,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ];
        await prisma.taskHistory.createMany({ data: taskHistoryData });
      });
    }

    // 12. TIMELINE - z eventId
    await seedIfEmpty('timeline', async () => {
      const timelineData: Prisma.TimelineCreateManyInput[] = [
        {
          organizationId: organization.id,
          entityType: 'task',
          entityId: tasks[0]?.id || '1',
          eventId: 'evt_task_created_001',
          eventType: 'CREATED',
          description: 'Task was created and assigned to team',
          metadata: { priority: 'HIGH', assignee: users[0].email },
          userId: users[0].id,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          organizationId: organization.id,
          entityType: 'project',
          entityId: projects[0]?.id || '1',
          eventId: 'evt_milestone_001',
          eventType: 'MILESTONE_REACHED',
          description: 'Project reached 50% completion milestone',
          metadata: { milestone: 'Phase 1 Complete', progress: 50 },
          userId: users[1]?.id || users[0].id,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];
      await prisma.timeline.createMany({ data: timelineData });
    });

    // 13. UNIMPORTANT - z content field
    await seedIfEmpty('unimportant', async () => {
      const unimportantData: Prisma.UnimportantCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Office supply inventory check',
          content: 'Check office supplies and restock as needed',
          description: 'Monthly check of office supplies and restocking',
          category: 'ADMINISTRATIVE',
          priority: 'LOW',
          estimatedTime: 30,
          deferredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdById: users[0].id,
          reason: 'Low priority maintenance task'
        },
        {
          organizationId: organization.id,
          title: 'Update company LinkedIn profile',
          content: 'Refresh company description and add recent achievements',
          description: 'Refresh company description and add recent achievements',
          category: 'MARKETING',
          priority: 'LOW',
          estimatedTime: 45,
          deferredUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdById: users[1]?.id || users[0].id,
          reason: 'Nice to have but not urgent'
        }
      ];
      await prisma.unimportant.createMany({ data: unimportantData });
    });

    // 14. USER ACCESS LOGS - bez sessionId
    await seedIfEmpty('user_access_logs', async () => {
      const userAccessLogData: Prisma.UserAccessLogCreateManyInput[] = [
        {
          organizationId: organization.id,
          userId: users[0].id,
          action: 'LOGIN',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          timestamp: new Date()
        },
        {
          organizationId: organization.id,
          userId: users[1]?.id || users[0].id,
          action: 'PASSWORD_CHANGE',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          success: true,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
      await prisma.userAccessLog.createMany({ data: userAccessLogData });
    });

    // 15. VECTOR CACHE - z queryText
    await seedIfEmpty('vector_cache', async () => {
      const vectorCacheData: Prisma.VectorCacheCreateManyInput[] = [
        {
          organizationId: organization.id,
          queryText: 'urgent email analysis',
          cacheKey: 'msg_urgent_analysis_v1',
          vectorData: [0.1, 0.2, 0.3, 0.4, 0.5],
          metadata: { model: 'text-embedding-ada-002', version: '1.0' },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          hitCount: 15,
          lastAccessed: new Date()
        },
        {
          organizationId: organization.id,
          queryText: 'task similarity search',
          cacheKey: 'task_similarity_search_v2',
          vectorData: [0.6, 0.7, 0.8, 0.9, 1.0],
          metadata: { model: 'text-embedding-ada-002', version: '2.0' },
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          hitCount: 8,
          lastAccessed: new Date()
        }
      ];
      await prisma.vectorCache.createMany({ data: vectorCacheData });
    });

    // 16. VECTOR DOCUMENTS - z title
    await seedIfEmpty('vector_documents', async () => {
      const vectorDocumentData: Prisma.VectorDocumentCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Urgent Project Request',
          sourceType: 'message',
          sourceId: messages[0]?.id || '1',
          content: 'Urgent request for project status update and timeline adjustment',
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
          metadata: { urgency: 'high', category: 'project_management' },
          embeddingModel: 'text-embedding-ada-002',
          chunkIndex: 0,
          totalChunks: 1
        },
        {
          organizationId: organization.id,
          title: 'GTD Methodology Guide',
          sourceType: 'document',
          sourceId: documents[0]?.id || '1',
          content: 'Comprehensive guide to GTD methodology implementation',
          embedding: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
          metadata: { category: 'documentation', topic: 'productivity' },
          embeddingModel: 'text-embedding-ada-002',
          chunkIndex: 0,
          totalChunks: 3
        }
      ];
      await prisma.vectorDocument.createMany({ data: vectorDocumentData });
    });

    // 17. VECTOR SEARCH RESULTS - z queryText
    await seedIfEmpty('vector_search_results', async () => {
      const vectorSearchResultData: Prisma.VectorSearchResultCreateManyInput[] = [
        {
          organizationId: organization.id,
          queryText: 'urgent project deadlines',
          query: 'urgent project deadlines',
          resultType: 'message',
          resultId: messages[0]?.id || '1',
          similarity: 0.89,
          searchMetadata: { model: 'text-embedding-ada-002', threshold: 0.7 },
          searchSessionId: 'search_session_123',
          userId: users[0].id,
          timestamp: new Date()
        },
        {
          organizationId: organization.id,
          queryText: 'GTD methodology documentation',
          query: 'GTD methodology documentation',
          resultType: 'document',
          resultId: documents[0]?.id || '1',
          similarity: 0.94,
          searchMetadata: { model: 'text-embedding-ada-002', threshold: 0.8 },
          searchSessionId: 'search_session_124',
          userId: users[1]?.id || users[0].id,
          timestamp: new Date()
        }
      ];
      await prisma.vectorSearchResult.createMany({ data: vectorSearchResultData });
    });

    console.log('\n🎉 SUKCES! Naprawiono błędy schema i wypełniono tabele!');
    console.log('🎯 Postęp w kierunku 100% wypełnienia bazy danych!');

  } catch (error) {
    console.error('❌ Błąd naprawy schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Naprawianie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - NAPRAWIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie naprawy schema errors
fixSchemaErrors()
  .catch((error) => {
    console.error('💥 Krytyczny błąd naprawy schema:', error);
    process.exit(1);
  });