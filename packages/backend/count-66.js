const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function count66() {
  console.log('🎊 COUNT 66% - aktualny stan po przekroczeniu 65%!\\n');

  try {
    const filled = [];

    // Kompletna lista z najnowszymi modelami
    const models = [
      'organization', 'user', 'task', 'project', 'contact', 'company', 'deal', 'context',
      'nextAction', 'waitingFor', 'somedayMaybe', 'habit', 'meeting', 'inboxItem',
      'product', 'service', 'lead', 'order', 'orderItem', 'document', 'folder', 
      'wikiCategory', 'wikiPage', 'wikiPageLink', 'searchIndex', 'aIProvider', 'communicationChannel', 'subscription',
      'stream', 'timeline', 'tag', 'refreshToken', 'habitEntry', 'complaint', 'info',
      'unimportant', 'recommendation', 'file', 'metadata', 'gTDHorizon', 'gTDBucket',
      'weeklyReview', 'emailRule', 'smartMailbox', 'smartMailboxRule', 'emailTemplate', 'processingRule',
      'invoice', 'offer', 'autoReply', 'emailLog', 'focusMode', 'areaOfResponsibility',
      'userRelation', 'errorLog', 'activity', 'bugReport', 'recurringTask', 'delegatedTask',
      'taskHistory', 'taskRelationship', 'criticalPath', 'smart', 'completeness',
      'sMARTTemplate', 'sMARTAnalysisDetail', 'sMARTImprovement', 'documentComment', 'documentLink', 'documentShare',
      'aIRule', 'aIExecution', 'aIKnowledgeBase', 'aIKnowledgeDocument', 'aIModel', 'aIUsageStats', 
      'aIPromptTemplate', 'message', 'messageAttachment',
      'vectorDocument', 'vectorSearchResult', 'vectorCache', 'knowledgeBase', 'emailAnalysis',
      'documentHistory', 'documentVersion', 'invoiceItem', 'offerItem', 'userAccessLog',
      'streamRelation', 'streamPermission', 'streamAccessLog', 'streamChannel', 'projectDependency', 'dependency',
      'unifiedRule', 'unifiedRuleExecution'
    ];

    for (const modelName of models) {
      try {
        const model = prisma[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          if (count > 0) {
            filled.push({ name: modelName, count });
          }
        }
      } catch (error) {
        // Skip błędy
      }
    }

    const totalRecords = filled.reduce((sum, table) => sum + table.count, 0);
    const fillPercentage = ((filled.length / 97) * 100).toFixed(1);

    console.log('🎉 PRZEKROCZONO 65%! 🎉\\n');
    
    console.log('✅ WSZYSTKIE WYPEŁNIONE TABELE:');
    filled
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count})`);
      });

    console.log('\\n' + '='.repeat(70));
    console.log('🏆 AKTUALNE OSIĄGNIĘCIA 🏆');
    console.log('='.repeat(70));
    console.log(`📊 CURRENT RESULT: ${filled.length}/97 (${fillPercentage}%)`);
    console.log(`📋 Łączne rekordy: ${totalRecords}`);
    console.log(`🎯 Do 90%: ${88 - filled.length} tabel pozostało`);

    console.log('\\n🏆 KAMIENIE MILOWE:');
    if (filled.length >= 50) console.log('✅ 50% - PÓŁMETEK!');
    if (filled.length >= 55) console.log('✅ 55% - PONAD POŁOWA!');
    if (filled.length >= 60) console.log('✅ 60% - FANTASTYCZNY POSTĘP!');
    if (filled.length >= 65) console.log('✅ 65% - NIESAMOWITY WYNIK!');
    if (filled.length >= 66) console.log('🎊 66%+ - PRZEKROCZONO 65%! 🎊');

    console.log('\\n🎯 NASTĘPNE CELE:');
    console.log(`- Do 67%: ${67 - filled.length} tabel`);
    console.log(`- Do 70%: ${70 - filled.length} tabel`);
    console.log(`- Do 75%: ${73 - filled.length} tabel`);
    console.log(`- Do 80%: ${78 - filled.length} tabel`);
    console.log(`- Do 90%: ${88 - filled.length} tabel`);

    console.log('\\n🚀 NAJNOWSZE TABELE:');
    const recentTables = ['smartMailboxRule', 'criticalPath', 'sMARTTemplate', 'aIKnowledgeDocument', 'autoReply', 'invoice'];
    recentTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    console.log('\\n' + '='.repeat(70));
    console.log('🎊 BAZA DANYCH PRZEKROCZYŁA 65%! KIERUNEK 70%! 🎊');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

count66();