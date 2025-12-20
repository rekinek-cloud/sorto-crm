import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Wypełnianie wszystkich tabel etap po etapie...');

  try {
    // Najpierw sprawdzmy co już mamy
    const currentCounts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.deal.count(),
      prisma.stream.count()
    ]);

    console.log('📊 Obecny stan tabel:');
    console.log(`- Organizations: ${currentCounts[0]}`);
    console.log(`- Users: ${currentCounts[1]}`);
    console.log(`- Contacts: ${currentCounts[2]}`);
    console.log(`- Companies: ${currentCounts[3]}`);
    console.log(`- Projects: ${currentCounts[4]}`);
    console.log(`- Tasks: ${currentCounts[5]}`);
    console.log(`- Deals: ${currentCounts[6]}`);
    console.log(`- Streams: ${currentCounts[7]}`);

    // Znajdź pierwszą organizację
    const firstOrg = await prisma.organization.findFirst();
    if (!firstOrg) {
      throw new Error('Brak organizacji w bazie danych');
    }
    console.log(`🏢 Używam organizacji: ${firstOrg.id} (${firstOrg.name})`);

    // Znajdź pierwszego użytkownika
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error('Brak użytkowników w bazie danych');
    }
    console.log(`👤 Używam użytkownika: ${firstUser.id} (${firstUser.firstName})`);

    // Dodaj różne statusy kontaktów
    console.log('📞 Dodawanie kontaktów z różnymi statusami...');
    await prisma.contact.createMany({
      data: [
        {
          firstName: 'Anna', lastName: 'Kowalska', email: 'anna@example.com',
          status: 'ACTIVE', organizationId: firstOrg.id, source: 'WEBSITE'
        },
        {
          firstName: 'Piotr', lastName: 'Nowak', email: 'piotr@lead.com',
          status: 'LEAD', organizationId: firstOrg.id, source: 'LINKEDIN'
        },
        {
          firstName: 'Maria', lastName: 'Customer', email: 'maria@customer.com',
          status: 'CUSTOMER', organizationId: firstOrg.id, source: 'REFERRAL'
        },
        {
          firstName: 'Jan', lastName: 'Archived', email: 'jan@archived.com',
          status: 'ARCHIVED', organizationId: firstOrg.id, source: 'COLD_CALL'
        }
      ],
      skipDuplicates: true
    });

    // Dodaj różne statusy firm
    console.log('🏢 Dodawanie firm z różnymi statusami...');
    await prisma.company.createMany({
      data: [
        {
          name: 'Prospect Corp', industry: 'Technology',
          status: 'PROSPECT', organizationId: firstOrg.id
        },
        {
          name: 'Customer Inc', industry: 'Finance',
          status: 'CUSTOMER', organizationId: firstOrg.id
        },
        {
          name: 'Partner LLC', industry: 'Marketing',
          status: 'PARTNER', organizationId: firstOrg.id
        },
        {
          name: 'Inactive Ltd', industry: 'Services',
          status: 'INACTIVE', organizationId: firstOrg.id
        }
      ],
      skipDuplicates: true
    });

    // Dodaj różne statusy projektów
    console.log('📂 Dodawanie projektów z różnymi statusami...');
    await prisma.project.createMany({
      data: [
        {
          name: 'Planning Project', description: 'Project in planning phase',
          status: 'PLANNING', priority: 'MEDIUM', organizationId: firstOrg.id
        },
        {
          name: 'Active Project', description: 'Project in progress',
          status: 'IN_PROGRESS', priority: 'HIGH', organizationId: firstOrg.id
        },
        {
          name: 'On Hold Project', description: 'Project temporarily paused',
          status: 'ON_HOLD', priority: 'LOW', organizationId: firstOrg.id
        },
        {
          name: 'Completed Project', description: 'Successfully finished project',
          status: 'COMPLETED', priority: 'HIGH', organizationId: firstOrg.id,
          completedAt: new Date()
        }
      ],
      skipDuplicates: true
    });

    // Dodaj różne statusy zadań
    console.log('✅ Dodawanie zadań z różnymi statusami...');
    await prisma.task.createMany({
      data: [
        {
          title: 'New Task', description: 'Newly created task',
          status: 'NEW', priority: 'MEDIUM', organizationId: firstOrg.id,
          assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'MEDIUM'
        },
        {
          title: 'In Progress Task', description: 'Currently being worked on',
          status: 'IN_PROGRESS', priority: 'HIGH', organizationId: firstOrg.id,
          assignedToId: firstUser.id, createdById: firstUser.id, context: '@office', energy: 'HIGH'
        },
        {
          title: 'Waiting Task', description: 'Waiting for external input',
          status: 'WAITING', priority: 'MEDIUM', organizationId: firstOrg.id,
          assignedToId: firstUser.id, createdById: firstUser.id, context: '@waiting', energy: 'LOW'
        },
        {
          title: 'Completed Task', description: 'Successfully finished task',
          status: 'COMPLETED', priority: 'HIGH', organizationId: firstOrg.id,
          assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'MEDIUM',
          completedAt: new Date()
        }
      ],
      skipDuplicates: true
    });

    // Dodaj różne etapy dealów
    console.log('💼 Dodawanie dealów z różnymi etapami...');
    await prisma.deal.createMany({
      data: [
        {
          title: 'Prospect Deal', value: 10000, stage: 'PROSPECT',
          probability: 20, organizationId: firstOrg.id, assignedToId: firstUser.id,
          source: 'WEBSITE'
        },
        {
          title: 'Qualified Deal', value: 25000, stage: 'QUALIFIED',
          probability: 40, organizationId: firstOrg.id, assignedToId: firstUser.id,
          source: 'REFERRAL'
        },
        {
          title: 'Proposal Deal', value: 50000, stage: 'PROPOSAL',
          probability: 60, organizationId: firstOrg.id, assignedToId: firstUser.id,
          source: 'INBOUND'
        },
        {
          title: 'Won Deal', value: 75000, stage: 'CLOSED_WON',
          probability: 100, organizationId: firstOrg.id, assignedToId: firstUser.id,
          source: 'OUTBOUND', closedDate: new Date()
        }
      ],
      skipDuplicates: true
    });

    // Sprawdź końcowy stan
    const finalCounts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.deal.count()
    ]);

    console.log('\n✅ Wypełnianie zakończone! Nowy stan tabel:');
    console.log(`- Organizations: ${finalCounts[0]} (+${finalCounts[0] - currentCounts[0]})`);
    console.log(`- Users: ${finalCounts[1]} (+${finalCounts[1] - currentCounts[1]})`);
    console.log(`- Contacts: ${finalCounts[2]} (+${finalCounts[2] - currentCounts[2]})`);
    console.log(`- Companies: ${finalCounts[3]} (+${finalCounts[3] - currentCounts[3]})`);
    console.log(`- Projects: ${finalCounts[4]} (+${finalCounts[4] - currentCounts[4]})`);
    console.log(`- Tasks: ${finalCounts[5]} (+${finalCounts[5] - currentCounts[5]})`);
    console.log(`- Deals: ${finalCounts[6]} (+${finalCounts[6] - currentCounts[6]})`);

  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });