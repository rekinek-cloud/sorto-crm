import { PrismaClient, SharePermission, Importance, ErrorSeverity, LinkType,
         TaskStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Faza 5: Metadata & Final seeding...');

  // Get existing organization
  const organization = await prisma.organization.findFirst({
    where: { slug: 'demo-org' }
  });

  if (!organization) {
    throw new Error('Organization not found. Run basic seed first.');
  }

  // Get existing data
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id }
  });

  const documents = await prisma.document.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const wikiPages = await prisma.wikiPage.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const streams = await prisma.stream.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // METADATA & INFORMATION SYSTEM (4 tabele)
  // ================================

  console.log('📋 Creating Info Records...');
  
  const infoRecords = await Promise.all([
    prisma.info.create({
      data: {
        title: 'CRM-GTD Smart System Overview',
        content: 'Complete productivity system combining Customer Relationship Management with Getting Things Done methodology. Includes smart mailboxes, AI processing, voice TTS, and comprehensive project management.',
        topic: 'system-overview',
        importance: Importance.HIGH,
        organizationId: organization.id
      }
    }),

    prisma.info.create({
      data: {
        title: 'GTD Methodology Quick Reference',
        content: 'The 5 steps of GTD: 1) Capture everything 2) Clarify what it means 3) Organize by context 4) Reflect through review 5) Engage with confidence. Use contexts like @computer, @calls, @errands for efficient batching.',
        topic: 'productivity',
        importance: Importance.HIGH,
        organizationId: organization.id
      }
    }),

    prisma.info.create({
      data: {
        title: 'Smart Mailboxes Usage Guide',
        content: 'Smart Mailboxes automatically categorize emails using AI. Use Quick Actions (Inbox, DO, DEFER) for rapid processing. GTD+ modal provides full processing workflow according to David Allen principles.',
        topic: 'communication',
        importance: Importance.MEDIUM,
        organizationId: organization.id
      }
    }),

    prisma.info.create({
      data: {
        title: 'Voice TTS Feature Tutorial',
        content: 'Click the "Read" button in Smart Mailboxes to have emails read aloud. Uses Web Speech API for immediate feedback. Perfect for processing emails while multitasking or for accessibility needs.',
        topic: 'features',
        importance: Importance.MEDIUM,
        organizationId: organization.id
      }
    }),

    prisma.info.create({
      data: {
        title: 'AI Rules and Automation Setup',
        content: 'Configure AI providers in AI Config, create rules in AI Rules, then apply to projects and tasks. System supports OpenAI, Claude, and local models for intelligent automation.',
        topic: 'ai-system',
        importance: Importance.MEDIUM,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${infoRecords.length} info records`);

  console.log('🗑️ Creating Unimportant Items...');
  
  const unimportantItems = await Promise.all([
    prisma.unimportant.create({
      data: {
        content: 'Random meeting notes from 6 months ago about office supplies',
        type: 'meeting-notes',
        source: 'legacy-import',
        organizationId: organization.id
      }
    }),

    prisma.unimportant.create({
      data: {
        content: 'Outdated system documentation for deprecated feature',
        type: 'documentation',
        source: 'old-wiki',
        organizationId: organization.id
      }
    }),

    prisma.unimportant.create({
      data: {
        content: 'Spam email about office furniture discounts',
        type: 'email',
        source: 'inbox-cleanup',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${unimportantItems.length} unimportant items`);

  // ================================
  // DOCUMENT SYSTEM (3 tabele)
  // ================================

  console.log('🔗 Creating Document Links...');
  
  const documentLinks = [];
  
  if (documents.length > 1) {
    try {
      const link1 = await prisma.documentLink.create({
        data: {
          sourceDocumentId: documents[0].id,
          targetDocumentId: documents[1].id,
          type: LinkType.REFERENCE,
        }
      });
      documentLinks.push(link1);
    } catch (e) {
      console.log('Document link 1 already exists, skipping...');
    }

    if (documents.length > 2) {
      try {
        const link2 = await prisma.documentLink.create({
          data: {
            sourceDocumentId: documents[0].id,
            targetDocumentId: documents[2].id,
            type: LinkType.DEPENDENCY,
          }
        });
        documentLinks.push(link2);
      } catch (e) {
        console.log('Document link 2 already exists, skipping...');
      }
    }
  }

  console.log(`✅ Created ${documentLinks.length} document links`);

  console.log('📤 Creating Document Shares...');
  
  const documentShares = [];
  if (documents.length > 0 && users.length > 1) {
    try {
      const share1 = await prisma.documentShare.create({
        data: {
          documentId: documents[0].id,
          permission: SharePermission.READ,
          expiresAt: new Date('2024-12-31T23:59:59Z'),
          sharedWithId: users[1].id,
          sharedById: primaryUser.id
        }
      });
      documentShares.push(share1);
    } catch (e) {
      console.log('Document share 1 already exists, skipping...');
    }

    try {
      const share2 = await prisma.documentShare.create({
        data: {
          documentId: documents.length > 1 ? documents[1].id : documents[0].id,
          permission: SharePermission.EDIT,
          expiresAt: new Date('2024-09-30T23:59:59Z'),
          sharedWithId: users[1].id,
          sharedById: primaryUser.id
        }
      });
      documentShares.push(share2);
    } catch (e) {
      console.log('Document share 2 already exists, skipping...');
    }
  }

  console.log(`✅ Created ${documentShares.length} document shares`);

  console.log('🌐 Creating Wiki Page Links...');
  
  const wikiPageLinks = [];
  
  if (wikiPages.length > 1) {
    try {
      const link1 = await prisma.wikiPageLink.create({
        data: {
          sourcePageId: wikiPages[0].id,
          targetPageId: wikiPages[1].id,
          linkText: 'Cross-reference to related wiki page'
        }
      });
      wikiPageLinks.push(link1);
    } catch (e) {
      console.log('Wiki page link 1 already exists, skipping...');
    }
    
    if (wikiPages.length > 2) {
      try {
        const link2 = await prisma.wikiPageLink.create({
          data: {
            sourcePageId: wikiPages[1].id,
            targetPageId: wikiPages[2].id,
            linkText: 'Bidirectional link between related concepts'
          }
        });
        wikiPageLinks.push(link2);
      } catch (e) {
        console.log('Wiki page link 2 already exists, skipping...');
      }
    }
  }

  console.log(`✅ Created ${wikiPageLinks.length} wiki page links`);

  // ================================
  // FILE SYSTEM (1 tabela)
  // ================================

  console.log('📁 Creating File Records...');
  
  const files = await Promise.all([
    prisma.file.create({
      data: {
        fileName: 'crm-gtd-user-manual.pdf',
        fileType: 'application/pdf',
        urlPath: '/api/files/crm-gtd-user-manual.pdf',
        size: 2840576, // ~2.8MB
        parentType: 'documentation',
        organizationId: organization.id
      }
    }),

    prisma.file.create({
      data: {
        fileName: 'company-logo-vector.svg',
        fileType: 'image/svg+xml',
        urlPath: '/api/files/company-logo-vector.svg',
        size: 45120, // ~45KB
        parentType: 'branding',
        organizationId: organization.id
      }
    }),

    prisma.file.create({
      data: {
        fileName: 'quarterly-report-q2-2024.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        urlPath: '/api/files/quarterly-report-q2-2024.xlsx',
        size: 1205248, // ~1.2MB
        parentType: 'report',
        organizationId: organization.id
      }
    }),

    prisma.file.create({
      data: {
        fileName: 'backup-database-20240720.sql',
        fileType: 'application/sql',
        urlPath: '/api/files/backup-database-20240720.sql',
        size: 15728640, // ~15MB
        parentType: 'backup',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${files.length} file records`);

  // ================================
  // ACCESS LOGS SYSTEM (2 tabele)
  // ================================

  console.log('👤 Creating User Access Logs...');
  
  const userAccessLogs = await Promise.all([
    prisma.userAccessLog.create({
      data: {
        userId: primaryUser.id,
        action: 'login',
        requestPath: '/dashboard',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T08:30:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.userAccessLog.create({
      data: {
        userId: primaryUser.id,
        action: 'view_page',
        requestPath: '/dashboard/smart-mailboxes',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T08:35:15Z'),
        organizationId: organization.id
      }
    }),

    prisma.userAccessLog.create({
      data: {
        userId: primaryUser.id,
        action: 'create_task',
        requestPath: '/api/v1/tasks',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T09:15:30Z'),
        organizationId: organization.id
      }
    }),

    prisma.userAccessLog.create({
      data: {
        userId: primaryUser.id,
        action: 'logout',
        requestPath: '/auth/logout',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T17:45:00Z'),
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${userAccessLogs.length} user access logs`);

  console.log('🌊 Creating Stream Access Logs...');
  
  const streamAccessLogs = streams.length > 0 ? await Promise.all([
    prisma.streamAccessLog.create({
      data: {
        streamId: streams[0].id,
        userId: primaryUser.id,
        action: 'VIEW',
        accessType: 'DIRECT',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T10:00:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.streamAccessLog.create({
      data: {
        streamId: streams[0].id,
        userId: primaryUser.id,
        action: 'EDIT',
        accessType: 'DIRECT',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T10:15:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.streamAccessLog.create({
      data: {
        streamId: streams.length > 1 ? streams[1].id : streams[0].id,
        userId: primaryUser.id,
        action: 'VIEW',
        accessType: 'DIRECT',
        success: true,
        dataScope: [],
        accessedAt: new Date('2024-07-20T14:30:00Z'),
        organizationId: organization.id
      }
    })
  ]) : [];

  console.log(`✅ Created ${streamAccessLogs.length} stream access logs`);

  // ================================
  // ERROR LOGS SYSTEM (1 tabela)
  // ================================

  console.log('❌ Creating Error Logs...');
  
  const errorLogs = await Promise.all([
    prisma.errorLog.create({
      data: {
        message: 'Failed to process email: AI provider rate limit exceeded',
        severity: ErrorSeverity.high,
        stack: 'RateLimitError: Too many requests\n    at AIService.processEmail (/app/services/ai.js:45)\n    at MessageProcessor.handle (/app/processors/message.js:123)',
        url: '/api/v1/email/process',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_' + Date.now() + '_001',
        timestamp: new Date('2024-07-20T11:30:00Z'),
        userId: primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.errorLog.create({
      data: {
        message: 'Voice TTS service temporarily unavailable, falling back to text display',
        severity: ErrorSeverity.medium,
        url: '/api/v1/voice/synthesize',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        sessionId: 'sess_' + Date.now() + '_002',
        timestamp: new Date('2024-07-20T13:15:00Z'),
        userId: primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.errorLog.create({
      data: {
        message: 'Database connection timeout during backup operation',
        severity: ErrorSeverity.high,
        stack: 'TimeoutError: Query timeout\n    at Connection.query (/app/lib/database.js:89)\n    at BackupService.createBackup (/app/services/backup.js:156)',
        url: '/api/v1/admin/backup',
        userAgent: 'BackupService/1.0',
        sessionId: 'sess_' + Date.now() + '_003',
        timestamp: new Date('2024-07-20T02:00:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.errorLog.create({
      data: {
        message: 'System performance optimization completed successfully',
        severity: ErrorSeverity.low,
        url: '/api/v1/admin/optimize',
        userAgent: 'OptimizationService/1.0',
        sessionId: 'sess_' + Date.now() + '_004',
        context: JSON.stringify({
          tasksOptimized: 1250,
          executionTime: '45.2s',
          memoryFreed: '128MB'
        }),
        timestamp: new Date('2024-07-20T03:30:00Z'),
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${errorLogs.length} error logs`);

  // ================================
  // SEARCH & VECTOR SYSTEM (3 tabele)
  // ================================

  console.log('🔍 Creating Search Index...');
  
  const searchIndexEntries = await Promise.all([
    prisma.searchIndex.create({
      data: {
        entityId: tasks.length > 0 ? tasks[0].id : 'mock-task-id',
        entityType: 'task',
        title: 'Implement CRM-GTD Smart integrations',
        content: 'Complete implementation of advanced CRM integrations with GTD methodology, including smart mailboxes, AI processing, and voice TTS features.',
        searchVector: 'implement crm gtd smart integrations complete implementation advanced integrations methodology smart mailboxes ai processing voice tts features',
        organizationId: organization.id
      }
    }),

    prisma.searchIndex.create({
      data: {
        entityId: documents.length > 0 ? documents[0].id : 'mock-doc-id',
        entityType: 'document',
        title: 'CRM-GTD User Manual',
        content: 'Comprehensive user manual covering all features of CRM-GTD Smart system including setup, configuration, and best practices.',
        searchVector: 'crm gtd user manual comprehensive covering features system setup configuration best practices',
        organizationId: organization.id
      }
    }),

    prisma.searchIndex.create({
      data: {
        entityId: users[0].id,
        entityType: 'user',
        title: users[0].firstName + ' ' + users[0].lastName,
        content: `User profile for ${users[0].firstName} ${users[0].lastName}, ${users[0].email}`,
        searchVector: `${users[0].firstName?.toLowerCase()} ${users[0].lastName?.toLowerCase()} ${users[0].email?.toLowerCase()} user profile`,
        organizationId: organization.id
      }
    }),

    prisma.searchIndex.create({
      data: {
        entityId: 'project-crm-integration',
        entityType: 'project',
        title: 'CRM Integration Project',
        content: 'Major project for integrating CRM system with external APIs and third-party services',
        searchVector: 'crm integration project major integrating system external apis third party services',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${searchIndexEntries.length} search index entries`);

  console.log('🎯 Creating Vector Cache...');
  
  const vectorCacheEntries = await Promise.all([
    prisma.vectorCache.create({
      data: {
        cacheKey: 'search_tasks_gtd_implementation',
        queryText: 'GTD implementation tasks and methodology',
        results: {
          searchResults: [
            { id: 'task-1', score: 0.95, title: 'Implement GTD workflow' },
            { id: 'task-2', score: 0.88, title: 'Setup GTD contexts' }
          ],
          totalResults: 15,
          searchTime: 42
        },
        filters: {
          entityType: 'task',
          status: 'active'
        },
        limit: 10,
        threshold: 0.7,
        hitCount: 5,
        expiresAt: new Date('2024-08-20T00:00:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.vectorCache.create({
      data: {
        cacheKey: 'search_documents_user_guides',
        queryText: 'user guides and documentation',
        results: {
          searchResults: [
            { id: 'doc-1', score: 0.92, title: 'CRM-GTD User Manual' },
            { id: 'doc-2', score: 0.85, title: 'Smart Mailboxes Guide' }
          ],
          totalResults: 8,
          searchTime: 38
        },
        filters: {
          entityType: 'document',
          category: 'guide'
        },
        limit: 10,
        threshold: 0.8,
        hitCount: 12,
        expiresAt: new Date('2024-08-15T00:00:00Z'),
        organizationId: organization.id
      }
    }),

    prisma.vectorCache.create({
      data: {
        cacheKey: 'search_ai_automation_features',
        queryText: 'AI automation and smart features',
        results: {
          searchResults: [
            { id: 'feature-1', score: 0.88, title: 'AI Email Processing' },
            { id: 'feature-2', score: 0.82, title: 'Smart Task Suggestions' }
          ],
          totalResults: 6,
          searchTime: 35
        },
        filters: {
          entityType: 'feature',
          technology: 'ai'
        },
        limit: 5,
        threshold: 0.75,
        hitCount: 3,
        expiresAt: new Date('2024-07-25T00:00:00Z'),
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${vectorCacheEntries.length} vector cache entries`);

  // ================================
  // VECTOR DOCUMENT SYSTEM (2 tabele)
  // ================================

  console.log('📄 Creating Vector Documents...');
  
  const vectorDocuments = await Promise.all([
    prisma.vectorDocument.create({
      data: {
        title: 'CRM-GTD Smart Overview',
        content: 'CRM-GTD Smart is a comprehensive productivity system that combines Customer Relationship Management with the Getting Things Done methodology. Key features include Smart Mailboxes for automated email processing, AI-powered task analysis, Voice TTS for accessibility, and integrated project management.',
        contentHash: 'md5_product_overview_hash_001',
        embedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        entityType: 'document',
        entityId: 'product-overview-doc',
        source: 'manual',
        organizationId: organization.id
      }
    }),

    prisma.vectorDocument.create({
      data: {
        title: 'GTD Methodology Explanation',
        content: 'Getting Things Done (GTD) is a personal productivity methodology created by David Allen. The core principle is to move tasks and projects out of the mind by recording them externally and then breaking them into actionable work items with known time and resource requirements.',
        contentHash: 'md5_gtd_methodology_hash_002',
        embedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        entityType: 'methodology',
        entityId: 'gtd-methodology-doc',
        source: 'manual',
        organizationId: organization.id
      }
    }),

    prisma.vectorDocument.create({
      data: {
        title: 'Smart Mailboxes Feature Guide',
        content: 'Smart Mailboxes automatically categorize incoming emails using AI analysis. The system identifies priority levels, sentiment, and suggested actions. Users can process emails using Quick Actions (Inbox, DO, DEFER) or the full GTD+ modal for comprehensive workflow processing.',
        contentHash: 'md5_smart_mailboxes_hash_003',
        embedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        entityType: 'feature',
        entityId: 'smart-mailboxes-guide',
        source: 'manual',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${vectorDocuments.length} vector documents`);

  console.log('🔍 Creating Vector Search Results...');
  
  const vectorSearchResults = await Promise.all([
    prisma.vectorSearchResult.create({
      data: {
        queryText: 'How to set up GTD workflow in CRM',
        queryEmbedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        documentId: vectorDocuments[1].id,
        similarity: 0.92,
        rank: 1,
        userId: primaryUser.id,
        searchContext: 'dashboard',
        executionTime: 45,
        organizationId: organization.id
      }
    }),

    prisma.vectorSearchResult.create({
      data: {
        queryText: 'How to set up GTD workflow in CRM',
        queryEmbedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        documentId: vectorDocuments[0].id,
        similarity: 0.78,
        rank: 2,
        userId: primaryUser.id,
        searchContext: 'dashboard',
        executionTime: 45,
        organizationId: organization.id
      }
    }),

    prisma.vectorSearchResult.create({
      data: {
        queryText: 'email automation features',
        queryEmbedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        documentId: vectorDocuments[2].id,
        similarity: 0.95,
        rank: 1,
        userId: primaryUser.id,
        searchContext: 'api',
        executionTime: 32,
        organizationId: organization.id
      }
    }),

    prisma.vectorSearchResult.create({
      data: {
        queryText: 'email automation features',
        queryEmbedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
        documentId: vectorDocuments[0].id,
        similarity: 0.68,
        rank: 2,
        userId: primaryUser.id,
        searchContext: 'api',
        executionTime: 32,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${vectorSearchResults.length} vector search results`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    infoRecords.length + 
    unimportantItems.length +
    documentLinks.length +
    documentShares.length +
    wikiPageLinks.length +
    files.length +
    userAccessLogs.length +
    streamAccessLogs.length +
    errorLogs.length +
    searchIndexEntries.length +
    vectorCacheEntries.length +
    vectorDocuments.length +
    vectorSearchResults.length;

  console.log(`\n🎉 Faza 5 completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   Metadata & Info: ${infoRecords.length + unimportantItems.length} records`);
  console.log(`   Document System: ${documentLinks.length + documentShares.length + wikiPageLinks.length} records`);
  console.log(`   File System: ${files.length} records`);
  console.log(`   Access Logs: ${userAccessLogs.length + streamAccessLogs.length} records`);
  console.log(`   Error Logs: ${errorLogs.length} records`);
  console.log(`   Search & Vector: ${searchIndexEntries.length + vectorCacheEntries.length + vectorDocuments.length + vectorSearchResults.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Database seeding COMPLETELY FINISHED!`);
  console.log(`🎯 Ready for production use with realistic demo data`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Faza 5 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });