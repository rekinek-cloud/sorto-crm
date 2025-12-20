const { PrismaClient } = require('@prisma/client');

async function checkOrgAndUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Sprawdzanie organizacji i użytkowników...');
    
    const orgs = await prisma.organization.findMany();
    console.log(`📊 Organizacje (${orgs.length}):`);
    orgs.forEach(org => {
      console.log(`  - ${org.name} (${org.id})`);
    });
    
    const users = await prisma.user.findMany();
    console.log(`\n👥 Użytkownicy (${users.length}):`);
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.id}) - Org: ${user.organizationId}`);
    });
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrgAndUser();