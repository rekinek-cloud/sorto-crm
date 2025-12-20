import { Router, Request, Response } from 'express';
import { WebhookPayload, VoiceResponse } from '../types';
import { VoiceCommandService } from '../services/voiceCommandService';
import { VoiceInteractionLogger } from '../services/voiceInteractionLogger';
import { createLogger } from '../services/logger';
import { verifyWebhookSignature } from '../middleware/webhookAuth';

const router = Router();
const logger = createLogger();
const voiceCommandService = new VoiceCommandService();
const interactionLogger = new VoiceInteractionLogger();

/**
 * Główny webhook endpoint dla Google Assistant
 */
router.post('/google-assistant', verifyWebhookSignature, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const payload: WebhookPayload = req.body;
    
    logger.info('Received webhook from Google Assistant:', {
      intent: payload.intent?.name,
      sessionId: payload.session?.id,
      locale: payload.user?.locale
    });
    
    // Przetwarzanie żądania webhook
    const response = await processWebhookRequest(payload);
    
    // Logowanie interakcji
    await interactionLogger.logInteraction({
      sessionId: payload.session.id,
      intent: payload.intent.name,
      parameters: payload.intent.params,
      response: JSON.stringify(response),
      success: true,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale,
      deviceInfo: {
        type: payload.device.capabilities.includes('SPEECH') ? 'voice' : 'display',
        capabilities: payload.device.capabilities
      }
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error processing webhook:', error);
    
    // Logowanie błędu
    if (req.body.session?.id) {
      await interactionLogger.logInteraction({
        sessionId: req.body.session.id,
        intent: req.body.intent?.name || 'unknown',
        parameters: req.body.intent?.params || {},
        response: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        source: 'GOOGLE_ASSISTANT',
        locale: req.body.user?.locale || 'pl'
      });
    }
    
    res.json({
      fulfillmentResponse: {
        messages: [{
          text: {
            text: ['Przepraszam, wystąpił błąd podczas przetwarzania twojego żądania. Spróbuj ponownie.']
          }
        }]
      }
    });
  }
});

/**
 * Webhook endpoint dla dodawania zadań
 */
router.post('/add-task', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    const response = await voiceCommandService.handleAddTask({
      id: `webhook-${Date.now()}`,
      intent: payload.intent.name,
      parameters: extractParameters(payload.intent.params),
      sessionId: payload.session.id,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error in add-task webhook:', error);
    res.json(createErrorResponse('Nie udało się dodać zadania. Spróbuj ponownie.'));
  }
});

/**
 * Webhook endpoint dla wyświetlania zadań
 */
router.post('/show-tasks', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    const response = await voiceCommandService.handleShowTasks({
      id: `webhook-${Date.now()}`,
      intent: payload.intent.name,
      parameters: extractParameters(payload.intent.params),
      sessionId: payload.session.id,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error in show-tasks webhook:', error);
    res.json(createErrorResponse('Nie udało się pobrać zadań. Spróbuj ponownie.'));
  }
});

/**
 * Webhook endpoint dla tworzenia projektów
 */
router.post('/create-project', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    const response = await voiceCommandService.handleCreateProject({
      id: `webhook-${Date.now()}`,
      intent: payload.intent.name,
      parameters: extractParameters(payload.intent.params),
      sessionId: payload.session.id,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error in create-project webhook:', error);
    res.json(createErrorResponse('Nie udało się utworzyć projektu. Spróbuj ponownie.'));
  }
});

/**
 * Webhook endpoint dla wyświetlania kontaktów
 */
router.post('/show-contacts', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    const response = await voiceCommandService.handleShowContacts({
      id: `webhook-${Date.now()}`,
      intent: payload.intent.name,
      parameters: extractParameters(payload.intent.params),
      sessionId: payload.session.id,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error in show-contacts webhook:', error);
    res.json(createErrorResponse('Nie udało się pobrać kontaktów. Spróbuj ponownie.'));
  }
});

/**
 * Webhook endpoint dla przetwarzania inbox
 */
router.post('/process-inbox', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;
    const response = await voiceCommandService.handleProcessInbox({
      id: `webhook-${Date.now()}`,
      intent: payload.intent.name,
      parameters: extractParameters(payload.intent.params),
      sessionId: payload.session.id,
      timestamp: new Date(),
      source: 'GOOGLE_ASSISTANT',
      locale: payload.user.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error in process-inbox webhook:', error);
    res.json(createErrorResponse('Nie udało się przetworzyć skrzynki. Spróbuj ponownie.'));
  }
});

/**
 * Test webhook endpoint
 */
router.post('/test', async (req: Request, res: Response) => {
  res.json({
    fulfillmentResponse: {
      messages: [{
        text: {
          text: ['Test webhook działa poprawnie!']
        }
      }]
    }
  });
});

/**
 * Przetwarzanie głównego żądania webhook
 */
async function processWebhookRequest(payload: WebhookPayload): Promise<VoiceResponse> {
  const command = {
    id: `webhook-${Date.now()}`,
    intent: payload.intent.name,
    parameters: extractParameters(payload.intent.params),
    sessionId: payload.session.id,
    timestamp: new Date(),
    source: 'GOOGLE_ASSISTANT' as const,
    locale: payload.user.locale
  };
  
  switch (payload.intent.name) {
    case 'actions.intent.MAIN':
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Witaj w CRM-GTD Smart! Mogę pomóc ci zarządzać zadaniami, projektami i kontaktami. Co chcesz zrobić?']
            }
          }]
        }
      };
    
    case 'crm_gtd.add_task':
      return await voiceCommandService.handleAddTask(command);
    
    case 'crm_gtd.show_tasks':
      return await voiceCommandService.handleShowTasks(command);
    
    case 'crm_gtd.create_project':
      return await voiceCommandService.handleCreateProject(command);
    
    case 'crm_gtd.show_contacts':
      return await voiceCommandService.handleShowContacts(command);
    
    case 'crm_gtd.process_inbox':
      return await voiceCommandService.handleProcessInbox(command);
    
    case 'crm_gtd.get_help':
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [
                'Dostępne polecenia:\n' +
                '• "Dodaj zadanie [nazwa]" - dodaje nowe zadanie\n' +
                '• "Pokaż zadania" - wyświetla zadania\n' +
                '• "Utwórz projekt [nazwa]" - tworzy nowy projekt\n' +
                '• "Sprawdź kontakty" - wyświetla kontakty\n' +
                '• "Przetwórz skrzynkę" - pomaga w GTD Inbox'
              ]
            }
          }]
        }
      };
    
    default:
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Nie rozumiem tego polecenia. Powiedz "pomoc" aby zobaczyć dostępne opcje.']
            }
          }]
        }
      };
  }
}

/**
 * Wyodrębnianie parametrów z payload webhook
 */
function extractParameters(params: Record<string, any>): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value && typeof value === 'object') {
      extracted[key] = value.resolved || value.original || value;
    } else {
      extracted[key] = value;
    }
  }
  
  return extracted;
}

/**
 * Tworzenie odpowiedzi błędu
 */
function createErrorResponse(message: string): VoiceResponse {
  return {
    fulfillmentResponse: {
      messages: [{
        text: {
          text: [message]
        }
      }]
    }
  };
}

export const webhookRoutes = router;