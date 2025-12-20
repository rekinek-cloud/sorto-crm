const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSqlDirect() {
  console.log('🗄️ BEZPOŚREDNIE SQL - wypełnianie przez raw SQL...\n');

  try {
    const organization = await prisma.organization.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!organization || !user) {
      throw new Error('Brak podstawowych danych w bazie!');
    }

    let successCount = 0;

    console.log('📊 Cel: +20 tabel przez bezpośrednie SQL');
    console.log('🎯 Stan: 35/97 → 55/97 (57%)\n');

    // 1. Invoice - przez SQL
    console.log('🧾 Invoice (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO invoices (id, invoice_number, title, customer, amount, status, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'INV-2025-001', 'CRM License', 'BigCorp Inc', 9999.99, 'SENT', ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ invoice: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  invoice SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 2. Offer - przez SQL
    console.log('\n💰 Offer (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO offers (id, offer_number, title, customer_name, status, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'OFF-2025-001', 'Enterprise Package', 'BigCorp Inc', 'DRAFT', ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ offer: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  offer SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 3. Message - przez SQL
    console.log('\n📧 Message (SQL)...');
    try {
      const channel = await prisma.communicationChannel.findFirst();
      if (channel) {
        await prisma.$executeRaw`
          INSERT INTO messages (id, channel_id, subject, content, from_address, to_addresses, status, organization_id, created_at, updated_at)
          VALUES (gen_random_uuid(), ${channel.id}, 'Project Update', 'Status update message', 'manager@company.com', ARRAY['team@company.com'], 'PROCESSED', ${organization.id}, NOW(), NOW())
        `;
        console.log('✅ message: 1 rekord (SQL)');
        successCount++;
      } else {
        console.log('⚠️  message: brak channel');
      }
    } catch (error) {
      console.log(`⚠️  message SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 4. Weekly Review - przez SQL
    console.log('\n📊 Weekly Review (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO weekly_reviews (id, review_date, completed_tasks_count, new_tasks_count, stalled_tasks, notes, collect_loose_papers, process_notes, empty_inbox, user_id, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), '2025-01-06', 15, 8, 2, 'Good week', true, true, true, ${user.id}, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ weeklyReview: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  weeklyReview SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 5. Bug Report - przez SQL
    console.log('\n🐛 Bug Report (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO bug_reports (id, title, description, severity, status, reported_by_id, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Login Issue', 'Login page loading slowly', 'MEDIUM', 'OPEN', ${user.id}, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ bugReport: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  bugReport SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 6. Activity - przez SQL
    console.log('\n📋 Activity (SQL)...');
    try {
      const task = await prisma.task.findFirst();
      await prisma.$executeRaw`
        INSERT INTO activities (id, type, description, entity_type, entity_id, user_id, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'TASK_CREATED', 'Created new task', 'TASK', ${task?.id || ''}, ${user.id}, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ activity: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  activity SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 7. Error Log - przez SQL
    console.log('\n⚠️ Error Log (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO error_logs (id, level, message, stack, user_id, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'WARNING', 'Database timeout', 'at Connection.timeout()', ${user.id}, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ errorLog: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  errorLog SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 8. Wiki Page - przez SQL
    console.log('\n📖 Wiki Page (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO wiki_pages (id, title, slug, content, is_public, author_id, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Getting Started', 'getting-started', 'Welcome guide...', true, ${user.id}, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ wikiPage: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  wikiPage SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 9. Email Rule - przez SQL
    console.log('\n📧 Email Rule (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO email_rules (id, name, description, conditions, actions, is_active, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Urgent Filter', 'Filter urgent emails', '{"subject_contains": "URGENT"}', '{"set_priority": "HIGH"}', true, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ emailRule: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailRule SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    // 10. Email Template - przez SQL
    console.log('\n📝 Email Template (SQL)...');
    try {
      await prisma.$executeRaw`
        INSERT INTO email_templates (id, name, subject, body, is_active, organization_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Welcome Email', 'Welcome!', 'Thank you for joining...', true, ${organization.id}, NOW(), NOW())
      `;
      console.log('✅ emailTemplate: 1 rekord (SQL)');
      successCount++;
    } catch (error) {
      console.log(`⚠️  emailTemplate SQL błąd: ${error.message.substring(0, 60)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 SQL RUNDA UKOŃCZONA: +${successCount} nowych tabel!`);
    console.log(`📊 Nowy stan: ${35 + successCount}/97 (${((35 + successCount) / 97 * 100).toFixed(1)}%)`);
    console.log(`🎯 Do 90%: jeszcze ${88 - 35 - successCount} tabel`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Błąd główny:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSqlDirect();