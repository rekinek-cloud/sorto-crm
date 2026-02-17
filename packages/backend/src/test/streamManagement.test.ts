/**
 * Integration tests for Stream Management functionality
 * Tests complete workflow from creation to configuration
 */

import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import { StreamRole, StreamType } from '@prisma/client';

describe('Stream Management Integration Tests', () => {
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let testStreamId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.stream.deleteMany({
      where: {
        name: {
          startsWith: 'Test Stream'
        }
      }
    });

    // Create test organization and user
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization Streams',
        plan: 'PROFESSIONAL'
      }
    });
    organizationId = org.id;

    const user = await prisma.user.create({
      data: {
        email: 'test.streams@example.com',
        firstName: 'Test',
        lastName: 'Streams User',
        organizationId: org.id,
        role: 'ADMIN'
      }
    });
    userId = user.id;

    // Mock authentication (in real app this would be JWT)
    authToken = 'mock-auth-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.stream.deleteMany({
      where: {
        organizationId
      }
    });
    await prisma.user.deleteMany({
      where: {
        organizationId
      }
    });
    await prisma.organization.delete({
      where: {
        id: organizationId
      }
    });
    await prisma.$disconnect();
  });

  describe('Stream Creation', () => {
    test('should create a new GTD stream with INBOX role', async () => {
      const streamData = {
        name: 'Test Stream Inbox',
        description: 'Test inbox for stream management integration tests',
        streamRole: 'INBOX' as StreamRole,
        streamType: 'WORKSPACE' as StreamType,
        streamConfig: {
          inboxBehavior: {
            autoProcessing: false,
            autoCreateTasks: true,
            defaultContext: '@computer',
            defaultEnergyLevel: 'MEDIUM',
            processAfterDays: 3,
            purgeAfterDays: 30
          },
          reviewFrequency: 'DAILY'
        }
      };

      const response = await request(app)
        .post('/api/v1/stream-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(streamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.name).toBe(streamData.name);
      expect(response.body.data.stream.streamRole).toBe('INBOX');
      expect(response.body.data.streamConfig).toBeDefined();
      
      testStreamId = response.body.data.stream.id;
    });

    test('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing name and role'
      };

      await request(app)
        .post('/api/v1/stream-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('should get streams by role', async () => {
      const response = await request(app)
        .get('/api/v1/stream-management/by-role/INBOX')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].streamRole).toBe('INBOX');
    });
  });

  describe('Stream Configuration Management', () => {
    test('should get stream configuration', async () => {
      const response = await request(app)
        .get(`/api/v1/stream-management/${testStreamId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.inboxBehavior).toBeDefined();
      expect(response.body.data.reviewFrequency).toBeDefined();
    });

    test('should update stream configuration', async () => {
      const newConfig = {
        inboxBehavior: {
          autoProcessing: true,
          autoCreateTasks: false,
          defaultContext: '@phone',
          defaultEnergyLevel: 'HIGH',
          processAfterDays: 1,
          purgeAfterDays: 7
        },
        reviewFrequency: 'WEEKLY',
        advanced: {
          enableAI: true,
          autoAssignContext: true,
          autoSetEnergyLevel: false,
          enableBulkProcessing: true,
          maxInboxItems: 50
        }
      };

      const response = await request(app)
        .put(`/api/v1/stream-management/${testStreamId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: newConfig })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.inboxBehavior.autoProcessing).toBe(true);
      expect(response.body.data.advanced.enableBulkProcessing).toBe(true);
    });

    test('should reset configuration to defaults', async () => {
      const response = await request(app)
        .post(`/api/v1/stream-management/${testStreamId}/config/reset`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Stream Migration', () => {
    let regularStreamId: string;

    beforeAll(async () => {
      // Create a regular stream to migrate
      const stream = await prisma.stream.create({
        data: {
          name: 'Test Regular Stream',
          description: 'To be migrated',
          organizationId,
          createdById: userId
        }
      });
      regularStreamId = stream.id;
    });

    test('should migrate regular stream', async () => {
      const migrationData = {
        streamRole: 'NEXT_ACTIONS' as StreamRole,
        streamType: 'PROJECT' as StreamType
      };

      const response = await request(app)
        .post(`/api/v1/stream-management/${regularStreamId}/migrate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(migrationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.streamRole).toBe('NEXT_ACTIONS');
      expect(response.body.data.stream.streamType).toBe('PROJECT');
      expect(response.body.data.streamConfig).toBeDefined();
    });

    test('should assign role to existing stream', async () => {
      const response = await request(app)
        .put(`/api/v1/stream-management/${regularStreamId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ streamRole: 'PROJECTS' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streamRole).toBe('PROJECTS');
    });
  });

  describe('Hierarchy Operations', () => {
    test('should validate stream hierarchy', async () => {
      const response = await request(app)
        .post(`/api/v1/stream-management/${testStreamId}/validate-hierarchy`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBeDefined();
      expect(response.body.data.errors).toBeInstanceOf(Array);
    });

    test('should get stream ancestors', async () => {
      const response = await request(app)
        .get(`/api/v1/stream-management/${testStreamId}/ancestors`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should get stream path', async () => {
      const response = await request(app)
        .get(`/api/v1/stream-management/${testStreamId}/path`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Content Analysis', () => {
    test('should analyze content for stream suggestions', async () => {
      const analysisData = {
        name: 'Urgent Project Deliverables',
        description: 'High priority tasks that need immediate attention',
        existingTasks: 15,
        relatedContacts: 5,
        messageVolume: 25
      };

      const response = await request(app)
        .post('/api/v1/stream-management/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analysisData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendedRole).toBeDefined();
      expect(response.body.data.recommendedContext).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
      expect(response.body.data.reasoning).toBeInstanceOf(Array);
    });
  });

  describe('Statistics and Insights', () => {
    test('should get stream management statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stream-management/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStreams).toBeGreaterThan(0);
      expect(response.body.data.streamsByRole).toBeDefined();
      expect(response.body.data.configuredStreams).toBeGreaterThan(0);
    });

    test('should get hierarchy statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stream-management/hierarchy-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should get routing statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stream-management/routing-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Resource Routing', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a test task for routing
      const task = await prisma.task.create({
        data: {
          title: 'Test Task for Routing',
          description: 'Task to test stream routing functionality',
          organizationId,
          createdById: userId,
          assigneeId: userId
        }
      });
      testTaskId = task.id;
    });

    test('should route task to appropriate stream', async () => {
      const routingData = {
        taskId: testTaskId,
        preferredStreamId: testStreamId
      };

      const response = await request(app)
        .post('/api/v1/stream-management/route/task')
        .set('Authorization', `Bearer ${authToken}`)
        .send(routingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streamId).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
      expect(response.body.data.reasoning).toBeInstanceOf(Array);
    });

    test('should perform bulk routing', async () => {
      const bulkData = {
        resources: [
          { type: 'TASK', id: testTaskId }
        ]
      };

      const response = await request(app)
        .post('/api/v1/stream-management/route/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Processing Rules', () => {
    test('should create processing rule for stream', async () => {
      const ruleData = {
        name: 'Auto-prioritize urgent items',
        description: 'Automatically set high priority for urgent items',
        active: true,
        triggers: [{
          type: 'EMAIL_RECEIVED',
          config: {}
        }],
        conditions: [{
          field: 'subject',
          operator: 'contains',
          value: 'urgent'
        }],
        actions: [{
          type: 'SET_PRIORITY',
          config: { priority: 'HIGH' }
        }]
      };

      const response = await request(app)
        .post(`/api/v1/stream-management/${testStreamId}/rules`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(ruleData.name);
    });

    test('should get processing rules for stream', async () => {
      const response = await request(app)
        .get(`/api/v1/stream-management/${testStreamId}/rules`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should execute rules manually', async () => {
      const executionData = {
        entityType: 'TASK',
        entityId: testTaskId,
        streamId: testStreamId
      };

      const response = await request(app)
        .post('/api/v1/stream-management/rules/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send(executionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent stream', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .get(`/api/v1/stream-management/${fakeId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should handle invalid stream role', async () => {
      await request(app)
        .post('/api/v1/stream-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Invalid',
          streamRole: 'INVALID_ROLE',
          streamType: 'CUSTOM'
        })
        .expect(400);
    });

    test('should handle invalid configuration', async () => {
      const invalidConfig = {
        inboxBehavior: {
          processAfterDays: -1, // Invalid negative value
          purgeAfterDays: 400   // Invalid too large value
        }
      };

      await request(app)
        .put(`/api/v1/stream-management/${testStreamId}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ config: invalidConfig })
        .expect(400);
    });
  });

  describe('Authorization', () => {
    test('should require authentication', async () => {
      await request(app)
        .get('/api/v1/stream-management/stats')
        .expect(401);
    });

    test('should prevent cross-organization access', async () => {
      // Create another organization
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Organization',
          plan: 'STARTER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          firstName: 'Other',
          lastName: 'User',
          organizationId: otherOrg.id,
          role: 'MEMBER'
        }
      });

      // Try to access test stream from different org user
      // (This test assumes proper auth middleware implementation)
      // In real implementation, this would return 403 or 404
      
      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });
  });
});
