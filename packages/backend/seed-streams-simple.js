const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRemainingSimple() {
  console.log('🚀 Wypełniam pozostałe 4 tabele...');
  
  try {
    const organizations = await prisma.organization.findMany();
    const users = await prisma.user.findMany();
    const streams = await prisma.stream.findMany();
    
    const orgId = organizations[0].id;
    const userId = users[0].id;
    let created = 0;

    // 1. StreamRelation - najprostszy wariant
    console.log('🔗 1. Tworzę StreamRelation...');
    try {
      const existingCount = await prisma.streamRelation.count();
      if (existingCount === 0) {
        // Tworzymy self-relation
        await prisma.streamRelation.create({
          data: {
            parentId: streams[0].id,
            childId: streams[0].id,
            relationType: 'RELATED',
            description: 'Self-reference test relation',
            isActive: true
          }
        });
        created++;
        console.log('✅ StreamRelation: 1 rekord');
      } else {
        console.log(`⚠️ StreamRelation: Już istnieje ${existingCount} rekordów`);
      }
    } catch (e) {
      console.log(`❌ StreamRelation error: ${e.message}`);
    }

    // 2. StreamPermission - podstawowy
    console.log('🔐 2. Tworzę StreamPermission...');
    try {
      const existingCount = await prisma.streamPermission.count();
      if (existingCount === 0) {
        await prisma.streamPermission.create({
          data: {
            streamId: streams[0].id,
            userId: users[0].id,
            grantedById: users[0].id,
            organizationId: orgId,
            accessLevel: 'ADMIN',
            dataScope: ['ALL'],
            conditions: JSON.stringify({ role: 'owner' })
          }
        });
        created++;
        console.log('✅ StreamPermission: 1 rekord');
      } else {
        console.log(`⚠️ StreamPermission: Już istnieje ${existingCount} rekordów`);
      }
    } catch (e) {
      console.log(`❌ StreamPermission error: ${e.message}`);
    }

    // 3. StreamAccessLog - podstawowy
    console.log('📊 3. Tworzę StreamAccessLog...');
    try {
      const existingCount = await prisma.streamAccessLog.count();
      if (existingCount === 0) {
        await prisma.streamAccessLog.create({
          data: {
            streamId: streams[0].id,
            userId: users[0].id,
            organizationId: orgId,
            action: 'VIEW',
            accessType: 'DIRECT',
            success: true,
            timestamp: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
          }
        });
        created++;
        console.log('✅ StreamAccessLog: 1 rekord');
      } else {
        console.log(`⚠️ StreamAccessLog: Już istnieje ${existingCount} rekordów`);
      }
    } catch (e) {
      console.log(`❌ StreamAccessLog error: ${e.message}`);
    }

    // 4. UserRelation - podstawowy
    console.log('👥 4. Tworzę UserRelation...');
    try {
      const existingCount = await prisma.userRelation.count();
      if (existingCount === 0 && users.length >= 2) {
        await prisma.userRelation.create({
          data: {
            managerId: users[0].id,
            employeeId: users[1].id,
            organizationId: orgId,
            createdById: users[0].id,
            relationType: 'MANAGES',
            description: 'Manager-Employee test relation',
            isActive: true,
            inheritanceRule: 'INHERIT_DOWN',
            canDelegate: true,
            canApprove: true
          }
        });
        created++;
        console.log('✅ UserRelation: 1 rekord');
      } else {
        console.log(`⚠️ UserRelation: Już istnieje lub brak wystarczających użytkowników`);
      }
    } catch (e) {
      console.log(`❌ UserRelation error: ${e.message}`);
    }

    console.log(`\n🎉 Utworzono ${created} nowych rekordów`);
    
    // Final check
    await finalCheck();

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function finalCheck() {
  const tables = [
    'streamChannel', 'streamRelation', 'streamPermission', 'streamAccessLog',
    'dependency', 'projectDependency', 'userRelation',
    'gTDBucket', 'sMARTAnalysisDetail', 'sMARTImprovement'
  ];
  
  console.log('\n=== FINALNY STAN WYBRANYCH TABEL ===');
  let totalFilled = 0;
  
  for (const table of tables) {
    try {
      const count = await prisma[table].count();
      const status = count > 0 ? '✅' : '🔴';
      console.log(`${status} ${table.padEnd(25)} ${count} rekordów`);
      if (count > 0) totalFilled++;
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)} ERROR`);
    }
  }
  
  console.log(`\n📊 WYBRANE TABELE: ${totalFilled}/${tables.length} wypełnione (${(totalFilled/tables.length*100).toFixed(1)}%)`);
}

// Uruchom
seedRemainingSimple();