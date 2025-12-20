/**
 * Rule Type Configurations - Dynamic Form Definitions
 * Definicje typów reguł i ich konfiguracje formularzy
 */

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean';
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
}

export interface ActionConfig {
  name: string;
  label: string;
  description: string;
  fields: FieldConfig[];
}

export interface RuleTypeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  conditionFields: FieldConfig[];
  actions: ActionConfig[];
  advancedSettings: FieldConfig[];
}

// Wspólne opcje priorytetów
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niski' },
  { value: 'MEDIUM', label: 'Średni' },
  { value: 'HIGH', label: 'Wysoki' },
  { value: 'URGENT', label: 'Pilny' }
];

// Wspólne opcje statusów
const STATUS_OPTIONS = [
  { value: 'TODO', label: 'Do zrobienia' },
  { value: 'IN_PROGRESS', label: 'W trakcie' },
  { value: 'COMPLETED', label: 'Ukończone' },
  { value: 'CANCELLED', label: 'Anulowane' }
];

// Wspólne opcje kontekstów
const CONTEXT_OPTIONS = [
  { value: '@computer', label: 'Komputer' },
  { value: '@calls', label: 'Rozmowy telefoniczne' },
  { value: '@office', label: 'Biuro' },
  { value: '@home', label: 'Praca zdalna' },
  { value: '@errands', label: 'Sprawy zewnętrzne' },
  { value: '@online', label: 'Online' },
  { value: '@waiting', label: 'Oczekiwanie' },
  { value: '@reading', label: 'Do przeczytania' }
];

// ================================
// 1. PROCESSING RULES
// ================================
const PROCESSING_CONFIG: RuleTypeConfig = {
  name: 'PROCESSING',
  description: 'Reguły przetwarzania wiadomości i zadań',
  icon: 'cog',
  color: 'blue',
  conditionFields: [
    {
      name: 'senderContains',
      label: 'Nadawca zawiera',
      type: 'text',
      placeholder: 'np. support@, admin@',
      description: 'Filtruj po nadawcy wiadomości'
    },
    {
      name: 'subjectContains',
      label: 'Temat zawiera',
      type: 'text',
      placeholder: 'np. PILNE, TODO, PROJEKT',
      description: 'Słowa kluczowe w temacie'
    },
    {
      name: 'bodyContains',
      label: 'Treść zawiera',
      type: 'text',
      placeholder: 'np. deadline, urgent, asap',
      description: 'Słowa kluczowe w treści wiadomości'
    },
    {
      name: 'urgencyScore',
      label: 'Wskaźnik pilności (min)',
      type: 'number',
      placeholder: '0-100',
      description: 'Minimalny wskaźnik pilności AI',
      validation: { min: 0, max: 100 }
    }
  ],
  actions: [
    {
      name: 'createTask',
      label: 'Utwórz zadanie',
      description: 'Automatyczne tworzenie zadania z wiadomości',
      fields: [
        {
          name: 'taskPriority',
          label: 'Priorytet zadania',
          type: 'select',
          required: true,
          options: PRIORITY_OPTIONS,
          defaultValue: 'MEDIUM'
        },
        {
          name: 'taskContext',
          label: 'Kontekst GTD',
          type: 'select',
          options: CONTEXT_OPTIONS,
          defaultValue: '@computer'
        },
        {
          name: 'estimatedTime',
          label: 'Szacowany czas (min)',
          type: 'number',
          placeholder: '15, 30, 60, 120',
          validation: { min: 5, max: 480 }
        },
        {
          name: 'autoAssign',
          label: 'Automatyczne przypisanie',
          type: 'boolean',
          description: 'Przypisz zadanie do nadawcy wiadomości'
        }
      ]
    },
    {
      name: 'createProject',
      label: 'Utwórz projekt',
      description: 'Tworzenie projektu z wiadomości',
      fields: [
        {
          name: 'projectType',
          label: 'Typ projektu',
          type: 'select',
          required: true,
          options: [
            { value: 'DEVELOPMENT', label: 'Rozwój oprogramowania' },
            { value: 'MARKETING', label: 'Marketing' },
            { value: 'SALES', label: 'Sprzedaż' },
            { value: 'SUPPORT', label: 'Wsparcie klienta' },
            { value: 'RESEARCH', label: 'Badania' },
            { value: 'OTHER', label: 'Inne' }
          ]
        },
        {
          name: 'projectPriority',
          label: 'Priorytet projektu',
          type: 'select',
          required: true,
          options: PRIORITY_OPTIONS
        }
      ]
    },
    {
      name: 'addToInbox',
      label: 'Dodaj do Źródła',
      description: 'Dodanie do skrzynki do późniejszego przetworzenia',
      fields: [
        {
          name: 'inboxType',
          label: 'Typ źródła',
          type: 'select',
          required: true,
          options: [
            { value: 'EMAIL', label: 'Email' },
            { value: 'IDEA', label: 'Pomysł' },
            { value: 'MEETING_NOTES', label: 'Notatki ze spotkania' },
            { value: 'DOCUMENT', label: 'Dokument' },
            { value: 'OTHER', label: 'Inne' }
          ]
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'maxExecutionsPerHour',
      label: 'Max wykonań na godzinę',
      type: 'number',
      defaultValue: 10,
      validation: { min: 1, max: 100 }
    },
    {
      name: 'cooldownPeriod',
      label: 'Okres wyciszenia (sekundy)',
      type: 'number',
      defaultValue: 60,
      validation: { min: 0, max: 3600 }
    }
  ]
};

// ================================
// 2. EMAIL_FILTER RULES
// ================================
const EMAIL_FILTER_CONFIG: RuleTypeConfig = {
  name: 'EMAIL_FILTER',
  description: 'Filtry emaili i kategoryzacja',
  icon: 'mail',
  color: 'blue',
  conditionFields: [
    {
      name: 'fromEmail',
      label: 'Adres nadawcy',
      type: 'text',
      placeholder: 'np. admin@firma.pl',
      description: 'Dokładny adres email nadawcy'
    },
    {
      name: 'fromDomain',
      label: 'Domena nadawcy',
      type: 'text',
      placeholder: 'np. firma.pl, support.com',
      description: 'Domena nadawcy (bez @)'
    },
    {
      name: 'hasAttachments',
      label: 'Ma załączniki',
      type: 'boolean',
      description: 'Filtruj emaile z załącznikami'
    },
    {
      name: 'attachmentTypes',
      label: 'Typy załączników',
      type: 'multiselect',
      placeholder: 'pdf, doc, xls, zip',
      description: 'Rozszerzenia plików (oddziel przecinkami)'
    }
  ],
  actions: [
    {
      name: 'moveToFolder',
      label: 'Przenieś do folderu',
      description: 'Automatyczne przeniesienie do odpowiedniego folderu',
      fields: [
        {
          name: 'targetFolder',
          label: 'Folder docelowy',
          type: 'select',
          required: true,
          options: [
            { value: 'INBOX', label: 'Skrzynka odbiorcza' },
            { value: 'IMPORTANT', label: 'Ważne' },
            { value: 'NEWSLETTERS', label: 'Newslettery' },
            { value: 'NOTIFICATIONS', label: 'Powiadomienia' },
            { value: 'ARCHIVE', label: 'Archiwum' },
            { value: 'SPAM', label: 'Spam' }
          ]
        }
      ]
    },
    {
      name: 'setLabel',
      label: 'Ustaw etykietę',
      description: 'Dodanie etykiety do wiadomości',
      fields: [
        {
          name: 'labelName',
          label: 'Nazwa etykiety',
          type: 'text',
          required: true,
          placeholder: 'np. Klient VIP, Newsletter, Support'
        },
        {
          name: 'labelColor',
          label: 'Kolor etykiety',
          type: 'select',
          options: [
            { value: 'red', label: 'Czerwony' },
            { value: 'orange', label: 'Pomarańczowy' },
            { value: 'yellow', label: 'Żółty' },
            { value: 'green', label: 'Zielony' },
            { value: 'blue', label: 'Niebieski' },
            { value: 'purple', label: 'Fioletowy' }
          ]
        }
      ]
    },
    {
      name: 'markAsRead',
      label: 'Oznacz jako przeczytane',
      description: 'Automatyczne oznaczenie jako przeczytane',
      fields: []
    }
  ],
  advancedSettings: [
    {
      name: 'applyToExisting',
      label: 'Zastosuj do istniejących',
      type: 'boolean',
      description: 'Zastosuj regułę do istniejących wiadomości'
    }
  ]
};

// ================================
// 3. AUTO_REPLY RULES
// ================================
const AUTO_REPLY_CONFIG: RuleTypeConfig = {
  name: 'AUTO_REPLY',
  description: 'Automatyczne odpowiedzi',
  icon: 'reply',
  color: 'blue',
  conditionFields: [
    {
      name: 'businessHours',
      label: 'Tylko poza godzinami pracy',
      type: 'boolean',
      description: 'Wysyłaj tylko poza godzinami 9-17'
    },
    {
      name: 'firstTimeCustomer',
      label: 'Nowy klient',
      type: 'boolean',
      description: 'Tylko dla nowych klientów'
    },
    {
      name: 'subjectKeywords',
      label: 'Słowa kluczowe w temacie',
      type: 'multiselect',
      placeholder: 'help, support, question, info',
      description: 'Słowa wyzwalające auto-odpowiedź'
    }
  ],
  actions: [
    {
      name: 'sendReply',
      label: 'Wyślij odpowiedź',
      description: 'Automatyczna odpowiedź z szablonem',
      fields: [
        {
          name: 'replyTemplate',
          label: 'Szablon odpowiedzi',
          type: 'textarea',
          required: true,
          placeholder: 'Dzięki za wiadomość. Odpowiemy w ciągu 24h...',
          description: 'Treść automatycznej odpowiedzi'
        },
        {
          name: 'replySubject',
          label: 'Temat odpowiedzi',
          type: 'text',
          placeholder: 'Re: [ORIGINAL_SUBJECT] - Potwierdzenie otrzymania',
          description: 'Użyj [ORIGINAL_SUBJECT] dla oryginalnego tematu'
        },
        {
          name: 'includeOriginal',
          label: 'Dołącz oryginalną wiadomość',
          type: 'boolean',
          description: 'Załącz oryginalną wiadomość do odpowiedzi'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'maxRepliesPerDay',
      label: 'Max odpowiedzi dziennie',
      type: 'number',
      defaultValue: 50,
      validation: { min: 1, max: 200 }
    },
    {
      name: 'delayMinutes',
      label: 'Opóźnienie (minuty)',
      type: 'number',
      defaultValue: 5,
      validation: { min: 0, max: 60 }
    }
  ]
};

// ================================
// 4. AI_RULE RULES
// ================================
const AI_RULE_CONFIG: RuleTypeConfig = {
  name: 'AI_RULE',
  description: 'Reguły z analizą AI',
  icon: 'brain',
  color: 'blue',
  conditionFields: [
    {
      name: 'aiAnalysisRequired',
      label: 'Wymagana analiza AI',
      type: 'boolean',
      description: 'Zawsze uruchamiaj analizę AI'
    },
    {
      name: 'sentimentThreshold',
      label: 'Próg sentymentu',
      type: 'select',
      options: [
        { value: 'POSITIVE', label: 'Pozytywny' },
        { value: 'NEUTRAL', label: 'Neutralny' },
        { value: 'NEGATIVE', label: 'Negatywny' }
      ],
      description: 'Minimalny poziom sentymentu'
    },
    {
      name: 'languageDetection',
      label: 'Wykrywanie języka',
      type: 'multiselect',
      placeholder: 'pl, en, de, fr',
      description: 'Obsługiwane języki (kody ISO)'
    }
  ],
  actions: [
    {
      name: 'runAIAnalysis',
      label: 'Uruchom analizę AI',
      description: 'Analiza treści przez sztuczną inteligencję',
      fields: [
        {
          name: 'aiProviderId',
          label: 'Provider AI',
          type: 'select',
          required: true,
          options: [], // Dynamicznie ładowane z API
          description: 'Wybierz dostawcę AI (OpenAI, Anthropic, etc.)'
        },
        {
          name: 'aiModelId',
          label: 'Model AI',
          type: 'select',
          required: true,
          options: [], // Dynamicznie ładowane na podstawie wybranego providera
          description: 'Wybierz konkretny model (gpt-4, gpt-3.5-turbo, claude-3, etc.)'
        },
        {
          name: 'analysisType',
          label: 'Typ analizy',
          type: 'select',
          required: true,
          options: [
            { value: 'SENTIMENT', label: 'Analiza sentymentu' },
            { value: 'CATEGORIZATION', label: 'Kategoryzacja' },
            { value: 'SUMMARY', label: 'Streszczenie' },
            { value: 'URGENCY', label: 'Ocena pilności' },
            { value: 'INTENT', label: 'Rozpoznanie intencji' },
            { value: 'EXTRACTION', label: 'Ekstrakcja danych' },
            { value: 'CUSTOM', label: 'Niestandardowa' }
          ]
        },
        {
          name: 'customPrompt',
          label: 'Niestandardowy prompt',
          type: 'textarea',
          placeholder: 'Przeanalizuj tę wiadomość pod kątem...',
          description: 'Tylko dla typu CUSTOM'
        }
      ]
    },
    {
      name: 'generateResponse',
      label: 'Wygeneruj odpowiedź AI',
      description: 'Automatyczne generowanie odpowiedzi',
      fields: [
        {
          name: 'aiProviderId',
          label: 'Provider AI',
          type: 'select',
          required: true,
          options: [], // Dynamicznie ładowane z API
          description: 'Wybierz dostawcę AI'
        },
        {
          name: 'aiModelId',
          label: 'Model AI',
          type: 'select',
          required: true,
          options: [], // Dynamicznie ładowane
          description: 'Model do generowania odpowiedzi'
        },
        {
          name: 'responseStyle',
          label: 'Styl odpowiedzi',
          type: 'select',
          options: [
            { value: 'FORMAL', label: 'Formalny' },
            { value: 'FRIENDLY', label: 'Przyjazny' },
            { value: 'PROFESSIONAL', label: 'Profesjonalny' },
            { value: 'CASUAL', label: 'Swobodny' }
          ]
        },
        {
          name: 'requireApproval',
          label: 'Wymagaj zatwierdzenia',
          type: 'boolean',
          description: 'Odpowiedź wymaga ręcznego zatwierdzenia'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'temperature',
      label: 'Temperatura',
      type: 'number',
      defaultValue: 0.7,
      description: 'Kreatywność modelu (0.0 = deterministyczny, 1.0 = kreatywny)',
      validation: { min: 0, max: 2 }
    },
    {
      name: 'maxTokens',
      label: 'Max tokenów',
      type: 'number',
      defaultValue: 1000,
      description: 'Maksymalna długość odpowiedzi',
      validation: { min: 100, max: 8000 }
    },
    {
      name: 'confidenceThreshold',
      label: 'Próg pewności AI (%)',
      type: 'number',
      defaultValue: 80,
      validation: { min: 50, max: 100 }
    },
    {
      name: 'fallbackProviderId',
      label: 'Provider zapasowy',
      type: 'select',
      options: [], // Dynamicznie ładowane
      description: 'Provider używany w przypadku błędu głównego'
    },
    {
      name: 'fallbackModelId',
      label: 'Model zapasowy',
      type: 'select',
      options: [], // Dynamicznie ładowane
      description: 'Model używany w przypadku błędu głównego'
    },
    {
      name: 'retryOnFailure',
      label: 'Ponów przy błędzie',
      type: 'boolean',
      defaultValue: true,
      description: 'Automatycznie ponów z modelem zapasowym'
    }
  ]
};

// ================================
// 5. SMART_MAILBOX RULES
// ================================
const SMART_MAILBOX_CONFIG: RuleTypeConfig = {
  name: 'SMART_MAILBOX',
  description: 'Inteligentne skrzynki pocztowe',
  icon: 'inbox',
  color: 'blue',
  conditionFields: [
    {
      name: 'timeRange',
      label: 'Zakres czasowy',
      type: 'select',
      options: [
        { value: 'TODAY', label: 'Dzisiaj' },
        { value: 'YESTERDAY', label: 'Wczoraj' },
        { value: 'LAST_7_DAYS', label: 'Ostatnie 7 dni' },
        { value: 'LAST_30_DAYS', label: 'Ostatnie 30 dni' }
      ]
    },
    {
      name: 'messageStatus',
      label: 'Status wiadomości',
      type: 'select',
      options: [
        { value: 'UNREAD', label: 'Nieprzeczytane' },
        { value: 'READ', label: 'Przeczytane' },
        { value: 'IMPORTANT', label: 'Ważne' },
        { value: 'ARCHIVED', label: 'Zarchiwizowane' }
      ]
    },
    {
      name: 'hasActionNeeded',
      label: 'Wymaga działania',
      type: 'boolean',
      description: 'Wiadomości oznaczone jako wymagające akcji'
    }
  ],
  actions: [
    {
      name: 'createSmartFilter',
      label: 'Utwórz inteligentny filtr',
      description: 'Dynamiczny filtr na podstawie kryteriów',
      fields: [
        {
          name: 'filterName',
          label: 'Nazwa filtra',
          type: 'text',
          required: true,
          placeholder: 'np. Pilne od klientów VIP'
        },
        {
          name: 'autoRefresh',
          label: 'Automatyczne odświeżanie',
          type: 'boolean',
          description: 'Aktualizuj filtr w czasie rzeczywistym'
        },
        {
          name: 'notifyOnNew',
          label: 'Powiadomienia o nowych',
          type: 'boolean',
          description: 'Powiadomienie o nowych wiadomościach'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'refreshInterval',
      label: 'Interwał odświeżania (min)',
      type: 'number',
      defaultValue: 5,
      validation: { min: 1, max: 60 }
    }
  ]
};

// ================================
// 6. WORKFLOW RULES
// ================================
const WORKFLOW_CONFIG: RuleTypeConfig = {
  name: 'WORKFLOW',
  description: 'Złożone przepływy pracy',
  icon: 'workflow',
  color: 'blue',
  conditionFields: [
    {
      name: 'workflowStage',
      label: 'Etap przepływu',
      type: 'select',
      options: [
        { value: 'INTAKE', label: 'Przyjęcie' },
        { value: 'PROCESSING', label: 'Przetwarzanie' },
        { value: 'REVIEW', label: 'Przegląd' },
        { value: 'APPROVAL', label: 'Zatwierdzenie' },
        { value: 'COMPLETION', label: 'Zakończenie' }
      ]
    },
    {
      name: 'requiredApprovals',
      label: 'Wymagane zatwierdzenia',
      type: 'number',
      validation: { min: 0, max: 10 },
      description: 'Liczba wymaganych zatwierdzeń'
    }
  ],
  actions: [
    {
      name: 'advanceWorkflow',
      label: 'Przejdź do następnego etapu',
      description: 'Automatyczne przejście do kolejnego etapu',
      fields: [
        {
          name: 'nextStage',
          label: 'Następny etap',
          type: 'select',
          required: true,
          options: [
            { value: 'PROCESSING', label: 'Przetwarzanie' },
            { value: 'REVIEW', label: 'Przegląd' },
            { value: 'APPROVAL', label: 'Zatwierdzenie' },
            { value: 'COMPLETION', label: 'Zakończenie' }
          ]
        },
        {
          name: 'assignToUser',
          label: 'Przypisz użytkownikowi',
          type: 'text',
          placeholder: 'ID lub email użytkownika'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'timeoutHours',
      label: 'Timeout (godziny)',
      type: 'number',
      defaultValue: 24,
      validation: { min: 1, max: 168 }
    }
  ]
};

// ================================
// 7. NOTIFICATION RULES
// ================================
const NOTIFICATION_CONFIG: RuleTypeConfig = {
  name: 'NOTIFICATION',
  description: 'Powiadomienia i alerty',
  icon: 'bell',
  color: 'blue',
  conditionFields: [
    {
      name: 'urgencyLevel',
      label: 'Poziom pilności',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Niski' },
        { value: 'MEDIUM', label: 'Średni' },
        { value: 'HIGH', label: 'Wysoki' },
        { value: 'CRITICAL', label: 'Krytyczny' }
      ]
    },
    {
      name: 'notificationTime',
      label: 'Czas powiadomienia',
      type: 'select',
      options: [
        { value: 'IMMEDIATE', label: 'Natychmiast' },
        { value: 'DELAYED_5M', label: 'Po 5 minutach' },
        { value: 'DELAYED_1H', label: 'Po 1 godzinie' },
        { value: 'DAILY_DIGEST', label: 'Dzienny digest' }
      ]
    }
  ],
  actions: [
    {
      name: 'sendNotification',
      label: 'Wyślij powiadomienie',
      description: 'Wysłanie powiadomienia użytkownikowi',
      fields: [
        {
          name: 'notificationType',
          label: 'Typ powiadomienia',
          type: 'select',
          required: true,
          options: [
            { value: 'EMAIL', label: 'Email' },
            { value: 'SMS', label: 'SMS' },
            { value: 'PUSH', label: 'Push notification' },
            { value: 'SLACK', label: 'Slack' },
            { value: 'TEAMS', label: 'Microsoft Teams' }
          ]
        },
        {
          name: 'messageTemplate',
          label: 'Szablon wiadomości',
          type: 'textarea',
          required: true,
          placeholder: 'Otrzymałeś nową wiadomość od [SENDER]...'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'quietHours',
      label: 'Godziny ciszy',
      type: 'text',
      placeholder: '22:00-08:00',
      description: 'Format HH:MM-HH:MM'
    }
  ]
};

// ================================
// 8. INTEGRATION RULES
// ================================
const INTEGRATION_CONFIG: RuleTypeConfig = {
  name: 'INTEGRATION',
  description: 'Integracje z zewnętrznymi systemami',
  icon: 'plug',
  color: 'blue',
  conditionFields: [
    {
      name: 'externalSystem',
      label: 'System zewnętrzny',
      type: 'select',
      options: [
        { value: 'SALESFORCE', label: 'Salesforce' },
        { value: 'HUBSPOT', label: 'HubSpot' },
        { value: 'JIRA', label: 'Jira' },
        { value: 'SLACK', label: 'Slack' },
        { value: 'TEAMS', label: 'Microsoft Teams' },
        { value: 'WEBHOOK', label: 'Webhook' }
      ]
    },
    {
      name: 'syncDirection',
      label: 'Kierunek synchronizacji',
      type: 'select',
      options: [
        { value: 'INBOUND', label: 'Do systemu' },
        { value: 'OUTBOUND', label: 'Z systemu' },
        { value: 'BIDIRECTIONAL', label: 'Dwukierunkowa' }
      ]
    }
  ],
  actions: [
    {
      name: 'syncToExternal',
      label: 'Synchronizuj z zewnętrznym',
      description: 'Wysłanie danych do systemu zewnętrznego',
      fields: [
        {
          name: 'endpoint',
          label: 'Endpoint API',
          type: 'text',
          required: true,
          placeholder: 'https://api.system.com/webhook'
        },
        {
          name: 'authMethod',
          label: 'Metoda autoryzacji',
          type: 'select',
          options: [
            { value: 'API_KEY', label: 'API Key' },
            { value: 'BEARER_TOKEN', label: 'Bearer Token' },
            { value: 'BASIC_AUTH', label: 'Basic Auth' },
            { value: 'OAUTH', label: 'OAuth 2.0' }
          ]
        },
        {
          name: 'dataMapping',
          label: 'Mapowanie danych',
          type: 'textarea',
          placeholder: '{"name": "{{message.subject}}", "content": "{{message.body}}"}',
          description: 'JSON z mapowaniem pól'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'retryAttempts',
      label: 'Próby ponowienia',
      type: 'number',
      defaultValue: 3,
      validation: { min: 0, max: 10 }
    },
    {
      name: 'timeoutSeconds',
      label: 'Timeout (sekundy)',
      type: 'number',
      defaultValue: 30,
      validation: { min: 5, max: 300 }
    }
  ]
};

// ================================
// 9. CUSTOM RULES
// ================================
const CUSTOM_CONFIG: RuleTypeConfig = {
  name: 'CUSTOM',
  description: 'Niestandardowe reguły użytkownika',
  icon: 'settings',
  color: 'blue',
  conditionFields: [
    {
      name: 'customCondition',
      label: 'Warunek niestandardowy',
      type: 'textarea',
      required: true,
      placeholder: 'message.subject.includes("CUSTOM") && message.urgency > 50',
      description: 'JavaScript expression zwracające boolean'
    }
  ],
  actions: [
    {
      name: 'executeCustomAction',
      label: 'Wykonaj akcję niestandardową',
      description: 'Niestandardowa logika biznesowa',
      fields: [
        {
          name: 'customScript',
          label: 'Skrypt niestandardowy',
          type: 'textarea',
          required: true,
          placeholder: 'console.log("Custom action executed");',
          description: 'JavaScript code do wykonania'
        },
        {
          name: 'allowUnsafe',
          label: 'Zezwól na niebezpieczne operacje',
          type: 'boolean',
          description: 'UWAGA: Może wykonywać operacje systemowe'
        }
      ]
    }
  ],
  advancedSettings: [
    {
      name: 'sandboxed',
      label: 'Uruchom w sandboxie',
      type: 'boolean',
      defaultValue: true,
      description: 'Bezpieczne wykonanie w izolowanym środowisku'
    }
  ]
};

// ================================
// REGISTRY WSZYSTKICH TYPÓW REGUŁ
// ================================
const RULE_TYPE_REGISTRY: Record<string, RuleTypeConfig> = {
  PROCESSING: PROCESSING_CONFIG,
  EMAIL_FILTER: EMAIL_FILTER_CONFIG,
  AUTO_REPLY: AUTO_REPLY_CONFIG,
  AI_RULE: AI_RULE_CONFIG,
  SMART_MAILBOX: SMART_MAILBOX_CONFIG,
  WORKFLOW: WORKFLOW_CONFIG,
  NOTIFICATION: NOTIFICATION_CONFIG,
  INTEGRATION: INTEGRATION_CONFIG,
  CUSTOM: CUSTOM_CONFIG
};

// ================================
// EXPORT FUNCTIONS
// ================================

/**
 * Pobiera konfigurację typu reguły
 */
export const getRuleTypeConfig = (ruleType: string): RuleTypeConfig | null => {
  return RULE_TYPE_REGISTRY[ruleType] || null;
};

/**
 * Pobiera wszystkie dostępne typy reguł
 */
export const getAllRuleTypes = (): RuleTypeConfig[] => {
  return Object.values(RULE_TYPE_REGISTRY);
};

/**
 * Generuje JSON reguły na podstawie danych formularza
 */
export const generateRuleJson = (ruleType: string, formData: Record<string, any>) => {
  const config = getRuleTypeConfig(ruleType);
  if (!config) {
    throw new Error(`Unknown rule type: ${ruleType}`);
  }

  // Podstawowe dane reguły
  const ruleJson: any = {
    name: formData.name,
    description: formData.description,
    ruleType: ruleType,
    category: config.name.toLowerCase(),
    status: 'ACTIVE',
    priority: formData.priority || 50,
    triggerType: formData.triggerType,
    triggerEvents: ['MESSAGE_RECEIVED', 'TASK_CREATED'],
    
    // Warunki - zbierz wszystkie pola conditionFields
    conditions: {},
    
    // Akcje - zbierz konfigurację wybranej akcji
    actions: {},
    
    // Ustawienia zaawansowane
    maxExecutionsPerHour: formData.maxExecutionsPerHour || 10,
    maxExecutionsPerDay: formData.maxExecutionsPerDay || 100,
    cooldownPeriod: formData.cooldownPeriod || 60,
    activeFrom: new Date().toISOString(),
    timezone: 'Europe/Warsaw'
  };

  // Zbierz warunki
  config.conditionFields.forEach(field => {
    if (formData[field.name] !== undefined && formData[field.name] !== '') {
      ruleJson.conditions[field.name] = formData[field.name];
    }
  });

  // Zbierz akcje
  if (formData.actionType) {
    const selectedAction = config.actions.find(action => action.name === formData.actionType);
    if (selectedAction) {
      ruleJson.actions = {
        type: formData.actionType,
        config: {}
      };

      selectedAction.fields.forEach(field => {
        if (formData[field.name] !== undefined && formData[field.name] !== '') {
          ruleJson.actions.config[field.name] = formData[field.name];
        }
      });
    }
  }

  // Zbierz ustawienia zaawansowane
  config.advancedSettings.forEach(setting => {
    if (formData[setting.name] !== undefined && formData[setting.name] !== '') {
      ruleJson[setting.name] = formData[setting.name];
    }
  });

  return ruleJson;
};

/**
 * Waliduje konfigurację reguły
 */
export const validateRuleConfig = (ruleType: string, formData: Record<string, any>): string[] => {
  const config = getRuleTypeConfig(ruleType);
  if (!config) {
    return [`Unknown rule type: ${ruleType}`];
  }

  const errors: string[] = [];

  // Waliduj wymagane pola podstawowe
  if (!formData.name) errors.push('Nazwa reguły jest wymagana');
  if (!formData.triggerType) errors.push('Typ wyzwalacza jest wymagany');
  if (!formData.actionType) errors.push('Typ akcji jest wymagany');

  // Waliduj pola warunków
  config.conditionFields.forEach(field => {
    if (field.required && (!formData[field.name] || formData[field.name] === '')) {
      errors.push(`${field.label} jest wymagane`);
    }
  });

  // Waliduj pola wybranej akcji
  if (formData.actionType) {
    const selectedAction = config.actions.find(action => action.name === formData.actionType);
    if (selectedAction) {
      selectedAction.fields.forEach(field => {
        if (field.required && (!formData[field.name] || formData[field.name] === '')) {
          errors.push(`${field.label} jest wymagane`);
        }
      });
    }
  }

  return errors;
};

export default {
  getRuleTypeConfig,
  getAllRuleTypes,
  generateRuleJson,
  validateRuleConfig
};