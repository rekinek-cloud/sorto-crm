import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateUser } from '../shared/middleware/auth';
import { z } from 'zod';
import { vectorService, syncContacts } from './vectorSearch';

const router = Router();

// Validation schemas
const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal(''))
  }).optional()
});

const updateContactSchema = createContactSchema.partial();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// GET /api/contacts - List contacts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'firstName',
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
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { position: { contains: search as string, mode: 'insensitive' } }
      ];
    }


    // Get contacts
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          assignedCompany: {
            select: { id: true, name: true }
          },
          companies: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/contacts/:id - Get contact by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: {
        assignedCompany: {
          select: { id: true, name: true }
        },
        companies: {
          select: { id: true, name: true }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
  try {
    const validatedData = createContactSchema.parse(req.body);


    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        organizationId: req.user.organizationId
      },
      include: {
        assignedCompany: {
          select: { id: true, name: true }
        },
        companies: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(contact);

      // Auto-index to RAG
      syncContacts(req.user!.organizationId, contact.id).catch(err =>
        console.error('RAG index failed for contact:', err.message)
      );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateContactSchema.parse(req.body);

    // Check if contact exists and belongs to user's tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }


    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        assignedCompany: {
          select: { id: true, name: true }
        },
        companies: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(contact);

      // Auto-index to RAG
      syncContacts(req.user!.organizationId, contact.id, true).catch(err =>
        console.error('RAG reindex failed for contact:', err.message)
      );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if contact exists and belongs to user's tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;