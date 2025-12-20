import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const sample = await prisma.energyTimeBlock.findFirst();
    console.log('Sample record:', sample);
    console.log('Fields:', Object.keys(sample || {}));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();