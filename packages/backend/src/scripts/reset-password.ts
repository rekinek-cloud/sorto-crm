import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'demo123';
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('Generated hash:', passwordHash);

  // Reset all demo users
  const demoUsers = ['owner@demo.com', 'admin@demo.com', 'manager@demo.com', 'member@demo.com'];

  for (const email of demoUsers) {
    try {
      const result = await prisma.user.update({
        where: { email },
        data: { passwordHash }
      });
      console.log('Password reset for:', result.email);
    } catch (e) {
      console.log('User not found:', email);
    }
  }

  console.log('New password for all demo users:', password);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
