import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../config/database'
import { authenticateToken } from '../shared/middleware/auth'
import { Prisma } from '@prisma/client'

const router = Router()

// Middleware
router.use(authenticateToken)

// GET /api/smart-mailboxes - Get all smart mailboxes with counts
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    // Get all mailboxes (built-in + user's custom)
    const mailboxes = await prisma.smart_mailboxes.findMany({
      where: {
        organizationId,
        AND: [
          {
            OR: [
              { isBuiltIn: true },
              { userId }
            ]
          }
        ]
      },
      include: {
        smart_mailbox_rules: true
      },
      orderBy: [
        { isBuiltIn: 'desc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get message counts for each mailbox
    const mailboxesWithCounts = await Promise.all(
      mailboxes.map(async (mailbox) => {
        const count = await getMailboxMessageCount(mailbox, organizationId)
        return {
          ...mailbox,
          count
        }
      })
    )

    res.json(mailboxesWithCounts)
  } catch (error) {
    console.error('Error fetching smart mailboxes:', error)
    res.status(500).json({ error: 'Failed to fetch smart mailboxes' })
  }
})

// GET /api/smart-mailboxes/:id/messages - Get messages in a mailbox
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    const organizationId = req.user!.organizationId
    
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Get mailbox with rules
    const mailbox = await prisma.smart_mailboxes.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        smart_mailbox_rules: true
      }
    })

    if (!mailbox) {
      return res.status(404).json({ error: 'Smart mailbox not found' })
    }

    // Build where clause from rules
    const whereClause = buildWhereClauseFromRules(mailbox.smart_mailbox_rules, organizationId)

    // Get messages
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          contact: true,
          company: true,
          attachments: true,
          channel: true,
          processingResults: {
            include: {
              rule: true
            }
          },
          task: true
        },
        orderBy: [
          { sentAt: { sort: 'desc', nulls: 'last' } },
          { receivedAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.message.count({ where: whereClause })
    ])

    res.json({
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error fetching mailbox messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/smart-mailboxes - Create custom mailbox
router.post('/', async (req, res) => {
  try {
    const userId = req.user!.id
    const organizationId = req.user!.organizationId
    const { name, icon, color, description, rules } = req.body

    // Validate
    if (!name || !rules || !Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ 
        error: 'Name and at least one rule are required' 
      })
    }

    // Create mailbox with rules
    const now = new Date()
    const mailbox = await prisma.smart_mailboxes.create({
      data: {
        id: uuidv4(),
        name,
        icon: icon || 'envelope',
        color: color || 'blue',
        description,
        isBuiltIn: false,
        userId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        smart_mailbox_rules: {
          create: rules.map((rule: any, index: number) => ({
            id: uuidv4(),
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
            logicOperator: rule.logicOperator || 'AND',
            ruleOrder: index
          }))
        }
      },
      include: {
        smart_mailbox_rules: true
      }
    })

    // Get count
    const count = await getMailboxMessageCount(mailbox, organizationId)

    res.status(201).json({ ...mailbox, count })
  } catch (error) {
    console.error('Error creating smart mailbox:', error)
    res.status(500).json({ error: 'Failed to create smart mailbox' })
  }
})

// PUT /api/smart-mailboxes/:id - Update custom mailbox
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const organizationId = req.user!.organizationId
    const { name, icon, color, description, rules } = req.body

    // Check ownership
    const existing = await prisma.smart_mailboxes.findFirst({
      where: {
        id,
        userId,
        organizationId,
        isBuiltIn: false
      }
    })

    if (!existing) {
      return res.status(404).json({ 
        error: 'Smart mailbox not found or cannot be edited' 
      })
    }

    // Update mailbox and rules
    const mailbox = await prisma.$transaction(async (tx) => {
      // Delete existing rules
      await tx.smart_mailbox_rules.deleteMany({
        where: { mailboxId: id }
      })

      // Update mailbox with new rules
      return tx.smart_mailboxes.update({
        where: { id },
        data: {
          name,
          icon,
          color,
          description,
          smart_mailbox_rules: {
            create: rules.map((rule: any, index: number) => ({
              id: uuidv4(),
              field: rule.field,
              operator: rule.operator,
              value: rule.value,
              logicOperator: rule.logicOperator || 'AND',
              ruleOrder: index
            }))
          }
        },
        include: {
          smart_mailbox_rules: true
        }
      })
    })

    // Get count
    const count = await getMailboxMessageCount(mailbox, organizationId)

    res.json({ ...mailbox, count })
  } catch (error) {
    console.error('Error updating smart mailbox:', error)
    res.status(500).json({ error: 'Failed to update smart mailbox' })
  }
})

