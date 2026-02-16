/**
 * Google Apps Script Backend for CRM-GTD Smart
 * Middleware between Google Assistant and CRM Database
 * 
 * @version 2.1.0
 * @author CRM-GTD Smart Team
 */

// ====================================
// CONFIGURATION
// ====================================

const CONFIG = {
  // API Configuration
  API_KEY: PropertiesService.getScriptProperties().getProperty('API_KEY'),
  API_SECRET: PropertiesService.getScriptProperties().getProperty('API_SECRET'),
  
  // Database Configuration
  DB_TYPE: 'postgresql', // or 'mysql'
  DB_HOST: PropertiesService.getScriptProperties().getProperty('DB_HOST'),
  DB_PORT: PropertiesService.getScriptProperties().getProperty('DB_PORT'),
  DB_NAME: PropertiesService.getScriptProperties().getProperty('DB_NAME'),
  DB_USER: PropertiesService.getScriptProperties().getProperty('DB_USER'),
  DB_PASSWORD: PropertiesService.getScriptProperties().getProperty('DB_PASSWORD'),
  
  // External CRM API
  CRM_API_BASE_URL: PropertiesService.getScriptProperties().getProperty('CRM_API_BASE_URL'),
  CRM_API_KEY: PropertiesService.getScriptProperties().getProperty('CRM_API_KEY'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 60, // seconds
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Cache Configuration
  CACHE_TTL: 300, // 5 minutes
  
  // Logging
  LOG_LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
  LOG_SHEET_ID: PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID')
};

// ====================================
// MAIN WEB APP ENTRY POINT
// ====================================

/**
 * Handles GET requests
 */
function doGet(e) {
  try {
    // Log incoming request
    Logger.logRequest('GET', e);
    
    // Verify authentication
    const authResult = AuthService.verifyRequest(e);
    if (!authResult.isValid) {
      return createErrorResponse(401, 'Unauthorized', authResult.error);
    }
    
    // Route request
    const path = e.parameter.path || '';
    const response = Router.handleGet(path, e.parameter, authResult.user);
    
    return createJsonResponse(response);
    
  } catch (error) {
    Logger.logError('doGet error', error);
    return createErrorResponse(500, 'Internal Server Error', error.message);
  }
}

/**
 * Handles POST requests
 */
function doPost(e) {
  try {
    // Log incoming request
    Logger.logRequest('POST', e);
    
    // Parse request body
    const requestData = JSON.parse(e.postData.contents);
    
    // Verify authentication
    const authResult = AuthService.verifyRequest(e);
    if (!authResult.isValid) {
      return createErrorResponse(401, 'Unauthorized', authResult.error);
    }
    
    // Check rate limiting
    const rateLimitCheck = RateLimiter.checkLimit(authResult.user.id);
    if (!rateLimitCheck.allowed) {
      return createErrorResponse(429, 'Too Many Requests', rateLimitCheck.message);
    }
    
    // Route request
    const path = e.parameter.path || '';
    const response = Router.handlePost(path, requestData, authResult.user);
    
    return createJsonResponse(response);
    
  } catch (error) {
    Logger.logError('doPost error', error);
    return createErrorResponse(500, 'Internal Server Error', error.message);
  }
}

// ====================================
// ROUTER
// ====================================

const Router = {
  /**
   * Handle GET routes
   */
  handleGet: function(path, params, user) {
    switch (path) {
      case '/voice/tasks/today':
        return TaskController.getTodayTasks(params, user);
        
      case '/voice/client/status':
        return ClientController.getClientStatus(params, user);
        
      case '/voice/goals/progress':
        return GoalsController.getGoalsProgress(params, user);
        
      case '/voice/health':
        return { status: 'ok', timestamp: new Date().toISOString() };
        
      default:
        throw new Error('Route not found: ' + path);
    }
  },
  
  /**
   * Handle POST routes
   */
  handlePost: function(path, data, user) {
    // Validate input data
    const validationResult = Validator.validateRequest(path, data);
    if (!validationResult.isValid) {
      throw new Error('Validation failed: ' + validationResult.errors.join(', '));
    }
    
    switch (path) {
      case '/voice/task/create':
        return TaskController.createTask(data, user);
        
      case '/voice/client/note':
        return ClientController.addClientNote(data, user);
        
      case '/voice/lead/create':
        return LeadController.createLead(data, user);
        
      case '/voice/calendar/schedule':
        return CalendarController.scheduleAppointment(data, user);
        
      default:
        throw new Error('Route not found: ' + path);
    }
  }
};

// Konfiguracja
const CONFIG = {
  CRM_API_BASE_URL: 'https://crm.dev.sorto.ai/crm/api/v1',
  WEBHOOK_SECRET: PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET'),
  API_KEY: PropertiesService.getScriptProperties().getProperty('CRM_API_KEY'),
  LOG_SHEET_ID: PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID')
};

/**
 * Główny handler dla webhooków Google Assistant
 */
function doPost(e) {
  try {
    const requestBody = JSON.parse(e.postData.contents);
    
    // Weryfikacja autoryzacji
    if (!verifyWebhookAuth(e)) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    // Logowanie żądania
    logRequest(requestBody);
    
    // Routing żądań
    const intent = requestBody.intent?.name;
    const parameters = requestBody.intent?.params || {};
    
    switch (intent) {
      case 'crm_gtd.add_task':
        return handleAddTask(parameters);
      case 'crm_gtd.show_tasks':
        return handleShowTasks(parameters);
      case 'crm_gtd.create_project':
        return handleCreateProject(parameters);
      case 'crm_gtd.show_contacts':
        return handleShowContacts(parameters);
      case 'crm_gtd.process_inbox':
        return handleProcessInbox(parameters);
      default:
        return createErrorResponse('Unknown intent: ' + intent, 400);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    logError(error, e);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Handler dla dodawania zadań
 */
function handleAddTask(params) {
  try {
    const taskTitle = params.task_title?.resolved || params.task_title?.original;
    const taskPriority = params.task_priority?.resolved || 'MEDIUM';
    const taskContext = params.task_context?.resolved || '@computer';
    
    if (!taskTitle) {
      return createErrorResponse('Brak tytułu zadania', 400);
    }
    
    // Wywołanie API CRM-GTD
    const response = callCrmApi('/tasks', 'POST', {
      title: taskTitle,
      priority: taskPriority.toUpperCase(),
      context: taskContext,
      source: 'GOOGLE_ASSISTANT',
      status: 'PENDING'
    });
    
    if (response.success) {
      return createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [`Zadanie "${taskTitle}" zostało dodane z priorytetem ${taskPriority}.`]
            }
          }]
        }
      });
    } else {
      return createErrorResponse('Nie udało się dodać zadania', 500);
    }
    
  } catch (error) {
    console.error('Error in handleAddTask:', error);
    return createErrorResponse('Błąd podczas dodawania zadania', 500);
  }
}

