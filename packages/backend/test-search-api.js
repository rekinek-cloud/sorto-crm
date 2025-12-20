/**
 * 🔍 Test Universal Search API
 */
const { PrismaClient } = require('@prisma/client');

async function testSearchAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing Universal Search API simulation...');
    
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    // Simulate search requests
    const testQueries = [
      { query: 'firmy technologiczne', types: ['company'] },
      { query: 'zadania wysokiego priorytetu', types: ['task'] },
      { query: 'wycena kartonowych tub', types: undefined },
      { query: 'projekty w planowaniu', types: ['project'] },
      { query: 'deals enterprise', types: ['deal'] }
    ];
    
    for (const testQuery of testQueries) {
      console.log(`\n🎤 Query: "${testQuery.query}"`);
      console.log(`   Types filter: ${testQuery.types ? testQuery.types.join(', ') : 'all'}`);
      
      // Extract keywords (simplified)
      const keywords = testQuery.query.toLowerCase()
        .replace(/[^\w\sąćęłńóśźż]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !['wysokiego', 'kartonowych'].includes(word))
        .slice(0, 3);
      
      console.log(`   Keywords: ${keywords.join(', ')}`);
      
      // Build search query
      let whereClause = `WHERE metadata->>'organizationId' = $1`;
      const params = [orgId];
      let paramIndex = 1;
      
      // Filter by types
      if (testQuery.types && testQuery.types.length > 0) {
        whereClause += ` AND metadata->>'type' = ANY($${++paramIndex})`;
        params.push(testQuery.types);
      }
      
      // Search by keywords
      if (keywords.length > 0) {
        const keywordConditions = keywords.map(() => {
          return `content ILIKE $${++paramIndex}`;
        });
        whereClause += ` AND (${keywordConditions.join(' OR ')})`;
        keywords.forEach(keyword => params.push(`%${keyword}%`));
      }
      
      const searchQuery = `
        SELECT 
          id, 
          content, 
          metadata,
          created_at
        FROM vectors 
        ${whereClause}
        ORDER BY (metadata->>'importance')::int DESC, created_at DESC
        LIMIT 10
      `;
      
      console.log(`   SQL: ${searchQuery.replace(/\$\d+/g, '?')}`);
      
      try {
        const results = await prisma.$queryRawUnsafe(searchQuery, ...params);
        
        console.log(`   Found: ${results.length} results`);
        
        results.slice(0, 3).forEach((result, i) => {
          const meta = result.metadata;
          const title = extractTitle(result.content, meta.type);
          console.log(`   ${i+1}. [${meta.type.toUpperCase()}] ${title}`);
          console.log(`      Importance: ${meta.importance} | Source: ${meta.source}`);
        });
        
        // Simulate response
        const searchResults = results.map(row => ({
          id: row.id,
          type: row.metadata.type,
          entityId: row.metadata.entityId,
          title: extractTitle(row.content, row.metadata.type),
          summary: row.content.substring(0, 200) + '...',
          metadata: {
            type: row.metadata.type,
            source: row.metadata.source,
            importance: row.metadata.importance,
            tags: row.metadata.tags || [],
            createdAt: row.metadata.createdAt
          },
          relevanceScore: calculateRelevanceScore(testQuery.query, row.content, row.metadata)
        }));
        
        // Group by type
        const groupedResults = searchResults.reduce((acc, result) => {
          const type = result.metadata.type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(result);
          return acc;
        }, {});
        
        console.log(`   Grouped: ${Object.keys(groupedResults).map(type => `${type}(${groupedResults[type].length})`).join(', ')}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test search stats
    console.log('\n📊 Testing search stats...');
    const stats = await prisma.$queryRawUnsafe(`
      SELECT 
        metadata->>'type' as type,
        COUNT(*) as count,
        AVG((metadata->>'importance')::int) as avg_importance
      FROM vectors 
      WHERE metadata->>'organizationId' = $1
      GROUP BY metadata->>'type'
      ORDER BY count DESC
    `, orgId);
    
    console.log('Database stats:');
    stats.forEach(stat => {
      console.log(`  ${stat.type}: ${stat.count} docs (avg importance: ${Number(stat.avg_importance).toFixed(1)})`);
    });
    
    console.log('\n✅ Universal Search API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractTitle(content, type) {
  const firstLine = content.split('\n')[0];
  
  switch (type) {
    case 'company':
      return firstLine.replace('Firma: ', '');
    case 'contact':
      return firstLine.replace('Kontakt: ', '');
    case 'task':
      return firstLine.replace('Zadanie: ', '');
    case 'project':
      return firstLine.replace('Projekt: ', '');
    case 'deal':
      return firstLine.replace('Deal: ', '');
    case 'communication':
      return firstLine.replace('Wiadomość: ', '');
    case 'knowledge':
      return firstLine.replace('Wiedza: ', '');
    case 'activity':
      return firstLine.replace('Aktywność: ', '');
    default:
      return firstLine.substring(0, 50);
  }
}

function calculateRelevanceScore(query, content, metadata) {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match
  if (contentLower.includes(queryLower)) {
    score += 10;
  }
  
  // Word matches
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  queryWords.forEach(word => {
    if (contentLower.includes(word)) {
      score += 3;
    }
  });
  
  // Type importance
  const typeScores = {
    deal: 9, project: 8, task: 7, knowledge: 6, 
    communication: 5, company: 4, contact: 3, activity: 2
  };
  score += typeScores[metadata.type] || 1;
  
  // Metadata importance
  score += metadata.importance || 0;
  
  return score;
}

testSearchAPI().catch(console.error);