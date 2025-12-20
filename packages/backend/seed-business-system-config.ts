import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBusinessAndSystemTables() {
  console.log('🏢 WYPEŁNIANIE Business & Management + System Configuration (7 tabel)\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const projects = await prisma.project.findMany({ take: 3 });
    const documents = await prisma.document.findMany({ take: 2 });
    const streams = await prisma.stream.findMany({ take: 2 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // === BUSINESS & MANAGEMENT (4 tabele) ===

    // 1. COMPLAINTS - zgodnie z schema
    await seedIfEmpty('complaints', async () => {
      const complaintData: Prisma.ComplaintCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'System Performance Issues',
          description: 'The dashboard loads very slowly during peak hours, affecting productivity',
          customer: 'Tech Solutions Sp. z o.o.',
          product: 'CRM-GTD Smart Enterprise',
          status: 'NEW',
          priority: 'HIGH'
        },
        {
          organizationId: organization.id,
          title: 'Missing Email Notifications',
          description: 'Users report not receiving email notifications for task assignments',
          customer: 'Digital Marketing Group',
          product: 'CRM-GTD Smart Pro',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM'
        },
        {
          organizationId: organization.id,
          title: 'Data Export Feature Request',
          description: 'Need ability to export all CRM data to Excel format for external reporting',
          customer: 'Innovative Systems Ltd',
          product: 'CRM-GTD Smart Basic',
          status: 'NEW',
          priority: 'LOW'
        }
      ];
      await prisma.complaint.createMany({ data: complaintData });
    });

    // 2. INFO - zgodnie z schema
    await seedIfEmpty('info', async () => {
      const infoData: Prisma.InfoCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'System Maintenance Notice',
          content: 'Scheduled maintenance window on Sunday 2:00-4:00 AM UTC for database optimization',
          topic: 'maintenance',
          importance: 'HIGH'
        },
        {
          organizationId: organization.id,
          title: 'New Feature Release - Voice TTS',
          content: 'Voice TTS functionality is now available in Smart Mailboxes. Click the speaker icon to hear messages read aloud.',
          topic: 'feature',
          importance: 'MEDIUM'
        },
        {
          organizationId: organization.id,
          title: 'Holiday Schedule Update',
          content: 'Support hours will be reduced during December 24-26. Emergency contact available via phone.',
          topic: 'schedule',
          importance: 'MEDIUM'
        }
      ];
      await prisma.info.createMany({ data: infoData });
    });

    // 3. NEXT_ACTIONS - zgodnie z schema
    await seedIfEmpty('next_actions', async () => {
      const nextActionData: Prisma.NextActionCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Review Q4 budget proposals',
          description: 'Analyze and approve budget proposals for Q4 initiatives and resource allocation',
          context: '@office',
          priority: 'HIGH',
          energy: 'HIGH',
          estimatedTime: '120min',
          status: 'NEW',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assignedToId: users[0].id,
          createdById: users[0].id
        },
        {
          organizationId: organization.id,
          title: 'Call vendor about delivery delay',
          description: 'Follow up on delayed equipment delivery with supplier - confirm new delivery date',
          context: '@calls',
          priority: 'MEDIUM',
          energy: 'LOW',
          estimatedTime: '15min',
          status: 'NEW',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          assignedToId: users[1]?.id || users[0].id,
          createdById: users[0].id,
          contactId: null,
          companyId: null
        },
        {
          organizationId: organization.id,
          title: 'Update project documentation',
          description: 'Refresh API documentation with latest endpoints and examples',
          context: '@computer',
          priority: 'MEDIUM',
          energy: 'MEDIUM',
          estimatedTime: '90min',
          status: 'NEW',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          assignedToId: users[2]?.id || users[0].id,
          createdById: users[0].id,
          projectId: projects[0]?.id
        }
      ];
      await prisma.nextAction.createMany({ data: nextActionData });
    });

    // 4. UNIMPORTANT - zgodnie z schema (bardzo prosta struktura)
    await seedIfEmpty('unimportant', async () => {
      const unimportantData: Prisma.UnimportantCreateManyInput[] = [
        {
          organizationId: organization.id,
          content: 'Office supply inventory check - monthly review of supplies and restocking needs',
          type: 'administrative',
          source: 'manual'
        },
        {
          organizationId: organization.id,
          content: 'Update company LinkedIn profile with recent achievements and team photos',
          type: 'marketing',
          source: 'manual'
        },
        {
          organizationId: organization.id,
          content: 'Research new productivity tools for team evaluation - low priority investigation',
          type: 'research',
          source: 'suggestion'
        }
      ];
      await prisma.unimportant.createMany({ data: unimportantData });
    });

    // === SYSTEM CONFIGURATION (3 tabele) ===

    // 5. CRITICAL_PATH - zgodnie z schema (bardzo prosta struktura)
    if (projects.length > 0) {
      await seedIfEmpty('critical_path', async () => {
        const tasks = await prisma.task.findMany({ 
          where: { projectId: projects[0].id },
          take: 3
        });
        
        const criticalPathData: Prisma.CriticalPathCreateManyInput[] = [
          {
            tasks: tasks.map(t => t.id),
            totalDuration: '45d',
            earliestCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            slack: '2d',
            projectId: projects[0].id
          }
        ];
        
        if (projects[1]) {
          const tasks2 = await prisma.task.findMany({ 
            where: { projectId: projects[1].id },
            take: 2
          });
          
          criticalPathData.push({
            tasks: tasks2.map(t => t.id),
            totalDuration: '30d',
            earliestCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            slack: '0d',
            projectId: projects[1].id
          });
        }
        
        await prisma.criticalPath.createMany({ data: criticalPathData });
      });
    }

    // 6. DOCUMENT_SHARES - zgodnie z schema
    if (documents.length > 0 && users.length >= 2) {
      await seedIfEmpty('document_shares', async () => {
        const documentShareData: Prisma.DocumentShareCreateManyInput[] = [
          {
            documentId: documents[0].id,
            sharedWithId: users[1].id,
            sharedById: users[0].id,
            permission: 'READ',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          {
            documentId: documents[1]?.id || documents[0].id,
            sharedWithId: users[2]?.id || users[1].id,
            sharedById: users[0].id,
            permission: 'EDIT',
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          }
        ];
        
        if (users.length >= 4) {
          documentShareData.push({
            documentId: documents[0].id,
            sharedWithId: users[3].id,
            sharedById: users[0].id,
            permission: 'COMMENT',
            expiresAt: null // Bez wygaśnięcia
          });
        }
        
        await prisma.documentShare.createMany({ data: documentShareData });
      });
    }

    // 7. STREAM_PERMISSIONS - zgodnie z schema
    if (streams.length > 0 && users.length >= 2) {
      await seedIfEmpty('stream_permissions', async () => {
        const streamPermissionData: Prisma.StreamPermissionCreateManyInput[] = [
          {
            streamId: streams[0].id,
            userId: users[0].id,
            accessLevel: 'ADMIN',
            dataScope: ['TASKS', 'PROJECTS', 'DOCUMENTS'],
            conditions: { fullAccess: true },
            expiresAt: null
          },
          {
            streamId: streams[0].id,
            userId: users[1].id,
            accessLevel: 'EDITOR',
            dataScope: ['TASKS', 'PROJECTS'],
            conditions: { limitedEdit: true },
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          }
        ];
        
        if (streams[1]) {
          streamPermissionData.push({
            streamId: streams[1].id,
            userId: users[2]?.id || users[1].id,
            accessLevel: 'VIEWER',
            dataScope: ['TASKS'],
            conditions: { readOnly: true },
            expiresAt: null
          });
        }
        
        await prisma.streamPermission.createMany({ data: streamPermissionData });
      });
    }

    console.log('\n🎉 SUKCES! Wypełniono wszystkie 7 kluczowych tabel!');
    console.log('✅ Business & Management: complaints, info, next_actions, unimportant');
    console.log('✅ System Configuration: critical_path, document_shares, stream_permissions');
    console.log('🎯 Postęp w kierunku wyższego wypełnienia bazy danych!');

  } catch (error) {
    console.error('❌ Błąd wypełniania 7 tabel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Wypełnianie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - WYPEŁNIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie wypełniania 7 kluczowych tabel
seedBusinessAndSystemTables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd wypełniania 7 tabel:', error);
    process.exit(1);
  });