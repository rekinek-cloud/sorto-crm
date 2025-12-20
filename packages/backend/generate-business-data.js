const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma = new PrismaClient();

// Konfiguracja
const CONFIG = {
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-10-31'),
  leadsTarget: 300,
  ordersTarget: 150,
  offersTarget: 100,
  invoicesTarget: 200
};

// Helper funkcje
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateBusinessData() {
  console.log('🚀 Rozpoczynam generowanie danych biznesowych...\n');
  
  try {
    // Pobierz istniejące dane
    const existingOrgs = await prisma.organization.findMany();
    const existingUsers = await prisma.user.findMany();
    const existingContacts = await prisma.contact.findMany();
    const existingCompanies = await prisma.company.findMany();
    const existingProducts = await prisma.product.findMany();
    const existingServices = await prisma.service.findMany();
    
    console.log(`✅ Znaleziono: ${existingOrgs.length} organizacji, ${existingUsers.length} użytkowników, ${existingContacts.length} kontaktów, ${existingCompanies.length} firm\n`);
    
    // 1. Generuj LEADS
    console.log('🎯 Generuję leads...');
    const existingLeads = await prisma.lead.count();
    const leadsToCreate = CONFIG.leadsTarget - existingLeads;
    
    const leadStatuses = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const leadSources = ['Website', 'Referral', 'Cold Call', 'Event', 'Social Media', 'Partner', 'Advertisement'];
    const leadTitles = [
      'Enterprise CRM Implementation',
      'GTD Training Program',
      'Voice TTS Integration',
      'Custom Development Project',
      'Consulting Services',
      'Software License',
      'Support Contract',
      'Integration Services',
      'Data Migration',
      'System Upgrade'
    ];
    
    for (let i = 0; i < leadsToCreate; i++) {
      const org = randomElement(existingOrgs);
      const company = existingCompanies.length > 0 ? randomElement(existingCompanies) : null;
      const createdAt = randomDate(CONFIG.startDate, new Date());
      
      await prisma.lead.create({
        data: {
          title: `${randomElement(leadTitles)} - ${company?.name || faker.company.name()}`,
          description: faker.lorem.paragraph(),
          company: company?.name || faker.company.name(),
          contactPerson: faker.person.fullName(),
          status: randomElement(leadStatuses),
          priority: randomElement(['LOW', 'MEDIUM', 'HIGH']),
          source: randomElement(leadSources),
          value: randomInt(1000, 50000),
          organizationId: org.id,
          createdAt: createdAt
        }
      });
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Utworzono ${i + 1}/${leadsToCreate} leads...`);
      }
    }
    console.log(`✅ Utworzono ${leadsToCreate} nowych leads\n`);
    
    // 2. Generuj ORDERS
    console.log('📦 Generuję zamówienia...');
    const existingOrders = await prisma.order.count();
    const ordersToCreate = CONFIG.ordersTarget - existingOrders;
    
    const orderStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED', 'CANCELED'];
    const orderTitles = [
      'CRM-GTD Enterprise License',
      'Voice TTS Package',
      'Training Program',
      'Custom Integration',
      'Support Services',
      'Consulting Package',
      'Implementation Services',
      'Data Migration Package',
      'System Upgrade',
      'Multi-User License'
    ];
    
    for (let i = 0; i < ordersToCreate; i++) {
      const org = randomElement(existingOrgs);
      const company = existingCompanies.length > 0 ? randomElement(existingCompanies) : null;
      const createdAt = randomDate(CONFIG.startDate, new Date());
      const subtotal = randomInt(1000, 20000);
      const discount = Math.random() > 0.7 ? randomInt(50, 500) : 0;
      const tax = subtotal * 0.23; // 23% VAT
      const totalAmount = subtotal - discount + tax;
      
      await prisma.order.create({
        data: {
          orderNumber: `ORD-${new Date().getFullYear()}-${String(2000 + i).padStart(4, '0')}`,
          title: `${randomElement(orderTitles)} - ${company?.name || faker.company.name()}`,
          description: faker.lorem.paragraph(),
          customer: company?.name || faker.company.name(),
          status: randomElement(orderStatuses),
          priority: randomElement(['LOW', 'MEDIUM', 'HIGH']),
          value: totalAmount,
          currency: 'PLN',
          subtotal: subtotal,
          totalDiscount: discount,
          totalTax: tax,
          totalAmount: totalAmount,
          customerEmail: faker.internet.email(),
          customerPhone: faker.phone.number('+48 ### ### ###'),
          customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
          deliveryDate: Math.random() > 0.5 ? randomDate(createdAt, CONFIG.endDate) : null,
          deliveryAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
          organizationId: org.id,
          createdAt: createdAt
        }
      });
      
      if ((i + 1) % 25 === 0) {
        console.log(`  Utworzono ${i + 1}/${ordersToCreate} zamówień...`);
      }
    }
    console.log(`✅ Utworzono ${ordersToCreate} nowych zamówień\n`);
    
    // 3. Generuj OFFERS
    console.log('💼 Generuję oferty...');
    const existingOffers = await prisma.offer.count();
    const offersToCreate = CONFIG.offersTarget - existingOffers;
    
    const offerStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
    const offerTitles = [
      'Enterprise CRM Proposal',
      'GTD Implementation Quote',
      'Voice TTS Solution',
      'Custom Development Offer',
      'Annual Support Package',
      'Training Services Proposal',
      'Integration Services Quote',
      'Consulting Package Offer',
      'System Upgrade Proposal',
      'Multi-Department License'
    ];
    
    for (let i = 0; i < offersToCreate; i++) {
      const org = randomElement(existingOrgs);
      const creator = randomElement(existingUsers.filter(u => u.organizationId === org.id));
      const contact = existingContacts.length > 0 ? randomElement(existingContacts.filter(c => c.organizationId === org.id)) : null;
      const company = existingCompanies.length > 0 ? randomElement(existingCompanies.filter(c => c.organizationId === org.id)) : null;
      const createdAt = randomDate(CONFIG.startDate, new Date());
      const validUntil = randomDate(createdAt, CONFIG.endDate);
      const subtotal = randomInt(2000, 30000);
      const discount = Math.random() > 0.6 ? randomInt(100, 1000) : 0;
      const tax = subtotal * 0.23;
      const totalAmount = subtotal - discount + tax;
      
      await prisma.offer.create({
        data: {
          offerNumber: `OFF-${new Date().getFullYear()}-${String(2000 + i).padStart(4, '0')}`,
          title: `${randomElement(offerTitles)} - ${company?.name || faker.company.name()}`,
          description: faker.lorem.paragraphs(2),
          status: randomElement(offerStatuses),
          validUntil: validUntil,
          subtotal: subtotal,
          totalDiscount: discount,
          totalTax: tax,
          totalAmount: totalAmount,
          currency: 'PLN',
          customerName: company?.name || faker.company.name(),
          customerEmail: faker.internet.email(),
          customerPhone: faker.phone.number('+48 ### ### ###'),
          customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
          organizationId: org.id,
          contactId: contact?.id,
          companyId: company?.id,
          createdById: creator.id,
          createdAt: createdAt
        }
      });
      
      if ((i + 1) % 20 === 0) {
        console.log(`  Utworzono ${i + 1}/${offersToCreate} ofert...`);
      }
    }
    console.log(`✅ Utworzono ${offersToCreate} nowych ofert\n`);
    
    // 4. Generuj INVOICES
    console.log('📋 Generuję faktury...');
    const existingInvoices = await prisma.invoice.count();
    const invoicesToCreate = CONFIG.invoicesTarget - existingInvoices;
    
    const invoiceStatuses = ['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELED'];
    const paymentTerms = [7, 14, 30, 60];
    
    for (let i = 0; i < invoicesToCreate; i++) {
      const org = randomElement(existingOrgs);
      const createdAt = randomDate(CONFIG.startDate, new Date());
      const paymentTerm = randomElement(paymentTerms);
      const dueDate = new Date(createdAt.getTime() + paymentTerm * 24 * 60 * 60 * 1000);
      const subtotal = randomInt(1000, 25000);
      const discount = Math.random() > 0.8 ? randomInt(50, 500) : 0;
      const tax = subtotal * 0.23;
      const totalAmount = subtotal - discount + tax;
      const status = randomElement(invoiceStatuses);
      
      await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(2000 + i).padStart(4, '0')}`,
          title: `Invoice for ${faker.company.name()}`,
          description: faker.lorem.paragraph(),
          amount: totalAmount,
          status: status,
          dueDate: dueDate,
          paymentDate: status === 'PAID' ? randomDate(createdAt, dueDate) : null,
          subtotal: subtotal,
          totalDiscount: discount,
          totalTax: tax,
          totalAmount: totalAmount,
          currency: 'PLN',
          customerEmail: faker.internet.email(),
          customerPhone: faker.phone.number('+48 ### ### ###'),
          customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
          paymentMethod: randomElement(['BLIK', 'Przelew', 'Gotówka', 'Karta']),
          paymentNotes: `${paymentTerm} days payment terms`,
          organizationId: org.id,
          createdAt: createdAt
        }
      });
      
      if ((i + 1) % 30 === 0) {
        console.log(`  Utworzono ${i + 1}/${invoicesToCreate} faktur...`);
      }
    }
    console.log(`✅ Utworzono ${invoicesToCreate} nowych faktur\n`);
    
    console.log('🎉 Generowanie danych biznesowych zakończone!\n');
    
    // Podsumowanie
    console.log('📊 PODSUMOWANIE:');
    console.log(`  - Leads: ${leadsToCreate} nowych`);
    console.log(`  - Orders: ${ordersToCreate} nowych`);
    console.log(`  - Offers: ${offersToCreate} nowych`);
    console.log(`  - Invoices: ${invoicesToCreate} nowych`);
    
    const totalLeads = await prisma.lead.count();
    const totalOrders = await prisma.order.count();
    const totalOffers = await prisma.offer.count();
    const totalInvoices = await prisma.invoice.count();
    
    console.log('\n📈 STAN KOŃCOWY:');
    console.log(`  - Leads: ${totalLeads} łącznie`);
    console.log(`  - Orders: ${totalOrders} łącznie`);
    console.log(`  - Offers: ${totalOffers} łącznie`);
    console.log(`  - Invoices: ${totalInvoices} łącznie`);
    
  } catch (error) {
    console.error('❌ Błąd podczas generowania danych:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom generator
generateBusinessData()
  .then(() => console.log('\n✅ Generator danych biznesowych zakończony'))
  .catch(console.error);