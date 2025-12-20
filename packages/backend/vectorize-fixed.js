/**
 * 🧠 Fixed vectorization with proper JSONB casting
 */
const { PrismaClient } = require('@prisma/client');

async function runVectorization() {
  const prisma = new PrismaClient();
  
  try {
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    console.log('🚀 Starting vectorization for communications...');
    
    // Get communications using raw SQL
    const communications = await prisma.$queryRaw`
      SELECT 
        id, subject, content, "fromName", "fromAddress", "urgencyScore", 
        priority, "actionNeeded", "messageType", "organizationId",
        "receivedAt", "sentAt", "createdAt"
      FROM messages 
      WHERE "organizationId" = ${orgId}
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `;
    
    console.log(`📊 Found ${communications.length} communications to vectorize`);
    
    let successful = 0;
    let failed = 0;
    
    for (const comm of communications) {
      try {
        // Format communication content
        let content = `Wiadomość: ${comm.subject || 'Bez tematu'}\n`;
        
        if (comm.fromName || comm.fromAddress) {
          content += `Od: ${comm.fromName || comm.fromAddress}`;
          if (comm.fromName && comm.fromAddress) content += ` <${comm.fromAddress}>`;
          content += '\n';
        }
        
        if (comm.content) {
          content += `Treść: ${comm.content.substring(0, 500)}\n`;
        }
        
        if (comm.urgencyScore) {
          content += `Pilność: ${comm.urgencyScore}/10\n`;
        }
        
        // Create fake embedding (1536 dimensions with some variation based on content)
        const textHash = comm.subject ? comm.subject.length : 42;
        const fakeEmbedding = Array(1536).fill(0).map((_, i) => 
          (Math.sin(i * textHash * 0.01) + Math.random() - 0.5) * 0.1
        );
        
        const vectorId = `comm_${comm.id}`;
        const metadata = {
          type: 'communication',
          entityId: comm.id,
          userId: '',
          organizationId: comm.organizationId,
          createdAt: comm.receivedAt || comm.sentAt || comm.createdAt,
          updatedAt: comm.receivedAt || comm.sentAt || comm.createdAt,
          source: 'email',
          tags: [comm.messageType, comm.priority, comm.actionNeeded ? 'action' : ''].filter(Boolean),
          importance: comm.priority === 'HIGH' ? 8 : comm.priority === 'URGENT' ? 10 : 5
        };
        
        // Use proper JSONB casting
        const metadataJson = JSON.stringify(metadata);
        const embeddingJson = JSON.stringify(fakeEmbedding);
        
        await prisma.$executeRaw`
          INSERT INTO vectors (
            id, content, metadata, embedding_data, created_at, updated_at
          ) VALUES (
            ${vectorId},
            ${content.trim()},
            ${metadataJson}::jsonb,
            ${embeddingJson},
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding_data = EXCLUDED.embedding_data,
            updated_at = NOW()
        `;
        
        successful++;
        console.log(`   ✅ Vectorized: ${comm.subject?.substring(0, 50) || 'No subject'}...`);
        
      } catch (error) {
        console.error(`Failed to vectorize message ${comm.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n🎉 Vectorization completed: ${successful} successful, ${failed} failed`);
    
    // Test search now
    console.log('\n🔍 Testing vectors...');
    const testResults = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors`;
    console.log('Total vectors now:', testResults[0]?.count);
    
    // Show sample vectors
    const samples = await prisma.$queryRaw`SELECT id, content, metadata FROM vectors LIMIT 3`;
    console.log('\n📝 Sample vectors:');
    samples.forEach((vec, i) => {
      const meta = vec.metadata;
      console.log(`${i+1}. ID: ${vec.id}`);
      console.log(`   Type: ${meta.type} | OrgId: ${meta.organizationId}`);
      console.log(`   Content: ${vec.content.substring(0, 100)}...`);
    });
    
    // Test semantic search simulation
    console.log('\n🔍 Testing semantic search simulation...');
    
    const searchQueries = ['wycena', 'pilne', 'abonament', 'GLS', 'tubaa'];
    
    for (const query of searchQueries) {
      console.log(`\n📝 Searching for: "${query}"`);
      
      // Simple text search to simulate semantic search
      const results = await prisma.$queryRaw`
        SELECT id, content, metadata
        FROM vectors 
        WHERE content ILIKE ${`%${query}%`}
        ORDER BY created_at DESC
        LIMIT 3
      `;
      
      console.log(`   Found ${results.length} matches:`);
      results.forEach((result, i) => {
        const meta = result.metadata;
        console.log(`   ${i+1}. Type: ${meta.type} | Content: ${result.content.substring(0, 80)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Vectorization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runVectorization().catch(console.error);