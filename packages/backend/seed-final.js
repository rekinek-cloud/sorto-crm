const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEmptyTables() {
  console.log('Wypełnianie pustych tabel - wersja finalna...\n');

  try {
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ Brak organizacji w bazie danych!');
      return;
    }

    console.log(`✅ Używam organizacji: ${organization.name}\n`);

    // 1. HABITS
    const habitsCount = await prisma.habit.count({ where: { organizationId: organization.id } });
    if (habitsCount === 0) {
      console.log('🔄 Seedowanie Habits...');
      await prisma.habit.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Poranne czytanie aktualności',
            description: 'Codzienne 15-minutowe czytanie wiadomości biznesowych',
            frequency: 'DAILY'
          },
          {
            organizationId: organization.id,
            name: 'Przegląd tygodniowy GTD',
            description: 'Cotygodniowy przegląd wszystkich projektów i zadań',
            frequency: 'WEEKLY'
          }
        ]
      });
      console.log('✅ Habits: 2 rekordy');
    }

    // 2. RECURRING TASKS
    const recurringCount = await prisma.recurringTask.count({ where: { organizationId: organization.id } });
    if (recurringCount === 0) {
      console.log('🔄 Seedowanie RecurringTask...');
      await prisma.recurringTask.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Backup bazy danych',
            description: 'Cotygodniowe tworzenie kopii zapasowej',
            frequency: 'WEEKLY',
            priority: 'HIGH',
            context: '@computer',
            estimatedMinutes: 30,
            nextOccurrence: new Date('2024-12-30T09:00:00Z'),
            daysOfWeek: [1]
          }
        ]
      });
      console.log('✅ RecurringTask: 1 rekord');
    }

    // 3. WEEKLY REVIEWS
    const reviewsCount = await prisma.weeklyReview.count({ where: { organizationId: organization.id } });
    if (reviewsCount === 0) {
      console.log('🔄 Seedowanie WeeklyReview...');
      await prisma.weeklyReview.createMany({
        data: [
          {
            organizationId: organization.id,
            reviewDate: new Date('2024-12-22'),
            completedTasksCount: 15,
            newTasksCount: 8,
            stalledTasks: 2,
            nextActions: 'Skupić się na automatyzacji',
            collectLoosePapers: true,
            processNotes: true,
            emptyInbox: true,
            reviewActionLists: true,
            reviewCalendar: true,
            reviewProjects: true
          }
        ]
      });
      console.log('✅ WeeklyReview: 1 rekord');
    }

    // 4. TAGS
    const tagsCount = await prisma.tag.count({ where: { organizationId: organization.id } });
    if (tagsCount === 0) {
      console.log('🔄 Seedowanie Tag...');
      await prisma.tag.createMany({
        data: [
          { organizationId: organization.id, name: 'pilne', color: '#FF4444', category: 'priority' },
          { organizationId: organization.id, name: 'ważne', color: '#FF8800', category: 'priority' },
          { organizationId: organization.id, name: 'spotkanie', color: '#4488FF', category: 'context' },
          { organizationId: organization.id, name: 'email', color: '#44FF88', category: 'communication' },
          { organizationId: organization.id, name: 'projekt', color: '#8844FF', category: 'work' }
        ]
      });
      console.log('✅ Tag: 5 rekordów');
    }

    // 5. FOCUS MODES
    const focusCount = await prisma.focusMode.count({ where: { organizationId: organization.id } });
    if (focusCount === 0) {
      console.log('🔄 Seedowanie FocusMode...');
      await prisma.focusMode.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Deep Work',
            duration: 120,
            energyLevel: 'HIGH',
            category: 'concentration',
            priority: 'HIGH'
          },
          {
            organizationId: organization.id,
            name: 'Komunikacja',
            duration: 30,
            energyLevel: 'MEDIUM',
            category: 'admin',
            priority: 'MEDIUM'
          }
        ]
      });
      console.log('✅ FocusMode: 2 rekordy');
    }

    // 6. KNOWLEDGE BASE
    const knowledgeCount = await prisma.knowledgeBase.count({ where: { organizationId: organization.id } });
    if (knowledgeCount === 0) {
      console.log('🔄 Seedowanie KnowledgeBase...');
      await prisma.knowledgeBase.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Procedury CRM',
            content: 'Kompletny przewodnik po procesach CRM w organizacji',
            type: 'PROCEDURE',
            tags: JSON.stringify(['crm', 'procedury']),
            isPublic: true
          }
        ]
      });
      console.log('✅ KnowledgeBase: 1 rekord');
    }

    // 7. AREAS OF RESPONSIBILITY
    const areasCount = await prisma.areaOfResponsibility.count({ where: { organizationId: organization.id } });
    if (areasCount === 0) {
      console.log('🔄 Seedowanie AreaOfResponsibility...');
      await prisma.areaOfResponsibility.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Zarządzanie IT',
            description: 'Odpowiedzialność za infrastrukturę IT',
            purpose: 'Zapewnienie stabilności systemów IT',
            outcomes: JSON.stringify(['99.9% uptime', 'Regularne backupy']),
            reviewFrequency: 'WEEKLY',
            isActive: true
          }
        ]
      });
      console.log('✅ AreaOfResponsibility: 1 rekord');
    }

    // 8. LEADS
    const leadsCount = await prisma.lead.count({ where: { organizationId: organization.id } });
    if (leadsCount === 0) {
      console.log('🔄 Seedowanie Lead...');
      await prisma.lead.createMany({
        data: [
          {
            organizationId: organization.id,
            firstName: 'Anna',
            lastName: 'Kowalska',
            email: 'anna.kowalska@techstartup.pl',
            company: 'TechStartup Sp. z o.o.',
            source: 'WEBSITE',
            status: 'NEW',
            score: 85
          }
        ]
      });
      console.log('✅ Lead: 1 rekord');
    }

    // 9. FILES
    const filesCount = await prisma.file.count({ where: { organizationId: organization.id } });
    if (filesCount === 0) {
      console.log('🔄 Seedowanie File...');
      await prisma.file.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'CRM_Guide.pdf',
            originalName: 'Przewodnik CRM.pdf',
            path: '/uploads/crm_guide.pdf',
            size: 2548576,
            mimeType: 'application/pdf',
            category: 'DOCUMENT'
          }
        ]
      });
      console.log('✅ File: 1 rekord');
    }

    // 10. INFO
    const infosCount = await prisma.info.count({ where: { organizationId: organization.id } });
    if (infosCount === 0) {
      console.log('🔄 Seedowanie Info...');
      await prisma.info.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'System Update',
            content: 'Planowana aktualizacja systemu',
            category: 'SYSTEM',
            priority: 'MEDIUM',
            isPublic: true
          }
        ]
      });
      console.log('✅ Info: 1 rekord');
    }

    // 11. RECOMMENDATIONS
    const recsCount = await prisma.recommendation.count({ where: { organizationId: organization.id } });
    if (recsCount === 0) {
      console.log('🔄 Seedowanie Recommendation...');
      await prisma.recommendation.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Automatyzacja workflow',
            description: 'Rekomendacja wdrożenia automatyzacji',
            category: 'PROCESS_IMPROVEMENT',
            priority: 'HIGH',
            impact: 'HIGH',
            effort: 'MEDIUM',
            confidence: 85,
            source: 'AI_ANALYSIS',
            status: 'PENDING'
          }
        ]
      });
      console.log('✅ Recommendation: 1 rekord');
    }

    // 12. OFFERS
    const offersCount = await prisma.offer.count({ where: { organizationId: organization.id } });
    if (offersCount === 0) {
      console.log('🔄 Seedowanie Offer...');
      await prisma.offer.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'CRM Pro Package',
            description: 'Kompletny pakiet CRM z GTD',
            type: 'PACKAGE',
            price: 1200.00,
            currency: 'PLN',
            duration: 12,
            isActive: true
          }
        ]
      });
      console.log('✅ Offer: 1 rekord');
    }

    // 13. WIKI CATEGORIES
    const wikiCatsCount = await prisma.wikiCategory.count({ where: { organizationId: organization.id } });
    if (wikiCatsCount === 0) {
      console.log('🔄 Seedowanie WikiCategory...');
      await prisma.wikiCategory.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Getting Started',
            slug: 'getting-started',
            description: 'Przewodniki wprowadzające',
            icon: 'PlayCircle',
            color: '#10B981',
            order: 1,
            isVisible: true
          },
          {
            organizationId: organization.id,
            name: 'User Guides',
            slug: 'user-guides',
            description: 'Przewodniki użytkownika',
            icon: 'BookOpen',
            color: '#3B82F6',
            order: 2,
            isVisible: true
          }
        ]
      });
      console.log('✅ WikiCategory: 2 rekordy');
    }

    // 14. EMAIL TEMPLATES
    const templatesCount = await prisma.emailTemplate.count({ where: { organizationId: organization.id } });
    if (templatesCount === 0) {
      console.log('🔄 Seedowanie EmailTemplate...');
      await prisma.emailTemplate.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Welcome New Client',
            subject: 'Witamy w CRM-GTD Smart!',
            content: '<h1>Witamy!</h1><p>Dziękujemy za wybór naszego systemu.</p>',
            type: 'WELCOME',
            isActive: true
          }
        ]
      });
      console.log('✅ EmailTemplate: 1 rekord');
    }

    console.log('\n🎉 Wszystkie puste tabele zostały wypełnione!');

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmptyTables();