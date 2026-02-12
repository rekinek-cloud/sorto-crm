/**
 * Detailed seed script with correct field names
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Detailed seeding...\n');
  let created = 0;

  // 1. user_access_logs
  try {
    const cnt = await prisma.user_access_logs.count();
    if (cnt === 0) {
      await prisma.user_access_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          action: 'LOGIN',
          success: true,
          accessType: 'DIRECT',
          dataScope: ['BASIC_INFO'],
          organizationId: ORG_ID
        }
      });
      console.log('✅ user_access_logs: 1');
      created++;
    } else console.log('⏭️ user_access_logs: ' + cnt);
  } catch (e) { console.log('❌ user_access_logs:', e.message.slice(0, 200)); }

  // 2. user_patterns
  try {
    const cnt = await prisma.user_patterns.count();
    if (cnt === 0) {
      await prisma.user_patterns.create({
        data: {
          id: crypto.randomUUID(),
          patternType: 'TASK_COMPLETION',
          patternKey: 'morning_productivity',
          confidence: 0.85,
          strength: 0.9,
          successRate: 0.88,
          patternData: { timePreference: 'morning', taskTypes: ['coding', 'review'] },
          learningSource: 'BEHAVIORAL_ANALYSIS',
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ user_patterns: 1');
      created++;
    } else console.log('⏭️ user_patterns: ' + cnt);
  } catch (e) { console.log('❌ user_patterns:', e.message.slice(0, 200)); }

  // 3. user_relations (managerId, employeeId)
  try {
    const cnt = await prisma.user_relations.count();
    if (cnt === 0) {
      const users = await prisma.user.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (users.length >= 2) {
        await prisma.user_relations.create({
          data: {
            id: crypto.randomUUID(),
            managerId: users[0].id,
            employeeId: users[1].id,
            relationType: 'MANAGES',
            createdById: USER_ID,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ user_relations: 1');
        created++;
      }
    } else console.log('⏭️ user_relations: ' + cnt);
  } catch (e) { console.log('❌ user_relations:', e.message.slice(0, 200)); }

  // 4. user_permissions (relationId required)
  try {
    const cnt = await prisma.user_permissions.count();
    if (cnt === 0) {
      const rels = await prisma.user_relations.findMany({ take: 1 });
      if (rels.length > 0) {
        await prisma.user_permissions.create({
          data: {
            id: crypto.randomUUID(),
            relationId: rels[0].id,
            dataScope: 'TASKS',
            action: 'EDIT',
            granted: true,
            organizationId: ORG_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ user_permissions: 1');
        created++;
      }
    } else console.log('⏭️ user_permissions: ' + cnt);
  } catch (e) { console.log('❌ user_permissions:', e.message.slice(0, 200)); }

  // 5. user_view_preferences
  try {
    const cnt = await prisma.user_view_preferences.count();
    if (cnt === 0) {
      await prisma.user_view_preferences.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          preferences: { columns: 4, cardSize: 'medium' },
          updatedAt: NOW
        }
      });
      console.log('✅ user_view_preferences: 1');
      created++;
    } else console.log('⏭️ user_view_preferences: ' + cnt);
  } catch (e) { console.log('❌ user_view_preferences:', e.message.slice(0, 200)); }

  // 6. view_analytics
  try {
    const cnt = await prisma.view_analytics.count();
    if (cnt === 0) {
      await prisma.view_analytics.create({
        data: {
          id: crypto.randomUUID(),
          userId: USER_ID,
          viewType: 'KANBAN',
          action: 'VIEW',
          metadata: { section: 'tasks' },
          durationSeconds: 120
        }
      });
      console.log('✅ view_analytics: 1');
      created++;
    } else console.log('⏭️ view_analytics: ' + cnt);
  } catch (e) { console.log('❌ view_analytics:', e.message.slice(0, 200)); }

  // 7. energy_analytics
  try {
    const cnt = await prisma.energy_analytics.count();
    if (cnt === 0) {
      const blocks = await prisma.energy_time_blocks.findMany({ take: 1 });
      if (blocks.length > 0) {
        await prisma.energy_analytics.create({
          data: {
            id: crypto.randomUUID(),
            energyTimeBlockId: blocks[0].id,
            plannedEnergy: 'HIGH',
            actualEnergy: 'MEDIUM',
            tasksPlanned: 5,
            tasksCompleted: 4,
            energyScore: 85,
            organizationId: ORG_ID,
            userId: USER_ID,
            updatedAt: NOW
          }
        });
        console.log('✅ energy_analytics: 1');
        created++;
      }
    } else console.log('⏭️ energy_analytics: ' + cnt);
  } catch (e) { console.log('❌ energy_analytics:', e.message.slice(0, 200)); }

  // 8. performance_metrics
  try {
    const cnt = await prisma.performance_metrics.count();
    if (cnt === 0) {
      await prisma.performance_metrics.create({
        data: {
          id: crypto.randomUUID(),
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          periodType: 'MONTHLY',
          primaryContext: 'WORK',
          contextEfficiency: 0.82,
          energyLevel: 'HIGH',
          energyConsistency: 0.75,
          completionRate: 0.88,
          timeBlockUtilization: 0.9,
          totalTasks: 20,
          completedTasks: 18,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ performance_metrics: 1');
      created++;
    } else console.log('⏭️ performance_metrics: ' + cnt);
  } catch (e) { console.log('❌ performance_metrics:', e.message.slice(0, 200)); }

  // 9. processing_rules
  try {
    const cnt = await prisma.processingRule.count();
    if (cnt === 0) {
      await prisma.processingRule.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-archive',
          description: 'Archive old items',
          conditions: { age: { gt: 30 } },
          actions: [{ type: 'ARCHIVE' }],
          priority: 1,
          isActive: true,
          organizationId: ORG_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ ProcessingRule: 1');
      created++;
    } else console.log('⏭️ ProcessingRule: ' + cnt);
  } catch (e) { console.log('❌ ProcessingRule:', e.message.slice(0, 200)); }

  // 10. email_rules
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'VIP filter',
          assignCategory: 'VIP',
          senderDomain: 'important.com',
          priority: 10,
          isActive: true,
          organizationId: ORG_ID,
          userId: USER_ID,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created++;
    } else console.log('⏭️ email_rules: ' + cnt);
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 200)); }

  // 11. task_relationships (fromTaskId, toTaskId)
  try {
    const cnt = await prisma.taskRelationship.count();
    if (cnt === 0) {
      const tasks = await prisma.task.findMany({ where: { organizationId: ORG_ID }, take: 2 });
      if (tasks.length >= 2) {
        await prisma.taskRelationship.create({
          data: {
            id: crypto.randomUUID(),
            fromTaskId: tasks[0].id,
            toTaskId: tasks[1].id,
            type: 'FINISH_TO_START',
            updatedAt: NOW
          }
        });
        console.log('✅ TaskRelationship: 1');
        created++;
      }
    } else console.log('⏭️ TaskRelationship: ' + cnt);
  } catch (e) { console.log('❌ TaskRelationship:', e.message.slice(0, 200)); }

  // 12. project_dependencies (sourceProjectId, dependentProjectId)
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
      }
    } else console.log('⏭️ ProjectDependency: ' + cnt);
  } catch (e) { console.log('❌ ProjectDependency:', e.message.slice(0, 200)); }

  console.log('\n✅ Total: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
