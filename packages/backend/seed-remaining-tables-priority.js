const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Enums potrzebne
const TaskStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS', 
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const BugSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

const ItemType = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
  CUSTOM: 'CUSTOM'
};

const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const RuleType = {
  PROCESSING: 'PROCESSING',
  EMAIL_FILTER: 'EMAIL_FILTER',
  AUTO_REPLY: 'AUTO_REPLY',
  AI_RULE: 'AI_RULE',
  SMART_MAILBOX: 'SMART_MAILBOX',
  WORKFLOW: 'WORKFLOW', 
  NOTIFICATION: 'NOTIFICATION',
  INTEGRATION: 'INTEGRATION',
  CUSTOM: 'CUSTOM'
};

const TriggerType = {
  EVENT_BASED: 'EVENT_BASED',
  MANUAL: 'MANUAL',
  SCHEDULED: 'SCHEDULED',
  WEBHOOK: 'WEBHOOK',
  API_CALL: 'API_CALL',
  AUTOMATIC: 'AUTOMATIC'
};

async function seedRemainingTables() {
  console.log('🚀 Rozpoczynam wypełnianie pozostałych tabel...');
  
  try {
    // Pobierz dane potrzebne do relacji
    const organizations = await prisma.organization.findMany();
    const users = await prisma.user.findMany();
    const tasks = await prisma.task.findMany();
    const invoices = await prisma.invoice.findMany();
    const offers = await prisma.offer.findMany();
    const documents = await prisma.document.findMany();
    const messages = await prisma.message.findMany();
    
    console.log(`📊 Dostępne dane: ${organizations.length} org, ${users.length} users, ${tasks.length} tasks`);
    
    if (organizations.length === 0) {
      throw new Error('Brak organizacji w bazie - wymagane do wypełnienia tabel');
    }

    const orgId = organizations[0].id;
    const userId = users.length > 0 ? users[0].id : null;
    
    let created = 0;

    // 1. DelegatedTask - delegowane zadania (PRIORYTET WYSOKI)
    console.log('📋 1. Tworzę DelegatedTask...');
    try {
      const delegatedTasks = [
        {
          description: 'Przeprowadzenie code review systemu komunikacji',
          delegatedTo: users[1]?.email || 'dev@techsolutions.pl',
          delegatedOn: new Date(),
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: TaskStatus.IN_PROGRESS,
          notes: 'Focus na Smart Mailboxes i Rules Manager',
          organizationId: orgId,
          taskId: tasks[0]?.id || null
        },
        {
          description: 'Optymalizacja wydajności zapytań bazodanowych',
          delegatedTo: users[2]?.email || 'backend@techsolutions.pl',
          delegatedOn: new Date(),
          followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: TaskStatus.NEW,
          notes: 'Szczególna uwaga na tabele z dużą ilością danych',
          organizationId: orgId,
          taskId: tasks[1]?.id || null
        }
      ];
      
      for (const data of delegatedTasks) {
        await prisma.delegatedTask.create({ data });
        created++;
      }
      console.log('✅ DelegatedTask: 2 rekordy');
    } catch (e) {
      console.log(`❌ DelegatedTask error: ${e.message}`);
    }

    // 2. InvoiceItem - pozycje faktur (PRIORYTET WYSOKI)
    console.log('💰 2. Tworzę InvoiceItem...');
    try {
      const invoiceItems = [
        {
          itemType: ItemType.PRODUCT,
          quantity: 1,
          unitPrice: 2999.00,
          totalPrice: 2999.00,
          customName: 'Licencja CRM-GTD Smart Pro',
          customDescription: 'Roczna licencja na oprogramowanie CRM-GTD Smart w wersji Professional',
          invoiceId: invoices[0]?.id || await createDummyInvoice(orgId)
        },
        {
          itemType: ItemType.SERVICE,
          quantity: 8,
          unitPrice: 250.00,
          totalPrice: 2000.00,
          customName: 'Usługa wdrożenia i konfiguracji',
          customDescription: 'Profesjonalne wdrożenie systemu z konfiguracją i migracją danych (8h)',
          invoiceId: invoices[0]?.id || await createDummyInvoice(orgId)
        },
        {
          itemType: ItemType.CUSTOM,
          quantity: 1,
          unitPrice: 1149.77,
          totalPrice: 1149.77,
          customName: 'VAT 23%',
          customDescription: 'Podatek VAT od łącznej wartości usług i produktów',
          invoiceId: invoices[0]?.id || await createDummyInvoice(orgId)
        }
      ];
      
      for (const data of invoiceItems) {
        await prisma.invoiceItem.create({ data });
        created++;
      }
      console.log('✅ InvoiceItem: 3 rekordy');
    } catch (e) {
      console.log(`❌ InvoiceItem error: ${e.message}`);
    }

    // 3. OfferItem - pozycje ofert (PRIORYTET WYSOKI)
    console.log('📄 3. Tworzę OfferItem...');
    try {
      // Najpierw stwórz ofertę jeśli nie ma
      let offerId;
      if (offers.length === 0) {
        const newOffer = await prisma.offer.create({
          data: {
            offerNumber: 'OFF-2025-001',
            title: 'Oferta CRM-GTD Smart Enterprise',
            description: 'Kompleksowe rozwiązanie CRM z GTD dla przedsiębiorstw',
            customerName: 'TechStartup Innovations Sp. z o.o.',
            customerEmail: 'ceo@techstartup.pl',
            totalAmount: 15000.00,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            organization: { connect: { id: orgId } },
            createdBy: { connect: { id: userId } }
          }
        });
        offerId = newOffer.id;
      } else {
        offerId = offers[0].id;
      }

      const offerItems = [
        {
          itemType: ItemType.PRODUCT,
          quantity: 1,
          unitPrice: 8999.00,
          totalPrice: 8999.00,
          customName: 'CRM-GTD Smart Enterprise (50 użytkowników)',
          customDescription: 'Licencja Enterprise na 50 użytkowników z pełnym dostępem do wszystkich funkcji',
          offerId: offerId
        },
        {
          itemType: ItemType.SERVICE,
          quantity: 16,
          unitPrice: 200.00,
          totalPrice: 3200.00,
          customName: 'Dedykowane szkolenie zespołu (16h)',
          customDescription: 'Indywidualne szkolenie zespołu z metodologii GTD i obsługi systemu',
          offerId: offerId
        },
        {
          itemType: ItemType.SERVICE,
          quantity: 12,
          unitPrice: 299.00,
          totalPrice: 2801.00,
          customName: 'Wsparcie techniczne Premium (12 miesięcy)',
          customDescription: 'Priorytetowe wsparcie techniczne przez 12 miesięcy z SLA 4h',
          offerId: offerId
        }
      ];
      
      for (const data of offerItems) {
        await prisma.offerItem.create({ data });
        created++;
      }
      console.log('✅ OfferItem: 3 rekordy');
    } catch (e) {
      console.log(`❌ OfferItem error: ${e.message}`);
    }

    // 4. BugReport - raporty błędów (PRIORYTET WYSOKI)
    console.log('🐛 4. Tworzę BugReport...');
    try {
      const bugReports = [
        {
          title: 'Smart Mailboxes - błąd filtrowania dat',
          description: 'Filtr Custom Date Range nie działa poprawnie dla dat z przeszłego miesiąca. Wyświetla błędne wyniki.',
          priority: 'MEDIUM',
          status: 'OPEN',
          url: '/crm/dashboard/smart-mailboxes/',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          stepsToReproduce: '1. Otwórz Smart Mailboxes\n2. Wybierz Custom Date Range\n3. Ustaw zakres na poprzedni miesiąc\n4. Kliknij Apply Filter',
          expectedBehavior: 'Powinny się wyświetlić wiadomości z poprzedniego miesiąca',
          actualBehavior: 'Wyświetlają się wszystkie wiadomości bez filtrowania',
          reporterId: userId,
          organizationId: orgId
        },
        {
          title: 'Voice TTS - nie zatrzymuje się poprawnie',
          description: 'Przycisk Stop w Smart Mailboxes czasami nie zatrzymuje czytania wiadomości. Problem występuje w Chrome.',
          priority: 'LOW',
          status: 'OPEN',
          url: '/crm/dashboard/smart-mailboxes/',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0',
          browserInfo: 'Chrome 91.0.4472.124',
          deviceInfo: 'Windows 10 Pro 64-bit',
          stepsToReproduce: '1. Otwórz wiadomość w Smart Mailboxes\n2. Kliknij Przeczytaj\n3. Kliknij Stop podczas czytania',
          expectedBehavior: 'Czytanie powinno się natychmiast zatrzymać',
          actualBehavior: 'Czasami czytanie kontynuuje przez kilka sekund',
          reporterId: userId,
          organizationId: orgId
        },
        {
          title: 'Rules Manager - błąd walidacji',
          description: 'Tworzenie reguły AI_RULE z pustymi triggerConditions powoduje crash backend.',
          priority: 'HIGH',
          status: 'RESOLVED',
          url: '/crm/dashboard/rules-manager/',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          stepsToReproduce: '1. Otwórz Rules Manager\n2. Utwórz nową regułę AI_RULE\n3. Pozostaw triggerConditions puste\n4. Kliknij Save',
          expectedBehavior: 'Powinien pokazać błąd walidacji',
          actualBehavior: 'Backend crashuje z błędem 500',
          reporterId: userId,
          organizationId: orgId
        }
      ];
      
      for (const data of bugReports) {
        await prisma.bugReport.create({ data });
        created++;
      }
      console.log('✅ BugReport: 3 rekordy');
    } catch (e) {
      console.log(`❌ BugReport error: ${e.message}`);
    }

    // 5. ErrorLog - logi błędów (PRIORYTET WYSOKI)
    console.log('📊 5. Tworzę ErrorLog...');
    try {
      const errorLogs = [
        {
          message: 'Failed to process email rule: Invalid regex pattern in condition',
          stack: 'Error: Invalid regex at line 42\n  at EmailService.validateCondition',
          url: '/crm/api/v1/unified-rules/execute',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: ErrorSeverity.HIGH,
          context: JSON.stringify({ ruleId: 'rule-123', email: 'test@example.com' }),
          sessionId: 'sess_' + Math.random().toString(36).substring(7),
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          userId: userId,
          organizationId: orgId
        },
        {
          message: 'Voice TTS service temporarily unavailable, falling back to browser API',
          url: '/crm/api/v1/voice/synthesize',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: ErrorSeverity.MEDIUM,
          context: JSON.stringify({ fallback: 'browser-tts', text_length: 156 }),
          sessionId: 'sess_' + Math.random().toString(36).substring(7),
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          userId: userId,
          organizationId: orgId
        },
        {
          message: 'Database connection lost during transaction',
          stack: 'Connection Error: ECONNRESET\n  at PostgreSQL.connect',
          url: '/crm/api/v1/users/import',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: ErrorSeverity.CRITICAL,
          context: JSON.stringify({ transaction: 'user-import', affected_records: 25 }),
          sessionId: 'sess_' + Math.random().toString(36).substring(7),
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          organizationId: orgId
        }
      ];
      
      for (const data of errorLogs) {
        await prisma.errorLog.create({ data });
        created++;
      }
      console.log('✅ ErrorLog: 3 rekordy');
    } catch (e) {
      console.log(`❌ ErrorLog error: ${e.message}`);
    }

    // 6. UnifiedRule - zunifikowane reguły (PRIORYTET ŚREDNI)
    console.log('⚙️ 6. Tworzę UnifiedRule...');
    try {
      const unifiedRules = [
        {
          name: 'Auto-prioritas dla pilnych emaili',
          description: 'Automatycznie ustawia wysoki priorytet dla emaili ze słowami PILNE, URGENT',
          ruleType: RuleType.PROCESSING,
          triggerType: TriggerType.EVENT_BASED,
          conditions: JSON.stringify({
            event: 'MESSAGE_RECEIVED',
            conditions: [
              { field: 'subject', operator: 'contains', value: 'PILNE' },
              { field: 'subject', operator: 'contains', value: 'URGENT' }
            ]
          }),
          actions: JSON.stringify([
            { type: 'SET_PRIORITY', value: 'HIGH' },
            { type: 'ADD_TAG', value: 'priority-urgent' }
          ]),
          status: 'ACTIVE',
          organizationId: orgId,
          createdBy: userId
        },
        {
          name: 'Newsletter Auto-Classifier',
          description: 'Automatyczne klasyfikowanie newsletterów jako REFERENCE',
          ruleType: RuleType.EMAIL_FILTER,
          triggerType: TriggerType.AUTOMATIC,
          conditions: JSON.stringify({
            conditions: [
              { field: 'sender', operator: 'contains', value: 'newsletter' },
              { field: 'subject', operator: 'contains', value: 'unsubscribe' }
            ]
          }),
          actions: JSON.stringify([
            { type: 'CLASSIFY', value: 'REFERENCE' },
            { type: 'SET_READ', value: true },
            { type: 'MOVE_TO_FOLDER', value: 'newsletters' }
          ]),
          status: 'ACTIVE',
          organizationId: orgId,
          createdBy: userId
        }
      ];
      
      for (const data of unifiedRules) {
        await prisma.unifiedRule.create({ data });
        created++;
      }
      console.log('✅ UnifiedRule: 2 rekordy');
    } catch (e) {
      console.log(`❌ UnifiedRule error: ${e.message}`);
    }

    // 7. UnifiedRuleExecution - wykonania reguł (PRIORYTET ŚREDNI)
    console.log('⚡ 7. Tworzę UnifiedRuleExecution...');
    try {
      const rules = await prisma.unifiedRule.findMany();
      
      if (rules.length > 0) {
        const ruleExecutions = [
          {
            triggeredBy: 'MESSAGE_RECEIVED',
            executionTime: 145,
            status: 'SUCCESS',
            result: JSON.stringify({
              success: true,
              actions_performed: ['SET_PRIORITY', 'ADD_TAG'],
              affected_entities: 1
            }),
            ruleId: rules[0].id,
            organizationId: orgId
          },
          {
            triggeredBy: 'SCHEDULED_CHECK',
            executionTime: 89,
            status: 'SUCCESS',
            result: JSON.stringify({
              success: true,
              actions_performed: ['CLASSIFY', 'SET_READ', 'MOVE_TO_FOLDER'],
              affected_entities: 3
            }),
            ruleId: rules[1]?.id || rules[0].id,
            organizationId: orgId
          }
        ];
        
        for (const data of ruleExecutions) {
          await prisma.unifiedRuleExecution.create({ data });
          created++;
        }
        console.log('✅ UnifiedRuleExecution: 2 rekordy');
      }
    } catch (e) {
      console.log(`❌ UnifiedRuleExecution error: ${e.message}`);
    }

    console.log(`\n🎉 SUKCES! Utworzono łącznie ${created} nowych rekordów`);
    console.log('📊 Sprawdzam aktualny stan bazy...');
    
    // Sprawdź stan po wypełnieniu
    await checkDatabaseStatus();

  } catch (error) {
    console.error('❌ Błąd podczas wypełniania:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createDummyInvoice(orgId) {
  console.log('📄 Tworzę dummy invoice...');
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      totalAmount: 6148.77,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      organizationId: orgId
    }
  });
  return invoice.id;
}