// DELETE /api/smart-mailboxes/:id - Delete custom mailbox
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const organizationId = req.user!.organizationId

    // Check ownership and ensure not built-in
    const existing = await prisma.smart_mailboxes.findFirst({
      where: {
        id,
        userId,
        organizationId,
        isBuiltIn: false
      }
    })

    if (!existing) {
      return res.status(404).json({ 
        error: 'Smart mailbox not found or cannot be deleted' 
      })
    }

    // Delete mailbox (rules cascade)
    await prisma.smart_mailboxes.delete({
      where: { id }
    })

    res.json({ success: true, message: 'Smart mailbox deleted' })
  } catch (error) {
    console.error('Error deleting smart mailbox:', error)
    res.status(500).json({ error: 'Failed to delete smart mailbox' })
  }
})

// Helper: Build Prisma where clause from rules
function buildWhereClauseFromRules(
  rules: any[],
  organizationId: string
): Prisma.MessageWhereInput {
  const conditions: any[] = []

  for (const rule of rules) {
    const condition = buildConditionFromRule(rule)
    if (condition) {
      conditions.push(condition)
    }
  }

  // Group by logic operator
  const andConditions = []
  const orConditions = []

  for (let i = 0; i < conditions.length; i++) {
    if (i === 0 || rules[i].logicOperator === 'AND') {
      andConditions.push(conditions[i])
    } else {
      orConditions.push(conditions[i])
    }
  }

  const whereClause: Prisma.MessageWhereInput = {
    organizationId,
    isArchived: false
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions
  }

  if (orConditions.length > 0) {
    whereClause.OR = orConditions
  }

  return whereClause
}

