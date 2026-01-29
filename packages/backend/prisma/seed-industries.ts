/**
 * Seed file for Industry Templates
 * Creates 7 pre-configured industry templates for STREAMS CRM
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const industryTemplates = [
  {
    slug: 'it-software',
    name: 'IT & Software',
    description: 'Dla firm IT, software house i startupow technologicznych',
    icon: 'CodeBracketIcon',
    color: '#6366F1',
    category: 'technology',
    sortOrder: 1,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Zbieranie wszystkich zgloszeni i pomyslow' },
      { name: 'Development', role: 'PROJECTS', color: '#10B981', description: 'Aktywne projekty developerskie' },
      { name: 'Support', role: 'NEXT_ACTIONS', color: '#F59E0B', description: 'Tickety supportowe' },
      { name: 'Backlog', role: 'SOMEDAY_MAYBE', color: '#EC4899', description: 'Pomysly na przyszlosc' },
      { name: 'Documentation', role: 'REFERENCE', color: '#6B7280', description: 'Dokumentacja techniczna' },
    ],
    pipelineStages: [
      { name: 'Lead', probability: 10, color: '#9CA3AF' },
      { name: 'Discovery', probability: 20, color: '#F59E0B' },
      { name: 'Proposal', probability: 40, color: '#3B82F6' },
      { name: 'Technical Review', probability: 60, color: '#8B5CF6' },
      { name: 'Negotiation', probability: 80, color: '#10B981' },
      { name: 'Closed Won', probability: 100, color: '#22C55E' },
      { name: 'Closed Lost', probability: 0, color: '#EF4444' },
    ],
    taskCategories: ['Bug Fix', 'Feature', 'Documentation', 'Code Review', 'Meeting', 'Research', 'DevOps'],
    customFields: [
      { name: 'techStack', label: 'Technology Stack', type: 'multiselect', options: ['React', 'Node.js', 'Python', 'Java', 'Go', 'Rust'] },
      { name: 'projectType', label: 'Project Type', type: 'select', options: ['Web App', 'Mobile App', 'API', 'Infrastructure', 'AI/ML'] },
      { name: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
      { name: 'gitRepo', label: 'Git Repository', type: 'url' },
    ],
    workflows: [
      { name: 'Auto-assign Support Tickets', trigger: 'email_received', conditions: { subject_contains: 'support' }, action: 'assign_to_stream', target: 'Support' },
      { name: 'Weekly Sprint Review', trigger: 'schedule', schedule: 'weekly', action: 'create_review' },
    ],
  },
  {
    slug: 'ecommerce',
    name: 'E-commerce',
    description: 'Dla sklepow internetowych i platform sprzedazowych',
    icon: 'ShoppingCartIcon',
    color: '#F59E0B',
    category: 'retail',
    sortOrder: 2,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe zamowienia i zapytania' },
      { name: 'Orders', role: 'NEXT_ACTIONS', color: '#10B981', description: 'Zamowienia do realizacji' },
      { name: 'Returns', role: 'WAITING_FOR', color: '#F59E0B', description: 'Zwroty i reklamacje' },
      { name: 'Marketing', role: 'PROJECTS', color: '#EC4899', description: 'Kampanie marketingowe' },
      { name: 'Products', role: 'REFERENCE', color: '#6B7280', description: 'Katalog produktow' },
    ],
    pipelineStages: [
      { name: 'New Lead', probability: 10, color: '#9CA3AF' },
      { name: 'Interested', probability: 30, color: '#F59E0B' },
      { name: 'Quote Sent', probability: 50, color: '#3B82F6' },
      { name: 'Order Placed', probability: 80, color: '#8B5CF6' },
      { name: 'Delivered', probability: 100, color: '#22C55E' },
      { name: 'Cancelled', probability: 0, color: '#EF4444' },
    ],
    taskCategories: ['Order Processing', 'Customer Service', 'Marketing', 'Inventory', 'Shipping', 'Returns'],
    customFields: [
      { name: 'orderValue', label: 'Order Value', type: 'currency' },
      { name: 'shippingMethod', label: 'Shipping Method', type: 'select', options: ['Standard', 'Express', 'Same Day', 'Pickup'] },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Pending', 'Paid', 'Refunded', 'Failed'] },
      { name: 'trackingNumber', label: 'Tracking Number', type: 'text' },
    ],
    workflows: [
      { name: 'Auto-confirm Orders', trigger: 'payment_received', action: 'update_status', target: 'Confirmed' },
      { name: 'Review Request', trigger: 'order_delivered', delay: '7d', action: 'send_email', template: 'review_request' },
    ],
  },
  {
    slug: 'real-estate',
    name: 'Nieruchomosci',
    description: 'Dla agencji nieruchomosci i deweloperow',
    icon: 'HomeIcon',
    color: '#10B981',
    category: 'services',
    sortOrder: 3,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe zapytania o nieruchomosci' },
      { name: 'Showings', role: 'NEXT_ACTIONS', color: '#10B981', description: 'Zaplanowane prezentacje' },
      { name: 'Negotiations', role: 'WAITING_FOR', color: '#F59E0B', description: 'Oferty w negocjacjach' },
      { name: 'Listings', role: 'PROJECTS', color: '#3B82F6', description: 'Aktywne oferty' },
      { name: 'Sold', role: 'REFERENCE', color: '#6B7280', description: 'Zamkniete transakcje' },
    ],
    pipelineStages: [
      { name: 'Inquiry', probability: 10, color: '#9CA3AF' },
      { name: 'Viewing Scheduled', probability: 25, color: '#F59E0B' },
      { name: 'Interested', probability: 40, color: '#3B82F6' },
      { name: 'Offer Made', probability: 60, color: '#8B5CF6' },
      { name: 'Under Contract', probability: 85, color: '#10B981' },
      { name: 'Closed', probability: 100, color: '#22C55E' },
      { name: 'Lost', probability: 0, color: '#EF4444' },
    ],
    taskCategories: ['Viewing', 'Negotiation', 'Documentation', 'Marketing', 'Follow-up', 'Inspection'],
    customFields: [
      { name: 'propertyType', label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Land', 'Commercial', 'Industrial'] },
      { name: 'area', label: 'Area (m2)', type: 'number' },
      { name: 'price', label: 'Price', type: 'currency' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
    ],
    workflows: [
      { name: 'Showing Reminder', trigger: 'showing_scheduled', delay: '-1d', action: 'send_reminder' },
      { name: 'Follow-up After Viewing', trigger: 'showing_completed', delay: '2d', action: 'create_task', template: 'follow_up_call' },
    ],
  },
  {
    slug: 'consulting',
    name: 'Consulting & Doradztwo',
    description: 'Dla firm konsultingowych i doradczych',
    icon: 'LightBulbIcon',
    color: '#8B5CF6',
    category: 'services',
    sortOrder: 4,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe zapytania od klientow' },
      { name: 'Active Projects', role: 'PROJECTS', color: '#10B981', description: 'Aktywne projekty konsultingowe' },
      { name: 'Client Tasks', role: 'NEXT_ACTIONS', color: '#F59E0B', description: 'Zadania do wykonania' },
      { name: 'Pending Feedback', role: 'WAITING_FOR', color: '#3B82F6', description: 'Oczekiwanie na feedback klienta' },
      { name: 'Knowledge Base', role: 'REFERENCE', color: '#6B7280', description: 'Materialy i case studies' },
    ],
    pipelineStages: [
      { name: 'Initial Contact', probability: 10, color: '#9CA3AF' },
      { name: 'Discovery Call', probability: 25, color: '#F59E0B' },
      { name: 'Proposal', probability: 45, color: '#3B82F6' },
      { name: 'Negotiation', probability: 65, color: '#8B5CF6' },
      { name: 'Contract', probability: 85, color: '#10B981' },
      { name: 'Active', probability: 100, color: '#22C55E' },
      { name: 'Completed', probability: 100, color: '#22C55E' },
    ],
    taskCategories: ['Analysis', 'Research', 'Client Meeting', 'Report', 'Presentation', 'Strategy'],
    customFields: [
      { name: 'consultingArea', label: 'Consulting Area', type: 'select', options: ['Strategy', 'Operations', 'IT', 'HR', 'Finance', 'Marketing'] },
      { name: 'projectDuration', label: 'Project Duration', type: 'select', options: ['< 1 month', '1-3 months', '3-6 months', '6-12 months', '> 12 months'] },
      { name: 'hourlyRate', label: 'Hourly Rate', type: 'currency' },
      { name: 'billedHours', label: 'Billed Hours', type: 'number' },
    ],
    workflows: [
      { name: 'Weekly Status Report', trigger: 'schedule', schedule: 'weekly', action: 'create_task', template: 'status_report' },
      { name: 'Project Kickoff', trigger: 'deal_won', action: 'create_project' },
    ],
  },
  {
    slug: 'manufacturing',
    name: 'Produkcja',
    description: 'Dla firm produkcyjnych i przemyslowych',
    icon: 'CogIcon',
    color: '#EF4444',
    category: 'manufacturing',
    sortOrder: 5,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe zamowienia i zapytania' },
      { name: 'Production', role: 'NEXT_ACTIONS', color: '#10B981', description: 'Aktywna produkcja' },
      { name: 'Quality Control', role: 'WAITING_FOR', color: '#F59E0B', description: 'Kontrola jakosci' },
      { name: 'R&D', role: 'PROJECTS', color: '#3B82F6', description: 'Badania i rozwoj' },
      { name: 'Maintenance', role: 'SOMEDAY_MAYBE', color: '#EC4899', description: 'Planowane przeglady' },
    ],
    pipelineStages: [
      { name: 'RFQ Received', probability: 10, color: '#9CA3AF' },
      { name: 'Quote Sent', probability: 30, color: '#F59E0B' },
      { name: 'Sample Approved', probability: 50, color: '#3B82F6' },
      { name: 'PO Received', probability: 75, color: '#8B5CF6' },
      { name: 'In Production', probability: 90, color: '#10B981' },
      { name: 'Shipped', probability: 100, color: '#22C55E' },
    ],
    taskCategories: ['Production', 'Quality', 'Maintenance', 'Logistics', 'Procurement', 'R&D'],
    customFields: [
      { name: 'productCategory', label: 'Product Category', type: 'select', options: ['Electronics', 'Mechanical', 'Chemical', 'Food', 'Textile'] },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'leadTime', label: 'Lead Time (days)', type: 'number' },
      { name: 'certifications', label: 'Certifications', type: 'multiselect', options: ['ISO 9001', 'ISO 14001', 'CE', 'FDA', 'IATF'] },
    ],
    workflows: [
      { name: 'QC Notification', trigger: 'production_complete', action: 'assign_to_stream', target: 'Quality Control' },
      { name: 'Maintenance Schedule', trigger: 'schedule', schedule: 'monthly', action: 'create_task', template: 'maintenance_check' },
    ],
  },
  {
    slug: 'marketing-agency',
    name: 'Agencja Marketingowa',
    description: 'Dla agencji marketingowych i reklamowych',
    icon: 'MegaphoneIcon',
    color: '#EC4899',
    category: 'services',
    sortOrder: 6,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe briify i zapytania' },
      { name: 'Campaigns', role: 'PROJECTS', color: '#10B981', description: 'Aktywne kampanie' },
      { name: 'Creative', role: 'NEXT_ACTIONS', color: '#F59E0B', description: 'Zadania kreatywne' },
      { name: 'Client Approval', role: 'WAITING_FOR', color: '#3B82F6', description: 'Oczekiwanie na akceptacje' },
      { name: 'Assets', role: 'REFERENCE', color: '#6B7280', description: 'Materialy i branding' },
    ],
    pipelineStages: [
      { name: 'Brief Received', probability: 15, color: '#9CA3AF' },
      { name: 'Strategy', probability: 30, color: '#F59E0B' },
      { name: 'Proposal', probability: 50, color: '#3B82F6' },
      { name: 'Creative Development', probability: 70, color: '#8B5CF6' },
      { name: 'Client Review', probability: 85, color: '#10B981' },
      { name: 'Live/Completed', probability: 100, color: '#22C55E' },
    ],
    taskCategories: ['Strategy', 'Design', 'Content', 'Social Media', 'Analytics', 'Client Meeting'],
    customFields: [
      { name: 'campaignType', label: 'Campaign Type', type: 'select', options: ['Social Media', 'PPC', 'Content', 'Email', 'PR', 'Branding'] },
      { name: 'budget', label: 'Campaign Budget', type: 'currency' },
      { name: 'platforms', label: 'Platforms', type: 'multiselect', options: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Google Ads', 'YouTube'] },
      { name: 'kpis', label: 'KPIs', type: 'multiselect', options: ['Reach', 'Engagement', 'Leads', 'Sales', 'Brand Awareness'] },
    ],
    workflows: [
      { name: 'Campaign Report', trigger: 'schedule', schedule: 'weekly', action: 'create_task', template: 'campaign_report' },
      { name: 'Client Approval Reminder', trigger: 'awaiting_approval', delay: '3d', action: 'send_reminder' },
    ],
  },
  {
    slug: 'b2b-services',
    name: 'B2B Services',
    description: 'Dla firm oferujacych uslugi B2B',
    icon: 'BuildingOffice2Icon',
    color: '#3B82F6',
    category: 'services',
    sortOrder: 7,
    streams: [
      { name: 'Inbox', role: 'INBOX', color: '#8B5CF6', description: 'Nowe leady i zapytania' },
      { name: 'Active Clients', role: 'PROJECTS', color: '#10B981', description: 'Aktywni klienci' },
      { name: 'Service Delivery', role: 'NEXT_ACTIONS', color: '#F59E0B', description: 'Uslugi do realizacji' },
      { name: 'Renewals', role: 'WAITING_FOR', color: '#3B82F6', description: 'Odnowienia umow' },
      { name: 'Contracts', role: 'REFERENCE', color: '#6B7280', description: 'Dokumentacja kontraktowa' },
    ],
    pipelineStages: [
      { name: 'Lead', probability: 10, color: '#9CA3AF' },
      { name: 'Qualified', probability: 25, color: '#F59E0B' },
      { name: 'Demo/Meeting', probability: 45, color: '#3B82F6' },
      { name: 'Proposal', probability: 65, color: '#8B5CF6' },
      { name: 'Negotiation', probability: 80, color: '#10B981' },
      { name: 'Won', probability: 100, color: '#22C55E' },
      { name: 'Lost', probability: 0, color: '#EF4444' },
    ],
    taskCategories: ['Sales Call', 'Demo', 'Proposal', 'Onboarding', 'Support', 'Renewal'],
    customFields: [
      { name: 'contractValue', label: 'Contract Value', type: 'currency' },
      { name: 'contractLength', label: 'Contract Length', type: 'select', options: ['Monthly', 'Quarterly', '6 months', 'Annual', 'Multi-year'] },
      { name: 'serviceLevel', label: 'Service Level', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Enterprise'] },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date' },
    ],
    workflows: [
      { name: 'Renewal Reminder', trigger: 'renewal_approaching', delay: '-30d', action: 'create_task', template: 'renewal_call' },
      { name: 'Onboarding Checklist', trigger: 'deal_won', action: 'create_project', template: 'client_onboarding' },
    ],
  },
];

async function main() {
  console.log('Seeding industry templates...');

  for (const template of industryTemplates) {
    await prisma.industryTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        category: template.category,
        sortOrder: template.sortOrder,
        streams: template.streams,
        pipelineStages: template.pipelineStages,
        taskCategories: template.taskCategories,
        customFields: template.customFields,
        workflows: template.workflows,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        category: template.category,
        sortOrder: template.sortOrder,
        streams: template.streams,
        pipelineStages: template.pipelineStages,
        taskCategories: template.taskCategories,
        customFields: template.customFields,
        workflows: template.workflows,
      },
    });
    console.log(`  Created/Updated: ${template.name}`);
  }

  console.log('Industry templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding industries:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
