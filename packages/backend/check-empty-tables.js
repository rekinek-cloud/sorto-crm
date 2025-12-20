const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmptyTables() {
  console.log('Sprawdzanie pustych tabel...\n');

  try {
    // Lista wszystkich modeli do sprawdzenia
    const models = [
      'organization', 'user', 'stream', 'task', 'project', 'contact', 'company', 'deal',
      'context', 'meeting', 'subscription', 'waitingFor', 'somedayMaybe', 'habit',
      'recurringTask', 'weeklyReview', 'tag', 'focusMode', 'knowledgeBase', 'emailAnalysis',
      'delegatedTask', 'timeline', 'areaOfResponsibility', 'smartTemplate', 'lead', 'order',
      'invoice', 'autoReply', 'unifiedRule', 'unifiedRuleExecution', 'complaint', 'info',
      'unimportant', 'recommendation', 'gtdBucket', 'gtdHorizon', 'file', 'communicationChannel',
      'processingRule', 'message', 'errorLog', 'product', 'service', 'offer', 'bugReport',
      'activity', 'inboxItem', 'document', 'folder', 'wikiPage', 'wikiCategory', 'searchIndex',
      'aiProvider', 'aiPromptTemplate', 'aiRule', 'aiExecution', 'aiKnowledgeBase', 'aiUsageStats',
      'emailRule', 'smartMailbox', 'emailTemplate', 'emailLog', 'vectorDocument',
      'vectorSearchResult', 'vectorCache'
    ];

    const emptyTables = [];
    const populatedTables = [];

    for (const modelName of models) {
      try {
        const count = await prisma[modelName].count();
        if (count === 0) {
          emptyTables.push(modelName);
        } else {
          populatedTables.push({ name: modelName, count });
        }
      } catch (error) {
        console.log(`❌ Błąd sprawdzania tabeli ${modelName}: ${error.message}`);
      }
    }

    console.log('=== TABELE PUSTE ===');
    if (emptyTables.length > 0) {
      emptyTables.forEach(table => {
        console.log(`🔴 ${table} (0 rekordów)`);
      });
    } else {
      console.log('✅ Brak pustych tabel!');
    }

    console.log('\n=== TABELE WYPEŁNIONE ===');
    populatedTables.forEach(table => {
      console.log(`✅ ${table.name} (${table.count} rekordów)`);
    });

    console.log(`\nPodsumowanie:`);
    console.log(`- Puste tabele: ${emptyTables.length}`);
    console.log(`- Wypełnione tabele: ${populatedTables.length}`);

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyTables();