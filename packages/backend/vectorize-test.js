/**
 * 🧠 Manual vectorization test with fake embeddings
 */
const { PrismaClient } = require('@prisma/client');

async function runVectorization() {
  const prisma = new PrismaClient();
  
  try {
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    console.log('🚀 Starting vectorization for communications...');
    
    // Get communications from messages table
    const communications = await prisma.messages.findMany({
      where: { organizationId: orgId },
      include: {
        channel: { select: { name: true, type: true } },
        attachments: { select: { fileName: true } },
        contact: { select: { firstName: true, lastName: true, email: true } },
        company: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Process 20 messages first
    });
    
    console.log(`📊 Found ${communications.length} communications to vectorize`);
    
    let successful = 0;
    let failed = 0;
    
    for (const comm of communications) {
      try {
        // Format communication content
        let content = `Wiadomość: ${comm.subject || 'Bez tematu'}\n`;
        
        if (comm.channel?.name) {
          content += `Kanał: ${comm.channel.name} (${comm.channel.type})\n`;
        }
        
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
        
        // Create fake embedding (1536 dimensions)
        const fakeEmbedding = Array(1536).fill(0).map(() => Math.random() - 0.5);
        
        const vectorId = `comm_${comm.id}`;
        const metadata = {
          type: 'communication',
          entityId: comm.id,
          userId: '',
          organizationId: comm.organizationId,
          createdAt: comm.receivedAt || comm.sentAt || new Date(),
          updatedAt: comm.receivedAt || comm.sentAt || new Date(),
          source: comm.channel?.type || 'unknown',
          tags: [comm.channel?.name, comm.messageType, comm.priority, comm.actionNeeded ? 'action' : ''].filter(Boolean),
          importance: comm.priority === 'HIGH' ? 8 : comm.priority === 'URGENT' ? 10 : 5
        };
        
        await prisma.$executeRaw`
          INSERT INTO vectors (
            id, content, metadata, embedding_data, created_at, updated_at
          ) VALUES (
            ${vectorId},
            ${content.trim()},
            ${JSON.stringify(metadata)},
            ${JSON.stringify(fakeEmbedding)},
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
        
        if (successful % 5 === 0) {
          console.log(`   Processed ${successful}/${communications.length} messages...`);
        }
        
      } catch (error) {
        console.error(`Failed to vectorize message ${comm.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n✅ Vectorization completed: ${successful} successful, ${failed} failed`);
    
    // Test search now
    console.log('\n🔍 Testing vectors...');
    const testResults = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors`;
    console.log('Total vectors now:', testResults[0]?.count);
    
    // Show sample vectors
    const samples = await prisma.$queryRaw`SELECT id, content FROM vectors LIMIT 3`;
    console.log('\n📝 Sample vectors:');
    samples.forEach((vec, i) => {
      console.log(`${i+1}. ID: ${vec.id}`);
      console.log(`   Content: ${vec.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('❌ Vectorization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runVectorization().catch(console.error);