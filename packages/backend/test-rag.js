/**
 * Test RAG Search
 */

const { PrismaClient } = require('@prisma/client');
const { VectorService } = require('./dist/services/VectorService');

const prisma = new PrismaClient();
const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';

async function testRAG() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🔍 RAG SEARCH TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check vector_documents count
  const count = await prisma.vector_documents.count({
    where: { organizationId: ORG_ID }
  });
  console.log(`📊 Total vector documents: ${count}\n`);

  if (count === 0) {
    console.log('❌ No vector documents found. Run reindex-rag-fix.js first.');
    return;
  }

  // Sample searches
  const queries = [
    'marketing',
    'zadania',
    'kontakt',
    'projekt'
  ];

  const vectorService = new VectorService(prisma);

  for (const query of queries) {
    console.log(`\n🔎 Search: "${query}"`);
    console.log('─'.repeat(50));

    try {
      const results = await vectorService.searchSimilar(ORG_ID, query, {
        limit: 3,
        threshold: 0.3
      });

      if (results.results.length === 0) {
        console.log('   No results found');
      } else {
        for (const r of results.results) {
          console.log(`   • ${r.title} (${r.entityType}) - similarity: ${(r.similarity * 100).toFixed(1)}%`);
        }
      }
      console.log(`   ⏱️  Search time: ${results.searchTime}ms | From cache: ${results.fromCache}`);
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ RAG Test Complete');
  console.log('═══════════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

testRAG();
