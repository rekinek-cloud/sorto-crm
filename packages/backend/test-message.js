const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAnalysis() {
  try {
    const messages = await prisma.message.findMany({
      take: 1
    });
    
    if (messages.length > 0) {
      console.log('Found message ID:', messages[0].id);
      console.log('Subject:', messages[0].subject);
      console.log('From:', messages[0].fromAddress);
    } else {
      console.log('No messages found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalysis();