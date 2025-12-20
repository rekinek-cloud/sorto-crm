const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedContinueSimple() {
  console.log('🔄 KONTYNUACJA PROSTYCH MODELI...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    const task = await prisma.task.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    // 1. Metadata - prosty model
    console.log('📋 Metadata...');
    try {
      await prisma.metadata.create({
        data: {
          confidence: 0.85,
          ambiguity: 'low',
          rawText: 'Sample metadata text',
          referenceId: task?.id,
          referenceType: 'task'
        }
      });
      console.log('✅ metadata: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  metadata: ${error.message.substring(0, 80)}...`);
    }

    // 2. Stream Access Log
    console.log('\n📊 Stream Access Log...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamAccessLog.create({
          data: {
            action: 'READ',
            ipAddress: '192.168.1.1',
            streamId: stream.id,
            userId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ streamAccessLog: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamAccessLog: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamAccessLog: ${error.message.substring(0, 60)}...`);
    }

    // 3. Stream Relation
    console.log('\n🔗 Stream Relation...');
    try {
      const stream = await prisma.stream.findFirst();
      if (stream) {
        await prisma.streamRelation.create({
          data: {
            type: 'PARENT_CHILD',
            fromStreamId: stream.id,
            toStreamId: stream.id, // sam do siebie dla demo
            organizationId: organization.id
          }
        });
        console.log('✅ streamRelation: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  streamRelation: brak stream');
      }
    } catch (error) {
      console.log(`⚠️  streamRelation: ${error.message.substring(0, 60)}...`);
    }

    // 4. User Access Log
    console.log('\n📈 User Access Log...');
    try {
      await prisma.userAccessLog.create({
        data: {
          action: 'LOGIN',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Chrome/91.0',
          userId: user.id,
          organizationId: organization.id
        }
      });
      console.log('✅ userAccessLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  userAccessLog: ${error.message.substring(0, 60)}...`);
    }

    // 5. User Permission
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
      console.log(`⚠️  userPermission: ${error.message.substring(0, 60)}...`);
    }

    // 6. Document Link
    console.log('\n🔗 Document Link...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentLink.create({
          data: {
            url: 'https://example.com/related-doc',
            title: 'Related Documentation',
            documentId: document.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentLink: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentLink: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentLink: ${error.message.substring(0, 60)}...`);
    }

    // 7. Document Share
    console.log('\n👥 Document Share...');
    try {
      const document = await prisma.document.findFirst();
      if (document) {
        await prisma.documentShare.create({
          data: {
            permission: 'READ',
            documentId: document.id,
            sharedWithId: user.id,
            sharedById: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ documentShare: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  documentShare: brak document');
      }
    } catch (error) {
      console.log(`⚠️  documentShare: ${error.message.substring(0, 60)}...`);
    }

    // 8. Smart Mailbox Rule
    console.log('\n📬 Smart Mailbox Rule...');
    try {
      await prisma.smartMailboxRule.create({
        data: {
          name: 'Priority Filter',
          conditions: { priority: 'HIGH' },
          organizationId: organization.id
        }
      });
      console.log('✅ smartMailboxRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smartMailboxRule: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 KONTYNUACJA UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${36 + successCount}/97 (${((36 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 36 - successCount} tabel`);
    
    if ((36 + successCount) >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowa drogi!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedContinueSimple();