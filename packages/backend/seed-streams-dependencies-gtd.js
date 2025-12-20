const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Enum values
const AccessLevel = {
  READ: 'READ',
  WRITE: 'WRITE',
  ADMIN: 'ADMIN'
};

const DataScope = {
  ALL: 'ALL',
  OWN: 'OWN',
  TEAM: 'TEAM',
  DEPARTMENT: 'DEPARTMENT'
};

const StreamRelationType = {
  PARENT_CHILD: 'PARENT_CHILD',
  SIBLING: 'SIBLING',
  RELATED: 'RELATED'
};

const DependencyType = {
  FINISH_TO_START: 'FINISH_TO_START',
  START_TO_START: 'START_TO_START',
  FINISH_TO_FINISH: 'FINISH_TO_FINISH',
  START_TO_FINISH: 'START_TO_FINISH'
};

const UserRelationType = {
  MANAGES: 'MANAGES',
  LEADS: 'LEADS',
  MENTORS: 'MENTORS',
  SUPERVISES: 'SUPERVISES',
  COLLABORATES: 'COLLABORATES'
};

const UserInheritanceRule = {
  INHERIT_DOWN: 'INHERIT_DOWN',
  INHERIT_UP: 'INHERIT_UP',
  NO_INHERITANCE: 'NO_INHERITANCE'
};

const ImprovementStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS', 
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

