#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function deployDatabase() {
  console.log('🚀 Starting CRM-GTD Database Deployment...');
  
  try {
    // 1. Check database connection
    console.log('🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 2. Check if organizations exist
    const existingOrgs = await prisma.organization.findMany();
    console.log(`📊 Found ${existingOrgs.length} existing organizations`);

    if (existingOrgs.length === 0) {
      console.log('❌ No organizations found. Please run basic organization setup first.');
      console.log('💡 Run: npx prisma db seed');
      process.exit(1);
    }

    // 3. Run the working seed script
    console.log('🌱 Running comprehensive seed script...');
    execSync('npx ts-node prisma/seed-complete-data.ts', { stdio: 'inherit' });
    
    // 4. Verify data was created
    console.log('🔍 Verifying data creation...');
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.task.count(),
      prisma.project.count(),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.deal.count(),
      prisma.context.count(),
      prisma.tag.count(),
      prisma.stream.count(),
      prisma.aIProvider.count(),
      prisma.meeting.count(),
      prisma.knowledgeBase.count(),
      prisma.emailTemplate.count(),
      prisma.smartMailbox.count(),
      prisma.focusMode.count(),
      prisma.habit.count(),
      prisma.waitingFor.count(),
      prisma.somedayMaybe.count()
    ]);

    console.log('\n📈 DATABASE POPULATION SUMMARY:');
    console.log('===============================');
    console.log(`Organizations: ${counts[0]}`);
    console.log(`Users: ${counts[1]}`);
    console.log(`Tasks: ${counts[2]}`);
    console.log(`Projects: ${counts[3]}`);
    console.log(`Companies: ${counts[4]}`);
    console.log(`Contacts: ${counts[5]}`);
    console.log(`Deals: ${counts[6]}`);
    console.log(`GTD Contexts: ${counts[7]}`);
    console.log(`Tags: ${counts[8]}`);
    console.log(`Streams: ${counts[9]}`);
    console.log(`AI Providers: ${counts[10]}`);
    console.log(`Meetings: ${counts[11]}`);
    console.log(`Knowledge Bases: ${counts[12]}`);
    console.log(`Email Templates: ${counts[13]}`);
    console.log(`Smart Mailboxes: ${counts[14]}`);
    console.log(`Focus Modes: ${counts[15]}`);
    console.log(`Habits: ${counts[16]}`);
    console.log(`Waiting For: ${counts[17]}`);
    console.log(`Someday Maybe: ${counts[18]}`);

    const totalRecords = counts.reduce((sum, count) => sum + count, 0);
    console.log(`\n🎉 Total Records: ${totalRecords}`);
    console.log('✅ Database deployment completed successfully!');
    
    console.log('\n🌐 ACCESS URLs:');
    console.log('==============');
    console.log('Frontend: http://91.99.50.80/crm/');
    console.log('API: http://91.99.50.80/crm/api/v1/');
    console.log('Knowledge Base: http://91.99.50.80/crm/dashboard/knowledge/');
    console.log('Smart Mailboxes: http://91.99.50.80/crm/dashboard/smart-mailboxes/');
    console.log('GTD Inbox: http://91.99.50.80/crm/dashboard/gtd/inbox/');
    console.log('AI Rules: http://91.99.50.80/crm/dashboard/ai-rules/');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deployment
deployDatabase();