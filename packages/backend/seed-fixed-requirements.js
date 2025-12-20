const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFixedRequirements() {
  console.log('✅ POPRAWIONE WYMAGANIA - z prawidłowymi polami...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const invoice = await prisma.invoice.findFirst();
    const offer = await prisma.offer.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    // 1. Invoice - z amount
    console.log('🧾 Invoice (z amount)...');
    try {
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-002',
          title: 'CRM License Invoice',
          customer: 'BigCorp Inc',
          amount: 9999.99,                    // WYMAGANE!
          organizationId: organization.id
        }
      });
      console.log('✅ invoice: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  invoice błąd: ${error.message.substring(0, 80)}...`);
    }

    // 2. Offer - bez organizationId, użyj relacji
    console.log('\n💰 Offer (z relacją)...');
    try {
      await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-002',
          title: 'Enterprise CRM Package',
          customerName: 'BigCorp Inc',
          organization: {
            connect: { id: organization.id }   // RELACJA!
          }
        }
      });
      console.log('✅ offer: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  offer błąd: ${error.message.substring(0, 80)}...`);
    }

    // 3. Invoice Item - dla istniejącej faktury
    console.log('\n📋 Invoice Item...');
    try {
      if (!invoice) {
        // Utwórz invoice najpierw
        const newInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: 'INV-2025-003',
            title: 'Test Invoice',
            customer: 'Test Customer',
            amount: 1999.99,
            organizationId: organization.id
          }
        });
        
        await prisma.invoiceItem.create({
          data: {
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 1999.99,
            totalPrice: 1999.99,
            invoiceId: newInvoice.id
          }
        });
        console.log('✅ invoiceItem: 1 rekord');
        successCount++;
      }
    } catch (error) {
      console.log(`⚠️  invoiceItem błąd: ${error.message.substring(0, 80)}...`);
    }

    // 4. Offer Item - dla istniejącej oferty
    console.log('\n💼 Offer Item...');
    try {
      if (!offer) {
        // Utwórz offer najpierw jeśli nie ma
        const newOffer = await prisma.offer.create({
          data: {
            offerNumber: 'OFF-2025-003',
            title: 'Test Offer',
            customerName: 'Test Customer',
            organization: {
              connect: { id: organization.id }
            }
          }
        });
        
        await prisma.offerItem.create({
          data: {
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 1999.99,
            totalPrice: 1999.99,
            offerId: newOffer.id
          }
        });
        console.log('✅ offerItem: 1 rekord');
        successCount++;
      }
    } catch (error) {
      console.log(`⚠️  offerItem błąd: ${error.message.substring(0, 80)}...`);
    }

    // 5. User Relation - prosty związek
    console.log('\n👥 User Relation...');
    try {
      await prisma.userRelation.create({
        data: {
          type: 'MANAGES',
          fromUserId: user.id,
          toUserId: user.id,  // sam do siebie dla demo
          organizationId: organization.id
        }
      });
      console.log('✅ userRelation: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userRelation błąd: ${error.message.substring(0, 80)}...`);
    }

    // 6. Task History - dla istniejącego zadania
    console.log('\n📈 Task History...');
    try {
      const task = await prisma.task.findFirst();
      if (task) {
        await prisma.taskHistory.create({
          data: {
            action: 'CREATED',
            changes: { status: 'PENDING' },
            taskId: task.id,
            userId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ taskHistory: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  taskHistory: brak task');
      }
    } catch (error) {
      console.log(`⚠️  taskHistory błąd: ${error.message.substring(0, 80)}...`);
    }

    // 7. Dependency - między zadaniami
    console.log('\n🔗 Dependency...');
    try {
      const tasks = await prisma.task.findMany({ take: 2 });
      if (tasks.length >= 2) {
        await prisma.dependency.create({
          data: {
            type: 'FINISH_TO_START',
            fromTaskId: tasks[0].id,
            toTaskId: tasks[1].id,
            organizationId: organization.id
          }
        });
        console.log('✅ dependency: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  dependency: potrzeba 2 zadań');
      }
    } catch (error) {
      console.log(`⚠️  dependency błąd: ${error.message.substring(0, 80)}...`);
    }

    // 8. Task Relationship - między zadaniami
    console.log('\n🔗 Task Relationship...');
    try {
      const tasks = await prisma.task.findMany({ take: 2 });
      if (tasks.length >= 2) {
        await prisma.taskRelationship.create({
          data: {
            type: 'BLOCKS',
            fromTaskId: tasks[0].id,
            toTaskId: tasks[1].id,
            organizationId: organization.id
          }
        });
        console.log('✅ taskRelationship: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  taskRelationship: potrzeba 2 zadań');
      }
    } catch (error) {
      console.log(`⚠️  taskRelationship błąd: ${error.message.substring(0, 80)}...`);
    }

    // 9. Completeness - dla zadania
    console.log('\n✅ Completeness...');
    try {
      const task = await prisma.task.findFirst();
      if (task) {
        await prisma.completeness.create({
          data: {
            score: 85.5,
            details: { specific: true, measurable: true, achievable: false },
            taskId: task.id,
            organizationId: organization.id
          }
        });
        console.log('✅ completeness: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  completeness: brak task');
      }
    } catch (error) {
      console.log(`⚠️  completeness błąd: ${error.message.substring(0, 80)}...`);
    }

    // 10. Project Dependency
    console.log('\n🔗 Project Dependency...');
    try {
      const projects = await prisma.project.findMany({ take: 2 });
      if (projects.length >= 1) {
        await prisma.projectDependency.create({
          data: {
            type: 'FINISH_TO_START',
            sourceProjectId: projects[0].id,
            targetProjectId: projects[0].id, // sam do siebie dla demo
            organizationId: organization.id
          }
        });
        console.log('✅ projectDependency: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  projectDependency: brak projects');
      }
    } catch (error) {
      console.log(`⚠️  projectDependency błąd: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 RUNDA 3 UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${35 + successCount}/97 (${((35 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 35 - successCount} tabel`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFixedRequirements();