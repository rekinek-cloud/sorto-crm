const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCorrectedTables() {
  console.log('🔧 Wypełnianie tabel z poprawnymi nazwami pól...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 3 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    const companies = await prisma.company.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}\n`);

    // 1. EMAIL ANALYSIS - tylko podstawowe pola
    await seedIfEmpty('emailAnalysis', async () => {
      await prisma.emailAnalysis.createMany({
        data: [
          {
            organizationId: organization.id,
            emailFrom: 'client@example.com',
            emailSubject: 'Pilna sprawa - wycena',
            emailReceived: new Date('2024-12-25T10:00:00Z'),
            urgencyScore: 90,
            actionRequired: true,
            suggestedResponse: 'Natychmiastowa odpowiedź'
          }
        ]
      });
    });

    // 2. TIMELINE - podstawowe pola  
    await seedIfEmpty('timeline', async () => {
      await prisma.timeline.createMany({
        data: [
          {
            organizationId: organization.id,
            eventId: contacts[0]?.id || 'test-id',
            eventType: 'CONTACT',
            title: 'Pierwszy kontakt z klientem',
            startDate: new Date('2024-12-20T14:00:00Z'),
            relatedId: contacts[0]?.id || null,
            relatedType: 'CONTACT'
          }
        ]
      });
    });

    // 3. DELEGATED TASK - sprawdzenie pól
    if (users.length >= 2) {
      await seedIfEmpty('delegatedTask', async () => {
        await prisma.delegatedTask.createMany({
          data: [
            {
              organizationId: organization.id,
              description: 'Przygotowanie raportu Q4',
              delegatedTo: users[1].id,
              dueDate: new Date('2025-01-15'),
              priority: 'HIGH',
              status: 'PENDING'
            }
          ]
        });
      });
    }

    // 4. INVOICE - sprawdzenie wymaganych pól
    if (companies.length > 0) {
      await seedIfEmpty('invoice', async () => {
        await prisma.invoice.createMany({
          data: [
            {
              organizationId: organization.id,
              invoiceNumber: 'INV-2024-001',
              title: 'Faktura za wdrożenie CRM',
              amount: 15000.00,
              currency: 'PLN',
              status: 'SENT',
              issueDate: new Date('2024-12-20'),
              dueDate: new Date('2025-01-20')
            }
          ]
        });
      });
    }

    // 5. ORDER - sprawdzenie pól
    if (companies.length > 0) {
      await seedIfEmpty('order', async () => {
        await prisma.order.createMany({
          data: [
            {
              organizationId: organization.id,
              orderNumber: 'ORD-2024-001',
              title: 'Wdrożenie CRM Pro',
              customer: companies[0].name,
              status: 'PENDING',
              totalAmount: 15000.00,
              currency: 'PLN',
              orderDate: new Date('2024-12-15'),
              dueDate: new Date('2025-01-15')
            }
          ]
        });
      });
    }

    // 6. COMPLAINT - sprawdzenie pól
    if (contacts.length > 0) {
      await seedIfEmpty('complaint', async () => {
        await prisma.complaint.createMany({
          data: [
            {
              organizationId: organization.id,
              title: 'Problem z synchronizacją',
              customer: `${contacts[0].firstName} ${contacts[0].lastName}`,
              status: 'OPEN',
              priority: 'HIGH',
              reportedAt: new Date('2024-12-20')
            }
          ]
        });
      });
    }

    // 7. INFO - podstawowe pola
    await seedIfEmpty('info', async () => {
      await prisma.info.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Aktualizacja systemu CRM',
            content: 'Planowana aktualizacja do wersji 2.1',
            priority: 'MEDIUM',
            isPublic: true
          }
        ]
      });
    });

    // 8. RECOMMENDATION - podstawowe pola
    await seedIfEmpty('recommendation', async () => {
      await prisma.recommendation.createMany({
        data: [
          {
            organizationId: organization.id,
            content: 'Wdrożenie automatyzacji workflow',
            priority: 'HIGH',
            impact: 'HIGH',
            effort: 'MEDIUM',
            confidence: 85,
            source: 'AI_ANALYSIS',
            status: 'PENDING'
          }
        ]
      });
    });

    // 9. UNIMPORTANT - podstawowe pola
    await seedIfEmpty('unimportant', async () => {
      await prisma.unimportant.createMany({
        data: [
          {
            organizationId: organization.id,
            content: 'Newsletter spam - automatycznie oznaczony',
            archivedAt: new Date('2024-12-20'),
            reason: 'Newsletter spam'
          }
        ]
      });
    });

    // 10. FILE - sprawdzenie pól
    await seedIfEmpty('file', async () => {
      await prisma.file.createMany({
        data: [
          {
            organizationId: organization.id,
            fileName: 'CRM_Guide.pdf',
            fileType: 'application/pdf',
            urlPath: '/uploads/crm_guide.pdf',
            size: 2548576,
            category: 'DOCUMENT'
          }
        ]
      });
    });

    // 11. PROCESSING RULE - sprawdzenie pól  
    await seedIfEmpty('processingRule', async () => {
      await prisma.processingRule.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Auto-priorytet pilnych emaili',
            conditions: JSON.stringify({ subject: { contains: ['pilne'] } }),
            actions: JSON.stringify({ setPriority: 'HIGH' }),
            active: true,
            executionOrder: 1
          }
        ]
      });
    });

    // 12. SEARCH INDEX - podstawowe pola
    await seedIfEmpty('searchIndex', async () => {
      await prisma.searchIndex.createMany({
        data: [
          {
            organizationId: organization.id,
            entityType: 'DOCUMENT',
            entityId: '1',
            title: 'CRM Implementation Guide',
            content: 'Przewodnik wdrożenia systemu CRM',
            searchVector: 'crm:1 przewodnik:2'
          }
        ]
      });
    });

    // 13. VECTOR DOCUMENT - podstawowe pola
    await seedIfEmpty('vectorDocument', async () => {
      await prisma.vectorDocument.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'CRM Best Practices',
            content: 'Najlepsze praktyki CRM',
            contentHash: 'hash123456',
            entityType: 'DOCUMENT',
            entityId: '1',
            source: 'MANUAL_UPLOAD',
            lastUpdated: new Date()
          }
        ]
      });
    });

    // 14. EMAIL LOG - sprawdzenie pól array
    await seedIfEmpty('emailLog', async () => {
      await prisma.emailLog.createMany({
        data: [
          {
            organizationId: organization.id,
            messageId: 'msg_123456789',
            toAddresses: ['client@example.com'],
            subject: 'Welcome to CRM-GTD Smart!',
            success: true,
            sentAt: new Date('2024-12-25T10:00:00Z')
          }
        ]
      });
    });

    // 15. VECTOR CACHE - podstawowe pola
    await seedIfEmpty('vectorCache', async () => {
      await prisma.vectorCache.createMany({
        data: [
          {
            organizationId: organization.id,
            cacheKey: 'search:crm:hash123',
            queryText: 'wdrożenie CRM',
            results: JSON.stringify([{ id: '1', score: 0.89 }]),
            searchTime: 45,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        ]
      });
    });

    // 16. LEAD - sprawdzenie pól
    await seedIfEmpty('lead', async () => {
      await prisma.lead.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'TechStartup - CRM',
            email: 'anna@techstartup.pl',
            company: 'TechStartup',
            source: 'WEBSITE',
            status: 'NEW',
            score: 85
          }
        ]
      });
    });

    // 17. AREA OF RESPONSIBILITY - podstawowe pola
    await seedIfEmpty('areaOfResponsibility', async () => {
      await prisma.areaOfResponsibility.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Zarządzanie IT',
            description: 'Odpowiedzialność za IT',
            reviewFrequency: 'WEEKLY',
            isActive: true
          }
        ]
      });
    });

    // 18. KNOWLEDGE BASE - sprawdzenie pól
    await seedIfEmpty('knowledgeBase', async () => {
      await prisma.knowledgeBase.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Procedury CRM',
            content: 'Przewodnik procesów CRM',
            isPublic: true,
            version: '1.0'
          }
        ]
      });
    });

    // Pozostałe tabele wymagają dokładniejszej analizy schema
    console.log('\n🎯 Podstawowe tabele zostały wypełnione!');
    console.log('📋 Pozostałe tabele wymagają szczegółowej analizy pól...');

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName, seedFunction) {
  try {
    const organization = await prisma.organization.findFirst();
    const count = await prisma[tableName].count({ 
      where: { organizationId: organization.id } 
    });
    
    if (count === 0) {
      console.log(`🔄 Seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - wypełnione`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione`);
    }
  } catch (error) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

seedCorrectedTables();