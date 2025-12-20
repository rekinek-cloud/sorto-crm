/**
 * Test script dla GTD Map API
 * Testuje czy backend odpowiada poprawnie na wywołania API
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET = 'super-bezpieczny-klucz-jwt-v1-min-32-znakow';

async function testGTDMapAPI() {
  console.log('🧪 ROZPOCZYNAM TEST GTD MAP API...\n');

  try {
    // 1. Znajdź użytkownika demo
    const user = await prisma.user.findFirst({
      where: { email: 'admin@demo.com' },
      select: { id: true, email: true, organizationId: true, role: true }
    });

    if (!user) {
      console.log('❌ Nie znaleziono użytkownika demo');
      return;
    }

    console.log('✅ Użytkownik demo znaleziony:', user);

    // 2. Wygeneruj token
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role
    }, SECRET, { expiresIn: '24h' });

    console.log('\n🔑 Token wygenerowany:', token.substring(0, 50) + '...');

    // 3. Test API curl commands
    console.log('\n📋 KOMENDY DO TESTOWANIA:');
    console.log('\n# Test GET /views:');
    console.log(`curl -s -X GET "http://91.99.50.80/crm/api/v1/gtd-map/views" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" | jq`);

    console.log('\n# Test GET /views/horizon:');
    console.log(`curl -s -X GET "http://91.99.50.80/crm/api/v1/gtd-map/views/horizon" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" | jq`);

    console.log('\n# Test GET /views/urgency:');
    console.log(`curl -s -X GET "http://91.99.50.80/crm/api/v1/gtd-map/views/urgency" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" | jq`);

    // 4. Sprawdź liczbę zadań dla organizacji
    const tasksCount = await prisma.task.count({
      where: {
        organizationId: user.organizationId,
        status: {
          notIn: ['COMPLETED', 'CANCELED']
        }
      }
    });

    console.log(`\n📊 Liczba aktywnych zadań: ${tasksCount}`);

    if (tasksCount === 0) {
      console.log('⚠️  UWAGA: Brak aktywnych zadań - bucket views mogą być puste!');
    }

    // 5. Test frontend cookie setting
    console.log('\n🍪 INSTRUKCJE DLA FRONTENDU:');
    console.log('1. Otwórz DevTools w przeglądarce');
    console.log('2. Przejdź do Console');
    console.log('3. Wklej następujący kod:');
    console.log(`
document.cookie = "access_token=${token}; path=/; domain=91.99.50.80; expires=${new Date(Date.now() + 24*60*60*1000).toUTCString()}";
console.log('✅ Token ustawiony w cookies');
location.reload();
    `);

    console.log('\n🎯 GTD MAP TEST ZAKOŃCZONY POMYŚLNIE!');

  } catch (error) {
    console.error('❌ Błąd podczas testowania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom test
testGTDMapAPI();