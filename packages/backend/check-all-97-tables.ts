import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll97Tables() {
  console.log('🔍 Sprawdzanie stanu WSZYSTKICH 97 tabel w bazie danych...\n');

  try {
    // Pobierz wszystkie tabele
    const tables = await prisma.$queryRaw<{table_name: string}[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const emptyTables: string[] = [];
    const populatedTables: {name: string, count: number}[] = [];
    const errorTables: {name: string, error: string}[] = [];

    console.log('📊 Sprawdzanie każdej tabeli...');
    
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        // Użyj raw SQL aby sprawdzić każdą tabelę
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count FROM "${tableName}"
        `) as {count: bigint}[];
        
        const count = Number(result[0].count);
        
        if (count === 0) {
          emptyTables.push(tableName);
        } else {
          populatedTables.push({ name: tableName, count });
        }
        
        // Progress indicator
        if (tables.indexOf(table) % 10 === 0) {
          console.log(`  Sprawdzono ${tables.indexOf(table) + 1}/97 tabel...`);
        }
        
      } catch (error: any) {
        errorTables.push({ name: tableName, error: error.message });
      }
    }

    // WYNIKI
    console.log('\n' + '='.repeat(70));
    console.log('🔴 TABELE PUSTE:');
    console.log('='.repeat(70));
    
    if (emptyTables.length === 0) {
      console.log('🎉 WSZYSTKIE TABELE SĄ WYPEŁNIONE!');
    } else {
      emptyTables.forEach((table, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${table}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TABELE WYPEŁNIONE:');
    console.log('='.repeat(70));
    
    populatedTables
      .sort((a, b) => b.count - a.count) // Sortuj po liczbie rekordów
      .forEach((table, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${table.name.padEnd(35, ' ')} (${table.count.toString().padStart(4, ' ')} rekordów)`);
      });

    if (errorTables.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('❌ TABELE Z BŁĘDAMI:');
      console.log('='.repeat(70));
      
      errorTables.forEach((table, index) => {
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${table.name}: ${table.error}`);
      });
    }

    // STATYSTYKI KOŃCOWE
    console.log('\n' + '='.repeat(70));
    console.log('📊 PODSUMOWANIE WSZYSTKICH 97 TABEL:');
    console.log('='.repeat(70));
    console.log(`🗄️  Łączna liczba tabel: ${tables.length}`);
    console.log(`✅ Tabele wypełnione: ${populatedTables.length}`);
    console.log(`🔴 Tabele puste: ${emptyTables.length}`);
    console.log(`❌ Tabele z błędami: ${errorTables.length}`);
    console.log(`📈 Procent wypełnienia: ${((populatedTables.length / tables.length) * 100).toFixed(1)}%`);
    
    const totalRecords = populatedTables.reduce((sum, table) => sum + table.count, 0);
    console.log(`📋 Łączna liczba rekordów: ${totalRecords.toLocaleString()}`);
    
    console.log('='.repeat(70));

    // KATEGORIE PUSTYCH TABEL
    if (emptyTables.length > 0) {
      console.log('\n🔍 ANALIZA PUSTYCH TABEL:');
      
      const categories = {
        'AI & Machine Learning': emptyTables.filter(t => t.includes('ai_') || t.includes('smart_')),
        'System & Permissions': emptyTables.filter(t => t.includes('_permissions') || t.includes('_access') || t.includes('_logs')),
        'Relations & Links': emptyTables.filter(t => t.includes('_links') || t.includes('_relations') || t.includes('dependencies')),
        'Auxiliary Tables': emptyTables.filter(t => t.includes('_items') || t.includes('_entries') || t.includes('_details')),
        'GTD System': emptyTables.filter(t => t.includes('gtd_') || t.includes('smart')),
        'Other': emptyTables.filter(t => 
          !t.includes('ai_') && !t.includes('smart_') &&
          !t.includes('_permissions') && !t.includes('_access') && !t.includes('_logs') &&
          !t.includes('_links') && !t.includes('_relations') && !t.includes('dependencies') &&
          !t.includes('_items') && !t.includes('_entries') && !t.includes('_details') &&
          !t.includes('gtd_') && t !== 'smart'
        )
      };

      Object.entries(categories).forEach(([category, tables]) => {
        if (tables.length > 0) {
          console.log(`\n${category}: ${tables.length} tabel`);
          tables.forEach(table => console.log(`  - ${table}`));
        }
      });
    }

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania tabel:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie sprawdzania
checkAll97Tables()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });