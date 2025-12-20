import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 BEZPIECZNE WYPEŁNIANIE BAZY DANYCH');
  console.log('====================================\n');

  try {
    // Pobierz podstawowe dane
    const firstOrg = await prisma.organization.findFirst();
    const firstUser = await prisma.user.findFirst();
    
    if (!firstOrg || !firstUser) {
      throw new Error('Brak podstawowych danych w bazie');
    }

    console.log('🏢 Używam organizacji:', firstOrg.name);
    console.log('👤 Używam użytkownika:', firstUser.firstName, firstUser.lastName);

    // 1. Projects - używam tylko znanych statusów: PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELED
    console.log('\n📂 Projects - dodawanie (wszystkie statusy)...');
    await prisma.project.createMany({
      data: [
        { name: 'Planning Project Alpha', description: 'Project in planning phase', status: 'PLANNING', priority: 'HIGH', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Active Project Beta', description: 'Project in progress', status: 'IN_PROGRESS', priority: 'URGENT', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'On Hold Project Gamma', description: 'Project on hold', status: 'ON_HOLD', priority: 'MEDIUM', organizationId: firstOrg.id, createdById: firstUser.id },
        { name: 'Completed Project Delta', description: 'Completed project', status: 'COMPLETED', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id, completedAt: new Date() },
        { name: 'Canceled Project Epsilon', description: 'Canceled project', status: 'CANCELED', priority: 'LOW', organizationId: firstOrg.id, createdById: firstUser.id }
      ],
      skipDuplicates: true
    });

    // 2. Tasks - używam znanych statusów: NEW, IN_PROGRESS, WAITING, COMPLETED, CANCELED
    console.log('✅ Tasks - dodawanie (wszystkie statusy)...');
    await prisma.task.createMany({
      data: [
        { title: 'New Task Alpha', description: 'New task description', status: 'NEW', priority: 'HIGH', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'HIGH' },
        { title: 'In Progress Task Beta', description: 'Task in progress', status: 'IN_PROGRESS', priority: 'URGENT', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@office', energy: 'MEDIUM' },
        { title: 'Waiting Task Gamma', description: 'Waiting for input', status: 'WAITING', priority: 'MEDIUM', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@waiting', energy: 'LOW' },
        { title: 'Completed Task Delta', description: 'Completed task', status: 'COMPLETED', priority: 'LOW', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@computer', energy: 'MEDIUM', completedAt: new Date() },
        { title: 'Canceled Task Epsilon', description: 'Canceled task', status: 'CANCELED', priority: 'LOW', organizationId: firstOrg.id, assignedToId: firstUser.id, createdById: firstUser.id, context: '@office', energy: 'LOW' }
      ],
      skipDuplicates: true
    });

    // 3. Deals - używam znanych stage: PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
    console.log('💼 Deals - dodawanie (wszystkie etapy)...');
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

    // 4. Streams - więcej różnorodności
    console.log('🌊 Streams - dodawanie...');
    await prisma.stream.createMany({
      data: [
        { name: 'Marketing', description: 'Marketing activities', color: '#FF6B6B', icon: 'megaphone', organizationId: firstOrg.id, status: 'ACTIVE', priority: 'HIGH' },
        { name: 'Sales', description: 'Sales processes', color: '#4ECDC4', icon: 'dollar-sign', organizationId: firstOrg.id, status: 'ACTIVE', priority: 'URGENT' },
        { name: 'Development', description: 'Software development', color: '#45B7D1', icon: 'code', organizationId: firstOrg.id, status: 'ACTIVE', priority: 'MEDIUM' },
        { name: 'Support', description: 'Customer support', color: '#96CEB4', icon: 'headset', organizationId: firstOrg.id, status: 'INACTIVE', priority: 'LOW' }
      ],
      skipDuplicates: true
    });

    // 5. NextActions - pojedynczo dla lepszej kontroli  
    console.log('⚡ NextActions - dodawanie...');
    try {
      await prisma.nextAction.create({
        data: {
          title: 'Call Important Client',
          description: 'Follow up call with VIP client',
          context: '@calls',
          priority: 'HIGH',
          energy: 'HIGH',
          organizationId: firstOrg.id,
          assignedToId: firstUser.id,
          createdById: firstUser.id,
          dueDate: new Date(Date.now() + 86400000)
        }
      });
      console.log('  ✅ NextAction 1 utworzony');
    } catch (e) {
      console.log('  ❌ NextAction 1 failed:', e.message);
    }

    // 6. Meetings - różne statusy
    console.log('📅 Meetings - dodawanie...');
    await prisma.meeting.createMany({
      data: [
        { 
          title: 'Project Kickoff', 
          description: 'Project initialization meeting', 
          scheduledAt: new Date(Date.now() + 86400000), 
          duration: 60, 
          type: 'PROJECT', 
          status: 'SCHEDULED', 
          organizationId: firstOrg.id, 
          organizerId: firstUser.id, 
          location: 'Conference Room A' 
        },
        { 
          title: 'Completed Meeting', 
          description: 'Past meeting that was completed', 
          scheduledAt: new Date(Date.now() - 86400000), 
          duration: 90, 
          type: 'CLIENT', 
          status: 'COMPLETED', 
          organizationId: firstOrg.id, 
          organizerId: firstUser.id, 
          notes: 'Meeting went well, follow up required' 
        },
        { 
          title: 'Cancelled Meeting', 
          description: 'Meeting that was cancelled', 
          scheduledAt: new Date(Date.now() + 172800000), 
          duration: 60, 
          type: 'TEAM', 
          status: 'CANCELLED', 
          organizationId: firstOrg.id, 
          organizerId: firstUser.id, 
          notes: 'Cancelled due to conflicts' 
        }
      ],
      skipDuplicates: true
    });

    // 7. Communication - różne statusy
    console.log('📧 Communication - dodawanie...');
    await prisma.communication.createMany({
      data: [
        { 
          subject: 'Project Update Required', 
          content: 'Please provide status update on current project', 
          fromEmail: 'manager@company.com', 
          toEmail: firstUser.email, 
          channel: 'EMAIL', 
          status: 'SENT', 
          organizationId: firstOrg.id, 
          urgencyScore: 75 
        },
        { 
          subject: 'Meeting Invitation', 
          content: 'You are invited to the quarterly review meeting', 
          fromEmail: 'hr@company.com', 
          toEmail: firstUser.email, 
          channel: 'EMAIL', 
          status: 'DELIVERED', 
          organizationId: firstOrg.id, 
          urgencyScore: 60 
        },
        { 
          subject: 'System Notice', 
          content: 'System maintenance completed successfully', 
          fromEmail: 'admin@company.com', 
          toEmail: firstUser.email, 
          channel: 'EMAIL', 
          status: 'READ', 
          organizationId: firstOrg.id, 
          urgencyScore: 40 
        },
        { 
          subject: 'Failed Delivery', 
          content: 'This message failed to deliver', 
          fromEmail: 'test@company.com', 
          toEmail: 'invalid@invalid.com', 
          channel: 'EMAIL', 
          status: 'FAILED', 
          organizationId: firstOrg.id, 
          urgencyScore: 20 
        }
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
      prisma.meeting.count(),
      prisma.communication.count()
    ]);

    console.log('\n🎉 WYPEŁNIANIE PODSTAWOWYCH TABEL ZAKOŃCZONE!');
    console.log('==============================================');
    console.log(`📊 Organizations: ${finalCounts[0]}`);
    console.log(`👥 Users: ${finalCounts[1]}`);
    console.log(`📞 Contacts: ${finalCounts[2]}`);
    console.log(`🏢 Companies: ${finalCounts[3]}`);
    console.log(`📂 Projects: ${finalCounts[4]}`);
    console.log(`✅ Tasks: ${finalCounts[5]}`);
    console.log(`💼 Deals: ${finalCounts[6]}`);
    console.log(`🌊 Streams: ${finalCounts[7]}`);
    console.log(`📅 Meetings: ${finalCounts[8]}`);
    console.log(`📧 Communication: ${finalCounts[9]}`);

    const filledTables = finalCounts.filter(count => count > 0).length;
    console.log(`\n🏆 WYPEŁNIONE TABELE: ${filledTables}/10 podstawowych`);

    // Sprawdź różnorodność statusów
    console.log('\n🔍 RÓŻNORODNOŚĆ STATUSÓW:');
    
    const projectStatuses = await prisma.project.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('Projects:', projectStatuses.map(p => `${p.status}(${p._count.status})`).join(', '));
    
    const taskStatuses = await prisma.task.groupBy({
      by: ['status'], 
      _count: { status: true }
    });
    console.log('Tasks:', taskStatuses.map(t => `${t.status}(${t._count.status})`).join(', '));
    
    const dealStages = await prisma.deal.groupBy({
      by: ['stage'],
      _count: { stage: true }
    });
    console.log('Deals:', dealStages.map(d => `${d.stage}(${d._count.stage})`).join(', '));

    console.log('\n✅ Baza danych jest teraz wypełniona z pełną różnorodnością statusów!');

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