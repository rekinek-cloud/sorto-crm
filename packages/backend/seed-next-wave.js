const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNextWave() {
  console.log('🌊 NASTĘPNA FALA - kontynuacja prostych modeli...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const document = await prisma.document.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 37/97 (38.1%)');
    console.log('🎯 Cel: następne proste modele\n');

    // 1. Document Comment - prosta relacja
    console.log('💬 Document Comment...');
    try {
      if (document) {
        await prisma.documentComment.create({
          data: {
            content: 'Very helpful document, thanks for sharing!',
            documentId: document.id,
            authorId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentComment: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentComment: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentComment: ${error.message.substring(0, 60)}...`);
    }

    // 2. Document Link - prosta relacja
    console.log('\n🔗 Document Link...');
    try {
      if (document) {
        await prisma.documentLink.create({
          data: {
            url: 'https://example.com/related-resource',
            title: 'Related Resource',
            documentId: document.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentLink: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentLink: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentLink: ${error.message.substring(0, 60)}...`);
    }

    // 3. Document Share - prosta relacja
    console.log('\n👥 Document Share...');
    try {
      if (document) {
        await prisma.documentShare.create({
          data: {
            permission: 'READ',
            documentId: document.id,
            sharedWithId: user.id,
            sharedById: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentShare: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentShare: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentShare: ${error.message.substring(0, 60)}...`);
    }

    // 4. Task History - prosta relacja
    console.log('\n📈 Task History...');
    try {
      if (task) {
        await prisma.taskHistory.create({
          data: {
            action: 'CREATED',
            changes: { status: 'PENDING', priority: 'MEDIUM' },
            taskId: task.id,
            userId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ taskHistory: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  taskHistory: brak task');
      }
    } catch (error) {
      console.log(`⚠️  taskHistory: ${error.message.substring(0, 60)}...`);
    }

    // 5. Completeness - prosta analiza
    console.log('\n✅ Completeness...');
    try {
      if (task) {
        await prisma.completeness.create({
          data: {
            score: 85.0,
            details: {
              specific: true,
              measurable: true, 
              achievable: false,
              relevant: true,
              timebound: true
            },
            taskId: task.id,
            organizationId: organization.id
          }
        });
        console.log('✅ completeness: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  completeness: brak task');
      }
    } catch (error) {
      console.log(`⚠️  completeness: ${error.message.substring(0, 60)}...`);
    }

    // 6. SMART Template - szablon
    console.log('\n🎯 SMART Template...');
    try {
      await prisma.sMARTTemplate.create({
        data: {
          name: 'Project Goals Template',
          description: 'Template for setting SMART project goals',
          template: {
            specific: 'Define clear and specific objective',
            measurable: 'Include measurable success criteria',
            achievable: 'Ensure goal is realistic and achievable',
            relevant: 'Align with business objectives',
            timebound: 'Set clear deadline and milestones'
          },
          organizationId: organization.id
        }
      });
      console.log('✅ sMARTTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  sMARTTemplate: ${error.message.substring(0, 60)}...`);
    }

    // 7. Critical Path - analiza projektowa
    console.log('\n🛤️ Critical Path...');
    try {
      if (task) {
        await prisma.criticalPath.create({
          data: {
            duration: 5,
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 dni
            taskId: task.id,
            organizationId: organization.id
          }
        });
        console.log('✅ criticalPath: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  criticalPath: brak task');
      }
    } catch (error) {
      console.log(`⚠️  criticalPath: ${error.message.substring(0, 60)}...`);
    }

    // 8. Smart - analiza SMART
    console.log('\n🎯 Smart...');
    try {
      await prisma.smart.create({
        data: {
          specific: true,
          measurable: true,
          achievable: false,
          relevant: true,
          timebound: true,
          score: 80.0,
          organizationId: organization.id
        }
      });
      console.log('✅ smart: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smart: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 NASTĘPNA FALA: +${successCount} nowych tabel!`);
    
    const newTotal = 37 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - ponad połowę drogi!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNextWave();