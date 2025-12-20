const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWave6() {
  console.log('🌊 WAVE 6 - ostatni sprint do 60%...\\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 56/97 (57.7%)');
    console.log('🎯 Cel: 60% wypełnienia = +2-4 tabele \\n');

    // 1. EmailLog - log emaili
    console.log('📧 EmailLog...');
    try {
      await prisma.emailLog.create({
        data: {
          provider: 'SMTP',
          messageId: 'msg-123-abc',
          toAddresses: ['user@company.com'],
          subject: 'Test Email',
          status: 'SENT',
          organizationId: organization.id
        }
      });
      console.log('✅ emailLog: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailLog: ${error.message.substring(0, 80)}...`);
    }

    // 2. SmartMailbox - inteligentna skrzynka
    console.log('\\n📬 SmartMailbox...');
    try {
      await prisma.smartMailbox.create({
        data: {
          name: 'High Priority Today',
          description: 'Important emails for today',
          organizationId: organization.id
        }
      });
      console.log('✅ smartMailbox: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smartMailbox: ${error.message.substring(0, 80)}...`);
    }

    // 3. UnifiedRule - zunifikowana reguła
    console.log('\\n⚙️ UnifiedRule...');
    try {
      await prisma.unifiedRule.create({
        data: {
          name: 'Auto Priority Assignment',
          description: 'Automatically assign priority based on urgency keywords',
          ruleType: 'PROCESSING',
          organizationId: organization.id
        }
      });
      console.log('✅ unifiedRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  unifiedRule: ${error.message.substring(0, 80)}...`);
    }

    // 4. VectorDocument - dokument wektorowy
    console.log('\\n🔍 VectorDocument...');
    try {
      await prisma.vectorDocument.create({
        data: {
          title: 'Product Documentation',
          content: 'Complete guide to product features and functionality',
          contentHash: 'hash-abc123',
          entityType: 'document',
          organizationId: organization.id
        }
      });
      console.log('✅ vectorDocument: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorDocument: ${error.message.substring(0, 80)}...`);
    }

    // 5. VectorSearchResult - wynik wyszukiwania wektorowego
    console.log('\\n🎯 VectorSearchResult...');
    try {
      await prisma.vectorSearchResult.create({
        data: {
          query: 'project management best practices',
          results: [
            { id: '1', score: 0.95, title: 'PM Guide' },
            { id: '2', score: 0.87, title: 'Best Practices' }
          ],
          organizationId: organization.id
        }
      });
      console.log('✅ vectorSearchResult: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorSearchResult: ${error.message.substring(0, 80)}...`);
    }

    // 6. VectorCache - cache wektorów
    console.log('\\n💾 VectorCache...');
    try {
      await prisma.vectorCache.create({
        data: {
          cacheKey: 'search-query-456',
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

    // 7. Spróbuję AIRule
    console.log('\\n🧠 AIRule...');
    try {
      await prisma.aIRule.create({
        data: {
          name: 'Smart Task Categorization',
          description: 'Automatically categorize tasks using AI',
          conditions: { hasContent: true },
          actions: { analyze: 'content' },
          isActive: true,
          organizationId: organization.id
        }
      });
      console.log('✅ aIRule: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIRule: ${error.message.substring(0, 80)}...`);
    }

    console.log('\\n' + '='.repeat(60));
    console.log(`🎉 WAVE 6 UKOŃCZONA: +${successCount} nowych tabel!`);
    
    const newTotal = 56 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 60) {
      console.log('🎊🎊🎊 OSIĄGNĘLIŚMY 60%! 🎊🎊🎊');
      console.log('🚀 Teraz w kierunku 70% (68 tabel)!');
    }
    if (newTotal >= 58) {
      console.log('🌟 Blisko 60%! Świetny postęp!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWave6();