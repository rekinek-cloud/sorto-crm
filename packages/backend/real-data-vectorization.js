/**
 * 🚀 Real Database to VectorDocument Migration
 * Przenosi prawdziwe dane z bazy PostgreSQL do systemu RAG VectorDocument
 * Zastępuje fake embeddings prawdziwymi danymi organizacji
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

async function realDataVectorization() {
  const prisma = new PrismaClient();
  
  try {
    // Znajdź organizację z prawdziwymi danymi
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tasks: true,
            projects: true,
            contacts: true,
            companies: true,
            deals: true,
            messages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n🏢 Dostępne organizacje:');
    orgs.forEach((org, i) => {
      const total = Object.values(org._count).reduce((sum, count) => sum + count, 0);
      console.log(`${i + 1}. ${org.name} (${org.id})`);
      console.log(`   📊 Dane: ${total} rekordów (T:${org._count.tasks}, P:${org._count.projects}, C:${org._count.contacts}, F:${org._count.companies}, D:${org._count.deals}, M:${org._count.messages})`);
    });
    
    if (orgs.length === 0) {
      console.log('❌ Brak organizacji z danymi');
      return;
    }
    
    // Wybierz organizację z największą ilością danych
    const targetOrg = orgs.reduce((max, org) => {
      const maxTotal = Object.values(max._count).reduce((sum, count) => sum + count, 0);
      const orgTotal = Object.values(org._count).reduce((sum, count) => sum + count, 0);
      return orgTotal > maxTotal ? org : max;
    });
    
    console.log(`\n🎯 Wybrana organizacja: ${targetOrg.name}`);
    console.log(`📋 ID: ${targetOrg.id}`);
    
    // Wyczyść istniejące wektory dla tej organizacji
    console.log('\n🗑️ Czyszczenie starych wektorów...');
    const deletedCount = await prisma.$executeRaw`
      DELETE FROM vectors WHERE metadata->>'organizationId' = ${targetOrg.id}
    `;
    console.log(`🗑️ Usunięto ${deletedCount} starych wektorów`);
    
    let totalVectorized = 0;
    let totalFailed = 0;
    
    // 1. MESSAGES - Komunikacja
    console.log('\n📧 Przetwarzanie MESSAGES...');
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
      take: 500 // Limit dla performance
    });
    
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
          // Limit treści do 2000 znaków
          const cleanContent = msg.content.replace(/<[^>]*>/g, '').trim();
          content += `Treść: ${cleanContent.substring(0, 2000)}\n`;
        }
        
        content += `Priorytet: ${msg.priority || 'MEDIUM'}\n`;
        content += `Typ: ${msg.messageType || 'EMAIL'}\n`;
        
        if (msg.urgencyScore) {
          content += `Pilność: ${msg.urgencyScore}/10\n`;
        }
        
        // Generuj hash dla embedding (tymczasowo)
        const embedding = generateConsistentEmbedding(content);
        
        await insertVector(`msg_${msg.id}`, content, {
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
          createdAt: msg.receivedAt || msg.sentAt || msg.createdAt,
          updatedAt: new Date(),
          importance: msg.urgencyScore || 5
        }, embedding, prisma);
        
        totalVectorized++;
      } catch (error) {
        console.error(`❌ Błąd message ${msg.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Messages: ${messages.length} przetworzone → ${totalVectorized} wektorów`);
    
    // 2. TASKS - Zadania
    console.log('\n✅ Przetwarzanie TASKS...');
    const tasks = await prisma.task.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        project: {
          select: { name: true }
        },
        assignedTo: {
          select: { firstName: true, lastName: true }
        },
        context: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    });
    
    let taskCount = 0;
    for (const task of tasks) {
      try {
        let title = task.title;
        let content = `Zadanie: ${task.title}\n`;
        
        if (task.description) {
          content += `Opis: ${task.description}\n`;
        }
        
        content += `Status: ${task.status}\n`;
        content += `Priorytet: ${task.priority}\n`;
        
        if (task.project) {
          content += `Projekt: ${task.project.name}\n`;
        }
        
        if (task.assignedTo) {
          content += `Przypisane do: ${task.assignedTo.firstName} ${task.assignedTo.lastName}\n`;
        }
        
        if (task.context) {
          content += `Kontekst: ${task.context.name}\n`;
        }
        
        if (task.dueDate) {
          content += `Termin: ${new Date(task.dueDate).toLocaleDateString('pl-PL')}\n`;
        }
        
        if (task.estimatedTime) {
          content += `Szacowany czas: ${task.estimatedTime} min\n`;
        }
        
        const embedding = generateConsistentEmbedding(content);
        
        await prisma.vectorDocument.create({
          data: {
            title: title.substring(0, 255),
            content: content,
            contentHash: generateContentHash(content),
            embedding: embedding,
            entityType: 'TASK',
            entityId: task.id,
            source: 'INTERNAL',
            processingModel: 'hash-based-v1',
            organizationId: targetOrg.id,
            language: 'pl',
            chunkIndex: 0,
            totalChunks: 1
          }
        });
        
        taskCount++;
      } catch (error) {
        console.error(`❌ Błąd task ${task.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Tasks: ${tasks.length} przetworzone → ${taskCount} wektorów`);
    totalVectorized += taskCount;
    
    // 3. PROJECTS - Projekty
    console.log('\n🎯 Przetwarzanie PROJECTS...');
    const projects = await prisma.project.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true }
        },
        tasks: {
          select: { id: true, title: true, status: true },
          take: 10
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 500
    });
    
    let projectCount = 0;
    for (const project of projects) {
      try {
        let title = project.name;
        let content = `Projekt: ${project.name}\n`;
        
        if (project.description) {
          content += `Opis: ${project.description}\n`;
        }
        
        content += `Status: ${project.status}\n`;
        content += `Priorytet: ${project.priority}\n`;
        
        if (project.createdBy) {
          content += `Utworzony przez: ${project.createdBy.firstName} ${project.createdBy.lastName}\n`;
        }
        
        if (project.startDate) {
          content += `Data rozpoczęcia: ${new Date(project.startDate).toLocaleDateString('pl-PL')}\n`;
        }
        
        if (project.endDate) {
          content += `Data zakończenia: ${new Date(project.endDate).toLocaleDateString('pl-PL')}\n`;
        }
        
        if (project.tasks && project.tasks.length > 0) {
          content += `Zadania (${project.tasks.length}): `;
          content += project.tasks.map(t => `${t.title} (${t.status})`).join(', ') + '\n';
        }
        
        const embedding = generateConsistentEmbedding(content);
        
        await prisma.vectorDocument.create({
          data: {
            title: title.substring(0, 255),
            content: content,
            contentHash: generateContentHash(content),
            embedding: embedding,
            entityType: 'PROJECT',
            entityId: project.id,
            source: 'INTERNAL',
            processingModel: 'hash-based-v1',
            organizationId: targetOrg.id,
            language: 'pl',
            chunkIndex: 0,
            totalChunks: 1
          }
        });
        
        projectCount++;
      } catch (error) {
        console.error(`❌ Błąd project ${project.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Projects: ${projects.length} przetworzone → ${projectCount} wektorów`);
    totalVectorized += projectCount;
    
    // 4. CONTACTS - Kontakty
    console.log('\n👥 Przetwarzanie CONTACTS...');
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    });
    
    let contactCount = 0;
    for (const contact of contacts) {
      try {
        let title = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Kontakt';
        let content = `Kontakt: ${contact.firstName || ''} ${contact.lastName || ''}\n`;
        
        if (contact.email) {
          content += `Email: ${contact.email}\n`;
        }
        
        if (contact.phone) {
          content += `Telefon: ${contact.phone}\n`;
        }
        
        if (contact.position) {
          content += `Stanowisko: ${contact.position}\n`;
        }
        
        if (contact.company) {
          content += `Firma: ${contact.company.name}\n`;
        }
        
        if (contact.notes) {
          content += `Notatki: ${contact.notes.substring(0, 500)}\n`;
        }
        
        content += `Status: ${contact.status}\n`;
        
        const embedding = generateConsistentEmbedding(content);
        
        await prisma.vectorDocument.create({
          data: {
            title: title.substring(0, 255),
            content: content,
            contentHash: generateContentHash(content),
            embedding: embedding,
            entityType: 'CONTACT',
            entityId: contact.id,
            source: 'INTERNAL',
            processingModel: 'hash-based-v1',
            organizationId: targetOrg.id,
            language: 'pl',
            chunkIndex: 0,
            totalChunks: 1
          }
        });
        
        contactCount++;
      } catch (error) {
        console.error(`❌ Błąd contact ${contact.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Contacts: ${contacts.length} przetworzone → ${contactCount} wektorów`);
    totalVectorized += contactCount;
    
    // 5. COMPANIES - Firmy
    console.log('\n🏢 Przetwarzanie COMPANIES...');
    const companies = await prisma.company.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        contacts: {
          select: { firstName: true, lastName: true, position: true },
          take: 5
        },
        deals: {
          select: { title: true, amount: true, status: true },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 500
    });
    
    let companyCount = 0;
    for (const company of companies) {
      try {
        let title = company.name;
        let content = `Firma: ${company.name}\n`;
        
        if (company.description) {
          content += `Opis: ${company.description.substring(0, 800)}\n`;
        }
        
        if (company.industry) {
          content += `Branża: ${company.industry}\n`;
        }
        
        if (company.website) {
          content += `Strona: ${company.website}\n`;
        }
        
        if (company.email) {
          content += `Email: ${company.email}\n`;
        }
        
        if (company.phone) {
          content += `Telefon: ${company.phone}\n`;
        }
        
        if (company.contacts && company.contacts.length > 0) {
          content += `Kontakty: `;
          content += company.contacts.map(c => `${c.firstName} ${c.lastName} (${c.position || 'brak stanowiska'})`).join(', ') + '\n';
        }
        
        if (company.deals && company.deals.length > 0) {
          content += `Deals: `;
          content += company.deals.map(d => `${d.title} (${d.amount} PLN, ${d.status})`).join(', ') + '\n';
        }
        
        const embedding = generateConsistentEmbedding(content);
        
        await prisma.vectorDocument.create({
          data: {
            title: title.substring(0, 255),
            content: content,
            contentHash: generateContentHash(content),
            embedding: embedding,
            entityType: 'COMPANY',
            entityId: company.id,
            source: 'INTERNAL',
            processingModel: 'hash-based-v1',
            organizationId: targetOrg.id,
            language: 'pl',
            chunkIndex: 0,
            totalChunks: 1
          }
        });
        
        companyCount++;
      } catch (error) {
        console.error(`❌ Błąd company ${company.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Companies: ${companies.length} przetworzone → ${companyCount} wektorów`);
    totalVectorized += companyCount;
    
    // 6. DEALS - Transakcje
    console.log('\n💰 Przetwarzanie DEALS...');
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: targetOrg.id
      },
      include: {
        company: {
          select: { name: true }
        },
        contact: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 500
    });
    
    let dealCount = 0;
    for (const deal of deals) {
      try {
        let title = deal.title;
        let content = `Deal: ${deal.title}\n`;
        
        if (deal.description) {
          content += `Opis: ${deal.description.substring(0, 800)}\n`;
        }
        
        if (deal.amount) {
          content += `Wartość: ${deal.amount} PLN\n`;
        }
        
        content += `Status: ${deal.status}\n`;
        
        if (deal.stage) {
          content += `Etap: ${deal.stage}\n`;
        }
        
        if (deal.company) {
          content += `Firma: ${deal.company.name}\n`;
        }
        
        if (deal.contact) {
          content += `Kontakt: ${deal.contact.firstName} ${deal.contact.lastName}\n`;
        }
        
        if (deal.probability) {
          content += `Prawdopodobieństwo: ${deal.probability}%\n`;
        }
        
        if (deal.expectedCloseDate) {
          content += `Oczekiwane zamknięcie: ${new Date(deal.expectedCloseDate).toLocaleDateString('pl-PL')}\n`;
        }
        
        const embedding = generateConsistentEmbedding(content);
        
        await prisma.vectorDocument.create({
          data: {
            title: title.substring(0, 255),
            content: content,
            contentHash: generateContentHash(content),
            embedding: embedding,
            entityType: 'DEAL',
            entityId: deal.id,
            source: 'INTERNAL',
            processingModel: 'hash-based-v1',
            organizationId: targetOrg.id,
            language: 'pl',
            chunkIndex: 0,
            totalChunks: 1
          }
        });
        
        dealCount++;
      } catch (error) {
        console.error(`❌ Błąd deal ${deal.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Deals: ${deals.length} przetworzone → ${dealCount} wektorów`);
    totalVectorized += dealCount;
    
    // 7. KNOWLEDGE BASE - Baza wiedzy
    console.log('\n📚 Przetwarzanie KNOWLEDGE BASE...');
    const knowledge = await prisma.knowledgeBase.findMany({
      where: {
        organizationId: targetOrg.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 500
    });
    
    let knowledgeCount = 0;
    for (const kb of knowledge) {
      try {
        let title = kb.title;
        let content = `Wiedza: ${kb.title}\n`;
        
        if (kb.content) {
          // Podziel długą treść na chunki
          const cleanContent = kb.content.replace(/<[^>]*>/g, '').trim();
          const chunks = chunkText(cleanContent, 1500);
          
          for (let i = 0; i < chunks.length; i++) {
            const chunkContent = content + `Treść (część ${i + 1}/${chunks.length}): ${chunks[i]}\n`;
            
            if (kb.category) {
              chunkContent += `Kategoria: ${kb.category}\n`;
            }
            
            if (kb.tags) {
              chunkContent += `Tagi: ${kb.tags}\n`;
            }
            
            const embedding = generateConsistentEmbedding(chunkContent);
            
            await prisma.vectorDocument.create({
              data: {
                title: `${title} (część ${i + 1})`.substring(0, 255),
                content: chunkContent,
                contentHash: generateContentHash(chunkContent),
                embedding: embedding,
                entityType: 'KNOWLEDGE_BASE',
                entityId: kb.id,
                source: 'INTERNAL',
                processingModel: 'hash-based-v1',
                organizationId: targetOrg.id,
                language: 'pl',
                chunkIndex: i,
                totalChunks: chunks.length
              }
            });
            
            knowledgeCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Błąd knowledge ${kb.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Knowledge: ${knowledge.length} przetworzone → ${knowledgeCount} wektorów`);
    totalVectorized += knowledgeCount;
    
    // FINAL STATS
    console.log(`\n🎉 MIGRACJA DANYCH ZAKOŃCZONA!`);
    console.log(`✅ Łącznie zwektoryzowano: ${totalVectorized} dokumentów`);
    console.log(`❌ Błędy: ${totalFailed}`);
    console.log(`📊 Wskaźnik sukcesu: ${((totalVectorized / (totalVectorized + totalFailed)) * 100).toFixed(1)}%`);
    
    // Weryfikacja w bazie
    const finalCount = await prisma.vectorDocument.count({
      where: {
        organizationId: targetOrg.id
      }
    });
    console.log(`🔍 VectorDocuments w bazie: ${finalCount}`);
    
    // Statystyki według typu
    const typeStats = await prisma.vectorDocument.groupBy({
      by: ['entityType'],
      where: {
        organizationId: targetOrg.id
      },
      _count: {
        entityType: true
      }
    });
    
    console.log('\n📊 Rozkład według typu:');
    typeStats.forEach(stat => {
      console.log(`   ${stat.entityType}: ${stat._count.entityType} dokumentów`);
    });
    
  } catch (error) {
    console.error('❌ Migracja nie powiodła się:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Utility functions
function generateConsistentEmbedding(text) {
  // Generuj spójny hash-based embedding
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Array(1536).fill(0).map((_, i) => 
    (Math.sin(i * hash * 0.001) + Math.cos(i * text.length * 0.01) + (hash % 100) * 0.001) * 0.1
  );
}

function generateContentHash(content) {
  return content.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(16);
}

function chunkText(text, maxLength) {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxLength;
    
    // Znajdź najbliższy punkt podziału (spacja, kropka, przecinek)
    if (end < text.length) {
      const breakPoints = ['. ', ', ', ' ', '\n'];
      let bestBreak = end;
      
      for (const bp of breakPoints) {
        const pos = text.lastIndexOf(bp, end);
        if (pos > start + maxLength * 0.7) {
          bestBreak = pos + bp.length;
          break;
        }
      }
      end = bestBreak;
    }
    
    chunks.push(text.substring(start, end).trim());
    start = end;
  }
  
  return chunks;
}

// Uruchom migrację
realDataVectorization().catch(console.error);