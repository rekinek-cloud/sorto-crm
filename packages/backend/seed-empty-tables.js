const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEmptyTables() {
  console.log('Wypełnianie pustych tabel...\n');

  try {
    // Pobierz pierwszą organizację do wszystkich rekordów
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ Brak organizacji w bazie danych!');
      return;
    }

    console.log(`✅ Używam organizacji: ${organization.name} (${organization.id})\n`);

    // 1. HABITS - Nawyki
    console.log('🔄 Seedowanie Habits...');
    await prisma.habit.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Poranne czytanie aktualności',
          description: 'Codzienne 15-minutowe czytanie wiadomości biznesowych',
          frequency: 'DAILY',
          startDate: new Date('2024-01-01')
        },
        {
          organizationId: organization.id,
          name: 'Przegląd tygodniowy GTD',
          description: 'Cotygodniowy przegląd wszystkich projektów i zadań',
          frequency: 'WEEKLY',
          startDate: new Date('2024-01-01')
        },
        {
          organizationId: organization.id,
          name: 'Ćwiczenia fizyczne',
          description: '30 minut aktywności fizycznej',
          frequency: 'DAILY',
          startDate: new Date('2024-01-01')
        }
      ]
    });

    // 2. RECURRING TASKS - Zadania powtarzalne
    console.log('🔄 Seedowanie RecurringTask...');
    await prisma.recurringTask.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Backup bazy danych systemu',
          description: 'Cotygodniowe tworzenie kopii zapasowej',
          frequency: 'WEEKLY',
          priority: 'HIGH',
          context: '@computer',
          estimatedMinutes: 30,
          isActive: true,
          nextOccurrence: new Date('2024-12-30T09:00:00Z'),
          time: '09:00',
          daysOfWeek: [1] // Poniedziałek
        },
        {
          organizationId: organization.id,
          title: 'Przegląd subskrypcji firmowych',
          description: 'Miesięczny przegląd wszystkich subskrypcji',
          frequency: 'MONTHLY',
          priority: 'MEDIUM',
          context: '@calls',
          estimatedMinutes: 60,
          isActive: true,
          nextOccurrence: new Date('2025-01-15T10:00:00Z'),
          time: '10:00',
          dayOfMonth: 15
        }
      ]
    });

    // 3. WEEKLY REVIEWS - Przeglądy tygodniowe
    console.log('🔄 Seedowanie WeeklyReview...');
    await prisma.weeklyReview.createMany({
      data: [
        {
          organizationId: organization.id,
          reviewDate: new Date('2024-12-29'),
          completedTasksCount: 15,
          newTasksCount: 8,
          stalledTasks: 2,
          nextActions: 'Skupić się na automatyzacji procesów testowych i dokumentacji API',
          notes: 'Dobry tydzień pod względem produktywności. Ukończono wdrożenie AI.',
          collectLoosePapers: true,
          processNotes: true,
          emptyInbox: true,
          processVoicemails: false,
          reviewActionLists: true,
          reviewCalendar: true,
          reviewProjects: true,
          reviewWaitingFor: true,
          reviewSomedayMaybe: false
        }
      ]
    });

    // 4. TAGS - Tagi
    console.log('🔄 Seedowanie Tag...');
    await prisma.tag.createMany({
      data: [
        { organizationId: organization.id, name: 'pilne', color: '#FF4444', category: 'priority' },
        { organizationId: organization.id, name: 'ważne', color: '#FF8800', category: 'priority' },
        { organizationId: organization.id, name: 'spotkanie', color: '#4488FF', category: 'context' },
        { organizationId: organization.id, name: 'email', color: '#44FF88', category: 'communication' },
        { organizationId: organization.id, name: 'projekt', color: '#8844FF', category: 'work' },
        { organizationId: organization.id, name: 'research', color: '#FF44FF', category: 'work' },
        { organizationId: organization.id, name: 'dokumentacja', color: '#44FFFF', category: 'work' }
      ]
    });

    // 5. FOCUS MODES - Tryby koncentracji
    console.log('🔄 Seedowanie FocusMode...');
    await prisma.focusMode.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Deep Work',
          description: 'Skupienie na złożonych zadaniach wymagających koncentracji',
          duration: 120,
          isActive: false,
          settings: JSON.stringify({
            notifications: false,
            music: 'focus-ambient',
            breaks: { interval: 45, duration: 5 }
          })
        },
        {
          organizationId: organization.id,
          name: 'Komunikacja',
          description: 'Czas na odpowiadanie na emaile i wiadomości',
          duration: 30,
          isActive: false,
          settings: JSON.stringify({
            notifications: true,
            autoReply: true
          })
        }
      ]
    });

    // 6. KNOWLEDGE BASE - Baza wiedzy (przygotowanie)
    console.log('🔄 Seedowanie KnowledgeBase...');
    await prisma.knowledgeBase.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Procedury CRM',
          content: 'Kompletny przewodnik po procesach CRM w organizacji',
          type: 'PROCEDURE',
          tags: JSON.stringify(['crm', 'procedury', 'workflow']),
          isPublic: true,
          version: '1.0'
        },
        {
          organizationId: organization.id,
          title: 'Metodologia GTD',
          content: 'Implementacja Getting Things Done w naszej organizacji',
          type: 'GUIDE',
          tags: JSON.stringify(['gtd', 'produktywność', 'metodologia']),
          isPublic: true,
          version: '1.0'
        }
      ]
    });

    // 7. DELEGATED TASKS - Zadania delegowane
    console.log('🔄 Seedowanie DelegatedTask...');
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length >= 2) {
      await prisma.delegatedTask.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Przygotowanie raportu sprzedaży Q4',
            description: 'Analiza wyników sprzedażowych za ostatni kwartał',
            delegatedToId: users[1].id,
            delegatedById: users[0].id,
            dueDate: new Date('2025-01-15'),
            priority: 'HIGH',
            status: 'IN_PROGRESS'
          }
        ]
      });
    }

    // 8. AREAS OF RESPONSIBILITY - Obszary odpowiedzialności
    console.log('🔄 Seedowanie AreaOfResponsibility...');
    await prisma.areaOfResponsibility.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Zarządzanie IT',
          description: 'Odpowiedzialność za infrastrukturę IT i systemy',
          purpose: 'Zapewnienie stabilności i bezpieczeństwa systemów IT',
          outcomes: JSON.stringify([
            '99.9% uptime systemów',
            'Regularne backupy danych',
            'Aktualizacje zabezpieczeń'
          ]),
          reviewFrequency: 'WEEKLY',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Obsługa klienta',
          description: 'Zapewnienie wysokiej jakości obsługi klientów',
          purpose: 'Utrzymanie zadowolenia klientów na poziomie 95%+',
          outcomes: JSON.stringify([
            'Średni czas odpowiedzi < 2h',
            'Rozwiązanie 90% problemów w pierwszym kontakcie',
            'NPS > 8.0'
          ]),
          reviewFrequency: 'WEEKLY',
          isActive: true
        }
      ]
    });

    // 9. LEADS - Potencjalni klienci
    console.log('🔄 Seedowanie Lead...');
    await prisma.lead.createMany({
      data: [
        {
          organizationId: organization.id,
          firstName: 'Anna',
          lastName: 'Kowalska',
          email: 'anna.kowalska@techstartup.pl',
          phone: '+48 500 123 456',
          company: 'TechStartup Sp. z o.o.',
          position: 'CEO',
          source: 'WEBSITE',
          status: 'NEW',
          score: 85,
          notes: 'Zainteresowana rozwiązaniami CRM dla startupu technologicznego',
          tags: JSON.stringify(['startup', 'tech', 'ceo'])
        },
        {
          organizationId: organization.id,
          firstName: 'Marek',
          lastName: 'Nowak',
          email: 'marek.nowak@retailchain.pl',
          phone: '+48 600 789 123',
          company: 'RetailChain Poland',
          position: 'Dyrektor IT',
          source: 'REFERRAL',
          status: 'QUALIFIED',
          score: 92,
          notes: 'Potrzebuje zintegrowanego systemu dla sieci sklepów',
          tags: JSON.stringify(['retail', 'integration', 'it-director'])
        }
      ]
    });

    // 10. ORDERS - Zamówienia
    console.log('🔄 Seedowanie Order...');
    const companies = await prisma.company.findMany({ take: 2 });
    if (companies.length >= 1) {
      await prisma.order.createMany({
        data: [
          {
            organizationId: organization.id,
            orderNumber: 'ORD-2024-001',
            companyId: companies[0].id,
            status: 'PENDING',
            totalAmount: 15000.00,
            currency: 'PLN',
            orderDate: new Date('2024-12-15'),
            dueDate: new Date('2025-01-15'),
            description: 'Wdrożenie systemu CRM z modułem GTD',
            items: JSON.stringify([
              { name: 'Licencja CRM Pro', quantity: 1, price: 12000.00 },
              { name: 'Wdrożenie i szkolenie', quantity: 1, price: 3000.00 }
            ])
          }
        ]
      });
    }

    // 11. INVOICES - Faktury
    console.log('🔄 Seedowanie Invoice...');
    if (companies.length >= 1) {
      await prisma.invoice.createMany({
        data: [
          {
            organizationId: organization.id,
            invoiceNumber: 'INV-2024-001',
            companyId: companies[0].id,
            status: 'SENT',
            totalAmount: 15000.00,
            currency: 'PLN',
            issueDate: new Date('2024-12-20'),
            dueDate: new Date('2025-01-20'),
            description: 'Faktura za wdrożenie systemu CRM',
            items: JSON.stringify([
              { name: 'Licencja CRM Pro', quantity: 1, price: 12000.00, vat: 23 },
              { name: 'Wdrożenie i szkolenie', quantity: 1, price: 3000.00, vat: 23 }
            ]),
            paymentTerms: '30 dni',
            notes: 'Płatność przelewem na konto firmowe'
          }
        ]
      });
    }

    // 12. COMPLAINTS - Reklamacje
    console.log('🔄 Seedowanie Complaint...');
    const contacts = await prisma.contact.findMany({ take: 1 });
    if (contacts.length >= 1) {
      await prisma.complaint.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Problem z synchronizacją danych',
            description: 'System nie synchronizuje poprawnie danych między modułami CRM i GTD',
            category: 'TECHNICAL',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            contactId: contacts[0].id,
            reportedAt: new Date('2024-12-20'),
            expectedResolution: new Date('2024-12-27')
          }
        ]
      });
    }

    // 13. INFO - Informacje
    console.log('🔄 Seedowanie Info...');
    await prisma.info.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Aktualizacja systemu CRM',
          content: 'W dniach 28-29 grudnia planowana jest aktualizacja systemu do wersji 2.1',
          category: 'SYSTEM',
          priority: 'MEDIUM',
          isPublic: true,
          validFrom: new Date('2024-12-27'),
          validTo: new Date('2024-12-31')
        },
        {
          organizationId: organization.id,
          title: 'Nowa funkcjonalność Voice TTS',
          content: 'Dostępna jest nowa funkcjonalność czytania wiadomości na głos w Smart Mailboxes',
          category: 'FEATURE',
          priority: 'LOW',
          isPublic: true,
          validFrom: new Date('2024-12-25')
        }
      ]
    });

    // 14. UNIMPORTANT - Nieważne
    console.log('🔄 Seedowanie Unimportant...');
    await prisma.unimportant.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Newsletter marketingowy XYZ',
          content: 'Kolejny newsletter z ofertami marketingowymi - automatycznie oznaczony jako nieważny',
          originalSource: 'EMAIL',
          archivedAt: new Date('2024-12-20'),
          reason: 'Newsletter spam'
        }
      ]
    });

    // 15. RECOMMENDATIONS - Rekomendacje
    console.log('🔄 Seedowanie Recommendation...');
    await prisma.recommendation.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Wdrożenie automatyzacji workflow',
          description: 'Na podstawie analizy procesów rekomendujemy wdrożenie automatyzacji dla rutynowych zadań',
          category: 'PROCESS_IMPROVEMENT',
          priority: 'HIGH',
          impact: 'HIGH',
          effort: 'MEDIUM',
          confidence: 85,
          source: 'AI_ANALYSIS',
          status: 'PENDING',
          benefits: JSON.stringify([
            'Oszczędność 15-20 godzin tygodniowo',
            'Redukcja błędów o 30%',
            'Lepsza konsystencja procesów'
          ]),
          implementation: JSON.stringify([
            'Analiza obecnych procesów',
            'Wybór narzędzi automatyzacji',
            'Wdrożenie pilotażowe',
            'Pełne wdrożenie'
          ])
        }
      ]
    });

    // 16. FILES - Pliki
    console.log('🔄 Seedowanie File...');
    await prisma.file.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'CRM_Implementation_Guide.pdf',
          originalName: 'Przewodnik wdrożenia CRM.pdf',
          path: '/uploads/documents/crm_guide.pdf',
          size: 2548576,
          mimeType: 'application/pdf',
          category: 'DOCUMENT',
          description: 'Przewodnik wdrożenia systemu CRM w organizacji',
          tags: JSON.stringify(['crm', 'przewodnik', 'wdrożenie'])
        },
        {
          organizationId: organization.id,
          name: 'Logo_Company.png',
          originalName: 'Logo firmy.png',
          path: '/uploads/images/logo.png',
          size: 156789,
          mimeType: 'image/png',
          category: 'IMAGE',
          description: 'Oficjalne logo firmy w wysokiej rozdzielczości',
          tags: JSON.stringify(['logo', 'branding', 'image'])
        }
      ]
    });

    // 17. PROCESSING RULES - Reguły przetwarzania
    console.log('🔄 Seedowanie ProcessingRule...');
    await prisma.processingRule.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Auto-priorytet dla pilnych emaili',
          description: 'Automatyczne nadawanie wysokiego priorytetu emailom zawierającym słowa "pilne", "urgent"',
          type: 'EMAIL_FILTER',
          conditions: JSON.stringify({
            subject: { contains: ['pilne', 'urgent', 'ASAP'] },
            sender: { priority: 'high' }
          }),
          actions: JSON.stringify({
            setPriority: 'HIGH',
            addTag: 'pilne',
            notify: true
          }),
          isActive: true,
          order: 1
        }
      ]
    });

    // 18. OFFERS - Oferty
    console.log('🔄 Seedowanie Offer...');
    await prisma.offer.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'CRM Pro Package',
          description: 'Kompletny pakiet CRM z modułem GTD i integracją AI',
          type: 'PACKAGE',
          price: 1200.00,
          currency: 'PLN',
          duration: 12,
          isActive: true,
          features: JSON.stringify([
            'Nielimitowani użytkownicy',
            'Pełna integracja GTD',
            'AI-powered analytics',
            'Voice TTS support',
            'Premium support 24/7'
          ]),
          terms: 'Płatność miesięczna, możliwość rezygnacji w każdym momencie',
          validFrom: new Date('2024-01-01'),
          validTo: new Date('2024-12-31')
        }
      ]
    });

    // 19. BUG REPORTS - Raporty błędów
    console.log('🔄 Seedowanie BugReport...');
    if (users.length >= 1) {
      await prisma.bugReport.createMany({
        data: [
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - problemy z filtrowaniem',
            description: 'Filtrowanie wiadomości w Smart Mailboxes nie działa poprawnie dla zakresu dat',
            severity: 'MEDIUM',
            priority: 'HIGH',
            status: 'OPEN',
            reportedById: users[0].id,
            component: 'Smart Mailboxes',
            version: 'v2.1.0',
            environment: 'PRODUCTION',
            stepsToReproduce: JSON.stringify([
              'Otwórz Smart Mailboxes',
              'Wybierz Custom Date Range',
              'Ustaw zakres ostatnie 30 dni',
              'Filtr nie wyświetla poprawnych wyników'
            ]),
            expectedBehavior: 'Filtr powinien wyświetlać wiadomości z ostatnich 30 dni',
            actualBehavior: 'Filtr wyświetla wszystkie wiadomości bez względu na datę'
          }
        ]
      });
    }

    // 20. WIKI PAGES - Strony wiki
    console.log('🔄 Seedowanie WikiPage...');
    await prisma.wikiPage.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'Getting Started with CRM-GTD',
          slug: 'getting-started-crm-gtd',
          content: '# Wprowadzenie do CRM-GTD\n\nTen przewodnik pomoże Ci rozpocząć pracę z systemem CRM-GTD Smart.\n\n## Pierwsze kroki\n\n1. Skonfiguruj swój profil\n2. Dodaj pierwszy projekt\n3. Skonfiguruj konteksty GTD\n\n## Kluczowe funkcjonalności\n\n- Smart Mailboxes\n- GTD Integration\n- AI-powered rules\n- Voice TTS',
          category: 'GETTING_STARTED',
          isPublic: true,
          tags: JSON.stringify(['wprowadzenie', 'tutorial', 'gtd', 'crm'])
        },
        {
          organizationId: organization.id,
          title: 'Smart Mailboxes - User Guide',
          slug: 'smart-mailboxes-guide',
          content: '# Smart Mailboxes - Przewodnik użytkownika\n\n## Przegląd funkcjonalności\n\nSmart Mailboxes to centrum komunikacji w systemie CRM-GTD.\n\n## Kluczowe funkcje\n\n### Filtrowanie\n- 9 typów filtrów\n- Multi-select kanałów\n- Custom date range\n\n### Zarządzanie wiadomościami\n- Reply/Forward\n- Archive/Delete\n- Manual rules\n- GTD Integration\n\n### Voice TTS\n- Czytanie wiadomości na głos\n- Kontrola odtwarzania',
          category: 'USER_GUIDE',
          isPublic: true,
          tags: JSON.stringify(['smart-mailboxes', 'komunikacja', 'przewodnik'])
        }
      ]
    });

    // 21. WIKI CATEGORIES - Kategorie wiki
    console.log('🔄 Seedowanie WikiCategory...');
    await prisma.wikiCategory.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Getting Started',
          slug: 'getting-started',
          description: 'Przewodniki wprowadzające dla nowych użytkowników',
          icon: 'PlayCircle',
          color: '#10B981',
          order: 1,
          isVisible: true
        },
        {
          organizationId: organization.id,
          name: 'User Guides',
          slug: 'user-guides',
          description: 'Szczegółowe przewodniki użytkownika',
          icon: 'BookOpen',
          color: '#3B82F6',
          order: 2,
          isVisible: true
        },
        {
          organizationId: organization.id,
          name: 'API Documentation',
          slug: 'api-docs',
          description: 'Dokumentacja API dla developerów',
          icon: 'Code',
          color: '#8B5CF6',
          order: 3,
          isVisible: true
        }
      ]
    });

    // 22. SEARCH INDEX - Indeks wyszukiwania
    console.log('🔄 Seedowanie SearchIndex...');
    await prisma.searchIndex.createMany({
      data: [
        {
          organizationId: organization.id,
          entityType: 'DOCUMENT',
          entityId: '1',
          title: 'CRM Implementation Guide',
          content: 'Przewodnik wdrożenia systemu CRM w organizacji zawiera wszystkie niezbędne informacje',
          tags: JSON.stringify(['crm', 'przewodnik', 'wdrożenie']),
          searchVector: 'crm:1 przewodnik:2 wdrożenie:3 system:4 organizacja:5'
        },
        {
          organizationId: organization.id,
          entityType: 'WIKI_PAGE',
          entityId: '1',
          title: 'Getting Started with CRM-GTD',
          content: 'Wprowadzenie do CRM-GTD Smart Mailboxes GTD Integration AI rules Voice TTS',
          tags: JSON.stringify(['wprowadzenie', 'tutorial', 'gtd', 'crm']),
          searchVector: 'crm:1 gtd:2 smart:3 mailboxes:4 ai:5 voice:6 tts:7'
        }
      ]
    });

    // 23. EMAIL TEMPLATES - Szablony emaili
    console.log('🔄 Seedowanie EmailTemplate...');
    await prisma.emailTemplate.createMany({
      data: [
        {
          organizationId: organization.id,
          name: 'Welcome New Client',
          subject: 'Witamy w CRM-GTD Smart!',
          content: '<h1>Witamy!</h1><p>Dziękujemy za wybór naszego systemu CRM-GTD Smart. Oto pierwsze kroki:</p><ul><li>Skonfiguruj swój profil</li><li>Dodaj pierwszy projekt</li><li>Skonfiguruj Smart Mailboxes</li></ul><p>Potrzebujesz pomocy? Skontaktuj się z nami!</p>',
          type: 'WELCOME',
          isActive: true,
          variables: JSON.stringify(['{{firstName}}', '{{companyName}}', '{{loginUrl}}'])
        },
        {
          organizationId: organization.id,
          name: 'Task Assignment Notification',
          subject: 'Nowe zadanie: {{taskTitle}}',
          content: '<h2>Zostało Ci przypisane nowe zadanie</h2><p><strong>Tytuł:</strong> {{taskTitle}}</p><p><strong>Opis:</strong> {{taskDescription}}</p><p><strong>Termin:</strong> {{dueDate}}</p><p><strong>Priorytet:</strong> {{priority}}</p><p><a href="{{taskUrl}}">Zobacz zadanie w systemie</a></p>',
          type: 'TASK_ASSIGNMENT',
          isActive: true,
          variables: JSON.stringify(['{{taskTitle}}', '{{taskDescription}}', '{{dueDate}}', '{{priority}}', '{{taskUrl}}'])
        }
      ]
    });

    // 24. EMAIL LOGS - Logi emaili
    console.log('🔄 Seedowanie EmailLog...');
    if (contacts.length >= 1) {
      await prisma.emailLog.createMany({
        data: [
          {
            organizationId: organization.id,
            to: contacts[0].email,
            subject: 'Welcome to CRM-GTD Smart!',
            templateId: null,
            status: 'DELIVERED',
            sentAt: new Date('2024-12-25T10:00:00Z'),
            deliveredAt: new Date('2024-12-25T10:01:23Z'),
            metadata: JSON.stringify({
              provider: 'smtp',
              messageId: 'msg_123456789',
              campaign: 'welcome_series'
            })
          }
        ]
      });
    }

    // 25. VECTOR DOCUMENTS - Dokumenty wektorowe
    console.log('🔄 Seedowanie VectorDocument...');
    await prisma.vectorDocument.createMany({
      data: [
        {
          organizationId: organization.id,
          title: 'CRM Implementation Best Practices',
          content: 'Najlepsze praktyki wdrażania systemów CRM w przedsiębiorstwach średniej wielkości',
          entityType: 'DOCUMENT',
          entityId: '1',
          embedding: JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]), // Mock embedding
          metadata: JSON.stringify({
            category: 'best-practices',
            tags: ['crm', 'implementation', 'enterprise'],
            language: 'pl'
          })
        }
      ]
    });

    // 26. VECTOR SEARCH RESULTS - Wyniki wyszukiwania wektorowego
    console.log('🔄 Seedowanie VectorSearchResult...');
    await prisma.vectorSearchResult.createMany({
      data: [
        {
          organizationId: organization.id,
          query: 'wdrożenie CRM',
          results: JSON.stringify([
            {
              id: '1',
              title: 'CRM Implementation Best Practices',
              score: 0.89,
              entityType: 'DOCUMENT'
            }
          ]),
          totalResults: 1,
          searchTime: 45,
          metadata: JSON.stringify({
            filters: { entityType: 'DOCUMENT' },
            userId: users[0]?.id || null
          })
        }
      ]
    });

    // 27. VECTOR CACHE - Cache wektorowy
    console.log('🔄 Seedowanie VectorCache...');
    await prisma.vectorCache.createMany({
      data: [
        {
          organizationId: organization.id,
          cacheKey: 'search:wdrożenie_crm:hash123',
          query: 'wdrożenie CRM',
          results: JSON.stringify([
            {
              id: '1',
              title: 'CRM Implementation Best Practices',
              score: 0.89
            }
          ]),
          totalResults: 1,
          searchTime: 45,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        }
      ]
    });

    console.log('\n✅ Seedowanie zakończone pomyślnie!');
    console.log('\n📊 Podsumowanie wypełnionych tabel:');
    console.log('- Habits: 3 rekordy');
    console.log('- RecurringTask: 2 rekordy');
    console.log('- WeeklyReview: 1 rekord');
    console.log('- Tag: 7 rekordów');
    console.log('- FocusMode: 2 rekordy');
    console.log('- KnowledgeBase: 2 rekordy');
    console.log('- DelegatedTask: 1 rekord');
    console.log('- AreaOfResponsibility: 2 rekordy');
    console.log('- Lead: 2 rekordy');
    console.log('- Order: 1 rekord');
    console.log('- Invoice: 1 rekord');
    console.log('- Complaint: 1 rekord');
    console.log('- Info: 2 rekordy');
    console.log('- Unimportant: 1 rekord');
    console.log('- Recommendation: 1 rekord');
    console.log('- File: 2 rekordy');
    console.log('- ProcessingRule: 1 rekord');
    console.log('- Offer: 1 rekord');
    console.log('- BugReport: 1 rekord');
    console.log('- WikiPage: 2 rekordy');
    console.log('- WikiCategory: 3 rekordy');
    console.log('- SearchIndex: 2 rekordy');
    console.log('- EmailTemplate: 2 rekordy');
    console.log('- EmailLog: 1 rekord');
    console.log('- VectorDocument: 1 rekord');
    console.log('- VectorSearchResult: 1 rekord');
    console.log('- VectorCache: 1 rekord');

  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmptyTables();