const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWorkingModels() {
  console.log('✅ SPRAWDZONE MODELE - tylko te które na pewno działają...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 37/97 tabel');
    console.log('🎯 Focus: modele z udowodnioną prostotą\n');

    // 1. Vector Document - sprawdzę czy jest prosty
    console.log('🔍 Vector Document...');
    try {
      await prisma.vectorDocument.create({
        data: {
          title: 'Sample Document',
          content: 'This is a test document for vectorization',
          contentHash: 'abc123hash',
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
          entityType: 'document',
          organizationId: organization.id
        }
      });
      console.log('✅ vectorDocument: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorDocument: ${error.message.substring(0, 80)}...`);
    }

    // 2. Vector Search Result
    console.log('\n🔍 Vector Search Result...');
    try {
      await prisma.vectorSearchResult.create({
        data: {
          query: 'project management',
          results: [
            { id: '1', score: 0.95, title: 'Project Guide' },
            { id: '2', score: 0.87, title: 'Management Tips' }
          ],
          organizationId: organization.id
        }
      });
      console.log('✅ vectorSearchResult: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorSearchResult: ${error.message.substring(0, 80)}...`);
    }

    // 3. Vector Cache
    console.log('\n💾 Vector Cache...');
    try {
      await prisma.vectorCache.create({
        data: {
          cacheKey: 'search_query_123',
          results: { documents: [], totalCount: 0 },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizationId: organization.id
        }
      });
      console.log('✅ vectorCache: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorCache: ${error.message.substring(0, 80)}...`);
    }

    // 4. Spróbuję bardzo prosty model - sprawdzając czy istnieje
    console.log('\n📋 Sprawdzanie istnienia innych prostych modeli...');
    
    const simpleCounts = [];
    
    // Test czy można dodać do istniejących prostych relacji
    try {
      const wikiPage = await prisma.wikiPage.count();
      if (wikiPage === 0) {
        await prisma.wikiPage.create({
          data: {
            title: 'Quick Start Guide',
            slug: 'quick-start',
            content: 'Welcome to the system...',
            isPublic: true,
            authorId: user.id,
            organizationId: organization.id
          }
        });
        console.log('✅ wikiPage: 1 rekord');
        successCount++;
      } else {
        console.log('ℹ️  wikiPage: już wypełniona');
      }
    } catch (error) {
      console.log(`⚠️  wikiPage: ${error.message.substring(0, 60)}...`);
    }

    // 5. Message Attachment - relacja do message
    console.log('\n📎 Message Attachment...');
    try {
      // Spróbuję utworzyć message najpierw
      const channel = await prisma.communicationChannel.findFirst();
      if (channel) {
        const message = await prisma.message.create({
          data: {
            channelId: channel.id,
            content: 'Test message with attachment',
            fromAddress: 'user@company.com',
            toAddress: 'team@company.com',
            status: 'SENT',
            organizationId: organization.id
          }
        });
        
        await prisma.messageAttachment.create({
          data: {
            fileName: 'document.pdf',
            fileType: 'application/pdf',
            fileSize: 102400,
            messageId: message.id
          }
        });
        console.log('✅ message + messageAttachment: 2 rekordy');
        successCount += 2;
      } else {
        console.log('⚠️  messageAttachment: brak channel');
      }
    } catch (error) {
      console.log(`⚠️  messageAttachment: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 WORKING MODELS: +${successCount} nowych tabel!`);
    
    const newTotal = 37 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45%!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWorkingModels();