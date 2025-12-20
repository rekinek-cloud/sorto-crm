-- Knowledge Base Documents - Insert statements with properly escaped apostrophes
-- Organization ID: fe59f2b0-93d0-4193-9bab-aee778c1a449

-- 1. API Reference Document
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-api-reference-001',
    'API Reference - CRM-GTD Smart',
    'Comprehensive API documentation for CRM-GTD Smart system.

## Authentication
All API endpoints require authentication using Bearer token:
```
Authorization: Bearer <your-token>
```

## Base URL
Production: https://api.crm-gtd-smart.com/v1
Development: http://localhost:3003/api/v1

## Core Endpoints

### Tasks API
- GET /tasks - List all tasks
- POST /tasks - Create new task
- PUT /tasks/:id - Update task
- DELETE /tasks/:id - Delete task

### Projects API
- GET /projects - List all projects
- POST /projects - Create new project
- PUT /projects/:id - Update project
- DELETE /projects/:id - Delete project

### Contacts API
- GET /contacts - List all contacts
- POST /contacts - Create new contact
- PUT /contacts/:id - Update contact
- DELETE /contacts/:id - Delete contact

### Companies API
- GET /companies - List all companies
- POST /companies - Create new company
- PUT /companies/:id - Update company
- DELETE /companies/:id - Delete company

## Request/Response Format
All requests and responses use JSON format.

### Standard Response Structure
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required fields are missing"
  }
}
```

## Rate Limiting
- 1000 requests per hour per API key
- 100 requests per minute per IP address

## Examples

### Create Task
```bash
curl -X POST http://localhost:3003/api/v1/tasks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d ''{"title": "Complete API documentation"}''
```

### List Projects
```bash
curl -X GET http://localhost:3003/api/v1/projects \
  -H "Authorization: Bearer your-token"
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

For more information, visit our developer portal at https://developers.crm-gtd-smart.com',
    'Complete API reference documentation with authentication, endpoints, examples, and best practices for CRM-GTD Smart system integration.',
    'REFERENCE',
    'PUBLISHED',
    ARRAY['API', 'documentation', 'reference', 'development', 'integration'],
    '6a1ae76d-4fac-4502-8342-4740dce3f43d',
    'folder-docs',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);

-- 2. User Guide Document
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-user-guide-001',
    'User Guide - CRM-GTD Smart Complete Manual',
    'Complete user guide for CRM-GTD Smart system covering all features and workflows.

## Table of Contents
1. Getting Started
2. Dashboard Overview
3. GTD Methodology
4. Task Management
5. Project Management
6. Contact & Company Management
7. Communication Features
8. Smart Mailboxes
9. AI Features
10. Reports & Analytics

## 1. Getting Started

### First Login
After receiving your credentials, log in to the system:
1. Navigate to the login page
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the dashboard

### Initial Setup
1. **Profile Setup**: Complete your profile information
2. **Organization Settings**: Configure your organization preferences
3. **Import Data**: Import existing contacts, companies, and tasks
4. **Team Setup**: Add team members and set permissions

## 2. Dashboard Overview

The dashboard provides a comprehensive view of your work:

### Main Sections
- **Today Tasks**: Tasks due today or overdue
- **Projects Status**: Active projects and their progress
- **Recent Activity**: Latest system activities
- **Quick Actions**: Common tasks you can perform
- **Metrics**: Key performance indicators

### Navigation
- **Left Sidebar**: Main navigation menu
- **Top Bar**: Search, notifications, and user menu
- **Main Content**: Current page content
- **Right Panel**: Context-sensitive tools

## 3. GTD Methodology

Our system implements David Allen Getting Things Done methodology:

### Core Principles
1. **Capture**: Collect everything in trusted systems
2. **Clarify**: Process what it means
3. **Organize**: Put it where it belongs
4. **Reflect**: Review frequently
5. **Engage**: Simply do

### GTD Workflow
1. **Inbox**: Capture everything here first
2. **Processing**: Decide what each item means
3. **Organizing**: Sort into appropriate lists
4. **Reviewing**: Keep system current
5. **Doing**: Choose actions with confidence

### Quick Actions
- **DO**: Complete immediately (< 2 minutes)
- **DEFER**: Schedule for later with specific date
- **DELEGATE**: Assign to someone else
- **DELETE**: Remove if not needed

## 4. Task Management

### Creating Tasks
1. Click "New Task" button
2. Fill in task details:
   - Title (required)
   - Description
   - Priority (High/Medium/Low)
   - Due date
   - Context (@computer, @calls, @office, etc.)
   - Project assignment
3. Click "Save"

### Task Contexts
Contexts help you organize tasks by the tools or locations needed:
- **@computer**: Tasks requiring computer
- **@calls**: Phone calls to make
- **@office**: Office-specific tasks
- **@home**: Home-based tasks
- **@errands**: Tasks outside office
- **@waiting**: Waiting for someone else
- **@reading**: Documents to read

### Task States
- **Next Actions**: Ready to be done
- **Waiting For**: Depends on others
- **Someday/Maybe**: Not urgent, review later
- **Completed**: Finished tasks

## Support
For additional help:
- **Documentation**: https://docs.crm-gtd-smart.com
- **Video Tutorials**: https://tutorials.crm-gtd-smart.com
- **Community Forum**: https://community.crm-gtd-smart.com
- **Email Support**: support@crm-gtd-smart.com
- **Phone Support**: +48 123 456 789

Remember: The key to success with CRM-GTD Smart is consistent use of the GTD methodology combined with the powerful features of the system.',
    'Complete user guide covering all aspects of CRM-GTD Smart system including GTD methodology, task management, project management, and best practices.',
    'GUIDE',
    'PUBLISHED',
    ARRAY['user-guide', 'manual', 'GTD', 'tutorial', 'help'],
    '11f4ba11-edec-49eb-87c9-c7c8b26944c7',
    'folder-docs',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);

-- 3. Security Policy Document  
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-security-policy-001',
    'Information Security Policy - CRM-GTD Smart',
    'Comprehensive information security policy for CRM-GTD Smart system and organization.

## 1. Policy Statement

This Information Security Policy establishes the framework for protecting CRM-GTD Smart information assets and ensures compliance with applicable laws and regulations.

### Purpose
- Protect confidential and sensitive information
- Ensure data integrity and availability
- Establish security responsibilities
- Maintain compliance with regulations
- Minimize security risks

### Scope
This policy applies to:
- All employees and contractors
- All information systems and data
- All locations and facilities
- All third-party partners

## 2. Information Classification

### Classification Levels
1. **Public**: Information intended for public disclosure
2. **Internal**: Information for internal use only
3. **Confidential**: Sensitive information requiring protection
4. **Restricted**: Highly sensitive information with strict access controls

### Handling Requirements
- **Public**: No special handling required
- **Internal**: Standard protection measures
- **Confidential**: Encryption and access controls
- **Restricted**: Maximum security measures

## 3. Access Control

### Authentication Requirements
- **Multi-Factor Authentication**: Required for all accounts
- **Strong Passwords**: Minimum 12 characters with complexity
- **Password Rotation**: Every 90 days for privileged accounts
- **Account Lockout**: After 5 failed attempts

### Authorization Principles
- **Principle of Least Privilege**: Minimum necessary access
- **Role-Based Access**: Access based on job function
- **Regular Review**: Quarterly access reviews
- **Segregation of Duties**: Separation of critical functions

### Account Management
- **Provisioning**: Formal approval process required
- **Deprovisioning**: Immediate removal upon termination
- **Monitoring**: Regular audit of account activity
- **Shared Accounts**: Prohibited except for specific cases

## 4. Data Protection

### Data at Rest
- **Encryption**: AES-256 encryption for sensitive data
- **Database Security**: Encrypted database with access controls
- **Backup Encryption**: All backups encrypted
- **Storage Controls**: Secure storage facilities

