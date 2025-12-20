const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave10() {
  console.log('🌊 WAVE 10 - ostatni sprint do 65%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    const project = await prisma.project.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 62/97 (63.9%)');
    console.log('🎯 Cel: 65% (63 tabele) = +1-3 tabele \\n');

    // 1. CriticalPath - ścieżka krytyczna
    console.log('🛤️ CriticalPath...');
    try {
      if (project) {
        await prisma.criticalPath.create({
          data: {
            projectId: project.id,
            totalDuration: '14d'
          }
        });
        console.log('✅ criticalPath: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  criticalPath: brak project');
      }
    } catch (error) {
      console.log(`⚠️  criticalPath: ${error.message.substring(0, 80)}...`);
    }

    // 2. Dependency - zależność ogólna
    console.log('\\n⛓️ Dependency...');
    try {
      if (task) {
        await prisma.dependency.create({
          data: {
            type: 'FINISH_TO_START',
            fromEntityType: 'task',
            fromEntityId: task.id,
            toEntityType: 'task',
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

    // 3. ProjectDependency - zależność projektów
    console.log('\\n🔗 ProjectDependency...');
    try {
      if (project) {
        await prisma.projectDependency.create({
          data: {
            type: 'FINISH_TO_START',
            sourceProjectId: project.id,
            targetProjectId: project.id
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

    // 4. Spróbuję bardzo prosty model - dodatkowy Tag
    console.log('\\n🏷️ Tag #3...');
    try {
      await prisma.tag.create({
        data: {
          name: 'high-priority',
          color: '#ff4444',
          organizationId: organization.id
        }
      });
      console.log('✅ tag #3: 1 rekord (dodatkowy)');
      // Nie liczę jako nową tabelę
    } catch (error) {
      console.log(`⚠️  tag #3: ${error.message.substring(0, 80)}...`);
    }

    // 5. Spróbuję jeszcze jeden dokument
    console.log('\\n📄 Document #3...');
    try {
      const folder = await prisma.folder.findFirst();
      await prisma.document.create({
        data: {
          title: 'System Architecture Guide',
          content: 'Complete guide to the CRM-GTD Smart system architecture',
          folderId: folder?.id,
          createdById: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ document #3: 1 rekord (dodatkowy)');
      // Nie liczę jako nową tabelę
    } catch (error) {
      console.log(`⚠️  document #3: ${error.message.substring(0, 80)}...`);
    }

    // 6. Spróbuję jeszcze AIExecution (może bez skomplikowanych pól)
    console.log('\\n🤖 AIExecution...');
    try {
      await prisma.aIExecution.create({
        data: {
          status: 'SUCCESS',
          duration: 180,
          organizationId: organization.id
        }
      });
      console.log('✅ aIExecution: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIExecution: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 10 FINALNA: +${successCount} nowych tabel!`);
    
    const newTotal = 62 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 65) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 65%! FANTASTYCZNY KAMIEŃ MILOWY! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 63) {
      console.log('🌟 Bardzo blisko 65%! Doskonały postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave10();