/**
 * Handler dla wyświetlania zadań
 */
function handleShowTasks(params) {
  try {
    const taskFilter = params.task_filter?.resolved || 'today';
    const taskDate = params.task_date?.resolved;
    
    // Parametry zapytania
    let queryParams = '?source=GOOGLE_ASSISTANT';
    
    if (taskFilter === 'today' || taskFilter === 'dzisiaj') {
      queryParams += '&date=' + new Date().toISOString().split('T')[0];
    } else if (taskDate) {
      queryParams += '&date=' + taskDate;
    }
    
    // Wywołanie API CRM-GTD
    const response = callCrmApi('/tasks' + queryParams, 'GET');
    
    if (response.success && response.data) {
      const tasks = response.data;
      
      if (tasks.length === 0) {
        return createSuccessResponse({
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Nie masz żadnych zadań do wykonania.']
              }
            }]
          }
        });
      }
      
      // Formatowanie listy zadań
      const tasksList = tasks.slice(0, 5).map((task, index) => {
        return `${index + 1}. ${task.title} (${task.priority})`;
      }).join('\n');
      
      const responseText = `Masz ${tasks.length} zadań:\n${tasksList}`;
      
      return createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [responseText]
            }
          }]
        }
      });
      
    } else {
      return createErrorResponse('Nie udało się pobrać zadań', 500);
    }
    
  } catch (error) {
    console.error('Error in handleShowTasks:', error);
    return createErrorResponse('Błąd podczas pobierania zadań', 500);
  }
}

/**
 * Handler dla tworzenia projektów
 */
function handleCreateProject(params) {
  try {
    const projectName = params.project_name?.resolved || params.project_name?.original;
    const projectDescription = params.project_description?.resolved || '';
    
    if (!projectName) {
      return createErrorResponse('Brak nazwy projektu', 400);
    }
    
    // Wywołanie API CRM-GTD
    const response = callCrmApi('/projects', 'POST', {
      name: projectName,
      description: projectDescription,
      status: 'PLANNING',
      source: 'GOOGLE_ASSISTANT'
    });
    
    if (response.success) {
      return createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [`Projekt "${projectName}" został utworzony.`]
            }
          }]
        }
      });
    } else {
      return createErrorResponse('Nie udało się utworzyć projektu', 500);
    }
    
  } catch (error) {
    console.error('Error in handleCreateProject:', error);
    return createErrorResponse('Błąd podczas tworzenia projektu', 500);
  }
}

/**
 * Handler dla wyświetlania kontaktów
 */
