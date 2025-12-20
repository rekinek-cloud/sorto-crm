import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countAllTables() {
  console.log('📊 Sprawdzanie WSZYSTKICH tabel w bazie danych...\n');

  try {
    // Użyj bezpośredniego zapytania SQL aby pobrać wszystkie tabele
    const tables = await prisma.$queryRaw<{table_name: string}[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('🗄️ WSZYSTKIE TABELE W BAZIE DANYCH:');
    console.log('='.repeat(60));
    
    tables.forEach((table, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${table.table_name}`);
    });

    console.log('='.repeat(60));
    console.log(`📊 ŁĄCZNA LICZBA TABEL: ${tables.length}`);

    // Sprawdź też ile modeli jest w schema.prisma
    console.log('\n🔍 Porównanie ze schema.prisma...');
    
    // Lista wszystkich modeli które sprawdzaliśmy w naszym skrypcie
    const expectedModels = [
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

    console.log(`📋 Modeli w naszym skrypcie: ${expectedModels.length}`);

    // Znajdź tabele które nie były w naszym skrypcie
    const actualTableNames = tables.map(t => t.table_name);
    const missingFromScript = actualTableNames.filter(tableName => 
      !expectedModels.includes(tableName) && 
      !tableName.startsWith('_') && // Prisma internal tables
      tableName !== 'spatial_ref_sys' // PostGIS table
    );

    if (missingFromScript.length > 0) {
      console.log('\n⚠️  TABELE NIEUWZGLĘDNIONE W NASZYM SKRYPCIE:');
      missingFromScript.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    }

    // Znajdź modele które są w skrypcie ale nie w bazie
    const missingFromDB = expectedModels.filter(modelName => 
      !actualTableNames.includes(modelName) &&
      !actualTableNames.includes(modelName.replace(/([A-Z])/g, '_$1').toLowerCase()) // snake_case version
    );

    if (missingFromDB.length > 0) {
      console.log('\n❓ MODELE W SKRYPCIE ALE NIE W BAZIE:');
      missingFromDB.forEach((model, index) => {
        console.log(`${index + 1}. ${model}`);
      });
    }

    // Podsumowanie
    console.log('\n' + '='.repeat(60));
    console.log('📈 STATYSTYKI:');
    console.log(`🗄️  Rzeczywista liczba tabel w bazie: ${tables.length}`);
    console.log(`📋 Modeli w naszym skrypcie: ${expectedModels.length}`);
    console.log(`⚠️  Pominięte tabele: ${missingFromScript.length}`);
    console.log(`❓ Nieistniejące modele: ${missingFromDB.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania tabel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie sprawdzania
countAllTables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });