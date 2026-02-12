/**
 * Fix last 3 empty tables: ai_rules, email_rules, project_dependencies
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const NOW = new Date();

async function main() {
  console.log('🌱 Fixing last 3 tables...\n');
  let created = 0;

  // 1. ai_rules - need proper enum values and all required fields
  try {
    const cnt = await prisma.ai_rules.count();
    if (cnt === 0) {
      await prisma.ai_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Auto-Priority Rule',
          description: 'Automatically set task priority based on deadline',
          status: 'ACTIVE',
          priority: 0,
          triggerType: 'TASK_CREATED',
          triggerConditions: { deadline: { within: '24h' } },
          actions: { setPriority: 'HIGH' },
          executionCount: 0,
          successCount: 0,
          errorCount: 0,
          organizationId: ORG_ID,
          createdAt: NOW,
          updatedAt: NOW
        }
      });
      console.log('✅ ai_rules: 1');
      created++;
    } else console.log('⏭️ ai_rules: ' + cnt);
  } catch (e) { console.log('❌ ai_rules:', e.message.slice(0, 200)); }

  // 2. email_rules - need proper enum values and all required fields
  try {
    const cnt = await prisma.email_rules.count();
    if (cnt === 0) {
      await prisma.email_rules.create({
        data: {
          id: crypto.randomUUID(),
          name: 'VIP Sender Filter',
          description: 'Mark emails from VIP senders',
          senderDomain: 'important-client.com',
          assignCategory: 'VIP',
          skipAIAnalysis: false,
          autoArchive: false,
          autoDelete: false,
          createTask: false,
          priority: 10,
          isActive: true,
          matchCount: 0,
          organizationId: ORG_ID,
          createdAt: NOW,
          updatedAt: NOW
        }
      });
      console.log('✅ email_rules: 1');
      created++;
    } else console.log('⏭️ email_rules: ' + cnt);
  } catch (e) { console.log('❌ email_rules:', e.message.slice(0, 200)); }

  // 3. project_dependencies - create 2 projects if needed, then dependency
  try {
    const cnt = await prisma.projectDependency.count();
    if (cnt === 0) {
      // Check existing projects
      let projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 2 });

      // If not enough projects, create them
      if (projects.length < 2) {
        console.log('  Creating additional projects...');
        const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });

        for (let i = projects.length; i < 2; i++) {
          const newProject = await prisma.project.create({
            data: {
              id: crypto.randomUUID(),
              name: `Seed Project ${i + 1}`,
              description: 'Project created for dependency testing',
              status: 'ACTIVE',
              organizationId: ORG_ID,
              createdById: '66ef64df-053d-4caa-a6ce-f7a3ce783581',
              streamId: streams[0]?.id
            }
          });
          projects.push(newProject);
        }
      }

      if (projects.length >= 2) {
        await prisma.projectDependency.create({
          data: {
            id: crypto.randomUUID(),
            sourceProjectId: projects[0].id,
            dependentProjectId: projects[1].id,
            type: 'FINISH_TO_START',
            isCriticalPath: false
          }
        });
        console.log('✅ project_dependencies: 1');
        created++;
      }
    } else console.log('⏭️ project_dependencies: ' + cnt);
  } catch (e) { console.log('❌ project_dependencies:', e.message.slice(0, 200)); }

  console.log('\n✅ Total created: ' + created);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