### Data in Transit
- **TLS Encryption**: TLS 1.3 for all communications
- **VPN Requirements**: VPN for remote access
- **Email Security**: Encrypted email for sensitive data
- **API Security**: Secure API endpoints with authentication

### Data Processing
- **Data Minimization**: Collect only necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Data Retention**: Retain data only as long as necessary
- **Data Disposal**: Secure deletion of unnecessary data

## Contact Information
- **Security Team**: security@crm-gtd-smart.com
- **Incident Reporting**: incident@crm-gtd-smart.com
- **Emergency Contact**: +48 123 456 789
- **Security Officer**: Chief Information Security Officer

This policy is effective as of the date of approval and supersedes all previous versions.',
    'Comprehensive information security policy covering access control, data protection, network security, incident response, and compliance requirements.',
    'POLICY',
    'PUBLISHED',
    ARRAY['security', 'policy', 'compliance', 'data-protection', 'GDPR'],
    '306923ca-88ed-4417-a41d-c9b4ebfdef08',
    'folder-policies',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);

-- 4. Project Plan Document
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-project-plan-001',
    'CRM Integration Project Plan - Enterprise Implementation',
    'Comprehensive project plan for implementing CRM-GTD Smart system across enterprise organization.

## Project Overview

### Project Name
CRM-GTD Smart Enterprise Implementation

### Project Scope
Implementation of comprehensive CRM-GTD Smart system including:
- Core CRM functionality
- GTD methodology integration
- AI-powered features
- Smart mailboxes
- Knowledge management system
- Voice TTS capabilities
- Mobile application
- Third-party integrations

### Project Objectives
1. **Improve Productivity**: Increase team productivity by 40%
2. **Streamline Processes**: Reduce manual tasks by 60%
3. **Enhance Collaboration**: Improve team collaboration efficiency
4. **Data Centralization**: Centralize all customer and project data
5. **Automate Workflows**: Implement intelligent automation

### Success Criteria
- System deployed and operational
- All users trained and active
- 95% system uptime achieved
- User satisfaction score > 8.5/10
- ROI achieved within 12 months

## Project Timeline

### Phase 1: Planning & Preparation (Weeks 1-4)
**Week 1-2: Requirements Gathering**
- Stakeholder interviews
- Current system analysis
- Requirements documentation
- Gap analysis
- Resource planning

**Week 3-4: System Design**
- Architecture design
- Integration planning
- Data migration strategy
- Security requirements
- Testing strategy

### Phase 2: Infrastructure Setup (Weeks 5-8)
**Week 5-6: Environment Setup**
- Development environment
- Testing environment
- Staging environment
- Production environment
- Backup systems

**Week 7-8: Security Implementation**
- Security configuration
- Access controls
- Encryption setup
- Audit logging
- Compliance verification

### Resource Requirements

### Project Team
**Project Manager**: 1 FTE
- Overall project coordination
- Stakeholder management
- Risk management
- Timeline oversight

**Technical Lead**: 1 FTE
- Architecture decisions
- Technical oversight
- Code reviews
- Integration planning

**Backend Developers**: 3 FTE
- API development
- Database design
- Integration development
- Performance optimization

**Frontend Developers**: 2 FTE
- User interface development
- Mobile application
- User experience design
- Responsive design

### Budget Estimation
**Personnel Costs**: $450,000
- Project team salaries (8 months)
- Benefits and overhead
- Training and certification
- Contractor fees

**Infrastructure Costs**: $125,000
- Cloud infrastructure
- Software licenses
- Development tools
- Third-party services

**Other Costs**: $75,000
- Training materials
- Documentation
- Travel expenses
- Contingency buffer

**Total Project Budget**: $650,000

