import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFix5Tables() {
  console.log('🎯 NAPRAWIANIE 5 pustych tabel\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const orders = await prisma.order.findMany({ take: 2 });
    const messages = await prisma.message.findMany({ take: 3 });
    const habits = await prisma.habit.findMany({ take: 3 });
    const products = await prisma.product.findMany({ take: 3 });
    const services = await prisma.service.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. ORDER_ITEMS - z poprawną strukturą
    if (orders.length > 0 && products.length > 0) {
      await seedIfEmpty('order_items', async () => {
        const orderItemData: Prisma.OrderItemCreateManyInput[] = [
          {
            orderId: orders[0].id,
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 15000.00,
            discount: 0,
            tax: 3450.00,
            totalPrice: 18450.00,
            productId: products[0]?.id,
            customName: 'CRM-GTD Smart Enterprise License'
          },
          {
            orderId: orders[0].id,
            itemType: 'SERVICE',
            quantity: 40,
            unitPrice: 200.00,
            discount: 800.00,
            tax: 1840.00,
            totalPrice: 9040.00,
            serviceId: services[0]?.id,
            customName: 'Implementation Services (40 godzin)'
          }
        ];
        await prisma.orderItem.createMany({ data: orderItemData });
      });
    }

    // 2. MESSAGE_ATTACHMENTS - z poprawną strukturą
    if (messages.length > 0) {
      await seedIfEmpty('message_attachments', async () => {
        const attachmentData: Prisma.MessageAttachmentCreateManyInput[] = [
          {
            messageId: messages[0].id,
            fileName: 'proposal_2025.pdf',
            fileType: 'application/pdf',
            fileSize: 2048576,
            contentType: 'application/pdf',
            storagePath: '/uploads/attachments/proposal_2025.pdf',
            isInline: false
          },
          {
            messageId: messages[0].id,
            fileName: 'contract_draft.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 512000,
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            storagePath: '/uploads/attachments/contract_draft.docx',
            isInline: false
          },
          {
            messageId: messages[1]?.id || messages[0].id,
            fileName: 'screenshot.png',
            fileType: 'image/png',
            fileSize: 256000,
            contentType: 'image/png',
            storagePath: '/uploads/attachments/screenshot.png',
            isInline: true,
            contentId: 'image001'
          }
        ];
        await prisma.messageAttachment.createMany({ data: attachmentData });
      });
    }

    // 3. INBOX_ITEMS - z poprawną strukturą GTD
    await seedIfEmpty('inbox_items', async () => {
      const inboxItemData: Prisma.InboxItemCreateManyInput[] = [
        {
          organizationId: organization.id,
          content: 'Przygotować prezentację na spotkanie z klientem XYZ Corp',
          note: 'Wymagane: analiza potrzeb, case studies, demo systemu',
          sourceType: 'QUICK_CAPTURE',
          source: 'manual',
          urgencyScore: 8,
          context: '@computer',
          estimatedTime: '120 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Zadzwonić do dostawcy w sprawie opóźnień w dostawie',
          note: 'Numer: +48 123 456 789, kontakt: Jan Kowalski',
          sourceType: 'PHONE_CALL',
          source: 'manual',
          urgencyScore: 9,
          context: '@calls',
          estimatedTime: '15 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Pomysł: System automatycznego raportowania KPI',
          note: 'Integracja z dashboardem, wykrelsy real-time, alerty email',
          sourceType: 'IDEA',
          source: 'manual',
          urgencyScore: 3,
          context: '@someday',
          estimatedTime: '480 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[1]?.id || users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Przeczytać artykuł o najnowszych trendach w AI',
          note: 'Link: https://example.com/ai-trends-2024',
          sourceType: 'ARTICLE',
          source: 'manual',
          sourceUrl: 'https://example.com/ai-trends-2024',
          urgencyScore: 2,
          context: '@reading',
          estimatedTime: '30 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Notatki ze spotkania z zespołem DS',
          note: 'Ustalenia: nowy workflow, deadline 15.01, odpowiedzialny: Anna',
          sourceType: 'MEETING_NOTES',
          source: 'manual',
          urgencyScore: 7,
          context: '@computer',
          estimatedTime: '60 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[2]?.id || users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Opłacić fakturę za hosting serwerów',
          note: 'Kwota: 2500 PLN, termin: 31.12.2024',
          sourceType: 'BILL_INVOICE',
          source: 'email',
          urgencyScore: 8,
          context: '@computer',
          estimatedTime: '10 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[0].id
        },
        {
          organizationId: organization.id,
          content: 'Dokumentacja API wymaga aktualizacji',
          note: 'Dodać nowe endpointy, poprawić przykłady, aktualizować changelog',
          sourceType: 'DOCUMENT',
          source: 'manual',
          urgencyScore: 5,
          context: '@computer',
          estimatedTime: '180 min',
          capturedAt: new Date(),
          processed: false,
          actionable: true,
          capturedById: users[1]?.id || users[0].id
        }
      ];
      await prisma.inboxItem.createMany({ data: inboxItemData });
    });

    // 4. DELEGATED_TASKS - z poprawną strukturą
    await seedIfEmpty('delegated_tasks', async () => {
      const delegatedTaskData: Prisma.DelegatedTaskCreateManyInput[] = [
        {
          organizationId: organization.id,
          description: 'Przygotowanie raportu miesięcznego sprzedaży',
          delegatedTo: 'Anna Kowalska',
          delegatedOn: new Date(),
          followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dni
          status: 'IN_PROGRESS',
          notes: 'Wymagany podział na regiony i kanały sprzedaży'
        },
        {
          organizationId: organization.id,
          description: 'Code review nowej funkcjonalności Smart Mailboxes',
          delegatedTo: 'Piotr Wiśniewski',
          delegatedOn: new Date(),
          followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dni
          status: 'NEW',
          notes: 'Szczególną uwagę zwrócić na security i performance'
        },
        {
          organizationId: organization.id,
          description: 'Aktualizacja dokumentacji użytkownika',
          delegatedTo: 'Katarzyna Wójcik',
          delegatedOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dni temu
          followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dni
          status: 'COMPLETED',
          notes: 'Dokument został zaktualizowany i przesłany do review'
        }
      ];
      await prisma.delegatedTask.createMany({ data: delegatedTaskData });
    });

    // 5. HABIT_ENTRIES - już działa, ale dodaj więcej danych
    if (habits.length > 0) {
      await seedIfEmpty('habit_entries', async () => {
        const habitEntryData: Prisma.HabitEntryCreateManyInput[] = [
          {
            habitId: habits[0].id,
            date: new Date('2024-12-27'),
            completed: true,
            notes: 'Ukończone rano o 6:00, świetny start dnia'
          },
          {
            habitId: habits[0].id,
            date: new Date('2024-12-26'),
            completed: false,
            notes: 'Pominięte z powodu choroby'
          },
          {
            habitId: habits[0].id,
            date: new Date('2024-12-25'),
            completed: true,
            notes: 'Nawet w święta - konsystencja kluczowa!'
          },
          {
            habitId: habits[1]?.id || habits[0].id,
            date: new Date('2024-12-27'),
            completed: true,
            notes: '45 minut medytacji, deep focus session'
          },
          {
            habitId: habits[1]?.id || habits[0].id,
            date: new Date('2024-12-26'),
            completed: true,
            notes: '20 minut, shorter due to time constraints'
          },
          {
            habitId: habits[2]?.id || habits[0].id,
            date: new Date('2024-12-27'),
            completed: false,
            notes: 'Nie zdążyłem, za dużo spotkań'
          }
        ];
        await prisma.habitEntry.createMany({ data: habitEntryData });
      });
    }

    console.log('\n🎉 SUKCES! Wszystkie 5 problematycznych tabel zostały naprawione!');
    console.log('✅ order_items - poprawiono itemType');
    console.log('✅ message_attachments - poprawiono fileType');  
    console.log('✅ inbox_items - dodano pełną strukturę GTD');
    console.log('✅ delegated_tasks - dodano DelegatedTo i Follow-up');
    console.log('✅ habit_entries - dodano więcej wpisów');

  } catch (error) {
    console.error('❌ Błąd naprawy 5 tabel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Naprawianie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - NAPRAWIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie naprawy
seedFix5Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd naprawy 5 tabel:', error);
    process.exit(1);
  });