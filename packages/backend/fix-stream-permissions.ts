import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStreamPermissions() {
  console.log('🔧 NAPRAWA stream_permissions - dodanie grantedById\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const streams = await prisma.stream.findMany({ take: 2 });
    
    if (!organization || users.length === 0 || streams.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}`);
    console.log(`✅ Streams: ${streams.length}\n`);

    // STREAM_PERMISSIONS - z wymaganym grantedById
    await seedIfEmpty('stream_permissions', async () => {
      const streamPermissionData: Prisma.StreamPermissionCreateManyInput[] = [
        {
          streamId: streams[0].id,
          userId: users[0].id,
          accessLevel: 'ADMIN',
          dataScope: ['TASKS', 'PROJECTS', 'DOCUMENTS'],
          conditions: { fullAccess: true },
          expiresAt: null,
          grantedById: users[0].id,
          organizationId: organization.id
        },
        {
          streamId: streams[0].id,
          userId: users[1].id,
          accessLevel: 'EDITOR',
          dataScope: ['TASKS', 'PROJECTS'],
          conditions: { limitedEdit: true },
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          grantedById: users[0].id,
          organizationId: organization.id
        }
      ];
      
      if (streams[1]) {
        streamPermissionData.push({
          streamId: streams[1].id,
          userId: users[2]?.id || users[1].id,
          accessLevel: 'VIEWER',
          dataScope: ['TASKS'],
          conditions: { readOnly: true },
          expiresAt: null,
          grantedById: users[0].id,
          organizationId: organization.id
        });
      }
      
      await prisma.streamPermission.createMany({ data: streamPermissionData });
    });

    console.log('\n🎉 SUKCES! stream_permissions zostały naprawione!');
    console.log('✅ Wszystkie 7 kluczowych tabel Business & System są wypełnione!');

  } catch (error) {
    console.error('❌ Błąd naprawy stream_permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Naprawianie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - NAPRAWIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie naprawy stream_permissions
fixStreamPermissions()
  .catch((error) => {
    console.error('💥 Krytyczny błąd naprawy stream_permissions:', error);
    process.exit(1);
  });