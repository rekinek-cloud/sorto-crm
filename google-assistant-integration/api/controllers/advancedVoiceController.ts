import { Router, Request, Response } from 'express';
import { AdvancedVoiceService } from '../services/advancedVoiceService';
import { NLPProcessor } from '../services/nlpProcessor';
import { VoiceInteractionLogger } from '../services/voiceInteractionLogger';
import { CRMIntegrationService } from '../services/crmIntegrationService';
import { createLogger } from '../services/logger';

const router = Router();
const logger = createLogger();
const advancedVoiceService = new AdvancedVoiceService();
const nlpProcessor = new NLPProcessor();
const interactionLogger = new VoiceInteractionLogger();
const crmService = new CRMIntegrationService();

/**
 * Advanced Task Management Endpoints
 */

// Add Task with Advanced NLP
router.post('/tasks/add', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    // Extract and process task description
    const taskDescription = nlpProcessor.extractTaskDescription(parameters);
    const taskMetadata = await nlpProcessor.analyzeTaskIntent(taskDescription, parameters);
    
    if (!taskDescription) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Nie podałeś opisu zadania. Spróbuj: "Dodaj zadanie przygotuj prezentację"'
      ));
    }
    
    // Create task with enhanced metadata
    const taskData = {
      title: taskDescription,
      priority: taskMetadata.priority || 'MEDIUM',
      context: taskMetadata.context || '@computer',
      description: taskMetadata.description || '',
      dueDate: taskMetadata.dueDate,
      estimatedTime: taskMetadata.estimatedTime,
      tags: taskMetadata.tags,
      sourceType: 'VOICE_COMMAND',
      voiceMetadata: {
        originalPhrase: parameters.task_description?.original,
        confidence: taskMetadata.confidence,
        extractedEntities: taskMetadata.entities
      }
    };
    
    const result = await crmService.createTask(taskData);
    
    if (result.success) {
      const response = await advancedVoiceService.createTaskAddedResponse(taskData, result.data);
      
      // Log successful interaction
      await interactionLogger.logInteraction({
        sessionId: session?.id,
        intent: 'crm_gtd.add_task',
        parameters: parameters,
        response: JSON.stringify(response),
        success: true,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        source: 'GOOGLE_ASSISTANT',
        locale: 'pl'
      });
      
      res.json(response);
    } else {
      const errorResponse = await advancedVoiceService.createErrorResponse(
        'Nie udało się dodać zadania. Spróbuj ponownie.'
      );
      res.json(errorResponse);
    }
    
  } catch (error) {
    logger.error('Error in advanced add task:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Wystąpił błąd podczas dodawania zadania.'
    ));
  }
});

// Show Today's Tasks with Smart Filtering
router.post('/tasks/show-today', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    // Apply smart filtering based on voice input
    const filters = await nlpProcessor.extractTaskFilters(parameters);
    
    const tasksResult = await crmService.getTasks({
      date: new Date().toISOString().split('T')[0],
      ...filters,
      limit: 10
    });
    
    if (tasksResult.success && tasksResult.data) {
      const response = await advancedVoiceService.createTasksListResponse(
        tasksResult.data,
        'Oto twoje zadania na dziś:'
      );
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się pobrać zadań.'
      ));
    }
    
  } catch (error) {
    logger.error('Error showing today tasks:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas pobierania zadań.'
    ));
  }
});

// Complete Task with Fuzzy Matching
router.post('/tasks/complete', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const taskName = parameters.task_name?.resolved || parameters.task_name?.original;
    
    if (!taskName) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę zadania do ukończenia.'
      ));
    }
    
    // Find task using fuzzy matching
    const matchedTask = await nlpProcessor.findTaskByName(taskName);
    
    if (!matchedTask) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Nie znalazłem zadania "${taskName}". Sprawdź nazwę i spróbuj ponownie.`
      ));
    }
    
    // Mark task as completed
    const result = await crmService.updateTask(matchedTask.id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });
    
    if (result.success) {
      const response = await advancedVoiceService.createTaskCompletedResponse(matchedTask);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się oznaczyć zadania jako ukończone.'
      ));
    }
    
  } catch (error) {
    logger.error('Error completing task:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas oznaczania zadania jako ukończone.'
    ));
  }
});

// Move Task with Date Intelligence
router.post('/tasks/move', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const taskName = parameters.task_name?.resolved || parameters.task_name?.original;
    const targetDate = await nlpProcessor.parseDateTime(parameters.target_date);
    
    if (!taskName || !targetDate) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę zadania i datę przeniesienia.'
      ));
    }
    
    const matchedTask = await nlpProcessor.findTaskByName(taskName);
    
    if (!matchedTask) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Nie znalazłem zadania "${taskName}".`
      ));
    }
    
    const result = await crmService.updateTask(matchedTask.id, {
      dueDate: targetDate.toISOString()
    });
    
    if (result.success) {
      const response = await advancedVoiceService.createTaskMovedResponse(
        matchedTask,
        targetDate
      );
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się przenieść zadania.'
      ));
    }
    
  } catch (error) {
    logger.error('Error moving task:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas przenoszenia zadania.'
    ));
  }
});

// Next Priority Task with Smart Selection
router.post('/tasks/next-priority', async (req: Request, res: Response) => {
  try {
    const { session } = req.body;
    
    // Get user's next priority task using smart algorithm
    const nextTask = await advancedVoiceService.getNextPriorityTask(session?.userId);
    
    if (nextTask) {
      const response = await advancedVoiceService.createNextTaskResponse(nextTask);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Świetnie! Nie masz żadnych pilnych zadań. Czas na przegląd projektów lub może kiedyś listę.']
            }
          }]
        }
      }));
    }
    
  } catch (error) {
    logger.error('Error getting next priority task:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas pobierania następnego zadania.'
    ));
  }
});

/**
 * CRM Operations Endpoints
 */

// Add Client Note with Entity Recognition
router.post('/crm/add-note', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const clientName = await nlpProcessor.extractPersonName(parameters.client_name);
    const noteContent = parameters.note_content?.resolved || parameters.note_content?.original;
    const noteType = await nlpProcessor.classifyNoteType(noteContent);
    
    if (!clientName || !noteContent) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę klienta i treść notatki.'
      ));
    }
    
    // Find client using fuzzy matching
    const matchedClient = await nlpProcessor.findClientByName(clientName);
    
    if (!matchedClient) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Nie znalazłem klienta "${clientName}". Sprawdź nazwę.`
      ));
    }
    
    // Create note
    const noteData = {
      clientId: matchedClient.id,
      content: noteContent,
      type: noteType,
      createdVia: 'VOICE_COMMAND',
      voiceMetadata: {
        originalPhrase: parameters.note_content?.original,
        recognizedEntities: await nlpProcessor.extractEntities(noteContent)
      }
    };
    
    const result = await crmService.createClientNote(noteData);
    
    if (result.success) {
      const response = await advancedVoiceService.createNoteAddedResponse(
        matchedClient,
        noteContent
      );
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się dodać notatki.'
      ));
    }
    
  } catch (error) {
    logger.error('Error adding client note:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas dodawania notatki.'
    ));
  }
});

// Show Lead Status with Detailed Information
router.post('/crm/lead-status', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const leadName = await nlpProcessor.extractPersonName(parameters.lead_name);
    
    if (!leadName) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę leada.'
      ));
    }
    
    const matchedLead = await nlpProcessor.findLeadByName(leadName);
    
    if (!matchedLead) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Nie znalazłem leada "${leadName}".`
      ));
    }
    
    // Get comprehensive lead information
    const leadDetails = await crmService.getLeadDetails(matchedLead.id);
    
    if (leadDetails.success) {
      const response = await advancedVoiceService.createLeadStatusResponse(leadDetails.data);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się pobrać informacji o leadzie.'
      ));
    }
    
  } catch (error) {
    logger.error('Error showing lead status:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas pobierania statusu leada.'
    ));
  }
});

// Schedule Follow-up with Smart Date Parsing
router.post('/crm/schedule-followup', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const clientName = await nlpProcessor.extractPersonName(parameters.client_name);
    const followupDate = await nlpProcessor.parseDateTime(parameters.followup_date);
    const followupType = parameters.followup_type?.resolved || 'CALL';
    
    if (!clientName || !followupDate) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę klienta i datę follow-up.'
      ));
    }
    
    const matchedClient = await nlpProcessor.findClientByName(clientName);
    
    if (!matchedClient) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Nie znalazłem klienta "${clientName}".`
      ));
    }
    
    // Schedule follow-up
    const followupData = {
      clientId: matchedClient.id,
      type: followupType,
      scheduledDate: followupDate.toISOString(),
      createdVia: 'VOICE_COMMAND',
      description: `Follow-up z ${clientName} - ${followupType}`
    };
    
    const result = await crmService.scheduleFollowup(followupData);
    
    if (result.success) {
      const response = await advancedVoiceService.createFollowupScheduledResponse(
        matchedClient,
        followupDate,
        followupType
      );
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się zaplanować follow-up.'
      ));
    }
    
  } catch (error) {
    logger.error('Error scheduling follow-up:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas planowania follow-up.'
    ));
  }
});

// Deals Closing This Week
router.post('/crm/deals-closing', async (req: Request, res: Response) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const dealsResult = await crmService.getDealsClosingInPeriod(
      startOfWeek.toISOString(),
      endOfWeek.toISOString()
    );
    
    if (dealsResult.success) {
      const response = await advancedVoiceService.createClosingDealsResponse(dealsResult.data);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się pobrać informacji o dealach.'
      ));
    }
    
  } catch (error) {
    logger.error('Error getting closing deals:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas pobierania dealów.'
    ));
  }
});

// Create New Lead with Enhanced Processing
router.post('/crm/create-lead', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const companyName = parameters.company_name?.resolved || parameters.company_name?.original;
    const contactPerson = parameters.contact_person?.resolved;
    const leadSource = parameters.lead_source?.resolved || 'VOICE_COMMAND';
    const leadValue = parameters.lead_value?.resolved;
    
    if (!companyName) {
      return res.json(await advancedVoiceService.createErrorResponse(
        'Podaj nazwę firmy dla nowego leada.'
      ));
    }
    
    // Check for duplicate leads
    const existingLead = await nlpProcessor.findLeadByCompany(companyName);
    
    if (existingLead) {
      return res.json(await advancedVoiceService.createErrorResponse(
        `Lead dla firmy "${companyName}" już istnieje.`
      ));
    }
    
    // Create new lead
    const leadData = {
      companyName,
      contactPerson,
      source: leadSource,
      estimatedValue: leadValue,
      status: 'NEW',
      createdVia: 'VOICE_COMMAND',
      voiceMetadata: {
        originalPhrase: parameters.company_name?.original
      }
    };
    
    const result = await crmService.createLead(leadData);
    
    if (result.success) {
      const response = await advancedVoiceService.createLeadCreatedResponse(leadData, result.data);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się utworzyć leada.'
      ));
    }
    
  } catch (error) {
    logger.error('Error creating lead:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas tworzenia leada.'
    ));
  }
});

/**
 * GTD Workflows Endpoints
 */

// Process Inbox with Smart Workflow
router.post('/gtd/process-inbox', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const actionType = parameters.action_type?.resolved;
    
    // Get inbox items
    const inboxResult = await crmService.getInboxItems({
      isProcessed: false,
      limit: 5
    });
    
    if (inboxResult.success && inboxResult.data?.length > 0) {
      const response = await advancedVoiceService.createInboxProcessingResponse(
        inboxResult.data,
        actionType
      );
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Twój inbox jest pusty! Świetna robota z przetwarzaniem GTD.']
            }
          }]
        }
      }));
    }
    
  } catch (error) {
    logger.error('Error processing inbox:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas przetwarzania inbox.'
    ));
  }
});

// Show Someday/Maybe List
router.post('/gtd/someday-maybe', async (req: Request, res: Response) => {
  try {
    const { intent, session } = req.body;
    const parameters = intent?.params || {};
    
    const categoryFilter = parameters.category_filter?.resolved;
    
    const somedayResult = await crmService.getSomedayMaybeItems({
      category: categoryFilter,
      limit: 8
    });
    
    if (somedayResult.success) {
      const response = await advancedVoiceService.createSomedayMaybeResponse(somedayResult.data);
      res.json(response);
    } else {
      res.json(await advancedVoiceService.createErrorResponse(
        'Nie udało się pobrać listy "może kiedyś".'
      ));
    }
    
  } catch (error) {
    logger.error('Error getting someday maybe:', error);
    res.json(await advancedVoiceService.createErrorResponse(
      'Błąd podczas pobierania listy "może kiedyś".'
    ));
  }
});

export const advancedVoiceRoutes = router;