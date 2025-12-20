import { PrismaClient, StreamRelationType, Priority, DependencyType, InheritanceRule } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Low Priority Tables seeding...');

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

  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  const streams = await prisma.stream.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  const channels = await prisma.communicationChannel.findMany({
    where: { organizationId: organization.id },
    take: 3
  });

  const tasks = await prisma.task.findMany({
    where: { organizationId: organization.id },
    take: 5
  });

  const smartGoals = await prisma.smart.findMany({
    take: 3
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // 1. PROJECT DEPENDENCY SYSTEM (ProjectDependency)
  // ================================

  console.log('🔗 Creating Project Dependencies...');
  
  const projectDependencies = [];
  
  if (projects.length > 1) {
    // Project A depends on Project B
    projectDependencies.push(await prisma.projectDependency.create({
      data: {
        sourceProjectId: projects[1].id,
        dependentProjectId: projects[0].id,
        type: DependencyType.FINISH_TO_START,
        isCriticalPath: true
      }
    }));

    if (projects.length > 2) {
      // Project B depends on Project C
      projectDependencies.push(await prisma.projectDependency.create({
        data: {
          sourceProjectId: projects[2].id,
          dependentProjectId: projects[1].id,
          type: DependencyType.START_TO_START,
          isCriticalPath: false
        }
      }));

      // Critical path dependency
      projectDependencies.push(await prisma.projectDependency.create({
        data: {
          sourceProjectId: projects[2].id,
          dependentProjectId: projects[0].id,
          type: DependencyType.FINISH_TO_FINISH,
          isCriticalPath: true
        }
      }));
    }
  }

  console.log(`✅ Created ${projectDependencies.length} project dependencies`);

  // ================================
  // 2. STREAM CHANNEL SYSTEM (StreamChannel)
  // ================================

  console.log('📡 Creating Stream Channels...');
  
  const streamChannels = [];
  
  if (streams.length > 0 && channels.length > 0) {
    // Email channel for first stream
    streamChannels.push(await prisma.streamChannel.create({
      data: {
        streamId: streams[0].id,
        channelId: channels[0].id,
        autoCreateTasks: true,
        defaultContext: '@urgent',
        defaultPriority: Priority.HIGH
      }
    }));

    if (channels.length > 1) {
      // Slack channel for second stream
      streamChannels.push(await prisma.streamChannel.create({
        data: {
          streamId: streams.length > 1 ? streams[1].id : streams[0].id,
          channelId: channels[1].id,
          autoCreateTasks: false,
          defaultContext: '@support',
          defaultPriority: Priority.MEDIUM
        }
      }));
    }

    // Voice/SMS channel for third stream
    if (channels.length > 2) {
      streamChannels.push(await prisma.streamChannel.create({
        data: {
          streamId: streams.length > 2 ? streams[2].id : streams[0].id,
          channelId: channels[2].id,
          autoCreateTasks: true,
          defaultContext: '@emergency',
          defaultPriority: Priority.HIGH
        }
      }));
    }
  }

  console.log(`✅ Created ${streamChannels.length} stream channels`);

  // ================================
  // 3. STREAM RELATION SYSTEM (StreamRelation)
  // ================================

  console.log('🌊 Creating Stream Relations...');
  
  const streamRelations = [];
  
  if (streams.length > 1) {
    // Parent-Child relation
    streamRelations.push(await prisma.streamRelation.create({
      data: {
        parentId: streams[0].id,
        childId: streams[1].id,
        relationType: StreamRelationType.MANAGES,
        description: 'CRM Integration manages GTD Enhancement',
        isActive: true,
        inheritanceRule: InheritanceRule.INHERIT_DOWN,
        createdById: primaryUser.id,
        organizationId: organization.id
      }
    }));

    if (streams.length > 2) {
      // Dependency relation
      streamRelations.push(await prisma.streamRelation.create({
        data: {
          parentId: streams[1].id,
          childId: streams[2].id,
          relationType: StreamRelationType.DEPENDS_ON,
          description: 'Smart Mailboxes depends on GTD Enhancement completion',
          isActive: true,
          inheritanceRule: InheritanceRule.NO_INHERITANCE,
          createdById: primaryUser.id,
          organizationId: organization.id
        }
      }));

      // Cross-reference relation
      streamRelations.push(await prisma.streamRelation.create({
        data: {
          parentId: streams[0].id,
          childId: streams[2].id,
          relationType: StreamRelationType.RELATED_TO,
          description: 'CRM Integration related to Smart Mailboxes',
          isActive: false, // Inactive for testing
          inheritanceRule: InheritanceRule.NO_INHERITANCE,
          createdById: primaryUser.id,
          organizationId: organization.id
        }
      }));
    }
  }

  console.log(`✅ Created ${streamRelations.length} stream relations`);

  // ================================
  // 4. SMART TEMPLATE SYSTEM (SMARTTemplate)
  // ================================

  console.log('🎯 Creating SMART Templates...');
  
  const smartTemplates = await Promise.all([
    prisma.sMARTTemplate.create({
      data: {
        name: 'Quarterly Business Goals',
        taskTemplate: 'Complete business objective: [specific goal] by [deadline]',
        measurableCriteria: 'Increase revenue by 15% this quarter',
        typicalResources: 'Marketing team, sales data, budget allocation',
        estimatedDuration: 90, // 90 days
        typicalDependencies: 'Marketing campaign completion, Q3 report analysis',
        organizationId: organization.id
      }
    }),

    prisma.sMARTTemplate.create({
      data: {
        name: 'Personal Development Plan',
        taskTemplate: 'Develop [skill] to [proficiency level] in [timeframe]',
        measurableCriteria: 'Complete certification or pass skill assessment',
        typicalResources: 'Online courses, mentor time, practice projects',
        estimatedDuration: 180, // 6 months
        typicalDependencies: 'Course enrollment, mentor availability',
        organizationId: organization.id
      }
    }),

    prisma.sMARTTemplate.create({
      data: {
        name: 'Project Milestone Framework',
        taskTemplate: 'Complete [deliverable] with [quality standards] by [deadline]',
        measurableCriteria: 'All acceptance criteria verified by stakeholders',
        typicalResources: 'Development team, testing environment, stakeholder time',
        estimatedDuration: 30, // 1 month
        typicalDependencies: 'Previous milestone completion, resource availability',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${smartTemplates.length} SMART templates`);

  console.log('⏭️ Skipping non-existent SMART Analysis Detail and SMART Improvement tables...');

  // ================================
  // 7. METADATA SYSTEM (Metadata)
  // ================================

  console.log('🏷️ Creating Metadata...');
  
  const metadata = await Promise.all([
    prisma.metadata.create({
      data: {
        confidence: 0.85,
        ambiguity: 'Slightly ambiguous due to missing context',
        rawText: 'Task difficulty assessment: moderately complex',
        referenceId: tasks.length > 0 ? tasks[0].id : null,
        referenceType: 'task'
      }
    }),

    prisma.metadata.create({
      data: {
        confidence: 0.95,
        ambiguity: null,
        rawText: 'Estimated completion time based on similar projects',
        referenceId: tasks.length > 1 ? tasks[1].id : null,
        referenceType: 'task'
      }
    }),

    prisma.metadata.create({
      data: {
        confidence: 0.7,
        ambiguity: 'Technology choices may change during development',
        rawText: 'Project technical stack and architecture decisions',
        referenceId: projects.length > 0 ? projects[0].id : null,
        referenceType: 'project'
      }
    }),

    prisma.metadata.create({
      data: {
        confidence: 0.9,
        ambiguity: null,
        rawText: 'User preference settings and localization data',
        referenceId: primaryUser.id,
        referenceType: 'user'
      }
    })
  ]);

  console.log(`✅ Created ${metadata.length} metadata records`);

  // ================================
  // 8. COMPLETENESS SYSTEM (Completeness)
  // ================================

  console.log('📈 Creating Completeness records...');
  
  const completeness = await Promise.all([
    prisma.completeness.create({
      data: {
        isComplete: false,
        missingInfo: 'Task needs assignee and estimated completion time',
        clarity: 'Task description is clear but lacks technical details',
        taskId: tasks.length > 0 ? tasks[0].id : null,
        projectId: null
      }
    }),

    prisma.completeness.create({
      data: {
        isComplete: true,
        missingInfo: null,
        clarity: 'Project scope and objectives are well-defined',
        taskId: null,
        projectId: projects.length > 0 ? projects[0].id : null
      }
    }),

    prisma.completeness.create({
      data: {
        isComplete: false,
        missingInfo: 'Missing deadline and priority level',
        clarity: 'Task requirements need more specificity',
        taskId: tasks.length > 1 ? tasks[1].id : null,
        projectId: null
      }
    })
  ]);

  console.log(`✅ Created ${completeness.length} completeness records`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    projectDependencies.length + 
    streamChannels.length +
    streamRelations.length +
    smartTemplates.length +
    metadata.length +
    completeness.length;

  console.log(`\n🎉 Low Priority Tables completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   Project Dependencies: ${projectDependencies.length} records`);
  console.log(`   Stream Channels: ${streamChannels.length} records`);
  console.log(`   Stream Relations: ${streamRelations.length} records`);
  console.log(`   SMART Templates: ${smartTemplates.length} records`);
  console.log(`   Metadata: ${metadata.length} records`);
  console.log(`   Completeness: ${completeness.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n🎯 DATABASE 100% COMPLETED! 🎉`);
  console.log(`✅ All remaining tables now filled with realistic demo data`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Low Priority seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });