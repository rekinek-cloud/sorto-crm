import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    category: 'welcome',
    subject: 'Welcome to CRM-GTD, {{firstName}}!',
    htmlTemplate: '<html><body><h1>Welcome {{firstName}}!</h1><p>Welcome to CRM-GTD! We are excited to have you.</p><p><a href="{{dashboardUrl}}">Get Started</a></p></body></html>',
    textTemplate: 'Welcome {{firstName}}! Welcome to CRM-GTD. Get started: {{dashboardUrl}}',
    variables: ['firstName', 'dashboardUrl'],
    tags: ['onboarding', 'user']
  },
  {
    name: 'Task Assignment Notification',
    description: 'Notification when a task is assigned to a user',
    category: 'notification', 
    subject: 'New Task Assigned: {{taskTitle}}',
    htmlTemplate: '<html><body><h1>New Task Assigned</h1><p>Hello {{assigneeName}}, you have been assigned: {{taskTitle}}</p><p>Priority: {{priority}}</p><p>Due: {{dueDate}}</p><p><a href="{{taskUrl}}">View Task</a></p></body></html>',
    textTemplate: 'New Task: {{taskTitle}} assigned to {{assigneeName}}. Priority: {{priority}}, Due: {{dueDate}}. View: {{taskUrl}}',
    variables: ['assigneeName', 'assignerName', 'taskTitle', 'taskDescription', 'priority', 'dueDate', 'projectName', 'taskUrl'],
    tags: ['task', 'assignment', 'notification']
  },
  {
    name: 'Project Deadline Reminder',
    description: 'Reminder for upcoming project deadlines',
    category: 'reminder',
    subject: 'Project Deadline Reminder: {{projectName}}',
    htmlTemplate: '<html><body><h1>Project Deadline Reminder</h1><p>{{projectName}} is due in {{daysUntilDue}} days!</p><p>Progress: {{progressPercentage}}%</p><p><a href="{{projectUrl}}">View Project</a></p></body></html>',
    textTemplate: 'Project {{projectName}} due in {{daysUntilDue}} days. Progress: {{progressPercentage}}%. View: {{projectUrl}}',
    variables: ['teamMemberName', 'projectName', 'daysUntilDue', 'deadline', 'progressPercentage', 'projectUrl'],
    tags: ['project', 'deadline', 'reminder']
  },
  {
    name: 'Deal Won Celebration',
    description: 'Celebration email when a deal is won',
    category: 'celebration',
    subject: 'Congratulations! Deal Won: {{dealTitle}}',
    htmlTemplate: '<html><body><h1>Deal Won!</h1><p>Congratulations {{salesPersonName}}! You closed {{dealTitle}} with {{companyName}} for ${{dealValue}}!</p><p><a href="{{dealUrl}}">View Deal</a></p></body></html>',
    textTemplate: 'Deal Won! Congratulations {{salesPersonName}}! {{dealTitle}} with {{companyName}} for ${{dealValue}}.',
    variables: ['salesPersonName', 'companyName', 'dealTitle', 'dealValue', 'probability', 'closeDate', 'daysToClose'],
    tags: ['deal', 'celebration', 'sales']
  }
];

async function seedEmailTemplates() {
  try {
    console.log('🌱 Seeding email templates...');

    // Get first organization for templates
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.error('❌ No organization found. Please seed organizations first.');
      return;
    }

    // Get first user as template creator
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No user found. Please seed users first.');
      return;
    }

    // Clear existing templates
    await prisma.emailTemplate.deleteMany({});
    console.log('🗑️  Cleared existing email templates');

    // Create new templates
    for (const template of emailTemplates) {
      await prisma.emailTemplate.create({
        data: {
          ...template,
          organizationId: organization.id,
          createdById: user.id,
        },
      });
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('🎉 Email templates seeded successfully!');
    console.log(`📧 Created ${emailTemplates.length} email templates`);

  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  }
}

if (require.main === module) {
  seedEmailTemplates()
    .catch((error) => {
      console.error('Failed to seed email templates:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedEmailTemplates };