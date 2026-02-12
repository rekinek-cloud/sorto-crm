/**
 * Create project and dependency
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const ORG_ID = 'd3d91404-e75f-4bee-8f0c-0e1eaa25317f';
const USER_ID = '66ef64df-053d-4caa-a6ce-f7a3ce783581';
const NOW = new Date();

async function main() {
  console.log('🌱 Creating project and dependency...\n');

  // Check existing projects
  let projects = await prisma.project.findMany({ where: { organizationId: ORG_ID }, take: 2 });
  console.log('Existing projects:', projects.length);

  // Create additional project if needed
  if (projects.length < 2) {
    const streams = await prisma.stream.findMany({ where: { organizationId: ORG_ID }, take: 1 });
    console.log('Creating new project...');

    const newProject = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Seed Project for Dependency',
        description: 'Project created for dependency testing',
        status: 'PLANNING',
        organizationId: ORG_ID,
        createdById: USER_ID,
        streamId: streams[0]?.id,
        updatedAt: NOW
      }
    });
    console.log('✅ Created project:', newProject.name);
    projects.push(newProject);
  }

  // Now create dependency
  if (projects.length >= 2) {
    const cnt = await prisma.projectDependency.count();
    if (cnt === 0) {
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
    } else {
      console.log('⏭️ project_dependencies already exists:', cnt);
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
