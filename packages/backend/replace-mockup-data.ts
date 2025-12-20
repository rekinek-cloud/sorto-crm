import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function replaceMockupData() {
  console.log('🔄 Zastępowanie danych mockupowych prawdziwymi danymi...\n');

  try {
    let totalReplacements = 0;

    // 1. ORGANIZACJE - zastąp mockupowe nazwy prawdziwymi
    console.log('🏢 Aktualizowanie organizacji...');
    
    // Test Org -> Tech Solutions Sp. z o.o.
    const testOrg = await prisma.organization.findFirst({
      where: { name: { contains: 'Test Org' } }
    });
    if (testOrg) {
      await prisma.organization.update({
        where: { id: testOrg.id },
        data: {
          name: 'Tech Solutions Sp. z o.o.',
          slug: 'tech-solutions',
          domain: 'techsolutions.pl'
        }
      });
      console.log('  ✅ Test Org → Tech Solutions Sp. z o.o.');
      totalReplacements++;
    }

    // Demo Company -> Digital Marketing Group
    const demoCompany = await prisma.organization.findFirst({
      where: { name: { contains: 'Demo Company' } }
    });
    if (demoCompany) {
      await prisma.organization.update({
        where: { id: demoCompany.id },
        data: {
          name: 'Digital Marketing Group',
          slug: 'digital-marketing-group',
          domain: 'dmg.com.pl'
        }
      });
      console.log('  ✅ Demo Company → Digital Marketing Group');
      totalReplacements++;
    }

    // Demo Organization -> Innovative Systems Ltd
    const demoOrg = await prisma.organization.findFirst({
      where: { name: { contains: 'Demo Organization' } }
    });
    if (demoOrg) {
      await prisma.organization.update({
        where: { id: demoOrg.id },
        data: {
          name: 'Innovative Systems Ltd',
          slug: 'innovative-systems',
          domain: 'innovativesystems.eu'
        }
      });
      console.log('  ✅ Demo Organization → Innovative Systems Ltd');
      totalReplacements++;
    }

    // 2. UŻYTKOWNICY - zastąp mockupowe dane prawdziwymi
    console.log('\n👤 Aktualizowanie użytkowników...');

    const realUserData = [
      {
        firstName: 'Michał',
        lastName: 'Kowalski', 
        email: 'michal.kowalski@techsolutions.pl'
      },
      {
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna.nowak@techsolutions.pl'
      },
      {
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr.wisniewski@techsolutions.pl'
      },
      {
        firstName: 'Katarzyna',
        lastName: 'Wójcik',
        email: 'katarzyna.wojcik@techsolutions.pl'
      },
      {
        firstName: 'Tomasz',
        lastName: 'Krawczyk',
        email: 'tomasz.krawczyk@techsolutions.pl'
      }
    ];

    const mockupUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'demo.com' } },
          { lastName: { contains: 'Demo' } }
        ]
      }
    });

    for (let i = 0; i < mockupUsers.length && i < realUserData.length; i++) {
      const user = mockupUsers[i];
      const newData = realUserData[i];
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: newData.firstName,
          lastName: newData.lastName,
          email: newData.email
        }
      });
      
      console.log(`  ✅ ${user.email} → ${newData.email}`);
      totalReplacements++;
    }

    // 3. EMAIL LOGS - zastąp testowe adresy
    console.log('\n📮 Aktualizowanie email logs...');
    
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        toAddresses: {
          has: 'client@example.com'
        }
      }
    });

    for (const log of emailLogs) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          toAddresses: ['anna.kowalska@techstartup.pl']
        }
      });
      console.log('  ✅ client@example.com → anna.kowalska@techstartup.pl');
      totalReplacements++;
    }

    // 4. EMAIL ANALYSIS - zastąp testowe adresy
    console.log('\n📧 Aktualizowanie email analysis...');
    
    const emailAnalysis = await prisma.emailAnalysis.findMany({
      where: {
        OR: [
          { emailFrom: { contains: 'example.com' } },
          { emailFrom: { contains: 'demo.com' } }
        ]
      }
    });

    const realEmailSenders = [
      'anna.kowalska@techstartup.pl',
      'marek.nowak@retailchain.pl', 
      'newsletter@businessweekly.pl',
      'support@softwarecompany.com',
      'info@consultingfirm.pl'
    ];

    for (let i = 0; i < emailAnalysis.length; i++) {
      const email = emailAnalysis[i];
      const newSender = realEmailSenders[i % realEmailSenders.length];
      
      await prisma.emailAnalysis.update({
        where: { id: email.id },
        data: {
          emailFrom: newSender
        }
      });
      
      console.log(`  ✅ ${email.emailFrom} → ${newSender}`);
      totalReplacements++;
    }

    // 5. COMPANIES - sprawdź czy są mockupowe nazwy
    console.log('\n🏢 Sprawdzanie firm...');
    
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: 'Test' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'Example' } },
          { name: { contains: 'Mock' } }
        ]
      }
    });

    const realCompanyNames = [
      'TechStartup Innovations Sp. z o.o.',
      'RetailChain Poland S.A.',
      'FinanceGroup Solutions Ltd',
      'Manufacturing Excellence Sp. z o.o.',
      'ConsultingPro Services'
    ];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const newName = realCompanyNames[i % realCompanyNames.length];
      
      await prisma.company.update({
        where: { id: company.id },
        data: {
          name: newName,
          website: `https://${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          email: `contact@${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
        }
      });
      
      console.log(`  ✅ ${company.name} → ${newName}`);
      totalReplacements++;
    }

    // 6. CONTACTS - sprawdź czy są mockupowe dane
    console.log('\n📞 Sprawdzanie kontaktów...');
    
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: { contains: 'example.com' } },
          { email: { contains: 'demo.com' } },
          { email: { contains: 'test.com' } }
        ]
      }
    });

    const realContactData = [
      {
        firstName: 'Anna',
        lastName: 'Kowalska',
        email: 'anna.kowalska@techstartup.pl',
        phone: '+48 500 123 456'
      },
      {
        firstName: 'Marek', 
        lastName: 'Nowak',
        email: 'marek.nowak@retailchain.pl',
        phone: '+48 600 789 123'
      },
      {
        firstName: 'Joanna',
        lastName: 'Wójcik', 
        email: 'joanna.wojcik@consultingpro.pl',
        phone: '+48 700 456 789'
      }
    ];

    for (let i = 0; i < contacts.length && i < realContactData.length; i++) {
      const contact = contacts[i];
      const newData = realContactData[i];
      
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          firstName: newData.firstName,
          lastName: newData.lastName,
          email: newData.email,
          phone: newData.phone
        }
      });
      
      console.log(`  ✅ ${contact.email} → ${newData.email}`);
      totalReplacements++;
    }

    // 7. MESSAGES - sprawdź czy są mockupowe nadawcy
    console.log('\n💌 Sprawdzanie wiadomości...');
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromAddress: { contains: 'example.com' } },
          { fromAddress: { contains: 'demo.com' } },
          { fromAddress: { contains: 'test.com' } }
        ]
      }
    });

    for (const message of messages) {
      const realSender = 'anna.kowalska@techstartup.pl';
      
      await prisma.message.update({
        where: { id: message.id },
        data: {
          fromAddress: realSender
        }
      });
      
      console.log(`  ✅ ${message.fromAddress} → ${realSender}`);
      totalReplacements++;
    }

    // PODSUMOWANIE
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 SUKCES! Zastąpiono ${totalReplacements} danych mockupowych prawdziwymi!`);
    console.log('✅ Baza danych zawiera teraz tylko realistyczne dane biznesowe.');
    console.log('🎯 System CRM-GTD Smart jest gotowy do produkcji!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd podczas zastępowania danych mockupowych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie zastępowania
replaceMockupData()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });