/**
 * 🚀 Full Database Vectorization 
 * Wektoryzuje całą bazę danych dla organizacji
 */
const { PrismaClient } = require('@prisma/client');

async function fullVectorization() {
  const prisma = new PrismaClient();
  
  try {
    const orgId = '8e14a6f5-470f-415d-9efb-0a655dd7a1df';
    
    console.log('🚀 Starting FULL DATABASE VECTORIZATION...');
    console.log(`🎯 Organization: ${orgId}\n`);
    
    // Clear existing vectors first
    console.log('🗑️ Clearing existing vectors...');
    await prisma.$executeRaw`DELETE FROM vectors WHERE metadata->>'organizationId' = ${orgId}`;
    
    let totalVectorized = 0;
    let totalFailed = 0;
    
    // 1. MESSAGES (Communication)
    console.log('\n📧 Vectorizing MESSAGES...');
    const messages = await prisma.$queryRaw`
      SELECT id, subject, content, "fromName", "fromAddress", "urgencyScore", 
             priority, "actionNeeded", "messageType", "organizationId",
             "receivedAt", "sentAt", "createdAt"
      FROM messages 
      WHERE "organizationId" = ${orgId}
      ORDER BY "createdAt" DESC
    `;
    
    for (const msg of messages) {
      try {
        let content = `Wiadomość: ${msg.subject || 'Bez tematu'}\n`;
        if (msg.fromName || msg.fromAddress) {
          content += `Od: ${msg.fromName || msg.fromAddress}\n`;
        }
        if (msg.content) {
          content += `Treść: ${msg.content.substring(0, 800)}\n`;
        }
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'communication',
          entityId: msg.id,
          userId: '',
          organizationId: msg.organizationId,
          createdAt: msg.receivedAt || msg.sentAt || msg.createdAt,
          updatedAt: new Date(),
          source: 'email',
          tags: [msg.messageType, msg.priority].filter(Boolean),
          importance: msg.urgencyScore || 5
        };
        
        await insertVector(`comm_${msg.id}`, content, metadata, embedding);
        totalVectorized++;
      } catch (error) {
        console.error(`❌ Failed to vectorize message ${msg.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Messages: ${totalVectorized} vectorized`);
    
    // 2. TASKS
    console.log('\n✅ Vectorizing TASKS...');
    const tasks = await prisma.$queryRaw`
      SELECT t.id, t.title, t.description, t.status, t.priority, t."dueDate",
             t."organizationId", t."createdAt", t."updatedAt",
             p.name as project_name,
             u."firstName", u."lastName"
      FROM tasks t
      LEFT JOIN projects p ON t."projectId" = p.id
      LEFT JOIN users u ON t."assignedToId" = u.id
      WHERE t."organizationId" = ${orgId}
    `;
    
    let taskCount = 0;
    for (const task of tasks) {
      try {
        let content = `Zadanie: ${task.title}\n`;
        if (task.description) content += `Opis: ${task.description}\n`;
        content += `Status: ${task.status}\nPriorytet: ${task.priority}\n`;
        if (task.project_name) content += `Projekt: ${task.project_name}\n`;
        if (task.firstName || task.lastName) {
          content += `Przypisane do: ${task.firstName || ''} ${task.lastName || ''}\n`;
        }
        if (task.dueDate) content += `Termin: ${new Date(task.dueDate).toLocaleDateString('pl-PL')}\n`;
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'task',
          entityId: task.id,
          userId: '',
          organizationId: task.organizationId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          source: 'internal',
          tags: [task.status, task.priority].filter(Boolean),
          importance: task.priority === 'HIGH' ? 8 : task.priority === 'MEDIUM' ? 6 : 4
        };
        
        await insertVector(`task_${task.id}`, content, metadata, embedding);
        taskCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize task ${task.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Tasks: ${taskCount} vectorized`);
    totalVectorized += taskCount;
    
    // 3. PROJECTS
    console.log('\n🎯 Vectorizing PROJECTS...');
    const projects = await prisma.$queryRaw`
      SELECT p.id, p.name, p.description, p.status, p.priority,
             p."organizationId", p."createdAt", p."updatedAt",
             u."firstName", u."lastName"
      FROM projects p
      LEFT JOIN users u ON p."createdById" = u.id
      WHERE p."organizationId" = ${orgId}
    `;
    
    let projectCount = 0;
    for (const project of projects) {
      try {
        let content = `Projekt: ${project.name}\n`;
        if (project.description) content += `Opis: ${project.description}\n`;
        content += `Status: ${project.status}\nPriorytet: ${project.priority}\n`;
        if (project.firstName || project.lastName) {
          content += `Utworzony przez: ${project.firstName || ''} ${project.lastName || ''}\n`;
        }
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'project',
          entityId: project.id,
          userId: '',
          organizationId: project.organizationId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          source: 'internal',
          tags: [project.status, project.priority].filter(Boolean),
          importance: project.priority === 'HIGH' ? 9 : project.priority === 'MEDIUM' ? 7 : 5
        };
        
        await insertVector(`project_${project.id}`, content, metadata, embedding);
        projectCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize project ${project.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Projects: ${projectCount} vectorized`);
    totalVectorized += projectCount;
    
    // 4. CONTACTS
    console.log('\n👥 Vectorizing CONTACTS...');
    const contacts = await prisma.$queryRaw`
      SELECT id, "firstName", "lastName", email, phone, position, company,
             status, notes, "organizationId", "createdAt", "updatedAt"
      FROM contacts
      WHERE "organizationId" = ${orgId}
    `;
    
    let contactCount = 0;
    for (const contact of contacts) {
      try {
        let content = `Kontakt: ${contact.firstName || ''} ${contact.lastName || ''}\n`;
        if (contact.email) content += `Email: ${contact.email}\n`;
        if (contact.phone) content += `Telefon: ${contact.phone}\n`;
        if (contact.position) content += `Stanowisko: ${contact.position}\n`;
        if (contact.company) content += `Firma: ${contact.company}\n`;
        if (contact.notes) content += `Notatki: ${contact.notes}\n`;
        content += `Status: ${contact.status}\n`;
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'contact',
          entityId: contact.id,
          userId: '',
          organizationId: contact.organizationId,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
          source: 'internal',
          tags: [contact.status, contact.position].filter(Boolean),
          importance: 6
        };
        
        await insertVector(`contact_${contact.id}`, content, metadata, embedding);
        contactCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize contact ${contact.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Contacts: ${contactCount} vectorized`);
    totalVectorized += contactCount;
    
    // 5. COMPANIES
    console.log('\n🏢 Vectorizing COMPANIES...');
    const companies = await prisma.$queryRaw`
      SELECT id, name, description, industry, website, phone, email,
             "organizationId", "createdAt", "updatedAt"
      FROM companies
      WHERE "organizationId" = ${orgId}
    `;
    
    let companyCount = 0;
    for (const company of companies) {
      try {
        let content = `Firma: ${company.name}\n`;
        if (company.description) content += `Opis: ${company.description}\n`;
        if (company.industry) content += `Branża: ${company.industry}\n`;
        if (company.website) content += `Strona: ${company.website}\n`;
        if (company.email) content += `Email: ${company.email}\n`;
        if (company.phone) content += `Telefon: ${company.phone}\n`;
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'company',
          entityId: company.id,
          userId: '',
          organizationId: company.organizationId,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          source: 'internal',
          tags: [company.industry].filter(Boolean),
          importance: 7
        };
        
        await insertVector(`company_${company.id}`, content, metadata, embedding);
        companyCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize company ${company.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Companies: ${companyCount} vectorized`);
    totalVectorized += companyCount;
    
    // 6. DEALS
    console.log('\n💰 Vectorizing DEALS...');
    const deals = await prisma.$queryRaw`
      SELECT d.id, d.title, d.description, d.amount, d.status, d.stage,
             d."organizationId", d."createdAt", d."updatedAt",
             c.name as company_name,
             co."firstName", co."lastName"
      FROM deals d
      LEFT JOIN companies c ON d."companyId" = c.id
      LEFT JOIN contacts co ON d."contactId" = co.id
      WHERE d."organizationId" = ${orgId}
    `;
    
    let dealCount = 0;
    for (const deal of deals) {
      try {
        let content = `Deal: ${deal.title}\n`;
        if (deal.description) content += `Opis: ${deal.description}\n`;
        if (deal.amount) content += `Wartość: ${deal.amount} PLN\n`;
        content += `Status: ${deal.status}\nEtap: ${deal.stage}\n`;
        if (deal.company_name) content += `Firma: ${deal.company_name}\n`;
        if (deal.firstName || deal.lastName) {
          content += `Kontakt: ${deal.firstName || ''} ${deal.lastName || ''}\n`;
        }
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'deal',
          entityId: deal.id,
          userId: '',
          organizationId: deal.organizationId,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          source: 'internal',
          tags: [deal.status, deal.stage].filter(Boolean),
          importance: 9 // Deals are very important
        };
        
        await insertVector(`deal_${deal.id}`, content, metadata, embedding);
        dealCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize deal ${deal.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Deals: ${dealCount} vectorized`);
    totalVectorized += dealCount;
    
    // 7. KNOWLEDGE BASE
    console.log('\n📚 Vectorizing KNOWLEDGE BASE...');
    const knowledge = await prisma.$queryRaw`
      SELECT id, title, content, category, tags,
             "organizationId", "createdAt", "updatedAt"
      FROM knowledge_base
      WHERE "organizationId" = ${orgId}
    `;
    
    let knowledgeCount = 0;
    for (const kb of knowledge) {
      try {
        let content = `Wiedza: ${kb.title}\n`;
        if (kb.content) content += `Treść: ${kb.content.substring(0, 1000)}\n`;
        if (kb.category) content += `Kategoria: ${kb.category}\n`;
        if (kb.tags) content += `Tagi: ${kb.tags}\n`;
        
        const embedding = generateFakeEmbedding(content);
        const metadata = {
          type: 'knowledge',
          entityId: kb.id,
          userId: '',
          organizationId: kb.organizationId,
          createdAt: kb.createdAt,
          updatedAt: kb.updatedAt,
          source: 'internal',
          tags: [kb.category, ...(kb.tags ? kb.tags.split(',') : [])].filter(Boolean),
          importance: 8 // Knowledge is important
        };
        
        await insertVector(`knowledge_${kb.id}`, content, metadata, embedding);
        knowledgeCount++;
      } catch (error) {
        console.error(`❌ Failed to vectorize knowledge ${kb.id}:`, error.message);
        totalFailed++;
      }
    }
    console.log(`✅ Knowledge: ${knowledgeCount} vectorized`);
    totalVectorized += knowledgeCount;
    
    // FINAL STATS
    console.log(`\n🎉 FULL VECTORIZATION COMPLETED!`);
    console.log(`✅ Total vectorized: ${totalVectorized}`);
    console.log(`❌ Total failed: ${totalFailed}`);
    console.log(`📊 Success rate: ${((totalVectorized / (totalVectorized + totalFailed)) * 100).toFixed(1)}%`);
    
    // Verify in database
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors WHERE metadata->>'organizationId' = ${orgId}`;
    console.log(`🔍 Vectors in database: ${finalCount[0]?.count}`);
    
    async function insertVector(id, content, metadata, embedding) {
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
    
    function generateFakeEmbedding(text) {
      // Create more realistic fake embedding based on text content
      const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      return Array(1536).fill(0).map((_, i) => 
        (Math.sin(i * hash * 0.01) + Math.cos(i * text.length * 0.01) + Math.random() - 0.5) * 0.1
      );
    }
    
  } catch (error) {
    console.error('❌ Full vectorization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullVectorization().catch(console.error);