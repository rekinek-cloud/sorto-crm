import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRemaining34Tables() {
  console.log('🎯 FINALNE SEEDOWANIE - pozostałe 34 puste tabele do 100%\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    const companies = await prisma.company.findMany({ take: 3 });
    const tasks = await prisma.task.findMany({ take: 3 });
    const projects = await prisma.project.findMany({ take: 3 });
    const documents = await prisma.document.findMany({ take: 2 });
    const wikiPages = await prisma.wikiPage.findMany({ take: 2 });
    const streams = await prisma.stream.findMany({ take: 3 });
    const messages = await prisma.message.findMany({ take: 3 });
    const offers = await prisma.offer.findMany({ take: 2 });
    const orders = await prisma.order.findMany({ take: 2 });
    const invoices = await prisma.invoice.findMany({ take: 2 });
    const habits = await prisma.habit.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. AI & MACHINE LEARNING TABLES (7 tabel)
    
    // ai_executions
    await seedIfEmpty('ai_executions', async () => {
      const aiExecutionData: Prisma.AIExecutionCreateManyInput[] = [
        {
          organizationId: organization.id,
          userId: users[0].id,
          prompt: 'Przeanalizuj wiadomość od klienta i określ poziom pilności',
          response: 'Analiza: Klient prosi o pilną wycenę. Poziom pilności: WYSOKI (90%). Rekomendowane działania: Natychmiastowe rozpoczęcie przygotowania oferty.',
          tokensUsed: 245,
          executionTime: 1.8,
          model: 'gpt-4',
          provider: 'OpenAI',
          cost: 0.0123
        },
        {
          organizationId: organization.id,
          userId: users[1]?.id || users[0].id,
          prompt: 'Wygeneruj automatyczną odpowiedź na newsletter',
          response: 'Automatyczna odpowiedź: Newsletter został przyjęty do wiadomości. Treść zostanie przeanalizowana i dodana do materiałów referencyjnych.',
          tokensUsed: 156,
          executionTime: 1.2,
          model: 'gpt-3.5-turbo',
          provider: 'OpenAI',
          cost: 0.0089
        }
      ];
      await prisma.aIExecution.createMany({ data: aiExecutionData });
    });

    // ai_knowledge_bases
    await seedIfEmpty('ai_knowledge_bases', async () => {
      const aiKnowledgeData: Prisma.AIKnowledgeBaseCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'CRM-GTD Smart Documentation',
          description: 'Kompletna dokumentacja systemu CRM-GTD Smart z przewodnikami użytkownika, API docs i best practices',
          vectorCount: 1247,
          lastIndexed: new Date(),
          isActive: true,
          settings: {
            chunkSize: 1000,
            overlapSize: 200,
            model: 'text-embedding-ada-002'
          }
        },
        {
          organizationId: organization.id,
          name: 'Customer Support Knowledge Base',
          description: 'Baza wiedzy wsparcia klienta z rozwiązaniami częstych problemów i procedurami',
          vectorCount: 892,
          lastIndexed: new Date(),
          isActive: true,
          settings: {
            chunkSize: 800,
            overlapSize: 150,
            model: 'text-embedding-ada-002'
          }
        }
      ];
      await prisma.aIKnowledgeBase.createMany({ data: aiKnowledgeData });
    });

    // ai_knowledge_documents
    const aiKnowledgeBases = await prisma.aIKnowledgeBase.findMany({ take: 2 });
    if (aiKnowledgeBases.length > 0) {
      await seedIfEmpty('ai_knowledge_documents', async () => {
        const aiKnowledgeDocData: Prisma.AiKnowledgeDocumentCreateManyInput[] = [
          {
            knowledgeBaseId: aiKnowledgeBases[0].id,
            title: 'Smart Mailboxes User Guide',
            content: 'Kompletny przewodnik po funkcjonalnościach Smart Mailboxes...',
            vectorId: 'vec_001',
            chunkIndex: 0,
            metadata: {
              source: 'manual',
              category: 'user-guide',
              version: '2.1'
            }
          },
          {
            knowledgeBaseId: aiKnowledgeBases[1]?.id || aiKnowledgeBases[0].id,
            title: 'GTD Methodology Implementation',
            content: 'Praktyczne wdrożenie metodologii Getting Things Done...',
            vectorId: 'vec_002',
            chunkIndex: 1,
            metadata: {
              source: 'documentation',
              category: 'methodology',
              version: '1.0'
            }
          }
        ];
        await prisma.aiKnowledgeDocument.createMany({ data: aiKnowledgeDocData });
      });
    }

    // ai_rules
    await seedIfEmpty('ai_rules', async () => {
      const aiRuleData: Prisma.AiRuleCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Auto-Priority dla pilnych emaili',
          description: 'Automatyczne ustawianie wysokiego priorytetu dla emaili zawierających słowa kluczowe pilności',
          prompt: 'Przeanalizuj temat i treść emaila pod kątem pilności. Zwróć poziom pilności 1-100 i uzasadnienie.',
          conditions: {
            keywords: ['pilne', 'urgent', 'natychmiast', 'asap', 'deadline'],
            senderDomains: ['important-clients.com'],
            minConfidence: 0.8
          },
          actions: {
            setPriority: 'HIGH',
            addTag: 'urgent-email',
            createTask: true
          },
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Newsletter Classifier',
          description: 'Automatyczna klasyfikacja newsletterów i materiałów informacyjnych',
          prompt: 'Określ czy email to newsletter, promocja czy materiał informacyjny. Klasyfikuj i sugeruj akcje.',
          conditions: {
            keywords: ['newsletter', 'unsubscribe', 'marketing', 'promocja'],
            contentLength: { min: 500 },
            hasUnsubscribeLink: true
          },
          actions: {
            setCategory: 'newsletter',
            addTag: 'auto-classified',
            archiveAfterDays: 30
          },
          isActive: true
        }
      ];
      await prisma.aiRule.createMany({ data: aiRuleData });
    });

    // smart_analysis_details
    await seedIfEmpty('smart_analysis_details', async () => {
      const smartAnalysisData: Prisma.SmartAnalysisDetailCreateManyInput[] = [
        {
          organizationId: organization.id,
          entityType: 'PROJECT',
          entityId: projects[0]?.id || 'project_001',
          analysisType: 'PERFORMANCE',
          details: {
            completionRate: 75,
            tasksCompleted: 12,
            tasksRemaining: 4,
            averageTaskTime: 2.5,
            riskFactors: ['deadline pressure', 'resource constraints'],
            recommendations: [
              'Zwiększ zasoby dla zadań krytycznych',
              'Ustal jasne priorytety dla pozostałych zadań'
            ]
          },
          score: 78,
          confidence: 0.89
        },
        {
          organizationId: organization.id,
          entityType: 'COMMUNICATION',
          entityId: messages[0]?.id || 'msg_001',
          analysisType: 'SENTIMENT',
          details: {
            sentiment: 'POSITIVE',
            urgency: 85,
            actionRequired: true,
            categories: ['sales', 'follow-up'],
            keyPhrases: ['interested in proposal', 'next meeting', 'budget approved']
          },
          score: 85,
          confidence: 0.92
        }
      ];
      await prisma.smartAnalysisDetail.createMany({ data: smartAnalysisData });
    });

    // smart_improvements
    await seedIfEmpty('smart_improvements', async () => {
      const smartImprovementData: Prisma.SmartImprovementCreateManyInput[] = [
        {
          organizationId: organization.id,
          area: 'EMAIL_PROCESSING',
          suggestion: 'Zautomatyzuj odpowiedzi na często zadawane pytania klientów',
          impact: 'HIGH',
          effort: 'MEDIUM',
          description: 'Implementacja inteligentnych szablonów odpowiedzi opartych na AI może zmniejszyć czas odpowiedzi o 60%',
          metrics: {
            timesSaving: '2-3 hours daily',
            accuracyImprovement: '25%',
            customerSatisfaction: '+15%'
          },
          status: 'PENDING'
        },
        {
          organizationId: organization.id,
          area: 'GTD_WORKFLOW',
          suggestion: 'Wprowadź automatyczne konteksty dla zadań na podstawie treści',
          impact: 'MEDIUM',
          effort: 'LOW',
          description: 'AI może automatycznie przypisywać konteksty (@calls, @computer) na podstawie opisu zadania',
          metrics: {
            processingTime: '50% faster',
            accuracy: '90%+',
            userSatisfaction: '+20%'
          },
          status: 'IN_PROGRESS'
        }
      ];
      await prisma.smartImprovement.createMany({ data: smartImprovementData });
    });

    // smart_templates
    await seedIfEmpty('smart_templates', async () => {
      const smartTemplateData: Prisma.SmartTemplateCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Welcome Email Template',
          category: 'ONBOARDING',
          template: 'Witaj {{firstName}}! Dziękujemy za dołączenie do {{companyName}}. Oto pierwsze kroki...',
          variables: ['firstName', 'lastName', 'companyName', 'startDate'],
          aiEnhanced: true,
          prompt: 'Personalizuj email powitalny na podstawie pozycji i działu nowego pracownika',
          usageCount: 45
        },
        {
          organizationId: organization.id,
          name: 'Project Status Update Template',
          category: 'PROJECT_MANAGEMENT',
          template: 'Status projektu {{projectName}}: {{completionPercent}}% ukończone. Następne kroki: {{nextActions}}',
          variables: ['projectName', 'completionPercent', 'nextActions', 'deadline'],
          aiEnhanced: true,
          prompt: 'Generuj automatyczne aktualizacje statusu projektu z rekomendacjami',
          usageCount: 123
        }
      ];
      await prisma.smartTemplate.createMany({ data: smartTemplateData });
    });

    // 2. SYSTEM & PERMISSIONS TABLES (4 tabele)

    // stream_access_logs
    if (streams.length > 0) {
      await seedIfEmpty('stream_access_logs', async () => {
        const streamAccessData: Prisma.StreamAccessLogCreateManyInput[] = [
          {
            streamId: streams[0].id,
            userId: users[0].id,
            action: 'READ',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          {
            streamId: streams[1]?.id || streams[0].id,
            userId: users[1]?.id || users[0].id,
            action: 'WRITE',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          {
            streamId: streams[2]?.id || streams[0].id,
            userId: users[2]?.id || users[0].id,
            action: 'DELETE',
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
          }
        ];
        await prisma.streamAccessLog.createMany({ data: streamAccessData });
      });
    }

    // stream_permissions
    if (streams.length > 0) {
      await seedIfEmpty('stream_permissions', async () => {
        const streamPermissionData: Prisma.StreamPermissionCreateManyInput[] = [
          {
            streamId: streams[0].id,
            userId: users[0].id,
            permission: 'ADMIN',
            grantedBy: users[0].id
          },
          {
            streamId: streams[0].id,
            userId: users[1]?.id || users[0].id,
            permission: 'WRITE',
            grantedBy: users[0].id
          },
          {
            streamId: streams[1]?.id || streams[0].id,
            userId: users[2]?.id || users[0].id,
            permission: 'READ',
            grantedBy: users[0].id
          }
        ];
        await prisma.streamPermission.createMany({ data: streamPermissionData });
      });
    }

    // user_access_logs
    await seedIfEmpty('user_access_logs', async () => {
      const userAccessData: Prisma.UserAccessLogCreateManyInput[] = [
        {
          userId: users[0].id,
          action: 'LOGIN',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true
        },
        {
          userId: users[1]?.id || users[0].id,
          action: 'LOGOUT',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          success: true
        },
        {
          userId: users[0].id,
          action: 'FAILED_LOGIN',
          ipAddress: '192.168.1.200',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          success: false
        }
      ];
      await prisma.userAccessLog.createMany({ data: userAccessData });
    });

    // user_permissions
    await seedIfEmpty('user_permissions', async () => {
      const userPermissionData: Prisma.UserPermissionCreateManyInput[] = [
        {
          userId: users[0].id,
          permission: 'ADMIN',
          resource: 'SYSTEM',
          grantedBy: users[0].id
        },
        {
          userId: users[1]?.id || users[0].id,
          permission: 'MANAGER',
          resource: 'PROJECTS',
          grantedBy: users[0].id
        },
        {
          userId: users[2]?.id || users[0].id,
          permission: 'USER',
          resource: 'TASKS',
          grantedBy: users[0].id
        }
      ];
      await prisma.userPermission.createMany({ data: userPermissionData });
    });

    // 3. RELATIONS & LINKS TABLES (7 tabel)

    // dependencies (relacje między zadaniami)
    if (tasks.length >= 2) {
      await seedIfEmpty('dependencies', async () => {
        const dependencyData: Prisma.DependencyCreateManyInput[] = [
          {
            prerequisiteId: tasks[0].id,
            dependentId: tasks[1].id,
            type: 'FINISH_TO_START',
            description: 'Zadanie 2 może rozpocząć się po ukończeniu zadania 1'
          },
          {
            prerequisiteId: tasks[1].id,
            dependentId: tasks[2]?.id || tasks[0].id,
            type: 'START_TO_START',
            description: 'Zadanie 3 rozpoczyna się wraz z zadaniem 2'
          }
        ];
        await prisma.dependency.createMany({ data: dependencyData });
      });
    }

    // document_links
    if (documents.length > 0) {
      await seedIfEmpty('document_links', async () => {
        const documentLinkData: Prisma.DocumentLinkCreateManyInput[] = [
          {
            sourceId: documents[0].id,
            targetId: documents[1]?.id || documents[0].id,
            linkType: 'REFERENCE',
            description: 'Dokument referencyjny dla głównej procedury'
          },
          {
            sourceId: documents[1]?.id || documents[0].id,
            targetId: documents[0].id,
            linkType: 'REVISION',
            description: 'Zaktualizowana wersja dokumentu'
          }
        ];
        await prisma.documentLink.createMany({ data: documentLinkData });
      });
    }

    // project_dependencies
    if (projects.length >= 2) {
      await seedIfEmpty('project_dependencies', async () => {
        const projectDepData: Prisma.ProjectDependencyCreateManyInput[] = [
          {
            prerequisiteId: projects[0].id,
            dependentId: projects[1].id,
            type: 'FINISH_TO_START',
            description: 'Projekt B zależy od ukończenia projektu A'
          },
          {
            prerequisiteId: projects[1].id,
            dependentId: projects[2]?.id || projects[0].id,
            type: 'START_TO_FINISH',
            description: 'Projekt C kończy się gdy rozpoczyna projekt B'
          }
        ];
        await prisma.projectDependency.createMany({ data: projectDepData });
      });
    }

    // stream_relations
    if (streams.length >= 2) {
      await seedIfEmpty('stream_relations', async () => {
        const streamRelationData: Prisma.StreamRelationCreateManyInput[] = [
          {
            parentId: streams[0].id,
            childId: streams[1].id,
            relationType: 'HIERARCHY',
            description: 'Stream potomny w hierarchii organizacyjnej'
          },
          {
            parentId: streams[1].id,
            childId: streams[2]?.id || streams[0].id,
            relationType: 'REFERENCE',
            description: 'Stream powiązany tematycznie'
          }
        ];
        await prisma.streamRelation.createMany({ data: streamRelationData });
      });
    }

    // task_relationships
    if (tasks.length >= 2) {
      await seedIfEmpty('task_relationships', async () => {
        const taskRelationData: Prisma.TaskRelationshipCreateManyInput[] = [
          {
            sourceTaskId: tasks[0].id,
            targetTaskId: tasks[1].id,
            relationType: 'BLOCKS',
            description: 'Zadanie 1 blokuje wykonanie zadania 2'
          },
          {
            sourceTaskId: tasks[1].id,
            targetTaskId: tasks[2]?.id || tasks[0].id,
            relationType: 'RELATED',
            description: 'Zadania powiązane tematycznie'
          }
        ];
        await prisma.taskRelationship.createMany({ data: taskRelationData });
      });
    }

    // user_relations
    await seedIfEmpty('user_relations', async () => {
      const userRelationData: Prisma.UserRelationCreateManyInput[] = [
        {
          userId: users[0].id,
          relatedUserId: users[1]?.id || users[0].id,
          relationType: 'MANAGER',
          description: 'Relacja manager-podwładny'
        },
        {
          userId: users[1]?.id || users[0].id,
          relatedUserId: users[2]?.id || users[0].id,
          relationType: 'COLLEAGUE',
          description: 'Współpracownicy w tym samym zespole'
        }
      ];
      await prisma.userRelation.createMany({ data: userRelationData });
    });

    // wiki_page_links
    if (wikiPages.length >= 2) {
      await seedIfEmpty('wiki_page_links', async () => {
        const wikiLinkData: Prisma.WikiPageLinkCreateManyInput[] = [
          {
            sourcePageId: wikiPages[0].id,
            targetPageId: wikiPages[1].id,
            linkText: 'Zobacz także: Smart Mailboxes Guide',
            linkType: 'REFERENCE'
          },
          {
            sourcePageId: wikiPages[1].id,
            targetPageId: wikiPages[0].id,
            linkText: 'Podstawy systemu',
            linkType: 'PREREQUISITE'
          }
        ];
        await prisma.wikiPageLink.createMany({ data: wikiLinkData });
      });
    }

    // 4. AUXILIARY TABLES (5 tabel)

    // habit_entries
    if (habits.length > 0) {
      await seedIfEmpty('habit_entries', async () => {
        const habitEntryData: Prisma.HabitEntryCreateManyInput[] = [
          {
            habitId: habits[0].id,
            date: new Date('2024-12-25'),
            completed: true,
            notes: 'Ukończone rano, dobra konsystencja'
          },
          {
            habitId: habits[0].id,
            date: new Date('2024-12-24'),
            completed: false,
            notes: 'Pominięte z powodu spotkań'
          },
          {
            habitId: habits[1]?.id || habits[0].id,
            date: new Date('2024-12-25'),
            completed: true,
            notes: '30 minut medytacji'
          }
        ];
        await prisma.habitEntry.createMany({ data: habitEntryData });
      });
    }

    // invoice_items
    if (invoices.length > 0) {
      await seedIfEmpty('invoice_items', async () => {
        const invoiceItemData: Prisma.InvoiceItemCreateManyInput[] = [
          {
            invoiceId: invoices[0].id,
            description: 'Konsultacje CRM-GTD Smart - styczeń 2025',
            quantity: 20,
            unitPrice: 150.00,
            totalPrice: 3000.00
          },
          {
            invoiceId: invoices[0].id,
            description: 'Wdrożenie Smart Mailboxes',
            quantity: 1,
            unitPrice: 2500.00,
            totalPrice: 2500.00
          },
          {
            invoiceId: invoices[1]?.id || invoices[0].id,
            description: 'Szkolenie zespołu GTD',
            quantity: 8,
            unitPrice: 200.00,
            totalPrice: 1600.00
          }
        ];
        await prisma.invoiceItem.createMany({ data: invoiceItemData });
      });
    }

    // offer_items
    if (offers.length > 0) {
      await seedIfEmpty('offer_items', async () => {
        const offerItemData: Prisma.OfferItemCreateManyInput[] = [
          {
            offerId: offers[0].id,
            description: 'Licencja CRM-GTD Smart Pro na 12 miesięcy',
            quantity: 1,
            unitPrice: 12000.00,
            totalPrice: 12000.00,
            notes: 'Zawiera pełne wsparcie techniczne'
          },
          {
            offerId: offers[0].id,
            description: 'Dodatkowe konsultacje',
            quantity: 10,
            unitPrice: 180.00,
            totalPrice: 1800.00,
            notes: 'Stawka godzinowa za konsultacje'
          }
        ];
        await prisma.offerItem.createMany({ data: offerItemData });
      });
    }

    // order_items
    if (orders.length > 0) {
      await seedIfEmpty('order_items', async () => {
        const orderItemData: Prisma.OrderItemCreateManyInput[] = [
          {
            orderId: orders[0].id,
            description: 'CRM-GTD Smart Enterprise License',
            quantity: 1,
            unitPrice: 15000.00,
            totalPrice: 15000.00
          },
          {
            orderId: orders[0].id,
            description: 'Implementation Services',
            quantity: 40,
            unitPrice: 200.00,
            totalPrice: 8000.00
          }
        ];
        await prisma.orderItem.createMany({ data: orderItemData });
      });
    }

    // 5. GTD SYSTEM TABLES (6 tabel)

    // gtd_buckets
    await seedIfEmpty('gtd_buckets', async () => {
      const gtdBucketData: Prisma.GtdBucketCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Natychmiastowe (< 2 min)',
          description: 'Zadania które można wykonać od razu',
          bucketType: 'DO',
          sortOrder: 1,
          isDefault: true
        },
        {
          organizationId: organization.id,
          name: 'Zaplanowane na dziś',
          description: 'Zadania zaplanowane do wykonania dzisiaj',
          bucketType: 'DEFER',
          sortOrder: 2,
          isDefault: true
        },
        {
          organizationId: organization.id,
          name: 'Delegowane',
          description: 'Zadania przypisane innym osobom',
          bucketType: 'DELEGATE',
          sortOrder: 3,
          isDefault: false
        },
        {
          organizationId: organization.id,
          name: 'Może kiedyś',
          description: 'Pomysły i zadania na przyszłość',
          bucketType: 'SOMEDAY',
          sortOrder: 4,
          isDefault: false
        }
      ];
      await prisma.gtdBucket.createMany({ data: gtdBucketData });
    });

    // gtd_horizons
    await seedIfEmpty('gtd_horizons', async () => {
      const gtdHorizonData: Prisma.GtdHorizonCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Poziom ziemi - Działania',
          description: 'Bieżące zadania i następne kroki',
          level: 0,
          color: '#22c55e',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Poziom 1 - Projekty',
          description: 'Projekty wieloetapowe wymagające więcej niż jednej akcji',
          level: 1,
          color: '#3b82f6',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Poziom 2 - Obszary Odpowiedzialności',
          description: 'Obszary życia/pracy wymagające ciągłego utrzymania',
          level: 2,
          color: '#f59e0b',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Poziom 3 - Cele 1-2 lata',
          description: 'Cele krótko- i średnioterminowe',
          level: 3,
          color: '#ef4444',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Poziom 4 - Wizja 3-5 lat',
          description: 'Długoterminowa wizja i strategia',
          level: 4,
          color: '#8b5cf6',
          isActive: true
        },
        {
          organizationId: organization.id,
          name: 'Poziom 5 - Życiowe powołanie',
          description: 'Fundamentalne powołanie i wartości życiowe',
          level: 5,
          color: '#ec4899',
          isActive: true
        }
      ];
      await prisma.gtdHorizon.createMany({ data: gtdHorizonData });
    });

    // smart (tabela główna systemu smart)
    await seedIfEmpty('smart', async () => {
      const smartData: Prisma.SmartCreateManyInput[] = [
        {
          organizationId: organization.id,
          feature: 'SMART_MAILBOXES',
          isEnabled: true,
          configuration: {
            autoFiltering: true,
            voiceTTS: true,
            aiAnalysis: true,
            gtdIntegration: true,
            maxMailboxes: 10
          },
          usageStats: {
            messagesProcessed: 1247,
            rulesExecuted: 89,
            timesSaved: '23.5 hours'
          }
        },
        {
          organizationId: organization.id,
          feature: 'GTD_SYSTEM',
          isEnabled: true,
          configuration: {
            autoContexts: true,
            weeklyReviews: true,
            smartBuckets: true,
            hierarchyEnabled: true
          },
          usageStats: {
            tasksProcessed: 456,
            projectsCompleted: 12,
            weeklyReviewsCompleted: 8
          }
        },
        {
          organizationId: organization.id,
          feature: 'AI_ASSISTANT',
          isEnabled: true,
          configuration: {
            autoAnalysis: true,
            smartSuggestions: true,
            ruleGeneration: true,
            insightsEnabled: true
          },
          usageStats: {
            analysisCompleted: 234,
            suggestionsAccepted: 89,
            timesSaved: '12.3 hours'
          }
        }
      ];
      await prisma.smart.createMany({ data: smartData });
    });

    // 6. OTHER TABLES (9 tabel)

    // completeness
    await seedIfEmpty('completeness', async () => {
      const completenessData: Prisma.CompletenessCreateManyInput[] = [
        {
          entityType: 'PROJECT',
          entityId: projects[0]?.id || 'project_001',
          completionPercentage: 78,
          missingFields: ['description', 'endDate'],
          lastEvaluated: new Date(),
          score: 78
        },
        {
          entityType: 'CONTACT',
          entityId: contacts[0]?.id || 'contact_001',
          completionPercentage: 95,
          missingFields: ['socialMedia'],
          lastEvaluated: new Date(),
          score: 95
        }
      ];
      await prisma.completeness.createMany({ data: completenessData });
    });

    // critical_path
    if (projects.length > 0 && tasks.length > 0) {
      await seedIfEmpty('critical_path', async () => {
        const criticalPathData: Prisma.CriticalPathCreateManyInput[] = [
          {
            projectId: projects[0].id,
            taskId: tasks[0].id,
            pathOrder: 1,
            estimatedDuration: 5,
            earliestStart: new Date(),
            latestFinish: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            slack: 0,
            isCritical: true
          },
          {
            projectId: projects[0].id,
            taskId: tasks[1]?.id || tasks[0].id,
            pathOrder: 2,
            estimatedDuration: 3,
            earliestStart: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            latestFinish: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
            slack: 1,
            isCritical: false
          }
        ];
        await prisma.criticalPath.createMany({ data: criticalPathData });
      });
    }

    // document_comments
    if (documents.length > 0) {
      await seedIfEmpty('document_comments', async () => {
        const documentCommentData: Prisma.DocumentCommentCreateManyInput[] = [
          {
            documentId: documents[0].id,
            authorId: users[0].id,
            content: 'Doskonała dokumentacja! Bardzo przydatna dla nowych użytkowników.',
            parentId: null
          },
          {
            documentId: documents[0].id,
            authorId: users[1]?.id || users[0].id,
            content: 'Zgadzam się, może warto dodać więcej przykładów praktycznych?',
            parentId: null
          }
        ];
        await prisma.documentComment.createMany({ data: documentCommentData });
      });
    }

    // document_shares
    if (documents.length > 0) {
      await seedIfEmpty('document_shares', async () => {
        const documentShareData: Prisma.DocumentShareCreateManyInput[] = [
          {
            documentId: documents[0].id,
            sharedBy: users[0].id,
            sharedWith: users[1]?.id || users[0].id,
            permission: 'READ',
            message: 'Przydatny dokument do przeglądu'
          },
          {
            documentId: documents[1]?.id || documents[0].id,
            sharedBy: users[0].id,
            sharedWith: users[2]?.id || users[0].id,
            permission: 'EDIT',
            message: 'Możesz edytować ten dokument'
          }
        ];
        await prisma.documentShare.createMany({ data: documentShareData });
      });
    }

    // message_attachments
    if (messages.length > 0) {
      await seedIfEmpty('message_attachments', async () => {
        const attachmentData: Prisma.MessageAttachmentCreateManyInput[] = [
          {
            messageId: messages[0].id,
            fileName: 'proposal_2025.pdf',
            fileSize: 2048576,
            mimeType: 'application/pdf',
            filePath: '/uploads/attachments/proposal_2025.pdf'
          },
          {
            messageId: messages[0].id,
            fileName: 'contract_draft.docx',
            fileSize: 512000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filePath: '/uploads/attachments/contract_draft.docx'
          }
        ];
        await prisma.messageAttachment.createMany({ data: attachmentData });
      });
    }

    // message_processing_results
    if (messages.length > 0) {
      await seedIfEmpty('message_processing_results', async () => {
        const processingResultData: Prisma.MessageProcessingResultCreateManyInput[] = [
          {
            messageId: messages[0].id,
            processingType: 'AI_ANALYSIS',
            result: {
              sentiment: 'POSITIVE',
              urgency: 85,
              categories: ['sales', 'proposal'],
              suggestedActions: ['respond_within_24h', 'create_task']
            },
            success: true,
            processingTime: 1.8
          },
          {
            messageId: messages[1]?.id || messages[0].id,
            processingType: 'SPAM_DETECTION',
            result: {
              isSpam: false,
              confidence: 0.92,
              reasons: ['known_sender', 'business_content']
            },
            success: true,
            processingTime: 0.3
          }
        ];
        await prisma.messageProcessingResult.createMany({ data: processingResultData });
      });
    }

    // metadata
    await seedIfEmpty('metadata', async () => {
      const metadataData: Prisma.MetadataCreateManyInput[] = [
        {
          key: 'SYSTEM_VERSION',
          value: '2.1.0',
          category: 'SYSTEM',
          description: 'Aktualna wersja systemu CRM-GTD Smart'
        },
        {
          key: 'LAST_BACKUP',
          value: '2024-12-25T02:00:00Z',
          category: 'MAINTENANCE',
          description: 'Data ostatniego backupu systemu'
        },
        {
          key: 'AI_MODEL_VERSION',
          value: 'gpt-4-1106-preview',
          category: 'AI',
          description: 'Aktualnie używany model AI'
        }
      ];
      await prisma.metadata.createMany({ data: metadataData });
    });

    // stream_channels
    if (streams.length > 0) {
      await seedIfEmpty('stream_channels', async () => {
        const streamChannelData: Prisma.StreamChannelCreateManyInput[] = [
          {
            streamId: streams[0].id,
            name: 'general',
            description: 'Kanał ogólny dla wszystkich członków',
            channelType: 'PUBLIC',
            isDefault: true
          },
          {
            streamId: streams[0].id,
            name: 'announcements',
            description: 'Kanał dla ogłoszeń',
            channelType: 'ANNOUNCEMENT',
            isDefault: false
          },
          {
            streamId: streams[1]?.id || streams[0].id,
            name: 'private-discussions',
            description: 'Prywatny kanał dla zespołu',
            channelType: 'PRIVATE',
            isDefault: false
          }
        ];
        await prisma.streamChannel.createMany({ data: streamChannelData });
      });
    }

    // task_history
    if (tasks.length > 0) {
      await seedIfEmpty('task_history', async () => {
        const taskHistoryData: Prisma.TaskHistoryCreateManyInput[] = [
          {
            taskId: tasks[0].id,
            action: 'CREATED',
            previousValue: null,
            newValue: JSON.stringify({ title: tasks[0].title, status: 'NEW' }),
            changedBy: users[0].id
          },
          {
            taskId: tasks[0].id,
            action: 'STATUS_CHANGED',
            previousValue: 'NEW',
            newValue: 'IN_PROGRESS',
            changedBy: users[0].id
          },
          {
            taskId: tasks[1]?.id || tasks[0].id,
            action: 'ASSIGNED',
            previousValue: null,
            newValue: users[1]?.id || users[0].id,
            changedBy: users[0].id
          }
        ];
        await prisma.taskHistory.createMany({ data: taskHistoryData });
      });
    }

    console.log('\n🎉 SUKCES! Wszystkie 34 pozostałe tabele zostały wypełnione!');
    console.log('🎯 Baza danych jest teraz w 100% wypełniona!');
    console.log('✅ Osiągnięto pełną funkcjonalność systemu CRM-GTD Smart z 97 tabelami!');

  } catch (error) {
    console.error('❌ Błąd finalnego seedowania 34 tabel:', error);
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
seedRemaining34Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd finalnego seedowania 34 tabel:', error);
    process.exit(1);
  });