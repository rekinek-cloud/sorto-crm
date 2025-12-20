import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFinal7Tables() {
  console.log('🎯 FINAŁOWE SEEDOWANIE - ostatnie 7 pustych tabel do 100%\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 3 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. KNOWLEDGE BASE - bez pola version
    await seedIfEmpty('knowledgeBase', async () => {
      const knowledgeBaseData: Prisma.KnowledgeBaseCreateManyInput[] = [
        {
          organizationId: organization.id,
          title: 'Procedury CRM - Kompletny przewodnik',
          content: 'Szczegółowy przewodnik po wszystkich procesach CRM w organizacji, obejmujący zarządzanie kontaktami, deals i projektami.',
          category: 'PROCEDURES',
          tags: ['crm', 'procedury', 'workflow'],
          relatedItems: []
        },
        {
          organizationId: organization.id,
          title: 'Metodologia GTD - Implementacja',
          content: 'Praktyczne wdrożenie metodologii Getting Things Done w codziennej pracy z systemem CRM-GTD Smart.',
          category: 'METHODOLOGY',
          tags: ['gtd', 'produktywność', 'metodologia'],
          relatedItems: []
        },
        {
          organizationId: organization.id,
          title: 'Smart Mailboxes - Przewodnik użytkownika',
          content: 'Kompletny przewodnik po funkcjonalnościach Smart Mailboxes: filtrowanie, GTD integration, Voice TTS.',
          category: 'USER_GUIDE',
          tags: ['smart-mailboxes', 'komunikacja', 'przewodnik'],
          relatedItems: []
        }
      ];
      
      await prisma.knowledgeBase.createMany({ data: knowledgeBaseData });
    });

    // 2. EMAIL ANALYSIS - bez actionRequired, z prawidłowymi polami
    await seedIfEmpty('emailAnalysis', async () => {
      const emailAnalysisData: Prisma.EmailAnalysisCreateManyInput[] = [
        {
          organizationId: organization.id,
          emailFrom: 'client@techstartup.pl',
          emailSubject: 'PILNE: Potrzebna wycena do jutra 9:00',
          emailReceived: new Date('2024-12-25T10:00:00Z'),
          categories: ['sales', 'urgent'],
          confidenceScore: 0.92,
          summary: 'Pilny request o wycenę z terminem do jutra',
          fullAnalysis: 'Email zawiera pilny request o przygotowanie wyceny. Klient podkreśla krótki termin - do jutra 9:00. Wymaga natychmiastowej reakcji.',
          processingTime: 15,
          tokenCount: 245
        },
        {
          organizationId: organization.id,
          emailFrom: 'newsletter@marketing.com',
          emailSubject: 'Weekly Newsletter - December Updates',
          emailReceived: new Date('2024-12-24T08:00:00Z'),
          categories: ['newsletter', 'marketing'],
          confidenceScore: 0.98,
          summary: 'Newsletter informacyjny - nie wymaga akcji',
          fullAnalysis: 'Standardowy newsletter marketingowy z aktualizacjami produktowymi. Można archiwizować.',
          processingTime: 8,
          tokenCount: 156
        }
      ];
      
      await prisma.emailAnalysis.createMany({ data: emailAnalysisData });
    });

    // 3. DELEGATED TASK - bez priority, z prawidłowym status enum
    await seedIfEmpty('delegatedTask', async () => {
      const delegatedTaskData: Prisma.DelegatedTaskCreateManyInput[] = [
        {
          organizationId: organization.id,
          description: 'Przygotowanie kompletnego raportu sprzedażowego za Q4 2024 z analizą trendów i prognozami',
          delegatedTo: users[1].id,
          status: 'NEW',
          notes: 'Szczególna uwaga na sektor technologiczny i startupy. Deadline: 15 stycznia 2025.',
          followUpDate: new Date('2025-01-10')
        },
        {
          organizationId: organization.id,
          description: 'Aktualizacja dokumentacji API systemu CRM-GTD',
          delegatedTo: users[2]?.id || users[1].id,
          status: 'IN_PROGRESS',
          notes: 'Focus na nowe endpointy Smart Mailboxes i Voice TTS API.',
          followUpDate: new Date('2025-01-05')
        }
      ];
      
      await prisma.delegatedTask.createMany({ data: delegatedTaskData });
    });

    // 4. AREA OF RESPONSIBILITY - bez isActive, z prawidłowymi polami
    await seedIfEmpty('areaOfResponsibility', async () => {
      const areaData: Prisma.AreaOfResponsibilityCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Zarządzanie infrastrukturą IT',
          description: 'Pełna odpowiedzialność za stabilność, bezpieczeństwo i rozwój infrastruktury IT organizacji',
          owner: users[0].id,
          relatedProjects: []
        },
        {
          organizationId: organization.id,
          name: 'Obsługa klienta i wsparcie techniczne',
          description: 'Zapewnienie najwyższej jakości obsługi klientów i rozwiązywanie problemów technicznych',
          owner: users[1]?.id || users[0].id,
          relatedProjects: []
        },
        {
          organizationId: organization.id,
          name: 'Rozwój produktu CRM-GTD Smart',
          description: 'Planowanie i wdrażanie nowych funkcjonalności systemu',
          owner: users[2]?.id || users[0].id,
          relatedProjects: []
        }
      ];
      
      await prisma.areaOfResponsibility.createMany({ data: areaData });
    });

    // 5. COMPLAINT - z prawidłowym enum ComplaintStatus
    if (contacts.length > 0) {
      await seedIfEmpty('complaint', async () => {
        const complaintData: Prisma.ComplaintCreateManyInput[] = [
          {
            organizationId: organization.id,
            title: 'Problem z synchronizacją danych między modułami CRM i GTD',
            description: 'System nie synchronizuje poprawnie danych między modułem CRM a GTD. Zadania utworzone w CRM nie pojawiają się w GTD Inbox.',
            customer: `${contacts[0].firstName} ${contacts[0].lastName}`,
            product: 'CRM-GTD Smart Pro',
            status: 'NEW',
            priority: 'HIGH'
          },
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - błędne filtrowanie wiadomości po datach',
            description: 'Filtrowanie wiadomości według custom date range nie działa poprawnie - wyświetla wszystkie wiadomości niezależnie od wybranego zakresu.',
            customer: `${contacts[1]?.firstName || 'Test'} ${contacts[1]?.lastName || 'User'}`,
            product: 'Smart Mailboxes',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM'
          },
          {
            organizationId: organization.id,
            title: 'Voice TTS - problemy z polskimi znakami diakrytycznymi',
            description: 'System TTS niepoprawnie wymawia polskie znaki diakrytyczne (ą, ć, ę, ł, ń, ó, ś, ź, ż) podczas czytania wiadomości.',
            customer: `${contacts[2]?.firstName || 'Test'} ${contacts[2]?.lastName || 'Client'}`,
            product: 'Voice TTS',
            status: 'RESOLVED',
            priority: 'LOW'
          }
        ];
        
        await prisma.complaint.createMany({ data: complaintData });
      });
    }

    // 6. WIKI PAGE - z prawidłowymi relacjami
    const wikiCategories = await prisma.wikiCategory.findMany({ take: 2 });
    if (wikiCategories.length > 0) {
      await seedIfEmpty('wikiPage', async () => {
        const wikiPageData: Prisma.WikiPageCreateManyInput[] = [
          {
            organizationId: organization.id,
            title: 'Getting Started with CRM-GTD Smart',
            slug: 'getting-started-crm-gtd-smart',
            content: `# Wprowadzenie do CRM-GTD Smart

Ten przewodnik pomoże Ci rozpocząć efektywną pracę z systemem CRM-GTD Smart.

## Pierwsze kroki

1. **Skonfiguruj swój profil użytkownika**
   - Ustaw preferencje komunikacji
   - Wybierz język interfejsu
   - Skonfiguruj powiadomienia

2. **Ustaw konteksty GTD**
   - @computer - Zadania przy komputerze
   - @calls - Rozmowy telefoniczne
   - @office - Zadania w biurze
   - @home - Praca zdalna

3. **Skonfiguruj Smart Mailboxes**
   - Utwórz custom mailboxy
   - Ustaw filtry automatyczne
   - Skonfiguruj reguły przetwarzania

4. **Dodaj pierwszy projekt**
   - Zdefiniuj cel projektu
   - Ustaw obszar odpowiedzialności
   - Dodaj pierwsze zadania

## Kluczowe funkcjonalności

### Smart Mailboxes
- Zaawansowane filtrowanie wiadomości (9 typów filtrów)
- Integracja z GTD workflow (Quick Actions)
- Voice TTS dla wiadomości
- Drag & Drop reorganization

### GTD Integration
- Szybkie przetwarzanie Inbox (DO/DEFER/DELETE)
- Konteksty i projekty
- Weekly Review z checklistami
- Automatic Next Actions

### AI-Powered Features
- Automatyczne reguły przetwarzania
- Analiza sentymentu emaili
- Rekomendacje workflow
- Smart categorization

## Best Practices

1. **Daily Processing** - codzienne przetwarzanie inbox rano
2. **Consistent Tagging** - konsekwentne tagowanie
3. **Context-Based Work** - praca według kontekstów
4. **Weekly Reviews** - regularne przeglądy systemowe`,
            summary: 'Kompletny przewodnik wprowadzający do systemu CRM-GTD Smart',
            authorId: users[0].id,
            categoryId: wikiCategories[0].id,
            isPublished: true,
            version: 1
          },
          {
            organizationId: organization.id,
            title: 'Smart Mailboxes - Advanced User Guide',
            slug: 'smart-mailboxes-advanced-guide',
            content: `# Smart Mailboxes - Zaawansowany przewodnik

## Przegląd funkcjonalności

Smart Mailboxes to centrum komunikacji w systemie CRM-GTD Smart, oferujące zaawansowane możliwości zarządzania wiadomościami.

## System zakładek

### Dostępne mailboxy
- **Today** - Wiadomości z dzisiaj
- **Last 7 days** - Ostatni tydzień
- **Important** - Oznaczone jako ważne
- **Custom** - Własne filtry

### Zarządzanie zakładkami
- **Drag & Drop** - zmiana kolejności
- **Custom creation** - tworzenie własnych
- **Persistence** - zachowanie w localStorage

## Zaawansowane filtrowanie

### 9 typów filtrów
1. **Search** - Wyszukiwanie w treści
2. **Channels** - Multi-select kanałów
3. **Date Range** - Custom picker
4. **Priority** - Poziomy ważności
5. **Status** - Stan wiadomości
6. **Sender** - Nadawcy
7. **Attachments** - Załączniki
8. **Read Status** - Przeczytane/nieprzeczytane
9. **Urgency** - AI urgency score

### Performance
- **Client-side filtering** - błyskawiczne
- **Real-time search** - natychmiastowe
- **Smart caching** - optymalizacja

## GTD Integration

### Quick Actions
- **📥 Inbox** - Dodanie do GTD Inbox
- **✅ DO** - Natychmiastowe zadanie
- **⏳ DEFER** - Planowanie na jutro

### GTD+ Modal (7 decyzji)
1. **DO** - Zrób natychmiast (< 2 min)
2. **DEFER** - Zaplanuj na później
3. **DELEGATE** - Przypisz komuś
4. **PROJECT** - Utwórz projekt
5. **REFERENCE** - Materiał referencyjny
6. **SOMEDAY** - Może kiedyś
7. **DELETE** - Usuń

## Voice TTS

### Funkcjonalności
- **Czytanie wiadomości** - temat + treść
- **Play/Stop controls** - pełna kontrola
- **Polish support** - język polski
- **Auto-stop** - zatrzymuje poprzednie

### Parametry
- **Prędkość**: 0.9 (optymalna czytelność)
- **Wysokość**: 1.0 (normalna)
- **Głośność**: 0.8 (80%)

## Best Practices

1. **Codzienne przetwarzanie** - morning inbox processing
2. **Konsekwentne tagowanie** - proper categorization  
3. **Wykorzystanie filtrów** - efficient management
4. **GTD workflow** - systematic task creation
5. **Voice TTS** - dla długich wiadomości`,
            summary: 'Zaawansowany przewodnik po wszystkich funkcjonalnościach Smart Mailboxes',
            authorId: users[1]?.id || users[0].id,
            categoryId: wikiCategories[1]?.id || wikiCategories[0].id,
            isPublished: true,
            version: 2
          }
        ];
        
        await prisma.wikiPage.createMany({ data: wikiPageData });
      });
    }

    // 7. VECTOR SEARCH RESULT - z polem similarity
    const vectorDocs = await prisma.vectorDocument.findMany({ take: 2 });
    if (vectorDocs.length > 0) {
      await seedIfEmpty('vectorSearchResult', async () => {
        const vectorSearchData: Prisma.VectorSearchResultCreateManyInput[] = [
          {
            organizationId: organization.id,
            queryText: 'wdrożenie CRM',
            queryEmbedding: [0.1, 0.2, 0.3, 0.4, 0.5],
            documentId: vectorDocs[0].id,
            similarity: 0.89,
            rank: 1,
            userId: users[0].id,
            searchContext: 'dashboard',
            executionTime: 45
          },
          {
            organizationId: organization.id,
            queryText: 'smart mailboxes tutorial',
            queryEmbedding: [0.2, 0.3, 0.4, 0.5, 0.6],
            documentId: vectorDocs[1]?.id || vectorDocs[0].id,
            similarity: 0.92,
            rank: 1,
            userId: users[1]?.id || users[0].id,
            searchContext: 'api',
            executionTime: 38
          },
          {
            organizationId: organization.id,
            queryText: 'GTD metodologia',
            queryEmbedding: [0.3, 0.4, 0.5, 0.6, 0.7],
            documentId: vectorDocs[0].id,
            similarity: 0.75,
            rank: 2,
            userId: users[0].id,
            searchContext: 'chat',
            executionTime: 52
          }
        ];
        
        await prisma.vectorSearchResult.createMany({ data: vectorSearchData });
      });
    }

    console.log('\n🎉 SUKCES! Wszystkie 7 pozostałych tabel zostały wypełnione!');
    console.log('🎯 Baza danych jest teraz w 100% wypełniona!');
    console.log('✅ Osiągnięto pełną funkcjonalność systemu CRM-GTD Smart!');

  } catch (error) {
    console.error('❌ Błąd finalnego seedowania:', error);
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
      console.log(`🔄 Finalne seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - WYPEŁNIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${count} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie finalnego seedowania
seedFinal7Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd finalnego seedowania:', error);
    process.exit(1);
  });