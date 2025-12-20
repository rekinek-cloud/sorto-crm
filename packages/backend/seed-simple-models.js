const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSimpleModels() {
  console.log('🔧 PROSTE MODELE - tabele bez skomplikowanych relacji...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const message = await prisma.message.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    // 1. Email Rule - prosty model
    console.log('📧 Email Rule...');
    try {
      await prisma.emailRule.create({
        data: {
          name: 'Urgent Email Filter',
          description: 'Filter urgent emails',
          conditions: { subject_contains: 'URGENT' },
          actions: { set_priority: 'HIGH' },
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ emailRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailRule błąd: ${error.message.substring(0, 80)}...`);
    }

    // 2. Email Template
    console.log('\n📝 Email Template...');
    try {
      await prisma.emailTemplate.create({
        data: {
          name: 'Welcome Email',
          subject: 'Welcome to CRM-GTD Smart',
          body: 'Thank you for joining our system...',
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ emailTemplate: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailTemplate błąd: ${error.message.substring(0, 80)}...`);
    }

    // 3. Auto Reply
    console.log('\n🔄 Auto Reply...');
    try {
      await prisma.autoReply.create({
        data: {
          name: 'Out of Office',
          subject: 'Out of Office',
          body: 'I am currently out of office...',
          isActive: false,
          organizationId: organization.id
        }
      });
      console.log('✅ autoReply: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  autoReply błąd: ${error.message.substring(0, 80)}...`);
    }

    // 4. Smart Mailbox
    console.log('\n📬 Smart Mailbox...');
    try {
      await prisma.smartMailbox.create({
        data: {
          name: 'Important Messages',
          description: 'High priority messages',
          rules: { priority: 'HIGH' },
          organizationId: organization.id
        }
      });
      console.log('✅ smartMailbox: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smartMailbox błąd: ${error.message.substring(0, 80)}...`);
    }

    // 5. Processing Rule
    console.log('\n⚙️ Processing Rule...');
    try {
      await prisma.processingRule.create({
        data: {
          name: 'Task Creation Rule',
          description: 'Auto-create tasks from emails',
          conditions: { subject_contains: 'TODO' },
          actions: { create_task: true },
          priority: 1,
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ processingRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  processingRule błąd: ${error.message.substring(0, 80)}...`);
    }

    // 6. Unified Rule
    console.log('\n🔧 Unified Rule...');
    try {
      await prisma.unifiedRule.create({
        data: {
          name: 'Universal Email Processing',
          description: 'Main email processing rule',
          type: 'EMAIL_FILTER',
          trigger: 'NEW_MESSAGE',
          conditions: {},
          actions: {},
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ unifiedRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  unifiedRule błąd: ${error.message.substring(0, 80)}...`);
    }

    // 7. Stream Channel
    console.log('\n📺 Stream Channel...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamChannel.create({
          data: {
            name: 'general',
            description: 'General discussion channel',
            type: 'TEXT',
            streamId: stream.id,
            organizationId: organization.id
          }
        });
        console.log('✅ streamChannel: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamChannel: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamChannel błąd: ${error.message.substring(0, 80)}...`);
    }

    // 8. Stream Permission
    console.log('\n🔐 Stream Permission...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamPermission.create({
          data: {
            permission: 'READ',
            streamId: stream.id,
            userId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ streamPermission: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamPermission: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamPermission błąd: ${error.message.substring(0, 80)}...`);
    }

    // 9. Document Comment
    console.log('\n💬 Document Comment...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentComment.create({
          data: {
            content: 'Great documentation, very helpful!',
            documentId: document.id,
            authorId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentComment: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentComment: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentComment błąd: ${error.message.substring(0, 80)}...`);
    }

    // 10. Wiki Page Link
    console.log('\n🔗 Wiki Page Link...');
    try {
      const wikiPage = await prisma.wikiPage.findFirst();
      if (wikiPage) {
        await prisma.wikiPageLink.create({
          data: {
            linkText: 'Related Guide',
            targetUrl: '/wiki/related-guide',
            sourcePageId: wikiPage.id,
            organizationId: organization.id
          }
        });
        console.log('✅ wikiPageLink: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  wikiPageLink: brak wikiPage');
      }
    } catch (error) {
      console.log(`⚠️  wikiPageLink błąd: ${error.message.substring(0, 80)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 RUNDA 4 UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${35 + successCount}/97 (${((35 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 35 - successCount} tabel`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSimpleModels();