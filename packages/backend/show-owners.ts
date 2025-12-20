import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showOwnerCredentials() {
  try {
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        organization: {
          select: {
            name: true,
            slug: true
          }
        },
        createdAt: true
      }
    });
    
    console.log('👑 DANE LOGOWANIA WŁAŚCICIELI:\n');
    console.log('='.repeat(70));
    
    owners.forEach((owner, index) => {
      console.log(`${index + 1}. ${owner.firstName} ${owner.lastName}`);
      console.log(`   📧 Login (Email): ${owner.email}`);
      console.log(`   🏢 Organizacja: ${owner.organization.name}`);
      console.log(`   🔑 Password Hash: ${owner.passwordHash ? owner.passwordHash.substring(0, 20) + '...' : 'NIE USTAWIONE'}`);
      console.log(`   🌐 Slug: ${owner.organization.slug}`);
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('ℹ️  UWAGI:');
    console.log('• Login = adres email użytkownika');
    console.log('• Hasła są zahashowane (bcrypt)');
    console.log('• Sprawdź dokumentację auth lub .env dla default credentials');
    console.log('• Każdy owner zarządza swoją organizacją');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showOwnerCredentials();