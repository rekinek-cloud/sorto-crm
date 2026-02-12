/**
 * Simple RAG Search Test
 * Tests vector_documents directly without VectorService
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';

/**
 * Generate mock embedding (same as in reindex script)
 */
function generateMockEmbedding(text) {
  const dimension = 1536;
  const embedding = [];
  const hash = crypto.createHash('sha256').update(text).digest();

  for (let i = 0; i < dimension; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

async function testRAG() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🔍 RAG SEARCH TEST (Simple)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check vector_documents count
  const count = await prisma.vector_documents.count({
    where: { organizationId: ORG_ID }
  });
  console.log(`📊 Total vector documents: ${count}\n`);

  if (count === 0) {
    console.log('❌ No vector documents found. Run reindex-rag-fix.js first.');
    await prisma.$disconnect();
    return;
  }

  // Get all documents
  const documents = await prisma.vector_documents.findMany({
    where: { organizationId: ORG_ID },
    select: {
      id: true,
      title: true,
      content: true,
      entityType: true,
      embedding: true
    }
  });

  console.log(`📄 Loaded ${documents.length} documents\n`);

  // Sample searches
  const queries = [
    'marketing',
    'zadania do wykonania',
    'kontakt email',
    'projekt development'
  ];

  for (const query of queries) {
    console.log(`\n🔎 Search: "${query}"`);
    console.log('─'.repeat(50));

    const startTime = Date.now();
    const queryEmbedding = generateMockEmbedding(query);

    // Calculate similarities
    const results = documents
      .map(doc => ({
        ...doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
      }))
      .filter(doc => doc.similarity >= 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const searchTime = Date.now() - startTime;

    if (results.length === 0) {
      console.log('   No results (similarity >= 0.3)');
    } else {
      for (const r of results) {
        console.log(`   • ${r.title.substring(0, 40)}... (${r.entityType}) - ${(r.similarity * 100).toFixed(1)}%`);
      }
    }
    console.log(`   ⏱️  Search time: ${searchTime}ms`);
  }

  // Summary by entity type
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Documents by type:');
  console.log('═══════════════════════════════════════════════════════════');

  const byType = {};
  for (const doc of documents) {
    byType[doc.entityType] = (byType[doc.entityType] || 0) + 1;
  }

  for (const [type, cnt] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${type}: ${cnt}`);
  }

  console.log('\n✅ RAG Test Complete\n');

  await prisma.$disconnect();
}

testRAG().catch(console.error);