function handleShowContacts(params) {
  try {
    const contactFilter = params.contact_filter?.resolved || '';
    
    // Parametry zapytania
    let queryParams = '?source=GOOGLE_ASSISTANT';
    if (contactFilter) {
      queryParams += '&search=' + encodeURIComponent(contactFilter);
    }
    
    // Wywołanie API CRM-GTD
    const response = callCrmApi('/contacts' + queryParams, 'GET');
    
    if (response.success && response.data) {
      const contacts = response.data;
      
      if (contacts.length === 0) {
        return createSuccessResponse({
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Nie znaleziono kontaktów.']
              }
            }]
          }
        });
      }
      
      // Formatowanie listy kontaktów
      const contactsList = contacts.slice(0, 5).map((contact, index) => {
        return `${index + 1}. ${contact.name} (${contact.email})`;
      }).join('\n');
      
      const responseText = `Znaleziono ${contacts.length} kontaktów:\n${contactsList}`;
      
      return createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [responseText]
            }
          }]
        }
      });
      
    } else {
      return createErrorResponse('Nie udało się pobrać kontaktów', 500);
    }
    
  } catch (error) {
    console.error('Error in handleShowContacts:', error);
    return createErrorResponse('Błąd podczas pobierania kontaktów', 500);
  }
}

/**
 * Handler dla przetwarzania inbox
 */
function handleProcessInbox(params) {
  try {
    // Wywołanie API CRM-GTD
    const response = callCrmApi('/gtd-inbox?source=GOOGLE_ASSISTANT', 'GET');
    
    if (response.success && response.data) {
      const inboxItems = response.data;
      
      if (inboxItems.length === 0) {
        return createSuccessResponse({
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Twoja skrzynka GTD jest pusta. Świetna robota!']
              }
            }]
          }
        });
      }
      
      // Formatowanie elementów do przetworzenia
      const itemsList = inboxItems.slice(0, 3).map((item, index) => {
        return `${index + 1}. ${item.title} (${item.sourceType})`;
      }).join('\n');
      
      const responseText = `Masz ${inboxItems.length} elementów do przetworzenia:\n${itemsList}`;
      
      return createSuccessResponse({
        fulfillmentResponse: {
          messages: [{
            text: {
              text: [responseText]
            }
          }]
        }
      });
      
    } else {
      return createErrorResponse('Nie udało się pobrać elementów z inbox', 500);
    }
    
  } catch (error) {
    console.error('Error in handleProcessInbox:', error);
    return createErrorResponse('Błąd podczas pobierania inbox', 500);
  }
}

/**
 * Wywołanie API CRM-GTD
 */
function callCrmApi(endpoint, method, payload) {
  try {
    const url = CONFIG.CRM_API_BASE_URL + endpoint;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`,
        'X-Source': 'GOOGLE_APPS_SCRIPT'
      }
    };
    
    if (payload) {
      options.payload = JSON.stringify(payload);
    }
    
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    return {
      success: response.getResponseCode() === 200,
      data: responseData,
      status: response.getResponseCode()
    };
    
  } catch (error) {
    console.error('Error calling CRM API:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Weryfikacja autoryzacji webhook
 */
function verifyWebhookAuth(e) {
  const authHeader = e.parameter.authorization || e.postData.headers?.Authorization;
  const expectedAuth = `Bearer ${CONFIG.WEBHOOK_SECRET}`;
  
  return authHeader === expectedAuth;
}

/**
 * Tworzenie odpowiedzi sukcesu
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tworzenie odpowiedzi błędu
 */
function createErrorResponse(message, status) {
  const errorResponse = {
    fulfillmentResponse: {
      messages: [{
        text: {
          text: [message]
        }
      }]
    },
    error: {
      message: message,
      status: status
    }
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(errorResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Logowanie żądań
 */
function logRequest(requestBody) {
  try {
    if (!CONFIG.LOG_SHEET_ID) return;
    
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getActiveSheet();
    const timestamp = new Date();
    const intent = requestBody.intent?.name || 'unknown';
    const parameters = JSON.stringify(requestBody.intent?.params || {});
    
    sheet.appendRow([timestamp, intent, parameters, 'REQUEST']);
    
  } catch (error) {
    console.error('Error logging request:', error);
  }
}

/**
 * Logowanie błędów
 */
function logError(error, requestData) {
  try {
    if (!CONFIG.LOG_SHEET_ID) return;
    
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getActiveSheet();
    const timestamp = new Date();
    const errorMessage = error.toString();
    const requestDetails = JSON.stringify(requestData);
    
    sheet.appendRow([timestamp, 'ERROR', errorMessage, requestDetails]);
    
  } catch (logError) {
    console.error('Error logging error:', logError);
  }
}

/**
 * Funkcja testowa
 */
function testFunction() {
  const testRequest = {
    intent: {
      name: 'crm_gtd.add_task',
      params: {
        task_title: {
          resolved: 'Test zadanie z Google Assistant'
        },
        task_priority: {
          resolved: 'HIGH'
        }
      }
    }
  };
  
  const result = handleAddTask(testRequest.intent.params);
  console.log('Test result:', result);
}