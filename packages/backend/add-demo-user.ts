import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addDemoUser() {
  try {
    // Znajdź pierwszą organizację
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ Brak organizacji!');
      return;
    }

    // Sprawdź czy demo user już istnieje
    const existingDemo = await prisma.user.findUnique({
      where: { email: 'demo@demo.com' }
    });

    if (existingDemo) {
      console.log('⏩ Użytkownik demo@demo.com już istnieje');
      console.log(`📧 Email: ${existingDemo.email}`);
      console.log(`👤 Rola: ${existingDemo.role}`);
      return;
    }

    // Hash hasła 'demo123'
    const passwordHash = await bcrypt.hash('demo123', 12);
    
    // Utwórz demo usera
    const demoUser = await prisma.user.create({
      data: {
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@demo.com',
        passwordHash,
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
        organizationId: organization.id,
        settings: {
          theme: 'light',
          language: 'pl',
          notifications: true
        }
      }
    });

    console.log('✅ UTWORZONO KONTO DEMO!');
    console.log('================================');
    console.log(`📧 Login: ${demoUser.email}`);
    console.log('🔑 Hasło: demo123');
    console.log(`👤 Rola: ${demoUser.role}`);
    console.log(`🏢 Organizacja: ${organization.name}`);
    console.log('================================');
    console.log('🌐 Zaloguj się: https://crm.dev.sorto.ai/crm/auth/login');

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoUser();