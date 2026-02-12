/**
 * Final Push - Get to 95+ tables
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Final push to 95+ tables...\n');
  let created = 0;

  // 1. CriticalPath
  try {
    const cnt = await prisma.criticalPath.count();
    if (cnt === 0) {
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      for (const project of projects) {
        await prisma.criticalPath.create({
          data: {
            id: crypto.randomUUID(),
            projectId: project.id,
            tasks: [],
            totalDuration: '30 days'
          }
        });
      }
      console.log('✅ CriticalPath: ' + projects.length);
      created += projects.length;
    } else console.log('⏭️ CriticalPath: ' + cnt + ' exist');
  } catch (e) { console.log('❌ CriticalPath:', e.message.slice(0, 120)); }

  // 2. OrderItem
  try {
    const cnt = await prisma.orderItem.count();
    if (cnt === 0) {
      const orders = await prisma.order.findMany({ where: { organizationId: ORG_ID }, take: 3 });
      const products = await prisma.product.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      let c = 0;
      for (const order of orders) {
        for (const product of products) {
          const price = product.price || 100;
          await prisma.orderItem.create({
            data: {
              id: crypto.randomUUID(),
              orderId: order.id,
              productId: product.id,
              itemType: 'PRODUCT',
              quantity: 2,
              unitPrice: price,
              totalPrice: price * 2
            }
          });
          c++;
        }
      }
      console.log('✅ OrderItem: ' + c);
      created += c;
    } else console.log('⏭️ OrderItem: ' + cnt + ' exist');
  } catch (e) { console.log('❌ OrderItem:', e.message.slice(0, 120)); }

  // 3. ProcessingRule
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      const channels = await prisma.communicationChannel.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-kategoryzacja newsletterów',
          description: 'Automatycznie kategoryzuj newslettery',
          conditions: { from: '@newsletter' },
          actions: { category: 'newsletter' },
          isActive: true,
          channelId: channels[0]?.id,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 120)); }

  // 4. MessageProcessingResult
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const messages = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (messages.length > 0 && rules.length > 0) {
        await prisma.messageProcessingResult.create({
          data: {
            id: crypto.randomUUID(),
            messageId: messages[0].id,
            ruleId: rules[0].id,
            action: 'CATEGORIZED',
            result: { category: 'newsletter' }
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt + ' exist');
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 120)); }

  // 5. ai_conversations
  try {
    const cnt = await prisma.ai_conversations.count();
    if (cnt === 0) {
      await prisma.ai_conversations.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: ORG_ID,
          userId: USER_ID,
          title: 'Planowanie zadań',
          context: 'TASK_PLANNING',
          status: 'ACTIVE',
          updatedAt: NOW
        }
      });
      console.log('✅ ai_conversations: 1');
      created += 1;
    } else console.log('⏭️ ai_conversations: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_conversations:', e.message.slice(0, 120)); }

  // 6. ai_conversation_messages
  try {
    const cnt = await prisma.ai_conversation_messages.count();
    if (cnt === 0) {
      const convs = await prisma.ai_conversations.findMany({ take: 1 });
      if (convs.length > 0) {
        await prisma.ai_conversation_messages.create({
          data: {
            id: crypto.randomUUID(),
            conversationId: convs[0].id,
            role: 'USER',
            content: 'Pomóż mi zaplanować zadania na dziś'
          }
        });
        console.log('✅ ai_conversation_messages: 1');
        created += 1;
      }
    } else console.log('⏭️ ai_conversation_messages: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_conversation_messages:', e.message.slice(0, 120)); }

  // 7. ai_executions
  try {
    const cnt = await prisma.ai_executions.count();
    if (cnt === 0) {
      await prisma.ai_executions.create({
        data: {
          id: crypto.randomUUID(),
          promptId: crypto.randomUUID(),
          modelId: 'gpt-4',
          input: { task: 'analyze' },
          output: { result: 'success' },
          tokensUsed: 150,
          cost: 0.01,
          status: 'SUCCESS',
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ ai_executions: 1');
      created += 1;
    } else console.log('⏭️ ai_executions: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_executions:', e.message.slice(0, 120)); }

  // 8. ai_rules
  try {
    const cnt = await prisma.ai_rules.count();
    if (cnt === 0) {
      await prisma.ai_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-priority',
          description: 'Automatically set task priority',
          conditions: { type: 'deadline_soon' },
          actions: { setPriority: 'HIGH' },
          isActive: true,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ai_rules: 1');
      created += 1;
    } else console.log('⏭️ ai_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ ai_rules:', e.message.slice(0, 120)); }

  // 9. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-categorize urgent',
          subjectContains: 'pilne',
          assignCategory: 'URGENT',
          isActive: true,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 120)); }

  // 10. email_logs
  try {
    const cnt = await prisma.email_logs.count();
    if (cnt === 0) {
      await prisma.email_logs.create({
        data: {
          id: crypto.randomUUID(),
          provider: 'SMTP',
          messageId: crypto.randomUUID(),
          toAddresses: ['test@example.com'],
          subject: 'Test email',
          success: true,
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ email_logs: 1');
      created += 1;
    } else console.log('⏭️ email_logs: ' + cnt + ' exist');
  } catch (e) { console.log('❌ email_logs:', e.message.slice(0, 120)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
