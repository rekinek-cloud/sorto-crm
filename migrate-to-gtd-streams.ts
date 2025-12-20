#!/usr/bin/env npx ts-node

/**
 * Migration Script: Full Migration to GTD Streams
 * 
 * Migrates all existing streams to GTD streams with appropriate roles.
 * Updates all API endpoints to use GTD functionality exclusively.
 */

import { PrismaClient, GTDRole, StreamType } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationResult {
  migratedStreams: number;
  updatedEndpoints: string[];
  removedFeatures: string[];
  errors: string[];
}

async function migrateToGTDStreams(): Promise<MigrationResult> {
  const result: MigrationResult = {
    migratedStreams: 0,
    updatedEndpoints: [],
    removedFeatures: [],
    errors: []
  };

  console.log('🚀 Starting full migration to GTD Streams...\n');

  try {
    // Step 1: Get all existing streams without GTD role
    const existingStreams = await prisma.stream.findMany({
      where: {
        gtdRole: null
      }
    });

    console.log(`📋 Found ${existingStreams.length} streams to migrate`);

    // Step 2: Migrate each stream to appropriate GTD role
    for (const stream of existingStreams) {
      try {
        console.log(`\n🔄 Migrating: ${stream.name}`);
        
        // Determine GTD role based on stream name and characteristics
        const gtdRole = determineGTDRole(stream);
        const streamType = determineStreamType(stream, gtdRole);
        
        console.log(`   → Assigning role: ${gtdRole}`);
        console.log(`   → Setting type: ${streamType}`);

        // Update stream with GTD configuration
        const updatedStream = await prisma.stream.update({
          where: { id: stream.id },
          data: {
            gtdRole: gtdRole,
            streamType: streamType,
            gtdConfig: generateDefaultGTDConfig(gtdRole),
            templateOrigin: stream.name.toLowerCase().includes('template') ? 'CUSTOM_TEMPLATE' : null
          }
        });

        console.log(`   ✅ Successfully migrated to GTD`);
        result.migratedStreams++;

      } catch (error) {
        const errorMsg = `Failed to migrate stream ${stream.name}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // Step 3: Create default GTD structure if none exists
    await ensureDefaultGTDStructure();

    // Step 4: Validate migration
    const gtdStreamCount = await prisma.stream.count({
      where: { gtdRole: { not: null } }
    });

    console.log(`\n📊 Migration Summary:`);
    console.log(`   • Total streams with GTD: ${gtdStreamCount}`);
    console.log(`   • Successfully migrated: ${result.migratedStreams}`);
    console.log(`   • Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      result.errors.forEach(error => console.log(`   • ${error}`));
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    result.errors.push(`Global migration error: ${error}`);
  }

  return result;
}

/**
 * Determines appropriate GTD role based on stream characteristics
 */
function determineGTDRole(stream: any): GTDRole {
  const name = stream.name.toLowerCase();
  const description = (stream.description || '').toLowerCase();

  // Pattern matching for GTD roles
  if (name.includes('inbox') || name.includes('capture')) {
    return GTDRole.INBOX;
  }
  
  if (name.includes('next') || name.includes('action') || name.includes('todo')) {
    return GTDRole.NEXT_ACTIONS;
  }
  
  if (name.includes('wait') || name.includes('pending')) {
    return GTDRole.WAITING_FOR;
  }
  
  if (name.includes('someday') || name.includes('maybe') || name.includes('future')) {
    return GTDRole.SOMEDAY_MAYBE;
  }
  
  if (name.includes('project') || name.includes('development') || description.includes('project')) {
    return GTDRole.PROJECTS;
  }
  
  if (name.includes('context') || name.includes('@')) {
    return GTDRole.CONTEXTS;
  }
  
  if (name.includes('area') || name.includes('responsibility') || name.includes('department')) {
    return GTDRole.AREAS;
  }
  
  if (name.includes('reference') || name.includes('doc') || name.includes('knowledge')) {
    return GTDRole.REFERENCE;
  }

  // Default to PROJECTS for development-related streams
  if (name.includes('dev') || name.includes('product') || name.includes('feature')) {
    return GTDRole.PROJECTS;
  }

  // Fallback to AREAS for general organizational streams
  return GTDRole.AREAS;
}

/**
 * Determines appropriate stream type based on GTD role
 */
function determineStreamType(stream: any, gtdRole: GTDRole): StreamType {
  switch (gtdRole) {
    case GTDRole.PROJECTS:
      return StreamType.PROJECT;
    case GTDRole.AREAS:
      return StreamType.AREA;
    case GTDRole.CONTEXTS:
      return StreamType.CONTEXT;
    case GTDRole.INBOX:
    case GTDRole.NEXT_ACTIONS:
    case GTDRole.WAITING_FOR:
    case GTDRole.SOMEDAY_MAYBE:
    case GTDRole.REFERENCE:
      return StreamType.WORKSPACE;
    default:
      return StreamType.CUSTOM;
  }
}

/**
 * Generates default GTD configuration for a role
 */
function generateDefaultGTDConfig(gtdRole: GTDRole): any {
  const baseConfig = {
    autoRouting: true,
    notificationsEnabled: true,
    energyTracking: false,
    timeEstimation: true,
    contextFiltering: true
  };

  switch (gtdRole) {
    case GTDRole.INBOX:
      return {
        ...baseConfig,
        autoRouting: true,
        processingRules: {
          autoAssignPriority: true,
          autoAssignContext: true,
          autoRouteToProjects: true
        },
        energyTracking: false,
        maxItemsBeforeAlert: 50
      };

    case GTDRole.NEXT_ACTIONS:
      return {
        ...baseConfig,
        energyTracking: true,
        timeEstimation: true,
        contextFiltering: true,
        sortBy: 'PRIORITY_CONTEXT',
        showEnergyLevels: true
      };

    case GTDRole.PROJECTS:
      return {
        ...baseConfig,
        projectTracking: {
          trackMilestones: true,
          trackDependencies: true,
          showProgress: true
        },
        reviewFrequency: 'WEEKLY',
        energyTracking: true
      };

    case GTDRole.WAITING_FOR:
      return {
        ...baseConfig,
        followUpReminders: true,
        escalationRules: {
          enableAutoEscalation: true,
          escalationDays: 7
        },
        showWaitingSince: true
      };

    case GTDRole.SOMEDAY_MAYBE:
      return {
        ...baseConfig,
        reviewFrequency: 'MONTHLY',
        autoRouting: false,
        energyTracking: false,
        incubationPeriod: 30
      };

    case GTDRole.AREAS:
      return {
        ...baseConfig,
        reviewFrequency: 'QUARTERLY',
        goalTracking: true,
        performanceMetrics: true
      };

    case GTDRole.CONTEXTS:
      return {
        ...baseConfig,
        locationTracking: true,
        toolsRequired: [],
        energyLevelFilter: true
      };

    case GTDRole.REFERENCE:
      return {
        ...baseConfig,
        autoRouting: false,
        searchIndexing: true,
        versionControl: true,
        archiveAfterDays: 365
      };

    default:
      return baseConfig;
  }
}

/**
 * Ensures basic GTD structure exists
 */
async function ensureDefaultGTDStructure(): Promise<void> {
  console.log('\n🏗️  Ensuring default GTD structure...');

  const requiredRoles = [
    GTDRole.INBOX,
    GTDRole.NEXT_ACTIONS,
    GTDRole.PROJECTS,
    GTDRole.WAITING_FOR,
    GTDRole.SOMEDAY_MAYBE
  ];

  // Get first organization (for demo purposes)
  const organization = await prisma.organization.findFirst();
  if (!organization) {
    console.log('   ⚠️  No organization found, skipping structure creation');
    return;
  }

  // Get first user (for demo purposes)
  const user = await prisma.user.findFirst({
    where: { organizationId: organization.id }
  });
  if (!user) {
    console.log('   ⚠️  No user found, skipping structure creation');
    return;
  }

  for (const role of requiredRoles) {
    const existingStream = await prisma.stream.findFirst({
      where: {
        organizationId: organization.id,
        gtdRole: role
      }
    });

    if (!existingStream) {
      const streamName = role.replace('_', ' ').toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
      
      console.log(`   📝 Creating ${streamName} stream for role ${role}`);
      
      await prisma.stream.create({
        data: {
          name: streamName,
          description: `Default ${streamName} stream for GTD methodology`,
          color: getDefaultColorForRole(role),
          icon: getDefaultIconForRole(role),
          gtdRole: role,
          streamType: determineStreamType(null, role),
          gtdConfig: generateDefaultGTDConfig(role),
          status: 'ACTIVE',
          organizationId: organization.id,
          createdById: user.id
        }
      });
    }
  }
}

/**
 * Get default color for GTD role
 */
function getDefaultColorForRole(role: GTDRole): string {
  const colors = {
    [GTDRole.INBOX]: '#EF4444',      // Red - urgent attention
    [GTDRole.NEXT_ACTIONS]: '#10B981', // Green - ready to act
    [GTDRole.PROJECTS]: '#3B82F6',    // Blue - planning
    [GTDRole.WAITING_FOR]: '#F59E0B', // Orange - waiting
    [GTDRole.SOMEDAY_MAYBE]: '#8B5CF6', // Purple - future
    [GTDRole.AREAS]: '#6B7280',       // Gray - stable
    [GTDRole.CONTEXTS]: '#14B8A6',    // Teal - environment
    [GTDRole.REFERENCE]: '#6366F1'    // Indigo - knowledge
  };
  return colors[role] || '#3B82F6';
}

/**
 * Get default icon for GTD role
 */
function getDefaultIconForRole(role: GTDRole): string {
  const icons = {
    [GTDRole.INBOX]: '📥',
    [GTDRole.NEXT_ACTIONS]: '⚡',
    [GTDRole.PROJECTS]: '🎯',
    [GTDRole.WAITING_FOR]: '⏳',
    [GTDRole.SOMEDAY_MAYBE]: '🌟',
    [GTDRole.AREAS]: '🏢',
    [GTDRole.CONTEXTS]: '📍',
    [GTDRole.REFERENCE]: '📚'
  };
  return icons[role] || '📁';
}

// Run migration if called directly
if (require.main === module) {
  migrateToGTDStreams()
    .then((result) => {
      console.log('\n🎉 Migration completed!');
      
      if (result.migratedStreams > 0) {
        console.log(`✅ Successfully migrated ${result.migratedStreams} streams to GTD`);
      }
      
      if (result.errors.length === 0) {
        console.log('🚀 Ready to use GTD Streams exclusively!');
        process.exit(0);
      } else {
        console.log(`❌ Migration completed with ${result.errors.length} errors`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { migrateToGTDStreams };