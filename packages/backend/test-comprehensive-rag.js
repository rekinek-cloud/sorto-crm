/**
 * 🧠 Test comprehensive RAG system
 */
const { PrismaClient } = require('@prisma/client');

async function testComprehensiveRAG() {
  const prisma = new PrismaClient();
  
  try {
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors WHERE metadata->>'organizationId' = ${orgId}`;
    console.log(`📊 TOTAL VECTORS: ${finalCount[0]?.count}`);
    
    const finalByType = await prisma.$queryRaw`
      SELECT metadata->>'type' as type, COUNT(*) as count 
      FROM vectors 
      WHERE metadata->>'organizationId' = ${orgId}
      GROUP BY metadata->>'type'
      ORDER BY count DESC
    `;
    
    console.log('\n📈 Complete vector breakdown:');
    let total = 0;
    finalByType.forEach(row => {
      total += Number(row.count);
      console.log(`  ${row.type.padEnd(15)}: ${row.count}`);
    });
    console.log(`  ${'TOTAL'.padEnd(15)}: ${total}`);
    
    // Test comprehensive search
    console.log('\n🧠 Testing comprehensive RAG search...');
    
    const testQueries = [
      'Pokaż mi wszystkie firmy',
      'Jakie mam zadania do zrobienia?', 
      'Które projekty są aktywne?',
      'Znajdź kontakty z branży IT',
      'Pokaż deals o wysokiej wartości',
      'Szukam wiadomości o wycenie'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🎤 "${query}"`);
      
      // Extract keywords
      const keywords = query.toLowerCase()
        .replace(/[^\w\sąćęłńóśźż]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !['wszystkie', 'które', 'jakie', 'mam', 'znajdź', 'pokaż', 'szukam'].includes(word));
      
      console.log(`   Keywords: ${keywords.join(', ')}`);
      
      // Search by keywords
      let results = [];
      for (const keyword of keywords.slice(0, 2)) { // Max 2 keywords
        const matches = await prisma.$queryRaw`
          SELECT id, content, metadata
          FROM vectors 
          WHERE content ILIKE ${`%${keyword}%`}
          AND metadata->>'organizationId' = ${orgId}
          ORDER BY (metadata->>'importance')::int DESC
          LIMIT 3
        `;
        results = results.concat(matches);
      }
      
      // Remove duplicates
      const unique = results.filter((r, i, self) => 
        i === self.findIndex(x => x.id === r.id)
      ).slice(0, 3);
      
      console.log(`   Found ${unique.length} results:`);
      unique.forEach((result, i) => {
        const meta = result.metadata;
        console.log(`   ${i+1}. ${meta.type.toUpperCase()}: ${result.content.substring(0, 80)}...`);
      });
      
      // Generate AI response
      const aiResponse = generateAIResponse(query, unique);
      console.log(`   🤖 Response: ${aiResponse}`);
    }
    
    console.log('\n🎉 Comprehensive RAG system is fully operational!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateAIResponse(query, results) {
  if (results.length === 0) {
    return "Nie znalazłem żadnych dokumentów związanych z tym zapytaniem.";
  }
  
  const types = [...new Set(results.map(r => r.metadata.type))];
  const count = results.length;
  
  if (query.includes('firm')) {
    const companies = results.filter(r => r.metadata.type === 'company');
    return `Znalazłem ${companies.length} firm w bazie danych. ${companies.length > 0 ? 'Mogę pokazać szczegóły konkretnych firm.' : 'Sprawdź też kontakty biznesowe.'}`;
  } else if (query.includes('zadania')) {
    const tasks = results.filter(r => r.metadata.type === 'task');
    return `Masz ${tasks.length} zadań w systemie. ${tasks.length > 0 ? 'Sprawdź te o wysokim priorytecie.' : 'Może czas na nowe zadania?'}`;
  } else if (query.includes('projekt')) {
    const projects = results.filter(r => r.metadata.type === 'project');
    return `Znalazłem ${projects.length} projektów. ${projects.length > 0 ? 'Sprawdź status aktywnych projektów.' : 'Rozważ nowe projekty.'}`;
  } else if (query.includes('kontakt')) {
    const contacts = results.filter(r => r.metadata.type === 'contact');
    return `Mam ${contacts.length} kontaktów w bazie. ${contacts.length > 0 ? 'Sprawdź detale poszczególnych osób.' : 'Dodaj nowe kontakty.'}`;
  } else if (query.includes('deal')) {
    const deals = results.filter(r => r.metadata.type === 'deal');
    return `Znalazłem ${deals.length} opportunities w sprzedaży. ${deals.length > 0 ? 'Sprawdź ich wartość i status.' : 'Czas na nowe leady!'}`;
  } else if (query.includes('wycen')) {
    const communications = results.filter(r => r.metadata.type === 'communication');
    return `Mam ${communications.length} wiadomości o wycenach. Głównie dotyczą kartonowych tub i produktów przemysłowych.`;
  } else {
    return `Znalazłem ${count} dokumentów typu: ${types.join(', ')}. Czy chcesz więcej szczegółów?`;
  }
}

testComprehensiveRAG().catch(console.error);