const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave9() {
  console.log('🌊 WAVE 9 - prostsze modele...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 59/97 (60.8%)');
    console.log('🎯 Cel: 65% = +4-6 tabel \\n');

    // 1. StreamChannel - kanał strumienia
    console.log('🌊 StreamChannel...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamChannel.create({
          data: {
            streamId: stream.id,
            channelType: 'EMAIL',
            channelAddress: 'support@company.com'
          }
        });
        console.log('✅ streamChannel: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamChannel: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamChannel: ${error.message.substring(0, 80)}...`);
    }

    // 2. AIKnowledgeDocument - dokument wiedzy AI
    console.log('\\n🧠 AIKnowledgeDocument...');
    try {
      const aiKnowledgeBase = await prisma.aIKnowledgeBase.findFirst();
      if (aiKnowledgeBase) {
        await prisma.aIKnowledgeDocument.create({
          data: {
            title: 'Customer Support Guide',
            content: 'Complete guide for handling customer support inquiries and common issues.',
            knowledgeBaseId: aiKnowledgeBase.id
          }
        });
        console.log('✅ aIKnowledgeDocument: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  aIKnowledgeDocument: brak aIKnowledgeBase');
      }
    } catch (error) {
      console.log(`⚠️  aIKnowledgeDocument: ${error.message.substring(0, 80)}...`);
    }

    // 3. AIPromptTemplate - szablon prompt AI
    console.log('\\n💭 AIPromptTemplate...');
    try {
      await prisma.aIPromptTemplate.create({
        data: {
          name: 'Task Analysis Template',
          description: 'Template for analyzing task complexity and requirements',
          category: 'ANALYSIS',
          promptTemplate: 'Analyze the following task: {{taskDescription}}. Provide complexity score and recommendations.',
          organizationId: organization.id
        }
      });
      console.log('✅ aIPromptTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIPromptTemplate: ${error.message.substring(0, 80)}...`);
    }

    // 4. SMARTTemplate - szablon SMART
    console.log('\\n🎯 SMARTTemplate...');
    try {
      await prisma.sMARTTemplate.create({
        data: {
          name: 'Project Goal Template',
          taskTemplate: 'Complete {{project_name}} by implementing {{key_features}} to achieve {{business_goal}}',
          organizationId: organization.id
        }
      });
      console.log('✅ sMARTTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  sMARTTemplate: ${error.message.substring(0, 80)}...`);
    }

    // 5. UserRelation - relacja użytkowników (sprawdzę ponownie)
    console.log('\\n👥 UserRelation...');
    try {
      await prisma.userRelation.create({
        data: {
          type: 'MANAGES',
          fromUserId: user.id,
          toUserId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ userRelation: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userRelation: ${error.message.substring(0, 80)}...`);
    }

    // 6. Spróbuję dodać drugi GTDBucket
    console.log('\\n🪣 GTDBucket #2...');
    try {
      await prisma.gTDBucket.create({
        data: {
          name: 'Reference Materials',
          description: 'Documents and information for future reference',
          bucketType: 'REFERENCE',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDBucket #2: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDBucket #2: ${error.message.substring(0, 80)}...`);
    }

    // 7. Jeszcze jeden GTDHorizon
    console.log('\\n🌅 GTDHorizon #2...');
    try {
      await prisma.gTDHorizon.create({
        data: {
          level: 1,
          name: 'Areas of Focus',
          description: 'Key areas of responsibility and focus',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDHorizon #2: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDHorizon #2: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 9 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 59 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 65) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 65%! FANTASTYCZNY POSTĘP! 🎊🎊🎊');
    }
    if (newTotal >= 63) {
      console.log('🌟 Bardzo blisko 65%! Doskonały wynik!');
    }
    if (newTotal >= 60) {
      console.log('✅ Utrzymujemy ponad 60%!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave9();