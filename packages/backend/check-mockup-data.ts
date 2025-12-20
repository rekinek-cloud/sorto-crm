import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMockupData() {
  console.log('🔍 Sprawdzanie danych mockupowych w bazie danych...\n');

  try {
    const mockupPatterns = [
      'test', 'mock', 'example', 'demo', 'sample', 'fake', 'dummy',
      'Test', 'Mock', 'Example', 'Demo', 'Sample', 'Fake', 'Dummy',
      'TEST', 'MOCK', 'EXAMPLE', 'DEMO', 'SAMPLE', 'FAKE', 'DUMMY'
    ];

    const foundMockups: any[] = [];

    // 1. Sprawdź organizacje
    console.log('🏢 Sprawdzanie organizacji...');
    const organizations = await prisma.organization.findMany();
    organizations.forEach(org => {
      mockupPatterns.forEach(pattern => {
        if (org.name.includes(pattern) || org.slug.includes(pattern) || org.domain?.includes(pattern)) {
          foundMockups.push({
            table: 'Organization',
            id: org.id,
            field: org.name.includes(pattern) ? 'name' : org.slug.includes(pattern) ? 'slug' : 'domain',
            value: org.name.includes(pattern) ? org.name : org.slug.includes(pattern) ? org.slug : org.domain,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 2. Sprawdź użytkowników
    console.log('👤 Sprawdzanie użytkowników...');
    const users = await prisma.user.findMany();
    users.forEach(user => {
      mockupPatterns.forEach(pattern => {
        if (user.email.includes(pattern) || user.firstName.includes(pattern) || user.lastName.includes(pattern)) {
          foundMockups.push({
            table: 'User',
            id: user.id,
            field: user.email.includes(pattern) ? 'email' : user.firstName.includes(pattern) ? 'firstName' : 'lastName',
            value: user.email.includes(pattern) ? user.email : user.firstName.includes(pattern) ? user.firstName : user.lastName,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
      
      // Sprawdź typowe testowe domeny
      const testDomains = ['example.com', 'test.com', 'mock.com', 'demo.com', 'sample.com'];
      testDomains.forEach(domain => {
        if (user.email.includes(domain)) {
          foundMockups.push({
            table: 'User',
            id: user.id,
            field: 'email',
            value: user.email,
            issue: `Testowa domena: ${domain}`
          });
        }
      });
    });

    // 3. Sprawdź kontakty
    console.log('📞 Sprawdzanie kontaktów...');
    const contacts = await prisma.contact.findMany();
    contacts.forEach(contact => {
      mockupPatterns.forEach(pattern => {
        if (contact.email.includes(pattern) || contact.firstName.includes(pattern) || contact.lastName.includes(pattern)) {
          foundMockups.push({
            table: 'Contact',
            id: contact.id,
            field: contact.email.includes(pattern) ? 'email' : contact.firstName.includes(pattern) ? 'firstName' : 'lastName',
            value: contact.email.includes(pattern) ? contact.email : contact.firstName.includes(pattern) ? contact.firstName : contact.lastName,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 4. Sprawdź firmy
    console.log('🏢 Sprawdzanie firm...');
    const companies = await prisma.company.findMany();
    companies.forEach(company => {
      mockupPatterns.forEach(pattern => {
        if (company.name.includes(pattern) || company.website?.includes(pattern) || company.email?.includes(pattern)) {
          foundMockups.push({
            table: 'Company',
            id: company.id,
            field: company.name.includes(pattern) ? 'name' : company.website?.includes(pattern) ? 'website' : 'email',
            value: company.name.includes(pattern) ? company.name : company.website?.includes(pattern) ? company.website : company.email,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 5. Sprawdź wiadomości
    console.log('💌 Sprawdzanie wiadomości...');
    const messages = await prisma.message.findMany();
    messages.forEach(message => {
      mockupPatterns.forEach(pattern => {
        const sender = message.sender || '';
        const content = message.content || '';
        if (sender.includes(pattern) || content.includes(pattern)) {
          foundMockups.push({
            table: 'Message',
            id: message.id,
            field: sender.includes(pattern) ? 'sender' : 'content',
            value: sender.includes(pattern) ? sender : content.substring(0, 50) + '...',
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 6. Sprawdź email analysis
    console.log('📧 Sprawdzanie email analysis...');
    const emailAnalysis = await prisma.emailAnalysis.findMany();
    emailAnalysis.forEach(email => {
      mockupPatterns.forEach(pattern => {
        if (email.emailFrom.includes(pattern) || email.emailSubject.includes(pattern)) {
          foundMockups.push({
            table: 'EmailAnalysis',
            id: email.id,
            field: email.emailFrom.includes(pattern) ? 'emailFrom' : 'emailSubject',
            value: email.emailFrom.includes(pattern) ? email.emailFrom : email.emailSubject,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 7. Sprawdź leads
    console.log('🎯 Sprawdzanie leads...');
    const leads = await prisma.lead.findMany();
    leads.forEach(lead => {
      mockupPatterns.forEach(pattern => {
        if (lead.title.includes(pattern)) {
          foundMockups.push({
            table: 'Lead',
            id: lead.id,
            field: 'title',
            value: lead.title,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 8. Sprawdź complaints
    console.log('❗ Sprawdzanie complaints...');
    const complaints = await prisma.complaint.findMany();
    complaints.forEach(complaint => {
      mockupPatterns.forEach(pattern => {
        if (complaint.customer.includes(pattern) || complaint.title.includes(pattern)) {
          foundMockups.push({
            table: 'Complaint',
            id: complaint.id,
            field: complaint.customer.includes(pattern) ? 'customer' : 'title',
            value: complaint.customer.includes(pattern) ? complaint.customer : complaint.title,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 9. Sprawdź files
    console.log('📁 Sprawdzanie plików...');
    const files = await prisma.file.findMany();
    files.forEach(file => {
      mockupPatterns.forEach(pattern => {
        if (file.fileName.includes(pattern) || file.urlPath.includes(pattern)) {
          foundMockups.push({
            table: 'File',
            id: file.id,
            field: file.fileName.includes(pattern) ? 'fileName' : 'urlPath',
            value: file.fileName.includes(pattern) ? file.fileName : file.urlPath,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // 10. Sprawdź email logs
    console.log('📮 Sprawdzanie email logs...');
    const emailLogs = await prisma.emailLog.findMany();
    emailLogs.forEach(log => {
      mockupPatterns.forEach(pattern => {
        const toAddresses = Array.isArray(log.toAddresses) ? log.toAddresses.join(',') : JSON.stringify(log.toAddresses);
        if (toAddresses.includes(pattern) || log.subject.includes(pattern)) {
          foundMockups.push({
            table: 'EmailLog',
            id: log.id,
            field: toAddresses.includes(pattern) ? 'toAddresses' : 'subject',
            value: toAddresses.includes(pattern) ? toAddresses : log.subject,
            issue: `Zawiera mockupowy pattern: ${pattern}`
          });
        }
      });
    });

    // PODSUMOWANIE
    console.log('\n' + '='.repeat(60));
    if (foundMockups.length === 0) {
      console.log('🎉 DOSKONALE! Nie znaleziono żadnych danych mockupowych!');
      console.log('✅ Baza danych zawiera tylko prawdziwe, realistyczne dane.');
    } else {
      console.log(`⚠️  ZNALEZIONO ${foundMockups.length} potencjalnych danych mockupowych:`);
      console.log('='.repeat(60));
      
      foundMockups.forEach((item, index) => {
        console.log(`${index + 1}. ${item.table}.${item.field}`);
        console.log(`   Wartość: "${item.value}"`);
        console.log(`   Problem: ${item.issue}`);
        console.log(`   ID: ${item.id}`);
        console.log('');
      });

      // Pogrupuj według tabel
      const byTable = foundMockups.reduce((acc, item) => {
        if (!acc[item.table]) acc[item.table] = [];
        acc[item.table].push(item);
        return acc;
      }, {} as any);

      console.log('📊 PODSUMOWANIE WEDŁUG TABEL:');
      Object.entries(byTable).forEach(([table, items]: [string, any[]]) => {
        console.log(`   ${table}: ${items.length} problemów`);
      });
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania danych mockupowych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie sprawdzania
checkMockupData()
  .catch((error) => {
    console.error('💥 Krytyczny błąd:', error);
    process.exit(1);
  });