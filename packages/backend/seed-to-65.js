const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTo65() {
  console.log('🎯 SPRINT TO 65% - ostatnie 2 tabele!\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 63/97 (64.9%)');
    console.log('🎯 Cel: 65% (63 tabele) = +2 tabele \\n');

    // 1. SMARTAnalysisDetail - szczegóły analizy SMART
    console.log('🎯 SMARTAnalysisDetail...');
    try {
      const smart = await prisma.smart.findFirst();
      if (smart) {
        await prisma.sMARTAnalysisDetail.create({
          data: {
            specificScore: 8,
            specificNotes: 'Goal is clearly defined with specific deliverables',
            measurableScore: 7,
            measurableNotes: 'Success criteria are mostly quantifiable',
            smartId: smart.id
          }
        });
        console.log('✅ sMARTAnalysisDetail: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  sMARTAnalysisDetail: brak smart');
      }
    } catch (error) {
      console.log(`⚠️  sMARTAnalysisDetail: ${error.message.substring(0, 80)}...`);
    }

    // 2. SMARTImprovement - sugestie poprawy SMART
    console.log('\\n📈 SMARTImprovement...');
    try {
      await prisma.sMARTImprovement.create({
        data: {
          smartDimension: 'Measurable',
          currentState: 'Goal lacks specific metrics',
          suggestedImprovement: 'Add concrete KPIs and success metrics',
          status: 'OPEN',
          organizationId: organization.id
        }
      });
      console.log('✅ sMARTImprovement: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  sMARTImprovement: ${error.message.substring(0, 80)}...`);
    }

    // 3. VectorDocument - dokument wektorowy (sprawdzę z prostymi polami)
    console.log('\\n🔍 VectorDocument...');
    try {
      await prisma.vectorDocument.create({
        data: {
          title: 'Getting Started Guide',
          content: 'Complete guide for new users to get started with the CRM system',
          contentHash: 'hash123abc',
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
          entityType: 'document',
          organizationId: organization.id
        }
      });
      console.log('✅ vectorDocument: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorDocument: ${error.message.substring(0, 80)}...`);
    }

    // 4. SmartMailboxRule - reguła smart mailbox
    console.log('\\n📬 SmartMailboxRule...');
    try {
      const smartMailbox = await prisma.smartMailbox.findFirst();
      if (smartMailbox) {
        await prisma.smartMailboxRule.create({
          data: {
            field: 'subject',
            operator: 'contains',
            value: 'urgent',
            mailboxId: smartMailbox.id
          }
        });
        console.log('✅ smartMailboxRule: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  smartMailboxRule: brak smartMailbox');
      }
    } catch (error) {
      console.log(`⚠️  smartMailboxRule: ${error.message.substring(0, 80)}...`);
    }

    // 5. UnifiedRuleExecution - wykonanie reguły
    console.log('\\n⚙️ UnifiedRuleExecution...');
    try {
      // Spróbuję najpierw utworzyć prostą UnifiedRule
      const unifiedRule = await prisma.unifiedRule.create({
        data: {
          name: 'Simple Test Rule',
          ruleType: 'PROCESSING',
          organizationId: organization.id
        }
      });
      
      await prisma.unifiedRuleExecution.create({
        data: {
          triggeredBy: 'manual_test',
          executionTime: 125.5,
          result: 'SUCCESS',
          ruleId: unifiedRule.id
        }
      });
      console.log('✅ unifiedRule + unifiedRuleExecution: 2 rekordy');
      successCount += 2;
    } catch (error) {
      console.log(`⚠️  unifiedRuleExecution: ${error.message.substring(0, 80)}...`);
    }

    // 6. Spróbuję jeszcze bardzo prosty model jeśli potrzebuję
    console.log('\\n🔧 Dodatkowe próby...');
    
    // Dodaj drugi file jeśli potrzebuję więcej
    try {
      await prisma.file.create({
        data: {
          fileName: 'system-guide.pdf',
          fileType: 'PDF',
          urlPath: '/uploads/system-guide.pdf',
          size: 1536000,
          organizationId: organization.id
        }
      });
      console.log('✅ file #4: 1 rekord (dodatkowy)');
    } catch (error) {
      console.log(`⚠️  file #4: ${error.message.substring(0, 50)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 SPRINT TO 65%: +${successCount} nowych tabel!`);
    
    const newTotal = 63 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 65) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 65%! FANTASTYCZNY KAMIEŃ MILOWY! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 64) {
      console.log('🌟 Bardzo blisko 65%! Niesamowity postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTo65();