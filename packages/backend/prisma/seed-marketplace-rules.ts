import { PrismaClient, UnifiedRuleType, UnifiedRuleStatus, UnifiedTriggerType } from '@prisma/client';

const prisma = new PrismaClient();

// Marketplace Rules Data - 50 kompletnych reguł
const marketplaceRules = [
  // ================================
  // 📧 EMAIL MANAGEMENT (8 reguł)
  // ================================
  {
    name: "VIP Email Priority",
    description: "Automatycznie identyfikuje i priorytetyzuje ważne wiadomości od osób z listy VIP lub zawierające słowo \"URGENT\" w temacie.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      senderInVIPList: true,
      subjectContains: ["URGENT", "PILNE"],
      minUrgencyScore: 80
    },
    actions: {
      categorize: "VIP",
      skipAIAnalysis: false,
      notify: {
        channels: ["email", "slack"],
        message: "VIP email received"
      },
      createTask: {
        title: "Respond to VIP email",
        priority: "HIGH",
        context: "@calls"
      }
    }
  },
  {
    name: "Smart Newsletter Management",
    description: "Automatycznie rozpoznaje i organizuje newslettery oraz mailingi informacyjne z różnych źródeł.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "EMAIL_MANAGEMENT", 
    status: UnifiedRuleStatus.ACTIVE,
    priority: 50,
    triggerType: UnifiedTriggerType.AUTOMATIC,
    triggerEvents: ["message_received"],
    conditions: {
      senderDomainIn: ["newsletter.com", "mailchimp.com", "constant-contact.com"],
      subjectContains: ["newsletter", "unsubscribe", "update"]
    },
    actions: {
      categorize: "ARCHIVE",
      autoArchive: true,
      folderName: "Learning/@reading",
      createTask: {
        title: "Review newsletters",
        context: "@reading",
        estimatedTime: 15
      }
    }
  },
  {
    name: "Email Zero Inbox",
    description: "Implementuje metodologię \"Inbox Zero\" poprzez codzienne, automatyczne organizowanie nieprzetworzonych wiadomości.",
    ruleType: UnifiedRuleType.SMART_MAILBOX,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE, 
    priority: 70,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_18:00"],
    conditions: {},
    actions: {
      organizeIntoMailbox: {
        mailboxName: "Daily_Review",
        priority: "MEDIUM"
      },
      createTask: {
        title: "Process inbox to zero",
        context: "@computer",
        dueDate: "today",
        estimatedTime: 30
      },
      generateInsights: {
        insightTypes: ["inbox_trends"],
        reportFrequency: "DAILY"
      }
    }
  },
  {
    name: "Context-Based Email Sorting",
    description: "Wykorzystuje analizę AI do automatycznego przypisywania kontekstów GTD do przychodzących wiadomości.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 60,
    triggerType: UnifiedTriggerType.EVENT_BASED, 
    triggerEvents: ["message_received"],
    conditions: {
      requiresAIAnalysis: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "suggest_gtd_context"
      },
      autoTag: {
        tagCategories: ["context"],
        maxTags: 2
      },
      categorizeAndOptimize: {
        category: "based_on_context"
      },
      createSmartFilters: {
        filterType: "CONTENT_BASED",
        autoUpdate: true
      }
    }
  },
  {
    name: "Email Batch Processing",
    description: "Organizuje przetwarzanie emaili w określonych blokach czasowych zgodnie z zasadami produktywności GTD.",
    ruleType: UnifiedRuleType.SMART_MAILBOX,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_09:00", "daily_13:00", "daily_17:00"],
    conditions: {},
    actions: {
      organizeIntoMailbox: {
        mailboxName: "Batch_{{time_slot}}",
        priority: "HIGH"
      },
      createTask: {
        title: "Email batch {{time_slot}}",
        context: "@computer",
        estimatedTime: 25
      }
    }
  },
  {
    name: "Follow-up Tracker",
    description: "Automatycznie wykrywa wiadomości wymagające późniejszego kontaktu na podstawie kluczowych fraz.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      bodyContains: ["follow up", "will get back", "let me check", "będę sprawdzał", "odezwę się"]
    },
    actions: {
      createTask: {
        title: "Follow up: {{subject}}",
        context: "@waiting",
        dueDate: "+3days"
      },
      autoTag: {
        customTags: ["follow_up_required"]
      }
    }
  },
  {
    name: "Email Template Suggestor",
    description: "Analizuje kontekst rozpoczynanej odpowiedzi i sugeruje odpowiednie szablony emaili w oparciu o AI.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 40,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["reply_started"],
    conditions: {
      userStartsComposingReply: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "suggest_reply_template"
      },
      generateSummary: {
        summaryType: "SHORT",
        language: "auto"
      }
    }
  },
  {
    name: "Attachment Organizer",
    description: "Automatycznie ekstraktuje metadane załączników i organizuje je w logicznej strukturze folderów.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "EMAIL_MANAGEMENT",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 55,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      hasAttachment: true
    },
    actions: {
      extractData: {
        dataFields: ["file_type", "file_name", "file_size"]
      },
      categorizeAndOptimize: {
        folderName: "Attachments/{{file_type}}/{{month}}"
      },
      createTask: {
        title: "Review attachment: {{file_name}}",
        context: "@computer"
      }
    }
  },

  // ================================
  // 🤖 AI AUTOMATION (7 reguł)
  // ================================
  {
    name: "SMART Goal Tracker",
    description: "Automatycznie identyfikuje i strukturalizuje cele w komunikacji, przekształcając je w zadania zgodne z metodologią SMART.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received", "task_created"],
    conditions: {
      contentMentionsMeasurableOutcomes: true,
      contentMentionsDeadlines: true
    },
    actions: {
      extractData: {
        dataFields: ["goal", "deadline", "measurable_criteria", "responsible_person"]
      },
      createTask: {
        title: "SMART Goal: {{goal}}",
        context: "@projects",
        description: "Specific: {{specific}}, Measurable: {{measurable}}, Achievable: {{achievable}}, Relevant: {{relevant}}, Time-bound: {{deadline}}"
      },
      autoTag: {
        tagCategories: ["goal_type", "priority"]
      }
    }
  },
  {
    name: "Weekly Review Automation",
    description: "Automatyzuje kluczowy element metodologii GTD - cotygodniowy przegląd wszystkich projektów i zadań.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["weekly_friday_16:00"],
    conditions: {},
    actions: {
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      runAIAnalysis: {
        promptTemplate: "weekly_review_gtd"
      },
      createTask: {
        title: "Weekly Review - GTD",
        context: "@review",
        description: "Review completed tasks, update projects, plan next week"
      },
      generateInsights: {
        insightTypes: ["productivity_patterns", "goal_progress"]
      }
    }
  },
  {
    name: "Action Item Extractor", 
    description: "Inteligentnie wyodrębnia zadania do wykonania z notatek ze spotkań, emaili i innych dokumentów komunikacyjnych.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentContainsMeetingNotes: true,
      contentContainsActionItems: true
    },
    actions: {
      extractData: {
        dataFields: ["action_items", "responsible_person", "deadline"]
      },
      createTask: {
        title: "Action: {{action_item}}",
        context: "{{suggested_context}}",
        dueDate: "{{deadline}}",
        estimatedTime: "{{estimated_time}}"
      },
      updateContact: {
        notes: "Action assigned: {{action_item}}"
      }
    }
  },
  {
    name: "Intelligent Priority Scoring",
    description: "Implementuje macierz Eisenhowera w automatyczny sposób, analizując każdą wiadomość pod kątem pilności i ważności.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "eisenhower_matrix_analysis"
      },
      autoTag: {
        tagCategories: ["urgency", "importance"],
        customTags: ["urgent_important", "urgent_not_important", "not_urgent_important", "not_urgent_not_important"]
      },
      createTaskBasedOnMatrixQuadrant: true
    }
  },
  {
    name: "Context Suggestion Engine",
    description: "Analizuje treść wiadomości i automatycznie sugeruje najbardziej odpowiedni kontekst GTD dla wynikających z niej zadań.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 60,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["task_created"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "suggest_gtd_context"
      },
      autoTag: {
        tagCategories: ["context"],
        customTags: ["@calls", "@computer", "@office", "@home", "@errands", "@online", "@waiting", "@reading"]
      }
    }
  },
  {
    name: "Energy Level Optimizer",
    description: "Monitoruje wzorce energii użytkownika i optymalizuje dobór zadań do aktualnego poziomu wydajności poznawczej.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 70,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["every_2_hours"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "energy_level_assessment"
      },
      createTaskSuggestionsBasedOnEnergy: true,
      organizeIntoMailbox: {
        mailboxName: "Energy_{{level}}_Tasks"
      }
    }
  },
  {
    name: "Next Action Generator",
    description: "Automatycznie identyfikuje i generuje następną konkretną akcję do wykonania po zakończeniu większego zadania.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "AI_AUTOMATION",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["project_updated", "task_completed"],
    conditions: {
      projectStatusUpdated: true,
      largeTaskCompleted: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "identify_next_action"
      },
      createTask: {
        title: "Next: {{next_action}}",
        context: "{{optimal_context}}"
      }
    }
  },

  // ================================
  // 🏢 BUSINESS PROCESS (12 reguł)
  // ================================
  {
    name: "SMART Project Initialization",
    description: "Automatyzuje proces inicjalizacji nowych projektów zgodnie z metodologią SMART.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 95,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      subjectContains: ["new project", "nowy projekt"],
      contentMentions: ["project kickoff", "start projektu"]
    },
    actions: {
      extractData: {
        dataFields: ["project_name", "deadline", "budget", "stakeholders"]
      },
      createTask: {
        title: "Define SMART goals for {{project_name}}",
        context: "@projects",
        description: "Specific: Define clear deliverables, Measurable: Set KPIs, Achievable: Resource check, Relevant: Business alignment, Time-bound: Set milestones"
      },
      createDeal: {
        title: "Project: {{project_name}}",
        stage: "QUALIFIED",
        value: "{{budget}}"
      }
    }
  },
  {
    name: "Invoice SMART Processing",
    description: "Inteligentnie przetwarza przychodzące faktury z automatyczną ekstrakcją danych i utworzeniem zadań SMART.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      subjectContains: ["faktura", "invoice", "FV"]
    },
    actions: {
      extractData: {
        dataFields: ["company", "amount", "date", "payment_terms"]
      },
      createTask: {
        title: "Process invoice {{invoice_number}}",
        context: "@office",
        description: "Specific: Verify details, Measurable: Amount {{amount}}, Achievable: Budget check, Relevant: Expense category, Time-bound: Pay by {{due_date}}",
        dueDate: "{{payment_due_date}}",
        estimatedTime: 15
      }
    }
  },
  {
    name: "Meeting Outcome Tracker",
    description: "Automatyzuje przetwarzanie wyników spotkań poprzez ekstrakcję podjętych decyzji, zadań do wykonania i planów kolejnych spotkań.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      subjectContains: ["meeting summary", "podsumowanie spotkania"],
      contentHasActionItems: true
    },
    actions: {
      extractData: {
        dataFields: ["decisions_made", "action_items", "next_meeting"]
      },
      createTaskForEachActionItem: true,
      updateContact: {
        notes: "Meeting outcome: {{summary}}"
      },
      createTask: {
        title: "Prepare next meeting agenda",
        context: "@computer",
        dueDate: "+{{days_to_next_meeting-2}}days"
      }
    }
  },
  {
    name: "Contract Milestone Manager",
    description: "Analizuje dokumenty kontraktowe i automatycznie tworzy harmonogram zadań SMART dla każdego kamienia milowego.",
    ruleType: UnifiedRuleType.PROCESSING, 
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      attachmentType: "pdf",
      contentContains: ["contract", "umowa"]
    },
    actions: {
      extractData: {
        dataFields: ["milestones", "payment_schedule", "deliverables"]
      },
      createTaskPerMilestone: true,
      createDeal: {
        stage: "NEGOTIATION",
        value: "{{contract_value}}"
      },
      notify: {
        users: ["legal_team", "project_manager"]
      }
    }
  },
  {
    name: "Goal Progress Monitor",
    description: "Cotygodniowo analizuje postępy w realizacji wszystkich celów SMART w organizacji.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["weekly_monday_09:00"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "goal_progress_analysis"
      },
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      createTask: {
        title: "Review goal progress",
        context: "@review",
        description: "Analyze SMART goals progress, adjust timelines if needed"
      },
      generateInsights: {
        insightTypes: ["goal_completion_rate", "timeline_accuracy"]
      }
    }
  },
  {
    name: "Expense Budget Tracker",
    description: "Automatycznie śledzi i kategoryzuje wydatki firmowe zgodnie z SMART budgeting principles.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 70,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      subjectContains: ["expense", "receipt", "cost", "wydatek", "rachunek"]
    },
    actions: {
      extractData: {
        dataFields: ["amount", "category", "budget_line"]
      },
      createTask: {
        title: "Log expense: {{amount}}zł",
        context: "@computer",
        description: "Specific: {{expense_description}}, Measurable: {{amount}}, Achievable: Budget check, Relevant: {{category}}, Time-bound: Report by month-end"
      },
      conditionalEscalation: {
        condition: "monthly_budget_exceeded",
        assignTo: "manager"
      }
    }
  },
  {
    name: "Client Onboarding SMART Flow",
    description: "Inicjuje kompleksowy proces onboardingu nowych klientów z zastosowaniem metodologii SMART.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["contact_created", "deal_closed_won"],
    conditions: {
      newContactCreated: true,
      dealStage: "CLOSED_WON"
    },
    actions: {
      createTask: {
        title: "Client onboarding: {{client_name}}",
        context: "@projects",
        description: "Specific: Complete setup, Measurable: All checkpoints, Achievable: 30 days, Relevant: Client success, Time-bound: {{start_date + 30days}}"
      },
      createDeal: {
        title: "Onboarding: {{client_name}}",
        stage: "QUALIFIED"
      }
    }
  },
  {
    name: "Performance Review Scheduler",
    description: "Automatyzuje proces kwartalnych przeglądów wydajności zespołu z zastosowaniem mierzalnych wskaźników KPI.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 60,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["quarterly"],
    conditions: {},
    actions: {
      createTask: {
        title: "Quarterly performance review",
        context: "@review",
        description: "Specific: Team performance, Measurable: KPI analysis, Achievable: Data available, Relevant: Growth planning, Time-bound: 2 weeks"
      },
      notify: {
        users: ["hr_team", "managers"]
      }
    }
  },
  {
    name: "Risk Management Monitor",
    description: "Proaktywnie identyfikuje i zarządza ryzykami projektowymi poprzez automatyczną analizę komunikacji.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 95,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentMentions: ["risks", "delays", "issues", "ryzyko", "opóźnienie", "problemy"]
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "risk_assessment"
      },
      extractData: {
        dataFields: ["risk_type", "impact_level", "mitigation_steps"]
      },
      createTask: {
        title: "Address risk: {{risk_description}}",
        context: "@calls",
        description: "Specific: {{risk_details}}, Measurable: {{impact_metrics}}, Achievable: {{mitigation_plan}}, Relevant: {{business_impact}}, Time-bound: {{resolution_deadline}}"
      }
    }
  },
  {
    name: "Vendor Management",
    description: "Systematyzuje zarządzanie relacjami z dostawcami poprzez automatyczne śledzenie jakości usług.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 55,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      senderInVendorList: true,
      contentMentions: ["supplier", "dostawca"]
    },
    actions: {
      extractData: {
        dataFields: ["vendor_name", "service_type", "contract_renewal"]
      },
      updateContact: {
        status: "active",
        tags: ["vendor", "{{service_type}}"]
      },
      createTask: {
        title: "Vendor review: {{vendor_name}}",
        context: "@calls",
        description: "Specific: Service quality, Measurable: SLA compliance, Achievable: Improvement plan, Relevant: Cost efficiency, Time-bound: {{review_date}}"
      }
    }
  },
  {
    name: "Budget Planning Assistant",
    description: "Automatyzuje miesięczny proces analizy budżetowej z wykorzystaniem AI do identyfikacji trendów.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 70,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["monthly_last_friday"],
    conditions: {},
    actions: {
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      runAIAnalysis: {
        promptTemplate: "budget_variance_analysis"
      },
      createTask: {
        title: "Monthly budget review",
        context: "@computer",
        description: "Specific: All departments, Measurable: Variance %, Achievable: Corrective actions, Relevant: Financial goals, Time-bound: Next week"
      }
    }
  },
  {
    name: "Sales Pipeline Optimizer",
    description: "Codziennie analizuje kondycję pipeline'u sprzedażowego i optymalizuje działania dla maksymalizacji konwersji.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "BUSINESS_PROCESS",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_17:00"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "pipeline_health_check"
      },
      generateInsights: {
        insightTypes: ["conversion_rates", "deal_velocity"]
      },
      createTask: {
        title: "Pipeline review",
        context: "@calls",
        description: "Specific: Stalled deals, Measurable: Conversion rates, Achievable: Action plans, Relevant: Revenue targets, Time-bound: Tomorrow"
      }
    }
  },

  // ================================
  // 🔒 SECURITY & COMPLIANCE (6 reguł)
  // ================================
  {
    name: "Advanced Phishing Detection",
    description: "Wykorzystuje zaawansowane algorytmy AI do wykrywania sofistykowanych ataków phishingowych.",
    ruleType: UnifiedRuleType.EMAIL_FILTER,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 100,
    triggerType: UnifiedTriggerType.AUTOMATIC,
    triggerEvents: ["message_received"],
    conditions: {
      aiConfidencePhishing: 0.7,
      suspiciousLinksDetected: true
    },
    actions: {
      quarantine: {
        quarantineReason: "SUSPICIOUS",
        reviewTime: "24h"
      },
      runAIAnalysis: {
        promptTemplate: "threat_assessment"
      },
      createTask: {
        title: "Security incident review",
        context: "@computer",
        priority: "HIGH"
      },
      notify: {
        users: ["security_team"],
        channels: ["email", "slack"]
      }
    }
  },
  {
    name: "GDPR Data Processing Monitor",
    description: "Automatycznie monitoruje przetwarzanie danych osobowych w komunikacji i zapewnia zgodność z GDPR/RODO.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 95,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentContainsPersonalData: true,
      gdprKeywordsDetected: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "gdpr_compliance_check"
      },
      autoTag: {
        tagCategories: ["privacy", "compliance"]
      },
      createTask: {
        title: "GDPR compliance review",
        context: "@office",
        description: "Specific: Data processing, Measurable: Compliance score, Achievable: 72h review, Relevant: Legal requirement, Time-bound: {{deadline}}"
      }
    }
  },
  {
    name: "Access Control Monitor",
    description: "Śledzi i zarządza wszystkimi żądaniami dostępu do systemów firmowych.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentMentions: ["access requests", "permission changes", "dostęp", "uprawnienia"]
    },
    actions: {
      extractData: {
        dataFields: ["user_name", "access_level", "justification"]
      },
      createTask: {
        title: "Access review: {{user_name}}",
        context: "@office",
        priority: "HIGH"
      },
      escalateToHuman: {
        assignTo: "security_team",
        priority: "MEDIUM"
      }
    }
  },
  {
    name: "Incident Response Automation",
    description: "Aktywuje natychmiastowy protokół reagowania na incydenty bezpieczeństwa przy wykryciu sygnałów kryzysowych.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 100,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      subjectContains: ["INCIDENT", "BREACH", "SECURITY", "INCYDENT", "NARUSZENIE"]
    },
    actions: {
      createTask: {
        title: "Security incident response",
        context: "@calls",
        priority: "HIGH",
        description: "Specific: Contain threat, Measurable: Impact assessment, Achievable: Response team, Relevant: Business continuity, Time-bound: 1 hour"
      },
      notify: {
        users: ["crisis_team"],
        channels: ["email", "slack", "sms"]
      },
      escalateToHuman: {
        assignTo: "security_manager",
        priority: "URGENT"
      }
    }
  },
  {
    name: "Compliance Audit Trail",
    description: "Miesięcznie generuje kompleksowe audyty compliance dla wszystkich systemów organizacji.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["monthly"],
    conditions: {},
    actions: {
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      runAIAnalysis: {
        promptTemplate: "compliance_audit"
      },
      createTask: {
        title: "Monthly compliance audit",
        context: "@review",
        description: "Specific: All systems, Measurable: Compliance %, Achievable: Remediation plan, Relevant: Regulatory, Time-bound: 2 weeks"
      }
    }
  },
  {
    name: "Vendor Security Assessment",
    description: "Automatyzuje proces oceny bezpieczeństwa nowych dostawców i partnerów biznesowych.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "SECURITY_COMPLIANCE",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["vendor_onboarding", "security_questionnaire"],
    conditions: {
      newVendorOnboarding: true,
      securityQuestionnaireReceived: true
    },
    actions: {
      extractData: {
        dataFields: ["security_certifications", "data_handling", "compliance_status"]
      },
      createTask: {
        title: "Vendor security review: {{vendor_name}}",
        context: "@computer",
        description: "Specific: Security posture, Measurable: Risk score, Achievable: Assessment complete, Relevant: Supply chain, Time-bound: 5 days"
      }
    }
  },

  // ================================
  // 📱 PERSONAL PRODUCTIVITY (8 reguł)
  // ================================
  {
    name: "Daily GTD Planner",
    description: "Rozpoczyna każdy dzień pracy od automatycznego planowania zgodnego z metodologią GTD.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_07:00"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "daily_planning_gtd"
      },
      createTask: {
        title: "Daily planning",
        context: "@review",
        estimatedTime: 15,
        description: "Review inbox, update contexts, plan day by energy levels"
      },
      organizeIntoMailbox: {
        mailboxName: "Today_Focus"
      }
    }
  },
  {
    name: "Energy-Context Matcher",
    description: "Optymalizuje produktywność poprzez inteligentne dopasowywanie zadań do aktualnego poziomu energii użytkownika.",
    ruleType: UnifiedRuleType.SMART_MAILBOX,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 70,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["every_3_hours"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "current_energy_assessment"
      },
      organizeIntoMailbox: {
        mailboxName: "Energy_{{level}}_Tasks"
      },
      createSmartFilters: {
        filterType: "TIME_BASED",
        autoUpdate: true
      }
    }
  },
  {
    name: "Weekly Review Automation",
    description: "Automatyzuje cotygodniowy przegląd wszystkich projektów, zadań i celów zgodnie z GTD.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["weekly_friday_17:00"],
    conditions: {},
    actions: {
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      createTask: {
        title: "Weekly Review - GTD",
        context: "@review",
        estimatedTime: 60,
        description: "Specific: Review all projects, Measurable: Completion rates, Achievable: Update next actions, Relevant: Goal alignment, Time-bound: 1 hour"
      },
      generateInsights: {
        insightTypes: ["productivity_patterns", "context_efficiency"]
      }
    }
  },
  {
    name: "Someday/Maybe Reminder",
    description: "Implementuje systematyczny przegląd listy \"Someday/Maybe\" zgodnie z best practices GTD.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 60,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["monthly_first_monday"],
    conditions: {},
    actions: {
      organizeIntoMailbox: {
        mailboxName: "Someday_Maybe_Review"
      },
      createTask: {
        title: "Review Someday/Maybe list",
        context: "@review",
        estimatedTime: 30,
        description: "Review deferred items, promote relevant ones to active projects"
      }
    }
  },
  {
    name: "Travel Planning Assistant",
    description: "Automatyzuje kompletny proces przygotowania do podróży służbowych poprzez inteligentną analizę potwierdzeń rezerwacji.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentMentions: ["travel", "booking confirmations", "podróż", "rezerwacja"]
    },
    actions: {
      extractData: {
        dataFields: ["destination", "dates", "confirmation_number", "flight_details"]
      },
      createTask: {
        title: "Travel prep: {{destination}}",
        context: "@errands",
        description: "Specific: Travel checklist, Measurable: All items complete, Achievable: 3 days prep, Relevant: Trip success, Time-bound: {{departure_date-3days}}",
        estimatedTime: 45
      }
    }
  },
  {
    name: "Habit Tracker Integration",
    description: "Wspiera budowanie pozytywnych nawyków poprzez codzienne wieczorne podsumowanie.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 50,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_21:00"],
    conditions: {},
    actions: {
      createTask: {
        title: "Daily habit review",
        context: "@review",
        estimatedTime: 5,
        description: "Check off completed habits, plan tomorrow's focus"
      },
      generateInsights: {
        insightTypes: ["habit_completion_rate"]
      }
    }
  },
  {
    name: "Learning Goal Manager",
    description: "Strukturalizuje proces uczenia się i rozwoju zawodowego poprzez automatyczne tworzenie planów SMART.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 65,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["message_received"],
    conditions: {
      contentMentions: ["courses", "learning", "skill development", "kursy", "nauka", "rozwój"]
    },
    actions: {
      extractData: {
        dataFields: ["skill", "learning_method", "timeline", "resources"]
      },
      createTask: {
        title: "Learning plan: {{skill}}",
        context: "@reading",
        description: "Specific: {{skill}} mastery, Measurable: {{progress_metrics}}, Achievable: {{time_budget}}, Relevant: {{career_goals}}, Time-bound: {{completion_date}}",
        estimatedTime: "{{estimated_study_time}}"
      }
    }
  },
  {
    name: "Health & Wellness Tracker",
    description: "Integruje monitoring dobrostanu z systemem produktywności.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "PERSONAL_PRODUCTIVITY",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 55,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["daily_12:00"],
    conditions: {},
    actions: {
      createTask: {
        title: "Wellness check-in",
        context: "@personal",
        estimatedTime: 5,
        description: "Rate energy, stress, motivation levels for optimal task planning"
      },
      runAIAnalysis: {
        promptTemplate: "wellness_productivity_correlation"
      }
    }
  },

  // ================================
  // 🎯 SALES & CRM (9 reguł)
  // ================================
  {
    name: "Lead Qualification SMART",
    description: "Automatyzuje proces kwalifikacji leadów z wykorzystaniem metodologii SMART i kryteriów BANT.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 95,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["contact_created", "demo_request"],
    conditions: {
      newContact: true,
      demoRequest: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "lead_qualification_smart"
      },
      extractData: {
        dataFields: ["company_size", "budget", "timeline", "decision_maker"]
      },
      createDeal: {
        title: "SMART Lead: {{company}}",
        stage: "LEAD",
        value: "{{estimated_value}}"
      },
      createTask: {
        title: "Qualify lead: {{company}}",
        context: "@calls",
        description: "Specific: Qualification call, Measurable: BANT criteria, Achievable: 30min call, Relevant: Pipeline growth, Time-bound: 24 hours"
      }
    }
  },
  {
    name: "Follow-up Sequence Manager",
    description: "Zarządza systematycznymi sekwencjami follow-up dla prospektów, którzy nie odpowiadają na pierwsze kontakty.",
    ruleType: UnifiedRuleType.AUTO_REPLY,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["no_response_3_days"],
    conditions: {
      noResponseToSalesEmail: "3_days"
    },
    actions: {
      createTask: {
        title: "Follow up: {{prospect_name}}",
        context: "@calls",
        description: "Specific: Value proposition, Measurable: Response rate, Achievable: Personal touch, Relevant: Deal progression, Time-bound: Today"
      },
      sendAutoReply: {
        template: "follow_up_sequence_{{step}}",
        delay: "24h"
      }
    }
  },
  {
    name: "Deal Stage Progression",
    description: "Analizuje postępy w poszczególnych transakcjach i automatycznie sugeruje następne kroki.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 85,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["deal_updated", "proposal_sent"],
    conditions: {
      dealUpdated: true,
      proposalSent: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "deal_progression_analysis"
      },
      createTask: {
        title: "Advance deal: {{deal_name}}",
        context: "@calls",
        description: "Specific: Next milestone, Measurable: Success criteria, Achievable: Resource allocation, Relevant: Revenue target, Time-bound: {{next_milestone_date}}"
      },
      updateContact: {
        notes: "Deal stage: {{new_stage}}, Next action: {{next_action}}"
      }
    }
  },
  {
    name: "Proposal Success Tracker",
    description: "Systematycznie śledzi wszystkie wysłane propozycje i RFP responses.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["proposal_sent", "rfp_response"],
    conditions: {
      proposalSent: true,
      rfpResponse: true
    },
    actions: {
      extractData: {
        dataFields: ["proposal_value", "decision_timeline", "key_stakeholders"]
      },
      createTask: {
        title: "Proposal follow-up: {{client_name}}",
        context: "@calls",
        description: "Specific: Decision process, Measurable: Win probability, Achievable: Stakeholder engagement, Relevant: Q{{quarter}} targets, Time-bound: {{decision_date}}"
      }
    }
  },
  {
    name: "Customer Success Monitor",
    description: "Miesięcznie analizuje health score wszystkich aktywnych klientów.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 80,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["monthly"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "customer_health_score"
      },
      generateInsights: {
        insightTypes: ["satisfaction_trends", "usage_patterns"]
      },
      createTask: {
        title: "Customer success review",
        context: "@calls",
        description: "Specific: Health scores, Measurable: NPS improvement, Achievable: Action plans, Relevant: Retention, Time-bound: This week"
      }
    }
  },
  {
    name: "Upsell Opportunity Detector",
    description: "Inteligentnie identyfikuje możliwości upsell i cross-sell na podstawie customer usage patterns.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 70,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["usage_pattern_change", "contract_renewal_approaching"],
    conditions: {
      customerUsagePatterns: true,
      contractRenewalApproaching: true
    },
    actions: {
      runAIAnalysis: {
        promptTemplate: "upsell_opportunity_analysis"
      },
      createTask: {
        title: "Upsell opportunity: {{customer_name}}",
        context: "@calls",
        description: "Specific: Additional services, Measurable: Revenue increase, Achievable: Customer need, Relevant: Account growth, Time-bound: {{renewal_date-30days}}"
      }
    }
  },
  {
    name: "Competitor Intelligence",
    description: "Automatycznie zbiera i analizuje competitive intelligence z lost deals, customer feedback i market mentions.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 65,
    triggerType: UnifiedTriggerType.EVENT_BASED,
    triggerEvents: ["deal_lost", "competitor_mention"],
    conditions: {
      mentionOfCompetitors: true,
      lostDeal: true
    },
    actions: {
      extractData: {
        dataFields: ["competitor_name", "winning_factors", "lost_reasons"]
      },
      createTask: {
        title: "Competitive analysis: {{competitor}}",
        context: "@computer",
        description: "Specific: Feature comparison, Measurable: Win/loss ratio, Achievable: Strategy update, Relevant: Market position, Time-bound: 1 week"
      }
    }
  },
  {
    name: "Sales Activity Optimizer",
    description: "Cotygodniowo optymalizuje aktivities sales team poprzez analizę performance metrics.",
    ruleType: UnifiedRuleType.AI_RULE,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 75,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["weekly_monday_08:00"],
    conditions: {},
    actions: {
      generateSummary: {
        summaryType: "DETAILED",
        language: "pl"
      },
      runAIAnalysis: {
        promptTemplate: "sales_activity_optimization"
      },
      createTask: {
        title: "Sales activity planning",
        context: "@review",
        description: "Specific: Activity goals, Measurable: Call/email targets, Achievable: Time blocking, Relevant: Pipeline growth, Time-bound: This week"
      }
    }
  },
  {
    name: "Contract Renewal Tracker",
    description: "Miesięcznie analizuje zbliżające się contract renewals i automatycznie ocenia renewal risk.",
    ruleType: UnifiedRuleType.PROCESSING,
    category: "SALES_CRM",
    status: UnifiedRuleStatus.ACTIVE,
    priority: 90,
    triggerType: UnifiedTriggerType.SCHEDULED,
    triggerEvents: ["monthly"],
    conditions: {},
    actions: {
      runAIAnalysis: {
        promptTemplate: "renewal_risk_assessment"
      },
      createTaskForEachUpcomingRenewal: true,
      notify: {
        users: ["account_managers"],
        message: "Contract renewals approaching"
      }
    }
  }
];

async function seedMarketplaceRules() {
  console.log('🚀 Starting marketplace rules seeding...');
  
  try {
    // Check if we have any organization to assign rules to
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ No organization found! Please create an organization first.');
      return;
    }

    console.log(`📋 Found organization: ${org.name} (${org.id})`);
    
    // Check existing rules
    const existingRulesCount = await prisma.unifiedRule.count({
      where: { organizationId: org.id }
    });
    
    console.log(`📊 Existing rules in database: ${existingRulesCount}`);
    
    // Create all marketplace rules
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const ruleData of marketplaceRules) {
      try {
        // Check if rule with this name already exists
        const existingRule = await prisma.unifiedRule.findFirst({
          where: {
            organizationId: org.id,
            name: ruleData.name
          }
        });
        
        if (existingRule) {
          console.log(`⏭️  Skipping existing rule: ${ruleData.name}`);
          skippedCount++;
          continue;
        }
        
        // Create the rule
        const rule = await prisma.unifiedRule.create({
          data: {
            ...ruleData,
            organizationId: org.id,
            createdBy: 'marketplace-seed'
          }
        });
        
        console.log(`✅ Created rule: ${rule.name} (${rule.ruleType})`);
        createdCount++;
        
      } catch (error: any) {
        console.error(`❌ Error creating rule "${ruleData.name}":`, error.message);
      }
    }
    
    console.log('\n🎉 Marketplace rules seeding completed!');
    console.log(`📈 Statistics:`);
    console.log(`   • Total rules in marketplace: ${marketplaceRules.length}`);
    console.log(`   • Rules created: ${createdCount}`);
    console.log(`   • Rules skipped (existing): ${skippedCount}`);
    
    // Show breakdown by category
    const categories: { [key: string]: number } = {};
    const ruleTypes: { [key: string]: number } = {};
    
    marketplaceRules.forEach(rule => {
      categories[rule.category] = (categories[rule.category] || 0) + 1;
      ruleTypes[rule.ruleType.toString()] = (ruleTypes[rule.ruleType.toString()] || 0) + 1;
    });
    
    console.log('\n📊 Breakdown by category:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} rules`);
    });
    
    console.log('\n⚙️  Breakdown by rule type:');
    Object.entries(ruleTypes).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} rules`);
    });
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMarketplaceRules()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedMarketplaceRules;