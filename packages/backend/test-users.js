const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUsers() {
  try {
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    if (users.length > 0) {
      console.log('Found user:', users[0]);
    } else {
      console.log('No users found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUsers();