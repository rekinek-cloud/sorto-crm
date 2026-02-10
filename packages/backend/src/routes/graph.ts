import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../shared/middleware/auth';
import { z } from 'zod';
import logger from '../config/logger';

const router = Router();

const RelationshipQuerySchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['project', 'task', 'contact', 'company', 'deal', 'stream']),
  depth: z.coerce.number().min(1).max(5).default(2)
});

router.get('/relationships', authenticateToken, async (req, res) => {
  console.log('🕸️ Graph API called - START');
  
  try {
    console.log('🕸️ Query validation...');
    const query = RelationshipQuerySchema.parse(req.query);
    console.log('🕸️ Query parsed:', query);
    
    const { entityId, entityType, depth } = query;
    const organizationId = req.user?.organizationId;
    
    console.log('🕸️ User data:', { userId: req.user?.id, organizationId });

    if (!organizationId) {
      console.log('🕸️ No organization found');
      return res.status(403).json({ success: false, error: 'No organization found' });
    }
    
    console.log('🕸️ Starting to fetch entities...');

    const nodes: any[] = [];
    const links: any[] = [];
    const visitedNodes = new Set<string>();

    async function fetchRelatedEntities(
      currentId: string,
      currentType: string,
      currentDepth: number,
      parentId?: string
    ) {
      const nodeId = `${currentType}-${currentId}`;
      
      if (visitedNodes.has(nodeId) || currentDepth > depth) {
        return;
      }
      
      visitedNodes.add(nodeId);

      // Fetch main entity details
      let entityData: any = null;
      
      switch (currentType) {
        case 'project':
          entityData = await prisma.project.findFirst({
            where: { id: currentId, organizationId },
            include: {
              tasks: { select: { id: true, title: true, status: true } },
              stream: { select: { id: true, name: true } }
            }
          });
          break;
        
        case 'task':
          entityData = await prisma.task.findFirst({
            where: { id: currentId, organizationId },
            include: {
              project: { select: { id: true, name: true, status: true } },
              assignedTo: { select: { id: true, firstName: true, lastName: true } }
            }
          });
          break;
        
        case 'contact':
          entityData = await prisma.contact.findFirst({
            where: { id: currentId, organizationId },
            include: {
              assignedCompany: { select: { id: true, name: true } }
            }
          });
          break;
        
        case 'company':
          entityData = await prisma.company.findFirst({
            where: { id: currentId, organizationId },
            include: {
              assignedContacts: { select: { id: true, firstName: true, lastName: true } },
              deals: { select: { id: true, title: true, value: true, stage: true } }
            }
          });
          break;
        
        case 'deal':
          entityData = await prisma.deal.findFirst({
            where: { id: currentId, organizationId },
            include: {
              company: { select: { id: true, name: true } }
            }
          });
          break;
        
        case 'stream':
          entityData = await prisma.stream.findFirst({
            where: { id: currentId, organizationId },
            include: {
              projects: { select: { id: true, name: true, status: true } },
              tasks: { select: { id: true, title: true, status: true } }
            }
          });
          break;
      }

      if (!entityData) return;

      // Add node
      nodes.push({
        id: nodeId,
        name: entityData.name || entityData.title || `${entityData.firstName} ${entityData.lastName}` || 'Unknown',
        type: currentType,
        originalId: currentId,
        metadata: {
          status: entityData.status,
          createdAt: entityData.createdAt,
          updatedAt: entityData.updatedAt
        }
      });

      // Add link to parent if exists
      if (parentId) {
        links.push({
          source: parentId,
          target: nodeId,
          type: 'related',
          strength: 1
        });
      }

      // Process related entities (simplified)
      if (currentDepth < depth) {
        const nextDepth = currentDepth + 1;

        // Project relations
        if (currentType === 'project' && entityData) {
          // Tasks
          for (const task of entityData.tasks || []) {
            await fetchRelatedEntities(task.id, 'task', nextDepth, nodeId);
          }
        }

        // Task relations
        if (currentType === 'task' && entityData) {
          // Project
          if (entityData.project) {
            await fetchRelatedEntities(entityData.project.id, 'project', nextDepth, nodeId);
          }
          
          // Assigned user
          if (entityData.assignedTo) {
            const userNodeId = `contact-${entityData.assignedTo.id}`;
            if (!visitedNodes.has(userNodeId)) {
              nodes.push({
                id: userNodeId,
                name: `${entityData.assignedTo.firstName} ${entityData.assignedTo.lastName}`,
                type: 'contact',
                originalId: entityData.assignedTo.id,
                metadata: { role: 'assignee' }
              });
              links.push({
                source: nodeId,
                target: userNodeId,
                type: 'assigned_to',
                strength: 2
              });
            }
          }
        }

        // Contact relations
        if (currentType === 'contact' && entityData) {
          // Company
          if (entityData.assignedCompany) {
            await fetchRelatedEntities(entityData.assignedCompany.id, 'company', nextDepth, nodeId);
          }
        }

        // Company relations
        if (currentType === 'company' && entityData) {
          // Assigned Contacts
          for (const contact of entityData.assignedContacts || []) {
            await fetchRelatedEntities(contact.id, 'contact', nextDepth, nodeId);
          }
          
          // Deals
          for (const deal of entityData.deals || []) {
            await fetchRelatedEntities(deal.id, 'deal', nextDepth, nodeId);
          }
        }

        // Deal relations
        if (currentType === 'deal' && entityData) {
          // Company
          if (entityData.company) {
            await fetchRelatedEntities(entityData.company.id, 'company', nextDepth, nodeId);
          }
        }

        // Stream relations
        if (currentType === 'stream' && entityData) {
          // Projects
          for (const project of entityData.projects || []) {
            await fetchRelatedEntities(project.id, 'project', nextDepth, nodeId);
          }
          
          // Tasks  
          for (const task of entityData.tasks || []) {
            await fetchRelatedEntities(task.id, 'task', nextDepth, nodeId);
          }
        }
      }
    }

    // Start fetching from root entity
    await fetchRelatedEntities(entityId, entityType, 0);

    res.json({
      success: true,
      data: {
        nodes,
        links
      }
    });

  } catch (error) {
    logger.error('❌ Graph API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch relationship data'
    });
  }
});

// Debug endpoint without auth
router.get('/debug', async (req, res) => {
  console.log('🕸️ Graph DEBUG called');
  res.json({ 
    success: true, 
    message: 'Graph debug endpoint working',
    timestamp: new Date().toISOString()
  });
});

export default router;