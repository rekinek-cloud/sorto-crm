const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSuccessful() {
  console.log('🔍 ANALIZA UDANYCH MODELI - co działało?\n');

  try {
    // Sprawdzę które modele mają dokładnie 1 rekord (te dodane w tej sesji)
    const recentlyAdded = [];
    const established = [];

    const models = [
      'organization', 'user', 'task', 'project', 'contact', 'company', 'deal', 'context',
      'nextAction', 'waitingFor', 'somedayMaybe', 'habit', 'meeting', 'inboxItem',
      'product', 'service', 'lead', 'order', 'orderItem', 'document', 'folder', 
      'wikiCategory', 'searchIndex', 'aIProvider', 'communicationChannel', 'subscription',
      'stream', 'timeline', 'tag', 'refreshToken', 'habitEntry', 'complaint', 'info',
      'unimportant', 'recommendation', 'file', 'metadata'
    ];

    for (const modelName of models) {
      try {
        const model = prisma[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          if (count === 1) {
            recentlyAdded.push(modelName);
          } else if (count > 1) {
            established.push({ name: modelName, count });
          }
        }
      } catch (error) {
        // Skip błędy
      }
    }

    console.log('🆕 MODELE Z 1 REKORDEM (dodane w tej sesji):');
    recentlyAdded.forEach((model, index) => {
      console.log(`${index + 1}. ${model}`);
    });

    console.log('\n📊 MODELE WIELOREKORDOWE (wcześniej wypełnione):');
    established
      .sort((a, b) => b.count - a.count)
      .forEach((model, index) => {
        console.log(`${index + 1}. ${model.name} (${model.count})`);
      });

    console.log('\n🎯 SUKCES W TEJ SESJI:');
    console.log(`✅ Dodane nowe tabele: ${recentlyAdded.length}`);
    console.log(`📋 Lista: ${recentlyAdded.join(', ')}`);

    // Sprawdzę czy można dodać więcej rekordów do tych samych typów
    console.log('\n🔄 PRÓBA DODANIA WIĘCEJ PROSTYCH REKORDÓW...');

    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    let additionalCount = 0;

    // Spróbuję dodać drugi file
    try {
      await prisma.file.create({
        data: {
          fileName: 'guide.pdf',
          fileType: 'PDF', 
          urlPath: '/uploads/guide.pdf',
          size: 2048000,
          organizationId: organization.id
        }
      });
      console.log('✅ file #2: dodany');
      additionalCount++;
    } catch (error) {
      console.log(`⚠️  file #2: ${error.message.substring(0, 50)}...`);
    }

    // Dodaj drugą wikiCategory
    try {
      await prisma.wikiCategory.create({
        data: {
          name: 'Developer Guides',
          description: 'Technical documentation for developers',
          organizationId: organization.id
        }
      });
      console.log('✅ wikiCategory #2: dodany');
      additionalCount++;
    } catch (error) {
      console.log(`⚠️  wikiCategory #2: ${error.message.substring(0, 50)}...`);
    }

    // Dodaj drugi metadata
    try {
      await prisma.metadata.create({
        data: {
          confidence: 0.95,
          ambiguity: 'none',
          rawText: 'High confidence metadata',
          referenceType: 'project'
        }
      });
      console.log('✅ metadata #2: dodany');
      additionalCount++;
    } catch (error) {
      console.log(`⚠️  metadata #2: ${error.message.substring(0, 50)}...`);
    }

    console.log(`\n📈 Dodatkowe rekordy: +${additionalCount}`);
    console.log(`🎯 Uwaga: Są to dodatkowe rekordy, nie nowe tabele`);

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSuccessful();