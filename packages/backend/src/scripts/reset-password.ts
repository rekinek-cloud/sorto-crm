import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', passwordHash);

  const result = await prisma.user.update({
    where: { email: 'owner@demo.com' },
    data: { passwordHash }
  });

  console.log('Password reset for:', result.email);
  console.log('New password:', password);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
