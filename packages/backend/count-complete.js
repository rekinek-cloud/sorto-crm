const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function countComplete() {
  console.log('📊 COMPLETE COUNT - wszystkie wypełnione tabele...\\n');

  try {
    const filled = [];

    // Kompletna lista wszystkich modeli
    const models = [
      'organization', 'user', 'task', 'project', 'contact', 'company', 'deal', 'context',
      'nextAction', 'waitingFor', 'somedayMaybe', 'habit', 'meeting', 'inboxItem',
      'product', 'service', 'lead', 'order', 'orderItem', 'document', 'folder', 
      'wikiCategory', 'wikiPage', 'wikiPageLink', 'searchIndex', 'aIProvider', 'communicationChannel', 'subscription',
      'stream', 'timeline', 'tag', 'refreshToken', 'habitEntry', 'complaint', 'info',
      'unimportant', 'recommendation', 'file', 'metadata', 'gTDHorizon', 'gTDBucket',
      'weeklyReview', 'emailRule', 'smartMailbox', 'emailTemplate', 'processingRule',
      'invoice', 'offer', 'autoReply', 'emailLog', 'focusMode', 'areaOfResponsibility',
      'userRelation', 'errorLog', 'activity', 'bugReport', 'recurringTask', 'delegatedTask',
      'taskHistory', 'taskRelationship', 'criticalPath', 'smart', 'completeness',
      'sMARTTemplate', 'documentComment', 'documentLink', 'documentShare',
      'aIRule', 'aIExecution', 'aIKnowledgeBase', 'aIModel', 'message', 'messageAttachment',
      'vectorDocument', 'vectorSearchResult', 'vectorCache', 'knowledgeBase', 'emailAnalysis',
      'documentHistory', 'documentVersion', 'invoiceItem', 'offerItem',
      'streamRelation', 'streamPermission', 'streamAccessLog', 'projectDependency', 'dependency'
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

    console.log('✅ WYPEŁNIONE TABELE:');
    filled
      .sort((a, b) => b.count - a.count)
      .forEach((table, index) => {
        console.log(`${index + 1}. ${table.name} (${table.count})`);
      });

    const totalRecords = filled.reduce((sum, table) => sum + table.count, 0);
    const fillPercentage = ((filled.length / 97) * 100).toFixed(1);

    console.log('\\n📊 FINAL STATISTICS:');
    console.log(`✅ Wypełnione: ${filled.length}/97 (${fillPercentage}%)`);
    console.log(`📋 Łączne rekordy: ${totalRecords}`);
    console.log(`🎯 Do 90%: ${88 - filled.length} tabel`);

    console.log('\\n🎯 POZOSTAŁE CELE:');
    const targets = [55, 60, 65, 70, 75, 80, 85, 88];
    targets.forEach(target => {
      const remaining = target - filled.length;
      if (remaining > 0) {
        console.log(`Do ${((target/97)*100).toFixed(0)}%: ${remaining} tabel`);
      } else {
        console.log(`✅ ${((target/97)*100).toFixed(0)}%: OSIĄGNIĘTE!`);
      }
    });

    if (filled.length >= 50) {
      console.log('\\n🎊 OSIĄGNĘLIŚMY 50%! PÓŁMETEK!');
    }
    if (filled.length >= 55) {
      console.log('🌟 Ponad 55%! Świetny postęp!');
    }
    if (filled.length >= 60) {
      console.log('🚀 60%! Dwie trzecie do celu!');
    }

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countComplete();