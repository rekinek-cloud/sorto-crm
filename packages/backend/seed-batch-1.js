/**
 * Batch 1 - Seeding remaining tables
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Batch 1 seeding...\n');
  let created = 0;

  // 1. user_access_logs (accessType required)
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
          dataScope: ['BASIC_INFO'],
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created += 1;
    } else console.log('⏭️ user_access_logs: ' + cnt);
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 150)); }

  // 2. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.create({
        data: {
          id: crypto.randomUUID(),
          patternType: 'WORK',
          patternKey: 'schedule',
          confidence: 0.85,
          strength: 0.9,
          successRate: 0.8,
          patternData: { start: '08:00' },
          learningSource: 'SYSTEM',
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ user_patterns: 1');
      created += 1;
    } else console.log('⏭️ user_patterns: ' + cnt);
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 150)); }

  // 3. stream_relations (parentId, childId, relationType)
  try {
    const cnt = await prisma.stream_relations.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (streams.length >= 2) {
        await prisma.stream_relations.create({
          data: {
            id: crypto.randomUUID(),
            parentId: streams[0].id,
            childId: streams[1].id,
            relationType: 'MANAGES',
            createdById: USER_ID,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ stream_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_relations: ' + cnt);
  } catch (e) { console.log('❌ stream_relations:', e.message.slice(0, 150)); }

  // 4. stream_access_logs (accessType string)
  try {
    const cnt = await prisma.stream_access_logs.count();
    if (cnt === 0) {
      const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (streams.length > 0) {
        await prisma.stream_access_logs.create({
          data: {
            id: crypto.randomUUID(),
            streamId: streams[0].id,
            userId: USER_ID,
            action: 'VIEW',
            accessType: 'DIRECT',
            success: true,
            dataScope: ['BASIC_INFO'],
            organizationId: ORG_ID
          }
        });
        console.log('✅ stream_access_logs: 1');
        created += 1;
      }
    } else console.log('⏭️ stream_access_logs: ' + cnt);
  } catch (e) { console.log('❌ stream_access_logs:', e.message.slice(0, 150)); }

  // 5. user_relations
  try {
    const cnt = await prisma.user_relations.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (users.length >= 2) {
        await prisma.user_relations.create({
          data: {
            id: crypto.randomUUID(),
            managerId: users[0].id,
            subordinateId: users[1].id,
            relationType: 'DIRECT_REPORT',
            accessLevel: 'MANAGER',
            dataScope: ['BASIC_INFO', 'TASKS'],
            createdById: USER_ID,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ user_relations: 1');
        created += 1;
      }
    } else console.log('⏭️ user_relations: ' + cnt);
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 150)); }

  // 6. user_permissions
  try {
    const cnt = await prisma.user_permissions.count();
    if (cnt === 0) {
      await prisma.user_permissions.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          permissionType: 'ADMIN',
          resourceType: 'ALL',
          accessLevel: 'MANAGER',
          grantedById: USER_ID,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_permissions: 1');
      created += 1;
    } else console.log('⏭️ user_permissions: ' + cnt);
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 150)); }

  // 7. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          viewName: 'Tasks',
          config: { showCompleted: false },
          isDefault: true,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_view_preferences: 1');
      created += 1;
    } else console.log('⏭️ user_view_preferences: ' + cnt);
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 150)); }

  // 8. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'LIST',
          viewName: 'Contacts',
          viewCount: 50,
          totalDuration: 3600,
          avgDuration: 72,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ view_analytics: 1');
      created += 1;
    } else console.log('⏭️ view_analytics: ' + cnt);
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 150)); }

  // 9. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      if (blocks.length > 0) {
        await prisma.energy_analytics.create({
          data: {
            id: crypto.randomUUID(),
            energyTimeBlockId: blocks[0].id,
            date: NOW,
            plannedEnergy: 0.9,
            actualEnergy: 0.85,
            deviation: 0.05,
            tasksPlanned: 5,
            tasksCompleted: 4,
            focusMinutes: 120,
            breakMinutes: 20,
            organizationId: ORG_ID,
            userId: USER_ID
          }
        });
        console.log('✅ energy_analytics: 1');
        created += 1;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt);
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 150)); }

  // 10. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.create({
        data: {
          id: crypto.randomUUID(),
          date: NOW,
          metricType: 'PRODUCTIVITY',
          metricKey: 'daily_score',
          value: 85,
          previousValue: 80,
          change: 5,
          trend: 'UP',
          organizationId: ORG_ID,
          userId: USER_ID
        }
      });
      console.log('✅ performance_metrics: 1');
      created += 1;
    } else console.log('⏭️ performance_metrics: ' + cnt);
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 150)); }

  // 11. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-archive old',
          priority: 1,
          conditions: { age: { gt: 30 } },
          actions: { archive: true },
          isActive: true,
          organizationId: ORG_ID
        }
      });
      console.log('✅ ProcessingRule: 1');
      created += 1;
    } else console.log('⏭️ ProcessingRule: ' + cnt);
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 150)); }

  // 12. message_processing_results
  try {
    const cnt = await prisma.messageProcessingResult.count();
    if (cnt === 0) {
      const msgs = await prisma.message.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      const rules = await prisma.processingRule.findMany({ where: { organizationId: ORG_ID }, take: 1 });
      if (msgs.length > 0 && rules.length > 0) {
        await prisma.messageProcessingResult.create({
          data: {
            id: crypto.randomUUID(),
            messageId: msgs[0].id,
            ruleId: rules[0].id,
            matched: true,
            actions: ['categorize'],
            processingTimeMs: 50
          }
        });
        console.log('✅ MessageProcessingResult: 1');
        created += 1;
      }
    } else console.log('⏭️ MessageProcessingResult: ' + cnt);
  } catch (e) { console.log('❌ MessageProcessingResult:', e.message.slice(0, 150)); }

  // 13. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Newsletter filter',
          subjectContains: 'newsletter',
          assignCategory: 'NEWSLETTER',
          isActive: true,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created += 1;
    } else console.log('⏭️ email_rules: ' + cnt);
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 150)); }

  // 14. task_relationships
  try {
    const cnt = await prisma.taskRelationship.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (tasks.length >= 2) {
        await prisma.taskRelationship.create({
          data: {
            id: crypto.randomUUID(),
            sourceTaskId: tasks[0].id,
            targetTaskId: tasks[1].id,
            relationshipType: 'BLOCKS'
          }
        });
        console.log('✅ TaskRelationship: 1');
        created += 1;
      }
    } else console.log('⏭️ TaskRelationship: ' + cnt);
  } catch (e) { console.log('❌ TaskRelationship:', e.message.slice(0, 150)); }

  // 15. project_dependencies
  try {
    const cnt = await prisma.projectDependency.count();
    if (cnt === 0) {
      const projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (projects.length >= 2) {
        await prisma.projectDependency.create({
          data: {
            id: crypto.randomUUID(),
            sourceProjectId: projects[0].id,
            targetProjectId: projects[1].id,
            dependencyType: 'FINISH_TO_START'
          }
        });
        console.log('✅ ProjectDependency: 1');
        created += 1;
      }
    } else console.log('⏭️ ProjectDependency: ' + cnt);
  } catch (e) { console.log('❌ ProjectDependency:', e.message.slice(0, 150)); }

  console.log('\n✅ Total: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
