import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEmptyTablesPhase1() {
  console.log('🌱 Wypełnianie pustych tabel - Faza 1 (Quick Wins)...\n');

  try {
    // Pobierz organizację
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      throw new Error('Brak organizacji w bazie danych!');
    }

    // 1. next_actions - Następne akcje GTD
    console.log('📋 Wypełnianie next_actions...');
    const nextActionsData = [
      {
        title: 'Review quarterly reports',
        description: 'Analyze Q4 2024 financial and performance reports',
        priority: 'HIGH' as const,
        context: '@office',
        estimatedTime: '2h',
        energy: 'HIGH' as const,
        dueDate: new Date('2025-01-15'),
        status: 'NEW' as const,
        createdById: (await prisma.user.findFirst({ where: { email: 'admin@demo.com' } }))?.id || '',
        organizationId: organization.id,
        projectId: (await prisma.project.findFirst({ where: { name: 'CRM Integration Project' } }))?.id
      },
      {
        title: 'Call potential client about proposal',
        description: 'Follow up on sent proposal for new CRM implementation',
        priority: 'MEDIUM' as const,
        context: '@calls',
        estimatedTime: '30min',
        energy: 'MEDIUM' as const,
        dueDate: new Date('2025-01-10'),
        status: 'NEW' as const,
        createdById: (await prisma.user.findFirst({ where: { email: 'manager@demo.com' } }))?.id || '',
        organizationId: organization.id
      },
      {
        title: 'Prepare team meeting agenda',
        description: 'Create agenda for weekly team sync on Monday',
        priority: 'MEDIUM' as const,
        context: '@computer',
        estimatedTime: '30min',
        energy: 'LOW' as const,
        dueDate: new Date('2025-01-08'),
        status: 'NEW' as const,
        createdById: (await prisma.user.findFirst({ where: { email: 'member@demo.com' } }))?.id || '',
        organizationId: organization.id
      },
      {
        title: 'Buy office supplies',
        description: 'Purchase printer paper, pens, and notebooks',
        priority: 'LOW' as const,
        context: '@errands',
        estimatedTime: '45min',
        energy: 'LOW' as const,
        status: 'NEW' as const,
        createdById: (await prisma.user.findFirst({ where: { email: 'owner@demo.com' } }))?.id || '',
        organizationId: organization.id
      }
    ];

    for (const action of nextActionsData) {
      await prisma.nextAction.create({ data: action });
    }
    console.log(`✅ Utworzono ${nextActionsData.length} następnych akcji`);

    // 2. info - Informacje systemowe i ogłoszenia
    console.log('\n📢 Wypełnianie info...');
    const infoData = [
      {
        title: 'System Update Notice',
        content: 'System maintenance scheduled for Saturday 2AM-4AM. Services may be temporarily unavailable.',
        topic: 'System Maintenance',
        importance: 'HIGH' as const,
        organizationId: organization.id
      },
      {
        title: 'New Features in v2.1',
        content: 'Check out the new Smart Mailboxes and Voice TTS features!',
        topic: 'Product Updates',
        importance: 'MEDIUM' as const,
        organizationId: organization.id
      },
      {
        title: 'Holiday Schedule',
        content: 'Office will be closed on January 6th for Three Kings Day.',
        topic: 'Company Announcements',
        importance: 'LOW' as const,
        organizationId: organization.id
      }
    ];

    for (const info of infoData) {
      await prisma.info.create({ data: info });
    }
    console.log(`✅ Utworzono ${infoData.length} informacji systemowych`);

    // 3. complaints - Skargi i reklamacje
    console.log('\n🔴 Wypełnianie complaints...');
    const complaintsData = [
      {
        title: 'Email sync not working properly',
        description: 'Emails are not syncing automatically, need to refresh manually',
        status: 'NEW' as const,
        priority: 'HIGH' as const,
        product: 'CRM System - Email Module',
        customer: 'anna.kowalska@techstartup.pl',
        organizationId: organization.id
      },
      {
        title: 'Invoice calculation error',
        description: 'VAT was calculated incorrectly on invoice #2024-12-001',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const,
        product: 'CRM System - Invoice Module',
        customer: 'marek.nowak@retailchain.pl',
        organizationId: organization.id
      },
      {
        title: 'Feature request: Export to Excel',
        description: 'Would like to export reports directly to Excel format',
        status: 'CLOSED' as const,
        priority: 'LOW' as const,
        product: 'CRM System - Reports Module',
        customer: 'joanna.wojcik@consultingpro.pl',
        organizationId: organization.id
      }
    ];

    for (const complaint of complaintsData) {
      await prisma.complaint.create({ data: complaint });
    }
    console.log(`✅ Utworzono ${complaintsData.length} skarg/reklamacji`);

    // 4. unimportant - Zadania nieważne/odłożone
    console.log('\n⚪ Wypełnianie unimportant...');
    const unimportantData = [
      {
        content: 'Research new coffee machine for office - upgrading the office coffee machine',
        type: 'office_management',
        source: 'internal_task',
        organizationId: organization.id
      },
      {
        content: 'Organize team building event - plan a team building activity for spring (postponed due to budget)',
        type: 'team_events',
        source: 'internal_task',
        organizationId: organization.id
      },
      {
        content: 'Update company blog design - redesign with new branding (not critical)',
        type: 'marketing',
        source: 'internal_task',
        organizationId: organization.id
      }
    ];

    for (const item of unimportantData) {
      await prisma.unimportant.create({ data: item });
    }
    console.log(`✅ Utworzono ${unimportantData.length} zadań nieważnych`);

    // 5. critical_path - Ścieżki krytyczne projektów
    console.log('\n🎯 Wypełnianie critical_path...');
    const project = await prisma.project.findFirst({ where: { name: 'CRM Integration Project' } });
    const tasks = await prisma.task.findMany({ where: { projectId: project?.id } });
    
    if (project && tasks.length > 0) {
      const criticalPathData = [
        {
          projectId: project.id,
          taskId: tasks[0]?.id,
          sequenceNumber: 1,
          isCritical: true,
          slack: '0',
          earliestStart: new Date('2025-01-01'),
          earliestFinish: new Date('2025-01-05'),
          latestStart: new Date('2025-01-01'),
          latestFinish: new Date('2025-01-05'),
          duration: 5
        },
        {
          projectId: project.id,
          taskId: tasks[1]?.id || tasks[0]?.id,
          sequenceNumber: 2,
          isCritical: true,
          slack: '0',
          earliestStart: new Date('2025-01-06'),
          earliestFinish: new Date('2025-01-15'),
          latestStart: new Date('2025-01-06'),
          latestFinish: new Date('2025-01-15'),
          duration: 10
        },
        {
          projectId: project.id,
          taskId: tasks[2]?.id || tasks[0]?.id,
          sequenceNumber: 3,
          isCritical: false,
          slack: '5',
          earliestStart: new Date('2025-01-10'),
          earliestFinish: new Date('2025-01-20'),
          latestStart: new Date('2025-01-15'),
          latestFinish: new Date('2025-01-25'),
          duration: 10
        }
      ];

      for (const path of criticalPathData) {
        await prisma.criticalPath.create({ data: path });
      }
      console.log(`✅ Utworzono ${criticalPathData.length} ścieżek krytycznych`);
    }

    console.log('\n✅ Faza 1 zakończona pomyślnie!');
    
    // Podsumowanie
    const counts = {
      nextActions: await prisma.nextAction.count(),
      info: await prisma.info.count(),
      complaints: await prisma.complaint.count(),
      unimportant: await prisma.unimportant.count(),
      criticalPath: await prisma.criticalPath.count()
    };

    console.log('\n📊 Podsumowanie Fazy 1:');
    console.log(`- next_actions: ${counts.nextActions} rekordów`);
    console.log(`- info: ${counts.info} rekordów`);
    console.log(`- complaints: ${counts.complaints} rekordów`);
    console.log(`- unimportant: ${counts.unimportant} rekordów`);
    console.log(`- critical_path: ${counts.criticalPath} rekordów`);

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania tabel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie seeda
seedEmptyTablesPhase1()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });