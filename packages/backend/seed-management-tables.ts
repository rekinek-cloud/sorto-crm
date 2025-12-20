import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedManagementTables() {
  console.log('🎯 SEEDOWANIE MANAGEMENT TABLES - stream_channels, task_relationships, user_relations\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const tasks = await prisma.task.findMany({ take: 4 });
    const streams = await prisma.stream.findMany({ take: 3 });
    const communicationChannels = await prisma.communicationChannel.findMany({ take: 2 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}`);
    console.log(`✅ Zadania: ${tasks.length}`);
    console.log(`✅ Streams: ${streams.length}`);
    console.log(`✅ Communication Channels: ${communicationChannels.length}\n`);

    // 1. STREAM_CHANNELS
    if (streams.length > 0 && communicationChannels.length > 0) {
      await seedIfEmpty('stream_channels', async () => {
        const streamChannelData: Prisma.StreamChannelCreateManyInput[] = [
          {
            streamId: streams[0].id,
            channelId: communicationChannels[0].id,
            autoCreateTasks: true,
            defaultContext: '@office',
            defaultPriority: 'HIGH'
          },
          {
            streamId: streams[0].id,
            channelId: communicationChannels[1]?.id || communicationChannels[0].id,
            autoCreateTasks: false,
            defaultContext: '@computer',
            defaultPriority: 'MEDIUM'
          },
          {
            streamId: streams[1]?.id || streams[0].id,
            channelId: communicationChannels[0].id,
            autoCreateTasks: true,
            defaultContext: '@calls',
            defaultPriority: 'MEDIUM'
          }
        ];
        await prisma.streamChannel.createMany({ data: streamChannelData });
      });
    }

    // 2. TASK_RELATIONSHIPS
    if (tasks.length >= 3) {
      await seedIfEmpty('task_relationships', async () => {
        const taskRelationshipData: Prisma.TaskRelationshipCreateManyInput[] = [
          {
            type: 'FINISH_TO_START',
            lag: '1d',
            isCriticalPath: true,
            notes: 'Zadanie 2 może rozpocząć się dzień po zakończeniu zadania 1',
            fromTaskId: tasks[0].id,
            toTaskId: tasks[1].id
          },
          {
            type: 'START_TO_START',
            lag: '2h',
            isCriticalPath: false,
            notes: 'Zadanie 3 rozpoczyna się 2 godziny po rozpoczęciu zadania 2',
            fromTaskId: tasks[1].id,
            toTaskId: tasks[2].id
          },
          {
            type: 'FINISH_TO_FINISH',
            lag: '0',
            isCriticalPath: false,
            notes: 'Zadanie 4 kończy się wraz z zakończeniem zadania 1',
            fromTaskId: tasks[0].id,
            toTaskId: tasks[3]?.id || tasks[2].id
          },
          {
            type: 'START_TO_FINISH',
            lag: '1w',
            isCriticalPath: true,
            notes: 'Zadanie 2 musi zakończyć się w ciągu tygodnia od rozpoczęcia zadania 3',
            fromTaskId: tasks[2].id,
            toTaskId: tasks[1].id
          }
        ];
        await prisma.taskRelationship.createMany({ data: taskRelationshipData });
      });
    }

    // 3. USER_RELATIONS
    if (users.length >= 3) {
      await seedIfEmpty('user_relations', async () => {
        const userRelationData: Prisma.UserRelationCreateManyInput[] = [
          {
            managerId: users[0].id,
            employeeId: users[1].id,
            relationType: 'MANAGES',
            description: 'Główny manager zespołu deweloperskiego',
            isActive: true,
            inheritanceRule: 'INHERIT_DOWN',
            canDelegate: true,
            canApprove: true,
            startsAt: new Date('2024-01-01'),
            endsAt: null,
            createdById: users[0].id,
            organizationId: organization.id
          },
          {
            managerId: users[0].id,
            employeeId: users[2].id,
            relationType: 'LEADS',
            description: 'Lider zespołu projektowego',
            isActive: true,
            inheritanceRule: 'INHERIT_DOWN',
            canDelegate: true,
            canApprove: false,
            startsAt: new Date('2024-06-01'),
            endsAt: null,
            createdById: users[0].id,
            organizationId: organization.id
          },
          {
            managerId: users[1].id,
            employeeId: users[3]?.id || users[2].id,
            relationType: 'MENTORS',
            description: 'Mentor dla nowych pracowników',
            isActive: true,
            inheritanceRule: 'INHERIT_BIDIRECTIONAL',
            canDelegate: false,
            canApprove: false,
            startsAt: new Date('2024-07-01'),
            endsAt: new Date('2025-07-01'),
            createdById: users[0].id,
            organizationId: organization.id
          },
          {
            managerId: users[1].id,
            employeeId: users[4]?.id || users[2].id,
            relationType: 'SUPERVISES',
            description: 'Supervisor dla projektów klienckich',
            isActive: true,
            inheritanceRule: 'INHERIT_DOWN',
            canDelegate: true,
            canApprove: true,
            startsAt: new Date('2024-03-15'),
            endsAt: null,
            createdById: users[0].id,
            organizationId: organization.id
          },
          {
            managerId: users[2].id,
            employeeId: users[4]?.id || users[1].id,
            relationType: 'COLLABORATES',
            description: 'Współpraca między działami',
            isActive: true,
            inheritanceRule: 'NO_INHERITANCE',
            canDelegate: false,
            canApprove: false,
            startsAt: new Date('2024-09-01'),
            endsAt: new Date('2025-03-01'),
            createdById: users[0].id,
            organizationId: organization.id
          }
        ];
        await prisma.userRelation.createMany({ data: userRelationData });
      });
    }

    console.log('\n🎉 SUKCES! Wszystkie 3 tabele management zostały wypełnione!');
    console.log('✅ Stream Channels - konfiguracja streamów z kanałami komunikacji');
    console.log('✅ Task Relationships - zaawansowane relacje między zadaniami'); 
    console.log('✅ User Relations - hierarchia organizacyjna i relacje zarządzania');
    console.log('🚀 System management jest teraz w pełni funkcjonalny!');

  } catch (error) {
    console.error('❌ Błąd seedowania management tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - WYPEŁNIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie seedowania management tables
seedManagementTables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd seedowania management tables:', error);
    process.exit(1);
  });