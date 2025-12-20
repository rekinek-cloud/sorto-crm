import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBasic34Tables() {
  console.log('🎯 PODSTAWOWE SEEDOWANIE - 34 puste tabele\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const tasks = await prisma.task.findMany({ take: 3 });
    const projects = await prisma.project.findMany({ take: 3 });
    const contacts = await prisma.contact.findMany({ take: 3 });
    const messages = await prisma.message.findMany({ take: 3 });
    const documents = await prisma.document.findMany({ take: 2 });
    const streams = await prisma.stream.findMany({ take: 3 });
    const habits = await prisma.habit.findMany({ take: 3 });
    const offers = await prisma.offer.findMany({ take: 2 });
    const orders = await prisma.order.findMany({ take: 2 });
    const invoices = await prisma.invoice.findMany({ take: 2 });
    const wikiPages = await prisma.wikiPage.findMany({ take: 2 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. BASIC AUXILIARY TABLES

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
          }
        ];
        await prisma.habitEntry.createMany({ data: habitEntryData });
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
          }
        ];
        await prisma.taskHistory.createMany({ data: taskHistoryData });
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
          }
        ];
        await prisma.taskRelationship.createMany({ data: taskRelationData });
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
        }
      ];
      await prisma.userPermission.createMany({ data: userPermissionData });
    });

    // user_relations
    await seedIfEmpty('user_relations', async () => {
      const userRelationData: Prisma.UserRelationCreateManyInput[] = [
        {
          userId: users[0].id,
          relatedUserId: users[1]?.id || users[0].id,
          relationType: 'MANAGER',
          description: 'Relacja manager-podwładny'
        }
      ];
      await prisma.userRelation.createMany({ data: userRelationData });
    });

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
          }
        ];
        await prisma.messageProcessingResult.createMany({ data: processingResultData });
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
          }
        ];
        await prisma.documentShare.createMany({ data: documentShareData });
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
          }
        ];
        await prisma.documentLink.createMany({ data: documentLinkData });
      });
    }

    // wiki_page_links
    if (wikiPages.length >= 2) {
      await seedIfEmpty('wiki_page_links', async () => {
        const wikiLinkData: Prisma.WikiPageLinkCreateManyInput[] = [
          {
            sourcePageId: wikiPages[0].id,
            targetPageId: wikiPages[1].id,
            linkText: 'Zobacz także: Smart Mailboxes Guide',
            linkType: 'REFERENCE'
          }
        ];
        await prisma.wikiPageLink.createMany({ data: wikiLinkData });
      });
    }

    // dependencies (relacje między zadaniami)
    if (tasks.length >= 2) {
      await seedIfEmpty('dependencies', async () => {
        const dependencyData: Prisma.DependencyCreateManyInput[] = [
          {
            prerequisiteId: tasks[0].id,
            dependentId: tasks[1].id,
            type: 'FINISH_TO_START',
            description: 'Zadanie 2 może rozpocząć się po ukończeniu zadania 1'
          }
        ];
        await prisma.dependency.createMany({ data: dependencyData });
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
          }
        ];
        await prisma.projectDependency.createMany({ data: projectDepData });
      });
    }

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
          }
        ];
        await prisma.criticalPath.createMany({ data: criticalPathData });
      });
    }

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
          }
        ];
        await prisma.streamPermission.createMany({ data: streamPermissionData });
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
          }
        ];
        await prisma.streamRelation.createMany({ data: streamRelationData });
      });
    }

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
          }
        ];
        await prisma.streamChannel.createMany({ data: streamChannelData });
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
          }
        ];
        await prisma.orderItem.createMany({ data: orderItemData });
      });
    }

    // gtd_buckets
    await seedIfEmpty('gtd_buckets', async () => {
      const gtdBucketData: Prisma.GTDBucketCreateManyInput[] = [
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
        }
      ];
      await prisma.gTDBucket.createMany({ data: gtdBucketData });
    });

    // gtd_horizons
    await seedIfEmpty('gtd_horizons', async () => {
      const gtdHorizonData: Prisma.GTDHorizonCreateManyInput[] = [
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
        }
      ];
      await prisma.gTDHorizon.createMany({ data: gtdHorizonData });
    });

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
        }
      ];
      await prisma.completeness.createMany({ data: completenessData });
    });

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
        }
      ];
      await prisma.metadata.createMany({ data: metadataData });
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
        }
      ];
      await prisma.smart.createMany({ data: smartData });
    });

    console.log('\n🎉 SUKCES! Podstawowe tabele zostały wypełnione!');
    console.log('✅ Wypełniono większość z 34 pozostałych tabel!');

  } catch (error) {
    console.error('❌ Błąd podstawowego seedowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedIfEmpty(tableName: string, seedFunction: () => Promise<void>) {
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`) as {count: bigint}[];
    const recordCount = Number(count[0].count);
    
    if (recordCount === 0) {
      console.log(`🔄 Seedowanie ${tableName}...`);
      await seedFunction();
      console.log(`✅ ${tableName} - WYPEŁNIONE! 🎉`);
    } else {
      console.log(`⏩ ${tableName} - już wypełnione (${recordCount} rekordów)`);
    }
  } catch (error: any) {
    console.log(`❌ ${tableName} - błąd: ${error.message}`);
  }
}

// Uruchomienie podstawowego seedowania
seedBasic34Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd podstawowego seedowania:', error);
    process.exit(1);
  });