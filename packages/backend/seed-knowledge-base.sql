-- KNOWLEDGE BASE SEEDING SCRIPT
-- Wypełnienie systemu Knowledge Base realistycznymi danymi

-- Pobierz UUID organizacji i użytkowników
-- organizationId: fe59f2b0-93d0-4193-9bab-aee778c1a449
-- userId1: 6a1ae76d-4fac-4502-8342-4740dce3f43d
-- userId2: 11f4ba11-edec-49eb-87c9-c7c8b26944c7  
-- userId3: 423f6446-fc59-4131-8561-3f6f409d876a

-- 1. FOLDERS (hierarchiczna struktura folderów)
INSERT INTO folders (id, name, description, color, "isSystem", "parentId", "organizationId", "createdAt", "updatedAt") VALUES
-- Root folders
('folder-docs', 'Dokumentacja', 'Główny folder dokumentacji systemowej', '#3B82F6', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-policies', 'Polityki i Procedury', 'Firmowe polityki i procedury', '#EF4444', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-projects', 'Projekty', 'Dokumentacja projektowa', '#10B981', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-training', 'Szkolenia', 'Materiały szkoleniowe', '#F59E0B', false, NULL, 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- Subfolders
('folder-tech-docs', 'Dokumentacja Techniczna', 'API, architektury, konfiguracje', '#6366F1', false, 'folder-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-user-guides', 'Przewodniki Użytkownika', 'Instrukcje dla użytkowników końcowych', '#8B5CF6', false, 'folder-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-hr-policies', 'Polityki HR', 'Zarządzanie zasobami ludzkimi', '#EC4899', false, 'folder-policies', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('folder-security', 'Bezpieczeństwo', 'Polityki bezpieczeństwa IT', '#DC2626', false, 'folder-policies', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. WIKI CATEGORIES
INSERT INTO wiki_categories (id, name, description, color, "organizationId", "createdAt", "updatedAt") VALUES
('wiki-cat-getting-started', 'Getting Started', 'Pierwsze kroki z systemem', '#22C55E', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-cat-user-guide', 'User Guide', 'Przewodniki użytkownika', '#3B82F6', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-cat-api-docs', 'API Documentation', 'Dokumentacja API', '#6366F1', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-cat-faq', 'FAQ', 'Często zadawane pytania', '#F59E0B', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-cat-troubleshooting', 'Troubleshooting', 'Rozwiązywanie problemów', '#EF4444', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. DOCUMENTS (różne typy dokumentów)
INSERT INTO documents (id, title, content, summary, type, status, tags, "mimeType", "fileSize", "filePath", version, "isTemplate", "isPublic", "viewCount", "authorId", "folderId", "organizationId", "createdAt", "updatedAt") VALUES

-- Technical Documentation
('doc-api-reference', 'CRM-GTD API Reference', 
'# CRM-GTD API Reference

## Authentication
All API requests require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
https://api.crm-gtd.com/api/v1/
```

## Endpoints

### GTD System
- `GET /gtd-inbox` - Get inbox items
- `POST /gtd-inbox` - Create inbox item
- `PUT /gtd-inbox/:id` - Update inbox item

### CRM System  
- `GET /companies` - List companies
- `POST /companies` - Create company
- `GET /contacts` - List contacts
- `POST /contacts` - Create contact

### Smart Mailboxes
- `GET /smart-mailboxes` - List mailboxes
- `POST /smart-mailboxes/:id/messages` - Get messages

## Error Handling
All errors return JSON with error code and message.', 
'Complete API reference for CRM-GTD system with authentication, endpoints, and error handling.', 
'REFERENCE', 'PUBLISHED', ARRAY['api', 'technical', 'reference'], 'text/markdown', 2847, NULL, 1, false, true, 45, 
'6a1ae76d-4fac-4502-8342-4740dce3f43d', 'folder-tech-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- User Guide
('doc-user-guide', 'CRM-GTD User Guide', 
'# CRM-GTD User Guide

## Introduction
Welcome to CRM-GTD Smart - the comprehensive productivity platform that combines Customer Relationship Management with Getting Things Done methodology.

## Getting Started

### 1. First Login
After creating your account, you''ll be taken to the dashboard where you can see:
- Recent tasks and projects
- Inbox items requiring processing
- Upcoming meetings and deadlines

### 2. Setting Up GTD Workflow
1. **Capture Everything** - Use Quick Capture to add items to your inbox
2. **Process Regularly** - Review inbox items and make decisions (DO/DEFER/DELEGATE/DELETE)
3. **Organize by Context** - Assign contexts like @computer, @calls, @office
4. **Review Weekly** - Use weekly review to maintain system health

### 3. CRM Features
- **Companies**: Manage customer organizations
- **Contacts**: Track individual relationships
- **Deals**: Monitor sales pipeline
- **Communication**: Integrated messaging system

## Advanced Features

### Smart Mailboxes
Automatically organize communications using AI-powered rules:
- Priority detection
- Sentiment analysis  
- Auto-categorization
- Response suggestions

### AI Integration
- SMART goal analysis
- Task prioritization
- Meeting insights
- Content suggestions

## Tips for Success
1. Process inbox daily
2. Use consistent naming for projects
3. Set up recurring reviews
4. Leverage automation rules', 
'Comprehensive user guide covering GTD workflow, CRM features, and advanced capabilities.', 
'GUIDE', 'PUBLISHED', ARRAY['user-guide', 'gtd', 'crm'], 'text/markdown', 1923, NULL, 2, false, true, 128, 
'11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'folder-user-guides', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- Policy Document
('doc-security-policy', 'Information Security Policy', 
'# Information Security Policy

## Purpose
This policy establishes guidelines for protecting organizational information assets and ensuring compliance with data protection regulations.

## Scope
This policy applies to all employees, contractors, and third parties accessing company systems.

## Password Requirements
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No reuse of last 5 passwords
- Changed every 90 days

## Data Classification
### Public
Information that can be freely shared without risk.

### Internal
Information for internal use only, not for external distribution.

### Confidential
Sensitive information requiring special handling and access controls.

### Restricted
Highly sensitive information with strict access requirements.

## Access Controls
- Principle of least privilege
- Regular access reviews
- Multi-factor authentication for sensitive systems
- Immediate revocation upon termination

## Incident Response
1. **Detection** - Identify security incidents
2. **Containment** - Isolate affected systems
3. **Investigation** - Determine scope and impact
4. **Recovery** - Restore normal operations
5. **Lessons Learned** - Update procedures

## Compliance
Regular audits ensure adherence to:
- GDPR requirements
- SOC 2 controls
- ISO 27001 standards', 
'Company information security policy covering passwords, data classification, and incident response.', 
'POLICY', 'PUBLISHED', ARRAY['security', 'policy', 'compliance'], 'text/markdown', 1456, NULL, 3, false, false, 67, 
'423f6446-fc59-4131-8561-3f6f409d876a', 'folder-security', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- Project Documentation
('doc-project-plan', 'CRM Integration Project Plan', 
'# CRM Integration Project Plan

## Project Overview
Integration of legacy CRM system with new GTD Smart platform.

## Objectives
1. Migrate customer data (10,000+ records)
2. Preserve communication history
3. Maintain data integrity
4. Zero downtime migration

## Timeline
- **Week 1-2**: Data analysis and mapping
- **Week 3-4**: Migration scripts development
- **Week 5**: Testing and validation
- **Week 6**: Production migration
- **Week 7**: Post-migration monitoring

## Resources
- **Technical Lead**: John Smith
- **Data Analyst**: Sarah Johnson  
- **QA Engineer**: Mike Wilson
- **Project Manager**: Lisa Brown

## Risks and Mitigation
1. **Data Loss Risk**
   - Mitigation: Full backup before migration
   - Rollback plan prepared

2. **Performance Impact**
   - Mitigation: Off-hours migration
   - Load testing completed

3. **User Training**
   - Mitigation: Training sessions scheduled
   - Documentation prepared

## Success Criteria
- All data migrated successfully
- No data corruption
- User acceptance > 90%
- System performance maintained', 
'Detailed project plan for CRM system integration including timeline, resources, and risk management.', 
'PROJECT', 'DRAFT', ARRAY['project', 'crm', 'integration'], 'text/markdown', 1287, NULL, 1, false, false, 23, 
'6a1ae76d-4fac-4502-8342-4740dce3f43d', 'folder-projects', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- Training Material
('doc-gtd-training', 'GTD Methodology Training', 
'# Getting Things Done (GTD) Training

## Introduction to GTD
GTD is a personal productivity system developed by David Allen. It''s based on the principle of getting tasks and ideas out of your mind and into a trusted external system.

## The Five Steps of GTD

### 1. Capture
Collect everything that requires your attention in a trusted external system.
- Use inbox for quick capture
- Review email, notes, voicemail
- Don''t let anything slip through cracks

### 2. Clarify
Process what each item means and what action is required.
- Is it actionable?
- What''s the next action?
- Will it take less than 2 minutes?

### 3. Organize
Put reminders of your work in appropriate places.
- Next Actions lists
- Projects list
- Waiting For list
- Someday/Maybe list

### 4. Reflect
Update and review your system regularly.
- Daily: Process inbox
- Weekly: Review all lists
- Continuously: Update system

### 5. Engage
Take action with confidence knowing your system is complete.

## GTD in CRM-GTD Smart

### Inbox Processing
1. Quick Capture - Add items instantly
2. Process Decision - DO/DEFER/DELEGATE/DELETE
3. Context Assignment - @computer, @calls, @office
4. Project Creation - Multi-step outcomes

### Smart Features
- AI-powered prioritization
- Automatic context suggestions
- Smart scheduling
- Progress tracking

## Best Practices
1. **Weekly Review is Sacred** - Schedule and protect this time
2. **Keep Inbox Empty** - Process everything regularly
3. **Trust Your System** - Only capture in designated places
4. **Start Small** - Implement gradually
5. **Be Consistent** - Build habits over time

## Common Pitfalls
- Over-organizing without doing
- Neglecting weekly reviews
- Perfectionism paralysis
- Not capturing everything', 
'Comprehensive training material on GTD methodology with system-specific implementation guidance.', 
'TUTORIAL', 'PUBLISHED', ARRAY['training', 'gtd', 'productivity'], 'text/markdown', 2134, NULL, 1, true, true, 89, 
'11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'folder-training', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

-- FAQ Document
('doc-faq', 'Frequently Asked Questions', 
'# Frequently Asked Questions

## General Questions

### Q: What is CRM-GTD Smart?
A: CRM-GTD Smart is a comprehensive productivity platform that combines Customer Relationship Management with Getting Things Done methodology, enhanced by AI-powered features.

### Q: How do I get started?
A: After creating your account, start with the onboarding tutorial, then begin capturing items in your inbox and processing them using GTD principles.

### Q: Is my data secure?
A: Yes, we use enterprise-grade security including encryption at rest and in transit, SOC 2 compliance, and regular security audits.

## GTD Questions

### Q: What''s the difference between Projects and Next Actions?
A: Projects are outcomes requiring more than one step. Next Actions are the specific physical actions needed to move projects forward.

### Q: How often should I do weekly reviews?
A: Weekly reviews should be done consistently every week, typically taking 30-60 minutes to review all your lists and commitments.

### Q: What contexts should I use?
A: Common contexts include @computer, @calls, @office, @home, @errands. Choose contexts that match your actual working situations.

## CRM Questions

### Q: How do I import existing contacts?
A: Use the Import feature in the Contacts section. We support CSV, Excel, and vCard formats.

### Q: Can I track email communications?
A: Yes, the Smart Mailboxes feature automatically tracks and categorizes email communications with your contacts.

### Q: How does the AI prioritization work?
A: Our AI analyzes factors like urgency keywords, sender importance, due dates, and historical patterns to suggest priorities.

## Technical Questions

### Q: What browsers are supported?
A: We support Chrome 80+, Firefox 75+, Safari 13+, and Edge 80+.

### Q: Is there a mobile app?
A: Currently we offer a responsive web interface. Native mobile apps are in development.

### Q: How do I integrate with other tools?
A: Check our API documentation for integration options. We also offer pre-built integrations with popular tools.', 
'Common questions and answers about system features, GTD methodology, and technical topics.', 
'FAQ', 'PUBLISHED', ARRAY['faq', 'help', 'support'], 'text/markdown', 1876, NULL, 4, false, true, 156, 
'423f6446-fc59-4131-8561-3f6f409d876a', 'folder-user-guides', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- 4. WIKI PAGES (linked pages with navigation)
INSERT INTO wiki_pages (id, title, slug, content, summary, "isPublished", version, template, "authorId", "categoryId", "organizationId", "parentPageId", "createdAt", "updatedAt") VALUES

-- Getting Started Pages
('wiki-welcome', 'Welcome to CRM-GTD Smart', 'welcome', 
'# Welcome to CRM-GTD Smart! 🎉

Welcome to your new productivity powerhouse! CRM-GTD Smart combines the best of customer relationship management with David Allen''s Getting Things Done methodology.

## Quick Start Checklist
- [ ] Complete your profile setup
- [ ] Take the system tour
- [ ] Import your contacts
- [ ] Set up your first project
- [ ] Configure Smart Mailboxes

## What''s Next?
1. **[[first-steps|Follow the First Steps Guide]]**
2. **[[gtd-setup|Set Up Your GTD Workflow]]** 
3. **[[crm-basics|Learn CRM Basics]]**

## Need Help?
- Check our [[faq|FAQ section]]
- Browse the [[user-guide|User Guide]]
- Contact support: support@crm-gtd.com

*Tip: Use the Quick Capture (Ctrl+Shift+C) to add items to your inbox anytime!*', 
'Welcome page with quick start checklist and navigation to key resources.', 
true, 1, 'welcome', '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'wiki-cat-getting-started', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NULL, NOW(), NOW()),

('wiki-first-steps', 'First Steps Guide', 'first-steps', 
'# First Steps Guide

## Step 1: Complete Your Profile
Set up your personal information, timezone, and preferences.

## Step 2: Understand the Dashboard
Your dashboard shows:
- **Inbox Items**: Things to process
- **Next Actions**: Tasks ready to do
- **Projects**: Multi-step outcomes
- **Recent Activity**: What''s been happening

## Step 3: Learn Quick Capture
Press **Ctrl+Shift+C** anywhere to quickly capture:
- Random thoughts
- Meeting notes  
- Email follow-ups
- Project ideas

## Step 4: Process Your First Inbox Item
1. Go to GTD → Inbox
2. Click on an item to expand
3. Decide: DO, DEFER, DELEGATE, or DELETE
4. Add context (where you''ll do it)
5. Set priority if needed

## Step 5: Create Your First Project
Projects are outcomes requiring multiple steps:
1. Go to Projects
2. Click "New Project"
3. Define the successful outcome
4. Add the first next action

## Ready for More?
- [[gtd-setup|Set Up Complete GTD Workflow]]
- [[smart-mailboxes|Configure Smart Mailboxes]]', 
'Step-by-step guide for new users to get started with the system.', 
true, 1, 'guide', '11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'wiki-cat-getting-started', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NULL, NOW(), NOW()),

-- User Guide Pages
('wiki-gtd-setup', 'GTD Workflow Setup', 'gtd-setup', 
'# GTD Workflow Setup

## Overview
Setting up an effective GTD workflow is crucial for productivity. Follow this guide to configure your system properly.

## 1. Configure Contexts
Contexts define WHERE you can do work:
- **@computer** - Tasks requiring a computer
- **@calls** - Phone calls to make
- **@office** - Office-specific tasks
- **@home** - Personal tasks at home
- **@errands** - Out-and-about tasks

*Go to GTD → Contexts to customize your list.*

## 2. Set Up Areas of Responsibility
These are ongoing areas you maintain:
- Work role responsibilities
- Personal life areas
- Health and fitness
- Relationships

*Configure in GTD → Areas of Responsibility*

## 3. Create Your Horizons
GTD uses 6 levels of perspective:
- **Level 0**: Current Actions (daily)
- **Level 1**: Current Projects (weekly)
- **Level 2**: Areas of Responsibility (monthly)
- **Level 3**: Goals (quarterly)
- **Level 4**: Vision (yearly)
- **Level 5**: Purpose (life perspective)

## 4. Establish Review Habits
- **Daily**: Process inbox to zero
- **Weekly**: Review all lists and commitments
- **Monthly**: Review areas of responsibility
- **Quarterly**: Review goals and vision

## 5. Smart Mailboxes Integration
Configure rules to automatically:
- Detect actionable emails
- Create tasks from messages
- Set context based on content
- Prioritize by urgency

## Pro Tips
- Start with basic setup, refine over time
- Keep contexts simple and practical
- Use consistent naming conventions
- Trust your system completely', 
'Complete guide to setting up an effective GTD workflow in the system.', 
true, 2, 'guide', '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'wiki-cat-user-guide', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NULL, NOW(), NOW()),

-- API Documentation  
('wiki-api-auth', 'API Authentication', 'api-authentication', 
'# API Authentication

## Overview
CRM-GTD Smart API uses JWT (JSON Web Tokens) for authentication. All API requests must include a valid JWT token.

## Getting a Token

### 1. Login Endpoint
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

### 2. Response
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
  }
}
```

## Using the Token
Include the access token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Token Refresh
Access tokens expire after 1 hour. Use the refresh token to get a new one:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

## Error Responses
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions
- **422 Validation Error**: Invalid request format

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per organization
- Headers indicate remaining quota', 
'Complete authentication guide for API developers.', 
true, 1, 'api-doc', '423f6446-fc59-4131-8561-3f6f409d876a', 'wiki-cat-api-docs', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NULL, NOW(), NOW()),

-- FAQ Page
('wiki-faq-gtd', 'GTD FAQ', 'faq-gtd', 
'# GTD Frequently Asked Questions

## Getting Started

### Q: I''m new to GTD. Where should I start?
**A:** Start with the [[first-steps|First Steps Guide]], then read David Allen''s "Getting Things Done" book. Focus on capturing everything first, then learn to process effectively.

### Q: How long does it take to see results?
**A:** Most people see immediate stress relief from capturing everything. Full GTD mastery typically takes 2-3 months of consistent practice.

## Common Issues

### Q: My inbox keeps filling up. What am I doing wrong?
**A:** You''re probably not processing regularly enough. Schedule daily inbox processing time and stick to it. Also ensure you''re making clear next action decisions.

### Q: I have too many projects. How do I prioritize?
**A:** Use the GTD horizons to gain perspective. Focus on current actions (Level 0) daily, review projects (Level 1) weekly, and align with higher levels monthly.

### Q: What if I miss my weekly review?
**A:** Don''t let perfect be the enemy of good. Do a abbreviated review when you can, then get back on schedule. Consistency matters more than perfection.

## System-Specific

### Q: How does AI prioritization work with GTD?
**A:** Our AI suggests priorities based on deadlines, context, and patterns, but you always have final control. Use it as input for your own decisions.

### Q: Can I customize the contexts?
**A:** Yes! Go to GTD → Contexts to add, edit, or remove contexts. Make them match your actual work situations.

## Troubleshooting

### Q: I feel overwhelmed by all my lists. Help!
**A:** This is normal initially. Focus on just your Next Actions list and do the weekly review. Over time, the system will feel more natural.

### Q: Should I put every small task in the system?
**A:** If it takes less than 2 minutes, do it immediately. Otherwise, capture it. Don''t let the system become more work than the actual work.', 
'Common GTD questions and troubleshooting for system users.', 
true, 3, 'faq', '11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'wiki-cat-faq', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NULL, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- 5. DOCUMENT COMMENTS (comments on documents)
INSERT INTO document_comments (id, content, "authorId", "documentId", "organizationId", "createdAt", "updatedAt") VALUES
('comment-1', 'Great API reference! Could we add examples for bulk operations?', '11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'doc-api-reference', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('comment-2', 'This user guide is very comprehensive. Helps a lot with onboarding new team members.', '423f6446-fc59-4131-8561-3f6f409d876a', 'doc-user-guide', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('comment-3', 'Security policy looks good. Should we add a section about remote work security?', '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'doc-security-policy', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. DOCUMENT LINKS (links between documents)
INSERT INTO document_links (id, "sourceDocumentId", "targetDocumentId", "linkType", description, "organizationId", "createdAt", "updatedAt") VALUES
('link-1', 'doc-user-guide', 'doc-gtd-training', 'REFERENCE', 'Links to detailed GTD training', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('link-2', 'doc-api-reference', 'doc-security-policy', 'RELATED', 'Security considerations for API usage', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('link-3', 'doc-project-plan', 'doc-api-reference', 'DEPENDENCY', 'Project requires API integration', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. DOCUMENT SHARES (sharing permissions)
INSERT INTO document_shares (id, "documentId", "sharedWithId", permission, "expiresAt", "authorId", "organizationId", "createdAt", "updatedAt") VALUES
('share-1', 'doc-api-reference', '11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'READ', NULL, '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('share-2', 'doc-project-plan', '423f6446-fc59-4131-8561-3f6f409d876a', 'WRITE', NULL, '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. WIKI PAGE LINKS (internal wiki navigation)
INSERT INTO wiki_page_links (id, "sourcePageId", "targetPageId", "linkText", "organizationId", "createdAt", "updatedAt") VALUES
('wiki-link-1', 'wiki-welcome', 'wiki-first-steps', 'First Steps Guide', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-link-2', 'wiki-welcome', 'wiki-gtd-setup', 'GTD Setup', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-link-3', 'wiki-first-steps', 'wiki-gtd-setup', 'Complete GTD Workflow', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),
('wiki-link-4', 'wiki-gtd-setup', 'wiki-faq-gtd', 'GTD FAQ', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. KNOWLEDGE BASE (main knowledge base entries)
INSERT INTO knowledge_base (id, title, content, category, tags, "isPublic", "authorId", "organizationId", "createdAt", "updatedAt") VALUES
('kb-gtd-overview', 'GTD Methodology Overview', 
'Getting Things Done (GTD) is a personal productivity system that helps you organize and track your tasks and projects. The core principle is to move planned tasks and projects out of the mind by recording them externally and then breaking them into actionable work items.', 
'METHODOLOGY', ARRAY['gtd', 'productivity', 'methodology'], true, '6a1ae76d-4fac-4502-8342-4740dce3f43d', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

('kb-crm-basics', 'CRM System Basics', 
'Customer Relationship Management (CRM) systems help businesses manage and analyze customer interactions and data throughout the customer lifecycle. The goal is to improve business relationships with customers, assist in customer retention, and drive sales growth.', 
'CRM', ARRAY['crm', 'customer', 'sales'], true, '11f4ba11-edec-49eb-87c9-c7c8b26944c7', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW()),

('kb-smart-goals', 'SMART Goals Framework', 
'SMART is an acronym that defines criteria for setting effective goals. Goals should be Specific, Measurable, Achievable, Relevant, and Time-bound. This framework helps ensure that objectives are clear and reachable.', 
'PLANNING', ARRAY['smart', 'goals', 'planning'], true, '423f6446-fc59-4131-8561-3f6f409d876a', 'fe59f2b0-93d0-4193-9bab-aee778c1a449', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;