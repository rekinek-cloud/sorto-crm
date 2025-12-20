import { PrismaClient, UserRelationType, UserInheritanceRule, AccessLevel, DataScope, 
         UserDataScope, UserAction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Medium Priority Tables seeding...');

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
  // 1. TAG SYSTEM (Tag)
  // ================================

  console.log('🏷️ Creating Tags...');
  
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'urgent',
        color: '#EF4444',
        category: 'priority',
        usageCount: 15,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'client-work',
        color: '#3B82F6',
        category: 'work-type',
        usageCount: 23,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'personal',
        color: '#10B981',
        category: 'context',
        usageCount: 8,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'follow-up',
        color: '#F59E0B',
        category: 'action',
        usageCount: 12,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'high-priority',
        color: '#DC2626',
        category: 'priority',
        usageCount: 9,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'documentation',
        color: '#6366F1',
        category: 'work-type',
        usageCount: 7,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'meeting',
        color: '#8B5CF6',
        category: 'activity',
        usageCount: 18,
        organizationId: organization.id
      }
    }),

    prisma.tag.create({
      data: {
        name: 'research',
        color: '#06B6D4',
        category: 'work-type',
        usageCount: 5,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // ================================
  // 2. KNOWLEDGE BASE SYSTEM (KnowledgeBase)
  // ================================

  console.log('📚 Creating Knowledge Base entries...');
  
  const knowledgeBases = await Promise.all([
    prisma.knowledgeBase.create({
      data: {
        title: 'CRM-GTD Smart Product Documentation',
        content: `# CRM-GTD Smart - Complete Product Documentation

## Overview
CRM-GTD Smart is a comprehensive productivity system that combines Customer Relationship Management with the Getting Things Done methodology.

## Core Features
1. **Smart Mailboxes** - AI-powered email management
2. **GTD Integration** - Full David Allen methodology implementation
3. **Voice TTS** - Text-to-speech accessibility features
4. **AI Assistant** - Intelligent automation and suggestions
5. **Vector Search** - Semantic search capabilities

## Getting Started
1. Set up your organization
2. Configure email integration
3. Import contacts and companies
4. Create your first project
5. Set up GTD contexts

## Advanced Features
- Custom rules and automation
- AI-powered insights
- Multi-tenant architecture
- Real-time collaboration`,
        category: 'product-documentation',
        tags: ['documentation', 'product', 'getting-started'],
        relatedItems: [],
        organizationId: organization.id
      }
    }),

    prisma.knowledgeBase.create({
      data: {
        title: 'Customer Support Knowledge Base',
        content: `# Customer Support Guidelines

## Common Issues and Solutions

### Login Problems
1. **Forgotten Password**: Use password reset link
2. **Account Locked**: Contact admin for unlock
3. **2FA Issues**: Check device time synchronization

### Email Integration
1. **IMAP Setup**: Configure server settings
2. **OAuth Authentication**: Grant necessary permissions
3. **Sync Issues**: Check network connectivity

### Performance Issues
1. **Slow Loading**: Clear browser cache
2. **Memory Usage**: Close unnecessary tabs
3. **Database Queries**: Monitor slow queries

## Escalation Procedures
- Level 1: Basic troubleshooting
- Level 2: Technical investigation
- Level 3: Development team involvement`,
        category: 'customer-support',
        tags: ['support', 'troubleshooting', 'escalation'],
        relatedItems: [],
        organizationId: organization.id
      }
    }),

    prisma.knowledgeBase.create({
      data: {
        title: 'GTD Methodology Implementation Guide',
        content: `# Getting Things Done (GTD) Implementation

## The 5 Steps of GTD

### 1. Capture
- Collect everything in a trusted system
- Don't analyze - just capture
- Use inbox for temporary storage

### 2. Clarify
- Process items to zero
- Apply the 2-minute rule
- Make clear next action decisions

### 3. Organize
- Sort by context and priority
- Use appropriate lists and folders
- Maintain reference system

### 4. Reflect
- Conduct weekly reviews
- Update and maintain lists
- Plan and prioritize

### 5. Engage
- Choose next actions with confidence
- Work from appropriate contexts
- Trust your system

## Best Practices
- Process inbox to zero daily
- Use contexts for efficiency
- Schedule weekly reviews
- Maintain reference materials`,
        category: 'methodology',
        tags: ['gtd', 'productivity', 'methodology'],
        relatedItems: [],
        organizationId: organization.id
      }
    }),

    prisma.knowledgeBase.create({
      data: {
        title: 'API Integration Guidelines',
        content: `# API Integration Best Practices

## Authentication
- Use API keys for service-to-service
- Implement OAuth for user authentication
- Rotate keys regularly

## Rate Limiting
- Standard: 1,000 requests/hour
- Professional: 5,000 requests/hour
- Enterprise: Unlimited (fair use)

## Error Handling
- Implement exponential backoff
- Log all API errors
- Provide meaningful error messages

## Security
- Always use HTTPS
- Validate all input
- Sanitize responses

## Monitoring
- Track API usage
- Monitor response times
- Set up alerts for failures`,
        category: 'technical',
        tags: ['api', 'integration', 'security'],
        relatedItems: [],
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${knowledgeBases.length} knowledge base entries`);

  // ================================
  // 3. USER RELATION SYSTEM (UserRelation)
  // ================================

  console.log('👥 Creating User Relations...');
  
  const userRelations = [];
  
  if (users.length > 1) {
    // Manager-Employee relation
    userRelations.push(await prisma.userRelation.create({
      data: {
        managerId: users[0].id,
        employeeId: users[1].id,
        relationType: UserRelationType.MANAGES,
        description: 'Direct management relationship - department head',
        isActive: true,
        inheritanceRule: UserInheritanceRule.INHERIT_DOWN,
        canDelegate: true,
        canApprove: true,
        startsAt: new Date('2024-01-01'),
        createdById: users[0].id,
        organizationId: organization.id
      }
    }));

    if (users.length > 2) {
      // Team Lead relation
      userRelations.push(await prisma.userRelation.create({
        data: {
          managerId: users[1].id,
          employeeId: users[2].id,
          relationType: UserRelationType.LEADS,
          description: 'Team leadership role - project coordination',
          isActive: true,
          inheritanceRule: UserInheritanceRule.INHERIT_DOWN,
          canDelegate: true,
          canApprove: false,
          startsAt: new Date('2024-02-15'),
          createdById: users[1].id,
          organizationId: organization.id
        }
      }));

      if (users.length > 3) {
        // Mentor relation
        userRelations.push(await prisma.userRelation.create({
          data: {
            managerId: users[0].id,
            employeeId: users[3].id,
            relationType: UserRelationType.MENTORS,
            description: 'Mentoring relationship - skill development',
            isActive: true,
            inheritanceRule: UserInheritanceRule.NO_INHERITANCE,
            canDelegate: false,
            canApprove: false,
            startsAt: new Date('2024-03-01'),
            endsAt: new Date('2024-12-31'),
            createdById: users[0].id,
            organizationId: organization.id
          }
        }));

        // Collaboration relation
        userRelations.push(await prisma.userRelation.create({
          data: {
            managerId: users[2].id,
            employeeId: users[3].id,
            relationType: UserRelationType.COLLABORATES,
            description: 'Peer collaboration - cross-team projects',
            isActive: true,
            inheritanceRule: UserInheritanceRule.NO_INHERITANCE,
            canDelegate: false,
            canApprove: false,
            startsAt: new Date('2024-04-01'),
            createdById: users[2].id,
            organizationId: organization.id
          }
        }));
      }
    }
  }

  console.log(`✅ Created ${userRelations.length} user relations`);

  // ================================
  // 4. STREAM PERMISSION SYSTEM (StreamPermission)
  // ================================

  console.log('🌊 Creating Stream Permissions...');
  
  const streamPermissions = [];
  
  if (streams.length > 0 && users.length > 1) {
    // Admin permission for primary user
    streamPermissions.push(await prisma.streamPermission.create({
      data: {
        streamId: streams[0].id,
        userId: users[0].id,
        accessLevel: AccessLevel.ADMIN,
        dataScope: [DataScope.TASKS, DataScope.PROJECTS],
        grantedAt: new Date('2024-01-01'),
        expiresAt: null,
        grantedById: users[0].id,
        organizationId: organization.id
      }
    }));

    // Write permission for second user
    streamPermissions.push(await prisma.streamPermission.create({
      data: {
        streamId: streams[0].id,
        userId: users[1].id,
        accessLevel: AccessLevel.COLLABORATOR,
        dataScope: [DataScope.TASKS, DataScope.COMMUNICATION],
        grantedAt: new Date('2024-01-15'),
        expiresAt: null,
        grantedById: users[0].id,
        organizationId: organization.id
      }
    }));

    if (users.length > 2) {
      // Read permission for third user
      streamPermissions.push(await prisma.streamPermission.create({
        data: {
          streamId: streams[0].id,
          userId: users[2].id,
          accessLevel: AccessLevel.READ_ONLY,
          dataScope: [DataScope.BASIC_INFO, DataScope.TASKS],
          grantedAt: new Date('2024-02-01'),
          expiresAt: new Date('2024-12-31'),
          grantedById: users[0].id,
          organizationId: organization.id
        }
      }));
    }

    // Additional stream permissions if more streams exist
    if (streams.length > 1) {
      streamPermissions.push(await prisma.streamPermission.create({
        data: {
          streamId: streams[1].id,
          userId: users[0].id,
          accessLevel: AccessLevel.ADMIN,
          dataScope: [DataScope.TASKS, DataScope.PROJECTS],
          grantedAt: new Date('2024-01-01'),
          expiresAt: null,
          grantedById: users[0].id,
          organizationId: organization.id
        }
      }));
    }
  }

  console.log(`✅ Created ${streamPermissions.length} stream permissions`);

  // ================================
  // 5. SMART GOALS SYSTEM (Smart)
  // ================================

  console.log('🎯 Creating SMART goals...');
  
  const smartGoals = [];
  
  if (tasks.length > 0) {
    // SMART goal for first task
    smartGoals.push(await prisma.smart.create({
      data: {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
        taskId: tasks[0].id
      }
    }));

    if (tasks.length > 1) {
      // Partially SMART goal
      smartGoals.push(await prisma.smart.create({
        data: {
          specific: true,
          measurable: true,
          achievable: false,
          relevant: true,
          timeBound: false,
          taskId: tasks[1].id
        }
      }));
    }

    if (tasks.length > 2) {
      // Non-SMART goal needing improvement
      smartGoals.push(await prisma.smart.create({
        data: {
          specific: false,
          measurable: false,
          achievable: true,
          relevant: true,
          timeBound: false,
          taskId: tasks[2].id
        }
      }));
    }

    // Standalone SMART goals without specific tasks
    smartGoals.push(await prisma.smart.create({
      data: {
        specific: true,
        measurable: true,
        achievable: true,
        relevant: true,
        timeBound: true,
        taskId: null
      }
    }));

    smartGoals.push(await prisma.smart.create({
      data: {
        specific: true,
        measurable: false,
        achievable: true,
        relevant: true,
        timeBound: true,
        taskId: null
      }
    }));
  }

  console.log(`✅ Created ${smartGoals.length} SMART goals`);

  // ================================
  // 6. USER PERMISSION SYSTEM (UserPermission)
  // ================================

  console.log('🔐 Creating User Permissions...');
  
  const userPermissions = [];
  
  if (userRelations.length > 0) {
    // Admin permissions for managers
    userPermissions.push(await prisma.userPermission.create({
      data: {
        relationId: userRelations[0].id,
        dataScope: UserDataScope.ALL,
        action: UserAction.VIEW,
        granted: true,
        expiresAt: null,
        grantedById: users[0].id,
        organizationId: organization.id
      }
    }));

    userPermissions.push(await prisma.userPermission.create({
      data: {
        relationId: userRelations[0].id,
        dataScope: UserDataScope.TASKS,
        action: UserAction.EDIT,
        granted: true,
        expiresAt: null,
        grantedById: users[0].id,
        organizationId: organization.id
      }
    }));

    if (userRelations.length > 1) {
      // Team lead permissions
      userPermissions.push(await prisma.userPermission.create({
        data: {
          relationId: userRelations[1].id,
          dataScope: UserDataScope.TEAM_DATA,
          action: UserAction.VIEW,
          granted: true,
          expiresAt: new Date('2024-12-31'),
          grantedById: users[0].id,
          organizationId: organization.id
        }
      }));

      userPermissions.push(await prisma.userPermission.create({
        data: {
          relationId: userRelations[1].id,
          dataScope: UserDataScope.TASKS,
          action: UserAction.EDIT,
          granted: true,
          expiresAt: null,
          grantedById: users[1].id,
          organizationId: organization.id
        }
      }));
    }

    if (userRelations.length > 2) {
      // Mentor permissions
      userPermissions.push(await prisma.userPermission.create({
        data: {
          relationId: userRelations[2].id,
          dataScope: UserDataScope.PROFILE,
          action: UserAction.VIEW,
          granted: true,
          expiresAt: new Date('2024-12-31'),
          grantedById: users[0].id,
          organizationId: organization.id
        }
      }));

      // Collaboration permissions
      if (userRelations.length > 3) {
        userPermissions.push(await prisma.userPermission.create({
          data: {
            relationId: userRelations[3].id,
            dataScope: UserDataScope.DOCUMENTS,
            action: UserAction.VIEW,
            granted: true,
            expiresAt: null,
            grantedById: users[2].id,
            organizationId: organization.id
          }
        }));
      }
    }
  }

  console.log(`✅ Created ${userPermissions.length} user permissions`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    tags.length + 
    knowledgeBases.length +
    userRelations.length +
    streamPermissions.length +
    smartGoals.length +
    userPermissions.length;

  console.log(`\n🎉 Medium Priority Tables completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   Tags: ${tags.length} records`);
  console.log(`   Knowledge Base: ${knowledgeBases.length} records`);
  console.log(`   User Relations: ${userRelations.length} records`);
  console.log(`   Stream Permissions: ${streamPermissions.length} records`);
  console.log(`   SMART Goals: ${smartGoals.length} records`);
  console.log(`   User Permissions: ${userPermissions.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Ready for Low Priority Tables`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Medium Priority seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });