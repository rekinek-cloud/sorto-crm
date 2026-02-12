/**
 * Migracja istniejących danych do struktury holdingowej
 *
 * Dla każdej Organization bez holdingId:
 * 1. Tworzy Holding
 * 2. Przypisuje Organization do Holdingu
 * 3. Tworzy Employee dla każdego User w tej Organization
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToHolding() {
  console.log('🚀 Starting migration to holding structure...\n');

  // 1. Znajdź organizacje bez holdingId
  const orgsWithoutHolding = await prisma.organization.findMany({
    where: { holdingId: null },
    include: {
      users: {
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      },
    },
  });

  console.log(`📦 Found ${orgsWithoutHolding.length} organizations without holding\n`);

  for (const org of orgsWithoutHolding) {
    console.log(`\n--- Processing: ${org.name} (${org.id}) ---`);

    // Znajdź ownera (OWNER rola)
    const owner = org.users.find(u => u.role === 'OWNER') || org.users[0];
    if (!owner) {
      console.log(`   ⚠️ No users found, skipping`);
      continue;
    }

    // 2. Utwórz Holding
    const holding = await prisma.holding.create({
      data: {
        name: org.name,
        ownerId: owner.id,
        settings: {
          allowCrossCompanyContacts: true,
          consolidatedReporting: true,
          sharedAIAgents: true,
        },
      },
    });
    console.log(`   ✅ Created holding: ${holding.name} (${holding.id})`);

    // 3. Przypisz Organization do Holdingu
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        holdingId: holding.id,
        shortName: org.name.substring(0, 10),
        color: '#3b82f6',
        companyType: 'OTHER',
      },
    });
    console.log(`   ✅ Linked organization to holding`);

    // 4. Utwórz Employee dla każdego User
    let employeeCount = 0;
    for (const user of org.users) {
      // Sprawdź czy Employee już istnieje
      const existing = await prisma.employee.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
      });

      if (!existing) {
        // Mapuj UserRole na EmployeeRole
        let employeeRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER' = 'EMPLOYEE';
        if (user.role === 'OWNER' || user.role === 'ADMIN') employeeRole = 'ADMIN';
        else if (user.role === 'MEMBER') employeeRole = 'EMPLOYEE';
        else if (user.role === 'GUEST') employeeRole = 'VIEWER';

        await prisma.employee.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            role: employeeRole,
            isActive: true,
          },
        });
        employeeCount++;
      }
    }
    console.log(`   ✅ Created ${employeeCount} employee records`);
  }

  // 5. Podsumowanie
  const totalHoldings = await prisma.holding.count();
  const totalEmployees = await prisma.employee.count();
  const orgsWithHolding = await prisma.organization.count({ where: { holdingId: { not: null } } });

  console.log(`\n\n✨ Migration completed!`);
  console.log(`   Holdings: ${totalHoldings}`);
  console.log(`   Organizations with holding: ${orgsWithHolding}`);
  console.log(`   Employee records: ${totalEmployees}`);
}

migrateToHolding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
