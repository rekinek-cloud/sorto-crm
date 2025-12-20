import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        organization: true
      }
    });
    
    console.log('🔍 AKTUALNA LISTA UŻYTKOWNIKÓW:\n');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${user.firstName} ${user.lastName}`);
      console.log(`    📧 Email: ${user.email}`);
      console.log(`    🏢 Organizacja: ${user.organization.name}`);
      console.log(`    👤 Rola: ${user.role || 'USER'}`);
      console.log(`    📅 Utworzony: ${user.createdAt.toLocaleDateString('pl-PL')}`);
      console.log(`    🔰 Status: ${user.isActive ? '✅ Aktywny' : '❌ Nieaktywny'}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log(`📊 Łączna liczba użytkowników: ${users.length}`);
    console.log(`🏢 Organizacje: ${[...new Set(users.map(u => u.organization.name))].join(', ')}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers();