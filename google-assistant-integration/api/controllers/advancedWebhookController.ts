import { Router, Request, Response } from 'express';
import { AdvancedVoiceService } from '../services/advancedVoiceService';
import { NLPProcessor } from '../services/nlpProcessor';
import { VoiceInteractionLogger } from '../services/voiceInteractionLogger';
import { WebhookValidator } from '../services/webhookValidator';
import { createLogger } from '../services/logger';
import { verifyWebhookSignature, validateWebhookPayload } from '../middleware/webhookAuth';

const router = Router();
const logger = createLogger();
const advancedVoiceService = new AdvancedVoiceService();
const nlpProcessor = new NLPProcessor();
const interactionLogger = new VoiceInteractionLogger();
const webhookValidator = new WebhookValidator();

/**
 * Main Advanced Webhook Handler
 * Handles all Google Assistant intents with sophisticated processing
 */
router.post('/google-assistant-advanced', 
  verifyWebhookSignature,
  validateWebhookPayload,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    let sessionId = '';
    let intentName = '';
    
    try {
      const payload = req.body;
      sessionId = payload.session?.id || 'unknown';
      intentName = payload.intent?.name || 'unknown';
      
      logger.info('Advanced webhook request received:', {
        intent: intentName,
        sessionId: sessionId,
        locale: payload.user?.locale,
        deviceCapabilities: payload.device?.capabilities
      });
      
      // Validate payload structure
      const validationResult = webhookValidator.validatePayload(payload);
      if (!validationResult.isValid) {
        return res.json(await createValidationErrorResponse(validationResult.errors));
      }
      
      // Process the intent with advanced handling
      const response = await processAdvancedIntent(payload);
      
      // Log successful interaction
      await interactionLogger.logInteraction({
        sessionId: sessionId,
        intent: intentName,
        parameters: payload.intent?.params || {},
        response: JSON.stringify(response),
        success: true,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        source: 'GOOGLE_ASSISTANT',
        locale: payload.user?.locale || 'pl',
        deviceInfo: {
          type: getDeviceType(payload.device?.capabilities),
          capabilities: payload.device?.capabilities || []
        }
      });
      
      res.json(response);
      
    } catch (error) {
      logger.error('Error in advanced webhook:', error);
      
      // Log failed interaction
      if (sessionId) {
        await interactionLogger.logInteraction({
          sessionId: sessionId,
          intent: intentName,
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
      
      res.json(await createSystemErrorResponse());
    }
  }
);

/**
 * Specific Task Management Webhooks
 */
router.post('/tasks/add-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.add_task');
      const response = await advancedVoiceService.createTaskAddedResponse(
        command.parameters,
        { id: 'mock-id' }
      );
      res.json(response);
    } catch (error) {
      logger.error('Error in add task advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/tasks/complete-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.complete_task');
      
      // Find task using NLP
      const taskName = command.parameters.task_name;
      const matchedTask = await nlpProcessor.findTaskByName(taskName);
      
      if (!matchedTask) {
        return res.json(await createTaskNotFoundResponse(taskName));
      }
      
      const response = await advancedVoiceService.createTaskCompletedResponse(matchedTask);
      res.json(response);
      
    } catch (error) {
      logger.error('Error in complete task advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/tasks/move-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.move_task');
      
      const taskName = command.parameters.task_name;
      const targetDate = await nlpProcessor.parseDateTime(command.parameters.target_date);
      
      if (!targetDate) {
        return res.json(await createDateParseErrorResponse());
      }
      
      const matchedTask = await nlpProcessor.findTaskByName(taskName);
      
      if (!matchedTask) {
        return res.json(await createTaskNotFoundResponse(taskName));
      }
      
      const response = await advancedVoiceService.createTaskMovedResponse(
        matchedTask,
        targetDate
      );
      res.json(response);
      
    } catch (error) {
      logger.error('Error in move task advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

/**
 * CRM Operations Webhooks
 */
router.post('/crm/add-note-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.add_client_note');
      
      const clientName = await nlpProcessor.extractPersonName(command.parameters.client_name);
      const noteContent = command.parameters.note_content;
      
      if (!clientName || !noteContent) {
        return res.json(await createMissingParametersResponse(['client_name', 'note_content']));
      }
      
      const matchedClient = await nlpProcessor.findClientByName(clientName);
      
      if (!matchedClient) {
        return res.json(await createClientNotFoundResponse(clientName));
      }
      
      const response = await advancedVoiceService.createNoteAddedResponse(
        matchedClient,
        noteContent
      );
      res.json(response);
      
    } catch (error) {
      logger.error('Error in add note advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/crm/lead-status-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.show_lead_status');
      
      const leadName = await nlpProcessor.extractPersonName(command.parameters.lead_name);
      
      if (!leadName) {
        return res.json(await createMissingParametersResponse(['lead_name']));
      }
      
      const matchedLead = await nlpProcessor.findLeadByName(leadName);
      
      if (!matchedLead) {
        return res.json(await createLeadNotFoundResponse(leadName));
      }
      
      const response = await advancedVoiceService.createLeadStatusResponse(matchedLead);
      res.json(response);
      
    } catch (error) {
      logger.error('Error in lead status advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

/**
 * SMART Goals Webhooks
 */
router.post('/goals/progress-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.goal_progress');
      const response = await advancedVoiceService.handleGoalProgress(command);
      res.json(response);
    } catch (error) {
      logger.error('Error in goal progress advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/goals/update-progress-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.update_goal_progress');
      const response = await advancedVoiceService.handleUpdateGoalProgress(command);
      res.json(response);
    } catch (error) {
      logger.error('Error in update goal progress advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/goals/quarterly-advanced',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.show_quarterly_goals');
      const response = await advancedVoiceService.handleQuarterlyGoals(command);
      res.json(response);
    } catch (error) {
      logger.error('Error in quarterly goals advanced webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

/**
 * Fallback and Help Webhooks
 */
router.post('/fallback',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const userInput = payload.intent?.query || '';
      
      // Try to understand the intent using NLP
      const suggestedIntent = await nlpProcessor.suggestIntent(userInput);
      
      if (suggestedIntent) {
        const response = await createSuggestionResponse(suggestedIntent, userInput);
        res.json(response);
      } else {
        const response = await createGenericFallbackResponse();
        res.json(response);
      }
      
    } catch (error) {
      logger.error('Error in fallback webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

router.post('/help-context',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const command = extractVoiceCommand(req.body, 'crm_gtd.get_help');
      const helpCategory = command.parameters.help_category;
      
      const response = await createContextualHelpResponse(helpCategory);
      res.json(response);
      
    } catch (error) {
      logger.error('Error in contextual help webhook:', error);
      res.json(await createSystemErrorResponse());
    }
  }
);

/**
 * Utility Functions
 */

async function processAdvancedIntent(payload: any): Promise<any> {
  const intentName = payload.intent?.name;
  const command = extractVoiceCommand(payload, intentName);
  
  switch (intentName) {
    case 'actions.intent.MAIN':
      return await createWelcomeResponse();
      
    case 'crm_gtd.add_task':
      return await advancedVoiceService.createTaskAddedResponse(
        await nlpProcessor.analyzeTaskIntent(
          nlpProcessor.extractTaskDescription(command.parameters),
          command.parameters
        ),
        { id: 'mock-id' }
      );
      
    case 'crm_gtd.show_tasks_today':
      return await createTodayTasksResponse();
      
    case 'crm_gtd.complete_task':
      const taskName = command.parameters.task_name;
      const task = await nlpProcessor.findTaskByName(taskName);
      return task ? 
        await advancedVoiceService.createTaskCompletedResponse(task) :
        await createTaskNotFoundResponse(taskName);
        
    case 'crm_gtd.next_priority_task':
      const nextTask = await advancedVoiceService.getNextPriorityTask();
      return nextTask ? 
        await advancedVoiceService.createNextTaskResponse(nextTask) :
        await createNoTasksResponse();
        
    case 'crm_gtd.goal_progress':
      return await advancedVoiceService.handleGoalProgress(command);
      
    case 'crm_gtd.update_goal_progress':
      return await advancedVoiceService.handleUpdateGoalProgress(command);
      
    case 'crm_gtd.show_quarterly_goals':
      return await advancedVoiceService.handleQuarterlyGoals(command);
      
    case 'crm_gtd.get_help':
      return await createContextualHelpResponse(command.parameters.help_category);
      
    default:
      return await createUnknownIntentResponse(intentName);
  }
}

function extractVoiceCommand(payload: any, intentName: string): any {
  return {
    id: `webhook-${Date.now()}`,
    intent: intentName,
    parameters: extractParameters(payload.intent?.params || {}),
    sessionId: payload.session?.id || 'unknown',
    timestamp: new Date(),
    source: 'GOOGLE_ASSISTANT',
    locale: payload.user?.locale || 'pl'
  };
}

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

function getDeviceType(capabilities: string[]): string {
  if (!capabilities) return 'unknown';
  
  if (capabilities.includes('SPEECH')) {
    return capabilities.includes('SCREEN_OUTPUT') ? 'smart_display' : 'smart_speaker';
  }
  
  return 'mobile';
}

/**
 * Response Creators
 */

async function createWelcomeResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Witaj w CRM-GTD Smart! Jestem twoim asystentem głosowym. Mogę pomóc z zadaniami, klientami, projektami i celami. Co chcesz zrobić?']
          }
        }
      ]
    }
  };
}

async function createTodayTasksResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Pobieram twoje zadania na dziś...']
          }
        }
      ]
    }
  };
}

async function createTaskNotFoundResponse(taskName: string): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Nie znalazłem zadania "${taskName}". Sprawdź nazwę i spróbuj ponownie, lub powiedz "pokaż zadania" aby zobaczyć wszystkie.`]
          }
        }
      ]
    }
  };
}

async function createClientNotFoundResponse(clientName: string): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Nie znalazłem klienta "${clientName}". Sprawdź nazwę i spróbuj ponownie.`]
          }
        }
      ]
    }
  };
}

async function createLeadNotFoundResponse(leadName: string): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Nie znalazłem leada "${leadName}". Sprawdź nazwę firmy lub osoby kontaktowej.`]
          }
        }
      ]
    }
  };
}

async function createDateParseErrorResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Nie rozumiem tej daty. Spróbuj powiedzieć "jutro", "następny tydzień" lub konkretną datę.']
          }
        }
      ]
    }
  };
}

async function createMissingParametersResponse(missingParams: string[]): Promise<any> {
  const paramsText = missingParams.join(', ');
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Brakuje informacji: ${paramsText}. Spróbuj ponownie z pełnymi danymi.`]
          }
        }
      ]
    }
  };
}

async function createNoTasksResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Świetnie! Nie masz żadnych pilnych zadań. Może czas na przegląd projektów lub listy "może kiedyś"?']
          }
        }
      ]
    }
  };
}

async function createSuggestionResponse(suggestedIntent: string, userInput: string): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Nie jestem pewien co masz na myśli mówiąc "${userInput}". Czy chodziło ci o "${suggestedIntent}"?`]
          }
        }
      ]
    }
  };
}

async function createGenericFallbackResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Nie rozumiem tego polecenia. Powiedz "pomoc" aby zobaczyć dostępne opcje, lub spróbuj prostszego polecenia jak "pokaż zadania".']
          }
        }
      ]
    }
  };
}

async function createContextualHelpResponse(category?: string): Promise<any> {
  const helpMessages = {
    TASKS: 'Zadania: "Dodaj zadanie [opis]", "Pokaż zadania na dziś", "Oznacz zadanie [nazwa] jako ukończone", "Przenieś zadanie [nazwa] na jutro"',
    CRM: 'CRM: "Dodaj notatkę do klienta [nazwa]", "Pokaż status leada [nazwa]", "Zaplanuj follow-up z [klient]", "Utwórz nowego leada [firma]"',
    GTD: 'GTD: "Przetwórz inbox", "Co na liście może kiedyś", "Przenieś [zadanie] do oczekiwania", "Przegląd tygodniowy"',
    GOALS: 'Cele: "Progress celu [nazwa]", "Aktualizuj cel [nazwa] na [procent]", "Pokaż cele kwartalne"'
  };
  
  if (category && helpMessages[category]) {
    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [helpMessages[category]]
            }
          }
        ]
      }
    };
  }
  
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [Object.values(helpMessages).join('\n\n')]
          }
        }
      ]
    }
  };
}

async function createUnknownIntentResponse(intentName: string): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [`Nieznany intent: ${intentName}. Powiedz "pomoc" aby zobaczyć dostępne opcje.`]
          }
        }
      ]
    }
  };
}

async function createValidationErrorResponse(errors: string[]): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Błąd w strukturze żądania. Spróbuj ponownie.']
          }
        }
      ]
    }
  };
}

async function createSystemErrorResponse(): Promise<any> {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: ['Przepraszam, wystąpił błąd systemu. Spróbuj ponownie za chwilę.']
          }
        }
      ]
    }
  };
}

export const advancedWebhookRoutes = router;