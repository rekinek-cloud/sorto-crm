const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave4() {
  console.log('🌊 WAVE 4 - modele bez skomplikowanych relacji...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 47/97 (48.5%)');
    console.log('🎯 Cel: 50%+ wypełnienia = +3-5 tabel \\n');

    // 1. WeeklyReview - przegląd tygodniowy GTD (bez userId)
    console.log('📋 WeeklyReview...');
    try {
      await prisma.weeklyReview.create({
        data: {
          reviewDate: new Date(),
          completedTasksCount: 12,
          newTasksCount: 8,
          stalledTasks: 2,
          collectLoosePapers: true,
          processNotes: true,
          emptyInbox: false,
          organizationId: organization.id
        }
      });
      console.log('✅ weeklyReview: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  weeklyReview: ${error.message.substring(0, 80)}...`);
    }

    // 2. FocusMode - tryb koncentracji
    console.log('\\n🎯 FocusMode...');
    try {
      await prisma.focusMode.create({
        data: {
          name: 'Deep Work Session',
          duration: 90,
          energyLevel: 'HIGH',
          priority: 'HIGH',
          organizationId: organization.id
        }
      });
      console.log('✅ focusMode: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  focusMode: ${error.message.substring(0, 80)}...`);
    }

    // 3. KnowledgeBase - baza wiedzy
    console.log('\\n📚 KnowledgeBase...');
    try {
      await prisma.knowledgeBase.create({
        data: {
          title: 'CRM User Guide',
          content: 'Complete guide for using the CRM system effectively',
          category: 'documentation',
          organizationId: organization.id
        }
      });
      console.log('✅ knowledgeBase: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  knowledgeBase: ${error.message.substring(0, 80)}...`);
    }

    // 4. EmailAnalysis - analiza email
    console.log('\\n📧 EmailAnalysis...');
    try {
      await prisma.emailAnalysis.create({
        data: {
          emailFrom: 'client@company.com',
          emailSubject: 'Urgent: Project deadline discussion',
          emailReceived: new Date(),
          confidenceScore: 0.85,
          summary: 'Client expressing concerns about project timeline',
          organizationId: organization.id
        }
      });
      console.log('✅ emailAnalysis: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailAnalysis: ${error.message.substring(0, 80)}...`);
    }

    // 5. DelegatedTask - zadanie delegowane (sprawdzę bez assignedTo)
    console.log('\\n👥 DelegatedTask...');
    try {
      await prisma.delegatedTask.create({
        data: {
          title: 'Prepare quarterly report',
          description: 'Compile Q4 financial data',
          status: 'PENDING',
          delegatedById: user.id,
          delegatedToId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ delegatedTask: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  delegatedTask: ${error.message.substring(0, 80)}...`);
    }

    // 6. Spróbuję jeszcze AreaOfResponsibility bez skomplikowanych pól
    console.log('\\n🎯 AreaOfResponsibility...');
    try {
      await prisma.areaOfResponsibility.create({
        data: {
          name: 'Customer Support',
          description: 'Managing customer inquiries and support tickets',
          organizationId: organization.id
        }
      });
      console.log('✅ areaOfResponsibility: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  areaOfResponsibility: ${error.message.substring(0, 80)}...`);
    }

    // 7. GTDBucket - kolejny bucket
    console.log('\\n🪣 GTDBucket...');
    try {
      await prisma.gTDBucket.create({
        data: {
          name: 'Delegated Items',
          description: 'Tasks delegated to team members',
          bucketType: 'DELEGATE',
          organizationId: organization.id
        }
      });
      console.log('✅ gTDBucket: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  gTDBucket: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 4 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 47 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 50%! PÓŁMETEK! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 60% (58 tabel)!');
    }
    if (newTotal >= 52) {
      console.log('🌟 Przekroczyliśmy 52%! Niesamowity postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave4();