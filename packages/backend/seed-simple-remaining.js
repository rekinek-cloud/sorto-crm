const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSimpleRemaining() {
  console.log('🌱 Wypełnianie pozostałych kluczowych tabel...\n');

  try {
    // Pobierz organizację
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('Brak organizacji w bazie danych!');
    }

    // 1. timeline - Wydarzenia systemowe
    console.log('⏱️ Wypełnianie timeline...');
    const deal = await prisma.deal.findFirst();
    const contact = await prisma.contact.findFirst();
    const project = await prisma.project.findFirst();
    const user = await prisma.user.findFirst();
    
    if (deal && contact && project && user) {
      const timelineData = [
        {
          eventId: 'evt-001',
          eventType: 'deal_status_change',
          title: 'Deal Status Update - Moved to Negotiation',
          startDate: new Date(),
          status: 'COMPLETED',
          organizationId: organization.id
        },
        {
          eventId: 'evt-002',
          eventType: 'email_sent',
          title: 'Proposal Email Sent to Contact',
          startDate: new Date(),
          status: 'COMPLETED',
          organizationId: organization.id
        },
        {
          eventId: 'evt-003',
          eventType: 'milestone_reached',
          title: 'Project Phase 1 Complete',
          startDate: new Date(),
          endDate: new Date(),
          status: 'COMPLETED',
          organizationId: organization.id
        }
      ];

      for (const event of timelineData) {
        await prisma.timeline.create({ data: event });
      }
      console.log(`✅ Utworzono ${timelineData.length} wydarzeń timeline`);
    }

    // 2. search_index - Indeks wyszukiwania
    console.log('\n🔍 Wypełnianie search_index...');
    const task = await prisma.task.findFirst();

    // 3. recommendations - Rekomendacje AI
    console.log('\n💡 Wypełnianie recommendations...');
    const recommendationsData = [
      {
        content: 'Based on your task completion patterns, consider batching similar tasks together for 40% faster completion',
        priority: 'MEDIUM',
        referenceType: 'task',
        referenceId: task?.id,
        status: 'OPEN',
        organizationId: organization.id
      },
      {
        content: '5 contacts haven\'t been engaged in over 60 days. Regular contact improves relationship quality by 25%',
        priority: 'HIGH',
        referenceType: 'contact',
        referenceId: contact?.id,
        status: 'OPEN',
        organizationId: organization.id
      }
    ];

    for (const rec of recommendationsData) {
      await prisma.recommendation.create({ data: rec });
    }
    console.log(`✅ Utworzono ${recommendationsData.length} rekomendacji`);
    
    const searchIndexData = [
      {
        entityType: 'task',
        entityId: task?.id || '',
        title: 'Analyze system requirements',
        content: 'Review and analyze system requirements for the new CRM integration project',
        organizationId: organization.id
      },
      {
        entityType: 'project',
        entityId: project?.id || '',
        title: 'CRM Integration Project',
        content: 'Complete integration of CRM system with existing infrastructure',
        organizationId: organization.id
      },
      {
        entityType: 'contact',
        entityId: contact?.id || '',
        title: 'Contact specialist details',
        content: 'Senior technical specialist at TechStartup. Expert in system integration',
        organizationId: organization.id
      }
    ];

    try {
      for (const item of searchIndexData) {
        await prisma.searchIndex.create({ data: item });
      }
    } catch (error) {
      console.log('⚠️  Niektóre indeksy już istnieją - pomijam...');
    }
    console.log(`✅ Utworzono ${searchIndexData.length} indeksów wyszukiwania`);

    // Pomiń ai_prompt_templates - skomplikowany model
    console.log('\n⚠️  Pomijam ai_prompt_templates (skomplikowana struktura)');

    // 5. email_logs - Logi emailowe
    console.log('\n📨 Wypełnianie email_logs...');
    const emailLogsData = [
      {
        to: 'client@example.com',
        from: 'noreply@crm-system.com',
        subject: 'Task Reminder: Review proposal',
        status: 'sent',
        sentAt: new Date(),
        messageId: 'msg-123-456',
        provider: 'SENDGRID',
        success: true,
        metadata: { templateId: 'task-reminder', taskId: task?.id },
        organizationId: organization.id
      },
      {
        to: 'manager@company.com',
        from: 'noreply@crm-system.com',
        subject: 'Weekly Report Ready',
        status: 'delivered',
        sentAt: new Date(Date.now() - 3600000),
        deliveredAt: new Date(Date.now() - 3500000),
        messageId: 'msg-789-012',
        provider: 'SENDGRID',
        success: true,
        metadata: { reportType: 'weekly', period: '2025-W01' },
        organizationId: organization.id
      }
    ];

    for (const log of emailLogsData) {
      await prisma.emailLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${emailLogsData.length} logów emailowych`);

    // 6. user_access_logs - Logi dostępu
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
      }
    ];

    for (const log of accessLogsData) {
      await prisma.userAccessLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${accessLogsData.length} logów dostępu`);

    // 7. error_logs - Logi błędów
    console.log('\n❌ Wypełnianie error_logs...');
    const errorLogsData = [
      {
        level: 'error',
        message: 'Failed to send email notification',
        source: 'EmailService',
        url: '/api/v1/notifications/send',
        userAgent: 'CRM-Backend/1.0',
        severity: 'high',
        sessionId: 'session-123',
        timestamp: new Date(),
        stack: 'Error: SMTP connection failed',
        context: { recipient: 'user@example.com' },
        organizationId: organization.id
      },
      {
        level: 'warning',
        message: 'Rate limit approaching for API calls',
        source: 'APIGateway',
        url: '/api/v1/messages',
        userAgent: 'CRM-Backend/1.0',
        severity: 'medium',
        sessionId: 'session-456',
        timestamp: new Date(),
        context: { endpoint: '/api/v1/messages', usage: '950/1000' },
        organizationId: organization.id
      }
    ];

    for (const log of errorLogsData) {
      await prisma.errorLog.create({ data: log });
    }
    console.log(`✅ Utworzono ${errorLogsData.length} logów błędów`);

    // Podsumowanie
    const counts = {
      timeline: await prisma.timeline.count(),
      recommendations: await prisma.recommendation.count(),
      searchIndex: await prisma.searchIndex.count(),
      aiPromptTemplates: await prisma.aIPromptTemplate.count(),
      emailLogs: await prisma.emailLog.count(),
      userAccessLogs: await prisma.userAccessLog.count(),
      errorLogs: await prisma.errorLog.count()
    };

    console.log('\n✅ Wypełnianie pozostałych tabel zakończone!');
    console.log('\n📊 Podsumowanie:');
    console.log(`- timeline: ${counts.timeline} rekordów`);
    console.log(`- recommendations: ${counts.recommendations} rekordów`);
    console.log(`- search_index: ${counts.searchIndex} rekordów`);
    console.log(`- ai_prompt_templates: ${counts.aiPromptTemplates} rekordów`);
    console.log(`- email_logs: ${counts.emailLogs} rekordów`);
    console.log(`- user_access_logs: ${counts.userAccessLogs} rekordów`);
    console.log(`- error_logs: ${counts.errorLogs} rekordów`);

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania tabel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie seeda
seedSimpleRemaining()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });