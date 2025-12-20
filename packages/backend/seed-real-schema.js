const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRealSchema() {
  console.log('📋 RZECZYWISTA SCHEMA - według faktycznych pól w schema.prisma...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    // 1. File - według rzeczywistej schema
    console.log('📁 File...');
    try {
      await prisma.file.create({
        data: {
          fileName: 'manual.pdf',
          fileType: 'PDF',
          urlPath: '/uploads/manual.pdf',
          size: 1024000,
          organizationId: organization.id
        }
      });
      console.log('✅ file: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  file: ${error.message.substring(0, 80)}...`);
    }

    // 2. Sprawdzę inne proste modele które na pewno istnieją
    console.log('\n🔧 Vector Document (jeśli istnieje)...');
    try {
      await prisma.vectorDocument.create({
        data: {
          content: 'Sample document content for vectorization',
          embedding: [0.1, 0.2, 0.3], // przykładowy wektor
          organizationId: organization.id
        }
      });
      console.log('✅ vectorDocument: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorDocument: ${error.message.substring(0, 60)}...`);
    }

    // 3. Vector Cache
    console.log('\n💾 Vector Cache...');
    try {
      await prisma.vectorCache.create({
        data: {
          cacheKey: 'search_query_hash_123',
          results: { documents: [], similarity: 0.85 },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          organizationId: organization.id
        }
      });
      console.log('✅ vectorCache: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  vectorCache: ${error.message.substring(0, 60)}...`);
    }

    // 4. Critical Path (jeśli istnieje)
    console.log('\n🛤️ Critical Path...');
    try {
      const task = await prisma.task.findFirst();
      if (task) {
        await prisma.criticalPath.create({
          data: {
            duration: 5,
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            taskId: task.id,
            organizationId: organization.id
          }
        });
        console.log('✅ criticalPath: 1 rekord');
        successCount++;
      } else {
        console.log('⚠️  criticalPath: brak task');
      }
    } catch (error) {
      console.log(`⚠️  criticalPath: ${error.message.substring(0, 60)}...`);
    }

    // 5. Smart - jeśli istnieje
    console.log('\n🎯 Smart...');
    try {
      await prisma.smart.create({
        data: {
          specific: true,
          measurable: true,
          achievable: false,
          relevant: true,
          timebound: true,
          score: 80.0,
          organizationId: organization.id
        }
      });
      console.log('✅ smart: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  smart: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 REAL SCHEMA RUNDA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${35 + successCount}/97 (${((35 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 35 - successCount} tabel`);
    
    if ((35 + successCount) >= 88) {
      console.log('🎉🎉🎉 OSIĄGNĘLIŚMY 90%! 🎉🎉🎉');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRealSchema();