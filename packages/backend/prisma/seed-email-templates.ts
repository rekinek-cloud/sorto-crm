import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    category: 'welcome',
    subject: 'Welcome to CRM-GTD, {{firstName}}!',
    htmlTemplate: \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to CRM-GTD</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
          .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CRM-GTD!</h1>
          </div>
          <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>Welcome to your new productivity powerhouse! We're thrilled to have you on board.</p>
            <p>CRM-GTD combines the best of customer relationship management with David Allen's Getting Things Done methodology to help you stay organized and productive.</p>
            
            <h3>Get Started:</h3>
            <ul>
              <li>Set up your first project</li>
              <li>Configure your email integration</li>
              <li>Create your first GTD inbox item</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" class="button">Start Using CRM-GTD</a>
            </p>
            
            <p>If you have any questions, our support team is here to help!</p>
            
            <p>Best regards,<br>The CRM-GTD Team</p>
          </div>
          <div class="footer">
            <p>© 2025 CRM-GTD. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    \`,
    textTemplate: \`
      Welcome to CRM-GTD, {{firstName}}!
      
      We're thrilled to have you on board. CRM-GTD combines customer relationship management with Getting Things Done methodology.
      
      Get Started:
      - Set up your first project
      - Configure your email integration  
      - Create your first GTD inbox item
      
      Visit your dashboard: {{dashboardUrl}}
      
      Best regards,
      The CRM-GTD Team
    \`,
    variables: ['firstName', 'dashboardUrl'],
    tags: ['onboarding', 'user']
  },
  {
    name: 'Task Assignment Notification',
    description: 'Notification when a task is assigned to a user',
    category: 'notification',
    subject: 'New Task Assigned: {{taskTitle}}',
    htmlTemplate: \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Task Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .task-card { background: #f8f9fa; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .priority-high { border-left-color: #dc2626; }
          .priority-medium { border-left-color: #f59e0b; }
          .priority-low { border-left-color: #10b981; }
          .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hello {{assigneeName}},</p>
            <p>You have been assigned a new task by {{assignerName}}.</p>
            
            <div class="task-card priority-{{priority}}">
              <h3>{{taskTitle}}</h3>
              <p><strong>Description:</strong> {{taskDescription}}</p>
              <p><strong>Priority:</strong> {{priority}}</p>
              <p><strong>Due Date:</strong> {{dueDate}}</p>
              <p><strong>Project:</strong> {{projectName}}</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{taskUrl}}" class="button">View Task</a>
            </p>
            
            <p>Good luck with your task!</p>
          </div>
        </div>
      </body>
      </html>
    \`,
    textTemplate: \`
      New Task Assigned: {{taskTitle}}
      
      Hello {{assigneeName}},
      
      You have been assigned a new task by {{assignerName}}.
      
      Task Details:
      - Title: {{taskTitle}}
      - Description: {{taskDescription}}
      - Priority: {{priority}}
      - Due Date: {{dueDate}}
      - Project: {{projectName}}
      
      View task: {{taskUrl}}
    \`,
    variables: ['assigneeName', 'assignerName', 'taskTitle', 'taskDescription', 'priority', 'dueDate', 'projectName', 'taskUrl'],
    tags: ['task', 'assignment', 'notification']
  },
  {
    name: 'Project Deadline Reminder',
    description: 'Reminder for upcoming project deadlines',
    category: 'reminder',
    subject: '⏰ Project Deadline Reminder: {{projectName}}',
    htmlTemplate: \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Project Deadline Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
          .progress-fill { background: #10b981; height: 100%; transition: width 0.3s ease; }
          .button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Project Deadline Reminder</h1>
          </div>
          <div class="content">
            <p>Hello {{teamMemberName}},</p>
            
            <div class="warning">
              <h3>{{projectName}} is due in {{daysUntilDue}} days!</h3>
              <p><strong>Deadline:</strong> {{deadline}}</p>
            </div>
            
            <h3>Project Progress</h3>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {{progressPercentage}}%"></div>
            </div>
            <p>{{progressPercentage}}% Complete</p>
            
            <h3>Remaining Tasks:</h3>
            <ul>
              {{#remainingTasks}}
              <li>{{title}} ({{priority}} priority)</li>
              {{/remainingTasks}}
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{projectUrl}}" class="button">View Project</a>
            </p>
            
            <p>Let's get this done! 💪</p>
          </div>
        </div>
      </body>
      </html>
    \`,
    textTemplate: \`
      Project Deadline Reminder: {{projectName}}
      
      Hello {{teamMemberName}},
      
      {{projectName}} is due in {{daysUntilDue}} days!
      Deadline: {{deadline}}
      
      Progress: {{progressPercentage}}% Complete
      
      Remaining Tasks:
      {{#remainingTasks}}
      - {{title}} ({{priority}} priority)
      {{/remainingTasks}}
      
      View project: {{projectUrl}}
      
      Let's get this done!
    \`,
    variables: ['teamMemberName', 'projectName', 'daysUntilDue', 'deadline', 'progressPercentage', 'remainingTasks', 'projectUrl'],
    tags: ['project', 'deadline', 'reminder']
  },
  {
    name: 'Deal Won Celebration',
    description: 'Celebration email when a deal is won',
    category: 'celebration',
    subject: '🎉 Congratulations! Deal Won: {{dealTitle}}',
    htmlTemplate: \`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Deal Won!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; }
          .celebration { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .big-number { font-size: 24px; font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 DEAL WON! 🎉</h1>
          </div>
          <div class="content">
            <div class="celebration">
              <h2>Congratulations {{salesPersonName}}!</h2>
              <p>You've successfully closed the deal with <strong>{{companyName}}</strong>!</p>
            </div>
            
            <h3>Deal Details:</h3>
            <ul>
              <li><strong>Deal:</strong> {{dealTitle}}</li>
              <li><strong>Company:</strong> {{companyName}}</li>
              <li><strong>Value:</strong> ${{dealValue}}</li>
              <li><strong>Probability:</strong> {{probability}}%</li>
              <li><strong>Close Date:</strong> {{closeDate}}</li>
            </ul>
            
            <div class="stats">
              <div class="stat">
                <div class="big-number">\\${{dealValue}}</div>
                <div>Deal Value</div>
              </div>
              <div class="stat">
                <div class="big-number">{{daysToClose}}</div>
                <div>Days to Close</div>
              </div>
              <div class="stat">
                <div class="big-number">{{probability}}%</div>
                <div>Final Probability</div>
              </div>
            </div>
            
            <p>🚀 This achievement brings us closer to our quarterly goals. Keep up the excellent work!</p>
            
            <p>Best regards,<br>The Sales Team</p>
          </div>
        </div>
      </body>
      </html>
    \`,
    textTemplate: \`
      🎉 DEAL WON! 🎉
      
      Congratulations {{salesPersonName}}!
      
      You've successfully closed the deal with {{companyName}}!
      
      Deal Details:
      - Deal: {{dealTitle}}
      - Company: {{companyName}}
      - Value: \\${{dealValue}}
      - Probability: {{probability}}%
      - Close Date: {{closeDate}}
      - Days to Close: {{daysToClose}}
      
      This achievement brings us closer to our quarterly goals. Keep up the excellent work!
      
      Best regards,
      The Sales Team
    \`,
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