// Helper: Build condition from rule
function buildConditionFromRule(rule: any): any {
  const { field, operator, value } = rule

  switch (field) {
    case 'urgencyScore':
      if (operator === 'greater_than') {
        return { urgencyScore: { gt: parseFloat(value) } }
      } else if (operator === 'less_than') {
        return { urgencyScore: { lt: parseFloat(value) } }
      } else if (operator === 'equals') {
        return { urgencyScore: parseFloat(value) }
      } else if (operator === 'between') {
        const [min, max] = value.split(',').map((v: string) => parseFloat(v.trim()))
        return { 
          urgencyScore: { 
            gte: min || 0, 
            lte: max || 100 
          } 
        }
      } else if (operator === 'not_equals') {
        return { urgencyScore: { not: parseFloat(value) } }
      }
      break

    case 'actionNeeded':
    case 'autoProcessed':
    case 'needsResponse':
      if (operator === 'equals') {
        return { [field]: value === 'true' }
      } else if (operator === 'not_equals') {
        return { [field]: { not: value === 'true' } }
      }
      break

    case 'priority':
      if (operator === 'equals') {
        return { priority: value }
      } else if (operator === 'not_equals') {
        return { priority: { not: value } }
      } else if (operator === 'in') {
        const values = value.split(',').map((v: string) => v.trim())
        return { priority: { in: values } }
      } else if (operator === 'not_in') {
        const values = value.split(',').map((v: string) => v.trim())
        return { priority: { notIn: values } }
      }
      break

    case 'receivedAt':
      if (operator === 'equals' && value === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return {
          receivedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      } else if (operator === 'equals' && value === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const today = new Date(yesterday)
        today.setDate(today.getDate() + 1)
        return {
          receivedAt: {
            gte: yesterday,
            lt: today
          }
        }
      } else if (operator === 'equals' && value === 'this_week') {
        const today = new Date()
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        return {
          receivedAt: {
            gte: startOfWeek,
            lt: endOfWeek
          }
        }
      } else if (operator === 'equals' && value === 'this_month') {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        return {
          receivedAt: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      } else if (operator === 'greater_than') {
        return { receivedAt: { gt: new Date(value) } }
      } else if (operator === 'less_than') {
        return { receivedAt: { lt: new Date(value) } }
      } else if (operator === 'between') {
        const [start, end] = value.split(',').map((v: string) => new Date(v.trim()))
        return {
          receivedAt: {
            gte: start,
            lte: end
          }
        }
      } else if (operator === 'in_last_days') {
        const days = parseInt(value)
        const date = new Date()
        date.setDate(date.getDate() - days)
        return {
          receivedAt: {
            gte: date
          }
        }
      }
      break

    case 'attachments':
      if (operator === 'not_empty') {
        return {
          attachments: {
            some: {}
          }
        }
      } else if (operator === 'empty') {
        return {
          attachments: {
            none: {}
          }
        }
      } else if (operator === 'count_greater_than') {
        // Note: This would require a custom query or aggregate in real implementation
        // For now, return basic filter
        return {
          attachments: {
            some: {}
          }
        }
      }
      break

    case 'contact.isVIP':
      if (operator === 'equals') {
        return value === 'true' ? {
          contact: {
            tags: {
              has: 'VIP'
            }
          }
        } : {
          contact: {
            tags: {
              hasEvery: []  // Contact exists but no VIP tag
            }
          }
        }
      } else if (operator === 'not_equals') {
        return value === 'true' ? {
          contact: {
            tags: {
              hasEvery: []  // Not VIP
            }
          }
        } : {
          contact: {
            tags: {
              has: 'VIP'
            }
          }
        }
      }
      break

    case 'subject':
      if (operator === 'contains') {
        return { subject: { contains: value, mode: 'insensitive' } }
      } else if (operator === 'not_contains') {
        return { subject: { not: { contains: value, mode: 'insensitive' } } }
      } else if (operator === 'starts_with') {
        return { subject: { startsWith: value, mode: 'insensitive' } }
      } else if (operator === 'ends_with') {
        return { subject: { endsWith: value, mode: 'insensitive' } }
      } else if (operator === 'equals') {
        return { subject: { equals: value, mode: 'insensitive' } }
      } else if (operator === 'regex') {
        // Note: PostgreSQL regex support would require raw SQL
        // For now, fallback to contains
        return { subject: { contains: value, mode: 'insensitive' } }
      } else if (operator === 'is_empty') {
        return { OR: [{ subject: null }, { subject: '' }] }
      } else if (operator === 'is_not_empty') {
        return { AND: [{ subject: { not: null } }, { subject: { not: '' } }] }
      }
      break

    case 'content':
      if (operator === 'contains') {
        return { content: { contains: value, mode: 'insensitive' } }
      } else if (operator === 'not_contains') {
        return { content: { not: { contains: value, mode: 'insensitive' } } }
      } else if (operator === 'regex') {
        // Note: PostgreSQL regex support would require raw SQL
        // For now, fallback to contains
        return { content: { contains: value, mode: 'insensitive' } }
      } else if (operator === 'word_count_greater_than') {
        // Note: Word count would require custom function or computed field
        // For now, assume longer content has more words
        const estimatedChars = parseInt(value) * 5 // ~5 chars per word average
        return { content: { not: null } } // Basic filter
      } else if (operator === 'is_empty') {
        return { OR: [{ content: null }, { content: '' }] }
      }
      break

    case 'fromAddress':
      if (operator === 'equals') {
        return { fromAddress: value }
      } else if (operator === 'not_equals') {
        return { fromAddress: { not: value } }
      } else if (operator === 'contains') {
        return { fromAddress: { contains: value, mode: 'insensitive' } }
      } else if (operator === 'not_contains') {
        return { fromAddress: { not: { contains: value, mode: 'insensitive' } } }
      } else if (operator === 'ends_with') {
        return { fromAddress: { endsWith: value, mode: 'insensitive' } }
      } else if (operator === 'in') {
        const addresses = value.split(',').map((v: string) => v.trim())
        return { fromAddress: { in: addresses } }
      } else if (operator === 'regex') {
        // Note: PostgreSQL regex support would require raw SQL
        // For now, fallback to contains
        return { fromAddress: { contains: value, mode: 'insensitive' } }
      }
      break
  }

  return null
}

// Helper: Get message count for mailbox
async function getMailboxMessageCount(
  mailbox: any,
  organizationId: string
): Promise<number> {
  const whereClause = buildWhereClauseFromRules(mailbox.smart_mailbox_rules || [], organizationId)
  return prisma.message.count({ where: whereClause })
}

export default router