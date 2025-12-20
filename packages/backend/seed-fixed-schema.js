const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFixedSchema() {
  console.log('🔧 Wypełnianie z poprawnymi polami schema...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    // 1. Waiting For - poprawne pola
    console.log('⏳ Waiting For...');
    try {
      await prisma.waitingFor.createMany({
        data: [
          {
            description: 'Client approval for project scope',  // nie 'item'
            waitingForWho: 'ABC Corp decision maker',          // nie 'waitingFor'
            createdById: user.id,                             // wymagane
            organizationId: organization.id
          },
          {
            description: 'Hardware delivery from supplier',
            waitingForWho: 'TechSupply logistics',
            createdById: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ waiting_for: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  waiting_for: ${error.message.substring(0, 80)}...`);
    }

    // 2. Someday Maybe - poprawne pola
    console.log('\n🌟 Someday Maybe...');
    try {
      await prisma.somedayMaybe.createMany({
        data: [
          {
            title: 'Mobile app development',                   // nie 'item'
            description: 'Native mobile application',
            category: 'IDEAS',                                // nie 'PRODUCT'
            createdById: user.id,
            organizationId: organization.id
          },
          {
            title: 'Team building retreat',
            description: 'Organize team retreat',
            category: 'PROJECTS',                             // nie 'TEAM'
            createdById: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ someday_maybe: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  someday_maybe: ${error.message.substring(0, 80)}...`);
    }

    // 3. Habits - brak userId!
    console.log('\n🔄 Habits...');
    try {
      await prisma.habit.createMany({
        data: [
          {
            name: 'Daily Inbox Processing',
            description: 'Process GTD inbox every morning',
            frequency: 'DAILY',
            isActive: true,
            // userId: user.id,  // TO POLE NIE ISTNIEJE!
            organizationId: organization.id
          },
          {
            name: 'Weekly Review',
            description: 'Weekly GTD review',
            frequency: 'WEEKLY',
            isActive: true,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ habits: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  habits: ${error.message.substring(0, 80)}...`);
    }

    // 4. Meeting - poprawne pola
    console.log('\n🤝 Meetings...');
    try {
      await prisma.meeting.createMany({
        data: [
          {
            title: 'Team Sync',
            startTime: new Date('2025-01-08T10:00:00Z'),
            endTime: new Date('2025-01-08T11:00:00Z'),
            status: 'SCHEDULED',
            organizedById: user.id,                          // nie 'createdById'
            organizationId: organization.id
          },
          {
            title: 'Client Call',
            startTime: new Date('2025-01-10T14:00:00Z'),
            endTime: new Date('2025-01-10T15:00:00Z'),
            status: 'COMPLETED',
            organizedById: user.id,
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ meetings: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  meetings: ${error.message.substring(0, 80)}...`);
    }

    // 5. Weekly Review - sprawdź czy brak userId
    console.log('\n📊 Weekly Reviews...');
    try {
      await prisma.weeklyReview.createMany({
        data: [
          {
            weekStartDate: new Date('2025-01-06'),
            completedTasks: 15,
            newTasks: 8,
            completionRate: 75.5,
            notes: 'Good week overall',
            // userId: user.id,  // Może nie istnieje?
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ weekly_reviews: 1 rekord');
    } catch (error) {
      console.log(`⚠️  weekly_reviews: ${error.message.substring(0, 80)}...`);
    }

    // 6. Messages - sprawdź wymagane pola
    console.log('\n📧 Messages...');
    try {
      await prisma.message.createMany({
        data: [
          {
            subject: 'Project Status Update',
            content: 'The project is progressing well',
            from: 'manager@company.com',
            to: 'team@company.com',
            status: 'PROCESSED',
            organizationId: organization.id
            // channelId może być wymagane?
          },
          {
            subject: 'Meeting Reminder',
            content: 'Reminder about tomorrow meeting',
            from: 'assistant@company.com', 
            to: 'team@company.com',
            status: 'NEW',
            organizationId: organization.id
          }
        ]
      });
      console.log('✅ messages: 2 rekordy');
    } catch (error) {
      console.log(`⚠️  messages: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n🎉 Wypełnianie z poprawkami zakończone!');

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFixedSchema();