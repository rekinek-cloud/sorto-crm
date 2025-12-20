const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCorrectSchema() {
  console.log('✅ CORRECT SCHEMA - używam prawdziwych definicji...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 42/97 (43.3%)');
    console.log('🎯 Focus: dokładne schema z prisma/schema.prisma n');

    // 1. Smart - bez organizationId i score
    console.log('🎯 Smart...');
    try {
      await prisma.smart.create({
        data: {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: false,
          taskId: task?.id
        }
      });
      console.log('✅ smart: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smart: ${error.message.substring(0, 80)}...`);
    }

    // 2. Completeness - bez score i organizationId
    console.log('\n✅ Completeness...');
    try {
      await prisma.completeness.create({
        data: {
          isComplete: false,
          missingInfo: 'Need more detailed requirements',
          clarity: 'Partially clear',
          taskId: task?.id
        }
      });
      console.log('✅ completeness: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  completeness: ${error.message.substring(0, 80)}...`);
    }

    // 3. CriticalPath - sprawdzę definicję w schema
    console.log('\n🛤️ CriticalPath...');
    try {
      if (task) {
        await prisma.criticalPath.create({
          data: {
            duration: 5,
            taskId: task.id
          }
        });
        console.log('✅ criticalPath: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  criticalPath: brak task');
      }
    } catch (error) {
      console.log(`⚠️  criticalPath: ${error.message.substring(0, 80)}...`);
    }

    // 4. SMARTTemplate - sprawdzę czy jest prosty
    console.log('\n🎯 SMARTTemplate...');
    try {
      await prisma.sMARTTemplate.create({
        data: {
          name: 'Basic Project Template',
          description: 'Template for SMART goal setting',
          organizationId: organization.id
        }
      });
      console.log('✅ sMARTTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  sMARTTemplate: ${error.message.substring(0, 80)}...`);
    }

    // 5. TaskHistory - sprawdzę prawdziwe pola
    console.log('\n📈 TaskHistory...');
    try {
      if (task) {
        await prisma.taskHistory.create({
          data: {
            fieldName: 'status',
            oldValue: 'PENDING',
            newValue: 'IN_PROGRESS',
            changedBy: user.id,
            taskId: task.id
          }
        });
        console.log('✅ taskHistory: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  taskHistory: brak task');
      }
    } catch (error) {
      console.log(`⚠️  taskHistory: ${error.message.substring(0, 80)}...`);
    }

    // 6. DocumentComment - sprawdzę definicję
    console.log('\n💬 DocumentComment...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentComment.create({
          data: {
            content: 'Very helpful document!',
            documentId: document.id,
            authorId: user.id
          }
        });
        console.log('✅ documentComment: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentComment: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentComment: ${error.message.substring(0, 80)}...`);
    }

    // 7. DocumentLink - sprawdzę definicję
    console.log('\n🔗 DocumentLink...');
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
      } else {
        console.log('⚠️  documentLink: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentLink: ${error.message.substring(0, 80)}...`);
    }

    // 8. DocumentShare - sprawdzę definicję
    console.log('\n👥 DocumentShare...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentShare.create({
          data: {
            permission: 'READ',
            documentId: document.id,
            sharedWithId: user.id,
            sharedById: user.id
          }
        });
        console.log('✅ documentShare: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentShare: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentShare: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 CORRECT SCHEMA: +${successCount} nowych tabel!`);
    
    const newTotal = 42 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 50%! 🎊🎊🎊');
    }
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowę drogi!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCorrectSchema();