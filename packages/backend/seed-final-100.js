/**
 * Final seed script - Fill ALL 38 remaining empty tables to reach 100%
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Final seeding to 100% (38 tables)...\n');
  let created = 0;

  // 1. ai_knowledge_bases
  try {
    const cnt = await prisma.ai_knowledge_bases.count();
    if (cnt === 0) {
      await prisma.ai_knowledge_bases.create({
        data: {
          id: crypto.randomUUID(),
          name: 'General Knowledge',
          description: 'Main knowledge base',
          status: 'ACTIVE',
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ai_knowledge_bases: 1');
      created++;
    } else console.log('⏭️ ai_knowledge_bases: ' + cnt);
  } catch (e) { console.log('❌ ai_knowledge_bases:', e.message.slice(0, 150)); }

  // 2. ai_knowledge_documents
  try {
    const cnt = await prisma.ai_knowledge_documents.count();
    if (cnt === 0) {
      const bases = await prisma.ai_knowledge_bases.findMany({ take: 1 });
      if (bases.length > 0) {
        await prisma.ai_knowledge_documents.create({
          data: {
            id: crypto.randomUUID(),
            title: 'Getting Started Guide',
            content: 'Welcome to Sorto CRM. This guide will help you get started.',
            knowledgeBaseId: bases[0].id,
            status: 'ACTIVE',
            updatedAt: NOW
          }
        });
        console.log('✅ ai_knowledge_documents: 1');
        created++;
      }
    } else console.log('⏭️ ai_knowledge_documents: ' + cnt);
  } catch (e) { console.log('❌ ai_knowledge_documents:', e.message.slice(0, 150)); }

  // 3. ai_executions
  try {
    const cnt = await prisma.ai_executions.count();
    if (cnt === 0) {
      await prisma.ai_executions.create({
        data: {
          id: crypto.randomUUID(),
          inputData: { query: 'analyze task priority' },
          promptSent: 'Analyze the following task and suggest priority...',
          responseReceived: 'Based on analysis, priority should be HIGH',
          status: 'SUCCESS',
          executionTime: 1500,
          tokensUsed: 200,
          cost: 0.02,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ai_executions: 1');
      created++;
    } else console.log('⏭️ ai_executions: ' + cnt);
  } catch (e) { console.log('❌ ai_executions:', e.message.slice(0, 150)); }

  // 4. ai_rules
  try {
    const cnt = await prisma.ai_rules.count();
    if (cnt === 0) {
      await prisma.ai_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-Priority Rule',
          description: 'Automatically set task priority based on deadline',
          triggerType: 'EVENT',
          triggerConditions: { event: 'task.created' },
          actions: { setPriority: 'HIGH' },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ai_rules: 1');
      created++;
    } else console.log('⏭️ ai_rules: ' + cnt);
  } catch (e) { console.log('❌ ai_rules:', e.message.slice(0, 150)); }

  // 5. ai_prompt_versions (requires ai_prompt_templates)
  try {
    const cnt = await prisma.ai_prompt_versions.count();
    if (cnt === 0) {
      const templates = await prisma.ai_prompt_templates.findMany({ take: 1 });
      if (templates.length > 0) {
        await prisma.ai_prompt_versions.create({
          data: {
            id: crypto.randomUUID(),
            promptId: templates[0].id,
            version: 1,
            userPromptTemplate: 'Analyze the following: {input}',
            variables: { input: 'string' }
          }
        });
        console.log('✅ ai_prompt_versions: 1');
        created++;
      } else console.log('⏭️ ai_prompt_versions: no templates');
    } else console.log('⏭️ ai_prompt_versions: ' + cnt);
  } catch (e) { console.log('❌ ai_prompt_versions:', e.message.slice(0, 150)); }

  // 6. ai_prompt_overrides (requires ai_prompt_templates)
  try {
    const cnt = await prisma.ai_prompt_overrides.count();
    if (cnt === 0) {
      const templates = await prisma.ai_prompt_templates.findMany({ take: 1 });
      if (templates.length > 0) {
        await prisma.ai_prompt_overrides.create({
          data: {
            id: crypto.randomUUID(),
            promptId: templates[0].id,
            organizationId: ORG_ID,
            languageOverride: 'pl',
            customInstructions: 'Always respond in Polish',
            updatedAt: NOW
          }
        });
        console.log('✅ ai_prompt_overrides: 1');
        created++;
      } else console.log('⏭️ ai_prompt_overrides: no templates');
    } else console.log('⏭️ ai_prompt_overrides: ' + cnt);
  } catch (e) { console.log('❌ ai_prompt_overrides:', e.message.slice(0, 150)); }

  // 7. AiSyncStatus (maps to ai_sync_status)
  try {
    const cnt = await prisma.aiSyncStatus.count();
    if (cnt === 0) {
      await prisma.aiSyncStatus.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          source: 'CLAUDE',
          status: 'IDLE',
          conversationsCount: 0
        }
      });
      console.log('✅ AiSyncStatus: 1');
      created++;
    } else console.log('⏭️ AiSyncStatus: ' + cnt);
  } catch (e) { console.log('❌ AiSyncStatus:', e.message.slice(0, 150)); }

  // 8. AiAppMapping (maps to ai_app_mappings)
  try {
    const cnt = await prisma.aiAppMapping.count();
    if (cnt === 0) {
      await prisma.aiAppMapping.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          appName: 'Claude',
          keywords: ['ai', 'assistant', 'claude']
        }
      });
      console.log('✅ AiAppMapping: 1');
      created++;
    } else console.log('⏭️ AiAppMapping: ' + cnt);
  } catch (e) { console.log('❌ AiAppMapping:', e.message.slice(0, 150)); }

  // 9. AiConversationChunk (requires AiConversation)
  try {
    const cnt = await prisma.aiConversationChunk.count();
    if (cnt === 0) {
      const convs = await prisma.aiConversation.findMany({ take: 1 });
      if (convs.length > 0) {
        await prisma.aiConversationChunk.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: convs[0].id,
            content: 'This is a conversation chunk for semantic search',
            chunkIndex: 0,
            tokenCount: 50
          }
        });
        console.log('✅ AiConversationChunk: 1');
        created++;
      } else console.log('⏭️ AiConversationChunk: no conversations');
    } else console.log('⏭️ AiConversationChunk: ' + cnt);
  } catch (e) { console.log('❌ AiConversationChunk:', e.message.slice(0, 150)); }

  // 10. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Newsletter Filter',
          subjectContains: 'newsletter',
          assignCategory: 'NEWSLETTER',
          isActive: true,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created++;
    } else console.log('⏭️ email_rules: ' + cnt);
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 150)); }

  // 11. ProcessingRule (maps to processing_rules)
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-categorize newsletters',
          conditions: { from: '@newsletter' },
          actions: { category: 'newsletter' },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ProcessingRule: 1');
      created++;
    } else console.log('⏭️ ProcessingRule: ' + cnt);
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 150)); }

  // 12. MessageProcessingResult (requires Message and ProcessingRule)
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const msgs = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (msgs.length > 0) {
        await prisma.messageProcessingResult.create({
          data: {
            id: crypto.randomUUID(),
            messageId: msgs[0].id,
            ruleId: rules[0]?.id,
            actionTaken: 'CATEGORIZED',
            success: true
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created++;
      } else console.log('⏭️ MessageProcessingResult: no messages');
    } else console.log('⏭️ MessageProcessingResult: ' + cnt);
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 150)); }

  // 13. unified_rules
  try {
    const cnt = await prisma.unified_rules.count();
    if (cnt === 0) {
      await prisma.unified_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto Email Processing',
          ruleType: 'EMAIL_FILTER',
          triggerType: 'AUTOMATIC',
          conditions: { from: '*@newsletter.com' },
          actions: { archive: true },
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ unified_rules: 1');
      created++;
    } else console.log('⏭️ unified_rules: ' + cnt);
  } catch (e) { console.log('❌ unified_rules:', e.message.slice(0, 150)); }

  // 14. unified_rule_executions (requires unified_rules)
  try {
    const cnt = await prisma.unified_rule_executions.count();
    if (cnt === 0) {
      const rules = await prisma.unified_rules.findMany({ take: 1 });
      if (rules.length > 0) {
        await prisma.unified_rule_executions.create({
          data: {
            id: crypto.randomUUID(),
            ruleId: rules[0].id,
            executionTime: 50,
            status: 'SUCCESS',
            result: { archived: true },
            organizationId: ORG_ID
          }
        });
        console.log('✅ unified_rule_executions: 1');
        created++;
      } else console.log('⏭️ unified_rule_executions: no rules');
    } else console.log('⏭️ unified_rule_executions: ' + cnt);
  } catch (e) { console.log('❌ unified_rule_executions:', e.message.slice(0, 150)); }

  // 15. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          action: 'LOGIN',
          accessType: 'DIRECT',
          success: true,
          dataScope: ['PROFILE', 'TASKS'],
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created++;
    } else console.log('⏭️ user_access_logs: ' + cnt);
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 150)); }

  // 16. flow_learned_patterns (requires Stream)
  try {
    const cnt = await prisma.flow_learned_patterns.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.flow_learned_patterns.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          elementType: 'EMAIL',
          contentPattern: 'invoice|faktura',
          learnedAction: 'ZAPLANUJ',
          learnedStreamId: streams[0]?.id,
          confidence: 0.85,
          updatedAt: NOW
        }
      });
      console.log('✅ flow_learned_patterns: 1');
      created++;
    } else console.log('⏭️ flow_learned_patterns: ' + cnt);
  } catch (e) { console.log('❌ flow_learned_patterns:', e.message.slice(0, 150)); }

  // 17. flow_automation_rules
  try {
    const cnt = await prisma.flow_automation_rules.count();
    if (cnt === 0) {
      await prisma.flow_automation_rules.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          name: 'Auto-categorize invoices',
          conditions: [{ field: 'subject', operator: 'contains', value: 'faktura' }],
          action: 'ZAPLANUJ',
          updatedAt: NOW
        }
      });
      console.log('✅ flow_automation_rules: 1');
      created++;
    } else console.log('⏭️ flow_automation_rules: ' + cnt);
  } catch (e) { console.log('❌ flow_automation_rules:', e.message.slice(0, 150)); }

  // 18. flow_conversations (requires InboxItem)
  try {
    const cnt = await prisma.flow_conversations.count();
    if (cnt === 0) {
      const items = await prisma.inboxItem.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (items.length > 0) {
        await prisma.flow_conversations.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: ORG_ID,
            userId: USER_ID,
            inboxItemId: items[0].id,
            status: 'ACTIVE',
            updatedAt: NOW
          }
        });
        console.log('✅ flow_conversations: 1');
        created++;
      } else console.log('⏭️ flow_conversations: no inbox items');
    } else console.log('⏭️ flow_conversations: ' + cnt);
  } catch (e) { console.log('❌ flow_conversations:', e.message.slice(0, 150)); }

  // 19. flow_conversation_messages (requires flow_conversations)
  try {
    const cnt = await prisma.flow_conversation_messages.count();
    if (cnt === 0) {
      const convs = await prisma.flow_conversations.findMany({ take: 1 });
      if (convs.length > 0) {
        await prisma.flow_conversation_messages.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: convs[0].id,
            role: 'assistant',
            content: 'This looks like an invoice. Would you like me to create a task for payment?'
          }
        });
        console.log('✅ flow_conversation_messages: 1');
        created++;
      } else console.log('⏭️ flow_conversation_messages: no convs');
    } else console.log('⏭️ flow_conversation_messages: ' + cnt);
  } catch (e) { console.log('❌ flow_conversation_messages:', e.message.slice(0, 150)); }

  // 20. flow_processing_history (requires InboxItem)
  try {
    const cnt = await prisma.flow_processing_history.count();
    if (cnt === 0) {
      const items = await prisma.inboxItem.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (items.length > 0) {
        await prisma.flow_processing_history.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: ORG_ID,
            userId: USER_ID,
            inboxItemId: items[0].id,
            processingTimeMs: 250,
            aiAnalysis: { category: 'invoice', confidence: 0.92 },
            aiSuggestedAction: 'ZAPLANUJ',
            aiConfidence: 0.92,
            finalAction: 'ZAPLANUJ'
          }
        });
        console.log('✅ flow_processing_history: 1');
        created++;
      } else console.log('⏭️ flow_processing_history: no inbox items');
    } else console.log('⏭️ flow_processing_history: ' + cnt);
  } catch (e) { console.log('❌ flow_processing_history:', e.message.slice(0, 150)); }

  // 21. IndustryTemplate (maps to industry_templates)
  try {
    const cnt = await prisma.industryTemplate.count();
    if (cnt === 0) {
      await prisma.industryTemplate.create({
        data: {
          id: crypto.randomUUID(),
          slug: 'software-development',
          name: 'Software Development',
          description: 'Template for software development teams',
          category: 'Technology',
          streams: [{ name: 'Development', type: 'PROJECT' }],
          pipelineStages: ['Backlog', 'In Progress', 'Review', 'Done'],
          updatedAt: NOW
        }
      });
      console.log('✅ IndustryTemplate: 1');
      created++;
    } else console.log('⏭️ IndustryTemplate: ' + cnt);
  } catch (e) { console.log('❌ IndustryTemplate:', e.message.slice(0, 150)); }

  // 22. ProjectDependency (requires 2 Projects)
  try {
    const cnt = await prisma.projectDependency.count();
    if (cnt === 0) {
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (projects.length >= 2) {
        await prisma.projectDependency.create({
          data: {
            id: crypto.randomUUID(),
            sourceProjectId: projects[0].id,
            dependentProjectId: projects[1].id,
            type: 'FINISH_TO_START',
            updatedAt: NOW
          }
        });
        console.log('✅ ProjectDependency: 1');
        created++;
      } else console.log('⏭️ ProjectDependency: not enough projects');
    } else console.log('⏭️ ProjectDependency: ' + cnt);
  } catch (e) { console.log('❌ ProjectDependency:', e.message.slice(0, 150)); }

  // 23. SMARTAnalysisDetail (maps to smart_analysis_details)
  try {
    const cnt = await prisma.sMARTAnalysisDetail.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (tasks.length > 0) {
        await prisma.sMARTAnalysisDetail.create({
          data: {
            id: crypto.randomUUID(),
            specificScore: 8,
            specificNotes: 'Task is well defined',
            measurableScore: 7,
            measurableCriteria: 'Clear deliverables',
            achievableScore: 9,
            achievableResources: 'All resources available',
            relevantScore: 8,
            relevantAlignment: 'Aligns with Q1 goals',
            timeBoundScore: 7,
            timeEstimationAccuracy: 'Reasonable estimate',
            taskId: tasks[0].id
          }
        });
        console.log('✅ SMARTAnalysisDetail: 1');
        created++;
      } else console.log('⏭️ SMARTAnalysisDetail: no tasks');
    } else console.log('⏭️ SMARTAnalysisDetail: ' + cnt);
  } catch (e) { console.log('❌ SMARTAnalysisDetail:', e.message.slice(0, 150)); }

  // 24. SMARTImprovement (maps to smart_improvements)
  try {
    const cnt = await prisma.sMARTImprovement.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (tasks.length > 0) {
        await prisma.sMARTImprovement.create({
          data: {
            id: crypto.randomUUID(),
            smartDimension: 'Measurable',
            currentState: 'No clear metrics defined',
            suggestedImprovement: 'Add specific success criteria: number of units, percentage completion',
            status: 'OPEN',
            taskId: tasks[0].id
          }
        });
        console.log('✅ SMARTImprovement: 1');
        created++;
      } else console.log('⏭️ SMARTImprovement: no tasks');
    } else console.log('⏭️ SMARTImprovement: ' + cnt);
  } catch (e) { console.log('❌ SMARTImprovement:', e.message.slice(0, 150)); }

  // 25. SMARTTemplate (maps to smart_templates)
  try {
    const cnt = await prisma.sMARTTemplate.count();
    if (cnt === 0) {
      await prisma.sMARTTemplate.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Code Review Template',
          taskTemplate: 'Review and approve {feature} code changes',
          measurableCriteria: 'All tests passing, no critical issues',
          typicalResources: 'Senior developer, CI/CD pipeline',
          estimatedDuration: 120,
          typicalDependencies: 'Feature development complete',
          organizationId: ORG_ID
        }
      });
      console.log('✅ SMARTTemplate: 1');
      created++;
    } else console.log('⏭️ SMARTTemplate: ' + cnt);
  } catch (e) { console.log('❌ SMARTTemplate:', e.message.slice(0, 150)); }

  // 26. smart_mailbox_rules (requires smart_mailboxes)
  try {
    const cnt = await prisma.smart_mailbox_rules.count();
    if (cnt === 0) {
      const mailboxes = await prisma.smart_mailboxes.findMany({ take: 1 });
      if (mailboxes.length > 0) {
        await prisma.smart_mailbox_rules.create({
          data: {
            id: crypto.randomUUID(),
            mailboxId: mailboxes[0].id,
            field: 'subject',
            operator: 'contains',
            value: 'urgent'
          }
        });
        console.log('✅ smart_mailbox_rules: 1');
        created++;
      } else console.log('⏭️ smart_mailbox_rules: no mailboxes');
    } else console.log('⏭️ smart_mailbox_rules: ' + cnt);
  } catch (e) { console.log('❌ smart_mailbox_rules:', e.message.slice(0, 150)); }

  // 27. StreamChannel (maps to stream_channels)
  try {
    const cnt = await prisma.streamChannel.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const channels = await prisma.communicationChannel.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0 && channels.length > 0) {
        await prisma.streamChannel.create({
          data: {
            id: crypto.randomUUID(),
            streamId: streams[0].id,
            channelId: channels[0].id
          }
        });
        console.log('✅ StreamChannel: 1');
        created++;
      } else console.log('⏭️ StreamChannel: no streams/channels');
    } else console.log('⏭️ StreamChannel: ' + cnt);
  } catch (e) { console.log('❌ StreamChannel:', e.message.slice(0, 150)); }

  // 28. task_dependencies (requires 2 Tasks)
  try {
    const cnt = await prisma.task_dependencies.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (tasks.length >= 2) {
        await prisma.task_dependencies.create({
          data: {
            id: crypto.randomUUID(),
            predecessorId: tasks[0].id,
            successorId: tasks[1].id,
            dependencyType: 'finish_to_start'
          }
        });
        console.log('✅ task_dependencies: 1');
        created++;
      } else console.log('⏭️ task_dependencies: not enough tasks');
    } else console.log('⏭️ task_dependencies: ' + cnt);
  } catch (e) { console.log('❌ task_dependencies:', e.message.slice(0, 150)); }

  // 29. template_applications (requires day_templates)
  try {
    const cnt = await prisma.template_applications.count();
    if (cnt === 0) {
      const templates = await prisma.day_templates.findMany({ take: 1 });
      if (templates.length > 0) {
        await prisma.template_applications.create({
          data: {
            id: crypto.randomUUID(),
            templateId: templates[0].id,
            appliedDate: NOW,
            templateSnapshot: { name: templates[0].name },
            organizationId: ORG_ID,
            userId: USER_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ template_applications: 1');
        created++;
      } else console.log('⏭️ template_applications: no templates');
    } else console.log('⏭️ template_applications: ' + cnt);
  } catch (e) { console.log('❌ template_applications:', e.message.slice(0, 150)); }

  // 30. vector_cache
  try {
    const cnt = await prisma.vector_cache.count();
    if (cnt === 0) {
      await prisma.vector_cache.create({
        data: {
          id: crypto.randomUUID(),
          cacheKey: 'search_' + crypto.randomUUID().slice(0, 8),
          queryText: 'find urgent tasks',
          results: [{ taskId: '123', score: 0.95 }],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ vector_cache: 1');
      created++;
    } else console.log('⏭️ vector_cache: ' + cnt);
  } catch (e) { console.log('❌ vector_cache:', e.message.slice(0, 150)); }

  // 31. vector_search_results (requires vector_documents)
  try {
    const cnt = await prisma.vector_search_results.count();
    if (cnt === 0) {
      const docs = await prisma.vector_documents.findMany({ take: 1 });
      if (docs.length > 0) {
        await prisma.vector_search_results.create({
          data: {
            id: crypto.randomUUID(),
            queryText: 'find relevant documents',
            queryEmbedding: new Array(10).fill(0.1),
            documentId: docs[0].id,
            similarity: 0.92,
            rank: 1,
            organizationId: ORG_ID
          }
        });
        console.log('✅ vector_search_results: 1');
        created++;
      } else console.log('⏭️ vector_search_results: no docs');
    } else console.log('⏭️ vector_search_results: ' + cnt);
  } catch (e) { console.log('❌ vector_search_results:', e.message.slice(0, 150)); }

  // 32. vectors
  try {
    const cnt = await prisma.vectors.count();
    if (cnt === 0) {
      await prisma.vectors.create({
        data: {
          id: crypto.randomUUID(),
          content: 'Sample vector content for testing',
          metadata: { type: 'test', source: 'seed' },
          embedding_data: JSON.stringify(new Array(10).fill(0.1))
        }
      });
      console.log('✅ vectors: 1');
      created++;
    } else console.log('⏭️ vectors: ' + cnt);
  } catch (e) { console.log('❌ vectors:', e.message.slice(0, 150)); }

  // 33. VerificationToken (maps to verification_tokens)
  try {
    const cnt = await prisma.verificationToken.count();
    if (cnt === 0) {
      await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          token: crypto.randomUUID(),
          type: 'EMAIL_VERIFICATION',
          userId: USER_ID,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ VerificationToken: 1');
      created++;
    } else console.log('⏭️ VerificationToken: ' + cnt);
  } catch (e) { console.log('❌ VerificationToken:', e.message.slice(0, 150)); }

  // 34-38: Tables without Prisma models - use raw SQL
  console.log('\n--- Direct SQL inserts for tables without Prisma models ---');

  // 34. custom_field_definitions
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM custom_field_definitions`;
    if (result[0].cnt === 0) {
      await prisma.$executeRaw`
        INSERT INTO custom_field_definitions (id, organization_id, name, label, field_type, entity_type, is_required, is_searchable, is_filterable, show_in_list, show_in_card, validation, sort_order, is_active, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${ORG_ID}, 'custom_priority', 'Custom Priority', 'SELECT', 'TASK', false, true, true, true, true, '{}', 1, true, NOW(), NOW())
      `;
      console.log('✅ custom_field_definitions: 1');
      created++;
    } else console.log('⏭️ custom_field_definitions: ' + result[0].cnt);
  } catch (e) { console.log('❌ custom_field_definitions:', e.message.slice(0, 150)); }

  // 35. custom_field_values
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM custom_field_values`;
    if (result[0].cnt === 0) {
      const fields = await prisma.$queryRaw`SELECT id FROM custom_field_definitions LIMIT 1`;
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (fields.length > 0 && tasks.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO custom_field_values (id, field_id, entity_id, entity_type, text_value, created_at, updated_at)
          VALUES (${crypto.randomUUID()}, ${fields[0].id}, ${tasks[0].id}, 'TASK', 'High', NOW(), NOW())
        `;
        console.log('✅ custom_field_values: 1');
        created++;
      }
    } else console.log('⏭️ custom_field_values: ' + result[0].cnt);
  } catch (e) { console.log('❌ custom_field_values:', e.message.slice(0, 150)); }

  // 36. mcp_api_keys
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM mcp_api_keys`;
    if (result[0].cnt === 0) {
      await prisma.$executeRaw`
        INSERT INTO mcp_api_keys (id, organization_id, created_by_id, key_hash, key_prefix, name, is_active, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${ORG_ID}, ${USER_ID}, ${crypto.randomUUID()}, 'mcp_', 'Default API Key', true, NOW(), NOW())
      `;
      console.log('✅ mcp_api_keys: 1');
      created++;
    } else console.log('⏭️ mcp_api_keys: ' + result[0].cnt);
  } catch (e) { console.log('❌ mcp_api_keys:', e.message.slice(0, 150)); }

  // 37. mcp_usage_logs
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM mcp_usage_logs`;
    if (result[0].cnt === 0) {
      const keys = await prisma.$queryRaw`SELECT id FROM mcp_api_keys LIMIT 1`;
      if (keys.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO mcp_usage_logs (id, api_key_id, organization_id, tool_name, success, response_time_ms, created_at)
          VALUES (${crypto.randomUUID()}, ${keys[0].id}, ${ORG_ID}, 'search_tasks', true, 150, NOW())
        `;
        console.log('✅ mcp_usage_logs: 1');
        created++;
      }
    } else console.log('⏭️ mcp_usage_logs: ' + result[0].cnt);
  } catch (e) { console.log('❌ mcp_usage_logs:', e.message.slice(0, 150)); }

  // 38. organization_branding
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM organization_branding`;
    if (result[0].cnt === 0) {
      await prisma.$executeRaw`
        INSERT INTO organization_branding (id, organization_id, primary_color, secondary_color, accent_color, is_active, created_at, updated_at)
        VALUES (${crypto.randomUUID()}, ${ORG_ID}, '#3B82F6', '#1E40AF', '#F59E0B', true, NOW(), NOW())
      `;
      console.log('✅ organization_branding: 1');
      created++;
    } else console.log('⏭️ organization_branding: ' + result[0].cnt);
  } catch (e) { console.log('❌ organization_branding:', e.message.slice(0, 150)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
