import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser, AuthenticatedRequest } from '../shared/middleware/auth';
import { z } from 'zod';
import { vectorService, syncCompanies } from './vectorSearch';

const router = Router();

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  status: z.enum(['PROSPECT', 'CUSTOMER', 'PARTNER', 'INACTIVE', 'ARCHIVED']).default('PROSPECT'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tags: z.array(z.string()).optional()
});

const updateCompanySchema = createCompanySchema.partial();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/companies - List companies with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      status,
      industry,
      size,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      organizationId: req.user.organizationId
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (industry) where.industry = industry;
    if (size) where.size = size;

    // Get companies with counts
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          primaryContact: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          assignedContacts: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          deals: {
            select: { id: true, value: true, stage: true }
          },
          _count: {
            select: {
              deals: true,
              assignedContacts: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      companies: companies.map(company => ({
        ...company,
        contacts: company.assignedContacts,
        contactsCount: company._count.assignedContacts,
        dealsCount: company._count.deals,
        totalDealsValue: company.deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        activeDealsCount: company.deals.filter(deal => deal.stage === 'PROSPECT').length
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id - Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        assignedContacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            position: true
          }
        },
        deals: {
          include: {
            owner: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST /api/companies - Create new company
router.post('/', async (req, res) => {
  try {
    const validatedData = createCompanySchema.parse(req.body);

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        organizationId: req.user.organizationId
      },
      include: {
        assignedContacts: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        _count: {
          select: {
            deals: true,
            assignedContacts: true
          }
        }
      }
    });

    res.status(201).json({
      ...company,
      contacts: company.assignedContacts,
      contactsCount: company._count.assignedContacts,
      dealsCount: company._count.deals
    });

      // Auto-index to RAG
      syncCompanies(req.user!.organizationId, company.id).catch(err =>
        console.error('RAG index failed for company:', err.message)
      );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT /api/companies/:id - Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCompanySchema.parse(req.body);

    // Check if company exists and belongs to user's tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        assignedContacts: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        _count: {
          select: {
            deals: true,
            assignedContacts: true
          }
        }
      }
    });

    res.json({
      ...company,
      contacts: company.assignedContacts,
      contactsCount: company._count.assignedContacts,
      dealsCount: company._count.deals
    });

      // Auto-index to RAG
      syncCompanies(req.user!.organizationId, company.id, true).catch(err =>
        console.error('RAG reindex failed for company:', err.message)
      );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists and belongs to user's tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await prisma.company.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// POST /api/companies/:id/merge - Merge two companies
const mergeSchema = z.object({
  sourceCompanyId: z.string().uuid('Source company ID must be a valid UUID'),
  keepFields: z.array(z.enum(['name', 'description', 'website', 'industry', 'size', 'address', 'phone', 'email', 'tags'])).optional()
});

router.post('/:id/merge', async (req, res) => {
  try {
    const { id: targetCompanyId } = req.params;
    const { sourceCompanyId, keepFields = [] } = mergeSchema.parse(req.body);

    if (targetCompanyId === sourceCompanyId) {
      return res.status(400).json({ error: 'Cannot merge company with itself' });
    }

    // Get both companies
    const [targetCompany, sourceCompany] = await Promise.all([
      prisma.company.findFirst({
        where: { id: targetCompanyId, organizationId: req.user.organizationId },
        include: { assignedContacts: true, deals: true }
      }),
      prisma.company.findFirst({
        where: { id: sourceCompanyId, organizationId: req.user.organizationId },
        include: { assignedContacts: true, deals: true }
      })
    ]);

    if (!targetCompany) {
      return res.status(404).json({ error: 'Target company not found' });
    }

    if (!sourceCompany) {
      return res.status(404).json({ error: 'Source company not found' });
    }

    // Prepare merged data - keep target values unless specified in keepFields
    const mergedData: any = {};
    const fieldsToMerge = ['name', 'description', 'website', 'industry', 'size', 'address', 'phone', 'email'] as const;

    for (const field of fieldsToMerge) {
      if (keepFields.includes(field)) {
        mergedData[field] = sourceCompany[field] || targetCompany[field];
      } else if (!targetCompany[field] && sourceCompany[field]) {
        // Fill empty fields from source
        mergedData[field] = sourceCompany[field];
      }
    }

    // Merge tags
    const targetTags = (targetCompany.tags as string[]) || [];
    const sourceTags = (sourceCompany.tags as string[]) || [];
    const mergedTags = [...new Set([...targetTags, ...sourceTags])];
    if (mergedTags.length > 0) {
      mergedData.tags = mergedTags;
    }

    // Perform merge in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Move contacts from source to target
      if (sourceCompany.assignedContacts.length > 0) {
        await tx.contact.updateMany({
          where: { companyId: sourceCompanyId },
          data: { companyId: targetCompanyId }
        });
      }

      // Move deals from source to target
      if (sourceCompany.deals.length > 0) {
        await tx.deal.updateMany({
          where: { companyId: sourceCompanyId },
          data: { companyId: targetCompanyId }
        });
      }

      // Update target company with merged data
      const updatedCompany = await tx.company.update({
        where: { id: targetCompanyId },
        data: {
          ...mergedData,
          updatedAt: new Date()
        },
        include: {
          assignedContacts: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          deals: {
            select: { id: true, title: true, value: true, stage: true }
          },
          _count: {
            select: { deals: true, assignedContacts: true }
          }
        }
      });

      // Delete source company
      await tx.company.delete({
        where: { id: sourceCompanyId }
      });

      return updatedCompany;
    });

    res.json({
      ...result,
      contacts: result.assignedContacts,
      contactsCount: result._count.assignedContacts,
      dealsCount: result._count.deals,
      mergedFrom: {
        id: sourceCompanyId,
        name: sourceCompany.name,
        contactsMoved: sourceCompany.assignedContacts.length,
        dealsMoved: sourceCompany.deals.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error merging companies:', error);
    res.status(500).json({ error: 'Failed to merge companies' });
  }
});

export default router;