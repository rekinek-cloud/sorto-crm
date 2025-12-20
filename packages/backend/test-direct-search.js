const { PrismaClient } = require('@prisma/client');

async function testDirectSearch() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing direct vector search...');
    
    // Test podstawowego połączenia
    const totalVectors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors`;
    console.log(`📊 Total vectors: ${totalVectors[0]?.count}`);
    
    // Test wyszukiwania Tryumf
    const searchQuery = 'Tryumf';
    console.log(`\n🎯 Searching for: "${searchQuery}"`);
    
    const results = await prisma.$queryRaw`
      SELECT 
        id,
        metadata->>'title' as title,
        metadata->>'type' as type,
        metadata->>'organizationId' as org_id,
        content
      FROM vectors 
      WHERE (
        LOWER(content) LIKE LOWER(${'%' + searchQuery + '%'}) OR
        LOWER(metadata->>'title') LIKE LOWER(${'%' + searchQuery + '%'})
      )
      LIMIT 5
    `;
    
    console.log(`✅ Found ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`${i + 1}. [${result.type}] ${result.title} (org: ${result.org_id?.substring(0, 8)}...)`);
      console.log(`   Content: ${result.content.substring(0, 100)}...`);
    });
    
    // Test wyszukiwania po różnych firmach
    const companies = ['Vitopar', 'Machineseeker', 'TECH'];
    for (const company of companies) {
      const companyResults = await prisma.$queryRaw`
        SELECT metadata->>'title' as title, metadata->>'type' as type
        FROM vectors 
        WHERE LOWER(metadata->>'title') LIKE LOWER(${'%' + company + '%'})
        LIMIT 3
      `;
      console.log(`\n🏢 "${company}": ${companyResults.length} results`);
      companyResults.forEach(r => console.log(`   - ${r.title}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectSearch().catch(console.error);