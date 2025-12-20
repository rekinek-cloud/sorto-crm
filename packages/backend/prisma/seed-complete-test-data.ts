/**
 * Kompletne dane testowe dla CRM-GTD-SMART
 * Obejmuje wszystkie moduły i przepływy
 */

import { PrismaClient, UserRole, SubscriptionPlan, SubscriptionStatus, TaskStatus, Priority, DealStage, CompanySize, InboxSourceType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rozpoczynam tworzenie kompletnych danych testowych...\n');

  // ==========================================
  // 1. ORGANIZACJA I UŻYTKOWNICY
  // ==========================================
  console.log('📁 1. Tworzenie organizacji i użytkowników...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      domain: 'demo.com',
      settings: {
        timezone: 'Europe/Warsaw',
        dateFormat: 'DD.MM.YYYY',
        workingHours: { start: '08:00', end: '17:00' },
        language: 'pl'
      },
      limits: {
        users: 50,
        projects: 100,
        tasks: 10000,
        storage: '10GB'
      }
    }
  });

  // Użytkownicy z różnymi rolami
  const users: any[] = [];
  const userDefs = [
    { email: 'owner@demo.com', firstName: 'Jan', lastName: 'Kowalski', role: UserRole.OWNER },
    { email: 'admin@demo.com', firstName: 'Anna', lastName: 'Nowak', role: UserRole.ADMIN },
    { email: 'manager@demo.com', firstName: 'Piotr', lastName: 'Wiśniewski', role: UserRole.MANAGER },
    { email: 'user1@demo.com', firstName: 'Maria', lastName: 'Zielińska', role: UserRole.MEMBER },
    { email: 'user2@demo.com', firstName: 'Tomasz', lastName: 'Lewandowski', role: UserRole.MEMBER },
  ];

  const hashedPassword = await bcrypt.hash('demo123', 10);

  for (const userDef of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: {},
      create: {
        ...userDef,
        passwordHash: hashedPassword,
        organizationId: organization.id,
        emailVerified: true,
        settings: { theme: 'light', notifications: true }
      }
    });
    users.push(user);
  }

  const owner = users[0];

  // Subskrypcja
  await prisma.subscription.upsert({
    where: { id: organization.id + '-sub' },
    update: {},
    create: {
      id: organization.id + '-sub',
      organizationId: organization.id,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  });

  console.log(`   ✅ Utworzono ${users.length} użytkowników`);

  // ==========================================
  // 2. KONTEKSTY GTD
  // ==========================================
  console.log('🏷️  2. Tworzenie kontekstów GTD...');

  const contextDefs = [
    { name: '@komputer', description: 'Zadania wymagające komputera', color: '#3B82F6', icon: 'laptop' },
    { name: '@telefon', description: 'Rozmowy telefoniczne', color: '#10B981', icon: 'phone' },
    { name: '@biuro', description: 'Zadania w biurze', color: '#8B5CF6', icon: 'building' },
    { name: '@dom', description: 'Zadania domowe', color: '#F59E0B', icon: 'home' },
    { name: '@miasto', description: 'Sprawy do załatwienia w mieście', color: '#EF4444', icon: 'map-pin' },
    { name: '@spotkanie', description: 'Tematy na spotkania', color: '#6B7280', icon: 'users' },
    { name: '@czekam', description: 'Czekam na odpowiedź', color: '#F97316', icon: 'clock' },
    { name: '@kiedyś', description: 'Kiedyś/może', color: '#84CC16', icon: 'calendar' },
    { name: '@energia-wysoka', description: 'Wymagające skupienia', color: '#DC2626', icon: 'zap' },
    { name: '@energia-niska', description: 'Proste zadania', color: '#22C55E', icon: 'coffee' },
  ];

  const contexts: any[] = [];
  for (const ctx of contextDefs) {
    const context = await prisma.context.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: ctx.name } },
      update: {},
      create: { ...ctx, organizationId: organization.id }
    });
    contexts.push(context);
  }

  console.log(`   ✅ Utworzono ${contexts.length} kontekstów`);

  // ==========================================
  // 3. STRUMIENIE (STREAMS)
  // ==========================================
  console.log('🌊 3. Tworzenie strumieni...');

  const streamDefs = [
    { name: 'Praca', description: 'Zadania zawodowe', color: '#3B82F6', icon: 'briefcase' },
    { name: 'Rozwój osobisty', description: 'Nauka i rozwój', color: '#8B5CF6', icon: 'book' },
    { name: 'Zdrowie', description: 'Sport i zdrowie', color: '#10B981', icon: 'heart' },
    { name: 'Rodzina', description: 'Sprawy rodzinne', color: '#F59E0B', icon: 'users' },
    { name: 'Finanse', description: 'Zarządzanie finansami', color: '#EF4444', icon: 'dollar-sign' },
    { name: 'Dom', description: 'Sprawy domowe', color: '#6B7280', icon: 'home' },
  ];

  const streams: any[] = [];
  for (let i = 0; i < streamDefs.length; i++) {
    const stream = await prisma.stream.upsert({
      where: { id: `stream-${i + 1}` },
      update: {},
      create: {
        id: `stream-${i + 1}`,
        ...streamDefs[i],
        organizationId: organization.id,
        createdById: owner.id,
        settings: { autoArchive: false, defaultPriority: 'MEDIUM' }
      }
    });
    streams.push(stream);
  }

  console.log(`   ✅ Utworzono ${streams.length} strumieni`);

  // ==========================================
  // 4. PROJEKTY
  // ==========================================
  console.log('📋 4. Tworzenie projektów...');

  const now = new Date();
  const projectDefs = [
    {
      name: 'Wdrożenie nowego CRM',
      description: 'Kompleksowe wdrożenie systemu CRM w firmie',
      streamId: streams[0].id,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      progress: 35,
      smartScore: 88
    },
    {
      name: 'Redesign strony WWW',
      description: 'Modernizacja strony internetowej firmy',
      streamId: streams[0].id,
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      progress: 20,
      smartScore: 75
    },
    {
      name: 'Kurs języka angielskiego',
      description: 'Nauka angielskiego biznesowego - poziom C1',
      streamId: streams[1].id,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
      progress: 45,
      smartScore: 92
    },
    {
      name: 'Maraton w 2025',
      description: 'Przygotowanie do pierwszego maratonu',
      streamId: streams[2].id,
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      progress: 30,
      smartScore: 85
    },
    {
      name: 'Remont kuchni',
      description: 'Kompleksowy remont kuchni',
      streamId: streams[5].id,
      startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      progress: 0,
      smartScore: 70
    },
  ];

  const projects: any[] = [];
  for (let i = 0; i < projectDefs.length; i++) {
    const project = await prisma.project.upsert({
      where: { id: `project-${i + 1}` },
      update: {},
      create: {
        id: `project-${i + 1}`,
        ...projectDefs[i],
        organizationId: organization.id,
        createdById: owner.id,
        smartAnalysis: {
          specific: { score: 85, feedback: 'Cel jasno określony' },
          measurable: { score: 80, feedback: 'Można zmierzyć postęp' },
          achievable: { score: 90, feedback: 'Realistyczny cel' },
          relevant: { score: 85, feedback: 'Zgodny z priorytetami' },
          timeBound: { score: 80, feedback: 'Termin wyznaczony' }
        }
      }
    });
    projects.push(project);
  }

  console.log(`   ✅ Utworzono ${projects.length} projektów`);

  // ==========================================
  // 5. ZADANIA
  // ==========================================
  console.log('✅ 5. Tworzenie zadań...');

  const taskDefs = [
    // Zadania projektowe - CRM
    { title: 'Analiza wymagań biznesowych', projectId: projects[0].id, status: TaskStatus.COMPLETED, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Spotkanie z interesariuszami', projectId: projects[0].id, status: TaskStatus.COMPLETED, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[5].id },
    { title: 'Przygotowanie specyfikacji technicznej', projectId: projects[0].id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Konfiguracja środowiska deweloperskiego', projectId: projects[0].id, status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Import danych z starego systemu', projectId: projects[0].id, status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Szkolenie użytkowników', projectId: projects[0].id, status: TaskStatus.NEW, priority: Priority.LOW, streamId: streams[0].id, contextId: contexts[5].id },

    // Zadania projektowe - WWW
    { title: 'Audyt obecnej strony', projectId: projects[1].id, status: TaskStatus.COMPLETED, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Przygotowanie makiet UX', projectId: projects[1].id, status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Wybór technologii', projectId: projects[1].id, status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[5].id },

    // Zadania rozwojowe
    { title: 'Lekcja 15 - Present Perfect', projectId: projects[2].id, status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[1].id, contextId: contexts[0].id },
    { title: 'Powtórka słówek - Business English', projectId: projects[2].id, status: TaskStatus.NEW, priority: Priority.LOW, streamId: streams[1].id, contextId: contexts[9].id },
    { title: 'Egzamin próbny', projectId: projects[2].id, status: TaskStatus.NEW, priority: Priority.HIGH, streamId: streams[1].id, contextId: contexts[0].id, dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },

    // Zadania zdrowotne
    { title: 'Trening biegowy 10km', projectId: projects[3].id, status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[2].id, contextId: contexts[8].id, dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) },
    { title: 'Wizyta u fizjoterapeuty', projectId: projects[3].id, status: TaskStatus.NEW, priority: Priority.HIGH, streamId: streams[2].id, contextId: contexts[4].id, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },

    // Zadania bez projektu
    { title: 'Odpowiedzieć na maila od klienta XYZ', status: TaskStatus.NEW, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id, dueDate: now },
    { title: 'Zadzwonić do dostawcy', status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[1].id },
    { title: 'Przejrzeć raport sprzedażowy', status: TaskStatus.NEW, priority: Priority.LOW, streamId: streams[0].id, contextId: contexts[0].id },
    { title: 'Zakupy - artykuły biurowe', status: TaskStatus.NEW, priority: Priority.LOW, streamId: streams[5].id, contextId: contexts[4].id },

    // Zadania przeterminowane
    { title: 'Wysłać fakturę do ABC Corp', status: TaskStatus.NEW, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id, dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    { title: 'Przygotować prezentację kwartalną', status: TaskStatus.NEW, priority: Priority.URGENT, streamId: streams[0].id, contextId: contexts[0].id, dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },

    // Zadania na dziś
    { title: 'Daily standup meeting', status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[5].id, dueDate: now, scheduledFor: now },
    { title: 'Code review PR #234', status: TaskStatus.NEW, priority: Priority.HIGH, streamId: streams[0].id, contextId: contexts[0].id, dueDate: now, scheduledFor: now },
    { title: 'Aktualizacja dokumentacji API', status: TaskStatus.NEW, priority: Priority.MEDIUM, streamId: streams[0].id, contextId: contexts[0].id, dueDate: now },
  ];

  const tasks: any[] = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const taskData: any = {
      title: taskDefs[i].title,
      status: taskDefs[i].status,
      priority: taskDefs[i].priority,
      organizationId: organization.id,
      createdById: owner.id,
      streamId: taskDefs[i].streamId,
      contextId: taskDefs[i].contextId,
      estimatedHours: Math.floor(Math.random() * 8) + 1,
    };

    if (taskDefs[i].projectId) taskData.projectId = taskDefs[i].projectId;
    if (taskDefs[i].dueDate) taskData.dueDate = taskDefs[i].dueDate;
    if (taskDefs[i].scheduledFor) taskData.scheduledFor = taskDefs[i].scheduledFor;

    const task = await prisma.task.create({ data: taskData });
    tasks.push(task);
  }

  console.log(`   ✅ Utworzono ${tasks.length} zadań`);

  // ==========================================
  // 6. INBOX (SOURCE)
  // ==========================================
  console.log('📥 6. Tworzenie elementów w Inbox...');

  const inboxDefs = [
    { title: 'Pomysł na nową funkcję - integracja z Slack', content: 'Użytkownicy pytają o możliwość integracji z Slack. Warto rozważyć.', sourceType: InboxSourceType.MANUAL },
    { title: 'Email od potencjalnego klienta - BigCorp', content: 'Firma BigCorp zainteresowana naszym produktem. Proszą o demo.', sourceType: InboxSourceType.EMAIL },
    { title: 'Błąd w raporcie - do sprawdzenia', content: 'Użytkownik zgłosił błąd w generowaniu raportu miesięcznego.', sourceType: InboxSourceType.MANUAL },
    { title: 'Artykuł o AI w biznesie', content: 'Ciekawy artykuł do przeczytania: https://example.com/ai-business', sourceType: InboxSourceType.MANUAL },
    { title: 'Spotkanie z zespołem - agenda', content: 'Omówić: 1) Status projektu CRM 2) Budżet Q2 3) Rekrutacja', sourceType: InboxSourceType.MANUAL },
    { title: 'Oferta współpracy od partnera', content: 'Partner X proponuje wspólną kampanię marketingową.', sourceType: InboxSourceType.EMAIL },
    { title: 'Pomysł: automatyczne raporty', content: 'Warto dodać możliwość automatycznego generowania raportów.', sourceType: InboxSourceType.MANUAL },
    { title: 'Reklamacja klienta #4521', content: 'Klient niezadowolony z czasu odpowiedzi supportu.', sourceType: InboxSourceType.EMAIL },
  ];

  for (const inboxDef of inboxDefs) {
    await prisma.inboxItem.create({
      data: {
        ...inboxDef,
        organizationId: organization.id,
        userId: owner.id
      }
    });
  }

  console.log(`   ✅ Utworzono ${inboxDefs.length} elementów w Inbox`);

  // ==========================================
  // 7. FIRMY I KONTAKTY (CRM)
  // ==========================================
  console.log('🏢 7. Tworzenie firm i kontaktów...');

  const companyDefs = [
    { name: 'TechCorp Sp. z o.o.', website: 'https://techcorp.pl', industry: 'IT', size: CompanySize.LARGE, description: 'Duża firma IT z branży enterprise' },
    { name: 'StartupHub S.A.', website: 'https://startuphub.io', industry: 'Technology', size: CompanySize.MEDIUM, description: 'Akcelerator startupów' },
    { name: 'MediaPro', website: 'https://mediapro.com', industry: 'Media', size: CompanySize.SMALL, description: 'Agencja medialna' },
    { name: 'FinancePartners', website: 'https://financepartners.pl', industry: 'Finance', size: CompanySize.LARGE, description: 'Doradztwo finansowe' },
    { name: 'EcoSolutions', website: 'https://ecosolutions.eu', industry: 'Environment', size: CompanySize.MEDIUM, description: 'Rozwiązania ekologiczne' },
    { name: 'RetailMax', website: 'https://retailmax.pl', industry: 'Retail', size: CompanySize.ENTERPRISE, description: 'Sieć sklepów detalicznych' },
  ];

  const companies: any[] = [];
  for (const compDef of companyDefs) {
    const company = await prisma.company.create({
      data: {
        ...compDef,
        organizationId: organization.id
      }
    });
    companies.push(company);
  }

  const contactDefs = [
    { firstName: 'Adam', lastName: 'Małysz', email: 'adam.malysz@techcorp.pl', phone: '+48 601 234 567', position: 'CEO', companyIdx: 0 },
    { firstName: 'Beata', lastName: 'Szydło', email: 'beata.s@techcorp.pl', phone: '+48 602 345 678', position: 'CTO', companyIdx: 0 },
    { firstName: 'Cezary', lastName: 'Pazura', email: 'cezary@startuphub.io', phone: '+48 603 456 789', position: 'Founder', companyIdx: 1 },
    { firstName: 'Dorota', lastName: 'Wellman', email: 'dorota@mediapro.com', phone: '+48 604 567 890', position: 'Marketing Director', companyIdx: 2 },
    { firstName: 'Edward', lastName: 'Miszczak', email: 'edward@financepartners.pl', phone: '+48 605 678 901', position: 'Partner', companyIdx: 3 },
    { firstName: 'Felicja', lastName: 'Kowalska', email: 'felicja@ecosolutions.eu', phone: '+48 606 789 012', position: 'Sales Manager', companyIdx: 4 },
    { firstName: 'Grzegorz', lastName: 'Nowak', email: 'grzegorz@retailmax.pl', phone: '+48 607 890 123', position: 'Procurement Director', companyIdx: 5 },
  ];

  const contacts: any[] = [];
  for (const contDef of contactDefs) {
    const contact = await prisma.contact.create({
      data: {
        firstName: contDef.firstName,
        lastName: contDef.lastName,
        email: contDef.email,
        phone: contDef.phone,
        position: contDef.position,
        company: companies[contDef.companyIdx].name,
        organizationId: organization.id
      }
    });
    contacts.push(contact);

    // Ustaw jako główny kontakt firmy
    await prisma.company.update({
      where: { id: companies[contDef.companyIdx].id },
      data: { primaryContactId: contact.id }
    });
  }

  console.log(`   ✅ Utworzono ${companies.length} firm i ${contacts.length} kontaktów`);

  // ==========================================
  // 8. TRANSAKCJE (DEALS)
  // ==========================================
  console.log('💰 8. Tworzenie transakcji...');

  const dealDefs = [
    { title: 'Licencja Enterprise - TechCorp', value: 120000, stage: DealStage.NEGOTIATION, probability: 0.7, companyIdx: 0, daysToClose: 30 },
    { title: 'Wdrożenie CRM - StartupHub', value: 45000, stage: DealStage.QUALIFIED, probability: 0.5, companyIdx: 1, daysToClose: 45 },
    { title: 'Pakiet Premium - MediaPro', value: 18000, stage: DealStage.PROPOSAL, probability: 0.6, companyIdx: 2, daysToClose: 14 },
    { title: 'Consulting - FinancePartners', value: 75000, stage: DealStage.PROSPECT, probability: 0.3, companyIdx: 3, daysToClose: 60 },
    { title: 'Integracja API - EcoSolutions', value: 32000, stage: DealStage.CLOSED_WON, probability: 1.0, companyIdx: 4, daysToClose: -10 },
    { title: 'Rozszerzenie licencji - RetailMax', value: 200000, stage: DealStage.NEGOTIATION, probability: 0.8, companyIdx: 5, daysToClose: 21 },
    { title: 'Pilot - TechCorp (oddział)', value: 25000, stage: DealStage.CLOSED_LOST, probability: 0, companyIdx: 0, daysToClose: -30 },
  ];

  for (const dealDef of dealDefs) {
    await prisma.deal.create({
      data: {
        title: dealDef.title,
        value: dealDef.value,
        stage: dealDef.stage,
        probability: dealDef.probability,
        expectedCloseDate: new Date(now.getTime() + dealDef.daysToClose * 24 * 60 * 60 * 1000),
        companyId: companies[dealDef.companyIdx].id,
        ownerId: users[dealDef.companyIdx % users.length].id,
        organizationId: organization.id,
        description: `Transakcja z ${companies[dealDef.companyIdx].name}`
      }
    });
  }

  console.log(`   ✅ Utworzono ${dealDefs.length} transakcji`);

  // ==========================================
  // 9. CELE (GOALS) - precise_goals
  // ==========================================
  console.log('🎯 9. Tworzenie celów...');

  const goalDefs = [
    { title: 'Zwiększyć przychody o 30%', description: 'Cel roczny zwiększenia przychodów', timeframe: 'YEARLY', progress: 45 },
    { title: 'Pozyskać 50 nowych klientów', description: 'Kwartalny cel sprzedażowy', timeframe: 'QUARTERLY', progress: 60 },
    { title: 'Ukończyć certyfikat AWS', description: 'Rozwój kompetencji technicznych', timeframe: 'QUARTERLY', progress: 30 },
    { title: 'Przebiec maraton poniżej 4h', description: 'Cel sportowy na rok', timeframe: 'YEARLY', progress: 25 },
    { title: 'Zbudować fundusz awaryjny', description: '6 miesięcy wydatków', timeframe: 'YEARLY', progress: 70 },
    { title: 'Wdrożyć nowy system CRM', description: 'Cel projektu', timeframe: 'QUARTERLY', progress: 35 },
  ];

  for (let i = 0; i < goalDefs.length; i++) {
    await prisma.precise_goals.create({
      data: {
        title: goalDefs[i].title,
        description: goalDefs[i].description,
        timeframe: goalDefs[i].timeframe,
        progress: goalDefs[i].progress,
        organization_id: organization.id,
        user_id: owner.id,
        target_date: new Date(now.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        stream_id: streams[i % streams.length].id
      }
    });
  }

  console.log(`   ✅ Utworzono ${goalDefs.length} celów`);

  // ==========================================
  // 10. NAWYKI (HABITS)
  // ==========================================
  console.log('🔄 10. Tworzenie nawyków...');

  const habitDefs = [
    { name: 'Poranny przegląd zadań', description: '15 minut planowania dnia', frequency: 'DAILY', targetCount: 1 },
    { name: 'Ćwiczenia fizyczne', description: 'Minimum 30 minut aktywności', frequency: 'DAILY', targetCount: 1 },
    { name: 'Nauka angielskiego', description: '20 minut nauki', frequency: 'DAILY', targetCount: 1 },
    { name: 'Przegląd tygodniowy GTD', description: 'Kompletny przegląd systemu', frequency: 'WEEKLY', targetCount: 1 },
    { name: 'Czytanie książek', description: 'Minimum 30 stron', frequency: 'DAILY', targetCount: 1 },
    { name: 'Medytacja', description: '10 minut medytacji', frequency: 'DAILY', targetCount: 1 },
  ];

  for (const habitDef of habitDefs) {
    await prisma.habit.create({
      data: {
        ...habitDef,
        organizationId: organization.id,
        isActive: true,
        currentStreak: Math.floor(Math.random() * 30),
        longestStreak: Math.floor(Math.random() * 60) + 10,
      }
    });
  }

  console.log(`   ✅ Utworzono ${habitDefs.length} nawyków`);

  // ==========================================
  // 11. TAGI
  // ==========================================
  console.log('🏷️  11. Tworzenie tagów...');

  const tagDefs = [
    { name: 'pilne', color: '#EF4444' },
    { name: 'ważne', color: '#F59E0B' },
    { name: 'klient', color: '#3B82F6' },
    { name: 'wewnętrzne', color: '#8B5CF6' },
    { name: 'dokumentacja', color: '#6B7280' },
    { name: 'bug', color: '#DC2626' },
    { name: 'feature', color: '#10B981' },
    { name: 'meeting', color: '#F97316' },
    { name: 'review', color: '#06B6D4' },
    { name: 'research', color: '#84CC16' },
  ];

  for (const tagDef of tagDefs) {
    await prisma.tag.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: tagDef.name } },
      update: {},
      create: {
        ...tagDef,
        organizationId: organization.id
      }
    });
  }

  console.log(`   ✅ Utworzono ${tagDefs.length} tagów`);

  // ==========================================
  // 12. REGUŁY AUTOMATYZACJI (unified_rules)
  // ==========================================
  console.log('⚙️  12. Tworzenie reguł automatyzacji...');

  const ruleDefs = [
    {
      name: 'Auto-priorytet dla pilnych',
      description: 'Automatycznie ustawia wysoki priorytet dla zadań z tagiem "pilne"',
      rule_type: 'PROCESSING',
      trigger_type: 'EVENT_BASED',
      conditions: { tags: ['pilne'] },
      actions: [{ type: 'SET_PRIORITY', params: { priority: 'HIGH' } }],
      is_active: true
    },
    {
      name: 'Email do Źródła',
      description: 'Automatycznie dodaje emaile od klientów do Źródła',
      rule_type: 'EMAIL_FILTER',
      trigger_type: 'EVENT_BASED',
      conditions: { sender: '*@client.com' },
      actions: [{ type: 'ADD_TO_SOURCE', params: { status: 'NEW' } }],
      is_active: true
    },
    {
      name: 'Analiza AI dla nowych elementów',
      description: 'AI analizuje nowe elementy w Źródle i sugeruje kategoryzację',
      rule_type: 'AI_RULE',
      trigger_type: 'EVENT_BASED',
      conditions: { sourceStatus: 'NEW' },
      actions: [{ type: 'AI_ANALYZE', params: { model: 'gpt-4' } }],
      is_active: true
    },
    {
      name: 'Powiadomienie o przeterminowanych',
      description: 'Wysyła powiadomienie gdy zadanie jest przeterminowane',
      rule_type: 'NOTIFICATION',
      trigger_type: 'SCHEDULED',
      conditions: { overdue: true },
      actions: [{ type: 'NOTIFY', params: { channel: 'email' } }],
      is_active: true
    },
  ];

  for (const ruleDef of ruleDefs) {
    await prisma.unified_rules.create({
      data: {
        ...ruleDef,
        organization_id: organization.id,
        created_by_id: owner.id,
        priority: 50
      }
    });
  }

  console.log(`   ✅ Utworzono ${ruleDefs.length} reguł automatyzacji`);

  // ==========================================
  // 13. PROVIDERZY AI
  // ==========================================
  console.log('🤖 13. Tworzenie providerów AI...');

  await prisma.ai_providers.upsert({
    where: { id: 'openai-provider' },
    update: {},
    create: {
      id: 'openai-provider',
      name: 'OpenAI',
      description: 'OpenAI GPT Models',
      api_endpoint: 'https://api.openai.com/v1',
      auth_type: 'api-key',
      is_active: false, // Wymaga klucza API
      config_schema: { apiKey: '' },
      supported_models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      rate_limit: { requestsPerMinute: 60, tokensPerMinute: 100000 },
      organization_id: organization.id
    }
  });

  await prisma.ai_providers.upsert({
    where: { id: 'anthropic-provider' },
    update: {},
    create: {
      id: 'anthropic-provider',
      name: 'Anthropic',
      description: 'Claude AI Models',
      api_endpoint: 'https://api.anthropic.com/v1',
      auth_type: 'api-key',
      is_active: false,
      config_schema: { apiKey: '' },
      supported_models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      rate_limit: { requestsPerMinute: 60, tokensPerMinute: 100000 },
      organization_id: organization.id
    }
  });

  console.log('   ✅ Utworzono 2 providerów AI');

  // ==========================================
  // 14. SPOTKANIA
  // ==========================================
  console.log('📅 14. Tworzenie spotkań...');

  const meetingDefs = [
    { title: 'Daily standup', startTime: new Date(now.setHours(9, 0, 0, 0)), duration: 15 },
    { title: 'Spotkanie z klientem TechCorp', startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), duration: 60 },
    { title: 'Przegląd tygodniowy', startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), duration: 60 },
    { title: 'Demo produktu dla StartupHub', startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), duration: 45 },
    { title: 'Spotkanie zespołu projektowego', startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), duration: 90 },
  ];

  for (const meetingDef of meetingDefs) {
    await prisma.meeting.create({
      data: {
        title: meetingDef.title,
        startTime: meetingDef.startTime,
        endTime: new Date(meetingDef.startTime.getTime() + meetingDef.duration * 60 * 1000),
        organizationId: organization.id,
        createdById: owner.id
      }
    });
  }

  console.log(`   ✅ Utworzono ${meetingDefs.length} spotkań`);

  // ==========================================
  // 15. BAZA WIEDZY
  // ==========================================
  console.log('📚 15. Tworzenie bazy wiedzy...');

  const knowledgeDefs = [
    { title: 'Procedura onboardingu klienta', content: '# Onboarding klienta\n\n1. Spotkanie wprowadzające\n2. Konfiguracja systemu\n3. Szkolenie użytkowników\n4. Go-live', category: 'procedures' },
    { title: 'FAQ - Najczęstsze pytania', content: '# FAQ\n\n## Jak zresetować hasło?\nKliknij "Zapomniałem hasła" na stronie logowania.\n\n## Jak dodać użytkownika?\nPrzejdź do Ustawienia > Użytkownicy > Dodaj', category: 'help' },
    { title: 'Specyfikacja API v2', content: '# API v2\n\n## Endpoints\n- GET /api/v2/tasks\n- POST /api/v2/tasks\n- PUT /api/v2/tasks/:id\n- DELETE /api/v2/tasks/:id', category: 'technical' },
    { title: 'Cele kwartalne Q1 2025', content: '# Cele Q1 2025\n\n1. Wzrost MRR o 20%\n2. 100 nowych klientów\n3. NPS > 50\n4. Wdrożenie modułu AI', category: 'strategy' },
  ];

  for (const noteDef of knowledgeDefs) {
    await prisma.knowledgeBase.create({
      data: {
        ...noteDef,
        organizationId: organization.id,
        createdById: owner.id
      }
    });
  }

  console.log(`   ✅ Utworzono ${knowledgeDefs.length} notatek`);

  // ==========================================
  // PODSUMOWANIE
  // ==========================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 DANE TESTOWE UTWORZONE POMYŚLNIE!');
  console.log('='.repeat(50));
  console.log('\n📊 Podsumowanie:');
  console.log(`   • Użytkownicy: ${users.length}`);
  console.log(`   • Konteksty: ${contexts.length}`);
  console.log(`   • Strumienie: ${streams.length}`);
  console.log(`   • Projekty: ${projects.length}`);
  console.log(`   • Zadania: ${tasks.length}`);
  console.log(`   • Elementy w Inbox: ${inboxDefs.length}`);
  console.log(`   • Firmy: ${companies.length}`);
  console.log(`   • Kontakty: ${contacts.length}`);
  console.log(`   • Transakcje: ${dealDefs.length}`);
  console.log(`   • Cele: ${goalDefs.length}`);
  console.log(`   • Nawyki: ${habitDefs.length}`);
  console.log(`   • Tagi: ${tagDefs.length}`);
  console.log(`   • Reguły automatyzacji: ${ruleDefs.length}`);
  console.log(`   • Spotkania: ${meetingDefs.length}`);
  console.log(`   • Baza wiedzy: ${knowledgeDefs.length}`);

  console.log('\n🔐 Dane logowania:');
  console.log('   Email: owner@demo.com');
  console.log('   Hasło: demo123');
  console.log('\n   Pozostali użytkownicy (to samo hasło):');
  console.log('   - admin@demo.com (Admin)');
  console.log('   - manager@demo.com (Manager)');
  console.log('   - user1@demo.com (Member)');
  console.log('   - user2@demo.com (Member)');
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas tworzenia danych:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
