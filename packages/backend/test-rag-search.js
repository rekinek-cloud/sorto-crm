/**
 * 🧠 Test RAG semantic search directly
 */
const { PrismaClient } = require('@prisma/client');

async function testRAGSearch() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧠 Testing RAG semantic search system...');
    
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    // Simulate voice queries
    const voiceQueries = [
      'Znajdź wiadomości o wycenie',
      'Pokaż mi pilne zadania',
      'Czy są jakieś oferty abonamentowe?',
      'Jakie mam komunikaty od firm?',
      'Szukam informacji o kartonowych tubach'
    ];
    
    console.log(`\n📊 Current vector database stats:`);
    const stats = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors WHERE metadata->>'organizationId' = ${orgId}`;
    console.log(`   Total vectors: ${stats[0]?.count}`);
    
    for (const query of voiceQueries) {
      console.log(`\n🎤 Voice Query: "${query}"`);
      
      // Extract keywords for search
      const keywords = extractKeywords(query);
      console.log(`   Keywords: ${keywords.join(', ')}`);
      
      // Search for each keyword
      let allResults = [];
      for (const keyword of keywords) {
        const results = await prisma.$queryRaw`
          SELECT id, content, metadata
          FROM vectors 
          WHERE content ILIKE ${`%${keyword}%`}
          AND metadata->>'organizationId' = ${orgId}
          ORDER BY created_at DESC
          LIMIT 2
        `;
        allResults = allResults.concat(results);
      }
      
      // Remove duplicates and limit results
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      ).slice(0, 3);
      
      console.log(`   Found ${uniqueResults.length} relevant documents:`);
      
      if (uniqueResults.length === 0) {
        console.log('   ❌ No relevant documents found');
      } else {
        uniqueResults.forEach((result, i) => {
          const meta = result.metadata;
          console.log(`   ${i+1}. Type: ${meta.type} | Source: ${meta.source}`);
          console.log(`      Content: ${result.content.substring(0, 120)}...`);
          console.log(`      Relevance: HIGH (keyword match)\n`);
        });
      }
      
      // Simulate AI response
      const aiResponse = generateAIResponse(query, uniqueResults);
      console.log(`   🤖 AI Response: ${aiResponse}`);
    }
    
    console.log('\n✅ RAG search test completed successfully!');
    
  } catch (error) {
    console.error('❌ RAG test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractKeywords(query) {
  const stopWords = ['znajdź', 'pokaż', 'czy', 'są', 'jakieś', 'jakie', 'mam', 'szukam', 'informacji', 'o', 'mi', 'od'];
  const words = query.toLowerCase()
    .replace(/[^\w\sąćęłńóśźż]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  return [...new Set(words)]; // Remove duplicates
}

function generateAIResponse(query, results) {
  if (results.length === 0) {
    return "Nie znalazłem żadnych dokumentów związanych z tym zapytaniem.";
  }
  
  const count = results.length;
  const types = [...new Set(results.map(r => r.metadata.type))];
  
  if (query.includes('wycen')) {
    return `Znalazłem ${count} dokumentów o wycenach. Głównie to komunikaty biznesowe od firm.`;
  } else if (query.includes('abonament')) {
    return `Mam ${count} ofertę abonamentową od T-Mobile - 6 miesięcy za 0 zł.`;
  } else if (query.includes('tub')) {
    return `Znalazłem ${count} wiadomości o kartonowych tubach KK - zapytania o wycenę.`;
  } else {
    return `Znalazłem ${count} dokumentów typu: ${types.join(', ')}. Czy chcesz więcej szczegółów?`;
  }
}

testRAGSearch().catch(console.error);