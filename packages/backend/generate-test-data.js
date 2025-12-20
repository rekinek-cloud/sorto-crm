const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

// Ustaw język polski dla faker
faker.locale = 'pl';

// Konfiguracja
const CONFIG = {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-10-31'),
  organizations: 3,
  usersPerOrg: 5,
  tasksTarget: 2000,
  projectsTarget: 50,
  messagesTarget: 5000,
  meetingsTarget: 500,
  dealsTarget: 200,
  invoicesTarget: 300,
  ordersTarget: 250,
  offersTarget: 150,
  inboxItemsTarget: 500,
  nextActionsTarget: 300,
  waitingForTarget: 150,
  recurringTasksTarget: 100,
  contactsTarget: 500,
  companiesTarget: 300
};

// Helper funkcje
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Główna funkcja generująca dane
async function generateTestData() {
  console.log('🚀 Rozpoczynam generowanie danych testowych...\n');
  
  try {
    // 1. Pobierz istniejące dane
    console.log('📊 Pobieram istniejące dane...');
    const existingOrgs = await prisma.organization.findMany();
    const existingUsers = await prisma.user.findMany();
    const existingProjects = await prisma.project.findMany();
    const existingContacts = await prisma.contact.findMany();
    const existingCompanies = await prisma.company.findMany();
    
    if (existingOrgs.length === 0 || existingUsers.length === 0) {
      console.error('❌ Brak organizacji lub użytkowników w bazie. Najpierw uruchom seed.');
      return;
    }
    
    console.log(`✅ Znaleziono: ${existingOrgs.length} organizacji, ${existingUsers.length} użytkowników\n`);
    
    // 2. Generuj projekty
    console.log('🎯 Generuję projekty...');
    const projectTypes = ['Rozwój produktu', 'Wdrożenie klienta', 'Projekt wewnętrzny', 'Marketing', 'R&D'];
    const projectStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED'];
    
    const newProjects = [];
    const projectsToCreate = CONFIG.projectsTarget - existingProjects.length;
    
    for (let i = 0; i < projectsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const owner = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const startDate = randomDate(CONFIG.startDate, CONFIG.endDate);
      const endDate = new Date(startDate.getTime() + randomInt(30, 180) * 24 * 60 * 60 * 1000);
      
      const project = await prisma.project.create({
        data: {
          name: `${randomElement(projectTypes)} - ${faker.company.catchPhrase()}`,
          description: faker.lorem.paragraph(),
          status: randomElement(projectStatuses),
          organizationId: org.id,
          createdById: owner.id,
          assignedToId: owner.id, // Zmieniono z ownerId na assignedToId
          startDate: startDate,
          endDate: endDate,
          // budget nie istnieje w modelu Project
          priority: randomElement(['LOW', 'MEDIUM', 'HIGH']),
          smartAnalysis: {
            type: randomElement(projectTypes),
            tags: faker.lorem.words(3).split(' '),
            team_size: randomInt(2, 10),
            budget: randomInt(5000, 500000)
          }
        }
      });
      newProjects.push(project);
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Utworzono ${i + 1}/${projectsToCreate} projektów...`);
      }
    }
    console.log(`✅ Utworzono ${newProjects.length} nowych projektów\n`);
    
    // 3. Generuj zadania
    console.log('📋 Generuję zadania...');
    const allProjects = [...existingProjects, ...newProjects];
    const taskStatuses = ['NEW', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELED'];
    const taskPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const contexts = ['@computer', '@calls', '@office', '@home', '@errands', '@online', '@waiting', '@reading'];
    
    const existingTasks = await prisma.task.count();
    const tasksToCreate = CONFIG.tasksTarget - existingTasks;
    
    for (let i = 0; i < tasksToCreate; i++) {
      const org = randomElement(existingOrgs);
      const assignee = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const createdAt = randomDate(CONFIG.startDate, new Date());
      const dueDate = randomDate(createdAt, CONFIG.endDate);
      const project = Math.random() > 0.3 ? randomElement(allProjects.filter(p => p.organizationId === org.id)) : null;
      
      const taskTypes = [
        'Przygotować raport',
        'Zadzwonić do klienta',
        'Przejrzeć dokumentację',
        'Zaktualizować prezentację',
        'Wysłać ofertę',
        'Przeprowadzić spotkanie',
        'Wykonać analizę',
        'Przetestować funkcjonalność',
        'Napisać specyfikację',
        'Sprawdzić faktury'
      ];
      
      await prisma.task.create({
        data: {
          title: `${randomElement(taskTypes)} - ${faker.company.catchPhrase()}`,
          description: faker.lorem.paragraph(),
          status: randomElement(taskStatuses),
          priority: randomElement(taskPriorities),
          organizationId: org.id,
          assignedToId: assignee.id, // Zmieniono z assigneeId na assignedToId
          createdById: assignee.id,
          projectId: project?.id,
          dueDate: dueDate,
          estimatedHours: randomElement([0.25, 0.5, 1, 2, 4, 8]), // Zmieniono z estimatedTime na estimatedHours
          actualHours: Math.random() > 0.5 ? randomInt(1, 12) / 2 : null, // Zmieniono z actualTime na actualHours
          energy: randomElement(['HIGH', 'MEDIUM', 'LOW']), // Zmieniono z energyLevel na energy
          createdAt: createdAt,
          completedAt: Math.random() > 0.7 ? randomDate(createdAt, new Date()) : null,
          smartAnalysis: {
            source: randomElement(['email', 'meeting', 'phone', 'direct']),
            tags: faker.lorem.words(randomInt(1, 4)).split(' '),
            gtd_bucket: randomElement(['next_actions', 'waiting_for', 'someday_maybe']),
            context: randomElement(contexts)
          }
        }
      });
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Utworzono ${i + 1}/${tasksToCreate} zadań...`);
      }
    }
    console.log(`✅ Utworzono ${tasksToCreate} nowych zadań\n`);
    
    // 4. Generuj kontakty
    console.log('👥 Generuję kontakty...');
    const contactsToCreate = CONFIG.contactsTarget - existingContacts.length;
    const newContacts = [];
    
    for (let i = 0; i < contactsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const company = existingCompanies.length > 0 ? randomElement(existingCompanies.filter(c => c.organizationId === org.id)) : null;
      
      const contact = await prisma.contact.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number('+48 ### ### ###'),
          position: faker.person.jobTitle(),
          organizationId: org.id,
          companyId: company?.id,
          source: randomElement(['website', 'referral', 'cold_call', 'event', 'social_media']),
          tags: faker.lorem.words(randomInt(1, 3)).split(' '),
          notes: `Preferred contact: ${randomElement(['email', 'phone', 'meeting'])}`
        }
      });
      newContacts.push(contact);
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Utworzono ${i + 1}/${contactsToCreate} kontaktów...`);
      }
    }
    console.log(`✅ Utworzono ${newContacts.length} nowych kontaktów\n`);
    
    // 5. Generuj firmy
    console.log('🏢 Generuję firmy...');
    const companiesToCreate = CONFIG.companiesTarget - existingCompanies.length;
    const newCompanies = [];
    
    for (let i = 0; i < companiesToCreate; i++) {
      const org = randomElement(existingOrgs);
      
      const company = await prisma.company.create({
        data: {
          name: faker.company.name(),
          email: faker.internet.email(),
          phone: faker.phone.number('+48 ## ### ## ##'),
          website: faker.internet.url(),
          address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.zipCode()}`,
          industry: randomElement(['IT', 'Finanse', 'Handel', 'Produkcja', 'Usługi', 'Edukacja', 'Zdrowie']),
          size: randomElement(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
          organizationId: org.id,
          revenue: `${randomInt(100000, 10000000)} PLN`,
          description: `${faker.company.catchPhrase()} | NIP: ${faker.string.numeric(10)}, REGON: ${faker.string.numeric(9)}, Founded: ${randomInt(1990, 2024)}`
        }
      });
      newCompanies.push(company);
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Utworzono ${i + 1}/${companiesToCreate} firm...`);
      }
    }
    console.log(`✅ Utworzono ${newCompanies.length} nowych firm\n`);
    
    // 6. Pomiń generowanie wiadomości na razie (problem z channelId)
    console.log('⏸️  Pomijam generowanie wiadomości (błąd schematu)\n');
    
    // 7. Generuj spotkania
    console.log('📅 Generuję spotkania...');
    const allContacts = [...existingContacts, ...newContacts];
    const existingMeetings = await prisma.meeting.count();
    const meetingsToCreate = CONFIG.meetingsTarget - existingMeetings;
    
    const meetingTypes = [
      'Spotkanie zespołu',
      'Spotkanie z klientem',
      'Spotkanie 1-on-1',
      'Prezentacja produktu',
      'Szkolenie',
      'Warsztaty',
      'Konferencja',
      'Webinar',
      'Stand-up',
      'Retrospektywa'
    ];
    
    for (let i = 0; i < meetingsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const organizer = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const contact = allContacts.length > 0 && Math.random() > 0.5 
        ? randomElement(allContacts.filter(c => c.organizationId === org.id)) 
        : null;
      
      const startTime = randomDate(CONFIG.startDate, CONFIG.endDate);
      const duration = randomElement([15, 30, 60, 90, 120, 180, 240]); // minuty
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      await prisma.meeting.create({
        data: {
          title: `${randomElement(meetingTypes)} - ${faker.company.catchPhrase()}`,
          description: faker.lorem.paragraph(),
          startTime: startTime,
          endTime: endTime,
          location: Math.random() > 0.5 ? faker.location.streetAddress() : 'Online',
          meetingUrl: Math.random() > 0.5 ? `https://meet.example.com/${faker.string.alphanumeric(10)}` : null,
          agenda: faker.lorem.paragraphs(randomInt(1, 2)),
          status: randomElement(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
          organizationId: org.id,
          organizedById: organizer.id,
          contactId: contact?.id,
          notes: `Type: ${randomElement(meetingTypes)}, Recurring: ${Math.random() > 0.7}, Attendees: ${randomInt(2, 20)}, Recording: ${Math.random() > 0.3}`
        }
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Utworzono ${i + 1}/${meetingsToCreate} spotkań...`);
      }
    }
    console.log(`✅ Utworzono ${meetingsToCreate} nowych spotkań\n`);
    
    // 8. Generuj transakcje (deals)
    console.log('💰 Generuję transakcje...');
    const existingDeals = await prisma.deal.count();
    const dealsToCreate = CONFIG.dealsTarget - existingDeals;
    const allCompanies = [...existingCompanies, ...newCompanies];
    
    const dealStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    
    for (let i = 0; i < dealsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const owner = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const contact = allContacts.length > 0 ? randomElement(allContacts.filter(c => c.organizationId === org.id)) : null;
      const company = allCompanies.length > 0 ? randomElement(allCompanies.filter(c => c.organizationId === org.id)) : null;
      
      const createdAt = randomDate(CONFIG.startDate, new Date());
      const stage = randomElement(dealStages);
      const closedAt = ['CLOSED_WON', 'CLOSED_LOST'].includes(stage) 
        ? randomDate(createdAt, new Date()) 
        : null;
      
      await prisma.deal.create({
        data: {
          title: `${faker.commerce.productName()} - ${company?.name || faker.company.companyName()}`,
          description: faker.lorem.paragraph(),
          value: randomInt(1000, 1000000),
          stage: stage,
          probability: stage === 'PROSPECT' ? 10 : stage === 'QUALIFIED' ? 25 : stage === 'PROPOSAL' ? 50 : stage === 'NEGOTIATION' ? 75 : stage === 'CLOSED_WON' ? 100 : 0,
          expectedCloseDate: randomDate(new Date(), CONFIG.endDate),
          organizationId: org.id,
          ownerId: owner.id,
          companyId: company?.id || allCompanies[0]?.id,
          createdAt: createdAt,
          actualCloseDate: closedAt,
          notes: `Source: ${randomElement(['website', 'referral', 'cold_call', 'event', 'partner'])}, Products: ${faker.commerce.productName()}, Competitors: ${faker.company.name()}, Notes: ${faker.lorem.paragraph()}`
        }
      });
      
      if ((i + 1) % 20 === 0) {
        console.log(`  Utworzono ${i + 1}/${dealsToCreate} transakcji...`);
      }
    }
    console.log(`✅ Utworzono ${dealsToCreate} nowych transakcji\n`);
    
    // 9. Generuj elementy GTD Inbox
    console.log('📥 Generuję elementy GTD Inbox...');
    const existingInboxItems = await prisma.inboxItem.count();
    const inboxItemsToCreate = CONFIG.inboxItemsTarget - existingInboxItems;
    
    const sourceTypes = [
      'QUICK_CAPTURE', 'MEETING_NOTES', 'PHONE_CALL', 'EMAIL', 
      'IDEA', 'DOCUMENT', 'BILL_INVOICE', 'ARTICLE', 'VOICE_MEMO', 
      'PHOTO', 'OTHER'
    ];
    
    for (let i = 0; i < inboxItemsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const user = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const createdAt = randomDate(CONFIG.startDate, new Date());
      
      const titles = {
        'QUICK_CAPTURE': ['Pomysł na nową funkcję', 'Notatka ze spotkania', 'Lista zakupów', 'Przypomnienie'],
        'MEETING_NOTES': ['Notatki z odprawy', 'Spotkanie z klientem', 'Brainstorm zespołu', 'Planning meeting'],
        'PHONE_CALL': ['Rozmowa z dostawcą', 'Telefon od klienta', 'Follow-up call', 'Rozmowa rekrutacyjna'],
        'EMAIL': ['Ważna wiadomość', 'Oferta współpracy', 'Zapytanie o produkt', 'Newsletter do przejrzenia'],
        'IDEA': ['Nowy produkt', 'Usprawnienie procesu', 'Pomysł marketingowy', 'Innowacja'],
        'DOCUMENT': ['Umowa do przeglądu', 'Raport do analizy', 'Specyfikacja', 'Dokumentacja'],
        'BILL_INVOICE': ['Faktura za hosting', 'Rachunek za prąd', 'Faktura od dostawcy', 'Opłata za domenę'],
        'ARTICLE': ['Artykuł branżowy', 'Tutorial do przeczytania', 'Case study', 'Whitepaper'],
        'VOICE_MEMO': ['Notatka głosowa', 'Dyktafon ze spotkania', 'Pomysł nagrany w aucie', 'Voice note'],
        'PHOTO': ['Zdjęcie tablicy', 'Screenshot błędu', 'Wizytówka', 'Zdjęcie produktu'],
        'OTHER': ['Do przemyślenia', 'Różne', 'Do sprawdzenia', 'Inne']
      };
      
      const sourceType = randomElement(sourceTypes);
      
      await prisma.inboxItem.create({
        data: {
          note: randomElement(titles[sourceType] || ['Element do przetworzenia']),
          content: faker.lorem.paragraph(),
          sourceType: sourceType,
          processed: Math.random() > 0.6,
          processedAt: Math.random() > 0.6 ? randomDate(createdAt, new Date()) : null,
          organizationId: org.id,
          capturedById: user.id,
          createdAt: createdAt,
          urgencyScore: randomInt(0, 100),
          actionable: Math.random() > 0.5,
          context: randomElement(['home', 'work', 'mobile', 'anywhere']),
          source: randomElement(['email', 'phone', 'meeting', 'web', 'other'])
        }
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Utworzono ${i + 1}/${inboxItemsToCreate} elementów inbox...`);
      }
    }
    console.log(`✅ Utworzono ${inboxItemsToCreate} nowych elementów GTD Inbox\n`);
    
    // 10. Generuj zadania cykliczne
    console.log('🔄 Generuję zadania cykliczne...');
    const existingRecurringTasks = await prisma.recurringTask.count();
    const recurringTasksToCreate = CONFIG.recurringTasksTarget - existingRecurringTasks;
    
    const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    const recurringTaskTitles = [
      'Backup bazy danych',
      'Raport sprzedaży',
      'Przegląd bezpieczeństwa',
      'Aktualizacja systemu',
      'Spotkanie zespołu',
      'Przegląd KPI',
      'Raport dla zarządu',
      'Audyt finansowy',
      'Newsletter',
      'Przegląd umów'
    ];
    
    for (let i = 0; i < recurringTasksToCreate; i++) {
      const org = randomElement(existingOrgs);
      const assignee = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const startDate = randomDate(CONFIG.startDate, new Date());
      const endDate = randomDate(startDate, CONFIG.endDate);
      
      await prisma.recurringTask.create({
        data: {
          title: `${randomElement(recurringTaskTitles)} - ${faker.company.buzzPhrase()}`,
          description: faker.lorem.paragraph(),
          frequency: randomElement(frequencies),
          nextOccurrence: randomDate(startDate, endDate),
          isActive: Math.random() > 0.2,
          organizationId: org.id,
          assignedToId: assignee.id,
          priority: randomElement(['LOW', 'MEDIUM', 'HIGH']),
          estimatedMinutes: randomElement([30, 60, 120, 240]),
          context: randomElement(['maintenance', 'reporting', 'review', 'communication'])
        }
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Utworzono ${i + 1}/${recurringTasksToCreate} zadań cyklicznych...`);
      }
    }
    console.log(`✅ Utworzono ${recurringTasksToCreate} nowych zadań cyklicznych\n`);
    
    console.log('🎉 Generowanie danych testowych zakończone!\n');
    
    // Podsumowanie
    console.log('📊 PODSUMOWANIE:');
    console.log(`  - Projekty: ${newProjects.length} nowych (łącznie: ${allProjects.length})`);
    console.log(`  - Zadania: ${tasksToCreate} nowych`);
    console.log(`  - Kontakty: ${newContacts.length} nowych`);
    console.log(`  - Firmy: ${newCompanies.length} nowych`);
    console.log(`  - Wiadomości: POMINIĘTE (błąd schematu)`);
    console.log(`  - Spotkania: ${meetingsToCreate} nowych`);
    console.log(`  - Transakcje: ${dealsToCreate} nowych`);
    console.log(`  - GTD Inbox: ${inboxItemsToCreate} nowych`);
    console.log(`  - Zadania cykliczne: ${recurringTasksToCreate} nowych`);
    
  } catch (error) {
    console.error('❌ Błąd podczas generowania danych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom generator
generateTestData()
  .then(() => console.log('\n✅ Skrypt zakończony'))
  .catch(console.error);