This project plan serves as the foundation for successful implementation of CRM-GTD Smart system and should be regularly updated throughout the project lifecycle.',
    'Comprehensive project plan for implementing CRM-GTD Smart system including timeline, resources, budget, risk management, and success metrics.',
    'SPECIFICATION',
    'DRAFT',
    ARRAY['project-plan', 'implementation', 'CRM', 'GTD', 'timeline'],
    '423f6446-fc59-4131-8561-3f6f409d876a',
    'folder-projects',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);

-- 5. GTD Training Document
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-gtd-training-001',
    'GTD Training Manual - Getting Things Done Methodology',
    'Comprehensive training manual for Getting Things Done methodology implementation in CRM-GTD Smart system.

## Introduction to Getting Things Done (GTD)

### What is GTD?
Getting Things Done (GTD) is a personal productivity methodology developed by David Allen. It is based on the principle of moving planned tasks and projects out of the mind by recording them externally and then breaking them into actionable work items.

### The GTD Philosophy
"Your mind is for having ideas, not holding them." - David Allen

The core idea is that our minds are much better at recognizing patterns and making creative connections than they are at remembering things. By capturing everything in a trusted system, we free our minds to focus on what is most important.

### Key Benefits of GTD
1. **Reduced Stress**: Clear mind, reduced anxiety
2. **Increased Focus**: Attention on current tasks
3. **Improved Productivity**: Efficient task management
4. **Better Decision Making**: Clear priorities
5. **Enhanced Creativity**: Free mental space for innovation

## The Five Steps of GTD

### Step 1: Capture
**"Collect everything that has your attention."**

#### What to Capture
- Tasks and to-dos
- Ideas and inspirations
- Commitments and promises
- Information and references
- Anything that requires action

#### How to Capture
- **Inbox**: Physical or digital collection point
- **Quick Notes**: Capture tools always available
- **Voice Memos**: For ideas on the go
- **Email**: Process emails into system
- **Meeting Notes**: Capture action items

#### Best Practices
- **One Collection Point**: Use inbox for everything
- **Capture Immediately**: Do not trust memory
- **Do not Analyze**: Just capture, do not process
- **Review Regularly**: Empty inbox frequently

### Step 2: Clarify
**"Process what it means to you."**

#### The Two-Minute Rule
If something takes less than two minutes, do it immediately. If it takes longer, either:
- **Delegate it** (if you are not the right person)
- **Defer it** (schedule it for later)
- **Delete it** (if it is not important)

#### Processing Questions
1. **What is it?** - Clarify the item
2. **Is it actionable?** - Does it require action?
3. **What is the next action?** - Define specific next step
4. **Will it take more than one step?** - Is it a project?

### Step 3: Organize
**"Put it where it belongs."**

#### GTD Lists
1. **Next Actions**: Specific actions to take
2. **Projects**: Multi-step outcomes
3. **Waiting For**: Items you are waiting for from others
4. **Someday/Maybe**: Items to review later
5. **Calendar**: Time-specific items
6. **Reference**: Information you might need

#### Contexts for Next Actions
- **@Computer**: Tasks requiring computer
- **@Calls**: Phone calls to make
- **@Office**: Office-specific tasks
- **@Home**: Home-based tasks
- **@Errands**: Tasks outside office
- **@Online**: Internet-based tasks
- **@Waiting**: Waiting for others

### Step 4: Reflect
**"Review frequently to stay current."**

#### Daily Review
- **Check Calendar**: Today appointments
- **Review Next Actions**: Choose tasks to do
- **Process Inbox**: Keep inbox empty
- **Update Lists**: Mark completed items

#### Weekly Review
**The cornerstone of GTD success**

1. **Collect**: Gather loose items
2. **Process**: Empty all inboxes
3. **Review**: Go through all lists
4. **Update**: Ensure lists are current

### Step 5: Engage
**"Simply do with confidence."**

#### Choosing Actions
Use the "Four Criteria Model":
1. **Context**: What can you do given location/tools?
2. **Time Available**: How much time do you have?
3. **Energy Available**: What is your energy level?
4. **Priority**: What is most important now?

## GTD in CRM-GTD Smart

### System Integration
Our CRM-GTD Smart system fully implements GTD methodology:

#### Capture Tools
- **Quick Capture**: Rapid item entry
- **Email Integration**: Convert emails to actions
- **Voice Capture**: Voice-to-text notes
- **Mobile App**: Capture on the go
- **Browser Extension**: Capture from web

#### Processing Features
- **Inbox Processing**: Guided processing workflow
- **Two-Minute Timer**: Built-in timer for quick actions
- **Decision Assistant**: Guided decision making
- **Batch Processing**: Process multiple items efficiently

#### Organization System
- **Context Management**: Flexible context system
- **Project Templates**: Pre-defined project structures
- **Smart Lists**: Dynamic list generation
- **Tagging System**: Flexible categorization
- **Advanced Search**: Find anything quickly

### Getting Started with GTD in CRM-GTD Smart

#### Week 1: Initial Setup
**Day 1-2: System Setup**
- Create account and profile
- Set up contexts (@computer, @calls, etc.)
- Configure notification preferences
- Install mobile app

**Day 3-4: Initial Capture**
- Dump everything into inbox
- Do not process yet, just capture
- Use quick capture for new items
- Set up capture habits

**Day 5-7: First Processing**
- Process inbox items one by one
- Use two-minute rule
- Create first next actions
- Set up first projects

Success with GTD is a journey, not a destination. Be patient with yourself, celebrate small wins, and keep improving your system.',
    'Comprehensive training manual for Getting Things Done methodology including the five steps, practical exercises, and integration with CRM-GTD Smart system.',
    'TUTORIAL',
    'PUBLISHED',
    ARRAY['GTD', 'training', 'productivity', 'methodology', 'David-Allen'],
    '11f4ba11-edec-49eb-87c9-c7c8b26944c7',
    'folder-training',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);

