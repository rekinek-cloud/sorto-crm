import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRemainingTables() {
  console.log('🌱 Wypełnianie pozostałych pustych tabel...\n');

  try {
    // Pobierz organizację
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('Brak organizacji w bazie danych!');
    }

    // 1. email_analysis - Analiza sentymenty emaili
    console.log('📧 Wypełnianie email_analysis...');
    const messages = await prisma.message.findMany({ take: 3 });
    
    if (messages.length > 0) {
      const emailAnalysisData = messages.map(msg => ({
        messageId: msg.id,
        emailFrom: 'sender@example.com',
        emailSubject: msg.subject || 'No subject',
        emailReceived: new Date(),
        sender: 'sender@example.com',
        subject: msg.subject || 'No subject',
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
        importance: Math.floor(Math.random() * 10) + 1,
        urgency: Math.floor(Math.random() * 10) + 1,
        actionRequired: Math.random() > 0.5,
        category: ['business', 'personal', 'spam', 'newsletter'][Math.floor(Math.random() * 4)],
        keywords: ['meeting', 'urgent', 'proposal', 'invoice'],
        organizationId: organization.id
      }));

      for (const analysis of emailAnalysisData) {
        await prisma.emailAnalysis.create({ data: analysis });
      }
      console.log(`✅ Utworzono ${emailAnalysisData.length} analiz emaili`);
    }

    // 2. search_index - Indeks wyszukiwania
    console.log('\n🔍 Wypełnianie search_index...');
    const searchIndexData = [
      {
        entityType: 'task',
        entityId: (await prisma.task.findFirst())?.id || '',
        title: 'Analyze system requirements',
        content: 'Review and analyze system requirements for the new CRM integration project. Focus on performance, scalability and user experience.',
        tags: ['analysis', 'requirements', 'crm'],
        category: 'tasks',
        url: '/tasks/analyze-requirements',
        organizationId: organization.id
      },
      {
        entityType: 'project',
        entityId: (await prisma.project.findFirst())?.id || '',
        title: 'CRM Integration Project',
        content: 'Complete integration of CRM system with existing infrastructure. Includes data migration, API development and user training.',
        tags: ['crm', 'integration', 'project'],
        category: 'projects',
        url: '/projects/crm-integration',
        organizationId: organization.id
      },
      {
        entityType: 'contact',
        entityId: (await prisma.contact.findFirst())?.id || '',
        title: 'Anna Kowalska - Tech Specialist',
        content: 'Senior technical specialist at TechStartup. Expert in system integration and cloud solutions. Key contact for technical decisions.',
        tags: ['contact', 'technical', 'specialist'],
        category: 'contacts',
        url: '/contacts/anna-kowalska',
        organizationId: organization.id
      }
    ];

    for (const item of searchIndexData) {
      await prisma.searchIndex.create({ data: item });
    }
    console.log(`✅ Utworzono ${searchIndexData.length} indeksów wyszukiwania`);

    // 3. task_history - Historia zmian zadań
    console.log('\n📜 Wypełnianie task_history...');
    const tasks = await prisma.task.findMany({ take: 2 });
    const user = await prisma.user.findFirst();
    
    if (tasks.length > 0 && user) {
      const taskHistoryData = [
        {
          taskId: tasks[0].id,
          userId: user.id,
          action: 'created',
          fieldName: 'status',
          oldValue: null,
          newValue: 'NEW',
          field: null,
          comment: 'Task created from email',
          changedBy: user.id,
          organizationId: organization.id
        },
        {
          taskId: tasks[0].id,
          userId: user.id,
          action: 'updated',
          fieldName: 'status',
          oldValue: 'NEW',
          newValue: 'IN_PROGRESS',
          field: 'status',
          comment: 'Started working on task',
          changedBy: user.id,
          organizationId: organization.id
        },
        {
          taskId: tasks[0].id,
          userId: user.id,
          action: 'updated',
          fieldName: 'priority',
          oldValue: 'MEDIUM',
          newValue: 'HIGH',
          field: 'priority',
          comment: 'Increased priority due to deadline',
          changedBy: user.id,
          organizationId: organization.id
        }
      ];

      for (const history of taskHistoryData) {
        await prisma.taskHistory.create({ data: history });
      }
      console.log(`✅ Utworzono ${taskHistoryData.length} wpisów historii zadań`);
    }

    // 4. error_logs - Logi błędów
    console.log('\n❌ Wypełnianie error_logs...');
    const errorLogsData = [
      {
        level: 'error',
        message: 'Failed to send email notification',
        source: 'EmailService',
        url: '/api/v1/notifications/send',
        userAgent: 'CRM-Backend/1.0',
        severity: 'HIGH' as const,
        sessionId: 'session-123',
        timestamp: new Date(),
        stack: 'Error: SMTP connection failed\n    at EmailService.send (email.service.ts:45)\n    at NotificationService.notify (notification.service.ts:23)',
        context: { recipient: 'user@example.com', template: 'task-reminder' },
        organizationId: organization.id
      },
      {
        level: 'warning',
        message: 'Rate limit approaching for API calls',
        source: 'APIGateway',
        url: '/api/v1/messages',
        userAgent: 'CRM-Backend/1.0',
        severity: 'MEDIUM' as const,
        sessionId: 'session-456',
        timestamp: new Date(),
        context: { endpoint: '/api/v1/messages', usage: '950/1000' },
        organizationId: organization.id
      },
      {
        level: 'info',
        message: 'Database backup completed successfully',
        source: 'BackupService',
        url: '/system/backup',
        userAgent: 'CRM-Backend/1.0',
        severity: 'LOW' as const,
        sessionId: 'system',
        timestamp: new Date(),
        context: { duration: '3.5 minutes', size: '256MB' },
        organizationId: organization.id
      }
    ];

    for (const log of errorLogsData) {
      await prisma.errorLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${errorLogsData.length} logów błędów`);

    // 5. timeline - Wydarzenia systemowe
    console.log('\n⏱️ Wypełnianie timeline...');
    const timelineData = [
      {
        entityType: 'deal',
        entityId: (await prisma.deal.findFirst())?.id || '',
        eventType: 'status_change',
        eventDescription: 'Deal moved to negotiation stage',
        eventData: { from: 'NEW', to: 'NEGOTIATION' },
        description: 'Deal moved to negotiation stage',
        userId: user?.id,
        organizationId: organization.id
      },
      {
        entityType: 'contact',
        entityId: (await prisma.contact.findFirst())?.id || '',
        eventType: 'email_sent',
        eventDescription: 'Sent proposal email to contact',
        eventData: { subject: 'Proposal for CRM Integration', template: 'proposal' },
        description: 'Sent proposal email to contact',
        userId: user?.id,
        organizationId: organization.id
      },
      {
        entityType: 'project',
        entityId: (await prisma.project.findFirst())?.id || '',
        eventType: 'milestone_reached',
        eventDescription: 'Project reached Phase 1 milestone',
        eventData: { milestone: 'Phase 1 Complete', completion: 100 },
        description: 'Project reached Phase 1 milestone',
        userId: user?.id,
        organizationId: organization.id
      }
    ];

    for (const event of timelineData) {
      await prisma.timeline.create({ data: event });
    }
    console.log(`✅ Utworzono ${timelineData.length} wydarzeń timeline`);

    // 6. ai_prompt_templates - Szablony promptów AI
    console.log('\n🤖 Wypełnianie ai_prompt_templates...');
    const aiTemplatesData = [
      {
        name: 'Email Analysis Template',
        description: 'Template for analyzing email sentiment and urgency',
        template: 'Analyze the following email:\n\nSubject: {{subject}}\nFrom: {{sender}}\nContent: {{content}}\n\nProvide:\n1. Sentiment (positive/negative/neutral)\n2. Urgency score (1-10)\n3. Required action (yes/no)\n4. Summary in 2 sentences',
        variables: ['subject', 'sender', 'content'],
        category: 'email_analysis',
        version: '1.0',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'Task Generation Template',
        description: 'Generate task from email content',
        template: 'Based on this email:\n{{email_content}}\n\nCreate a task with:\n- Title (max 100 chars)\n- Description\n- Priority (LOW/MEDIUM/HIGH)\n- Estimated time\n- Suggested deadline',
        variables: ['email_content'],
        category: 'task_generation',
        version: '1.0',
        isActive: true,
        organizationId: organization.id
      },
      {
        name: 'Meeting Summary Template',
        description: 'Summarize meeting notes',
        template: 'Summarize the following meeting notes:\n\n{{meeting_notes}}\n\nProvide:\n1. Key decisions\n2. Action items with assignees\n3. Next steps\n4. Follow-up required',
        variables: ['meeting_notes'],
        category: 'meeting_summary',
        version: '1.0',
        isActive: true,
        organizationId: organization.id
      }
    ];

    for (const template of aiTemplatesData) {
      await prisma.aIPromptTemplate.create({ data: template });
    }
    console.log(`✅ Utworzono ${aiTemplatesData.length} szablonów promptów AI`);

    // 7. recommendations - Rekomendacje AI
    console.log('\n💡 Wypełnianie recommendations...');
    const recommendationsData = [
      {
        type: 'task_optimization',
        title: 'Optimize task workflow',
        description: 'Based on your task completion patterns, consider batching similar tasks together',
        reason: 'Analysis shows 40% faster completion when similar tasks are grouped',
        priority: 'MEDIUM' as const,
        actionable: true,
        metadata: { tasksAnalyzed: 50, timeframe: '30 days' },
        entityType: 'user',
        entityId: user?.id || '',
        organizationId: organization.id
      },
      {
        type: 'contact_engagement',
        title: 'Follow up with inactive contacts',
        description: '5 contacts haven\'t been engaged in over 60 days',
        reason: 'Maintaining regular contact improves relationship quality by 25%',
        priority: 'HIGH' as const,
        actionable: true,
        metadata: { contactIds: ['contact1', 'contact2'], daysSinceContact: 65 },
        entityType: 'organization',
        entityId: organization.id,
        organizationId: organization.id
      }
    ];

    for (const rec of recommendationsData) {
      await prisma.recommendation.create({ data: rec });
    }
    console.log(`✅ Utworzono ${recommendationsData.length} rekomendacji`);

    // 8. stream_permissions - Uprawnienia do streamów
    console.log('\n🔐 Wypełnianie stream_permissions...');
    const stream = await prisma.stream.findFirst();
    const users = await prisma.user.findMany({ take: 3 });
    
    if (stream && users.length > 0) {
      const streamPermissionsData = users.map(u => ({
        streamId: stream.id,
        userId: u.id,
        accessLevel: ['read', 'write', 'admin'][Math.floor(Math.random() * 3)],
        permission: 'VIEW',
        grantedById: user?.id || u.id,
        expiresAt: null,
        organizationId: organization.id
      }));

      for (const perm of streamPermissionsData) {
        await prisma.streamPermission.create({ data: perm });
      }
      console.log(`✅ Utworzono ${streamPermissionsData.length} uprawnień do streamów`);
    }

    // 9. user_access_logs - Logi dostępu użytkowników
    console.log('\n🔑 Wypełnianie user_access_logs...');
    const accessLogsData = [
      {
        userId: user?.id || '',
        action: 'login',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        success: true,
        metadata: { location: 'Warsaw, Poland', device: 'Desktop' },
        organizationId: organization.id
      },
      {
        userId: user?.id || '',
        action: 'api_call',
        ipAddress: '192.168.1.100',
        userAgent: 'CRM-Mobile-App/2.1.0',
        success: true,
        metadata: { endpoint: '/api/v1/tasks', method: 'GET' },
        organizationId: organization.id
      },
      {
        userId: user?.id || '',
        action: 'logout',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        success: true,
        metadata: { sessionDuration: '2h 15m' },
        organizationId: organization.id
      }
    ];

    for (const log of accessLogsData) {
      await prisma.userAccessLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${accessLogsData.length} logów dostępu`);

    // 10. email_logs - Logi emailowe
    console.log('\n📨 Wypełnianie email_logs...');
    const emailLogsData = [
      {
        to: 'client@example.com',
        from: 'noreply@crm-system.com',
        subject: 'Task Reminder: Review proposal',
        status: 'sent' as const,
        sentAt: new Date(),
        messageId: 'msg-123-456',
        provider: 'sendgrid',
        success: true,
        metadata: { templateId: 'task-reminder', taskId: tasks[0]?.id },
        organizationId: organization.id
      },
      {
        to: 'manager@company.com',
        from: 'noreply@crm-system.com',
        subject: 'Weekly Report Ready',
        status: 'delivered' as const,
        sentAt: new Date(Date.now() - 3600000),
        deliveredAt: new Date(Date.now() - 3500000),
        messageId: 'msg-789-012',
        provider: 'sendgrid',
        success: true,
        metadata: { reportType: 'weekly', period: '2025-W01' },
        organizationId: organization.id
      },
      {
        to: 'invalid@fake-domain.xyz',
        from: 'noreply@crm-system.com',
        subject: 'Account Notification',
        status: 'failed' as const,
        sentAt: new Date(Date.now() - 7200000),
        messageId: 'msg-345-678',
        provider: 'sendgrid',
        success: false,
        error: 'Invalid recipient domain',
        metadata: { notificationType: 'account-update' },
        organizationId: organization.id
      }
    ];

    for (const log of emailLogsData) {
      await prisma.emailLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${emailLogsData.length} logów emailowych`);

    // Podsumowanie
    const counts = {
      emailAnalysis: await prisma.emailAnalysis.count(),
      searchIndex: await prisma.searchIndex.count(),
      taskHistory: await prisma.taskHistory.count(),
      errorLogs: await prisma.errorLog.count(),
      timeline: await prisma.timeline.count(),
      aiPromptTemplates: await prisma.aIPromptTemplate.count(),
      recommendations: await prisma.recommendation.count(),
      streamPermissions: await prisma.streamPermission.count(),
      userAccessLogs: await prisma.userAccessLog.count(),
      emailLogs: await prisma.emailLog.count()
    };

    console.log('\n✅ Wypełnianie pozostałych tabel zakończone!');
    console.log('\n📊 Podsumowanie:');
    console.log(`- email_analysis: ${counts.emailAnalysis} rekordów`);
    console.log(`- search_index: ${counts.searchIndex} rekordów`);
    console.log(`- task_history: ${counts.taskHistory} rekordów`);
    console.log(`- error_logs: ${counts.errorLogs} rekordów`);
    console.log(`- timeline: ${counts.timeline} rekordów`);
    console.log(`- ai_prompt_templates: ${counts.aiPromptTemplates} rekordów`);
    console.log(`- recommendations: ${counts.recommendations} rekordów`);
    console.log(`- stream_permissions: ${counts.streamPermissions} rekordów`);
    console.log(`- user_access_logs: ${counts.userAccessLogs} rekordów`);
    console.log(`- email_logs: ${counts.emailLogs} rekordów`);

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania tabel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie seeda
seedRemainingTables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });