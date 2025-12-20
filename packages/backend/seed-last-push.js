const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLastPush() {
  console.log('🚀 LAST PUSH - finalne modele do 50%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    const project = await prisma.project.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 47/97 (48.5%)');
    console.log('🎯 Cel: osiągnąć 50% = +3 tabele \\n');

    // 1. ProjectDependency - zależność projektów
    console.log('🔗 ProjectDependency...');
    try {
      if (project) {
        await prisma.projectDependency.create({
          data: {
            type: 'FINISH_TO_START',
            fromProjectId: project.id,
            toProjectId: project.id
          }
        });
        console.log('✅ projectDependency: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  projectDependency: brak project');
      }
    } catch (error) {
      console.log(`⚠️  projectDependency: ${error.message.substring(0, 80)}...`);
    }

    // 2. Dependency - ogólne zależności
    console.log('\\n⛓️ Dependency...');
    try {
      if (task) {
        await prisma.dependency.create({
          data: {
            type: 'BLOCKING',
            fromEntityType: 'TASK',
            fromEntityId: task.id,
            toEntityType: 'TASK', 
            toEntityId: task.id
          }
        });
        console.log('✅ dependency: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  dependency: brak task');
      }
    } catch (error) {
      console.log(`⚠️  dependency: ${error.message.substring(0, 80)}...`);
    }

    // 3. Spróbuję jeszcze jeden model który istnieje na pewno
    console.log('\\n⚙️ Sprawdzenie innych modeli...');
    
    // Sprawdzę czy DocumentLink istnieje i spróbuję bez organizationId
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentLink.create({
          data: {
            url: 'https://example.com/related',
            title: 'Related Resource',
            documentId: document.id
          }
        });
        console.log('✅ documentLink: 1 rekord');
        successCount++;
      }
    } catch (error) {
      console.log(`⚠️  documentLink: ${error.message.substring(0, 80)}...`);
    }

    // 4. StreamRelation - relacja między streamami
    console.log('\\n🌊 StreamRelation...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamRelation.create({
          data: {
            type: 'PARENT_CHILD',
            fromStreamId: stream.id,
            toStreamId: stream.id
          }
        });
        console.log('✅ streamRelation: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamRelation: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamRelation: ${error.message.substring(0, 80)}...`);
    }

    // 5. StreamPermission - uprawnienia streamów
    console.log('\\n🔐 StreamPermission...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamPermission.create({
          data: {
            permission: 'READ',
            streamId: stream.id,
            userId: user.id
          }
        });
        console.log('✅ streamPermission: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamPermission: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamPermission: ${error.message.substring(0, 80)}...`);
    }

    // 6. StreamAccessLog - log dostępu do streamów
    console.log('\\n📊 StreamAccessLog...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamAccessLog.create({
          data: {
            action: 'VIEW',
            streamId: stream.id,
            userId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ streamAccessLog: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamAccessLog: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamAccessLog: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 LAST PUSH: +${successCount} nowych tabel!`);
    
    const newTotal = 47 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 50%! PÓŁMETEK! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 60% (58 tabel)!');
    }
    if (newTotal >= 52) {
      console.log('🌟 Przekroczyliśmy 50%! Świetny postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLastPush();