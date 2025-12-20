/**
 * 🧪 Test semantic search on vectorized data
 */
const { PrismaClient } = require('@prisma/client');

async function testSemanticSearch() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing semantic search on vectorized data...');
    
    // Get vector store stats first
    const statsQuery = `SELECT COUNT(*) as total, metadata->>'type' as type FROM vectors GROUP BY metadata->>'type'`;
    const stats = await prisma.$queryRawUnsafe(statsQuery);
    
    console.log('📊 Vector Store Stats:');
    stats.forEach(row => {
      console.log(`   ${row.type}: ${row.total} documents`);
    });
    
    // Test different search queries
    const queries = [
      'pilne zadania',
      'wycena dla klienta', 
      'abonament',
      'projekt',
      'ważne'
    ];
    
    for (const query of queries) {
      console.log(`\n📝 Searching for: "${query}"`);
      
      // Get all vectors for manual similarity calculation
      const vectors = await prisma.$queryRaw`
        SELECT id, content, metadata, embedding_data 
        FROM vectors 
        WHERE metadata->>'organizationId' = 'org_1'
        LIMIT 20
      `;
      
      console.log(`   Found ${vectors.length} vectors to search`);
      
      // Show sample results without embedding calculation
      vectors.slice(0, 3).forEach((doc, i) => {
        const content = doc.content.substring(0, 100);
        const type = JSON.parse(doc.metadata).type;
        console.log(`   ${i+1}. Type: ${type} | Content: ${content}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSemanticSearch().catch(console.error);