import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleFixTables() {
  console.log('🔧 PROSTY FIX - łatwe tabele do naprawienia\n');

  try {
    const organization = await prisma.organization.findFirst();
    const users = await prisma.user.findMany({ take: 5 });
    const messages = await prisma.message.findMany({ take: 3 });
    const tasks = await prisma.task.findMany({ take: 3 });
    
    if (!organization || users.length === 0) {
      console.log('❌ Brak podstawowych danych!');
      return;
    }

    console.log(`✅ Organizacja: ${organization.name}`);
    console.log(`✅ Użytkownicy: ${users.length}\n`);

    // 1. MESSAGE PROCESSING RESULTS - minimalna struktura
    if (messages.length > 0) {
      await seedIfEmpty('message_processing_results', async () => {
        const processingResultData: Prisma.MessageProcessingResultCreateManyInput[] = [
          {
            organizationId: organization.id,
            messageId: messages[0].id,
            ruleName: 'Auto-Priority Rule',
            ruleType: 'PRIORITY_ASSIGNMENT',
            actionTaken: 'SET_PRIORITY',
            result: { old_priority: 'MEDIUM', new_priority: 'HIGH' },
            status: 'SUCCESS',
            executionTime: 125
          },
          {
            organizationId: organization.id,
            messageId: messages[1]?.id || messages[0].id,
            ruleName: 'Newsletter Classifier',
            ruleType: 'CATEGORIZATION',
            actionTaken: 'CATEGORIZE',
            result: { category: 'newsletter', auto_archive: true },
            status: 'SUCCESS',
            executionTime: 89
          }
        ];
        await prisma.messageProcessingResult.createMany({ data: processingResultData });
      });
    }

    // 2. UNIFIED RULE EXECUTIONS - minimalna struktura
    const unifiedRules = await prisma.unifiedRule.findMany({ take: 2 });
    if (unifiedRules.length > 0) {
      await seedIfEmpty('unified_rule_executions', async () => {
        const unifiedRuleExecData: Prisma.UnifiedRuleExecutionCreateManyInput[] = [
          {
            organizationId: organization.id,
            ruleId: unifiedRules[0].id,
            status: 'SUCCESS',
            executionTime: 1250,
            input: { messageId: 'msg-123', urgencyScore: 85 },
            result: { taskCreated: true, taskId: 'task-456', priority: 'HIGH' }
          },
          {
            organizationId: organization.id,
            ruleId: unifiedRules[1]?.id || unifiedRules[0].id,
            status: 'FAILED',
            executionTime: 890,
            input: { messageId: 'msg-124', urgencyScore: 45 },
            result: null,
            errorMessage: 'Timeout while connecting to AI service'
          }
        ];
        await prisma.unifiedRuleExecution.createMany({ data: unifiedRuleExecData });
      });
    }

    // 3. STREAM ACCESS LOGS - już istnieją ale sprawdzę
    const streams = await prisma.stream.findMany({ take: 2 });
    if (streams.length > 0) {
      await seedIfEmpty('stream_access_logs', async () => {
        const streamAccessLogData: Prisma.StreamAccessLogCreateManyInput[] = [
          {
            organizationId: organization.id,
            streamId: streams[0].id,
            userId: users[0].id,
            action: 'VIEW',
            details: { section: 'tasks', filter: 'high-priority' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          {
            organizationId: organization.id,
            streamId: streams[1]?.id || streams[0].id,
            userId: users[1]?.id || users[0].id,
            action: 'EDIT',
            details: { field: 'description', oldValue: 'old desc', newValue: 'new desc' },
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        ];
        await prisma.streamAccessLog.createMany({ data: streamAccessLogData });
      });
    }

    // 4. STREAM PERMISSIONS - z accessLevel
    if (streams.length > 0 && users.length >= 2) {
      await seedIfEmpty('stream_permissions', async () => {
        const streamPermissionData: Prisma.StreamPermissionCreateManyInput[] = [
          {
            organizationId: organization.id,
            streamId: streams[0].id,
            userId: users[0].id,
            accessLevel: 'ADMIN',
            canView: true,
            canEdit: true,
            canDelete: true,
            canManageUsers: true,
            grantedById: users[0].id
          },
          {
            organizationId: organization.id,
            streamId: streams[0].id,
            userId: users[1].id,
            accessLevel: 'EDITOR',
            canView: true,
            canEdit: true,
            canDelete: false,
            canManageUsers: false,
            grantedById: users[0].id
          }
        ];
        await prisma.streamPermission.createMany({ data: streamPermissionData });
      });
    }

    // 5. AI PROMPT TEMPLATES - sprawdzę minimalną strukturę
    await seedIfEmpty('ai_prompt_templates', async () => {
      const aiPromptTemplateData: Prisma.AIPromptTemplateCreateManyInput[] = [
        {
          organizationId: organization.id,
          name: 'Email Urgency Analysis',
          description: 'Template for analyzing email urgency and importance',
          systemPromptTemplate: 'You are an AI assistant that analyzes emails for urgency and importance.',
          userPromptTemplate: 'Analyze this email: {email_content}. Rate urgency 1-10 and suggest actions.',
          category: 'EMAIL_ANALYSIS',
          variables: { email_content: 'string' },
          expectedOutput: { urgency: 'number', importance: 'number', suggested_actions: 'array' },
          isActive: true,
          version: '1.0',
          usageCount: 45
        }
      ];
      await prisma.aIPromptTemplate.createMany({ data: aiPromptTemplateData });
    });

    console.log('\n🎉 SUKCES! Naprawiono proste tabele!');
    console.log('🎯 Dalszy postęp w kierunku 100%!');

  } catch (error) {
    console.error('❌ Błąd prostej naprawy:', error);
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

// Uruchomienie prostej naprawy
simpleFixTables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd prostej naprawy:', error);
    process.exit(1);
  });