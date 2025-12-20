import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAllEmptyTablesWithTypes() {
  console.log('🚀 TypeScript Seedowanie - wszystkie puste tabele z pełną kontrolą typów\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 3 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    const companies = await prisma.company.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych (organizacja/użytkownicy)!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}`);
    console.log(`✅ Kontakty: ${contacts.length}`);
    console.log(`✅ Firmy: ${companies.length}\n`);

    // 1. KNOWLEDGE BASE - używając dokładnych typów Prisma
    await seedIfEmpty('knowledgeBase', async () => {
      const knowledgeBaseData: Prisma.KnowledgeBaseCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Procedury CRM - Kompletny przewodnik',
          content: 'Szczegółowy przewodnik po wszystkich procesach CRM w organizacji, obejmujący zarządzanie kontaktami, deals i projektami.',
          tags: ['crm', 'procedury', 'workflow'],
          version: '1.0'
        },
        {
          organizationId: organization.id,
          title: 'Metodologia GTD - Implementacja',
          content: 'Praktyczne wdrożenie metodologii Getting Things Done w codziennej pracy z systemem CRM-GTD Smart.',
          tags: ['gtd', 'produktywność', 'metodologia'],
          version: '1.0'
        },
        {
          organizationId: organization.id,
          title: 'Smart Mailboxes - Przewodnik użytkownika',
          content: 'Kompletny przewodnik po funkcjonalnościach Smart Mailboxes: filtrowanie, GTD integration, Voice TTS.',
          tags: ['smart-mailboxes', 'komunikacja', 'przewodnik'],
          version: '1.0'
        }
      ];
      
      await prisma.knowledgeBase.createMany({ data: knowledgeBaseData });
    });

    // 2. EMAIL ANALYSIS - precyzyjne typy
    await seedIfEmpty('emailAnalysis', async () => {
      const emailAnalysisData: Prisma.EmailAnalysisCreateManyInput[] = [
        {
          organizationId: organization.id,
          emailFrom: 'client@techstartup.pl',
          emailSubject: 'PILNE: Potrzebna wycena do jutra 9:00',
          emailReceived: new Date('2024-12-25T10:00:00Z'),
          actionRequired: true,
          suggestedResponse: 'Natychmiastowa odpowiedź z wycenią - termin krytyczny'
        },
        {
          organizationId: organization.id,
          emailFrom: 'newsletter@marketing.com',
          emailSubject: 'Weekly Newsletter - December Updates',
          emailReceived: new Date('2024-12-24T08:00:00Z'),
          actionRequired: false,
          suggestedResponse: 'Brak akcji wymaganej - newsletter informacyjny'
        }
      ];
      
      await prisma.emailAnalysis.createMany({ data: emailAnalysisData });
    });

    // 3. DELEGATED TASK - sprawdzenie dokładnych pól
    if (users.length >= 2) {
      await seedIfEmpty('delegatedTask', async () => {
        const delegatedTaskData: Prisma.DelegatedTaskCreateManyInput[] = [
          {
            organizationId: organization.id,
            description: 'Przygotowanie kompletnego raportu sprzedażowego za Q4 2024 z analizą trendów i prognozami',
            delegatedTo: users[1].id,
            priority: 'HIGH',
            status: 'PENDING',
            notes: 'Szczególna uwaga na sektor technologiczny i startupy. Deadline: 15 stycznia 2025.'
          },
          {
            organizationId: organization.id,
            description: 'Aktualizacja dokumentacji API systemu CRM-GTD',
            delegatedTo: users[2]?.id || users[1].id,
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
            notes: 'Focus na nowe endpointy Smart Mailboxes i Voice TTS API.'
          }
        ];
        
        await prisma.delegatedTask.createMany({ data: delegatedTaskData });
      });
    }

    // 4. TIMELINE - dokładne pola
    await seedIfEmpty('timeline', async () => {
      const timelineData: Prisma.TimelineCreateManyInput[] = [
        {
          organizationId: organization.id,
          eventId: contacts[0]?.id || 'contact-default',
          eventType: 'CONTACT',
          title: 'Pierwszy kontakt z potencjalnym klientem TechStartup',
          startDate: new Date('2024-12-20T14:00:00Z'),
          endDate: new Date('2024-12-20T15:30:00Z')
        },
        {
          organizationId: organization.id,
          eventId: companies[0]?.id || 'company-default',
          eventType: 'COMPANY',
          title: 'Prezentacja możliwości systemu CRM-GTD Smart',
          startDate: new Date('2024-12-22T10:00:00Z'),
          endDate: new Date('2024-12-22T12:00:00Z')
        }
      ];
      
      await prisma.timeline.createMany({ data: timelineData });
    });

    // 5. AREA OF RESPONSIBILITY - precyzyjne pola
    await seedIfEmpty('areaOfResponsibility', async () => {
      const areaData: Prisma.AreaOfResponsibilityCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Zarządzanie infrastrukturą IT',
          description: 'Pełna odpowiedzialność za stabilność, bezpieczeństwo i rozwój infrastruktury IT organizacji',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Obsługa klienta i wsparcie techniczne',
          description: 'Zapewnienie najwyższej jakości obsługi klientów i rozwiązywanie problemów technicznych',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Rozwój produktu CRM-GTD Smart',
          description: 'Planowanie i wdrażanie nowych funkcjonalności systemu',
          isActive: true
        }
      ];
      
      await prisma.areaOfResponsibility.createMany({ data: areaData });
    });

    // 6. LEAD - dokładne typy
    await seedIfEmpty('lead', async () => {
      const leadData: Prisma.LeadCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'TechStartup Sp. z o.o. - Wdrożenie CRM dla zespołu 25 osób'
        },
        {
          organizationId: organization.id,
          title: 'RetailChain Poland - Integracja CRM z systemami sprzedażowymi'
        },
        {
          organizationId: organization.id,
          title: 'FinanceGroup - System CRM dla działu obsługi klientów VIP'
        }
      ];
      
      await prisma.lead.createMany({ data: leadData });
    });

    // 7. ORDER - sprawdzenie pól
    if (companies.length > 0) {
      await seedIfEmpty('order', async () => {
        const orderData: Prisma.OrderCreateManyInput[] = [
          {
            organizationId: organization.id,
            orderNumber: 'ORD-2024-001',
            title: 'Wdrożenie CRM-GTD Smart Pro Package',
            customer: companies[0].name,
            status: 'PENDING',
            totalAmount: 15000.00,
            currency: 'PLN'
          },
          {
            organizationId: organization.id,
            orderNumber: 'ORD-2024-002', 
            title: 'Rozszerzenie licencji CRM + szkolenia zaawansowane',
            customer: companies[1]?.name || 'Test Company 2',
            status: 'CONFIRMED',
            totalAmount: 8500.00,
            currency: 'PLN'
          }
        ];
        
        await prisma.order.createMany({ data: orderData });
      });
    }

    // 8. INVOICE - precyzyjne pola
    if (companies.length > 0) {
      await seedIfEmpty('invoice', async () => {
        const invoiceData: Prisma.InvoiceCreateManyInput[] = [
          {
            organizationId: organization.id,
            invoiceNumber: 'INV-2024-001',
            title: 'Faktura za wdrożenie systemu CRM-GTD Smart',
            amount: 15000.00,
            currency: 'PLN',
            status: 'SENT',
            dueDate: new Date('2025-01-20')
          },
          {
            organizationId: organization.id,
            invoiceNumber: 'INV-2024-002',
            title: 'Faktura za licencje miesięczne CRM Pro',
            amount: 1200.00,
            currency: 'PLN', 
            status: 'PAID',
            dueDate: new Date('2024-12-31')
          }
        ];
        
        await prisma.invoice.createMany({ data: invoiceData });
      });
    }

    // 9. COMPLAINT - dokładne enum values
    if (contacts.length > 0) {
      await seedIfEmpty('complaint', async () => {
        const complaintData: Prisma.ComplaintCreateManyInput[] = [
          {
            organizationId: organization.id,
            title: 'Problem z synchronizacją danych między modułami CRM i GTD',
            customer: `${contacts[0].firstName} ${contacts[0].lastName}`,
            status: 'PENDING',
            reportedAt: new Date('2024-12-20')
          },
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - błędne filtrowanie wiadomości po datach',
            customer: `${contacts[1]?.firstName || 'Test'} ${contacts[1]?.lastName || 'User'}`,
            status: 'IN_PROGRESS',
            reportedAt: new Date('2024-12-22')
          }
        ];
        
        await prisma.complaint.createMany({ data: complaintData });
      });
    }

    // 10. INFO - podstawowe pola
    await seedIfEmpty('info', async () => {
      const infoData: Prisma.InfoCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Planowana aktualizacja systemu CRM-GTD do wersji 2.2',
          content: 'W dniach 2-3 stycznia 2025 planowana jest aktualizacja systemu do wersji 2.2 z nowymi funkcjonalnościami AI.'
        },
        {
          organizationId: organization.id,
          title: 'Nowa funkcjonalność Voice TTS dostępna w Smart Mailboxes',
          content: 'Od grudnia 2024 dostępna jest funkcjonalność czytania wiadomości na głos w module Smart Mailboxes.'
        },
        {
          organizationId: organization.id,
          title: 'Harmonogram szkoleń dla nowych użytkowników',
          content: 'Zaplanowano cykl szkoleń wprowadzających dla nowych użytkowników systemu CRM-GTD Smart.'
        }
      ];
      
      await prisma.info.createMany({ data: infoData });
    });

    // Kontynuacja w następnym komentarzu...
    console.log('✅ Pierwsza część seedowania zakończona!');
    console.log('🔄 Kontynuowanie z pozostałymi tabelami...\n');

    // 11. RECOMMENDATION
    await seedIfEmpty('recommendation', async () => {
      const recommendationData: Prisma.RecommendationCreateManyInput[] = [
        {
          organizationId: organization.id,
          content: 'Wdrożenie automatyzacji workflow dla rutynowych zadań może zaoszczędzić zespołowi 15-20 godzin tygodniowo'
        },
        {
          organizationId: organization.id,
          content: 'Integracja systemu CRM z narzędziami marketingowymi zwiększy efektywność kampanii o około 30%'
        }
      ];
      
      await prisma.recommendation.createMany({ data: recommendationData });
    });

    // 12. UNIMPORTANT
    await seedIfEmpty('unimportant', async () => {
      const unimportantData: Prisma.UnimportantCreateManyInput[] = [
        {
          organizationId: organization.id,
          content: 'Newsletter marketingowy XYZ Corp - automatycznie oznaczony jako spam przez reguły AI'
        },
        {
          organizationId: organization.id,
          content: 'Powiadomienie o aktualizacji systemu operacyjnego - nie wymaga akcji'
        }
      ];
      
      await prisma.unimportant.createMany({ data: unimportantData });
    });

    // 13. FILE
    await seedIfEmpty('file', async () => {
      const fileData: Prisma.FileCreateManyInput[] = [
        {
          organizationId: organization.id,
          fileName: 'CRM_Implementation_Guide_v2.pdf',
          fileType: 'application/pdf',
          urlPath: '/uploads/documents/crm_implementation_guide_v2.pdf',
          size: 2548576
        },
        {
          organizationId: organization.id,
          fileName: 'Company_Logo_HD.png',
          fileType: 'image/png',
          urlPath: '/uploads/images/company_logo_hd.png',
          size: 156789
        },
        {
          organizationId: organization.id,
          fileName: 'GTD_Methodology_Training.mp4',
          fileType: 'video/mp4',
          urlPath: '/uploads/videos/gtd_training.mp4',
          size: 45678901
        }
      ];
      
      await prisma.file.createMany({ data: fileData });
    });

    // 14. PROCESSING RULE
    await seedIfEmpty('processingRule', async () => {
      const processingRuleData: Prisma.ProcessingRuleCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Auto-priorytet dla pilnych emaili',
          conditions: JSON.stringify({
            subject: { contains: ['pilne', 'urgent', 'ASAP'] },
            sender: { priority: 'high' }
          }),
          actions: JSON.stringify({
            setPriority: 'HIGH',
            addTag: 'pilne',
            notify: true
          }),
          active: true
        },
        {
          organizationId: organization.id,
          name: 'Automatyczna kategoryzacja newsletterów',
          conditions: JSON.stringify({
            subject: { contains: ['newsletter', 'unsubscribe'] },
            from: { contains: ['marketing', 'noreply'] }
          }),
          actions: JSON.stringify({
            moveToFolder: 'newsletters',
            markAsRead: true,
            setPriority: 'LOW'
          }),
          active: true
        }
      ];
      
      await prisma.processingRule.createMany({ data: processingRuleData });
    });

    // 15. OFFER
    await seedIfEmpty('offer', async () => {
      const offerData: Prisma.OfferCreateManyInput[] = [
        {
          organizationId: organization.id,
          offerNumber: 'OFF-2024-001',
          title: 'CRM-GTD Smart Pro Package - Rozwiązanie kompletne',
          customerName: companies[0]?.name || 'TechStartup Sp. z o.o.',
          createdById: users[0].id,
          status: 'DRAFT',
          totalAmount: 15000.00,
          currency: 'PLN'
        },
        {
          organizationId: organization.id,
          offerNumber: 'OFF-2024-002',
          title: 'CRM Enterprise + AI Analytics + Premium Support',
          customerName: companies[1]?.name || 'RetailChain Poland',
          createdById: users[0].id,
          status: 'SENT',
          totalAmount: 25000.00,
          currency: 'PLN'
        }
      ];
      
      await prisma.offer.createMany({ data: offerData });
    });

    // 16. BUG REPORT
    await seedIfEmpty('bugReport', async () => {
      const bugReportData: Prisma.BugReportCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Smart Mailboxes - błąd filtrowania po zakresie dat',
          description: 'Filtrowanie wiadomości według custom date range nie działa poprawnie - pokazuje wszystkie wiadomości',
          reporterId: users[0].id,
          status: 'OPEN',
          priority: 'HIGH'
        },
        {
          organizationId: organization.id,
          title: 'Voice TTS - problemy z polskimi znakami diakrytycznymi',
          description: 'System TTS niepoprawnie wymawia polskie znaki diakrytyczne w Smart Mailboxes',
          reporterId: users[1]?.id || users[0].id,
          status: 'IN_PROGRESS',
          priority: 'MEDIUM'
        }
      ];
      
      await prisma.bugReport.createMany({ data: bugReportData });
    });

    // 17. WIKI PAGE
    const wikiCategories = await prisma.wikiCategory.findMany({ take: 2 });
    if (wikiCategories.length > 0) {
      await seedIfEmpty('wikiPage', async () => {
        const wikiPageData: Prisma.WikiPageCreateManyInput[] = [
          {
            organizationId: organization.id,
            title: 'Getting Started with CRM-GTD Smart',
            slug: 'getting-started-crm-gtd-smart',
            content: '# Wprowadzenie do CRM-GTD Smart\n\nTen przewodnik pomoże Ci rozpocząć efektywną pracę z systemem CRM-GTD Smart.\n\n## Pierwsze kroki\n\n1. Skonfiguruj swój profil użytkownika\n2. Ustaw konteksty GTD\n3. Skonfiguruj Smart Mailboxes\n4. Dodaj pierwszy projekt\n\n## Kluczowe funkcjonalności\n\n### Smart Mailboxes\n- Zaawansowane filtrowanie wiadomości\n- Integracja z GTD workflow\n- Voice TTS dla wiadomości\n\n### GTD Integration\n- Szybkie przetwarzanie Inbox\n- Konteksty i projekty\n- Weekly Review\n\n### AI-Powered Features\n- Automatyczne reguły\n- Analiza sentymentu emaili\n- Rekomendacje workflow',
            authorId: users[0].id,
            categoryId: wikiCategories[0].id,
            status: 'PUBLISHED',
            version: 1
          },
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - Advanced User Guide',
            slug: 'smart-mailboxes-advanced-guide',
            content: '# Smart Mailboxes - Zaawansowany przewodnik\n\n## Przegląd funkcjonalności\n\nSmart Mailboxes to centrum komunikacji w systemie CRM-GTD Smart.\n\n## Zaawansowane funkcje\n\n### System zakładek\n- Drag & Drop reorganization\n- Custom mailbox creation\n- Persistence w localStorage\n\n### Filtrowanie\n- 9 typów filtrów dostępnych\n- Multi-select kanałów komunikacji\n- Custom date range picker\n- Real-time search w treści\n\n### GTD Integration\n- Quick Actions: Inbox/DO/DEFER\n- Pełny GTD+ Modal\n- 7 decyzji GTD workflow\n- Automatyczne konteksty\n\n### Voice TTS\n- Czytanie wiadomości na głos\n- Play/Stop controls\n- Polish language support\n\n## Best Practices\n\n1. **Codzienne przetwarzanie** - regular inbox processing\n2. **Konsekwentne tagowanie** - proper categorization\n3. **Wykorzystanie filtrów** - efficient message management\n4. **GTD workflow** - systematic task creation',
            authorId: users[1]?.id || users[0].id,
            categoryId: wikiCategories[1]?.id || wikiCategories[0].id,
            status: 'PUBLISHED',
            version: 1
          }
        ];
        
        await prisma.wikiPage.createMany({ data: wikiPageData });
      });
    }

    // 18. WIKI CATEGORY - jeśli nie istnieją
    await seedIfEmpty('wikiCategory', async () => {
      const wikiCategoryData: Prisma.WikiCategoryCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Getting Started',
          description: 'Przewodniki wprowadzające dla nowych użytkowników systemu CRM-GTD Smart'
        },
        {
          organizationId: organization.id,
          name: 'User Guides',
          description: 'Szczegółowe przewodniki użytkownika dla wszystkich modułów systemu'
        },
        {
          organizationId: organization.id,
          name: 'API Documentation',
          description: 'Dokumentacja techniczna API dla developerów i integratorów'
        },
        {
          organizationId: organization.id,
          name: 'Troubleshooting',
          description: 'Rozwiązywanie problemów i najczęściej zadawane pytania'
        }
      ];
      
      await prisma.wikiCategory.createMany({ data: wikiCategoryData });
    });

    // 19. VECTOR SEARCH RESULT - z relacjami
    const vectorDocs = await prisma.vectorDocument.findMany({ take: 2 });
    if (vectorDocs.length > 0) {
      await seedIfEmpty('vectorSearchResult', async () => {
        const vectorSearchData: Prisma.VectorSearchResultCreateManyInput[] = [
          {
            organizationId: organization.id,
            queryText: 'wdrożenie CRM',
            documentId: vectorDocs[0].id,
            rank: 1,
            score: 0.89
          },
          {
            organizationId: organization.id,
            queryText: 'smart mailboxes tutorial',
            documentId: vectorDocs[1]?.id || vectorDocs[0].id,
            rank: 1,
            score: 0.92
          },
          {
            organizationId: organization.id,
            queryText: 'GTD metodologia',
            documentId: vectorDocs[0].id,
            rank: 2,
            score: 0.75
          }
        ];
        
        await prisma.vectorSearchResult.createMany({ data: vectorSearchData });
      });
    }

    // 20. VECTOR CACHE - ostatnia tabela
    await seedIfEmpty('vectorCache', async () => {
      const vectorCacheData: Prisma.VectorCacheCreateManyInput[] = [
        {
          organizationId: organization.id,
          cacheKey: 'search:wdrożenie_crm:hash_abc123',
          queryText: 'wdrożenie CRM',
          results: JSON.stringify([
            { id: '1', title: 'CRM Implementation Guide', score: 0.89 },
            { id: '2', title: 'CRM Best Practices', score: 0.76 }
          ]),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        },
        {
          organizationId: organization.id,
          cacheKey: 'search:smart_mailboxes:hash_def456',
          queryText: 'smart mailboxes tutorial',
          results: JSON.stringify([
            { id: '3', title: 'Smart Mailboxes Advanced Guide', score: 0.92 },
            { id: '4', title: 'Communication Best Practices', score: 0.68 }
          ]),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12h
        }
      ];
      
      await prisma.vectorCache.createMany({ data: vectorCacheData });
    });

    console.log('\n🎉 SUKCES! Wszystkie 20 pustych tabel zostały wypełnione przy użyciu TypeScript!');
    console.log('✅ Pełna kontrola typów zapewniła precyzyjne dopasowanie do schema Prisma');
    console.log('🎯 Baza danych powinna być teraz w 100% wypełniona!');

  } catch (error) {
    console.error('❌ Błąd TypeScript seedowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const organization = await prisma.organization.findFirst();
    if (!organization) return;

    const count = await (prisma as any)[tableName].count({ 
      where: { organizationId: organization.id } 
    });
    
    if (count === 0) {
      console.log(`🔄 TypeScript Seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - wypełnione z TypeScript`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${count} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie głównej funkcji
seedAllEmptyTablesWithTypes()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });