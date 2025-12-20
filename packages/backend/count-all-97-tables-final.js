const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countAllTables() {
  console.log('🔍 SPRAWDZANIE WSZYSTKICH 97 TABEL W BAZIE DANYCH');
  console.log('='.repeat(60));
  
  // Lista wszystkich modeli z Prisma schema (97 tabel) - camelCase
  const models = [
    // Podstawowe
    'organization', 'user', 'stream', 'task', 'nextAction', 'project', 'contact', 'company', 'deal',
    'context', 'meeting', 'subscription', 'waitingFor', 'somedayMaybe', 'habit', 'recurringTask',
    'weeklyReview', 'tag', 'focusMode', 'knowledgeBase', 'emailAnalysis', 'delegatedTask', 'timeline',
    'areaOfResponsibility', 'lead', 'order', 'invoice', 'autoReply', 'unifiedRule', 'unifiedRuleExecution', 
    'processingRule', 'message', 'complaint', 'info', 'unimportant', 'recommendation', 'file', 
    'communicationChannel', 'errorLog', 'product', 'service', 'offer', 'bugReport', 'activity', 
    'inboxItem', 'document', 'folder', 'wikiPage', 'wikiCategory', 'searchIndex', 'smartMailbox', 
    'emailRule', 'emailTemplate', 'emailLog', 'vectorDocument', 'vectorSearchResult', 'vectorCache', 
    'dependency', 'projectDependency', 'criticalPath', 'userRelation', 'taskRelationship', 
    'streamChannel', 'streamRelation', 'streamPermission', 'streamAccessLog', 'messageAttachment', 
    'messageProcessingResult', 'documentLink', 'invoiceItem', 'offerItem', 'orderItem',
    // AI modele - wszystkie z listy
    'aIProvider', 'aIModel', 'aIPromptTemplate', 'aIRule', 'aIExecution', 'aIKnowledgeBase', 
    'aIKnowledgeDocument', 'aIUsageStats',
    // GTD i SMART modele
    'gTDBucket', 'gTDHorizon', 'sMARTTemplate', 'sMARTAnalysisDetail', 'sMARTImprovement',
    // Dodatkowe z pełnej listy Prisma
    'documentComment', 'documentShare', 'habitEntry', 'metadata', 'refreshToken', 'smart',
    'smartMailboxRule', 'taskHistory', 'userAccessLog', 'userPermission', 'wikiPageLink',
    'completeness'
  ];
  
  console.log(`📋 Sprawdzanie ${models.length} modeli...`);
  
  const results = [];
  let totalFilled = 0;
  let totalRecords = 0;
  
  for (const model of models) {
    try {
      const count = await prisma[model].count();
      const filled = count > 0;
      if (filled) totalFilled++;
      totalRecords += count;
      
      results.push({ 
        model, 
        count, 
        filled,
        status: filled ? '✅' : '🔴'
      });
    } catch (e) {
      results.push({ 
        model, 
        count: 'ERROR', 
        filled: false,
        status: '❌',
        error: e.message.substring(0, 50)
      });
    }
  }
  
  // Sortuj wyniki: wypełnione na górze, potem według liczby rekordów
  results.sort((a, b) => {
    if (a.filled && !b.filled) return -1;
    if (!a.filled && b.filled) return 1;
    if (a.filled && b.filled) {
      return (typeof b.count === 'number' ? b.count : 0) - (typeof a.count === 'number' ? a.count : 0);
    }
    return 0;
  });
  
  console.log('\n📊 TABELE WYPEŁNIONE:');
  console.log('='.repeat(50));
  results.filter(r => r.filled).forEach((r, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${r.status} ${r.model.padEnd(25)} ${r.count} rekordów`);
  });
  
  console.log('\n🔴 TABELE PUSTE:');
  console.log('='.repeat(30));
  results.filter(r => !r.filled && r.status === '🔴').forEach((r, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${r.status} ${r.model.padEnd(25)} ${r.count} rekordów`);
  });
  
  console.log('\n❌ TABELE Z BŁĘDAMI:');
  console.log('='.repeat(35));
  results.filter(r => r.status === '❌').forEach((r, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${r.status} ${r.model.padEnd(25)} ERROR: ${r.error || 'Unknown'}`);
  });
  
  const empty = results.filter(r => !r.filled && r.status === '🔴').length;
  const errors = results.filter(r => r.status === '❌').length;
  const percentage = ((totalFilled / models.length) * 100).toFixed(1);
  
  console.log('\n🏆 PODSUMOWANIE FINALNE:');
  console.log('='.repeat(40));
  console.log(`📊 Łączna liczba tabel: ${models.length}`);
  console.log(`✅ Tabele wypełnione: ${totalFilled} (${percentage}%)`);
  console.log(`🔴 Tabele puste: ${empty}`);
  console.log(`❌ Tabele z błędami: ${errors}`);
  console.log(`📋 Łączna liczba rekordów: ${totalRecords}`);
  console.log('');
  console.log(`🎯 STAN WYPEŁNIENIA: ${percentage}% z ${models.length} tabel`);
  
  // Kamienie milowe
  console.log('\n🏁 KAMIENIE MILOWE:');
  console.log(`✅ 50%: ${percentage >= 50 ? 'OSIĄGNIĘTE' : 'NIE OSIĄGNIĘTE'}`);
  console.log(`✅ 60%: ${percentage >= 60 ? 'OSIĄGNIĘTE' : 'NIE OSIĄGNIĘTE'}`);
  console.log(`✅ 70%: ${percentage >= 70 ? 'OSIĄGNIĘTE' : 'NIE OSIĄGNIĘTE'}`);
  console.log(`✅ 80%: ${percentage >= 80 ? 'OSIĄGNIĘTE' : 'NIE OSIĄGNIĘTE'}`);
  console.log(`✅ 90%: ${percentage >= 90 ? 'OSIĄGNIĘTE' : 'NIE OSIĄGNIĘTE'}`);
  
  // Do 70%
  const needed70 = Math.ceil(models.length * 0.7) - totalFilled;
  if (needed70 > 0) {
    console.log(`\n📈 Do osiągnięcia 70%: ${needed70} tabel więcej`);
  }
  
  // Do 90%
  const needed90 = Math.ceil(models.length * 0.9) - totalFilled;
  if (needed90 > 0) {
    console.log(`📈 Do osiągnięcia 90%: ${needed90} tabel więcej`);
  }
}

// Uruchom sprawdzenie
countAllTables()
  .catch((error) => {
    console.error('❌ BŁĄD:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });