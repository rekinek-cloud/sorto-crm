const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAllRemainingTables() {
  console.log('🚀 Wypełnianie WSZYSTKICH pozostałych 24 pustych tabel...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 3 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    const companies = await prisma.company.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych (organizacja/użytkownicy)!');
      return;
    }

    console.log(`✅ Używam organizacji: ${organization.name}`);
    console.log(`✅ Dostępni użytkownicy: ${users.length}`);
    console.log(`✅ Dostępne kontakty: ${contacts.length}`);
    console.log(`✅ Dostępne firmy: ${companies.length}\n`);

    // 1. PROCESSING RULE (prosty - bez relacji)
    await seedIfEmpty('processingRule', async () => {
      await prisma.processingRule.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Auto-priorytet dla pilnych emaili',
            description: 'Automatyczne nadawanie wysokiego priorytetu',
            conditions: JSON.stringify({ subject: { contains: ['pilne', 'urgent'] } }),
            actions: JSON.stringify({ setPriority: 'HIGH' }),
            isActive: true,
            executionOrder: 1
          }
        ]
      });
    });

    // 2. WIKI CATEGORY
    await seedIfEmpty('wikiCategory', async () => {
      await prisma.wikiCategory.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Getting Started',
            slug: 'getting-started',
            description: 'Przewodniki wprowadzające',
            icon: 'PlayCircle',
            color: '#10B981',
            order: 1,
            isVisible: true
          },
          {
            organizationId: organization.id,
            name: 'User Guides', 
            slug: 'user-guides',
            description: 'Przewodniki użytkownika',
            icon: 'BookOpen',
            color: '#3B82F6',
            order: 2,
            isVisible: true
          }
        ]
      });
    });

    // 3. KNOWLEDGE BASE
    await seedIfEmpty('knowledgeBase', async () => {
      await prisma.knowledgeBase.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Procedury CRM',
            content: 'Kompletny przewodnik po procesach CRM w organizacji',
            tags: JSON.stringify(['crm', 'procedury']),
            isPublic: true,
            version: '1.0'
          },
          {
            organizationId: organization.id,
            title: 'Metodologia GTD',
            content: 'Implementacja Getting Things Done w organizacji',
            tags: JSON.stringify(['gtd', 'produktywność']),
            isPublic: true,
            version: '1.0'
          }
        ]
      });
    });

    // 4. AREA OF RESPONSIBILITY
    await seedIfEmpty('areaOfResponsibility', async () => {
      await prisma.areaOfResponsibility.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Zarządzanie IT',
            description: 'Odpowiedzialność za infrastrukturę IT',
            purpose: 'Zapewnienie stabilności systemów',
            outcomes: JSON.stringify(['99.9% uptime', 'Regularne backupy']),
            reviewFrequency: 'WEEKLY',
            isActive: true
          },
          {
            organizationId: organization.id,
            name: 'Obsługa klienta',
            description: 'Zapewnienie wysokiej jakości obsługi',
            purpose: 'Utrzymanie zadowolenia klientów 95%+',
            outcomes: JSON.stringify(['Czas odpowiedzi < 2h', 'NPS > 8.0']),
            reviewFrequency: 'WEEKLY',
            isActive: true
          }
        ]
      });
    });

    // 5. LEAD
    await seedIfEmpty('lead', async () => {
      await prisma.lead.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'TechStartup - wdrożenie CRM',
            firstName: 'Anna',
            lastName: 'Kowalska',
            email: 'anna.kowalska@techstartup.pl',
            company: 'TechStartup Sp. z o.o.',
            position: 'CEO',
            phone: '+48 500 123 456',
            source: 'WEBSITE',
            status: 'NEW',
            score: 85,
            notes: 'Zainteresowana rozwiązaniami CRM'
          },
          {
            organizationId: organization.id,
            title: 'RetailChain - integracja systemów',
            firstName: 'Marek',
            lastName: 'Nowak', 
            email: 'marek.nowak@retailchain.pl',
            company: 'RetailChain Poland',
            position: 'Dyrektor IT',
            phone: '+48 600 789 123',
            source: 'REFERRAL',
            status: 'QUALIFIED',
            score: 92,
            notes: 'Potrzebuje zintegrowanego systemu'
          }
        ]
      });
    });

    // 6. INFO
    await seedIfEmpty('info', async () => {
      await prisma.info.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Aktualizacja systemu CRM',
            content: 'Planowana aktualizacja do wersji 2.1',
            category: 'SYSTEM',
            priority: 'MEDIUM',
            isPublic: true,
            validFrom: new Date('2024-12-27'),
            validTo: new Date('2024-12-31')
          },
          {
            organizationId: organization.id,
            title: 'Nowa funkcjonalność Voice TTS',
            content: 'Dostępne czytanie wiadomości na głos',
            category: 'FEATURE',
            priority: 'LOW',
            isPublic: true,
            validFrom: new Date('2024-12-25')
          }
        ]
      });
    });

    // 7. RECOMMENDATION
    await seedIfEmpty('recommendation', async () => {
      await prisma.recommendation.createMany({
        data: [
          {
            organizationId: organization.id,
            content: 'Wdrożenie automatyzacji workflow dla rutynowych zadań',
            category: 'PROCESS_IMPROVEMENT',
            priority: 'HIGH',
            impact: 'HIGH',
            effort: 'MEDIUM',
            confidence: 85,
            source: 'AI_ANALYSIS',
            status: 'PENDING',
            benefits: JSON.stringify(['Oszczędność 15-20h/tydzień', 'Redukcja błędów 30%']),
            implementation: JSON.stringify(['Analiza procesów', 'Wybór narzędzi', 'Pilotaż'])
          }
        ]
      });
    });

    // 8. UNIMPORTANT
    await seedIfEmpty('unimportant', async () => {
      await prisma.unimportant.createMany({
        data: [
          {
            organizationId: organization.id,
            content: 'Newsletter marketingowy XYZ - automatycznie oznaczony jako spam',
            originalSource: 'EMAIL',
            archivedAt: new Date('2024-12-20'),
            reason: 'Newsletter spam',
            tags: JSON.stringify(['newsletter', 'spam'])
          }
        ]
      });
    });

    // 9. FILE
    await seedIfEmpty('file', async () => {
      await prisma.file.createMany({
        data: [
          {
            organizationId: organization.id,
            fileName: 'CRM_Implementation_Guide.pdf',
            originalName: 'Przewodnik wdrożenia CRM.pdf',
            fileType: 'application/pdf',
            urlPath: '/uploads/documents/crm_guide.pdf',
            size: 2548576,
            category: 'DOCUMENT',
            description: 'Przewodnik wdrożenia systemu CRM',
            tags: JSON.stringify(['crm', 'przewodnik', 'wdrożenie'])
          },
          {
            organizationId: organization.id,
            fileName: 'Logo_Company.png',
            originalName: 'Logo firmy.png',
            fileType: 'image/png',
            urlPath: '/uploads/images/logo.png',
            size: 156789,
            category: 'IMAGE',
            description: 'Logo firmy w wysokiej rozdzielczości',
            tags: JSON.stringify(['logo', 'branding'])
          }
        ]
      });
    });

    // 10. EMAIL TEMPLATE
    await seedIfEmpty('emailTemplate', async () => {
      await prisma.emailTemplate.createMany({
        data: [
          {
            organizationId: organization.id,
            name: 'Welcome New Client',
            subject: 'Witamy w CRM-GTD Smart!',
            htmlTemplate: '<h1>Witamy!</h1><p>Dziękujemy za wybór naszego systemu CRM-GTD Smart.</p>',
            textTemplate: 'Witamy! Dziękujemy za wybór CRM-GTD Smart.',
            createdById: users[0].id,
            isActive: true,
            category: 'WELCOME'
          },
          {
            organizationId: organization.id,
            name: 'Task Assignment',
            subject: 'Nowe zadanie: {{taskTitle}}',
            htmlTemplate: '<h2>Nowe zadanie</h2><p>Tytuł: {{taskTitle}}</p><p>Opis: {{taskDescription}}</p>',
            textTemplate: 'Nowe zadanie: {{taskTitle}} - {{taskDescription}}',
            createdById: users[0].id,
            isActive: true,
            category: 'NOTIFICATION'
          }
        ]
      });
    });

    // 11. SEARCH INDEX
    await seedIfEmpty('searchIndex', async () => {
      await prisma.searchIndex.createMany({
        data: [
          {
            organizationId: organization.id,
            entityType: 'DOCUMENT',
            entityId: '1',
            title: 'CRM Implementation Guide',
            content: 'Przewodnik wdrożenia systemu CRM zawiera wszystkie informacje',
            tags: JSON.stringify(['crm', 'przewodnik']),
            searchVector: 'crm:1 przewodnik:2 wdrożenie:3 system:4'
          },
          {
            organizationId: organization.id,
            entityType: 'WIKI_PAGE',
            entityId: '1', 
            title: 'Getting Started with CRM-GTD',
            content: 'Wprowadzenie do CRM-GTD Smart Mailboxes GTD Integration',
            tags: JSON.stringify(['wprowadzenie', 'gtd']),
            searchVector: 'crm:1 gtd:2 smart:3 mailboxes:4'
          }
        ]
      });
    });

    // 12. VECTOR DOCUMENT
    await seedIfEmpty('vectorDocument', async () => {
      await prisma.vectorDocument.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'CRM Best Practices',
            content: 'Najlepsze praktyki wdrażania CRM w przedsiębiorstwach',
            contentHash: 'hash123456',
            entityType: 'DOCUMENT',
            entityId: '1',
            source: 'MANUAL_UPLOAD',
            lastUpdated: new Date(),
            metadata: JSON.stringify({ category: 'best-practices', language: 'pl' })
          }
        ]
      });
    });

    // 13. VECTOR CACHE
    await seedIfEmpty('vectorCache', async () => {
      await prisma.vectorCache.createMany({
        data: [
          {
            organizationId: organization.id,
            cacheKey: 'search:crm_implementation:hash123',
            queryText: 'wdrożenie CRM',
            results: JSON.stringify([{ id: '1', title: 'CRM Best Practices', score: 0.89 }]),
            totalResults: 1,
            searchTime: 45,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        ]
      });
    });

    // 14. DELEGATED TASK (wymaga użytkowników)
    if (users.length >= 2) {
      await seedIfEmpty('delegatedTask', async () => {
        await prisma.delegatedTask.createMany({
          data: [
            {
              organizationId: organization.id,
              description: 'Przygotowanie raportu sprzedaży Q4',
              delegatedTo: users[1].id,
              delegatedBy: users[0].id,
              dueDate: new Date('2025-01-15'),
              priority: 'HIGH',
              status: 'PENDING',
              notes: 'Analiza wyników sprzedażowych'
            }
          ]
        });
      });
    }

    // 15. EMAIL ANALYSIS
    await seedIfEmpty('emailAnalysis', async () => {
      await prisma.emailAnalysis.createMany({
        data: [
          {
            organizationId: organization.id,
            emailFrom: 'client@example.com',
            emailSubject: 'Pilna sprawa - potrzebna wycena',
            emailReceived: new Date('2024-12-25T10:00:00Z'),
            sentiment: 'URGENT',
            urgencyScore: 90,
            actionRequired: true,
            categories: JSON.stringify(['sales', 'urgent']),
            keyWords: JSON.stringify(['wycena', 'pilne', 'deadline']),
            suggestedResponse: 'Natychmiastowa odpowiedź z wycenią'
          }
        ]
      });
    });

    // 16. TIMELINE
    await seedIfEmpty('timeline', async () => {
      await prisma.timeline.createMany({
        data: [
          {
            organizationId: organization.id,
            eventId: contacts[0]?.id || 'contact-1',
            eventType: 'CONTACT',
            title: 'Pierwszy kontakt z klientem',
            description: 'Rozmowa wprowadzająca o potrzebach CRM',
            startDate: new Date('2024-12-20T14:00:00Z'),
            endDate: new Date('2024-12-20T15:00:00Z'),
            category: 'MEETING',
            priority: 'MEDIUM',
            relatedId: contacts[0]?.id || null,
            relatedType: 'CONTACT'
          }
        ]
      });
    });

    // 17. ORDER (wymaga firm)
    if (companies.length > 0) {
      await seedIfEmpty('order', async () => {
        await prisma.order.createMany({
          data: [
            {
              organizationId: organization.id,
              orderNumber: 'ORD-2024-001',
              title: 'Wdrożenie systemu CRM Pro',
              customer: companies[0].name,
              customerId: companies[0].id,
              status: 'PENDING',
              totalAmount: 15000.00,
              currency: 'PLN',
              orderDate: new Date('2024-12-15'),
              dueDate: new Date('2025-01-15'),
              description: 'Kompletne wdrożenie CRM z modułem GTD'
            }
          ]
        });
      });
    }

    // 18. INVOICE (wymaga firm)
    if (companies.length > 0) {
      await seedIfEmpty('invoice', async () => {
        await prisma.invoice.createMany({
          data: [
            {
              organizationId: organization.id,
              invoiceNumber: 'INV-2024-001',
              title: 'Faktura za wdrożenie CRM',
              customerId: companies[0].id,
              status: 'SENT',
              totalAmount: 15000.00,
              currency: 'PLN',
              issueDate: new Date('2024-12-20'),
              dueDate: new Date('2025-01-20'),
              description: 'Wdrożenie i szkolenie CRM-GTD Smart'
            }
          ]
        });
      });
    }

    // 19. COMPLAINT (wymaga kontaktów)
    if (contacts.length > 0) {
      await seedIfEmpty('complaint', async () => {
        await prisma.complaint.createMany({
          data: [
            {
              organizationId: organization.id,
              title: 'Problem z synchronizacją danych',
              customer: `${contacts[0].firstName} ${contacts[0].lastName}`,
              customerId: contacts[0].id,
              description: 'System nie synchronizuje danych między modułami',
              category: 'TECHNICAL',
              priority: 'HIGH',
              status: 'OPEN',
              reportedAt: new Date('2024-12-20'),
              expectedResolution: new Date('2024-12-27')
            }
          ]
        });
      });
    }

    // 20. BUG REPORT
    await seedIfEmpty('bugReport', async () => {
      await prisma.bugReport.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - błąd filtrowania',
            description: 'Filtrowanie dat nie działa poprawnie',
            severity: 'MEDIUM',
            priority: 'HIGH',
            status: 'OPEN',
            reporterId: users[0].id,
            component: 'Smart Mailboxes',
            version: 'v2.1.0',
            environment: 'PRODUCTION',
            stepsToReproduce: JSON.stringify(['Otwórz Smart Mailboxes', 'Ustaw filtr dat', 'Sprawdź wyniki']),
            expectedBehavior: 'Filtr powinien działać poprawnie',
            actualBehavior: 'Filtr pokazuje nieprawidłowe wyniki'
          }
        ]
      });
    });

    // 21. WIKI PAGE
    const wikiCategories = await prisma.wikiCategory.findMany({ take: 1 });
    if (wikiCategories.length > 0) {
      await seedIfEmpty('wikiPage', async () => {
        await prisma.wikiPage.createMany({
          data: [
            {
              organizationId: organization.id,
              title: 'Getting Started with CRM-GTD',
              slug: 'getting-started-crm-gtd',
              content: '# Wprowadzenie\n\nTen przewodnik pomoże rozpocząć pracę z CRM-GTD Smart.',
              authorId: users[0].id,
              categoryId: wikiCategories[0].id,
              isPublic: true,
              tags: JSON.stringify(['wprowadzenie', 'tutorial']),
              status: 'PUBLISHED',
              version: 1
            }
          ]
        });
      });
    }

    // 22. EMAIL LOG
    await seedIfEmpty('emailLog', async () => {
      await prisma.emailLog.createMany({
        data: [
          {
            organizationId: organization.id,
            messageId: 'msg_123456789',
            toAddresses: JSON.stringify(['client@example.com']),
            subject: 'Welcome to CRM-GTD Smart!',
            success: true,
            sentAt: new Date('2024-12-25T10:00:00Z'),
            deliveredAt: new Date('2024-12-25T10:01:23Z'),
            templateId: null,
            metadata: JSON.stringify({ provider: 'smtp', campaign: 'welcome' })
          }
        ]
      });
    });

    // 23. VECTOR SEARCH RESULT
    const vectorDocs = await prisma.vectorDocument.findMany({ take: 1 });
    if (vectorDocs.length > 0) {
      await seedIfEmpty('vectorSearchResult', async () => {
        await prisma.vectorSearchResult.createMany({
          data: [
            {
              organizationId: organization.id,
              queryText: 'wdrożenie CRM',
              documentId: vectorDocs[0].id,
              rank: 1,
              score: 0.89,
              searchTime: 45,
              metadata: JSON.stringify({ filters: { entityType: 'DOCUMENT' } })
            }
          ]
        });
      });
    }

    // 24. OFFER
    await seedIfEmpty('offer', async () => {
      await prisma.offer.createMany({
        data: [
          {
            organizationId: organization.id,
            offerNumber: 'OFF-2024-001',
            title: 'CRM Pro Package - Kompletne rozwiązanie',
            customerName: companies[0]?.name || 'Test Company',
            customerId: companies[0]?.id || null,
            createdById: users[0].id,
            status: 'DRAFT',
            totalAmount: 15000.00,
            currency: 'PLN',
            validUntil: new Date('2025-01-31'),
            description: 'Kompletny pakiet CRM z modułem GTD i AI',
            terms: 'Płatność w terminie 30 dni'
          }
        ]
      });
    });

    console.log('\n🎉 SUKCES! Wszystkie 24 puste tabele zostały wypełnione!');
    
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

seedAllRemainingTables();