async function seedSelectedTables() {
  console.log('🚀 Rozpoczynam wypełnianie wybranych tabel...');
  console.log('📋 Tabele: Streams, Dependencies, GTD/SMART');
  
  try {
    // Pobierz dane potrzebne do relacji
    const organizations = await prisma.organization.findMany();
    const users = await prisma.user.findMany();
    const streams = await prisma.stream.findMany();
    const tasks = await prisma.task.findMany();
    const projects = await prisma.project.findMany();
    const channels = await prisma.communicationChannel.findMany();
    
    console.log(`📊 Dostępne dane: ${organizations.length} org, ${users.length} users, ${streams.length} streams`);
    
    if (organizations.length === 0) {
      throw new Error('Brak organizacji w bazie - wymagane do wypełnienia tabel');
    }

    const orgId = organizations[0].id;
    const userId = users[0]?.id;
    let created = 0;

    // 1. STREAMS - StreamChannel
    console.log('🌊 1. Tworzę StreamChannel...');
    try {
      if (streams.length > 0 && channels.length > 0) {
        const existingCount = await prisma.streamChannel.count();
        if (existingCount === 0) {
          const streamChannels = [
            {
              streamId: streams[0].id,
              channelId: channels[0].id,
              autoCreateTasks: true,
              defaultContext: '@email',
              defaultPriority: Priority.MEDIUM
            }
          ];
          
          for (const data of streamChannels) {
            await prisma.streamChannel.create({ data });
            created++;
          }
          console.log(`✅ StreamChannel: ${streamChannels.length} rekordy`);
        } else {
          console.log(`⚠️ StreamChannel: Już istnieje ${existingCount} rekordów`);
        }
      } else {
        console.log('⚠️ StreamChannel: Brak wymaganych danych (streams/channels)');
      }
    } catch (e) {
      console.log(`❌ StreamChannel error: ${e.message}`);
    }

    // 2. STREAMS - StreamRelation
    console.log('🔗 2. Tworzę StreamRelation...');
    try {
      // Najpierw utwórz dodatkowy stream jeśli potrzeba
      let stream2Id = null;
      if (streams.length < 2) {
        console.log('🔨 Tworzę dodatkowy stream dla relacji...');
        const newStream = await prisma.stream.create({
          data: {
            name: 'Secondary Stream',
            description: 'Dodatkowy stream do testowania relacji',
            organization: { connect: { id: orgId } },
            owner: { connect: { id: userId } }
          }
        });
        stream2Id = newStream.id;
      } else {
        stream2Id = streams[1].id;
      }

      const streamRelations = [
        {
          parent: { connect: { id: streams[0].id } },
          child: { connect: { id: stream2Id } },
          relationType: StreamRelationType.PARENT_CHILD,
          description: 'Master-Secondary stream hierarchy',
          isActive: true
        },
        {
          parent: { connect: { id: streams[0].id } },
          child: { connect: { id: streams[0].id } }, // Self-relation
          relationType: StreamRelationType.RELATED,
          description: 'Self-reference for circular dependencies',
          isActive: true
        }
      ];
      
      for (const data of streamRelations) {
        await prisma.streamRelation.create({ data });
        created++;
      }
      console.log('✅ StreamRelation: 2 rekordy');
    } catch (e) {
      console.log(`❌ StreamRelation error: ${e.message}`);
    }

    // 3. STREAMS - StreamPermission
    console.log('🔐 3. Tworzę StreamPermission...');
    try {
      if (streams.length > 0 && users.length > 0) {
        const streamPermissions = [
          {
            stream: { connect: { id: streams[0].id } },
            user: { connect: { id: users[0].id } },
            grantedBy: { connect: { id: users[0].id } },
            accessLevel: AccessLevel.ADMIN,
            dataScope: [DataScope.ALL],
            conditions: JSON.stringify({ role: 'owner', departments: ['IT', 'Management'] })
          },
          {
            stream: { connect: { id: streams[0].id } },
            user: { connect: { id: users[1]?.id || users[0].id } },
            grantedBy: { connect: { id: users[0].id } },
            accessLevel: AccessLevel.WRITE,
            dataScope: [DataScope.TEAM, DataScope.OWN],
            conditions: JSON.stringify({ role: 'member', can_edit_own: true }),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Rok
          }
        ];
        
        for (const data of streamPermissions) {
          await prisma.streamPermission.create({ data });
          created++;
        }
        console.log('✅ StreamPermission: 3 rekordy');
      }
    } catch (e) {
      console.log(`❌ StreamPermission error: ${e.message}`);
    }

    // 4. STREAMS - StreamAccessLog
    console.log('📊 4. Tworzę StreamAccessLog...');
    try {
      if (streams.length > 0 && users.length > 0) {
        const streamAccessLogs = [
          {
            stream: { connect: { id: streams[0].id } },
            user: { connect: { id: users[0].id } },
            organization: { connect: { id: orgId } },
            action: 'VIEW',
            accessType: 'DIRECT',
            success: true,
            accessLevel: AccessLevel.ADMIN,
            dataScope: [DataScope.ALL],
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h temu
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          {
            stream: { connect: { id: streams[0].id } },
            user: { connect: { id: users[1]?.id || users[0].id } },
            organization: { connect: { id: orgId } },
            action: 'EDIT',
            accessType: 'INHERITED',
            success: true,
            accessLevel: AccessLevel.WRITE,
            dataScope: [DataScope.TEAM],
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h temu
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        ];
        
        for (const data of streamAccessLogs) {
          await prisma.streamAccessLog.create({ data });
          created++;
        }
        console.log('✅ StreamAccessLog: 3 rekordy');
      }
    } catch (e) {
      console.log(`❌ StreamAccessLog error: ${e.message}`);
    }

    // 5. DEPENDENCIES - Dependency
    console.log('🔗 5. Tworzę Dependency...');
    try {
      if (tasks.length >= 2) {
        const dependencies = [
          {
            type: DependencyType.FINISH_TO_START,
            isCriticalPath: true,
            sourceId: tasks[0].id,
            sourceType: 'task',
            targetId: tasks[1]?.id || tasks[0].id,
            targetType: 'task'
          },
          {
            type: DependencyType.START_TO_START,
            isCriticalPath: false,
            sourceId: tasks[0].id,
            sourceType: 'task',
            targetId: tasks[2]?.id || tasks[0].id,
            targetType: 'task'
          }
        ];
        
        for (const data of dependencies) {
          await prisma.dependency.create({ data });
          created++;
        }
        console.log('✅ Dependency: 2 rekordy');
      }
    } catch (e) {
      console.log(`❌ Dependency error: ${e.message}`);
    }

    // 6. DEPENDENCIES - ProjectDependency
    console.log('📋 6. Tworzę ProjectDependency...');
    try {
      if (projects.length >= 1) {
        const projectDependencies = [
          {
            type: DependencyType.FINISH_TO_START,
            isCriticalPath: true,
            sourceProjectId: projects[0].id,
            dependentProjectId: projects[0].id // Self-dependency for demo
          }
        ];
        
        for (const data of projectDependencies) {
          await prisma.projectDependency.create({ data });
          created++;
        }
        console.log('✅ ProjectDependency: 1 rekord');
      }
    } catch (e) {
      console.log(`❌ ProjectDependency error: ${e.message}`);
    }

    // 7. DEPENDENCIES - UserRelation
    console.log('👥 7. Tworzę UserRelation...');
    try {
      if (users.length >= 2) {
        const userRelations = [
          {
            manager: { connect: { id: users[0].id } },
            employee: { connect: { id: users[1].id } },
            createdBy: { connect: { id: users[0].id } },
            relationType: UserRelationType.MANAGES,
            description: 'Manager-Employee relationship - direct supervision',
            isActive: true,
            inheritanceRule: UserInheritanceRule.INHERIT_DOWN,
            canDelegate: true,
            canApprove: true
          },
          {
            manager: { connect: { id: users[0].id } },
            employee: { connect: { id: users[2]?.id || users[1].id } },
            createdBy: { connect: { id: users[0].id } },
            relationType: UserRelationType.LEADS,
            description: 'Team Lead relationship - project leadership',
            isActive: true,
            inheritanceRule: UserInheritanceRule.INHERIT_DOWN,
            canDelegate: true,
            canApprove: false,
            startsAt: new Date(),
            endsAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 miesięcy
          }
        ];
        
        for (const data of userRelations) {
          await prisma.userRelation.create({ data });
          created++;
        }
        console.log('✅ UserRelation: 3 rekordy');
      }
    } catch (e) {
      console.log(`❌ UserRelation error: ${e.message}`);
    }

    // 8. GTD - GTDBucket
    console.log('📥 8. Tworzę GTDBucket...');
    try {
      const existingCount = await prisma.gTDBucket.count();
      if (existingCount === 0) {
        const gtdBuckets = [
          {
            name: 'Natychmiastowe',
            description: 'Zadania do wykonania natychmiast (< 2 minuty)',
            viewOrder: 1,
            organizationId: orgId
          },
          {
            name: 'Zaplanowane',
            description: 'Zadania zaplanowane na konkretny termin',
            viewOrder: 2,
            organizationId: orgId
          },
          {
            name: 'Delegowane',
            description: 'Zadania delegowane do innych osób',
            viewOrder: 3,
            organizationId: orgId
          },
          {
            name: 'Może kiedyś',
            description: 'Pomysły i zadania na przyszłość',
            viewOrder: 4,
            organizationId: orgId
          }
        ];
        
        for (const data of gtdBuckets) {
          await prisma.gTDBucket.create({ data });
          created++;
        }
        console.log('✅ GTDBucket: 4 rekordy');
      } else {
        console.log(`⚠️ GTDBucket: Już istnieje ${existingCount} rekordów`);
      }
    } catch (e) {
      console.log(`❌ GTDBucket error: ${e.message}`);
    }

    // 9. SMART - SMARTAnalysisDetail
    console.log('📊 9. Tworzę SMARTAnalysisDetail...');
    try {
      if (tasks.length > 0) {
        const smartAnalysisDetails = [
          {
            specificScore: 8,
            specificNotes: 'Zadanie jasno określone z konkretnymi rezultatami',
            measurableScore: 9,
            measurableCriteria: 'Sukces mierzony liczbą wypełnionych tabel (min. 7/10)',
            achievableScore: 7,
            achievableResources: 'Dostępne są Prisma schema, przykłady danych, dokumentacja',
            relevantScore: 10,
            relevantAlignment: 'Kluczowe dla ukończenia systemu bazy danych',
            timeBoundScore: 8,
            timeEstimationAccuracy: 'Oszacowanie: 2-3 godziny, realistyczne',
            taskId: tasks[0].id
          },
          {
            specificScore: 6,
            specificNotes: 'Ogólne zadanie, wymaga doprecyzowania scope',
            measurableScore: 5,
            measurableCriteria: 'Brak jasnych kryteriów sukcesu',
            achievableScore: 8,
            achievableResources: 'Zespół programistów, dostęp do systemu',
            relevantScore: 9,
            relevantAlignment: 'Ważne dla rozwoju aplikacji',
            timeBoundScore: 4,
            timeEstimationAccuracy: 'Brak deadline, trudne oszacowanie',
            taskId: tasks[1]?.id || tasks[0].id
          }
        ];
        
        for (const data of smartAnalysisDetails) {
          await prisma.sMARTAnalysisDetail.create({ data });
          created++;
        }
        console.log('✅ SMARTAnalysisDetail: 2 rekordy');
      }
    } catch (e) {
      console.log(`❌ SMARTAnalysisDetail error: ${e.message}`);
    }

    // 10. SMART - SMARTImprovement
    console.log('💡 10. Tworzę SMARTImprovement...');
    try {
      if (tasks.length > 0) {
        const smartImprovements = [
          {
            smartDimension: 'Specific',
            currentState: 'Zadanie zbyt ogólne: "Napraw błędy w systemie"',
            suggestedImprovement: 'Zmień na: "Napraw błąd filtrowania dat w Smart Mailboxes (issues #42, #45)"',
            status: ImprovementStatus.OPEN,
            taskId: tasks[0].id
          },
          {
            smartDimension: 'Measurable',
            currentState: 'Brak kryteriów sukcesu dla zadania optymalizacji',
            suggestedImprovement: 'Dodaj metryki: "Zmniejsz czas ładowania o 30%, zwiększ responsywność do <100ms"',
            status: ImprovementStatus.IN_PROGRESS,
            taskId: tasks[1]?.id || tasks[0].id
          },
          {
            smartDimension: 'Time-bound',
            currentState: 'Zadanie bez deadline',
            suggestedImprovement: 'Ustaw deadline: "Do ukończenia do 15 lipca 2025"',
            status: ImprovementStatus.COMPLETED,
            projectId: projects[0]?.id
          }
        ];
        
        for (const data of smartImprovements) {
          await prisma.sMARTImprovement.create({ data });
          created++;
        }
        console.log('✅ SMARTImprovement: 3 rekordy');
      }
    } catch (e) {
      console.log(`❌ SMARTImprovement error: ${e.message}`);
    }

    console.log(`\n🎉 SUKCES! Utworzono łącznie ${created} nowych rekordów`);
    console.log('📊 Sprawdzam aktualny stan wybranych tabel...');
    
    // Sprawdź stan po wypełnieniu
    await checkTablesStatus();

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTablesStatus() {
  try {
    const tables = [
      'streamChannel', 'streamRelation', 'streamPermission', 'streamAccessLog',
      'dependency', 'projectDependency', 'userRelation',
      'gTDBucket', 'sMARTAnalysisDetail', 'sMARTImprovement'
    ];
    
    console.log('\n=== STAN WYBRANYCH TABEL PO WYPEŁNIENIU ===');
    let totalFilled = 0;
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        const status = count > 0 ? '✅' : '🔴';
        console.log(`${status} ${table.padEnd(25)} ${count} rekordów`);
        if (count > 0) totalFilled++;
        totalRecords += count;
      } catch (e) {
        console.log(`❌ ${table.padEnd(25)} ERROR`);
      }
    }
    
    console.log(`\n📊 WYBRANE TABELE: ${totalFilled}/${tables.length} wypełnione (${(totalFilled/tables.length*100).toFixed(1)}%)`);
    console.log(`📋 Łączne nowe rekordy: ${totalRecords}`);
    
  } catch (error) {
    console.error('Błąd sprawdzania stanu:', error);
  }
}

// Uruchom skrypt
if (require.main === module) {
  seedSelectedTables()
    .catch((error) => {
      console.error('❌ FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = { seedSelectedTables };