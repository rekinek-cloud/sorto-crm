/**
 * Sample Users Data Seeder - JavaScript version
 * Tworzy przykładowych użytkowników z rolami i hierarchią organizacyjną
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Przykładowe dane użytkowników
const sampleUsers = [
  // ORGANIZACJA 1: Tech Solutions Sp. z o.o.
  {
    id: "user_owner_001",
    email: "michal.kowalski@techsolutions.pl",
    name: "Michał Kowalski",
    role: "OWNER",
    password: "TechSolutions2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    bio: "Założyciel i CEO Tech Solutions. 15 lat doświadczenia w branży IT.",
    department: "Executive",
    organizationName: "Tech Solutions Sp. z o.o.",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_admin_001",
    email: "anna.nowak@techsolutions.pl",
    name: "Anna Nowak",
    role: "ADMIN",
    password: "AdminTech2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b6cf03e6?w=400",
    bio: "HR Director i Administrator systemu. Zarządza zespołem i procesami.",
    department: "Human Resources",
    organizationName: "Tech Solutions Sp. z o.o.",
    managerId: "user_owner_001",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: true, push: true }
    }
  },
  
  {
    id: "user_manager_001",
    email: "piotr.wisniewski@techsolutions.pl",
    name: "Piotr Wiśniewski",
    role: "MANAGER",
    password: "DevManager2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    bio: "Team Lead projektów sviluppowych. Specjalista od Agile i Scrum.",
    department: "Development",
    organizationName: "Tech Solutions Sp. z o.o.",
    managerId: "user_admin_001",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_member_001",
    email: "katarzyna.wojcik@techsolutions.pl",
    name: "Katarzyna Wójcik",
    role: "MEMBER",
    password: "FullStack2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    bio: "Senior Developer Full-Stack. Specjalizuje się w React i Node.js.",
    department: "Development",
    organizationName: "Tech Solutions Sp. z o.o.",
    managerId: "user_manager_001",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: false }
    }
  },
  
  {
    id: "user_member_002",
    email: "tomasz.krawczyk@techsolutions.pl",
    name: "Tomasz Krawczyk",
    role: "MEMBER",
    password: "Designer2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    bio: "UX/UI Designer i Frontend Developer. Tworzy intuicyjne interfejsy.",
    department: "Design",
    organizationName: "Tech Solutions Sp. z o.o.",
    managerId: "user_manager_001",
    skills: ["Figma", "Adobe XD", "CSS", "JavaScript", "Vue.js"],
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_guest_001",
    email: "consultant@external.com",
    name: "Jan Konsultant",
    role: "GUEST",
    password: "Consultant2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    bio: "Zewnętrzny konsultant biznesowy. Dostęp tylko do odczytu projektów.",
    department: "External",
    organizationName: "Tech Solutions Sp. z o.o.",
    isExternal: true,
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: false, sms: false, push: false }
    }
  },

  // ORGANIZACJA 2: Digital Marketing Group
  {
    id: "user_owner_002",
    email: "ceo@digitalmarketing.pl",
    name: "Aleksandra Kowalczyk",
    role: "OWNER",
    password: "CEO_Marketing2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
    bio: "CEO Digital Marketing Group. Ekspert w digital transformation.",
    department: "Executive",
    organizationName: "Digital Marketing Group",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: true, push: true }
    }
  },
  
  {
    id: "user_admin_002",
    email: "admin@digitalmarketing.pl",
    name: "Marek Nowak",
    role: "ADMIN",
    password: "AdminMarketing2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400",
    bio: "COO i Administrator systemu. Zarządza operacjami i zespołem.",
    department: "Operations",
    organizationName: "Digital Marketing Group",
    managerId: "user_owner_002",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_manager_002",
    email: "marketing.lead@digitalmarketing.pl",
    name: "Joanna Wójcik",
    role: "MANAGER",
    password: "MarketingLead2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400",
    bio: "Marketing Director. Lider zespołu marketingu digitalnego.",
    department: "Marketing",
    organizationName: "Digital Marketing Group",
    managerId: "user_admin_002",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: true, push: false }
    }
  },
  
  {
    id: "user_member_003",
    email: "specialist@digitalmarketing.pl",
    name: "Łukasz Zieliński",
    role: "MEMBER",
    password: "SEO_Specialist2024!",
    isActive: true,
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    bio: "Digital Marketing Specialist. SEO, SEM, Social Media.",
    department: "Marketing",
    organizationName: "Digital Marketing Group",
    managerId: "user_manager_002",
    skills: ["SEO", "SEM", "Google Analytics", "Social Media", "Content Marketing"],
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: true, sms: false, push: true }
    }
  },
  
  {
    id: "user_member_004",
    email: "designer@digitalmarketing.pl",
    name: "Monika Kaczmarek",
    role: "MEMBER",
    password: "GraphicDesign2024!",
    isActive: false, // Przykład nieaktywnego użytkownika
    emailVerified: true,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b6cf03e6?w=400",
    bio: "Graphic Designer. Tworzy materiały wizualne do kampanii.",
    department: "Creative",
    organizationName: "Digital Marketing Group",
    managerId: "user_manager_002",
    skills: ["Photoshop", "Illustrator", "InDesign", "Figma", "Brand Design"],
    deactivatedReason: "Employee left company",
    preferences: {
      language: "pl",
      timezone: "Europe/Warsaw",
      notifications: { email: false, sms: false, push: false }
    }
  }
];

// Relacje hierarchiczne
const userRelations = [
  // Tech Solutions Hierarchy
  {
    managerId: "user_owner_001",
    employeeId: "user_admin_001",
    relationType: "MANAGES"
  },
  {
    managerId: "user_admin_001",
    employeeId: "user_manager_001", 
    relationType: "MANAGES"
  },
  {
    managerId: "user_manager_001",
    employeeId: "user_member_001",
    relationType: "LEADS"
  },
  {
    managerId: "user_manager_001",
    employeeId: "user_member_002",
    relationType: "LEADS"
  },
  
  // Cross-functional mentoring
  {
    managerId: "user_member_001",
    employeeId: "user_member_002",
    relationType: "MENTORS"
  },
  
  // Digital Marketing Group Hierarchy
  {
    managerId: "user_owner_002",
    employeeId: "user_admin_002",
    relationType: "MANAGES"
  },
  {
    managerId: "user_admin_002",
    employeeId: "user_manager_002",
    relationType: "MANAGES"
  },
  {
    managerId: "user_manager_002",
    employeeId: "user_member_003",
    relationType: "SUPERVISES"
  },
  {
    managerId: "user_manager_002",
    employeeId: "user_member_004",
    relationType: "SUPERVISES"
  }
];

// Dodatkowe uprawnienia
const userPermissions = [
  {
    userId: "user_member_001",
    permission: "projects.admin",
    resource: "projects",
    scope: "department",
    grantedBy: "user_manager_001"
  },
  {
    userId: "user_guest_001",
    permission: "projects.read",
    resource: "project_abc_123",
    scope: "resource",
    grantedBy: "user_admin_001"
  },
  {
    userId: "user_member_002",
    permission: "designs.admin",
    resource: "design_assets",
    scope: "organization",
    grantedBy: "user_admin_001"
  }
];

async function seedSampleUsers() {
  console.log('🌱 Starting sample users seeding...');
  
  try {
    // Znajdź lub utwórz organizacje
    const organizations = new Map();
    
    for (const user of sampleUsers) {
      if (!organizations.has(user.organizationName)) {
        let org = await prisma.organization.findFirst({
          where: { name: user.organizationName }
        });
        
        if (!org) {
          org = await prisma.organization.create({
            data: {
              name: user.organizationName,
              slug: user.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              settings: {},
              limits: {
                users: 50,
                streams: 100,
                tasks: 1000,
                projects: 50
              }
            }
          });
        }
        
        organizations.set(user.organizationName, org);
      }
    }
    
    console.log(`📊 Found/created ${organizations.size} organizations`);
    
    // Utwórz użytkowników
    for (const userData of sampleUsers) {
      const org = organizations.get(userData.organizationName);
      
      // Sprawdź czy użytkownik już istnieje
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash hasła
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Przygotuj dane użytkownika
      const { 
        name,
        password, 
        organizationName, 
        managerId, 
        skills, 
        deactivatedReason,
        isExternal,
        preferences,
        bio,
        department,
        ...userCreateData 
      } = userData;
      
      // Podziel name na firstName i lastName
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;
      
      const user = await prisma.user.create({
        data: {
          ...userCreateData,
          firstName,
          lastName,
          passwordHash: hashedPassword,
          organizationId: org.id,
          settings: {
            skills: skills || [],
            isExternal: isExternal || false,
            deactivatedReason: deactivatedReason || null,
            preferences: preferences || {}
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Created user: ${user.name} (${user.email}) - ${user.role}`);
    }
    
    console.log('👥 Users created successfully');
    
    // Utwórz relacje hierarchiczne
    console.log('🔗 Creating user relations...');
    
    for (const relation of userRelations) {
      try {
        // Sprawdź czy relacja już istnieje
        const existingRelation = await prisma.userRelation.findFirst({
          where: {
            managerId: relation.managerId,
            employeeId: relation.employeeId,
            relationType: relation.relationType
          }
        });
        
        if (existingRelation) {
          console.log(`⏭️  Relation ${relation.managerId} -> ${relation.employeeId} already exists`);
          continue;
        }
        
        await prisma.userRelation.create({
          data: {
            managerId: relation.managerId,
            employeeId: relation.employeeId,
            relationType: relation.relationType,
            isActive: true,
            establishedAt: new Date()
          }
        });
        
        console.log(`🔗 Created relation: ${relation.managerId} ${relation.relationType} ${relation.employeeId}`);
      } catch (error) {
        console.log(`⚠️  Could not create relation ${relation.managerId} -> ${relation.employeeId}: ${error.message}`);
      }
    }
    
    // Utwórz dodatkowe uprawnienia
    console.log('🔐 Creating user permissions...');
    
    for (const permission of userPermissions) {
      try {
        // Sprawdź czy uprawnienie już istnieje
        const existingPermission = await prisma.userPermission.findFirst({
          where: {
            userId: permission.userId,
            permission: permission.permission,
            resource: permission.resource
          }
        });
        
        if (existingPermission) {
          console.log(`⏭️  Permission ${permission.permission} for ${permission.userId} already exists`);
          continue;
        }
        
        await prisma.userPermission.create({
          data: {
            userId: permission.userId,
            permission: permission.permission,
            resource: permission.resource,
            scope: permission.scope,
            grantedBy: permission.grantedBy,
            grantedAt: new Date(),
            isActive: true
          }
        });
        
        console.log(`🔐 Created permission: ${permission.permission} for user ${permission.userId}`);
      } catch (error) {
        console.log(`⚠️  Could not create permission ${permission.permission} for ${permission.userId}: ${error.message}`);
      }
    }
    
    // Podsumowanie
    const totalUsers = await prisma.user.count();
    const totalOrganizations = await prisma.organization.count();
    
    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`🏢 Total organizations: ${totalOrganizations}`);
    
    // Statystyki według ról
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    console.log('\n📈 USERS BY ROLE:');
    roleStats.forEach(stat => {
      console.log(`${stat.role}: ${stat._count.role}`);
    });
    
    // Lista utworzonych użytkowników
    console.log('\n👥 CREATED USERS:');
    console.log('Tech Solutions Sp. z o.o.:');
    console.log('  📧 michal.kowalski@techsolutions.pl (OWNER) - hasło: TechSolutions2024!');
    console.log('  📧 anna.nowak@techsolutions.pl (ADMIN) - hasło: AdminTech2024!');
    console.log('  📧 piotr.wisniewski@techsolutions.pl (MANAGER) - hasło: DevManager2024!');
    console.log('  📧 katarzyna.wojcik@techsolutions.pl (MEMBER) - hasło: FullStack2024!');
    console.log('  📧 tomasz.krawczyk@techsolutions.pl (MEMBER) - hasło: Designer2024!');
    console.log('  📧 consultant@external.com (GUEST) - hasło: Consultant2024!');
    
    console.log('\nDigital Marketing Group:');
    console.log('  📧 ceo@digitalmarketing.pl (OWNER) - hasło: CEO_Marketing2024!');
    console.log('  📧 admin@digitalmarketing.pl (ADMIN) - hasło: AdminMarketing2024!');
    console.log('  📧 marketing.lead@digitalmarketing.pl (MANAGER) - hasło: MarketingLead2024!');
    console.log('  📧 specialist@digitalmarketing.pl (MEMBER) - hasło: SEO_Specialist2024!');
    console.log('  📧 designer@digitalmarketing.pl (MEMBER - INACTIVE) - hasło: GraphicDesign2024!');
    
    console.log('\n🎉 Sample users seeding completed successfully!');
    console.log('💡 Możesz teraz zalogować się używając powyższych danych logowania.');
    
  } catch (error) {
    console.error('❌ Error seeding sample users:', error);
    throw error;
  }
}

// Uruchom jeśli wywoływane bezpośrednio
if (require.main === module) {
  seedSampleUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = seedSampleUsers;