-- 6. FAQ Document
INSERT INTO documents (
    id,
    title,
    content,
    summary,
    type,
    status,
    tags,
    "authorId",
    "folderId",
    "organizationId",
    "createdAt",
    "updatedAt"
) VALUES (
    'doc-faq-001',
    'Frequently Asked Questions - CRM-GTD Smart',
    'Comprehensive FAQ covering common questions about CRM-GTD Smart system, features, and usage.

## Table of Contents
1. General Questions
2. Account & Setup
3. GTD Methodology
4. Task Management
5. Project Management
6. Communication Features
7. AI Features
8. Mobile App
9. Troubleshooting
10. Billing & Pricing
11. Security & Privacy

## General Questions

### Q: What is CRM-GTD Smart?
**A:** CRM-GTD Smart is a comprehensive business management system that combines Customer Relationship Management (CRM) functionality with Getting Things Done (GTD) methodology. It helps organizations manage contacts, companies, deals, tasks, and projects while implementing David Allen proven productivity system.

### Q: Who is CRM-GTD Smart designed for?
**A:** CRM-GTD Smart is designed for:
- Small to medium businesses
- Freelancers and consultants
- Project managers
- Sales teams
- Anyone looking to improve productivity using GTD methodology
- Organizations needing integrated CRM and task management

### Q: What makes CRM-GTD Smart different from other CRM systems?
**A:** Key differentiators include:
- **GTD Integration**: Full implementation of Getting Things Done methodology
- **AI-Powered Features**: Intelligent automation and analysis
- **Smart Mailboxes**: Advanced email processing and organization
- **Voice TTS**: Text-to-speech for accessibility
- **Unified Workflow**: Seamless integration between CRM and productivity features
- **Knowledge Management**: Built-in documentation and wiki system

### Q: Do I need to know GTD to use the system?
**A:** No, but it helps. The system includes:
- Comprehensive GTD training materials
- Built-in tutorials and guides
- Guided workflows for GTD implementation
- Optional GTD coaching and support
- Gradual learning curve with immediate benefits

### Q: Is there a free trial available?
**A:** Yes, we offer a 30-day free trial with full access to all features. No credit card required for trial signup.

## Account & Setup

### Q: How do I create an account?
**A:** To create an account:
1. Visit our signup page
2. Enter your email address
3. Choose a secure password
4. Verify your email address
5. Complete your profile setup
6. Start using the system immediately

### Q: Can I import data from other systems?
**A:** Yes, we support import from:
- **CRM Systems**: Salesforce, HubSpot, Pipedrive
- **Email Clients**: Gmail, Outlook, Apple Mail
- **Task Managers**: Todoist, Asana, Trello
- **File Formats**: CSV, Excel, JSON
- **Custom Integration**: API-based imports

### Q: How do I set up my organization?
**A:** Organization setup includes:
1. **Basic Information**: Company name, industry, size
2. **Team Members**: Invite users and set permissions
3. **Customization**: Configure fields, workflows, and preferences
4. **Integration**: Connect email, calendar, and other tools
5. **Data Import**: Bring in existing data
6. **Training**: Access training materials and support

## GTD Methodology

### Q: What is Getting Things Done (GTD)?
**A:** GTD is a productivity methodology created by David Allen based on five key steps:
1. **Capture**: Collect everything that has your attention
2. **Clarify**: Process what it means to you
3. **Organize**: Put it where it belongs
4. **Reflect**: Review frequently to stay current
5. **Engage**: Simply do with confidence

### Q: How does the system implement GTD?
**A:** Our GTD implementation includes:
- **Inbox System**: Central capture point for all items
- **Processing Workflow**: Guided two-minute rule and decision making
- **Context Organization**: Flexible context system (@computer, @calls, etc.)
- **Project Management**: Multi-step project planning and tracking
- **Review System**: Daily and weekly review templates
- **Someday/Maybe**: Future possibility tracking

## Task Management

### Q: How do I create a task?
**A:** To create a task:
1. Click "New Task" or use Quick Capture
2. Enter task title (make it specific and actionable)
3. Add description, due date, and priority
4. Select context (@computer, @calls, etc.)
5. Assign to project (if applicable)
6. Set reminders and notifications
7. Save task

### Q: What makes a good task title?
**A:** Good task titles are:
- **Specific**: Clear what needs to be done
- **Actionable**: Start with action verb
- **Complete**: Include all necessary information
- **Measurable**: Know when it is done

Examples:
- Bad: "John" → Good: "Call John about project deadline"
- Bad: "Website" → Good: "Review website mockups and provide feedback"

## Security & Privacy

### Q: How secure is my data?
**A:** Security measures:
- **Encryption**: AES-256 encryption at rest and in transit
- **Access Controls**: Role-based permissions
- **Authentication**: Multi-factor authentication
- **Monitoring**: 24/7 security monitoring
- **Compliance**: SOC 2, GDPR, and other standards
- **Backups**: Regular encrypted backups

### Q: Where is my data stored?
**A:** Data storage:
- **Primary**: Secure data centers in US and EU
- **Backups**: Multiple geographic locations
- **Compliance**: GDPR and other regulatory compliance
- **Redundancy**: Multiple copies for reliability
- **Access**: Strict access controls and monitoring

## Contact Support
- **Email**: support@crm-gtd-smart.com
- **Phone**: +48 123 456 789
- **Live Chat**: Available 24/7
- **Support Portal**: https://support.crm-gtd-smart.com

We are here to help you succeed with CRM-GTD Smart. Do not hesitate to reach out with any questions or concerns!',
    'Comprehensive FAQ covering all aspects of CRM-GTD Smart including features, usage, troubleshooting, and support information.',
    'FAQ',
    'PUBLISHED',
    ARRAY['FAQ', 'help', 'support', 'questions', 'troubleshooting'],
    '6a1ae76d-4fac-4502-8342-4740dce3f43d',
    'folder-docs',
    'fe59f2b0-93d0-4193-9bab-aee778c1a449',
    NOW(),
    NOW()
);