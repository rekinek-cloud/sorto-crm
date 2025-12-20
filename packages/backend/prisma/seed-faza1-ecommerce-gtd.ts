import { PrismaClient, ProductStatus, ServiceStatus, ServiceBillingType, ServiceDeliveryMethod, 
         OrderStatus, InvoiceStatus, OfferStatus, OfferItemType, TaskStatus, Priority, 
         EnergyLevel, SomedayMaybeCategory, SomedayMaybeStatus, WaitingForStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Faza 1: E-commerce & GTD Advanced seeding...');

  // Get existing organization
  const organization = await prisma.organization.findFirst({
    where: { slug: 'demo-org' }
  });

  if (!organization) {
    throw new Error('Organization not found. Run basic seed first.');
  }

  // Get existing users
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id }
  });

  if (users.length === 0) {
    throw new Error('No users found. Run basic seed first.');
  }

  const primaryUser = users[0];

  // ================================
  // E-COMMERCE SYSTEM (8 tabel)
  // ================================

  console.log('📦 Creating Products...');
  
  // Products - CRM-GTD System variations
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'CRM-GTD Smart Basic',
        description: 'Podstawowa licencja systemu CRM-GTD Smart dla małych zespołów (do 5 użytkowników)',
        sku: 'CRM-GTD-BASIC-001',
        category: 'Software',
        subcategory: 'CRM Systems',
        price: 299.00,
        cost: 50.00,
        currency: 'USD',
        stockQuantity: 999,
        minStockLevel: 10,
        trackInventory: true,
        unit: 'license',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        tags: ['crm', 'gtd', 'productivity', 'basic'],
        images: ['/images/products/crm-gtd-basic.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.product.create({
      data: {
        name: 'CRM-GTD Smart Pro',
        description: 'Profesjonalna licencja z zaawansowanymi funkcjami AI i automatyzacji (do 25 użytkowników)',
        sku: 'CRM-GTD-PRO-001',
        category: 'Software',
        subcategory: 'CRM Systems',
        price: 599.00,
        cost: 100.00,
        currency: 'USD',
        stockQuantity: 999,
        minStockLevel: 5,
        trackInventory: true,
        unit: 'license',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        tags: ['crm', 'gtd', 'productivity', 'professional', 'ai'],
        images: ['/images/products/crm-gtd-pro.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.product.create({
      data: {
        name: 'CRM-GTD Smart Enterprise',
        description: 'Licencja Enterprise z pełnym dostępem do wszystkich funkcji (nieograniczona liczba użytkowników)',
        sku: 'CRM-GTD-ENT-001',
        category: 'Software',
        subcategory: 'CRM Systems',
        price: 1299.00,
        cost: 200.00,
        currency: 'USD',
        stockQuantity: 999,
        minStockLevel: 2,
        trackInventory: true,
        unit: 'license',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        tags: ['crm', 'gtd', 'productivity', 'enterprise', 'unlimited'],
        images: ['/images/products/crm-gtd-enterprise.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.product.create({
      data: {
        name: 'Voice TTS Add-on',
        description: 'Dodatek do syntezy mowy - czytanie wiadomości i dokumentów na głos',
        sku: 'VOICE-TTS-ADDON-001',
        category: 'Software',
        subcategory: 'Add-ons',
        price: 49.00,
        cost: 10.00,
        currency: 'USD',
        stockQuantity: 999,
        minStockLevel: 50,
        trackInventory: true,
        unit: 'license',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: false,
        tags: ['voice', 'tts', 'accessibility', 'addon'],
        images: ['/images/products/voice-tts-addon.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.product.create({
      data: {
        name: 'Smart Mailboxes Premium',
        description: 'Zaawansowane funkcje Smart Mailboxes z AI i automatycznym przetwarzaniem',
        sku: 'SMART-MAIL-PREM-001',
        category: 'Software',
        subcategory: 'Communication',
        price: 99.00,
        cost: 20.00,
        currency: 'USD',
        stockQuantity: 999,
        minStockLevel: 25,
        trackInventory: true,
        unit: 'license',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: false,
        tags: ['email', 'automation', 'ai', 'premium'],
        images: ['/images/products/smart-mailboxes.jpg'],
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${products.length} products`);

  console.log('🔧 Creating Services...');
  
  // Services - Professional services related to CRM-GTD
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'CRM-GTD Implementation',
        description: 'Profesjonalne wdrożenie systemu CRM-GTD z konfiguracją, migracją danych i szkoleniem zespołu',
        category: 'Consulting',
        subcategory: 'Implementation',
        price: 2500.00,
        cost: 800.00,
        currency: 'USD',
        billingType: ServiceBillingType.PROJECT_BASED,
        duration: 14400, // 240 hours (6 weeks)
        unit: 'project',
        deliveryMethod: ServiceDeliveryMethod.HYBRID,
        estimatedDeliveryDays: 42,
        status: ServiceStatus.AVAILABLE,
        isActive: true,
        isFeatured: true,
        requirements: JSON.stringify({
          skills: ['CRM systems', 'GTD methodology', 'Data migration'],
          tools: ['Project management', 'Training materials'],
          team: ['Implementation consultant', 'Technical specialist']
        }),
        resources: JSON.stringify({
          teamMembers: 2,
          tools: ['CRM-GTD system', 'Migration tools', 'Training platform'],
          timeline: '6 weeks'
        }),
        tags: ['implementation', 'consulting', 'training', 'migration'],
        images: ['/images/services/implementation.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.service.create({
      data: {
        name: 'GTD Productivity Training',
        description: 'Kompleksowe szkolenie z metodologii Getting Things Done i korzystania z systemu CRM-GTD',
        category: 'Training',
        subcategory: 'Productivity',
        price: 150.00,
        cost: 40.00,
        currency: 'USD',
        billingType: ServiceBillingType.HOURLY,
        duration: 480, // 8 hours
        unit: 'hour',
        deliveryMethod: ServiceDeliveryMethod.REMOTE,
        estimatedDeliveryDays: 1,
        status: ServiceStatus.AVAILABLE,
        isActive: true,
        isFeatured: true,
        requirements: JSON.stringify({
          skills: ['GTD methodology', 'Training delivery', 'Productivity coaching'],
          tools: ['Video conferencing', 'Training materials', 'Practice exercises']
        }),
        resources: JSON.stringify({
          trainer: 'Certified GTD coach',
          materials: 'Digital workbook and templates',
          followUp: '30-day email support'
        }),
        tags: ['training', 'gtd', 'productivity', 'remote'],
        images: ['/images/services/gtd-training.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.service.create({
      data: {
        name: 'Technical Support Premium',
        description: 'Priorytetowe wsparcie techniczne z czasem odpowiedzi do 2 godzin i dedykowanym opiekunem',
        category: 'Support',
        subcategory: 'Technical',
        price: 299.00,
        cost: 60.00,
        currency: 'USD',
        billingType: ServiceBillingType.MONTHLY,
        duration: 43200, // 720 hours (30 days)
        unit: 'month',
        deliveryMethod: ServiceDeliveryMethod.REMOTE,
        estimatedDeliveryDays: 1,
        status: ServiceStatus.AVAILABLE,
        isActive: true,
        isFeatured: false,
        requirements: JSON.stringify({
          skills: ['Technical support', 'CRM-GTD expertise', 'Problem solving'],
          tools: ['Support ticketing', 'Remote access', 'Knowledge base']
        }),
        resources: JSON.stringify({
          supportTeam: 'Dedicated technical specialist',
          responseTime: '2 hours during business hours',
          channels: ['Email', 'Phone', 'Video call', 'Screen sharing']
        }),
        tags: ['support', 'technical', 'premium', 'dedicated'],
        images: ['/images/services/technical-support.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.service.create({
      data: {
        name: 'Custom Integration Development',
        description: 'Tworzenie niestandardowych integracji z zewnętrznymi systemami (API, webhooks, synchronizacja)',
        category: 'Development',
        subcategory: 'Integration',
        price: 200.00,
        cost: 80.00,
        currency: 'USD',
        billingType: ServiceBillingType.HOURLY,
        duration: 60, // 1 hour billing increment
        unit: 'hour',
        deliveryMethod: ServiceDeliveryMethod.REMOTE,
        estimatedDeliveryDays: 14,
        status: ServiceStatus.AVAILABLE,
        isActive: true,
        isFeatured: false,
        requirements: JSON.stringify({
          skills: ['API development', 'System integration', 'Webhook programming'],
          tools: ['Development environment', 'Testing tools', 'Documentation']
        }),
        resources: JSON.stringify({
          developer: 'Senior integration specialist',
          testing: 'Dedicated testing environment',
          documentation: 'Complete integration documentation'
        }),
        tags: ['development', 'integration', 'api', 'custom'],
        images: ['/images/services/custom-integration.jpg'],
        organizationId: organization.id
      }
    }),

    prisma.service.create({
      data: {
        name: 'Business Process Consultation',
        description: 'Analiza i optymalizacja procesów biznesowych z wykorzystaniem CRM-GTD i metodologii Lean/Agile',
        category: 'Consulting',
        subcategory: 'Business Process',
        price: 175.00,
        cost: 50.00,
        currency: 'USD',
        billingType: ServiceBillingType.HOURLY,
        duration: 60, // 1 hour sessions
        unit: 'hour',
        deliveryMethod: ServiceDeliveryMethod.HYBRID,
        estimatedDeliveryDays: 7,
        status: ServiceStatus.AVAILABLE,
        isActive: true,
        isFeatured: true,
        requirements: JSON.stringify({
          skills: ['Business analysis', 'Process optimization', 'Lean/Agile methodologies'],
          tools: ['Process mapping', 'Analysis tools', 'Presentation materials']
        }),
        resources: JSON.stringify({
          consultant: 'Senior business process consultant',
          deliverables: 'Process maps, recommendations, implementation plan',
          followUp: 'Implementation support sessions'
        }),
        tags: ['consulting', 'process', 'optimization', 'business'],
        images: ['/images/services/business-consultation.jpg'],
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${services.length} services`);

  console.log('📋 Creating Orders...');
  
  // Orders - Sample customer orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-001',
        title: 'CRM-GTD Enterprise License + Implementation',
        description: 'Complete enterprise package with implementation services for TechCorp Inc.',
        customer: 'TechCorp Inc.',
        status: OrderStatus.CONFIRMED,
        priority: Priority.HIGH,
        value: 3799.00,
        currency: 'USD',
        subtotal: 3799.00,
        totalDiscount: 0.00,
        totalTax: 379.90,
        totalAmount: 4178.90,
        customerEmail: 'orders@techcorp.com',
        customerPhone: '+1-555-0123',
        customerAddress: '123 Tech Street, Silicon Valley, CA 94000',
        deliveryDate: new Date('2024-08-15'),
        deliveryAddress: '123 Tech Street, Silicon Valley, CA 94000',
        deliveryNotes: 'Implementation to start immediately after license activation',
        organizationId: organization.id
      }
    }),

    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-002',
        title: 'CRM-GTD Pro + Voice TTS Package',
        description: 'Professional license with Voice TTS add-on for marketing team',
        customer: 'Creative Solutions Ltd.',
        status: OrderStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        value: 648.00,
        currency: 'USD',
        subtotal: 648.00,
        totalDiscount: 48.00, // Early bird discount
        totalTax: 60.00,
        totalAmount: 660.00,
        customerEmail: 'procurement@creativesolutions.com',
        customerPhone: '+44-20-7123-4567',
        customerAddress: '456 Creative Ave, London, UK EC1A 1BB',
        deliveryDate: new Date('2024-07-25'),
        deliveryAddress: '456 Creative Ave, London, UK EC1A 1BB',
        deliveryNotes: 'Setup training session required for 15 team members',
        organizationId: organization.id
      }
    }),

    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-003',
        title: 'Multi-Department GTD Training Program',
        description: 'Comprehensive GTD training for 3 departments (Sales, Marketing, Operations)',
        customer: 'Global Dynamics Corporation',
        status: OrderStatus.PENDING,
        priority: Priority.MEDIUM,
        value: 4500.00,
        currency: 'USD',
        subtotal: 4500.00,
        totalDiscount: 450.00, // Volume discount 10%
        totalTax: 405.00,
        totalAmount: 4455.00,
        customerEmail: 'training@globaldynamics.com',
        customerPhone: '+1-212-555-0199',
        customerAddress: '789 Corporate Plaza, New York, NY 10001',
        deliveryDate: new Date('2024-09-01'),
        deliveryAddress: 'On-site at customer location',
        deliveryNotes: 'Training sessions spread over 6 weeks, 3 hours per department per week',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${orders.length} orders`);

  console.log('📑 Creating Order Items...');
  
  // Order Items - Line items for orders
  const orderItems = await Promise.all([
    // Order 1 items
    prisma.orderItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 1299.00,
        discount: 0.00,
        tax: 129.90,
        totalPrice: 1428.90,
        productId: products[2].id, // Enterprise license
        orderId: orders[0].id
      }
    }),
    prisma.orderItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 1,
        unitPrice: 2500.00,
        discount: 0.00,
        tax: 250.00,
        totalPrice: 2750.00,
        serviceId: services[0].id, // Implementation service
        orderId: orders[0].id
      }
    }),

    // Order 2 items
    prisma.orderItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 599.00,
        discount: 48.00,
        tax: 55.10,
        totalPrice: 606.10,
        productId: products[1].id, // Pro license
        orderId: orders[1].id
      }
    }),
    prisma.orderItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 49.00,
        discount: 0.00,
        tax: 4.90,
        totalPrice: 53.90,
        productId: products[3].id, // Voice TTS addon
        orderId: orders[1].id
      }
    }),

    // Order 3 items
    prisma.orderItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 30, // 30 hours of training
        unitPrice: 150.00,
        discount: 450.00, // Volume discount
        tax: 405.00,
        totalPrice: 4455.00,
        serviceId: services[1].id, // GTD Training
        orderId: orders[2].id
      }
    })
  ]);

  console.log(`✅ Created ${orderItems.length} order items`);

  console.log('💰 Creating Invoices...');
  
  // Invoices - For completed orders
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-001',
        title: 'CRM-GTD Enterprise Implementation - TechCorp Inc.',
        description: 'Enterprise license and professional implementation services',
        amount: 4178.90,
        currency: 'USD',
        status: InvoiceStatus.PAID,
        priority: Priority.HIGH,
        dueDate: new Date('2024-07-30'),
        subtotal: 3799.00,
        totalDiscount: 0.00,
        totalTax: 379.90,
        totalAmount: 4178.90,
        customerEmail: 'accounts@techcorp.com',
        customerPhone: '+1-555-0123',
        customerAddress: '123 Tech Street, Silicon Valley, CA 94000',
        paymentDate: new Date('2024-07-15'),
        paymentMethod: 'Bank Transfer',
        paymentNotes: 'Payment received via international wire transfer',
        organizationId: organization.id
      }
    }),

    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-002',
        title: 'CRM-GTD Pro + Voice TTS - Creative Solutions',
        description: 'Professional license with Voice TTS add-on package',
        amount: 660.00,
        currency: 'USD',
        status: InvoiceStatus.SENT,
        priority: Priority.MEDIUM,
        dueDate: new Date('2024-08-15'),
        subtotal: 648.00,
        totalDiscount: 48.00,
        totalTax: 60.00,
        totalAmount: 660.00,
        customerEmail: 'finance@creativesolutions.com',
        customerPhone: '+44-20-7123-4567',
        customerAddress: '456 Creative Ave, London, UK EC1A 1BB',
        paymentMethod: 'Credit Card',
        organizationId: organization.id
      }
    }),

    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024-003',
        title: 'Monthly Technical Support - July 2024',
        description: 'Premium technical support services for July 2024',
        amount: 328.90,
        currency: 'USD',
        status: InvoiceStatus.PENDING,
        priority: Priority.LOW,
        dueDate: new Date('2024-08-01'),
        subtotal: 299.00,
        totalDiscount: 0.00,
        totalTax: 29.90,
        totalAmount: 328.90,
        customerEmail: 'billing@techcorp.com',
        customerPhone: '+1-555-0123',
        customerAddress: '123 Tech Street, Silicon Valley, CA 94000',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  console.log('📄 Creating Invoice Items...');
  
  // Invoice Items - Line items for invoices
  const invoiceItems = await Promise.all([
    // Invoice 1 items (matches Order 1)
    prisma.invoiceItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 1299.00,
        discount: 0.00,
        tax: 129.90,
        totalPrice: 1428.90,
        productId: products[2].id, // Enterprise license
        invoiceId: invoices[0].id
      }
    }),
    prisma.invoiceItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 1,
        unitPrice: 2500.00,
        discount: 0.00,
        tax: 250.00,
        totalPrice: 2750.00,
        serviceId: services[0].id, // Implementation service
        invoiceId: invoices[0].id
      }
    }),

    // Invoice 2 items (matches Order 2)
    prisma.invoiceItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 599.00,
        discount: 48.00,
        tax: 55.10,
        totalPrice: 606.10,
        productId: products[1].id, // Pro license
        invoiceId: invoices[1].id
      }
    }),
    prisma.invoiceItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 49.00,
        discount: 0.00,
        tax: 4.90,
        totalPrice: 53.90,
        productId: products[3].id, // Voice TTS addon
        invoiceId: invoices[1].id
      }
    }),

    // Invoice 3 items (monthly support)
    prisma.invoiceItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 1,
        unitPrice: 299.00,
        discount: 0.00,
        tax: 29.90,
        totalPrice: 328.90,
        serviceId: services[2].id, // Technical Support
        invoiceId: invoices[2].id
      }
    })
  ]);

  console.log(`✅ Created ${invoiceItems.length} invoice items`);

  console.log('💼 Creating Offers...');
  
  // Offers - Sales quotes for prospects
  const offers = await Promise.all([
    prisma.offer.create({
      data: {
        offerNumber: 'QUO-2024-001',
        title: 'CRM-GTD Smart Pro - Startup Package',
        description: 'Complete productivity solution for growing startup companies',
        status: OfferStatus.SENT,
        priority: Priority.HIGH,
        subtotal: 1098.00,
        totalDiscount: 98.00, // Startup discount
        totalTax: 100.00,
        totalAmount: 1100.00,
        currency: 'USD',
        validUntil: new Date('2024-08-31'),
        sentDate: new Date('2024-07-01'),
        customerName: 'InnovateTech Startup',
        customerEmail: 'ceo@innovatetech.com',
        customerPhone: '+1-650-555-0142',
        customerAddress: '321 Innovation Drive, Palo Alto, CA 94301',
        paymentTerms: 'Net 30 days from delivery',
        deliveryTerms: 'Digital delivery within 24 hours of payment',
        notes: 'Includes 3 months of free technical support for new startup clients',
        createdById: primaryUser.id,
        organizationId: organization.id
      }
    }),

    prisma.offer.create({
      data: {
        offerNumber: 'QUO-2024-002',
        title: 'Enterprise CRM-GTD + Custom Integration',
        description: 'Full enterprise solution with custom Salesforce integration',
        status: OfferStatus.SENT,
        priority: Priority.HIGH,
        subtotal: 5799.00,
        totalDiscount: 300.00, // Enterprise discount
        totalTax: 549.90,
        totalAmount: 6048.90,
        currency: 'USD',
        validUntil: new Date('2024-09-15'),
        sentDate: new Date('2024-07-10'),
        customerName: 'MegaCorp International',
        customerEmail: 'procurement@megacorp.com',
        customerPhone: '+1-800-555-0199',
        customerAddress: '1000 Corporate Way, New York, NY 10005',
        paymentTerms: 'Net 45 days, 50% upfront, 50% on delivery',
        deliveryTerms: 'Implementation within 8 weeks of contract signing',
        notes: 'Includes dedicated project manager and 24/7 enterprise support',
        createdById: primaryUser.id,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${offers.length} offers`);

  console.log('📝 Creating Offer Items...');
  
  // Offer Items - Line items for offers
  const offerItems = await Promise.all([
    // Offer 1 items (Startup package)
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 599.00,
        discount: 48.00, // Startup discount
        tax: 55.10,
        totalPrice: 606.10,
        productId: products[1].id, // Pro license
        offerId: offers[0].id
      }
    }),
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 99.00,
        discount: 10.00,
        tax: 8.90,
        totalPrice: 97.90,
        productId: products[4].id, // Smart Mailboxes Premium
        offerId: offers[0].id
      }
    }),
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 4, // 4 hours
        unitPrice: 150.00,
        discount: 50.00, // Startup support discount
        tax: 55.00,
        totalPrice: 655.00,
        serviceId: services[1].id, // GTD Training
        offerId: offers[0].id
      }
    }),

    // Offer 2 items (Enterprise package)
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.PRODUCT,
        quantity: 1,
        unitPrice: 1299.00,
        discount: 100.00,
        tax: 119.90,
        totalPrice: 1318.90,
        productId: products[2].id, // Enterprise license
        offerId: offers[1].id
      }
    }),
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 1,
        unitPrice: 2500.00,
        discount: 100.00,
        tax: 240.00,
        totalPrice: 2640.00,
        serviceId: services[0].id, // Implementation service
        offerId: offers[1].id
      }
    }),
    prisma.offerItem.create({
      data: {
        itemType: OfferItemType.SERVICE,
        quantity: 15, // 15 hours custom integration
        unitPrice: 200.00,
        discount: 100.00, // Volume discount
        tax: 290.00,
        totalPrice: 2990.00,
        serviceId: services[3].id, // Custom Integration
        offerId: offers[1].id
      }
    })
  ]);

  console.log(`✅ Created ${offerItems.length} offer items`);

  // ================================
  // GTD ADVANCED SYSTEM (6 tabel)
  // ================================

  console.log('🎯 Creating Next Actions...');
  
  // Next Actions - specific actionable items
  const nextActions = await Promise.all([
    prisma.nextAction.create({
      data: {
        title: 'Call John Smith about Enterprise demo',
        description: 'Follow up on enterprise demo request from MegaCorp. Discuss specific requirements and timeline.',
        context: '@calls',
        priority: Priority.HIGH,
        energy: EnergyLevel.MEDIUM,
        estimatedTime: '30min',
        status: TaskStatus.NEW,
        dueDate: new Date('2024-07-18'),
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.nextAction.create({
      data: {
        title: 'Update product pricing spreadsheet',
        description: 'Revise Q3 pricing for all CRM-GTD products based on market analysis',
        context: '@computer',
        priority: Priority.MEDIUM,
        energy: EnergyLevel.LOW,
        estimatedTime: '1h',
        status: TaskStatus.IN_PROGRESS,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.nextAction.create({
      data: {
        title: 'Review Voice TTS integration documentation',
        description: 'Technical review of new Voice TTS features before next release',
        context: '@reading',
        priority: Priority.MEDIUM,
        energy: EnergyLevel.HIGH,
        estimatedTime: '45min',
        status: TaskStatus.NEW,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.nextAction.create({
      data: {
        title: 'Schedule team meeting for sprint planning',
        description: 'Coordinate calendars for next sprint planning session with development team',
        context: '@computer',
        priority: Priority.MEDIUM,
        energy: EnergyLevel.LOW,
        estimatedTime: '15min',
        status: TaskStatus.NEW,
        dueDate: new Date('2024-07-19'),
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.nextAction.create({
      data: {
        title: 'Pick up printed marketing materials',
        description: 'Collect new product brochures and trade show materials from print shop',
        context: '@errands',
        priority: Priority.LOW,
        energy: EnergyLevel.LOW,
        estimatedTime: '20min',
        status: TaskStatus.NEW,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.nextAction.create({
      data: {
        title: 'Research competitor pricing strategies',
        description: 'Online research of main competitors pricing models and feature comparison',
        context: '@online',
        priority: Priority.MEDIUM,
        energy: EnergyLevel.MEDIUM,
        estimatedTime: '2h',
        status: TaskStatus.NEW,
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    })
  ]);

  console.log(`✅ Created ${nextActions.length} next actions`);

  console.log('💡 Creating Someday/Maybe items...');
  
  // Someday/Maybe - ideas and future possibilities
  const somedayMaybe = await Promise.all([
    prisma.somedayMaybe.create({
      data: {
        title: 'Mobile app for CRM-GTD',
        description: 'Native mobile application for iOS and Android with offline capabilities',
        category: SomedayMaybeCategory.PROJECTS,
        priority: Priority.MEDIUM,
        status: SomedayMaybeStatus.ACTIVE,
        whenToReview: new Date('2024-12-01'),
        tags: ['mobile', 'app', 'development', 'offline'],
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.somedayMaybe.create({
      data: {
        title: 'AI-powered email auto-response system',
        description: 'Advanced AI that can automatically respond to common customer inquiries',
        category: SomedayMaybeCategory.IDEAS,
        priority: Priority.HIGH,
        status: SomedayMaybeStatus.ACTIVE,
        whenToReview: new Date('2024-09-15'),
        tags: ['ai', 'email', 'automation', 'customer-service'],
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.somedayMaybe.create({
      data: {
        title: 'Integration with Microsoft Teams',
        description: 'Deep integration with Teams for task management and notifications',
        category: SomedayMaybeCategory.PROJECTS,
        priority: Priority.MEDIUM,
        status: SomedayMaybeStatus.ACTIVE,
        whenToReview: new Date('2024-10-01'),
        tags: ['microsoft', 'teams', 'integration', 'collaboration'],
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.somedayMaybe.create({
      data: {
        title: 'Learn Spanish for international expansion',
        description: 'Personal goal to improve Spanish skills for Latin American market expansion',
        category: SomedayMaybeCategory.LEARNING,
        priority: Priority.LOW,
        status: SomedayMaybeStatus.ACTIVE,
        whenToReview: new Date('2025-01-01'),
        tags: ['learning', 'language', 'personal', 'international'],
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.somedayMaybe.create({
      data: {
        title: 'Blockchain-based task verification system',
        description: 'Explore blockchain technology for tamper-proof task completion records',
        category: SomedayMaybeCategory.IDEAS,
        priority: Priority.LOW,
        status: SomedayMaybeStatus.ARCHIVED,
        whenToReview: new Date('2025-06-01'),
        tags: ['blockchain', 'verification', 'research', 'innovation'],
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    })
  ]);

  console.log(`✅ Created ${somedayMaybe.length} someday/maybe items`);

  console.log('⏳ Creating Waiting For items...');
  
  // Waiting For - things we're waiting for from others
  const waitingFor = await Promise.all([
    prisma.waitingFor.create({
      data: {
        description: 'Legal approval for new enterprise contract terms',
        waitingForWho: 'Legal Department (Sarah Johnson)',
        sinceDate: new Date('2024-07-10'),
        expectedResponseDate: new Date('2024-07-25'),
        followUpDate: new Date('2024-07-22'),
        status: WaitingForStatus.PENDING,
        notes: 'Sent revised contract terms on July 10th. Critical for MegaCorp deal closure.',
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.waitingFor.create({
      data: {
        description: 'Customer feedback on Voice TTS beta features',
        waitingForWho: 'TechCorp Inc. (Michael Davis)',
        sinceDate: new Date('2024-07-08'),
        expectedResponseDate: new Date('2024-07-20'),
        followUpDate: new Date('2024-07-18'),
        status: WaitingForStatus.PENDING,
        notes: 'Beta version deployed on July 8th. Waiting for user acceptance testing results.',
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.waitingFor.create({
      data: {
        description: 'Server infrastructure pricing quote',
        waitingForWho: 'AWS Sales Team (Jennifer Clark)',
        sinceDate: new Date('2024-07-05'),
        expectedResponseDate: new Date('2024-07-15'),
        followUpDate: new Date('2024-07-16'),
        status: WaitingForStatus.OVERDUE,
        notes: 'Need pricing for enterprise tier infrastructure. Quote is overdue.',
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    }),

    prisma.waitingFor.create({
      data: {
        description: 'Translation of user interface to German',
        waitingForWho: 'LocalizeNow Agency (Hans Mueller)',
        sinceDate: new Date('2024-06-28'),
        expectedResponseDate: new Date('2024-07-12'),
        status: WaitingForStatus.RESPONDED,
        notes: 'German translation completed and delivered on July 12th. Quality review pending.',
        organizationId: organization.id,
        createdById: primaryUser.id
      }
    })
  ]);

  console.log(`✅ Created ${waitingFor.length} waiting for items`);

  console.log('👥 Creating Delegated Tasks...');
  
  // Delegated Tasks - tasks assigned to others
  const delegatedTasks = await Promise.all([
    prisma.delegatedTask.create({
      data: {
        description: 'Implement new customer onboarding flow in CRM module',
        delegatedTo: 'Development Team Lead (Alex Rodriguez)',
        delegatedOn: new Date('2024-07-12'),
        followUpDate: new Date('2024-07-26'),
        status: TaskStatus.IN_PROGRESS,
        notes: 'Sprint 15 priority task. Includes wireframes and technical specifications.',
        organizationId: organization.id
      }
    }),

    prisma.delegatedTask.create({
      data: {
        description: 'Create video tutorial series for GTD methodology',
        delegatedTo: 'Marketing Team (Lisa Chen)',
        delegatedOn: new Date('2024-07-09'),
        followUpDate: new Date('2024-07-23'),
        status: TaskStatus.NEW,
        notes: 'Series of 5 videos, 10-15 minutes each. Target completion by end of July.',
        organizationId: organization.id
      }
    }),

    prisma.delegatedTask.create({
      data: {
        description: 'Security audit of authentication system',
        delegatedTo: 'Security Consultant (Robert Kim)',
        delegatedOn: new Date('2024-07-01'),
        followUpDate: new Date('2024-07-15'),
        status: TaskStatus.COMPLETED,
        notes: 'Comprehensive security review completed. Report shows all critical items resolved.',
        organizationId: organization.id
      }
    }),

    prisma.delegatedTask.create({
      data: {
        description: 'Update product documentation with Voice TTS features',
        delegatedTo: 'Technical Writer (Emma Wilson)',
        delegatedOn: new Date('2024-07-14'),
        followUpDate: new Date('2024-07-21'),
        status: TaskStatus.IN_PROGRESS,
        notes: 'Documentation for all new Voice TTS capabilities and integration guide.',
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${delegatedTasks.length} delegated tasks`);

  console.log('🎯 Creating Focus Modes...');
  
  // Focus Modes - different concentration modes for productivity
  const focusModes = await Promise.all([
    prisma.focusMode.create({
      data: {
        name: 'Deep Work - Development',
        duration: 120, // 2 hours
        energyLevel: EnergyLevel.HIGH,
        contextName: '@computer',
        estimatedTimeMax: 180, // up to 3 hours
        category: 'Development',
        priority: Priority.HIGH,
        tags: ['development', 'coding', 'deep-work', 'concentration'],
        organizationId: organization.id
      }
    }),

    prisma.focusMode.create({
      data: {
        name: 'Communication Sprint',
        duration: 45, // 45 minutes
        energyLevel: EnergyLevel.MEDIUM,
        contextName: '@calls',
        estimatedTimeMax: 60, // up to 1 hour
        category: 'Communication',
        priority: Priority.HIGH,
        tags: ['calls', 'email', 'communication', 'sprint'],
        organizationId: organization.id
      }
    }),

    prisma.focusMode.create({
      data: {
        name: 'Creative Brainstorming',
        duration: 90, // 1.5 hours
        energyLevel: EnergyLevel.HIGH,
        contextName: '@whiteboard',
        estimatedTimeMax: 120, // up to 2 hours
        category: 'Creative',
        priority: Priority.MEDIUM,
        tags: ['brainstorming', 'creative', 'ideation', 'planning'],
        organizationId: organization.id
      }
    }),

    prisma.focusMode.create({
      data: {
        name: 'Administrative Tasks',
        duration: 60, // 1 hour
        energyLevel: EnergyLevel.LOW,
        contextName: '@computer',
        estimatedTimeMax: 90, // up to 1.5 hours
        category: 'Administrative',
        priority: Priority.LOW,
        tags: ['admin', 'paperwork', 'routine', 'maintenance'],
        organizationId: organization.id
      }
    }),

    prisma.focusMode.create({
      data: {
        name: 'Learning & Research',
        duration: 75, // 1 hour 15 minutes
        energyLevel: EnergyLevel.MEDIUM,
        contextName: '@reading',
        estimatedTimeMax: 120, // up to 2 hours
        category: 'Learning',
        priority: Priority.MEDIUM,
        tags: ['research', 'learning', 'reading', 'study'],
        organizationId: organization.id
      }
    }),

    prisma.focusMode.create({
      data: {
        name: 'Client Meetings',
        duration: 60, // 1 hour
        energyLevel: EnergyLevel.HIGH,
        contextName: '@meetings',
        estimatedTimeMax: 90, // up to 1.5 hours
        category: 'Meetings',
        priority: Priority.HIGH,
        tags: ['meetings', 'clients', 'presentations', 'sales'],
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${focusModes.length} focus modes`);

  console.log('📅 Creating Weekly Reviews...');
  
  // Weekly Reviews - GTD weekly review records
  const weeklyReviews = await Promise.all([
    prisma.weeklyReview.create({
      data: {
        reviewDate: new Date('2024-07-08'), // Previous Monday
        completedTasksCount: 23,
        newTasksCount: 15,
        stalledTasks: 3,
        nextActions: 'Focus on MegaCorp enterprise deal. Need to resolve legal contract terms and complete technical demo.',
        notes: 'Good productivity week. Voice TTS feature is making good progress. Need to follow up on overdue items.',
        collectLoosePapers: true,
        processNotes: true,
        emptyInbox: true,
        processVoicemails: true,
        reviewActionLists: true,
        reviewCalendar: true,
        reviewProjects: true,
        reviewWaitingFor: true,
        reviewSomedayMaybe: false, // Skipped this week
        organizationId: organization.id
      }
    }),

    prisma.weeklyReview.create({
      data: {
        reviewDate: new Date('2024-07-01'), // Two weeks ago
        completedTasksCount: 18,
        newTasksCount: 22,
        stalledTasks: 5,
        nextActions: 'Complete Q2 product roadmap. Schedule customer feedback sessions for Voice TTS beta.',
        notes: 'Busy week with multiple product launches. Some items carried over due to priority shifts.',
        collectLoosePapers: true,
        processNotes: true,
        emptyInbox: false, // Missed this step
        processVoicemails: true,
        reviewActionLists: true,
        reviewCalendar: true,
        reviewProjects: true,
        reviewWaitingFor: true,
        reviewSomedayMaybe: true,
        organizationId: organization.id
      }
    }),

    prisma.weeklyReview.create({
      data: {
        reviewDate: new Date('2024-06-24'), // Three weeks ago
        completedTasksCount: 31,
        newTasksCount: 12,
        stalledTasks: 2,
        nextActions: 'Excellent productivity week. Continue momentum on enterprise features development.',
        notes: 'Best week in terms of completion rate. Team collaboration was outstanding.',
        collectLoosePapers: true,
        processNotes: true,
        emptyInbox: true,
        processVoicemails: true,
        reviewActionLists: true,
        reviewCalendar: true,
        reviewProjects: true,
        reviewWaitingFor: true,
        reviewSomedayMaybe: true,
        organizationId: organization.id
      }
    }),

    prisma.weeklyReview.create({
      data: {
        reviewDate: new Date('2024-07-15'), // Current week
        completedTasksCount: 19,
        newTasksCount: 28,
        stalledTasks: 4,
        nextActions: 'Heavy incoming workload. Need to prioritize MegaCorp deal and Voice TTS release preparation.',
        notes: 'High volume of new requests. Some items moved to Someday/Maybe to maintain focus.',
        collectLoosePapers: true,
        processNotes: true,
        emptyInbox: true,
        processVoicemails: true,
        reviewActionLists: true,
        reviewCalendar: false, // Interrupted this week
        reviewProjects: true,
        reviewWaitingFor: true,
        reviewSomedayMaybe: true,
        organizationId: organization.id
      }
    })
  ]);

  console.log(`✅ Created ${weeklyReviews.length} weekly reviews`);

  // ================================
  // SUMMARY
  // ================================

  const totalRecords = 
    products.length + 
    services.length + 
    orders.length + 
    orderItems.length + 
    invoices.length + 
    invoiceItems.length + 
    offers.length + 
    offerItems.length +
    nextActions.length +
    somedayMaybe.length +
    waitingFor.length +
    delegatedTasks.length +
    focusModes.length +
    weeklyReviews.length;

  console.log(`\n🎉 Faza 1 completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   E-commerce System: ${products.length + services.length + orders.length + orderItems.length + invoices.length + invoiceItems.length + offers.length + offerItems.length} records`);
  console.log(`   GTD Advanced: ${nextActions.length + somedayMaybe.length + waitingFor.length + delegatedTasks.length + focusModes.length + weeklyReviews.length} records`);
  console.log(`   Total records created: ${totalRecords}`);
  console.log(`\n✅ Ready for Faza 2: CRM Extended & Project Management`);
}

main()
  .catch((e) => {
    console.error('❌ Error in Faza 1 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });