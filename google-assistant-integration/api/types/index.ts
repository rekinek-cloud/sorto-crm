export interface VoiceCommand {
  id: string;
  intent: string;
  parameters: Record<string, any>;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  source: 'GOOGLE_ASSISTANT' | 'NEST_HUB' | 'MOBILE_APP';
  locale: string;
}

export interface VoiceResponse {
  fulfillmentResponse: {
    messages: Array<{
      text?: {
        text: string[];
      };
      card?: {
        title: string;
        subtitle?: string;
        text: string;
        image?: {
          url: string;
          accessibilityText: string;
        };
      };
      carouselCard?: {
        items: Array<{
          title: string;
          description: string;
          image?: {
            url: string;
            accessibilityText: string;
          };
        }>;
      };
    }>;
  };
  sessionInfo?: {
    parameters?: Record<string, any>;
  };
}

export interface TaskCreationRequest {
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  context?: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
}

export interface ProjectCreationRequest {
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ContactFilter {
  search?: string;
  company?: string;
  limit?: number;
  offset?: number;
}

export interface TaskFilter {
  date?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  context?: string;
  limit?: number;
  offset?: number;
}

export interface InboxItem {
  id: string;
  title: string;
  content: string;
  sourceType: 'QUICK_CAPTURE' | 'MEETING_NOTES' | 'PHONE_CALL' | 'EMAIL' | 'IDEA' | 'DOCUMENT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isProcessed: boolean;
  createdAt: Date;
  processedAt?: Date;
}

export interface NestDisplayWidget {
  id: string;
  type: 'TASK_SUMMARY' | 'CALENDAR' | 'CONTACTS' | 'PROJECTS' | 'WEATHER' | 'NEWS';
  title: string;
  data: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  refreshInterval: number; // in seconds
}

export interface WebhookPayload {
  intent: {
    name: string;
    params: Record<string, {
      original: string;
      resolved: string;
    }>;
  };
  scene: {
    name: string;
    slotFillingStatus: string;
    slots: Record<string, any>;
  };
  session: {
    id: string;
    params: Record<string, any>;
    languageCode: string;
  };
  user: {
    locale: string;
    params: Record<string, any>;
  };
  home: {
    params: Record<string, any>;
  };
  device: {
    capabilities: string[];
  };
}

export interface VoiceInteractionLog {
  id: string;
  sessionId: string;
  userId?: string;
  intent: string;
  parameters: Record<string, any>;
  response: string;
  success: boolean;
  errorMessage?: string;
  processingTime: number; // in milliseconds
  timestamp: Date;
  source: 'GOOGLE_ASSISTANT' | 'NEST_HUB' | 'MOBILE_APP';
  locale: string;
  deviceInfo?: {
    type: string;
    capabilities: string[];
  };
}

export interface CRMIntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface GoogleAuthCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  expiryDate: number;
}

export interface NestHubDisplayData {
  widgets: NestDisplayWidget[];
  theme: 'light' | 'dark';
  layout: 'grid' | 'list';
  refreshInterval: number;
  lastUpdated: Date;
}

export interface VoiceCommandContext {
  previousIntent?: string;
  conversationState?: Record<string, any>;
  userPreferences?: {
    language: string;
    timeZone: string;
    defaultContext: string;
    voiceSpeed: number;
  };
}