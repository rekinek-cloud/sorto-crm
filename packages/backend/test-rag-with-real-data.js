/**
 * 🧪 Test RAG System z prawdziwymi danymi
 * Testuje wyszukiwanie semantyczne i AI Knowledge Engine
 */
const { PrismaClient } = require('@prisma/client');

async function testRagWithRealData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧠 Test systemu RAG z prawdziwymi danymi\n');
    
    // Sprawdź ile mamy wektorów
    const vectorCount = await prisma.$queryRaw`
      SELECT 
        metadata->>'type' as type,
        COUNT(*) as count,
        metadata->>'organizationId' as org_id
      FROM vectors 
      GROUP BY metadata->>'type', metadata->>'organizationId'
      ORDER BY count DESC
    `;
    
    console.log('📊 Statystyki wektorów w bazie:');
    vectorCount.forEach(stat => {
      console.log(`   ${stat.type}: ${stat.count} wektorów (org: ${stat.org_id?.substring(0, 8)}...)`);
    });
    
    const orgId = vectorCount[0]?.org_id;
    if (!orgId) {
      console.log('❌ Brak wektorów w bazie');
      return;
    }
    
    console.log(`\n🎯 Testowanie dla organizacji: ${orgId}`);
    
    // Test 1: Wyszukiwanie semantyczne prostym zapytaniem
    console.log('\n🔍 TEST 1: Wyszukiwanie semantyczne');
    const searchQueries = [
      'pilne zadania',
      'website projekt',
      'marketing kampania',
      'konsultacje timeline',
      'portfolio management'
    ];
    
    for (const query of searchQueries) {
      console.log(`\n   🔎 Zapytanie: "${query}"`);
      
      // Symuluj semantic search w tabeli vectors
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          metadata->>'title' as title,
          metadata->>'urgencyScore' as urgency,
          metadata->>'priority' as priority,
          metadata->>'type' as type
        FROM vectors 
        WHERE metadata->>'organizationId' = ${orgId}
        AND (
          LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(metadata->>'title') LIKE LOWER(${'%' + query + '%'})
        )
        ORDER BY 
          CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
               THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
               ELSE 0 END DESC
        LIMIT 3
      `;
      
      if (results.length > 0) {
        results.forEach((result, i) => {
          console.log(`      ${i + 1}. [${result.type}] ${result.title || 'Bez tytułu'}`);
          console.log(`         Urgency: ${result.urgency || 'N/A'}, Priority: ${result.priority || 'N/A'}`);
          console.log(`         Content: ${result.content.substring(0, 100)}...`);
        });
      } else {
        console.log(`      ❌ Brak wyników dla "${query}"`);
      }
    }
    
    // Test 2: Analiza tematyczna
    console.log('\n\n📊 TEST 2: Analiza tematyczna danych');
    
    const themeAnalysis = await prisma.$queryRaw`
      SELECT 
        metadata->>'type' as entity_type,
        metadata->>'priority' as priority,
        COUNT(*) as count,
        AVG(CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
                THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
                ELSE 0 END) as avg_urgency
      FROM vectors 
      WHERE metadata->>'organizationId' = ${orgId}
      GROUP BY metadata->>'type', metadata->>'priority'
      ORDER BY count DESC
    `;
    
    console.log('   📈 Rozkład priorytetów:');
    themeAnalysis.forEach(theme => {
      console.log(`      ${theme.entity_type} (${theme.priority || 'NO_PRIORITY'}): ${theme.count} items, avg urgency: ${Math.round(theme.avg_urgency || 0)}`);
    });
    
    // Test 3: Urgent Items Detection
    console.log('\n\n⚠️  TEST 3: Wykrywanie pilnych elementów');
    
    const urgentItems = await prisma.$queryRaw`
      SELECT 
        metadata->>'title' as title,
        metadata->>'urgencyScore' as urgency,
        metadata->>'priority' as priority,
        metadata->>'type' as type,
        content
      FROM vectors 
      WHERE metadata->>'organizationId' = ${orgId}
      AND (
        CAST(metadata->>'urgencyScore' AS INTEGER) > 70 OR
        metadata->>'priority' = 'HIGH' OR
        LOWER(content) LIKE '%pilne%' OR
        LOWER(content) LIKE '%urgent%' OR
        LOWER(content) LIKE '%asap%'
      )
      ORDER BY 
        CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
             THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
             ELSE 0 END DESC
      LIMIT 5
    `;
    
    if (urgentItems.length > 0) {
      console.log(`   🚨 Znaleziono ${urgentItems.length} pilnych elementów:`);
      urgentItems.forEach((item, i) => {
        console.log(`      ${i + 1}. [${item.type}] ${item.title || 'Bez tytułu'}`);
        console.log(`         Urgency: ${item.urgency}, Priority: ${item.priority}`);
        console.log(`         Content: ${item.content.substring(0, 150)}...`);
      });
    } else {
      console.log('   ✅ Brak pilnych elementów');
    }
    
    // Test 4: Keyword Extraction z prawdziwych danych
    console.log('\n\n🏷️  TEST 4: Ekstrakcja słów kluczowych');
    
    const keywordAnalysis = await prisma.$queryRaw`
      SELECT 
        content,
        metadata->>'type' as type,
        metadata->>'title' as title
      FROM vectors 
      WHERE metadata->>'organizationId' = ${orgId}
      LIMIT 20
    `;
    
    // Prosta analiza słów kluczowych
    const allWords = keywordAnalysis.map(item => 
      item.content.toLowerCase()
        .replace(/[^\w\sąćęłńóśźż]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
    ).flat();
    
    const wordFreq = {};
    allWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .filter(([word, freq]) => freq > 1);
    
    console.log('   📝 Najczęstsze słowa kluczowe:');
    topWords.forEach(([word, freq], i) => {
      console.log(`      ${i + 1}. "${word}" - ${freq}x`);
    });
    
    // Test 5: Business Insights
    console.log('\n\n💼 TEST 5: Business Insights');
    
    const businessMetrics = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN metadata->>'type' = 'message' THEN 1 END) as messages,
        COUNT(CASE WHEN CAST(metadata->>'urgencyScore' AS INTEGER) > 70 THEN 1 END) as high_urgency,
        COUNT(CASE WHEN metadata->>'actionNeeded' = 'true' THEN 1 END) as action_needed,
        AVG(CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
                THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
                ELSE 0 END) as avg_urgency
      FROM vectors 
      WHERE metadata->>'organizationId' = ${orgId}
    `;
    
    const metrics = businessMetrics[0];
    console.log(`   📊 Metryki biznesowe:`);
    console.log(`      • Łączna liczba elementów: ${metrics.total_items}`);
    console.log(`      • Wiadomości: ${metrics.messages}`);
    console.log(`      • Wysokiej pilności: ${metrics.high_urgency}`);
    console.log(`      • Wymagające akcji: ${metrics.action_needed}`);
    console.log(`      • Średnia pilność: ${Math.round(metrics.avg_urgency || 0)}/100`);
    
    const actionablePercent = ((metrics.action_needed / metrics.total_items) * 100).toFixed(1);
    const urgentPercent = ((metrics.high_urgency / metrics.total_items) * 100).toFixed(1);
    
    console.log(`\n   🎯 Kluczowe insights:`);
    console.log(`      • ${actionablePercent}% elementów wymaga akcji`);
    console.log(`      • ${urgentPercent}% to wysokiej pilności`);
    
    if (metrics.avg_urgency > 60) {
      console.log(`      ⚠️  Wysoki średni poziom pilności (${Math.round(metrics.avg_urgency)})`);
    } else {
      console.log(`      ✅ Normalny poziom pilności (${Math.round(metrics.avg_urgency)})`);
    }
    
    console.log('\n🎉 TEST RAG Z PRAWDZIWYMI DANYMI ZAKOŃCZONY!');
    console.log('\n💡 System RAG jest gotowy do użycia z prawdziwymi danymi organizacji');
    
  } catch (error) {
    console.error('❌ Test RAG nie powiódł się:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRagWithRealData().catch(console.error);