async function checkDatabaseStatus() {
  try {
    const tables = [
      'delegatedTask', 'invoiceItem', 'offerItem', 'bugReport', 
      'errorLog', 'unifiedRule', 'unifiedRuleExecution'
    ];
    
    console.log('\n=== NOWY STAN PRIORYTETOWYCH TABEL ===');
    let totalFilled = 0;
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        const status = count > 0 ? '✅' : '🔴';
        console.log(`${status} ${table}: ${count} rekordów`);
        if (count > 0) totalFilled++;
      } catch (e) {
        console.log(`❌ ${table}: ERROR`);
      }
    }
    
    console.log(`\n📊 PRIORYTETOWE TABELE: ${totalFilled}/${tables.length} wypełnione (${(totalFilled/tables.length*100).toFixed(1)}%)`);
    
    // Sprawdź łączny stan bazy
    const allTables = await prisma.$queryRaw`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma_%'
      ORDER BY tablename;
    `;
    
    console.log(`\n📈 ŁĄCZNY STAN BAZY: ${allTables.length} tabel`);
    
  } catch (error) {
    console.error('Błąd sprawdzania stanu:', error);
  }
}

// Uruchom skrypt
if (require.main === module) {
  seedRemainingTables()
    .catch((error) => {
      console.error('❌ FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = { seedRemainingTables };