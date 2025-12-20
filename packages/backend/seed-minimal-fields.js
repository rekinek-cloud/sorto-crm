const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMinimalFields() {
  console.log('🔧 MINIMALNE POLA - debugowanie wymagań...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const contact = await prisma.contact.findFirst();
    const order = await prisma.order.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    // 1. Invoice - sprawdź dokładnie wymagane pola
    console.log('🧾 Invoice (minimal)...');
    try {
      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2025-001',
          title: 'CRM License Invoice',
          customer: 'BigCorp Inc',
          organizationId: organization.id
        }
      });
      console.log('✅ invoice: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  invoice błąd: ${error.message}`);
    }

    // 2. Offer - sprawdź dokładnie wymagane pola  
    console.log('\n💰 Offer (minimal)...');
    try {
      await prisma.offer.create({
        data: {
          offerNumber: 'OFF-2025-001',
          title: 'Enterprise CRM Package',
          customerName: 'BigCorp Inc',
          organizationId: organization.id
        }
      });
      console.log('✅ offer: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  offer błąd: ${error.message}`);
    }

    // 3. Habit Entry - dla istniejącego habit
    console.log('\n📅 Habit Entry...');
    try {
      const habit = await prisma.habit.findFirst();
      if (habit) {
        await prisma.habitEntry.create({
          data: {
            date: new Date('2025-01-06'),
            completed: true,
            habitId: habit.id
          }
        });
        console.log('✅ habitEntry: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  habitEntry: brak habit');
      }
    } catch (error) {
      console.log(`⚠️  habitEntry błąd: ${error.message.substring(0, 80)}...`);
    }

    // 4. Order Item - dla istniejącego order
    console.log('\n📦 Order Item...');
    try {
      if (order) {
        const product = await prisma.product.findFirst();
        await prisma.orderItem.create({
          data: {
            itemType: 'PRODUCT',
            quantity: 1,
            unitPrice: 999.99,
            totalPrice: 999.99,
            orderId: order.id,
            productId: product?.id
          }
        });
        console.log('✅ orderItem: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  orderItem: brak order');
      }
    } catch (error) {
      console.log(`⚠️  orderItem błąd: ${error.message.substring(0, 80)}...`);
    }

    // 5. User Permission - prosta tabela
    console.log('\n🔐 User Permission...');
    try {
      await prisma.userPermission.create({
        data: {
          permission: 'READ_TASKS',
          resource: 'tasks',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ userPermission: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userPermission błąd: ${error.message.substring(0, 80)}...`);
    }

    // 6. User Access Log
    console.log('\n📊 User Access Log...');
    try {
      await prisma.userAccessLog.create({
        data: {
          action: 'LOGIN',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Chrome',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ userAccessLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userAccessLog błąd: ${error.message.substring(0, 80)}...`);
    }

    // 7. File
    console.log('\n📁 File...');
    try {
      await prisma.file.create({
        data: {
          fileName: 'document.pdf',
          originalName: 'CRM Manual.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
          storagePath: '/uploads/docs/document.pdf',
          uploadedById: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ file: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  file błąd: ${error.message.substring(0, 80)}...`);
    }

    // 8. Metadata
    console.log('\n📋 Metadata...');
    try {
      await prisma.metadata.create({
        data: {
          key: 'system_version',
          value: 'v2.1.0',
          entityType: 'SYSTEM',
          organizationId: organization.id
        }
      });
      console.log('✅ metadata: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  metadata błąd: ${error.message.substring(0, 80)}...`);
    }

    // 9. Area of Responsibility
    console.log('\n🎯 Area of Responsibility...');
    try {
      await prisma.areaOfResponsibility.create({
        data: {
          name: 'Customer Support',
          description: 'Handle customer inquiries and support',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ areaOfResponsibility: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  areaOfResponsibility błąd: ${error.message.substring(0, 80)}...`);
    }

    // 10. SMART Template  
    console.log('\n🎯 SMART Template...');
    try {
      await prisma.sMARTTemplate.create({
        data: {
          name: 'Project Goals Template',
          description: 'Template for SMART project goals',
          template: {
            specific: 'Define clear objective',
            measurable: 'Define success metrics',
            achievable: 'Ensure realistic scope',
            relevant: 'Align with business goals',
            timebound: 'Set clear deadline'
          },
          organizationId: organization.id
        }
      });
      console.log('✅ sMARTTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  sMARTTemplate błąd: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 RUNDA 2 UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${33 + successCount}/97 (${((33 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 33 - successCount} tabel`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMinimalFields();