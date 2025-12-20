import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSmartMailboxes() {
  console.log('🌱 Seeding Smart Mailboxes...')

  // Get first organization
  const organization = await prisma.organization.findFirst()
  if (!organization) {
    console.error('❌ No organization found. Please seed organizations first.')
    return
  }

  // Built-in mailboxes data
  const builtInMailboxes = [
    {
      name: 'Action Required',
      icon: '🔥',
      color: 'red',
      description: 'Messages requiring immediate action',
      displayOrder: 1,
      rules: [
        { field: 'urgencyScore', operator: 'greater_than', value: '70' },
        { field: 'actionNeeded', operator: 'equals', value: 'true', logicOperator: 'OR' }
      ]
    },
    {
      name: 'Today',
      icon: '📅',
      color: 'blue',
      description: 'Messages received today',
      displayOrder: 2,
      rules: [
        { field: 'receivedAt', operator: 'equals', value: 'today' }
      ]
    },
    {
      name: 'VIP Contacts',
      icon: '👥',
      color: 'yellow',
      description: 'Messages from important contacts',
      displayOrder: 3,
      rules: [
        { field: 'contact.isVIP', operator: 'equals', value: 'true' }
      ]
    },
    {
      name: 'With Attachments',
      icon: '📎',
      color: 'gray',
      description: 'Messages containing attachments',
      displayOrder: 4,
      rules: [
        { field: 'attachments', operator: 'not_empty', value: 'true' }
      ]
    },
    {
      name: 'AI Analyzed',
      icon: '🤖',
      color: 'purple',
      description: 'Messages processed by AI',
      displayOrder: 5,
      rules: [
        { field: 'autoProcessed', operator: 'equals', value: 'true' },
        { field: 'urgencyScore', operator: 'not_null', value: 'true', logicOperator: 'AND' }
      ]
    },
    {
      name: 'Waiting For',
      icon: '⏰',
      color: 'orange',
      description: 'Messages pending response or action',
      displayOrder: 6,
      rules: [
        { field: 'needsResponse', operator: 'equals', value: 'true' }
      ]
    },
    {
      name: 'High Priority',
      icon: '🎯',
      color: 'red',
      description: 'High priority messages',
      displayOrder: 7,
      rules: [
        { field: 'priority', operator: 'equals', value: 'HIGH' }
      ]
    }
  ]

  // Create built-in mailboxes
  for (const mailboxData of builtInMailboxes) {
    const { rules, ...mailboxInfo } = mailboxData

    // Check if mailbox already exists
    const existing = await prisma.smartMailbox.findUnique({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: mailboxInfo.name
        }
      }
    })

    if (existing) {
      console.log(`✅ Smart Mailbox "${mailboxInfo.name}" already exists`)
      continue
    }

    // Create mailbox with rules
    const mailbox = await prisma.smartMailbox.create({
      data: {
        ...mailboxInfo,
        isBuiltIn: true,
        isActive: true,
        organizationId: organization.id,
        rules: {
          create: rules.map((rule, index) => ({
            ...rule,
            ruleOrder: index
          }))
        }
      },
      include: {
        rules: true
      }
    })

    console.log(`✅ Created Smart Mailbox: ${mailbox.name} with ${mailbox.rules.length} rules`)
  }

  console.log('✨ Smart Mailboxes seeding completed!')
}

// Run the seed
seedSmartMailboxes()
  .catch((e) => {
    console.error('❌ Error seeding smart mailboxes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })