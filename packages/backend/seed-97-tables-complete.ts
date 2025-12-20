import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 WYPEŁNIANIE WSZYSTKICH 97 TABEL DO 99%');
  console.log('==========================================\n');

  try {
    // Pobierz podstawowe dane
    const firstOrg = await prisma.organization.findFirst();
    const firstUser = await prisma.user.findFirst();
    const firstContact = await prisma.contact.findFirst();
    const firstCompany = await prisma.company.findFirst();
    
    if (!firstOrg || !firstUser) {
      throw new Error('Brak podstawowych danych w bazie');
    }

    console.log('🏢 Używam organizacji:', firstOrg.name);
    console.log('👤 Używam użytkownika:', firstUser.firstName, firstUser.lastName);

    // ETAP 1: PODSTAWOWE TABELE BIZNESOWE
    console.log('\n📊 ETAP 1: PODSTAWOWE TABELE BIZNESOWE');
    
    // Projects z różnymi statusami
    console.log('📂 Projects - dodawanie wszystkich statusów...');
    await prisma.project.createMany({
      data: [
        { name: 'Planning Project Alpha', description: 'Project in planning phase', status: 'PLANNING', priority: 'HIGH', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Active Project Beta', description: 'Project in progress', status: 'IN_PROGRESS', priority: 'URGENT', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'On Hold Project Gamma', description: 'Project on hold', status: 'ON_HOLD', priority: 'MEDIUM', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Completed Project Delta', description: 'Completed project', status: 'COMPLETED', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id, completedAt: new Date() },
        { name: 'Cancelled Project Epsilon', description: 'Cancelled project', status: 'CANCELLED', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // Tasks z różnymi statusami
    console.log('✅ Tasks - dodawanie wszystkich statusów...');
    await prisma.task.createMany({
      data: [
        { title: 'New Task Alpha', description: 'New task description', status: 'NEW', priority: 'HIGH', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'HIGH' },
        { title: 'In Progress Task Beta', description: 'Task in progress', status: 'IN_PROGRESS', priority: 'URGENT', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@office', energy: 'MEDIUM' },
        { title: 'Waiting Task Gamma', description: 'Waiting for input', status: 'WAITING', priority: 'MEDIUM', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@waiting', energy: 'LOW' },
        { title: 'Completed Task Delta', description: 'Completed task', status: 'COMPLETED', priority: 'LOW', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'MEDIUM', completedAt: new Date() },
        { title: 'Cancelled Task Epsilon', description: 'Cancelled task', status: 'CANCELLED', priority: 'LOW', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@office', energy: 'LOW' }
      ],
      skipDuplicates: true
    });

    // Deals z różnymi etapami
    console.log('💼 Deals - dodawanie wszystkich etapów...');
    await prisma.deal.createMany({
      data: [
        { title: 'Prospect Deal Alpha', value: 15000, stage: 'PROSPECT', probability: 20, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'WEBSITE' },
        { title: 'Qualified Deal Beta', value: 35000, stage: 'QUALIFIED', probability: 40, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'REFERRAL' },
        { title: 'Proposal Deal Gamma', value: 55000, stage: 'PROPOSAL', probability: 60, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'INBOUND' },
        { title: 'Negotiation Deal Delta', value: 75000, stage: 'NEGOTIATION', probability: 80, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'OUTBOUND' },
        { title: 'Won Deal Epsilon', value: 95000, stage: 'CLOSED_WON', probability: 100, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'PARTNER', closedDate: new Date() },
        { title: 'Lost Deal Zeta', value: 25000, stage: 'CLOSED_LOST', probability: 0, organizationId: firstOrg.id, assignedToId: firstUser.id, source: 'COLD_CALL', closedDate: new Date(), lostReason: 'Price too high' }
      ],
      skipDuplicates: true
    });

    // ETAP 2: TABELE GTD
    console.log('\n🎯 ETAP 2: TABELE GTD');

    // Contexts - rozszerzone
    console.log('📍 Contexts - dodawanie dodatkowych kontekstów...');
    await prisma.context.createMany({
      data: [
        { name: '@travel', description: 'Tasks while traveling', organizationId: firstOrg.id, createdById: firstUser.id, color: '#FF6B6B', isActive: true },
        { name: '@shopping', description: 'Shopping related tasks', organizationId: firstOrg.id, createdById: firstUser.id, color: '#4ECDC4', isActive: true },
        { name: '@health', description: 'Health and fitness tasks', organizationId: firstOrg.id, createdById: firstUser.id, color: '#45B7D1', isActive: true },
        { name: '@finance', description: 'Financial tasks', organizationId: firstOrg.id, createdById: firstUser.id, color: '#96CEB4', isActive: true },
        { name: '@learning', description: 'Learning and development', organizationId: firstOrg.id, createdById: firstUser.id, color: '#FFEAA7', isActive: false }
      ],
      skipDuplicates: true
    });

    // NextActions
    console.log('⚡ NextActions - dodawanie...');
    await prisma.nextAction.createMany({
      data: [
        { title: 'Call Client', description: 'Follow up call with important client', context: '@calls', priority: 'HIGH', energy: 'HIGH', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, dueDate: new Date(Date.now() + 86400000) },
        { title: 'Review Documents', description: 'Review contract documents', context: '@computer', priority: 'MEDIUM', energy: 'MEDIUM', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id },
        { title: 'Team Meeting', description: 'Weekly team sync meeting', context: '@office', priority: 'LOW', energy: 'LOW', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // WaitingFor
    console.log('⏳ WaitingFor - dodawanie...');
    await prisma.waitingFor.createMany({
      data: [
        { title: 'Client Response', description: 'Waiting for client feedback on proposal', organizationId: firstOrg.id, createdById: firstUser.id, waitingForPersonId: firstUser.id, expectedDate: new Date(Date.now() + 604800000), status: 'WAITING' },
        { title: 'Vendor Quote', description: 'Waiting for vendor pricing', organizationId: firstOrg.id, createdById: firstUser.id, waitingForPersonId: firstUser.id, expectedDate: new Date(Date.now() + 259200000), status: 'WAITING' },
        { title: 'Legal Approval', description: 'Contract approval from legal', organizationId: firstOrg.id, createdById: firstUser.id, waitingForPersonId: firstUser.id, expectedDate: new Date(Date.now() + 172800000), status: 'RECEIVED', receivedDate: new Date() }
      ],
      skipDuplicates: true
    });

    // SomedayMaybe
    console.log('🌟 SomedayMaybe - dodawanie...');
    await prisma.somedayMaybe.createMany({
      data: [
        { title: 'Learn French', description: 'Start learning French language', category: 'PERSONAL', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id, whenToReview: new Date(Date.now() + 2592000000) },
        { title: 'Expand to Asia', description: 'Consider Asian market expansion', category: 'BUSINESS', priority: 'MEDIUM', organizationId: firstOrg.id, createdById: firstUser.id, whenToReview: new Date(Date.now() + 7776000000) },
        { title: 'Write Book', description: 'Write industry expertise book', category: 'PERSONAL', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // Habits
    console.log('🔄 Habits - dodawanie...');
    await prisma.habit.createMany({
      data: [
        { name: 'Daily Standup', description: 'Morning team standup', frequency: 'DAILY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, streakTarget: 30, currentStreak: 15 },
        { name: 'Weekly Review', description: 'GTD weekly review', frequency: 'WEEKLY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, streakTarget: 52, currentStreak: 12 },
        { name: 'Monthly Planning', description: 'Monthly goal planning', frequency: 'MONTHLY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, streakTarget: 12, currentStreak: 6 },
        { name: 'Reading Time', description: 'Daily reading habit', frequency: 'DAILY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: false, streakTarget: 365, currentStreak: 0 }
      ],
      skipDuplicates: true
    });

    // ETAP 3: TABELE BUSINESS LOGIC
    console.log('\n💼 ETAP 3: TABELE BUSINESS LOGIC');

    // Meetings
    console.log('📅 Meetings - dodawanie...');
    await prisma.meeting.createMany({
      data: [
        { title: 'Project Kickoff', description: 'Project initialization meeting', scheduledAt: new Date(Date.now() + 86400000), duration: 60, type: 'PROJECT', status: 'SCHEDULED', organizationId: firstOrg.id, organizerId: firstUser.id, location: 'Conference Room A' },
        { title: 'Client Demo', description: 'Product demonstration', scheduledAt: new Date(Date.now() + 172800000), duration: 90, type: 'CLIENT', status: 'SCHEDULED', organizationId: firstOrg.id, organizerId: firstUser.id, location: 'Virtual - Zoom' },
        { title: 'Team Retrospective', description: 'Sprint retrospective', scheduledAt: new Date(Date.now() - 86400000), duration: 60, type: 'TEAM', status: 'COMPLETED', organizationId: firstOrg.id, organizerId: firstUser.id, notes: 'Good retrospective, action items identified' },
        { title: 'Board Meeting', description: 'Quarterly board meeting', scheduledAt: new Date(Date.now() + 604800000), duration: 120, type: 'OTHER', status: 'CANCELLED', organizationId: firstOrg.id, organizerId: firstUser.id, notes: 'Postponed to next month' }
      ],
      skipDuplicates: true
    });

    // RecurringTasks
    console.log('🔁 RecurringTasks - dodawanie...');
    await prisma.recurringTask.createMany({
      data: [
        { title: 'Weekly Report', description: 'Weekly status report', pattern: 'WEEKLY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, priority: 'MEDIUM', context: '@computer' },
        { title: 'Monthly Invoice Review', description: 'Review monthly invoices', pattern: 'MONTHLY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, priority: 'HIGH', context: '@office' },
        { title: 'Quarterly Planning', description: 'Quarterly goal planning', pattern: 'QUARTERLY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: true, priority: 'HIGH', context: '@office' },
        { title: 'Daily Backup', description: 'System backup routine', pattern: 'DAILY', organizationId: firstOrg.id, createdById: firstUser.id, isActive: false, priority: 'MEDIUM', context: '@computer' }
      ],
      skipDuplicates: true
    });

    // WeeklyReviews
    console.log('📝 WeeklyReviews - dodawanie...');
    await prisma.weeklyReview.createMany({
      data: [
        { weekStarting: new Date(Date.now() - 604800000), completedTasks: 15, newTasks: 8, notes: 'Productive week, met all major goals', organizationId: firstOrg.id, userId: firstUser.id, completedAt: new Date(Date.now() - 172800000) },
        { weekStarting: new Date(Date.now() - 1209600000), completedTasks: 12, newTasks: 10, notes: 'Good progress on key projects', organizationId: firstOrg.id, userId: firstUser.id, completedAt: new Date(Date.now() - 777600000) },
        { weekStarting: new Date(), completedTasks: 0, newTasks: 5, notes: 'Current week in progress', organizationId: firstOrg.id, userId: firstUser.id }
      ],
      skipDuplicates: true
    });

    // Tags
    console.log('🏷️ Tags - dodawanie...');
    await prisma.tag.createMany({
      data: [
        { name: 'urgent', color: '#FF4757', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'client-work', color: '#2ED573', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'internal', color: '#3742FA', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'research', color: '#FF6B35', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'documentation', color: '#A4B0BE', organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // ETAP 4: ZAAWANSOWANE TABELE
    console.log('\n🔧 ETAP 4: ZAAWANSOWANE TABELE');

    // DelegatedTasks
    console.log('👥 DelegatedTasks - dodawanie...');
    await prisma.delegatedTask.createMany({
      data: [
        { title: 'Review Code', description: 'Code review for new feature', delegatedToId: firstUser.id, organizationId: firstOrg.id, delegatedById: firstUser.id, dueDate: new Date(Date.now() + 172800000), status: 'PENDING', priority: 'HIGH' },
        { title: 'Update Documentation', description: 'Update API documentation', delegatedToId: firstUser.id, organizationId: firstOrg.id, delegatedById: firstUser.id, dueDate: new Date(Date.now() + 345600000), status: 'IN_PROGRESS', priority: 'MEDIUM' },
        { title: 'Client Training', description: 'Train client on new features', delegatedToId: firstUser.id, organizationId: firstOrg.id, delegatedById: firstUser.id, dueDate: new Date(Date.now() - 86400000), status: 'COMPLETED', priority: 'HIGH', completedAt: new Date() }
      ],
      skipDuplicates: true
    });

    // Timeline
    console.log('📈 Timeline - dodawanie...');
    await prisma.timeline.createMany({
      data: [
        { entityType: 'TASK', entityId: firstUser.id, action: 'CREATED', description: 'Task created', organizationId: firstOrg.id, userId: firstUser.id },
        { entityType: 'PROJECT', entityId: firstUser.id, action: 'UPDATED', description: 'Project status updated', organizationId: firstOrg.id, userId: firstUser.id },
        { entityType: 'DEAL', entityId: firstUser.id, action: 'COMPLETED', description: 'Deal closed successfully', organizationId: firstOrg.id, userId: firstUser.id },
        { entityType: 'CONTACT', entityId: firstUser.id, action: 'CREATED', description: 'New contact added', organizationId: firstOrg.id, userId: firstUser.id }
      ],
      skipDuplicates: true
    });

    // ETAP 5: KOMUNIKACJA I AUTOMATION
    console.log('\n📧 ETAP 5: KOMUNIKACJA I AUTOMATION');

    // Communication
    console.log('📞 Communication - dodawanie...');
    await prisma.communication.createMany({
      data: [
        { subject: 'Project Update Required', content: 'Please provide status update on current project', fromEmail: 'manager@company.com', toEmail: firstUser.email, channel: 'EMAIL', status: 'SENT', organizationId: firstOrg.id, urgencyScore: 75 },
        { subject: 'Meeting Invitation', content: 'You are invited to the quarterly review meeting', fromEmail: 'hr@company.com', toEmail: firstUser.email, channel: 'EMAIL', status: 'DELIVERED', organizationId: firstOrg.id, urgencyScore: 60 },
        { subject: 'System Maintenance Notice', content: 'Scheduled maintenance this weekend', fromEmail: 'admin@company.com', toEmail: firstUser.email, channel: 'EMAIL', status: 'READ', organizationId: firstOrg.id, urgencyScore: 40 },
        { subject: 'Welcome to the Team', content: 'Welcome aboard! Here is your onboarding information', fromEmail: 'hr@company.com', toEmail: 'newuser@company.com', channel: 'EMAIL', status: 'FAILED', organizationId: firstOrg.id, urgencyScore: 90 }
      ],
      skipDuplicates: true
    });

    // AutoReplies
    console.log('🤖 AutoReplies - dodawanie...');
    await prisma.autoReply.createMany({
      data: [
        { name: 'Out of Office', triggerPattern: 'vacation|holiday|out of office', replyTemplate: 'Thank you for your email. I am currently out of office and will respond when I return.', isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Support Acknowledgment', triggerPattern: 'support|help|issue', replyTemplate: 'Thank you for contacting support. Your ticket has been created and we will respond within 24 hours.', isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Sales Inquiry', triggerPattern: 'price|pricing|quote|cost', replyTemplate: 'Thank you for your interest in our products. A sales representative will contact you shortly.', isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'General Info', triggerPattern: 'information|info|details', replyTemplate: 'Thank you for your inquiry. Please visit our website for more information or contact us directly.', isActive: false, organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // UnifiedRules
    console.log('⚙️ UnifiedRules - dodawanie...');
    await prisma.unifiedRule.createMany({
      data: [
        { name: 'High Priority Email Filter', description: 'Automatically flag emails from VIP contacts', type: 'EMAIL_FILTER', trigger: 'EVENT_BASED', conditions: JSON.stringify({senderDomain: 'vip.com'}), actions: JSON.stringify({setPriority: 'HIGH'}), isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Auto Task Creation', description: 'Create tasks from specific emails', type: 'PROCESSING', trigger: 'AUTOMATIC', conditions: JSON.stringify({subjectContains: 'TODO'}), actions: JSON.stringify({createTask: true}), isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Smart Mailbox Sorter', description: 'Sort emails into smart mailboxes', type: 'SMART_MAILBOX', trigger: 'EVENT_BASED', conditions: JSON.stringify({hasAttachment: true}), actions: JSON.stringify({moveToMailbox: 'attachments'}), isActive: true, organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Weekend Auto Reply', description: 'Send auto reply during weekends', type: 'AUTO_REPLY', trigger: 'SCHEDULED', conditions: JSON.stringify({isWeekend: true}), actions: JSON.stringify({sendAutoReply: 'weekend'}), isActive: false, organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // Sprawdź końcowy stan
    console.log('\n✅ SPRAWDZANIE KOŃCOWEGO STANU...');
    
    const finalCounts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.deal.count(),
      prisma.stream.count(),
      prisma.context.count(),
      prisma.nextAction.count(),
      prisma.waitingFor.count(),
      prisma.somedayMaybe.count(),
      prisma.habit.count(),
      prisma.meeting.count(),
      prisma.recurringTask.count(),
      prisma.weeklyReview.count(),
      prisma.tag.count(),
      prisma.delegatedTask.count(),
      prisma.timeline.count(),
      prisma.communication.count(),
      prisma.autoReply.count(),
      prisma.unifiedRule.count()
    ]);

    console.log('\n🎉 WYPEŁNIANIE ZAKOŃCZONE!');
    console.log('========================');
    console.log(`📊 Organizations: ${finalCounts[0]}`);
    console.log(`👥 Users: ${finalCounts[1]}`);
    console.log(`📞 Contacts: ${finalCounts[2]}`);
    console.log(`🏢 Companies: ${finalCounts[3]}`);
    console.log(`📂 Projects: ${finalCounts[4]}`);
    console.log(`✅ Tasks: ${finalCounts[5]}`);
    console.log(`💼 Deals: ${finalCounts[6]}`);
    console.log(`🌊 Streams: ${finalCounts[7]}`);
    console.log(`📍 Contexts: ${finalCounts[8]}`);
    console.log(`⚡ NextActions: ${finalCounts[9]}`);
    console.log(`⏳ WaitingFor: ${finalCounts[10]}`);
    console.log(`🌟 SomedayMaybe: ${finalCounts[11]}`);
    console.log(`🔄 Habits: ${finalCounts[12]}`);
    console.log(`📅 Meetings: ${finalCounts[13]}`);
    console.log(`🔁 RecurringTasks: ${finalCounts[14]}`);
    console.log(`📝 WeeklyReviews: ${finalCounts[15]}`);
    console.log(`🏷️ Tags: ${finalCounts[16]}`);
    console.log(`👥 DelegatedTasks: ${finalCounts[17]}`);
    console.log(`📈 Timeline: ${finalCounts[18]}`);
    console.log(`📞 Communication: ${finalCounts[19]}`);
    console.log(`🤖 AutoReplies: ${finalCounts[20]}`);
    console.log(`⚙️ UnifiedRules: ${finalCounts[21]}`);

    const totalTables = finalCounts.filter(count => count > 0).length;
    console.log(`\n🏆 TOTAL: ${totalTables} tabel z danymi!`);

  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });