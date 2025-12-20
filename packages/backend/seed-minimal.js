const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMinimal() {
  console.log('🔧 MINIMAL MODELS - tylko absolutnie proste...n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;
    console.log('📊 Stan: 42/97 (43.3%)');
    console.log('🎯 Focus: modele z minimalnymi polami wymaganymi n');

    // 1. AIExecution - bardzo prosty
    console.log('🤖 AIExecution...');
    try {
      await prisma.aIExecution.create({
        data: {
          status: 'SUCCESS',
          duration: 250,
          organizationId: organization.id
        }
      });
      console.log('✅ aIExecution: 1 rekord');
      successCount++;
    } catch (error) {
      console.log(`⚠️  aIExecution: ${error.message.substring(0, 80)}...`);
    }

    // 2. Spróbuję dodać drugi plik (znamy że File działa)
    console.log('\n📁 File #3...');
    try {
      await prisma.file.create({
        data: {
          fileName: 'readme.txt',
          fileType: 'TXT',
          urlPath: '/uploads/readme.txt',
          size: 512,
          organizationId: organization.id
        }
      });
      console.log('✅ file #3: 1 rekord (dodatkowy)');
      // Nie liczę jako nową tabelę
    } catch (error) {
      console.log(`⚠️  file #3: ${error.message.substring(0, 80)}...`);
    }

    // 3. Kolejny metadata (znamy że działa)
    console.log('\n📊 Metadata #3...');
    try {
      await prisma.metadata.create({
        data: {
          confidence: 0.75,
          ambiguity: 'medium',
          rawText: 'Another metadata entry'
        }
      });
      console.log('✅ metadata #3: 1 rekord (dodatkowy)');
      // Nie liczę jako nową tabelę
    } catch (error) {
      console.log(`⚠️  metadata #3: ${error.message.substring(0, 80)}...`);
    }

    // 4. Sprawdzę czy jest jakiś bardzo prosty model
    console.log('\n🔍 Test bardzo prostych modeli...');
    
    // Sprawdzę dostępne modele Prisma
    const prismaModels = Object.getOwnPropertyNames(prisma).filter(
      name => typeof prisma[name] === 'object' && 
      prisma[name] && 
      typeof prisma[name].create === 'function'
    );
    
    console.log(`ℹ️  Dostępne modele Prisma: ${prismaModels.length}`);

    // Spróbuję bardzo prosty test na kilku modelach
    const testModels = ['smart', 'criticalPath', 'completeness'];
    
    for (const modelName of testModels) {
      if (prismaModels.includes(modelName)) {
        console.log(`\n🧪 Test ${modelName}...`);
        try {
          // Spróbuję z bardzo podstawowymi danymi
          if (modelName === 'smart') {
            await prisma.smart.create({
              data: {
                specific: true,
                measurable: true,
                achievable: true,
                relevant: true,
                timebound: false,
                score: 80.0,
                organizationId: organization.id
              }
            });
            console.log(`✅ ${modelName}: 1 rekord`);
            successCount++;
          }
        } catch (error) {
          console.log(`⚠️  ${modelName}: ${error.message.substring(0, 60)}...`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 MINIMAL MODELS: +${successCount} nowych tabel!`);
    
    const newTotal = 42 + successCount;
    const newPercentage = ((newTotal / 97) * 100).toFixed(1);
    
    console.log(`📊 Nowy stan: ${newTotal}/97 (${newPercentage}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - newTotal} tabel`);
    
    if (newTotal >= 50) {
      console.log('🎊 Ponad 50% wypełnienia!');
    }
    if (newTotal >= 44) {
      console.log('🚀 Osiągnęliśmy 45% - połowę drogi!');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMinimal();