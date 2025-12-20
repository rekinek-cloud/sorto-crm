/**
 * 🧪 Test Real Data Migration - tylko Messages
 * Szybki test migracji prawdziwych danych do systemu RAG
 */
const { PrismaClient } = require('@prisma/client');

async function insertVector(id, content, metadata, embedding, prisma) {
  await prisma.$executeRaw`
    INSERT INTO vectors (
      id, content, metadata, embedding_data, created_at, updated_at
    ) VALUES (
      ${id},
      ${content.trim()},
      ${JSON.stringify(metadata)}::jsonb,
      ${JSON.stringify(embedding)},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      embedding_data = EXCLUDED.embedding_data,
      updated_at = NOW()
  `;
}

async function testRealDataMigration() {
  const prisma = new PrismaClient();
  
  try {
    // Znajdź organizację z danymi
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('🏢 Dostępne organizacje z wiadomościami:');
    orgs.forEach((org, i) => {
      console.log(`${i + 1}. ${org.name} - ${org._count.messages} wiadomości`);
    });
    
    const targetOrg = orgs.find(org => org._count.messages > 0);
    if (!targetOrg) {
      console.log('❌ Brak organizacji z wiadomościami');
      return;
    }
    
    console.log(`\n🎯 Testowanie organizacji: ${targetOrg.name}`);
    console.log(`📧 Wiadomości: ${targetOrg._count.messages}`);
    
    // Wyczyść stare wektory dla tej organizacji (tylko test)
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM vectors WHERE metadata->>'organizationId' = ${targetOrg.id} AND metadata->>'type' = 'message'
    `;
    console.log(`🗑️ Usunięto ${deleteResult} starych wektorów message`);
    
    // Pobierz próbkę wiadomości
    const messages = await prisma.message.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        contact: {
          select: { firstName: true, lastName: true, email: true }
        },
        company: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Tylko 10 pierwszych dla testu
    });
    
    console.log(`\n📧 Przetwarzanie ${messages.length} wiadomości...`);
    
    let vectorized = 0;
    let failed = 0;
    
    for (const msg of messages) {
      try {
        let title = msg.subject || 'Wiadomość bez tematu';
        let content = `Temat: ${msg.subject || 'Brak tematu'}\n`;
        
        if (msg.fromName || msg.fromAddress) {
          content += `Od: ${msg.fromName || msg.fromAddress}\n`;
        }
        
        if (msg.contact) {
          content += `Kontakt: ${msg.contact.firstName} ${msg.contact.lastName} (${msg.contact.email})\n`;
        }
        
        if (msg.company) {
          content += `Firma: ${msg.company.name}\n`;
        }
        
        if (msg.content) {
          const cleanContent = msg.content.replace(/<[^>]*>/g, '').trim();
          content += `Treść: ${cleanContent.substring(0, 500)}...\n`;
        }
        
        content += `Priorytet: ${msg.priority || 'MEDIUM'}\n`;
        content += `Typ: ${msg.messageType || 'EMAIL'}\n`;
        
        if (msg.urgencyScore) {
          content += `Pilność: ${msg.urgencyScore}/10\n`;
        }
        
        // Generuj spójny embedding
        const embedding = generateConsistentEmbedding(content);
        
        await insertVector(`test_msg_${msg.id}`, content, {
          type: 'message',
          entityId: msg.id,
          entityType: 'MESSAGE',
          organizationId: targetOrg.id,
          userId: msg.userId || null,
          source: msg.messageType || 'EMAIL',
          title: title.substring(0, 255),
          language: 'pl',
          urgencyScore: msg.urgencyScore || 5,
          priority: msg.priority || 'MEDIUM',
          actionNeeded: msg.actionNeeded || false,
          createdAt: msg.receivedAt || msg.sentAt || msg.createdAt,
          updatedAt: new Date(),
          importance: msg.urgencyScore || 5
        }, embedding, prisma);
        
        vectorized++;
        console.log(`✅ ${vectorized}/${messages.length} - ${title.substring(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Błąd message ${msg.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n🎉 TEST MIGRACJI ZAKOŃCZONY!`);
    console.log(`✅ Zwektoryzowano: ${vectorized}`);
    console.log(`❌ Błędy: ${failed}`);
    console.log(`📊 Sukces: ${((vectorized / messages.length) * 100).toFixed(1)}%`);
    
    // Weryfikacja w bazie
    const vectorCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM vectors 
      WHERE metadata->>'organizationId' = ${targetOrg.id} 
      AND metadata->>'type' = 'message'
    `;
    console.log(`🔍 Wektory w bazie: ${vectorCount[0]?.count}`);
    
    // Przykład wyszukiwania
    console.log('\n🔍 Test wyszukiwania...');
    const searchQuery = 'pilne zadanie';
    const searchEmbedding = generateConsistentEmbedding(searchQuery);
    
    const searchResults = await prisma.$queryRaw`
      SELECT id, metadata->>'title' as title, metadata->>'urgencyScore' as urgency
      FROM vectors 
      WHERE metadata->>'organizationId' = ${targetOrg.id} 
      AND metadata->>'type' = 'message'
      LIMIT 5
    `;
    
    console.log(`Znaleziono ${searchResults.length} wektorów:`);
    searchResults.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title} (urgency: ${result.urgency})`);
    });
    
  } catch (error) {
    console.error('❌ Test nie powiódł się:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Utility functions
function generateConsistentEmbedding(text) {
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Array(1536).fill(0).map((_, i) => 
    (Math.sin(i * hash * 0.001) + Math.cos(i * text.length * 0.01) + (hash % 100) * 0.001) * 0.1
  );
}

testRealDataMigration().catch(console.error);