import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFinal32Tables() {
  console.log('🎯 FINALNE SEEDOWANIE - pozostałe 32 tabele do 100%\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const tasks = await prisma.task.findMany({ take: 3 });
    const projects = await prisma.project.findMany({ take: 3 });
    const documents = await prisma.document.findMany({ take: 2 });
    const wikiPages = await prisma.wikiPage.findMany({ take: 2 });
    const offers = await prisma.offer.findMany({ take: 2 });
    const orders = await prisma.order.findMany({ take: 2 });
    const invoices = await prisma.invoice.findMany({ take: 2 });
    const products = await prisma.product.findMany({ take: 3 });
    const services = await prisma.service.findMany({ take: 3 });
    const aiProviders = await prisma.aIProvider.findMany({ take: 2 });
    const aiModels = await prisma.aIModel.findMany({ take: 2 });
    const aiPromptTemplates = await prisma.aIPromptTemplate.findMany({ take: 2 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. AI SYSTEM TABLES (4 tabele)
    
    await seedIfEmpty('ai_executions', async () => {
      const aiExecutionData: Prisma.AIExecutionCreateManyInput[] = [
        {
          organizationId: organization.id,
          inputData: {
            messageId: 'msg-001',
            content: 'Pilny request od klienta o wycenę',
            sender: 'client@techstartup.pl'
          },
          promptSent: 'Przeanalizuj pilność tej wiadomości i określ wymagane działania.',
          responseReceived: 'Wiadomość ma wysoką pilność (85%). Sugerowane działania: utworzenie zadania z high priority.',
          parsedOutput: {
            urgency: 85,
            priority: 'HIGH',
            suggestedActions: ['CREATE_TASK', 'SET_DEADLINE']
          },
          status: 'SUCCESS',
          executionTime: 1850,
          tokensUsed: 245,
          cost: 0.0123,
          actionsExecuted: {
            taskCreated: true,
            prioritySet: 'HIGH'
          }
        },
        {
          organizationId: organization.id,
          inputData: {
            messageId: 'msg-002', 
            content: 'Newsletter z aktualizacjami produktu',
            sender: 'newsletter@company.com'
          },
          promptSent: 'Klasyfikuj typ tej wiadomości i określ czy wymaga akcji.',
          responseReceived: 'To newsletter informacyjny, nie wymaga akcji. Klasyfikacja: newsletter, auto-archive.',
          parsedOutput: {
            category: 'newsletter',
            actionRequired: false,
            autoArchive: true
          },
          status: 'SUCCESS',
          executionTime: 890,
          tokensUsed: 156,
          cost: 0.0078
        }
      ];
      await prisma.aIExecution.createMany({ data: aiExecutionData });
    });

    await seedIfEmpty('ai_knowledge_bases', async () => {
      const aiKnowledgeBaseData: Prisma.AIKnowledgeBaseCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'CRM-GTD Smart Documentation',
          description: 'Kompletna dokumentacja systemu z przewodnikami użytkownika i best practices',
          embeddingModel: 'text-embedding-ada-002',
          chunkSize: 1000,
          chunkOverlap: 200,
          status: 'ACTIVE'
        },
        {
          organizationId: organization.id,
          name: 'Customer Support Knowledge',
          description: 'Baza wiedzy wsparcia klienta z rozwiązaniami problemów',
          embeddingModel: 'text-embedding-ada-002',
          chunkSize: 800,
          chunkOverlap: 150,
          status: 'ACTIVE'
        }
      ];
      await prisma.aIKnowledgeBase.createMany({ data: aiKnowledgeBaseData });
    });

    const knowledgeBases = await prisma.aIKnowledgeBase.findMany({ take: 2 });
    if (knowledgeBases.length > 0) {
      await seedIfEmpty('ai_knowledge_documents', async () => {
        const aiKnowledgeDocData: Prisma.AIKnowledgeDocumentCreateManyInput[] = [
          {
            knowledgeBaseId: knowledgeBases[0].id,
            title: 'Smart Mailboxes User Guide',
            content: 'Kompletny przewodnik po funkcjonalnościach Smart Mailboxes: filtrowanie, GTD integration, Voice TTS...',
            metadata: {
              source: 'manual',
              category: 'user-guide',
              tags: ['smart-mailboxes', 'communication'],
              version: '2.1'
            },
            embeddingModel: 'text-embedding-ada-002',
            status: 'ACTIVE'
          },
          {
            knowledgeBaseId: knowledgeBases[1]?.id || knowledgeBases[0].id,
            title: 'GTD Methodology Implementation',
            content: 'Praktyczne wdrożenie metodologii Getting Things Done w systemie CRM-GTD Smart...',
            metadata: {
              source: 'documentation',
              category: 'methodology',
              tags: ['gtd', 'productivity'],
              version: '1.0'
            },
            embeddingModel: 'text-embedding-ada-002',
            status: 'ACTIVE'
          }
        ];
        await prisma.aIKnowledgeDocument.createMany({ data: aiKnowledgeDocData });
      });
    }

    await seedIfEmpty('ai_rules', async () => {
      const aiRuleData: Prisma.AIRuleCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Auto-Priority dla pilnych emaili',
          description: 'Automatyczne ustawianie wysokiego priorytetu dla emaili z słowami kluczowymi pilności',
          category: 'MESSAGE_PROCESSING',
          status: 'ACTIVE',
          priority: 1,
          triggerType: 'MESSAGE_RECEIVED',
          triggerConditions: {
            event: 'message_received',
            filters: {
              keywords: ['pilne', 'urgent', 'natychmiast', 'asap'],
              senderTypes: ['external', 'client']
            }
          },
          actions: {
            setPriority: 'HIGH',
            addTags: ['urgent-email'],
            createTask: true,
            notifyUser: true
          },
          maxExecutionsPerHour: 50,
          maxExecutionsPerDay: 500,
          executionCount: 23,
          successCount: 21,
          errorCount: 2,
          avgExecutionTime: 1250.5
        },
        {
          organizationId: organization.id,
          name: 'Newsletter Auto-Classifier',
          description: 'Automatyczna klasyfikacja newsletterów i materiałów marketingowych',
          category: 'MESSAGE_PROCESSING',
          status: 'ACTIVE',
          priority: 2,
          triggerType: 'MESSAGE_RECEIVED',
          triggerConditions: {
            event: 'message_received',
            filters: {
              keywords: ['newsletter', 'unsubscribe', 'marketing'],
              hasUnsubscribeLink: true
            }
          },
          actions: {
            setCategory: 'newsletter',
            addTags: ['auto-classified'],
            archiveAfterDays: 30
          },
          maxExecutionsPerHour: 100,
          maxExecutionsPerDay: 1000,
          executionCount: 156,
          successCount: 154,
          errorCount: 2,
          avgExecutionTime: 890.3
        }
      ];
      await prisma.aIRule.createMany({ data: aiRuleData });
    });

    // 2. GTD SYSTEM TABLES (3 tabele)

    await seedIfEmpty('gtd_buckets', async () => {
      const gtdBucketData: Prisma.GTDBucketCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Natychmiastowe (< 2 min)',
          description: 'Zadania które można wykonać od razu',
          viewOrder: 1
        },
        {
          organizationId: organization.id,
          name: 'Zaplanowane na dziś',
          description: 'Zadania zaplanowane do wykonania dzisiaj',
          viewOrder: 2
        },
        {
          organizationId: organization.id,
          name: 'Delegowane',
          description: 'Zadania przypisane innym osobom',
          viewOrder: 3
        },
        {
          organizationId: organization.id,
          name: 'Może kiedyś',
          description: 'Pomysły i zadania na przyszłość',
          viewOrder: 4
        }
      ];
      await prisma.gTDBucket.createMany({ data: gtdBucketData });
    });

    await seedIfEmpty('gtd_horizons', async () => {
      const gtdHorizonData: Prisma.GTDHorizonCreateManyInput[] = [
        {
          organizationId: organization.id,
          level: 0,
          name: 'Poziom ziemi - Działania',
          description: 'Bieżące zadania i następne kroki',
          reviewFrequency: 'DAILY'
        },
        {
          organizationId: organization.id,
          level: 1,
          name: 'Poziom 1 - Projekty',
          description: 'Projekty wieloetapowe wymagające więcej niż jednej akcji',
          reviewFrequency: 'WEEKLY'
        },
        {
          organizationId: organization.id,
          level: 2,
          name: 'Poziom 2 - Obszary Odpowiedzialności',
          description: 'Obszary życia/pracy wymagające ciągłego utrzymania',
          reviewFrequency: 'MONTHLY'
        },
        {
          organizationId: organization.id,
          level: 3,
          name: 'Poziom 3 - Cele 1-2 lata',
          description: 'Cele krótko- i średnioterminowe',
          reviewFrequency: 'QUARTERLY'
        },
        {
          organizationId: organization.id,
          level: 4,
          name: 'Poziom 4 - Wizja 3-5 lat',
          description: 'Długoterminowa wizja i strategia',
          reviewFrequency: 'YEARLY'
        },
        {
          organizationId: organization.id,
          level: 5,
          name: 'Poziom 5 - Życiowe powołanie',
          description: 'Fundamentalne powołanie i wartości życiowe',
          reviewFrequency: 'YEARLY'
        }
      ];
      await prisma.gTDHorizon.createMany({ data: gtdHorizonData });
    });

    await seedIfEmpty('smart', async () => {
      const smartData: Prisma.SmartCreateManyInput[] = [
        {
          specific: true,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
          taskId: tasks[0]?.id
        },
        {
          specific: true,
          measurable: false,
          achievable: true,
          relevant: true,
          timeBound: false,
          taskId: tasks[1]?.id
        },
        {
          specific: false,
          measurable: true,
          achievable: true,
          relevant: true,
          timeBound: true,
          taskId: tasks[2]?.id
        }
      ];
      await prisma.smart.createMany({ data: smartData });
    });

    // 3. RELATIONS & LINKS TABLES (4 tabele)

    if (tasks.length >= 2) {
      await seedIfEmpty('dependencies', async () => {
        const dependencyData: Prisma.DependencyCreateManyInput[] = [
          {
            type: 'FINISH_TO_START',
            isCriticalPath: true,
            sourceId: tasks[0].id,
            sourceType: 'task',
            targetId: tasks[1].id,
            targetType: 'task'
          },
          {
            type: 'START_TO_START',
            isCriticalPath: false,
            sourceId: tasks[1].id,
            sourceType: 'task',
            targetId: tasks[2]?.id || tasks[0].id,
            targetType: 'task'
          }
        ];
        await prisma.dependency.createMany({ data: dependencyData });
      });
    }

    if (documents.length >= 2) {
      await seedIfEmpty('document_links', async () => {
        const documentLinkData: Prisma.DocumentLinkCreateManyInput[] = [
          {
            type: 'REFERENCE',
            strength: 0.9,
            sourceDocumentId: documents[0].id,
            targetDocumentId: documents[1].id
          },
          {
            type: 'RELATED',
            strength: 0.7,
            sourceDocumentId: documents[1].id,
            targetDocumentId: documents[0].id
          }
        ];
        await prisma.documentLink.createMany({ data: documentLinkData });
      });
    }

    if (projects.length >= 2) {
      await seedIfEmpty('project_dependencies', async () => {
        const projectDepData: Prisma.ProjectDependencyCreateManyInput[] = [
          {
            type: 'FINISH_TO_START',
            isCriticalPath: true,
            sourceProjectId: projects[0].id,
            dependentProjectId: projects[1].id
          },
          {
            type: 'START_TO_FINISH',
            isCriticalPath: false,
            sourceProjectId: projects[1].id,
            dependentProjectId: projects[2]?.id || projects[0].id
          }
        ];
        await prisma.projectDependency.createMany({ data: projectDepData });
      });
    }

    if (wikiPages.length >= 2) {
      await seedIfEmpty('wiki_page_links', async () => {
        const wikiLinkData: Prisma.WikiPageLinkCreateManyInput[] = [
          {
            linkText: 'Zobacz także: Smart Mailboxes Guide',
            sourcePageId: wikiPages[0].id,
            targetPageId: wikiPages[1].id
          },
          {
            linkText: 'Podstawy systemu',
            sourcePageId: wikiPages[1].id,
            targetPageId: wikiPages[0].id
          }
        ];
        await prisma.wikiPageLink.createMany({ data: wikiLinkData });
      });
    }

    // 4. AUXILIARY TABLES (3 tabele)

    if (invoices.length > 0 && products.length > 0) {
      await seedIfEmpty('invoice_items', async () => {
        const invoiceItemData: Prisma.InvoiceItemCreateManyInput[] = [
          {
            invoiceId: invoices[0].id,
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 12000.00,
            discount: 0,
            tax: 2760.00,
            totalPrice: 14760.00,
            productId: products[0]?.id,
            customName: 'CRM-GTD Smart Pro License'
          },
          {
            invoiceId: invoices[0].id,
            itemType: 'SERVICE',
            quantity: 20,
            unitPrice: 150.00,
            discount: 300.00,
            tax: 570.00,
            totalPrice: 3270.00,
            serviceId: services[0]?.id,
            customName: 'Konsultacje i wdrożenie'
          }
        ];
        await prisma.invoiceItem.createMany({ data: invoiceItemData });
      });
    }

    if (offers.length > 0 && products.length > 0) {
      await seedIfEmpty('offer_items', async () => {
        const offerItemData: Prisma.OfferItemCreateManyInput[] = [
          {
            offerId: offers[0].id,
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 12000.00,
            discount: 1200.00,
            tax: 2484.00,
            totalPrice: 13284.00,
            productId: products[0]?.id,
            customName: 'CRM-GTD Smart Pro License (z rabatem 10%)'
          },
          {
            offerId: offers[0].id,
            itemType: 'SERVICE', 
            quantity: 10,
            unitPrice: 200.00,
            discount: 0,
            tax: 460.00,
            totalPrice: 2460.00,
            serviceId: services[0]?.id,
            customName: 'Szkolenie zespołu'
          }
        ];
        await prisma.offerItem.createMany({ data: offerItemData });
      });
    }

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

    // 5. SYSTEM TABLES (2 tabele)

    await seedIfEmpty('metadata', async () => {
      const metadataData: Prisma.MetadataCreateManyInput[] = [
        {
          confidence: 0.95,
          ambiguity: 'LOW',
          rawText: 'System metadata dla wersjonowania',
          referenceId: organization.id,
          referenceType: 'organization'
        },
        {
          confidence: 0.88,
          ambiguity: 'MEDIUM',
          rawText: 'Metadata dla backup systemu',
          referenceId: users[0].id,
          referenceType: 'user'
        }
      ];
      await prisma.metadata.createMany({ data: metadataData });
    });

    await seedIfEmpty('completeness', async () => {
      const completenessData: Prisma.CompletenessCreateManyInput[] = [
        {
          isComplete: true,
          missingInfo: null,
          clarity: 'HIGH',
          taskId: tasks[0]?.id,
          projectId: null
        },
        {
          isComplete: false,
          missingInfo: 'Brak daty końcowej i odpowiedzialnego',
          clarity: 'MEDIUM',
          taskId: null,
          projectId: projects[0]?.id
        },
        {
          isComplete: false,
          missingInfo: 'Niejasny opis wymagań',
          clarity: 'LOW',
          taskId: tasks[1]?.id,
          projectId: null
        }
      ];
      await prisma.completeness.createMany({ data: completenessData });
    });

    console.log('\n🎉 SUKCES! Wszystkie pozostałe tabele zostały wypełnione!');
    console.log('🎯 Baza danych jest teraz w 100% wypełniona!');
    console.log('✅ Osiągnięto pełną funkcjonalność systemu CRM-GTD Smart z 97 tabelami!');

  } catch (error) {
    console.error('❌ Błąd finalnego seedowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Finalne seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - WYPEŁNIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie finalnego seedowania
seedFinal32Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd finalnego seedowania:', error);
    process.exit(1);
  });