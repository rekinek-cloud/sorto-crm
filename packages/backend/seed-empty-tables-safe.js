const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEmptyTablesSafe() {
  console.log('Bezpieczne wypełnianie pustych tabel...\n');

  try {
    // Pobierz pierwszą organizację do wszystkich rekordów
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ Brak organizacji w bazie danych!');
      return;
    }

    console.log(`✅ Używam organizacji: ${organization.name} (${organization.id})\n`);

    // 1. HABITS - Nawyki (sprawdź czy już istnieją)
    const habitsCount = await prisma.habit.count({ where: { organizationId: organization.id } });
    if (habitsCount === 0) {
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
    } else {
      console.log('⏩ Habits już wypełnione - pomijam');
    }

    // 2. RECURRING TASKS - Zadania powtarzalne
    const recurringTasksCount = await prisma.recurringTask.count({ where: { organizationId: organization.id } });
    if (recurringTasksCount === 0) {
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
    } else {
      console.log('⏩ RecurringTask już wypełnione - pomijam');
    }

    // 3. TAGS - Tagi
    const tagsCount = await prisma.tag.count({ where: { organizationId: organization.id } });
    if (tagsCount === 0) {
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
    } else {
      console.log('⏩ Tag już wypełnione - pomijam');
    }

    // 4. FOCUS MODES - Tryby koncentracji
    const focusModesCount = await prisma.focusMode.count({ where: { organizationId: organization.id } });
    if (focusModesCount === 0) {
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
    } else {
      console.log('⏩ FocusMode już wypełnione - pomijam');
    }

    // 5. AREAS OF RESPONSIBILITY - Obszary odpowiedzialności
    const areasCount = await prisma.areaOfResponsibility.count({ where: { organizationId: organization.id } });
    if (areasCount === 0) {
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
    } else {
      console.log('⏩ AreaOfResponsibility już wypełnione - pomijam');
    }

    // 6. LEADS - Potencjalni klienci
    const leadsCount = await prisma.lead.count({ where: { organizationId: organization.id } });
    if (leadsCount === 0) {
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
    } else {
      console.log('⏩ Lead już wypełnione - pomijam');
    }

    // 7. FILES - Pliki
    const filesCount = await prisma.file.count({ where: { organizationId: organization.id } });
    if (filesCount === 0) {
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
    } else {
      console.log('⏩ File już wypełnione - pomijam');
    }

    // 8. INFO - Informacje
    const infosCount = await prisma.info.count({ where: { organizationId: organization.id } });
    if (infosCount === 0) {
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
    } else {
      console.log('⏩ Info już wypełnione - pomijam');
    }

    // 9. RECOMMENDATIONS - Rekomendacje
    const recommendationsCount = await prisma.recommendation.count({ where: { organizationId: organization.id } });
    if (recommendationsCount === 0) {
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
    } else {
      console.log('⏩ Recommendation już wypełnione - pomijam');
    }

    // 10. OFFERS - Oferty
    const offersCount = await prisma.offer.count({ where: { organizationId: organization.id } });
    if (offersCount === 0) {
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
    } else {
      console.log('⏩ Offer już wypełnione - pomijam');
    }

    console.log('\n✅ Bezpieczne seedowanie zakończone pomyślnie!');

  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedEmptyTablesSafe();