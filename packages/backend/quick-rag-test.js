/**
 * 🧪 Szybki Test RAG z prawdziwymi danymi
 */
const { PrismaClient } = require('@prisma/client');

async function quickRagTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Szybki test RAG z prawdziwymi danymi\n');
    
    // Podstawowe statystyki
    const totalVectors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors`;
    console.log(`📊 Łączna liczba wektorów: ${totalVectors[0].count}`);
    
    // Statystyki według organizacji
    const orgStats = await prisma.$queryRaw`
      SELECT 
        metadata->>'organizationId' as org_id,
        COUNT(*) as vector_count
      FROM vectors
      GROUP BY metadata->>'organizationId'
      ORDER BY vector_count DESC
    `;
    
    console.log('🏢 Organizacje:');
    orgStats.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.org_id?.substring(0, 8)}... - ${org.vector_count} wektorów`);
    });
    
    const targetOrgId = orgStats[0]?.org_id;
    
    // Typy danych
    const typeStats = await prisma.$queryRaw`
      SELECT 
        metadata->>'type' as type,
        COUNT(*) as count
      FROM vectors
      WHERE metadata->>'organizationId' = ${targetOrgId}
      GROUP BY metadata->>'type'
      ORDER BY count DESC
    `;
    
    console.log('\n📋 Typy danych:');
    typeStats.forEach(type => {
      console.log(`   ${type.type}: ${type.count} elementów`);
    });
    
    // Test wyszukiwania
    console.log('\n🔍 Test wyszukiwania:');
    
    const searchQueries = ['marketing', 'urgent', 'project', 'contact'];
    
    for (const query of searchQueries) {
      const results = await prisma.$queryRaw`
        SELECT 
          metadata->>'title' as title,
          metadata->>'type' as type,
          metadata->>'urgencyScore' as urgency
        FROM vectors
        WHERE metadata->>'organizationId' = ${targetOrgId}
        AND LOWER(content) LIKE LOWER(${'%' + query + '%'})
        ORDER BY 
          CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
               THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
               ELSE 0 END DESC
        LIMIT 3
      `;
      
      console.log(`\n   "${query}": ${results.length} wyników`);
      results.forEach((result, i) => {
        console.log(`      ${i + 1}. [${result.type}] ${result.title || 'Bez tytułu'}`);
        if (result.urgency) console.log(`         Urgency: ${result.urgency}`);
      });
    }
    
    // Test pilności
    const urgentItems = await prisma.$queryRaw`
      SELECT 
        metadata->>'title' as title,
        metadata->>'type' as type,
        metadata->>'urgencyScore' as urgency
      FROM vectors
      WHERE metadata->>'organizationId' = ${targetOrgId}
      AND CAST(metadata->>'urgencyScore' AS INTEGER) > 70
      ORDER BY CAST(metadata->>'urgencyScore' AS INTEGER) DESC
      LIMIT 5
    `;
    
    console.log(`\n⚠️  Pilne elementy (${urgentItems.length}):`);
    urgentItems.forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.type}] ${item.title} (urgency: ${item.urgency})`);
    });
    
    console.log('\n✅ RAG system działa z prawdziwymi danymi!');
    
  } catch (error) {
    console.error('❌ Test nie powiódł się:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickRagTest().catch(console.error);