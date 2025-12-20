import { Router, Request, Response } from 'express';
import { VoiceCommandService } from '../services/voiceCommandService';
import { CRMIntegrationService } from '../services/crmIntegrationService';
import { VoiceInteractionLogger } from '../services/voiceInteractionLogger';
import { VoiceCommand, VoiceResponse, TaskCreationRequest, ProjectCreationRequest, TaskFilter, ContactFilter } from '../types';
import { createLogger } from '../services/logger';

const router = Router();
const logger = createLogger();
const voiceCommandService = new VoiceCommandService();
const crmService = new CRMIntegrationService();
const interactionLogger = new VoiceInteractionLogger();

/**
 * Endpoint dla przetwarzania poleceń głosowych
 */
router.post('/command', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const command: VoiceCommand = req.body;
    
    // Walidacja danych wejściowych
    if (!command.intent || !command.sessionId) {
      return res.status(400).json({
        error: 'Invalid voice command',
        message: 'Intent and sessionId are required'
      });
    }
    
    // Przetwarzanie polecenia głosowego
    const response = await processVoiceCommand(command);
    
    // Logowanie interakcji
    await interactionLogger.logInteraction({
      sessionId: command.sessionId,
      userId: command.userId,
      intent: command.intent,
      parameters: command.parameters,
      response: JSON.stringify(response),
      success: true,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
      source: command.source,
      locale: command.locale
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error processing voice command:', error);
    
    // Logowanie błędu
    if (req.body.sessionId) {
      await interactionLogger.logInteraction({
        sessionId: req.body.sessionId,
        userId: req.body.userId,
        intent: req.body.intent || 'unknown',
        parameters: req.body.parameters || {},
        response: '',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
        source: req.body.source || 'GOOGLE_ASSISTANT',
        locale: req.body.locale || 'pl'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process voice command'
    });
  }
});

/**
 * Endpoint dla dodawania zadań głosowo
 */
router.post('/add-task', async (req: Request, res: Response) => {
  try {
    const taskData: TaskCreationRequest = req.body;
    
    if (!taskData.title) {
      return res.status(400).json({
        error: 'Invalid task data',
        message: 'Task title is required'
      });
    }
    
    const result = await crmService.createTask(taskData);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `Zadanie "${taskData.title}" zostało pomyślnie dodane.`
      });
    } else {
      res.status(500).json({
        error: 'Failed to create task',
        message: result.error?.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    logger.error('Error adding task:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add task'
    });
  }
});

/**
 * Endpoint dla pobierania zadań głosowo
 */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const filter: TaskFilter = {
      date: req.query.date as string,
      priority: req.query.priority as any,
      status: req.query.status as any,
      context: req.query.context as string,
      limit: parseInt(req.query.limit as string) || 10,
      offset: parseInt(req.query.offset as string) || 0
    };
    
    const result = await crmService.getTasks(filter);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } else {
      res.status(500).json({
        error: 'Failed to get tasks',
        message: result.error?.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    logger.error('Error getting tasks:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get tasks'
    });
  }
});

/**
 * Endpoint dla tworzenia projektów głosowo
 */
router.post('/create-project', async (req: Request, res: Response) => {
  try {
    const projectData: ProjectCreationRequest = req.body;
    
    if (!projectData.name) {
      return res.status(400).json({
        error: 'Invalid project data',
        message: 'Project name is required'
      });
    }
    
    const result = await crmService.createProject(projectData);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `Projekt "${projectData.name}" został pomyślnie utworzony.`
      });
    } else {
      res.status(500).json({
        error: 'Failed to create project',
        message: result.error?.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create project'
    });
  }
});

/**
 * Endpoint dla pobierania kontaktów głosowo
 */
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const filter: ContactFilter = {
      search: req.query.search as string,
      company: req.query.company as string,
      limit: parseInt(req.query.limit as string) || 10,
      offset: parseInt(req.query.offset as string) || 0
    };
    
    const result = await crmService.getContacts(filter);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } else {
      res.status(500).json({
        error: 'Failed to get contacts',
        message: result.error?.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    logger.error('Error getting contacts:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get contacts'
    });
  }
});

/**
 * Endpoint dla przetwarzania GTD Inbox głosowo
 */
router.get('/inbox', async (req: Request, res: Response) => {
  try {
    const result = await crmService.getInboxItems();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } else {
      res.status(500).json({
        error: 'Failed to get inbox items',
        message: result.error?.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    logger.error('Error getting inbox items:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get inbox items'
    });
  }
});

/**
 * Główna funkcja przetwarzania poleceń głosowych
 */
async function processVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
  switch (command.intent) {
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
    
    default:
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Nie rozumiem tego polecenia. Spróbuj powiedzieć "pomoc" aby zobaczyć dostępne opcje.']
            }
          }]
        }
      };
  }
}

export const voiceCommandRoutes = router;