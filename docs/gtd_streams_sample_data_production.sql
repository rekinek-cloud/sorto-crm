-- ===================================================================
-- GTD STREAMS - PRODUCTION SAMPLE DATA
-- Realistic hierarchical streams data matching your exact database schema
-- ===================================================================

-- PREREQUISITES: Assuming you have organizationId and userId in your system
-- Replace 'your-org-id' and 'your-user-id' with actual values

-- ===================================================================
-- 1. TARGI I EVENTY - Complete event management hierarchy
-- ===================================================================

-- Parent Area: Event Management
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-events-2025', 'Events & Targi 2025', 'Zarządzanie wszystkimi targami i eventami w roku 2025', '#3B82F6', '🎪', 
'{
  "notifications": true,
  "autoArchive": false,
  "teamCollaboration": true,
  "defaultPriority": "HIGH"
}', 
'ACTIVE', 'AREAS', NULL,
'{
  "areaType": "EVENTS_MANAGEMENT",
  "reviewFrequency": "MONTHLY",
  "successMetrics": ["ROI > 200%", "Lead generation > 500", "Brand awareness +40%"],
  "annualBudget": 200000,
  "teamSize": 6,
  "kpis": {
    "targetEvents": 8,
    "targetLeads": 500,
    "averageROI": 250,
    "costPerLead": 150
  },
  "responsibilities": [
    "Planowanie udziału w targach",
    "Zarządzanie budżetem eventowym", 
    "Koordynacja zespołu eventowego",
    "Analiza ROI z targów"
  ]
}', 
'AREA', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Targi IT Kraków
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-targi-it-krakow', 'Targi IT Kraków 2025', 'Udział w największych targach IT w Polsce - kompleksowy projekt', '#10B981', '🏢', 
'{
  "notifications": true,
  "autoCreateTasks": true,
  "teamCollaboration": true,
  "milestoneTracking": true
}',
'ACTIVE', 'PROJECTS', 'trade-show-template',
'{
  "projectType": "TRADE_SHOW",
  "eventDetails": {
    "eventDate": "2025-09-15",
    "eventEndDate": "2025-09-17", 
    "location": "ICE Kraków, ul. Marii Konopnickiej 17",
    "website": "https://targii-it.krakow.pl"
  },
  "boothInfo": {
    "number": "H12.3",
    "size": "6x4m",
    "type": "corner",
    "electricity": "16A",
    "internet": true,
    "furnitureIncluded": false
  },
  "budget": {
    "total": 35000,
    "breakdown": {
      "boothRental": 12000,
      "designAndBuild": 8000,
      "travelAccommodation": 4000,
      "marketingMaterials": 5000,
      "staffCosts": 6000
    },
    "spent": 8500,
    "remaining": 26500
  },
  "targets": {
    "leads": 60,
    "demos": 25,
    "meetings": 20,
    "roiPercent": 220,
    "brandAwareness": 15000
  },
  "team": [
    {"name": "Anna Kowalska", "role": "Project Manager", "email": "a.kowalska@company.com"},
    {"name": "Piotr Nowak", "role": "Sales Lead", "email": "p.nowak@company.com"},
    {"name": "Michał Tech", "role": "Technical Demo", "email": "m.tech@company.com"},
    {"name": "Joanna Marketing", "role": "Marketing Support", "email": "j.marketing@company.com"}
  ],
  "phases": [
    {
      "name": "Planowanie i przygotowanie",
      "startDate": "2025-07-01",
      "endDate": "2025-09-10",
      "status": "IN_PROGRESS"
    },
    {
      "name": "Realizacja (dni targów)",
      "startDate": "2025-09-15", 
      "endDate": "2025-09-17",
      "status": "PLANNED"
    },
    {
      "name": "Follow-up i analiza",
      "startDate": "2025-09-18",
      "endDate": "2025-10-15", 
      "status": "PLANNED"
    }
  ],
  "deliverables": [
    "Stoisko zgodnie z projektem",
    "Materiały marketingowe",
    "Demo produktu", 
    "Lista leadów",
    "Raport ROI"
  ]
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Mobile World Congress
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-mwc-barcelona', 'Mobile World Congress Barcelona 2025', 'Ekspansja na rynek europejski - międzynarodowa konferencja', '#8B5CF6', '🌍', 
'{
  "notifications": true,
  "autoCreateTasks": true,
  "internationalEvent": true,
  "currencyTracking": "EUR"
}',
'ACTIVE', 'PROJECTS', 'international-conference-template',
'{
  "projectType": "INTERNATIONAL_CONFERENCE",
  "eventDetails": {
    "eventDate": "2025-02-26",
    "eventEndDate": "2025-02-28",
    "location": "Fira Barcelona, Spain",
    "timezone": "CET",
    "website": "https://www.mwcbarcelona.com"
  },
  "boothInfo": {
    "number": "7G31",
    "size": "4x3m",
    "type": "standard",
    "included": ["basic_furniture", "electricity", "internet"]
  },
  "budget": {
    "total": 45000,
    "currency": "EUR",
    "breakdown": {
      "boothRental": 15000,
      "travelAccommodation": 12000,
      "logistics": 8000,
      "marketing": 6000,
      "miscellaneous": 4000
    }
  },
  "targets": {
    "leads": 80,
    "internationalContacts": 30,
    "partnershipMeetings": 8,
    "roiPercent": 180,
    "mediaContacts": 5
  },
  "logistics": {
    "shipmentDeadline": "2025-02-15",
    "setupDay": "2025-02-25",
    "dismantleDay": "2025-03-01"
  }
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Workspace: Event Materials & Assets
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-event-materials', 'Event Materials & Assets', 'Centralny magazyn materiałów targowych i zasobów eventowych', '#F59E0B', '📦', 
'{
  "inventoryTracking": true,
  "assetManagement": true,
  "reorderAlerts": true,
  "qualityControl": true
}',
'ACTIVE', 'REFERENCE', 'materials-warehouse-template',
'{
  "warehouseType": "EVENT_ASSETS",
  "categories": [
    {
      "name": "Roll-up banners",
      "currentStock": 8,
      "condition": "good",
      "lastUpdated": "2025-01-15"
    },
    {
      "name": "Demo hardware", 
      "items": ["laptops", "tablets", "vr_headsets"],
      "currentStock": 12,
      "requiresCalibration": true
    },
    {
      "name": "Branded merchandise",
      "currentStock": 500,
      "reorderPoint": 100,
      "supplier": "PromoMax Sp. z o.o."
    }
  ],
  "reorderPoints": {
    "businessCards": 1000,
    "usbDrives": 50,
    "tShirts": 100,
    "brochures": 200
  },
  "qualityChecks": {
    "lastInspection": "2025-01-10",
    "nextInspection": "2025-04-10",
    "inspector": "Michał Tech"
  }
}',
'WORKSPACE', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Context: Event Team Coordination
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-event-coordination', 'Event Team Coordination', 'Koordynacja zespołu eventowego i konteksty pracy', '#EC4899', '👥', 
'{
  "teamChat": true,
  "meetingScheduling": true,
  "taskAssignment": true,
  "progressTracking": true
}',
'ACTIVE', 'CONTEXTS', 'team-coordination-template',
'{
  "contextType": "TEAM_COORDINATION",
  "availableContexts": [
    {
      "name": "@event_planning",
      "description": "Strategiczne planowanie eventów",
      "energyLevel": "HIGH",
      "tools": ["calendar", "budget_spreadsheet", "project_plan"]
    },
    {
      "name": "@logistics_coordination", 
      "description": "Koordynacja logistyczna i transport",
      "energyLevel": "MEDIUM",
      "tools": ["phone", "email", "logistics_app"]
    },
    {
      "name": "@booth_design",
      "description": "Projektowanie i budowa stoiska",
      "energyLevel": "CREATIVE",
      "tools": ["design_software", "3d_modeling", "materials_catalog"]
    },
    {
      "name": "@lead_follow_up", 
      "description": "Follow-up z leadami po evencie",
      "energyLevel": "MEDIUM",
      "tools": ["crm", "phone", "email_templates"]
    }
  ],
  "communicationChannels": {
    "slack": "#events-2025",
    "email": "events-team@company.com",
    "meetingSchedule": "Tuesdays 10:00 CET"
  },
  "sharedResources": [
    "Event master calendar",
    "Contact database",
    "Budget tracking dashboard",
    "Asset inventory system"
  ]
}',
'CONTEXT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Create stream relations (parent-child relationships)
INSERT INTO stream_relations (id, "parentId", "childId", "relationType", description, "isActive", "inheritanceRule", "createdById", "createdAt", "updatedAt", "organizationId") VALUES
('rel-events-targi-krakow', 'stream-events-2025', 'stream-targi-it-krakow', 'BELONGS_TO', 'Targi IT Kraków jako część strategii eventowej 2025', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-events-mwc', 'stream-events-2025', 'stream-mwc-barcelona', 'BELONGS_TO', 'MWC Barcelona jako część ekspansji międzynarodowej', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-events-materials', 'stream-events-2025', 'stream-event-materials', 'SUPPORTS', 'Materiały wspierają wszystkie eventy', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-events-coordination', 'stream-events-2025', 'stream-event-coordination', 'MANAGES', 'Koordynacja zespołu dla wszystkich eventów', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id');

-- ===================================================================
-- 2. ZARZĄDZANIE KLIENTAMI - Client portfolio hierarchy
-- ===================================================================

-- Parent Area: Enterprise Clients
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-enterprise-clients', 'Enterprise Clients Portfolio', 'Zarządzanie portfelem klientów Enterprise - strategiczne partnerstwa', '#1F2937', '🏢', 
'{
  "crmIntegration": true,
  "revenueTracking": true,
  "healthScoring": true,
  "escalationAlerts": true
}',
'ACTIVE', 'AREAS', NULL,
'{
  "areaType": "CLIENT_MANAGEMENT",
  "clientTier": "ENTERPRISE",
  "portfolioMetrics": {
    "totalValue": 2500000,
    "clientsCount": 8,
    "averageContractLength": 24,
    "retentionRate": 0.95
  },
  "successMetrics": [
    "Revenue growth > 20% YoY",
    "Client satisfaction > 8.5/10", 
    "Retention rate > 90%",
    "Expansion revenue > 30%"
  ],
  "teamStructure": {
    "accountManagers": 3,
    "customerSuccess": 2,
    "technicalSupport": 4,
    "managementLayer": 1
  },
  "reviewSchedule": {
    "clientHealthReview": "WEEKLY",
    "portfolioReview": "MONTHLY",
    "strategyReview": "QUARTERLY"
  }
}',
'AREA', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Microsoft Corporation Partnership
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-client-microsoft', 'Microsoft Corporation Partnership', 'Strategiczne partnerstwo z Microsoft - flagship klient Enterprise', '#0078D4', '🏛️', 
'{
  "vipClient": true,
  "escalationPriority": "HIGH",
  "executiveReports": true,
  "customDashboard": true
}',
'ACTIVE', 'PROJECTS', 'enterprise-client-template',
'{
  "clientType": "STRATEGIC_ENTERPRISE",
  "contractDetails": {
    "value": 850000,
    "currency": "USD",
    "startDate": "2024-01-15",
    "endDate": "2026-01-14",
    "renewalProbability": 0.85,
    "autoRenewal": false
  },
  "healthMetrics": {
    "overallScore": 8.7,
    "userAdoption": 0.92,
    "supportTicketsTrend": "decreasing",
    "featureUsage": 0.78,
    "paymentHistory": "excellent"
  },
  "stakeholders": [
    {
      "name": "John Smith",
      "role": "CTO", 
      "influence": "high",
      "contact": "j.smith@microsoft.com",
      "lastContact": "2025-01-10"
    },
    {
      "name": "Anna Brown",
      "role": "Procurement Manager",
      "influence": "medium", 
      "contact": "a.brown@microsoft.com",
      "decisionMaker": true
    },
    {
      "name": "David Wilson",
      "role": "IT Director",
      "influence": "high",
      "contact": "d.wilson@microsoft.com",
      "technicalContact": true
    }
  ],
  "productsUsed": [
    "CRM Premium",
    "AI Analytics Module", 
    "Integration Platform",
    "Advanced Reporting"
  ],
  "expansionOpportunities": {
    "teamsIntegration": {
      "value": 150000,
      "probability": 0.7,
      "timeline": "Q2 2025"
    },
    "powerbiConnector": {
      "value": 75000,
      "probability": 0.8,
      "timeline": "Q3 2025"
    },
    "advancedAI": {
      "value": 200000,
      "probability": 0.5,
      "timeline": "Q4 2025"
    }
  },
  "riskFactors": [
    "Contract renewal in 12 months",
    "New procurement policies",
    "Budget constraints in IT department"
  ]
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Allegro Tech Team Implementation 
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-client-allegro', 'Allegro Tech Team Implementation', 'Implementacja narzędzi dla zespołu tech Allegro - rapid growth client', '#FF5A00', '🚀', 
'{
  "implementationMode": true,
  "rapidGrowth": true,
  "techIntegration": true,
  "agileMethodology": true
}',
'ACTIVE', 'PROJECTS', 'tech-implementation-template',
'{
  "clientType": "TECH_ENTERPRISE",
  "implementation": {
    "phase": "ROLLOUT",
    "progress": 0.75,
    "goLiveDate": "2025-03-01",
    "teamSize": 120,
    "departmentsCount": 8
  },
  "contractDetails": {
    "value": 450000,
    "currency": "PLN",
    "paymentTerms": "milestone-based",
    "completionBonus": 25000
  },
  "stakeholders": [
    {
      "name": "Tomasz Kowalski",
      "role": "Head of Engineering",
      "influence": "high",
      "contact": "t.kowalski@allegro.pl"
    },
    {
      "name": "Magdalena Nowak", 
      "role": "DevOps Lead",
      "influence": "medium",
      "contact": "m.nowak@allegro.pl"
    }
  ],
  "integrationRequirements": [
    {
      "system": "Jira",
      "status": "completed",
      "complexity": "medium"
    },
    {
      "system": "GitLab CI/CD",
      "status": "in_progress",
      "complexity": "high"
    },
    {
      "system": "Slack notifications",
      "status": "completed", 
      "complexity": "low"
    },
    {
      "system": "Custom API endpoints",
      "status": "planned",
      "complexity": "high"
    }
  ],
  "successCriteria": {
    "deploymentTimeReduction": {
      "target": 0.4,
      "current": 0.3,
      "status": "on_track"
    },
    "bugTrackingEfficiency": {
      "target": 0.6,
      "current": 0.45,
      "status": "behind"
    },
    "teamSatisfaction": {
      "target": 8.0,
      "current": 7.2,
      "status": "on_track"
    }
  }
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Workspace: Client Onboarding Pipeline
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-client-onboarding', 'Client Onboarding Pipeline', 'Standardowy proces onboardingu nowych klientów Enterprise', '#059669', '🎯', 
'{
  "pipelineManagement": true,
  "stageAutomation": true,
  "qualityGates": true,
  "timeTracking": true
}',
'ACTIVE', 'NEXT_ACTIONS', 'onboarding-pipeline-template',
'{
  "pipelineType": "CLIENT_ONBOARDING",
  "phases": [
    {
      "name": "Discovery & Planning",
      "duration": 14,
      "deliverables": [
        "Requirements analysis report",
        "Detailed project plan",
        "Team assignments and responsibilities",
        "Success criteria definition"
      ],
      "qualityGates": ["stakeholder_approval", "technical_feasibility"]
    },
    {
      "name": "Technical Setup",
      "duration": 21,
      "deliverables": [
        "Environment configuration",
        "System integrations",
        "Data migration plan",
        "Security setup"
      ],
      "qualityGates": ["security_audit", "performance_test"]
    },
    {
      "name": "Training & Rollout", 
      "duration": 28,
      "deliverables": [
        "User training sessions",
        "Go-live execution",
        "Performance optimization",
        "Initial support"
      ],
      "qualityGates": ["user_acceptance", "performance_benchmark"]
    },
    {
      "name": "Success & Optimization",
      "duration": 30,
      "deliverables": [
        "Success metrics review",
        "Optimization recommendations",
        "Expansion opportunities",
        "Handover to account management"
      ],
      "qualityGates": ["success_criteria_met", "client_satisfaction"]
    }
  ],
  "currentPipeline": [
    {
      "client": "TechStart Sp. z o.o.",
      "phase": "Discovery & Planning",
      "startDate": "2025-01-15",
      "progress": 0.6,
      "nextMilestone": "Technical feasibility review"
    },
    {
      "client": "BigCorp Industries",
      "phase": "Technical Setup", 
      "startDate": "2024-12-01",
      "progress": 0.8,
      "nextMilestone": "Security audit"
    },
    {
      "client": "Innovation Labs",
      "phase": "Training & Rollout",
      "startDate": "2024-11-15", 
      "progress": 0.9,
      "nextMilestone": "Go-live"
    }
  ],
  "kpis": {
    "averageOnboardingTime": 93,
    "clientSatisfactionScore": 8.4,
    "timeToFirstValue": 21,
    "expansionRate": 0.35
  }
}',
'WORKSPACE', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Create client management stream relations
INSERT INTO stream_relations (id, "parentId", "childId", "relationType", description, "isActive", "inheritanceRule", "createdById", "createdAt", "updatedAt", "organizationId") VALUES
('rel-clients-microsoft', 'stream-enterprise-clients', 'stream-client-microsoft', 'OWNS', 'Microsoft jako kluczowy klient strategiczny', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-clients-allegro', 'stream-enterprise-clients', 'stream-client-allegro', 'OWNS', 'Allegro jako klient tech enterprise', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-clients-onboarding', 'stream-enterprise-clients', 'stream-client-onboarding', 'SUPPORTS', 'Pipeline onboardingu wspiera wszystkich klientów', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id');

-- ===================================================================
-- 3. ROZWÓJ PRODUKTU - Product development hierarchy
-- ===================================================================

-- Parent Area: Product Development Strategy
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-product-development', 'Product Development 2025', 'Strategia rozwoju produktu - roadmapa i innovacje', '#7C3AED', '🚀', 
'{
  "roadmapTracking": true,
  "featurePrioritization": true,
  "userFeedback": true,
  "competitorAnalysis": true
}',
'ACTIVE', 'AREAS', NULL,
'{
  "areaType": "PRODUCT_DEVELOPMENT", 
  "productStage": "SCALE",
  "businessMetrics": {
    "userBase": 5000,
    "monthlyGrowth": 0.15,
    "churnRate": 0.032,
    "nps": 68,
    "featureAdoption": 0.78
  },
  "developmentBudget": 800000,
  "teamStructure": {
    "frontendDevelopers": 4,
    "backendDevelopers": 5,
    "uiUxDesigners": 2,
    "productManagers": 2,
    "qaEngineers": 3,
    "devopsEngineers": 1
  },
  "techStack": {
    "frontend": "Next.js 14, TypeScript, Tailwind CSS",
    "backend": "Node.js, Express, PostgreSQL",
    "infrastructure": "Docker, AWS, Nginx",
    "ai": "OpenAI GPT-4, Claude"
  },
  "roadmapQuarters": {
    "Q1_2025": "AI Assistant, Mobile MVP",
    "Q2_2025": "Advanced Analytics, API v2",
    "Q3_2025": "Enterprise Features, Integrations",
    "Q4_2025": "ML Predictions, Global Expansion"
  }
}',
'AREA', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: AI Assistant Integration
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-ai-assistant', 'AI Assistant Integration', 'Implementacja zaawansowanego AI asystenta - flagship feature 2025', '#EF4444', '🤖', 
'{
  "aiDevelopment": true,
  "userTesting": true,
  "performanceOptimization": true,
  "securityFirst": true
}',
'ACTIVE', 'PROJECTS', 'ai-feature-template',
'{
  "featureType": "MAJOR_AI_FEATURE",
  "priority": "HIGH",
  "complexity": "HIGH",
  "estimatedEffort": "3 months",
  "teamAssigned": [
    "Anna Frontend - Lead Developer",
    "Piotr Backend - AI Integration", 
    "Michał AI - ML Engineer",
    "Joanna QA - Testing Specialist"
  ],
  "technicalRequirements": {
    "aiProvider": "OpenAI GPT-4",
    "fallbackProvider": "Claude-3",
    "responseTime": "<2s",
    "accuracyTarget": 0.9,
    "languages": ["Polish", "English"],
    "concurrentUsers": 1000
  },
  "userStories": [
    {
      "story": "As a user, I want AI to suggest next actions based on my GTD inbox",
      "priority": "HIGH",
      "storyPoints": 8
    },
    {
      "story": "As a user, I want AI to categorize my emails automatically",
      "priority": "HIGH", 
      "storyPoints": 5
    },
    {
      "story": "As a user, I want AI to extract tasks from meeting notes",
      "priority": "MEDIUM",
      "storyPoints": 13
    },
    {
      "story": "As a user, I want AI to predict project completion dates",
      "priority": "MEDIUM",
      "storyPoints": 8
    }
  ],
  "successMetrics": {
    "userAdoption": 0.7,
    "featureUsageWeekly": 0.8,
    "userSatisfaction": 8.5,
    "accuracyRate": 0.85,
    "performanceGoal": "sub-2s"
  },
  "milestones": [
    {
      "name": "MVP Prototype",
      "date": "2025-02-15",
      "status": "COMPLETED",
      "deliverables": ["Basic AI chat", "Email processing", "Simple suggestions"]
    },
    {
      "name": "Beta Testing",
      "date": "2025-03-15",
      "status": "IN_PROGRESS", 
      "deliverables": ["User testing", "Performance optimization", "Security audit"]
    },
    {
      "name": "Production Release",
      "date": "2025-04-15",
      "status": "PLANNED",
      "deliverables": ["Full feature rollout", "Documentation", "Support training"]
    }
  ],
  "riskMitigation": [
    "AI response accuracy monitoring",
    "Fallback to human processing",
    "Rate limiting and cost controls",
    "Privacy and data protection compliance"
  ]
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Mobile App MVP
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-mobile-app', 'Mobile App MVP', 'Pierwsza wersja aplikacji mobilnej - React Native implementation', '#06B6D4', '📱', 
'{
  "mobileDevelopment": true,
  "crossPlatform": true,
  "offlineSync": true,
  "appStoreOptimization": true
}',
'ACTIVE', 'PROJECTS', 'mobile-app-template', 
'{
  "featureType": "NEW_PLATFORM",
  "priority": "MEDIUM",
  "estimatedEffort": "6 months",
  "platforms": ["iOS", "Android"],
  "technology": "React Native 0.73",
  "coreFeatures": [
    {
      "name": "GTD Inbox processing",
      "priority": "HIGH",
      "complexity": "MEDIUM",
      "estimatedDays": 14
    },
    {
      "name": "Task management",
      "priority": "HIGH", 
      "complexity": "MEDIUM",
      "estimatedDays": 21
    },
    {
      "name": "Email quick actions",
      "priority": "MEDIUM",
      "complexity": "HIGH", 
      "estimatedDays": 18
    },
    {
      "name": "Offline synchronization",
      "priority": "MEDIUM",
      "complexity": "HIGH",
      "estimatedDays": 25
    }
  ],
  "targetMetrics": {
    "appStoreRating": 4.5,
    "downloadsMonth1": 1000,
    "dailyActiveUsers": 300,
    "sessionDuration": "5 minutes",
    "crashRate": "<1%"
  },
  "developmentPhases": [
    {
      "name": "Architecture & Setup",
      "duration": 3,
      "status": "COMPLETED",
      "deliverables": ["Project setup", "CI/CD pipeline", "Base navigation"]
    },
    {
      "name": "Core Features Development", 
      "duration": 8,
      "status": "IN_PROGRESS",
      "deliverables": ["Inbox UI", "Task management", "Sync engine"]
    },
    {
      "name": "Testing & Optimization",
      "duration": 4,
      "status": "PLANNED", 
      "deliverables": ["Beta testing", "Performance optimization", "Bug fixes"]
    },
    {
      "name": "App Store Submission",
      "duration": 2,
      "status": "PLANNED",
      "deliverables": ["Store assets", "Submission", "Marketing materials"]
    }
  ],
  "technicalConsiderations": [
    "Offline-first architecture",
    "Secure data synchronization", 
    "Battery usage optimization",
    "Platform-specific UI guidelines",
    "Push notifications setup"
  ]
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Workspace: User Research & Analytics
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-user-research', 'User Research & Analytics', 'Centrum badań użytkowników i analiz produktowych', '#F97316', '📊', 
'{
  "analyticsTracking": true,
  "userInterviews": true,
  "abTesting": true,
  "competitorAnalysis": true
}',
'ACTIVE', 'REFERENCE', 'research-center-template',
'{
  "researchType": "USER_EXPERIENCE_ANALYTICS",
  "researchMethods": [
    {
      "name": "User interviews",
      "frequency": "bi-weekly",
      "participants": "5-8 per session",
      "focus": "qualitative insights"
    },
    {
      "name": "A/B testing",
      "frequency": "continuous",
      "tools": ["Optimizely", "Google Analytics"],
      "focus": "conversion optimization"
    },
    {
      "name": "Usage analytics",
      "frequency": "daily",
      "tools": ["Mixpanel", "Hotjar"],
      "focus": "behavioral patterns"
    },
    {
      "name": "Customer surveys",
      "frequency": "monthly", 
      "method": "NPS + custom questions",
      "focus": "satisfaction tracking"
    }
  ],
  "currentStudies": [
    {
      "name": "GTD workflow optimization study",
      "method": "User interviews + task analysis",
      "participants": 25,
      "status": "IN_PROGRESS",
      "completion": "2025-02-28",
      "keyFindings": ["85% want better email-task integration", "Manual categorization is main pain point"]
    },
    {
      "name": "Mobile app feature priorities research",
      "method": "Survey + analytics correlation",
      "participants": 500,
      "status": "ANALYSIS_PHASE",
      "completion": "2025-01-31",
      "keyFindings": ["Offline sync is #1 priority", "Voice input highly requested"]
    },
    {
      "name": "AI features user acceptance testing",
      "method": "Prototype testing + interviews",
      "participants": 15,
      "status": "COMPLETED",
      "completion": "2025-01-15",
      "keyFindings": ["92% positive feedback", "Privacy concerns need addressing"]
    }
  ],
  "keyInsights": [
    "85% users want better email-task integration",
    "Mobile usage grew 340% in Q4 2024",
    "AI features have 92% positive feedback",
    "Offline functionality is top mobile request",
    "Voice input requested by 67% of mobile users"
  ],
  "analyticsKPIs": {
    "monthlyActiveUsers": 4650,
    "userRetention30Days": 0.68,
    "featureAdoptionRate": 0.78,
    "supportTicketReduction": 0.15
  }
}',
'WORKSPACE', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Create product development stream relations
INSERT INTO stream_relations (id, "parentId", "childId", "relationType", description, "isActive", "inheritanceRule", "createdById", "createdAt", "updatedAt", "organizationId") VALUES
('rel-product-ai-assistant', 'stream-product-development', 'stream-ai-assistant', 'OWNS', 'AI Assistant jako flagship feature 2025', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-product-mobile', 'stream-product-development', 'stream-mobile-app', 'OWNS', 'Mobile App jako nowa platforma', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-product-research', 'stream-product-development', 'stream-user-research', 'SUPPORTS', 'Research wspiera wszystkie decyzje produktowe', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id');

-- ===================================================================
-- 4. KAMPANIE MARKETINGOWE - Marketing campaigns hierarchy
-- ===================================================================

-- Parent Area: Marketing Strategy
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-marketing-strategy', 'Marketing Strategy 2025', 'Kompleksowa strategia marketingowa na rok 2025', '#DC2626', '📈', 
'{
  "campaignTracking": true,
  "roiCalculation": true,
  "audienceSegmentation": true,
  "contentCalendar": true
}',
'ACTIVE', 'AREAS', NULL,
'{
  "areaType": "MARKETING_STRATEGY",
  "annualBudget": 500000,
  "targetMetrics": {
    "leadsGenerated": 2000,
    "qualifiedLeads": 500,
    "customerAcquisitionCost": 250,
    "brandAwarenessIncrease": 0.4,
    "websiteTraffic": 150000
  },
  "channelMix": {
    "contentMarketing": 0.3,
    "paidAdvertising": 0.25,
    "eventSponsorship": 0.2,
    "emailMarketing": 0.15,
    "socialMedia": 0.1
  },
  "teamStructure": {
    "contentCreators": 2,
    "paidAdsSpecialist": 1,
    "emailMarketingSpecialist": 1,
    "designer": 1,
    "marketingManager": 1,
    "analyticsSpecialist": 1
  },
  "keyInitiatives": [
    "AI product launch campaign",
    "Thought leadership content series",
    "Partnership marketing program",
    "Customer success stories",
    "International market expansion"
  ]
}',
'AREA', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: Q1 AI Product Launch Campaign
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-ai-launch-campaign', 'Q1 AI Product Launch Campaign', 'Integrated marketing campaign for AI Assistant launch', '#8B5CF6', '🚀', 
'{
  "campaignManagement": true,
  "multiChannel": true,
  "realTimeOptimization": true,
  "abTesting": true
}',
'ACTIVE', 'PROJECTS', 'product-launch-template',
'{
  "campaignType": "PRODUCT_LAUNCH",
  "launchDate": "2025-03-01",
  "campaignDuration": 8,
  "totalBudget": 75000,
  "targetAudience": {
    "primary": "IT Directors in 100-500 employee companies",
    "secondary": "Productivity enthusiasts and GTD practitioners", 
    "tertiary": "Small business owners looking for automation"
  },
  "channels": [
    {
      "name": "Google Ads",
      "budget": 25000,
      "targetImpressions": 500000,
      "targetClicks": 12500,
      "expectedCTR": 0.025,
      "landingPage": "ai-features"
    },
    {
      "name": "LinkedIn Sponsored Content",
      "budget": 20000,
      "targetImpressions": 200000,
      "targetClicks": 8000,
      "expectedCTR": 0.04,
      "targeting": "job_titles + company_size"
    },
    {
      "name": "Content Marketing Hub",
      "budget": 15000,
      "deliverables": [
        "AI productivity blog series (8 posts)",
        "Video tutorial series (5 episodes)",
        "Interactive demo experience",
        "Webinar: 'AI in Daily Productivity'"
      ]
    },
    {
      "name": "Email Campaign Series",
      "budget": 5000,
      "targetSends": 50000,
      "expectedOpens": 12500,
      "segmentation": "engagement_level + product_usage"
    },
    {
      "name": "Influencer Partnerships",
      "budget": 10000,
      "partners": ["Productivity podcasts", "Business YouTube channels"],
      "expectedReach": 100000
    }
  ],
  "successMetrics": {
    "primaryGoals": {
      "leadsGenerated": 300,
      "demoRequests": 75,
      "trialSignups": 150,
      "paidConversions": 25
    },
    "secondaryGoals": {
      "brandAwareness": 15000,
      "socialEngagement": 5000,
      "contentShares": 1000,
      "mediaFootprints": 10
    }
  },
  "campaignAssets": {
    "heroVideo": "AI Assistant in action (60s)",
    "demoVideos": "Feature walkthroughs (5x 3min)",
    "whitepapers": "AI Productivity Guide",
    "caseStudies": "Early adopter success stories",
    "pressKit": "Media resources and announcements"
  }
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Child Project: SEO Content Strategy
INSERT INTO streams (id, name, description, color, icon, settings, status, "gtdRole", "templateOrigin", "gtdConfig", "streamType", "organizationId", "createdById", "createdAt", "updatedAt") VALUES
('stream-seo-content', 'SEO Content Strategy Q1-Q2', 'Organiczna strategia treści SEO na pierwszą połowę roku', '#059669', '📝', 
'{
  "contentCalendar": true,
  "keywordTracking": true,
  "competitorAnalysis": true,
  "performanceOptimization": true
}',
'ACTIVE', 'PROJECTS', 'seo-content-template',
'{
  "campaignType": "CONTENT_SEO",
  "duration": 6,
  "totalBudget": 45000,
  "contentCalendar": {
    "blogPostsMonthly": 8,
    "landingPagesTotal": 12,
    "caseStudiesTotal": 6,
    "videoContentTotal": 4,
    "infographicsTotal": 3
  },
  "targetKeywords": [
    {
      "keyword": "GTD software",
      "searchVolume": 2400,
      "difficulty": 65,
      "currentRanking": 15,
      "targetRanking": 5
    },
    {
      "keyword": "CRM automation",
      "searchVolume": 3600,
      "difficulty": 72,
      "currentRanking": 23,
      "targetRanking": 8
    },
    {
      "keyword": "email productivity tools",
      "searchVolume": 1800,
      "difficulty": 58,
      "currentRanking": 12,
      "targetRanking": 3
    },
    {
      "keyword": "AI productivity assistant",
      "searchVolume": 4200,
      "difficulty": 78,
      "currentRanking": null,
      "targetRanking": 10
    }
  ],
  "contentThemes": [
    {
      "theme": "GTD Methodology Deep Dives",
      "contentPieces": 12,
      "keywordFocus": "getting things done software"
    },
    {
      "theme": "AI Productivity Revolution",
      "contentPieces": 8,
      "keywordFocus": "AI productivity tools"
    },
    {
      "theme": "CRM Best Practices",
      "contentPieces": 10,
      "keywordFocus": "CRM automation tips"
    }
  ],
  "successMetrics": {
    "organicTrafficIncrease": 0.5,
    "keywordRankingsTop10": 25,
    "backlinksAcquired": 50,
    "contentEngagementRate": 0.15,
    "leadGeneration": 120
  },
  "competitorAnalysis": {
    "primaryCompetitors": ["Todoist", "Notion", "Asana"],
    "contentGaps": ["AI-powered GTD", "Email-task integration", "Advanced automation"],
    "opportunityKeywords": 47
  }
}',
'PROJECT', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Create marketing stream relations
INSERT INTO stream_relations (id, "parentId", "childId", "relationType", description, "isActive", "inheritanceRule", "createdById", "createdAt", "updatedAt", "organizationId") VALUES
('rel-marketing-ai-launch', 'stream-marketing-strategy', 'stream-ai-launch-campaign', 'OWNS', 'AI Launch jako główna kampania Q1', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id'),
('rel-marketing-seo', 'stream-marketing-strategy', 'stream-seo-content', 'OWNS', 'SEO jako długoterminowa strategia treści', true, 'INHERIT_DOWN', 'your-user-id', NOW(), NOW(), 'your-org-id');

-- ===================================================================
-- SAMPLE TASKS AND CONTENT FOR STREAMS
-- ===================================================================

-- Sample tasks for Targi IT Kraków stream
INSERT INTO tasks (id, title, description, priority, status, "dueDate", "estimatedHours", "contextId", energy, "organizationId", "createdById", "streamId", "createdAt", "updatedAt") VALUES
('task-booth-design', 'Finalizacja projektu stoiska', 'Dokończenie projektu stoiska z uwzględnieniem feedback z zespołu marketingu', 'HIGH', 'IN_PROGRESS', '2025-02-15', 8, NULL, 'CREATIVE', 'your-org-id', 'your-user-id', 'stream-targi-it-krakow', NOW(), NOW()),
('task-demo-preparation', 'Przygotowanie demo produktu na targi', 'Opracowanie 10-minutowego demo pokazującego kluczowe funkcje AI Assistant', 'HIGH', 'NEW', '2025-03-01', 16, NULL, 'HIGH', 'your-org-id', 'your-user-id', 'stream-targi-it-krakow', NOW(), NOW()),
('task-materials-order', 'Zamówienie materiałów promocyjnych', 'Złożenie zamówienia na broszury, wizytówki i gadżety promocyjne', 'MEDIUM', 'NEW', '2025-02-20', 3, NULL, 'MEDIUM', 'your-org-id', 'your-user-id', 'stream-targi-it-krakow', NOW(), NOW());

-- Sample inbox items for processing
INSERT INTO inbox_items (id, content, note, "sourceType", source, "urgencyScore", actionable, "estimatedTime", context, "streamId", "organizationId", "capturedById", "createdAt", "updatedAt") VALUES
('inbox-booth-logistics', 'Sprawdzić wymagania logistyczne dla stoiska H12.3', 'Email od organizatora targów z wymaganiami technicznymi', 'EMAIL', 'targi-it-krakow@ice.krakow.pl', 7, true, '30 min', '@computer', 'stream-targi-it-krakow', 'your-org-id', 'your-user-id', NOW(), NOW()),
('inbox-demo-feedback', 'Zebrać feedback od zespołu sprzedaży na temat demo', 'Potrzebne uwagi przed finalizacją prezentacji', 'MEETING_NOTES', 'Spotkanie zespołu 2025-01-15', 6, true, '1 hour', '@calls', 'stream-ai-assistant', 'your-org-id', 'your-user-id', NOW(), NOW());

-- Sample messages assigned to streams
INSERT INTO messages (id, "channelId", subject, content, "fromAddress", "fromName", "toAddress", "sentAt", "streamId", "organizationId", "createdAt", "updatedAt") VALUES
('msg-booth-confirmation', 'channel-email-main', 'Potwierdzenie rezerwacji stoiska H12.3', 'Dziękujemy za rezerwację stoiska H12.3 na Targach IT Kraków 2025. W załączniku znajdą Państwo szczegółowe informacje techniczne...', 'info@ice.krakow.pl', 'ICE Kraków', 'events@company.com', '2025-01-10 09:30:00', 'stream-targi-it-krakow', 'your-org-id', NOW(), NOW()),
('msg-microsoft-quarterly', 'channel-email-main', 'Quarterly Business Review - Microsoft Partnership', 'Hi team, Time for our Q1 QBR with Microsoft. Please prepare the usage analytics and expansion opportunities presentation...', 'j.smith@microsoft.com', 'John Smith', 'account@company.com', '2025-01-12 14:15:00', 'stream-client-microsoft', 'your-org-id', NOW(), NOW());

-- ===================================================================
-- UTILITY QUERIES FOR TESTING
-- ===================================================================

-- Verify the hierarchy structure
/*
SELECT 
    p.name as parent_stream,
    c.name as child_stream,
    r."relationType",
    r.description
FROM stream_relations r
JOIN streams p ON r."parentId" = p.id  
JOIN streams c ON r."childId" = c.id
ORDER BY p.name, c.name;
*/

-- Count streams by GTD role
/*
SELECT 
    "gtdRole",
    "streamType", 
    COUNT(*) as stream_count
FROM streams 
GROUP BY "gtdRole", "streamType"
ORDER BY "gtdRole", "streamType";
*/

-- Show all streams with their configuration
/*
SELECT 
    name,
    "gtdRole",
    "streamType", 
    status,
    JSONB_PRETTY("gtdConfig") as config
FROM streams 
ORDER BY "gtdRole", name;
*/