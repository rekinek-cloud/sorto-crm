const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function countUpdated() {
  console.log('📊 PEŁNY LICZNIK - wszystkie modele...n');

  try {
    const filled = [];

    // Pełna lista modeli - dodano brakujące
    const models = [
      'organization', 'user', 'task', 'project', 'contact', 'company', 'deal', 'context',
      'nextAction', 'waitingFor', 'somedayMaybe', 'habit', 'meeting', 'inboxItem',
      'product', 'service', 'lead', 'order', 'orderItem', 'document', 'folder', 
      'wikiCategory', 'wikiPage', 'searchIndex', 'aIProvider', 'communicationChannel', 'subscription',
      'stream', 'timeline', 'tag', 'refreshToken', 'habitEntry', 'complaint', 'info',
      'unimportant', 'recommendation', 'file', 'metadata', 'gTDHorizon', 'gTDBucket',
      'weeklyReview', 'emailRule', 'smartMailbox', 'emailTemplate', 'processingRule',
      'invoice', 'offer', 'autoReply', 'emailLog', 'focusMode', 'areaOfResponsibility',
      'userRelation', 'errorLog', 'activity', 'bugReport', 'recurringTask', 'delegatedTask',
      'taskHistory', 'taskRelationship', 'criticalPath', 'smart', 'completeness',
      'sMARTTemplate', 'documentComment', 'documentLink', 'documentShare'
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

    console.log('\n📊 STATYSTYKI:');
    console.log(`✅ Wypełnione: ${filled.length}/97 (${fillPercentage}%)`);
    console.log(`📋 Rekordy: ${totalRecords}`);
    console.log(`🎯 Do 90%: ${88 - filled.length} tabel`);

    if (filled.length >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowę drogi!');
    }
    if (filled.length >= 50) {
      console.log('🎊 Ponad 50% wypełnienia!');
    }
    if (filled.length >= 88) {
      console.log('🎉🎉🎉 OSIĄGNĘLIŚMY 90%! 🎉🎉🎉');
    }

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countUpdated();