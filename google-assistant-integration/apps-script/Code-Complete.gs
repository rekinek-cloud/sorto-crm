/**
 * Google Apps Script Backend for CRM-GTD Smart
 * Comprehensive middleware between Google Assistant and CRM Database
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
  CRM_API_BASE_URL: PropertiesService.getScriptProperties().getProperty('CRM_API_BASE_URL') || 'https://crm.dev.sorto.ai/crm/api/v1',
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

// ====================================
// CONTROLLERS
// ====================================

/**
 * Task Controller - Handles task-related operations
 */
const TaskController = {
  /**
   * Create new task from voice command
   */
  createTask: function(data, user) {
    try {
      // Extract and validate task data
      const taskData = {
        title: data.title || data.description,
        description: data.details || '',
        priority: data.priority || 'MEDIUM',
        context: data.context || '@computer',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: user.id,
        sourceType: 'VOICE_COMMAND',
        voiceMetadata: {
          originalPhrase: data.originalPhrase,
          intent: data.intent,
          confidence: data.confidence
        }
      };
      
      // Create task in database
      const result = DatabaseService.createTask(taskData);
      
      // Log to Google Sheets for analytics
      if (CONFIG.LOG_SHEET_ID) {
        SheetsLogger.logTaskCreated(taskData, result);
      }
      
      // Format response for voice
      return ResponseFormatter.formatTaskCreatedResponse(result);
      
    } catch (error) {
      Logger.logError('TaskController.createTask', error);
      throw error;
    }
  },
  
  /**
   * Get today's tasks for voice response
   */
  getTodayTasks: function(params, user) {
    try {
      // Check cache first
      const cacheKey = `tasks_today_${user.id}`;
      const cached = CacheService.getScriptCache().get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get tasks from database
      let tasks = DatabaseService.getTodayTasks(user.id);
      
      // Apply filters if provided
      if (params.priority) {
        tasks = tasks.filter(t => t.priority === params.priority);
      }
      if (params.context) {
        tasks = tasks.filter(t => t.context === params.context);
      }
      
      // Format for voice response
      const response = ResponseFormatter.formatTaskListResponse(tasks);
      
      // Cache the result
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(response), CONFIG.CACHE_TTL);
      
      return response;
      
    } catch (error) {
      Logger.logError('TaskController.getTodayTasks', error);
      throw error;
    }
  }
};

/**
 * Client Controller - Handles client-related operations
 */
const ClientController = {
  /**
   * Add note to client from voice
   */
  addClientNote: function(data, user) {
    try {
      // Find client by name using fuzzy matching
      const client = DatabaseService.findClientByName(data.clientName);
      if (!client) {
        throw new Error(`Client not found: ${data.clientName}`);
      }
      
      // Create note data
      const noteData = {
        clientId: client.id,
        content: data.noteContent,
        type: data.noteType || 'GENERAL',
        createdBy: user.id,
        createdAt: new Date(),
        sourceType: 'VOICE_COMMAND',
        voiceMetadata: {
          originalPhrase: data.originalPhrase,
          recognizedEntities: data.entities
        }
      };
      
      // Save note
      const result = DatabaseService.createClientNote(noteData);
      
      // Send email notification if configured
      if (client.notifyOnNotes) {
        GmailService.sendNoteNotification(client, noteData);
      }
      
      // Format response
      return ResponseFormatter.formatNoteAddedResponse(client, result);
      
    } catch (error) {
      Logger.logError('ClientController.addClientNote', error);
      throw error;
    }
  },
  
  /**
   * Get client status for voice
   */
  getClientStatus: function(params, user) {
    try {
      if (!params.clientName) {
        throw new Error('Client name is required');
      }
      
      // Find client
      const client = DatabaseService.findClientByName(params.clientName);
      if (!client) {
        throw new Error(`Client not found: ${params.clientName}`);
      }
      
      // Get comprehensive client data
      const clientData = {
        client: client,
        recentInteractions: DatabaseService.getRecentInteractions(client.id, 5),
        activeDeals: DatabaseService.getActiveDeals(client.id),
        upcomingMeetings: CalendarService.getUpcomingMeetings(client.email),
        lastNote: DatabaseService.getLastClientNote(client.id)
      };
      
      // Format for voice response
      return ResponseFormatter.formatClientStatusResponse(clientData);
      
    } catch (error) {
      Logger.logError('ClientController.getClientStatus', error);
      throw error;
    }
  }
};

/**
 * Lead Controller - Handles lead-related operations
 */
const LeadController = {
  /**
   * Create new lead from voice
   */
  createLead: function(data, user) {
    try {
      // Check for duplicate
      const existingLead = DatabaseService.findLeadByCompany(data.companyName);
      if (existingLead) {
        throw new Error(`Lead already exists for: ${data.companyName}`);
      }
      
      // Create lead data
      const leadData = {
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || 'VOICE_COMMAND',
        status: 'NEW',
        estimatedValue: data.estimatedValue || null,
        createdBy: user.id,
        createdAt: new Date(),
        voiceMetadata: {
          originalPhrase: data.originalPhrase
        }
      };
      
      // Save lead
      const result = DatabaseService.createLead(leadData);
      
      // Create initial task for follow-up
      if (data.createFollowupTask) {
        TaskController.createTask({
          title: `Follow up with ${data.companyName}`,
          description: `Initial contact for new lead`,
          priority: 'HIGH',
          context: '@calls',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        }, user);
      }
      
      // Log to Sheets
      if (CONFIG.LOG_SHEET_ID) {
        SheetsLogger.logLeadCreated(leadData, result);
      }
      
      // Format response
      return ResponseFormatter.formatLeadCreatedResponse(result);
      
    } catch (error) {
      Logger.logError('LeadController.createLead', error);
      throw error;
    }
  }
};

/**
 * Goals Controller - Handles goals-related operations
 */
const GoalsController = {
  /**
   * Get goals progress for voice
   */
  getGoalsProgress: function(params, user) {
    try {
      // Get goals based on filter
      let goals;
      if (params.goalName) {
        // Get specific goal
        const goal = DatabaseService.findGoalByName(params.goalName, user.id);
        if (!goal) {
          throw new Error(`Goal not found: ${params.goalName}`);
        }
        goals = [goal];
      } else {
        // Get all active goals
        goals = DatabaseService.getActiveGoals(user.id);
        
        // Apply quarter filter if provided
        if (params.quarter) {
          goals = goals.filter(g => g.quarter === params.quarter);
        }
      }
      
      // Calculate progress metrics
      const progressData = goals.map(goal => ({
        ...goal,
        progressPercentage: calculateProgress(goal),
        remainingDays: calculateRemainingDays(goal.deadline),
        status: determineGoalStatus(goal)
      }));
      
      // Format for voice response
      return ResponseFormatter.formatGoalsProgressResponse(progressData);
      
    } catch (error) {
      Logger.logError('GoalsController.getGoalsProgress', error);
      throw error;
    }
  }
};

/**
 * Calendar Controller - Handles calendar operations
 */
const CalendarController = {
  /**
   * Schedule appointment from voice
   */
  scheduleAppointment: function(data, user) {
    try {
      // Parse date and time
      const eventDate = new Date(data.date);
      const startTime = parseTime(data.startTime, eventDate);
      const endTime = data.endTime ? 
        parseTime(data.endTime, eventDate) : 
        new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
      
      // Find client if provided
      let client = null;
      if (data.clientName) {
        client = DatabaseService.findClientByName(data.clientName);
        if (!client) {
          throw new Error(`Client not found: ${data.clientName}`);
        }
      }
      
      // Create calendar event
      const event = {
        summary: data.title || `Meeting${client ? ' with ' + client.name : ''}`,
        description: data.description || '',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Session.getScriptTimeZone()
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Session.getScriptTimeZone()
        },
        attendees: client && client.email ? [{ email: client.email }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 } // 30 minutes before
          ]
        }
      };
      
      // Add to Google Calendar
      const calendarEvent = CalendarService.createEvent(event);
      
      // Create related task
      TaskController.createTask({
        title: `Prepare for: ${event.summary}`,
        description: `Calendar event: ${calendarEvent.htmlLink}`,
        priority: 'HIGH',
        context: '@office',
        dueDate: new Date(startTime.getTime() - 24 * 60 * 60 * 1000) // 1 day before
      }, user);
      
      // Save to database
      const appointmentData = {
        eventId: calendarEvent.id,
        title: event.summary,
        clientId: client ? client.id : null,
        startTime: startTime,
        endTime: endTime,
        createdBy: user.id,
        sourceType: 'VOICE_COMMAND'
      };
      DatabaseService.createAppointment(appointmentData);
      
      // Format response
      return ResponseFormatter.formatAppointmentScheduledResponse(calendarEvent, client);
      
    } catch (error) {
      Logger.logError('CalendarController.scheduleAppointment', error);
      throw error;
    }
  }
};

// ====================================
// SERVICES
// ====================================

/**
 * Database Service - Handles all database operations
 */
const DatabaseService = {
  /**
   * Execute query on external database
   */
  executeQuery: function(query, params = []) {
    try {
      if (CONFIG.DB_TYPE === 'postgresql') {
        return this.executePostgreSQLQuery(query, params);
      } else if (CONFIG.DB_TYPE === 'mysql') {
        return this.executeMySQLQuery(query, params);
      } else {
        // Fallback to CRM API
        return this.executeCRMAPIQuery(query, params);
      }
    } catch (error) {
      Logger.logError('DatabaseService.executeQuery', error);
      throw error;
    }
  },
  
  /**
   * PostgreSQL query execution
   */
  executePostgreSQLQuery: function(query, params) {
    const url = `jdbc:postgresql://${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}`;
    const conn = Jdbc.getConnection(url, CONFIG.DB_USER, CONFIG.DB_PASSWORD);
    
    try {
      const stmt = conn.prepareStatement(query);
      
      // Set parameters
      params.forEach((param, index) => {
        if (param === null) {
          stmt.setNull(index + 1, 0);
        } else if (typeof param === 'string') {
          stmt.setString(index + 1, param);
        } else if (typeof param === 'number') {
          stmt.setDouble(index + 1, param);
        } else if (param instanceof Date) {
          stmt.setTimestamp(index + 1, Jdbc.newTimestamp(param.getTime()));
        } else {
          stmt.setObject(index + 1, param);
        }
      });
      
      // Execute query
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        const rs = stmt.executeQuery();
        return this.resultSetToArray(rs);
      } else {
        const result = stmt.executeUpdate();
        return { affectedRows: result };
      }
      
    } finally {
      conn.close();
    }
  },
  
  /**
   * MySQL query execution
   */
  executeMySQLQuery: function(query, params) {
    const url = `jdbc:mysql://${CONFIG.DB_HOST}:${CONFIG.DB_PORT}/${CONFIG.DB_NAME}`;
    const conn = Jdbc.getConnection(url, CONFIG.DB_USER, CONFIG.DB_PASSWORD);
    
    try {
      const stmt = conn.prepareStatement(query);
      
      // Set parameters (similar to PostgreSQL)
      params.forEach((param, index) => {
        if (param === null) {
          stmt.setNull(index + 1, 0);
        } else if (typeof param === 'string') {
          stmt.setString(index + 1, param);
        } else if (typeof param === 'number') {
          stmt.setDouble(index + 1, param);
        } else if (param instanceof Date) {
          stmt.setTimestamp(index + 1, Jdbc.newTimestamp(param.getTime()));
        } else {
          stmt.setObject(index + 1, param);
        }
      });
      
      // Execute query
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        const rs = stmt.executeQuery();
        return this.resultSetToArray(rs);
      } else {
        const result = stmt.executeUpdate();
        return { affectedRows: result };
      }
      
    } finally {
      conn.close();
    }
  },
  
  /**
   * CRM API query execution (fallback)
   */
  executeCRMAPIQuery: function(endpoint, data) {
    const url = `${CONFIG.CRM_API_BASE_URL}${endpoint}`;
    const options = {
      method: data ? 'post' : 'get',
      headers: {
        'Authorization': `Bearer ${CONFIG.CRM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    if (data) {
      options.payload = JSON.stringify(data);
    }
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`CRM API Error: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  },
  
  /**
   * Convert ResultSet to array
   */
  resultSetToArray: function(rs) {
    const results = [];
    const metaData = rs.getMetaData();
    const columnCount = metaData.getColumnCount();
    
    while (rs.next()) {
      const row = {};
      for (let i = 1; i <= columnCount; i++) {
        const columnName = metaData.getColumnName(i);
        row[columnName] = rs.getObject(i);
      }
      results.push(row);
    }
    
    return results;
  },
  
  // Task operations
  createTask: function(taskData) {
    const query = `
      INSERT INTO tasks (title, description, priority, context, due_date, user_id, 
                        source_type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const params = [
      taskData.title,
      taskData.description,
      taskData.priority,
      taskData.context,
      taskData.dueDate,
      taskData.userId,
      taskData.sourceType,
      JSON.stringify(taskData.voiceMetadata),
      new Date()
    ];
    
    const result = this.executeQuery(query, params);
    return result[0];
  },
  
  getTodayTasks: function(userId) {
    const query = `
      SELECT id, title, description, priority, context, due_date, status
      FROM tasks
      WHERE user_id = ? 
        AND DATE(due_date) = DATE(?)
        AND status != 'COMPLETED'
      ORDER BY priority DESC, created_at ASC
    `;
    
    return this.executeQuery(query, [userId, new Date()]);
  },
  
  // Client operations
  findClientByName: function(name) {
    const query = `
      SELECT id, name, email, phone, company, notify_on_notes
      FROM contacts
      WHERE LOWER(name) LIKE LOWER(?)
      ORDER BY 
        CASE 
          WHEN LOWER(name) = LOWER(?) THEN 0
          WHEN LOWER(name) LIKE LOWER(?) THEN 1
          ELSE 2
        END,
        created_at DESC
      LIMIT 1
    `;
    
    const searchPattern = `%${name}%`;
    const result = this.executeQuery(query, [searchPattern, name, `${name}%`]);
    return result.length > 0 ? result[0] : null;
  },
  
  createClientNote: function(noteData) {
    const query = `
      INSERT INTO client_notes (client_id, content, type, created_by, 
                               source_type, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const params = [
      noteData.clientId,
      noteData.content,
      noteData.type,
      noteData.createdBy,
      noteData.sourceType,
      JSON.stringify(noteData.voiceMetadata),
      noteData.createdAt
    ];
    
    const result = this.executeQuery(query, params);
    return result[0];
  },
  
  getRecentInteractions: function(clientId, limit) {
    const query = `
      SELECT type, content, created_at
      FROM client_notes
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    return this.executeQuery(query, [clientId, limit]);
  },
  
  getActiveDeals: function(clientId) {
    const query = `
      SELECT id, title, value, stage, expected_close_date
      FROM deals
      WHERE client_id = ? AND status = 'ACTIVE'
      ORDER BY expected_close_date ASC
    `;
    
    return this.executeQuery(query, [clientId]);
  },
  
  getLastClientNote: function(clientId) {
    const query = `
      SELECT content, created_at
      FROM client_notes
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = this.executeQuery(query, [clientId]);
    return result.length > 0 ? result[0] : null;
  },
  
  // Lead operations
  findLeadByCompany: function(companyName) {
    const query = `
      SELECT id, company_name, contact_person, status
      FROM leads
      WHERE LOWER(company_name) LIKE LOWER(?)
      LIMIT 1
    `;
    
    const result = this.executeQuery(query, [`%${companyName}%`]);
    return result.length > 0 ? result[0] : null;
  },
  
  createLead: function(leadData) {
    const query = `
      INSERT INTO leads (company_name, contact_person, email, phone, source, 
                        status, estimated_value, created_by, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const params = [
      leadData.companyName,
      leadData.contactPerson,
      leadData.email,
      leadData.phone,
      leadData.source,
      leadData.status,
      leadData.estimatedValue,
      leadData.createdBy,
      JSON.stringify(leadData.voiceMetadata),
      leadData.createdAt
    ];
    
    const result = this.executeQuery(query, params);
    return result[0];
  },
  
  // Goal operations
  findGoalByName: function(goalName, userId) {
    const query = `
      SELECT id, name, description, current_progress, target_value, 
             deadline, status, quarter
      FROM smart_goals
      WHERE user_id = ? AND LOWER(name) LIKE LOWER(?)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = this.executeQuery(query, [userId, `%${goalName}%`]);
    return result.length > 0 ? result[0] : null;
  },
  
  getActiveGoals: function(userId) {
    const query = `
      SELECT id, name, description, current_progress, target_value, 
             deadline, status, quarter
      FROM smart_goals
      WHERE user_id = ? AND status = 'ACTIVE'
      ORDER BY deadline ASC
    `;
    
    return this.executeQuery(query, [userId]);
  },
  
  // Appointment operations
  createAppointment: function(appointmentData) {
    const query = `
      INSERT INTO appointments (event_id, title, client_id, start_time, 
                               end_time, created_by, source_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const params = [
      appointmentData.eventId,
      appointmentData.title,
      appointmentData.clientId,
      appointmentData.startTime,
      appointmentData.endTime,
      appointmentData.createdBy,
      appointmentData.sourceType,
      new Date()
    ];
    
    const result = this.executeQuery(query, params);
    return result[0];
  }
};

/**
 * Google Calendar Service
 */
const CalendarService = {
  createEvent: function(eventData) {
    const calendar = CalendarApp.getDefaultCalendar();
    
    const event = calendar.createEvent(
      eventData.summary,
      new Date(eventData.start.dateTime),
      new Date(eventData.end.dateTime),
      {
        description: eventData.description,
        guests: eventData.attendees.map(a => a.email).join(',')
      }
    );
    
    // Set reminders
    if (eventData.reminders && eventData.reminders.overrides) {
      event.removeAllReminders();
      eventData.reminders.overrides.forEach(reminder => {
        if (reminder.method === 'popup') {
          event.addPopupReminder(reminder.minutes);
        } else if (reminder.method === 'email') {
          event.addEmailReminder(reminder.minutes);
        }
      });
    }
    
    return {
      id: event.getId(),
      htmlLink: event.getUrl(),
      summary: event.getTitle(),
      start: event.getStartTime(),
      end: event.getEndTime()
    };
  },
  
  getUpcomingMeetings: function(email) {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const calendar = CalendarApp.getDefaultCalendar();
    const events = calendar.getEvents(now, twoWeeksFromNow);
    
    return events
      .filter(event => {
        const guests = event.getGuestList();
        return guests.some(guest => guest.getEmail() === email);
      })
      .map(event => ({
        id: event.getId(),
        title: event.getTitle(),
        startTime: event.getStartTime(),
        endTime: event.getEndTime(),
        location: event.getLocation()
      }))
      .slice(0, 5); // Return max 5 upcoming meetings
  }
};

/**
 * Gmail Service
 */
const GmailService = {
  sendNoteNotification: function(client, note) {
    const subject = `New note added for ${client.name}`;
    const body = `
      A new note has been added to client ${client.name}:
      
      Type: ${note.type}
      Content: ${note.content}
      
      Added by: Voice Command
      Date: ${new Date(note.createdAt).toLocaleString()}
      
      ---
      This is an automated notification from CRM-GTD Smart Voice Assistant
    `;
    
    try {
      GmailApp.sendEmail(client.email, subject, body, {
        name: 'CRM-GTD Smart',
        noReply: true
      });
    } catch (error) {
      Logger.logError('GmailService.sendNoteNotification', error);
      // Don't throw - email failure shouldn't break the main flow
    }
  }
};

/**
 * Google Sheets Logger
 */
const SheetsLogger = {
  logTaskCreated: function(taskData, result) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Tasks') ||
                   SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).insertSheet('Tasks');
      
      // Add headers if first row
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Task ID', 'Title', 'Priority', 'Context', 
                        'Due Date', 'User ID', 'Source', 'Original Phrase']);
      }
      
      // Log task
      sheet.appendRow([
        new Date(),
        result.id,
        taskData.title,
        taskData.priority,
        taskData.context,
        taskData.dueDate,
        taskData.userId,
        taskData.sourceType,
        taskData.voiceMetadata.originalPhrase
      ]);
      
    } catch (error) {
      Logger.logError('SheetsLogger.logTaskCreated', error);
    }
  },
  
  logLeadCreated: function(leadData, result) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Leads') ||
                   SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).insertSheet('Leads');
      
      // Add headers if first row
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Lead ID', 'Company', 'Contact', 
                        'Source', 'Est. Value', 'User ID', 'Original Phrase']);
      }
      
      // Log lead
      sheet.appendRow([
        new Date(),
        result.id,
        leadData.companyName,
        leadData.contactPerson,
        leadData.source,
        leadData.estimatedValue,
        leadData.createdBy,
        leadData.voiceMetadata.originalPhrase
      ]);
      
    } catch (error) {
      Logger.logError('SheetsLogger.logLeadCreated', error);
    }
  }
};

// ====================================
// RESPONSE FORMATTER
// ====================================

const ResponseFormatter = {
  /**
   * Format task created response
   */
  formatTaskCreatedResponse: function(task) {
    const priorityText = this.getPriorityText(task.priority);
    const contextText = this.getContextText(task.context);
    
    return {
      success: true,
      data: task,
      voice: {
        speech: `Zadanie "${task.title}" zostało dodane z priorytetem ${priorityText} w kontekście ${contextText}.`,
        displayText: `✅ Zadanie dodane: ${task.title}`
      },
      visual: {
        card: {
          title: 'Nowe zadanie utworzone',
          subtitle: `${priorityText} • ${contextText}`,
          text: task.title,
          buttons: [
            {
              text: 'Zobacz szczegóły',
              url: `${CONFIG.CRM_API_BASE_URL}/tasks/${task.id}`
            }
          ]
        }
      }
    };
  },
  
  /**
   * Format task list response
   */
  formatTaskListResponse: function(tasks) {
    if (tasks.length === 0) {
      return {
        success: true,
        data: [],
        voice: {
          speech: 'Nie masz żadnych zadań na dziś. Świetna robota!',
          displayText: '✨ Brak zadań na dziś'
        }
      };
    }
    
    const taskDescriptions = tasks.slice(0, 5).map((task, index) => {
      const priority = this.getPriorityText(task.priority);
      return `${index + 1}. ${task.title} - ${priority}`;
    }).join('. ');
    
    const moreText = tasks.length > 5 ? ` I ${tasks.length - 5} więcej.` : '';
    
    return {
      success: true,
      data: tasks,
      voice: {
        speech: `Masz ${tasks.length} zadań na dziś. ${taskDescriptions}${moreText}`,
        displayText: `📋 ${tasks.length} zadań na dziś`
      },
      visual: {
        list: {
          title: 'Zadania na dziś',
          items: tasks.map(task => ({
            title: task.title,
            description: `${this.getPriorityText(task.priority)} • ${this.getContextText(task.context)}`,
            optionInfo: {
              key: task.id.toString()
            }
          }))
        }
      }
    };
  },
  
  /**
   * Format note added response
   */
  formatNoteAddedResponse: function(client, note) {
    return {
      success: true,
      data: note,
      voice: {
        speech: `Notatka dla klienta ${client.name} została dodana pomyślnie.`,
        displayText: `📝 Notatka dodana dla ${client.name}`
      },
      visual: {
        card: {
          title: `Notatka dla ${client.name}`,
          subtitle: note.type,
          text: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')
        }
      }
    };
  },
  
  /**
   * Format client status response
   */
  formatClientStatusResponse: function(data) {
    const { client, activeDeals, upcomingMeetings, lastNote } = data;
    
    let speechText = `Klient ${client.name}`;
    
    if (activeDeals.length > 0) {
      const totalValue = activeDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      speechText += ` ma ${activeDeals.length} aktywnych dealów o wartości ${totalValue} złotych.`;
    } else {
      speechText += ' nie ma aktywnych dealów.';
    }
    
    if (upcomingMeetings.length > 0) {
      const nextMeeting = upcomingMeetings[0];
      const meetingDate = new Date(nextMeeting.startTime).toLocaleDateString('pl-PL');
      speechText += ` Następne spotkanie: ${meetingDate}.`;
    }
    
    if (lastNote) {
      speechText += ` Ostatnia notatka: ${lastNote.content.substring(0, 100)}.`;
    }
    
    return {
      success: true,
      data: data,
      voice: {
        speech: speechText,
        displayText: `👤 ${client.name} - Status`
      },
      visual: {
        card: {
          title: client.name,
          subtitle: client.company || 'Brak firmy',
          text: `📧 ${client.email}\n📱 ${client.phone || 'Brak telefonu'}`,
          sections: [
            {
              header: 'Aktywne deale',
              widgets: activeDeals.map(deal => ({
                text: `${deal.title} - ${deal.value} PLN`
              }))
            },
            {
              header: 'Nadchodzące spotkania',
              widgets: upcomingMeetings.map(meeting => ({
                text: `${meeting.title} - ${new Date(meeting.startTime).toLocaleString('pl-PL')}`
              }))
            }
          ]
        }
      }
    };
  },
  
  /**
   * Format lead created response
   */
  formatLeadCreatedResponse: function(lead) {
    return {
      success: true,
      data: lead,
      voice: {
        speech: `Nowy lead dla firmy ${lead.companyName} został utworzony pomyślnie.`,
        displayText: `🎯 Lead utworzony: ${lead.companyName}`
      },
      visual: {
        card: {
          title: lead.companyName,
          subtitle: 'Nowy lead',
          text: `Status: ${lead.status}\nKontakt: ${lead.contactPerson || 'Brak'}`
        }
      }
    };
  },
  
  /**
   * Format goals progress response
   */
  formatGoalsProgressResponse: function(goals) {
    if (goals.length === 0) {
      return {
        success: true,
        data: [],
        voice: {
          speech: 'Nie masz aktywnych celów.',
          displayText: '🎯 Brak aktywnych celów'
        }
      };
    }
    
    if (goals.length === 1) {
      const goal = goals[0];
      const encouragement = this.getProgressEncouragement(goal.progressPercentage);
      
      return {
        success: true,
        data: goal,
        voice: {
          speech: `Cel "${goal.name}" ma progress ${goal.progressPercentage}%. ${encouragement}`,
          displayText: `🎯 ${goal.name}: ${goal.progressPercentage}%`
        },
        visual: {
          card: {
            title: goal.name,
            subtitle: `Progress: ${goal.progressPercentage}%`,
            text: goal.description || 'Brak opisu',
            progress: {
              value: goal.progressPercentage,
              max: 100,
              label: `${goal.current_progress} / ${goal.target_value}`
            }
          }
        }
      };
    }
    
    // Multiple goals
    const avgProgress = Math.round(
      goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length
    );
    
    const goalsText = goals.slice(0, 3).map((goal, index) => 
      `${index + 1}. ${goal.name} - ${goal.progressPercentage}%`
    ).join('. ');
    
    return {
      success: true,
      data: goals,
      voice: {
        speech: `Masz ${goals.length} aktywnych celów ze średnim progressem ${avgProgress}%. ${goalsText}`,
        displayText: `🎯 ${goals.length} celów (śr. ${avgProgress}%)`
      },
      visual: {
        list: {
          title: 'Aktywne cele',
          items: goals.map(goal => ({
            title: goal.name,
            description: `Progress: ${goal.progressPercentage}% • Deadline: ${new Date(goal.deadline).toLocaleDateString('pl-PL')}`,
            optionInfo: {
              key: goal.id.toString()
            }
          }))
        }
      }
    };
  },
  
  /**
   * Format appointment scheduled response
   */
  formatAppointmentScheduledResponse: function(event, client) {
    const dateText = new Date(event.start).toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const clientText = client ? ` z ${client.name}` : '';
    
    return {
      success: true,
      data: event,
      voice: {
        speech: `Spotkanie${clientText} zostało zaplanowane na ${dateText}.`,
        displayText: `📅 Spotkanie zaplanowane`
      },
      visual: {
        card: {
          title: event.summary,
          subtitle: dateText,
          text: client ? `Uczestnik: ${client.name} (${client.email})` : 'Brak uczestników',
          buttons: [
            {
              text: 'Zobacz w kalendarzu',
              url: event.htmlLink
            }
          ]
        }
      }
    };
  },
  
  // Helper methods
  getPriorityText: function(priority) {
    const priorities = {
      HIGH: 'wysokim',
      MEDIUM: 'średnim',
      LOW: 'niskim'
    };
    return priorities[priority] || 'średnim';
  },
  
  getContextText: function(context) {
    const contexts = {
      '@computer': 'komputer',
      '@calls': 'telefony',
      '@office': 'biuro',
      '@home': 'dom',
      '@errands': 'sprawy',
      '@online': 'online',
      '@waiting': 'oczekiwanie',
      '@reading': 'czytanie'
    };
    return contexts[context] || context;
  },
  
  getProgressEncouragement: function(progress) {
    if (progress >= 100) return 'Gratulacje! Cel osiągnięty! 🎉';
    if (progress >= 75) return 'Świetnie! Jesteś bardzo blisko!';
    if (progress >= 50) return 'Dobra robota! W połowie drogi!';
    if (progress >= 25) return 'Dobrze Ci idzie! Tak trzymaj!';
    return 'Każdy krok to progress! Dalej!';
  }
};

// ====================================
// AUTHENTICATION SERVICE
// ====================================

const AuthService = {
  /**
   * Verify request authentication
   */
  verifyRequest: function(e) {
    try {
      // Check API key in headers
      const apiKey = e.parameter.apiKey || e.headers['X-API-Key'];
      
      if (!apiKey) {
        return { isValid: false, error: 'API key missing' };
      }
      
      if (apiKey !== CONFIG.API_KEY) {
        return { isValid: false, error: 'Invalid API key' };
      }
      
      // Verify JWT token if provided
      const authHeader = e.headers && e.headers['Authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = this.verifyJWT(token);
        
        if (!decoded) {
          return { isValid: false, error: 'Invalid token' };
        }
        
        return { 
          isValid: true, 
          user: decoded.user 
        };
      }
      
      // Default user for API key auth
      return { 
        isValid: true, 
        user: { 
          id: 'voice-assistant',
          name: 'Google Assistant',
          role: 'voice_user'
        }
      };
      
    } catch (error) {
      Logger.logError('AuthService.verifyRequest', error);
      return { isValid: false, error: error.message };
    }
  },
  
  /**
   * Verify JWT token
   */
  verifyJWT: function(token) {
    try {
      // Simple JWT verification (for production use proper library)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(
        Utilities.newBlob(
          Utilities.base64DecodeWebSafe(parts[1])
        ).getDataAsString()
      );
      
      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }
      
      return payload;
      
    } catch (error) {
      Logger.logError('AuthService.verifyJWT', error);
      return null;
    }
  }
};

// ====================================
// RATE LIMITER
// ====================================

const RateLimiter = {
  /**
   * Check rate limit for user
   */
  checkLimit: function(userId) {
    const cache = CacheService.getScriptCache();
    const key = `rate_limit_${userId}`;
    const now = Date.now();
    
    // Get current count
    const data = cache.get(key);
    let count = 0;
    let windowStart = now;
    
    if (data) {
      const parsed = JSON.parse(data);
      count = parsed.count;
      windowStart = parsed.windowStart;
      
      // Reset if window expired
      if (now - windowStart > CONFIG.RATE_LIMIT_WINDOW * 1000) {
        count = 0;
        windowStart = now;
      }
    }
    
    // Check limit
    if (count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      const remainingTime = Math.ceil(
        (CONFIG.RATE_LIMIT_WINDOW * 1000 - (now - windowStart)) / 1000
      );
      
      return {
        allowed: false,
        message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`
      };
    }
    
    // Increment count
    count++;
    cache.put(key, JSON.stringify({ count, windowStart }), CONFIG.RATE_LIMIT_WINDOW);
    
    return {
      allowed: true,
      remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - count
    };
  }
};

// ====================================
// VALIDATOR
// ====================================

const Validator = {
  /**
   * Validate request data based on route
   */
  validateRequest: function(path, data) {
    const validators = {
      '/voice/task/create': this.validateTaskCreate,
      '/voice/client/note': this.validateClientNote,
      '/voice/lead/create': this.validateLeadCreate,
      '/voice/calendar/schedule': this.validateCalendarSchedule
    };
    
    const validator = validators[path];
    if (!validator) {
      return { isValid: true }; // No validation defined
    }
    
    return validator.call(this, data);
  },
  
  validateTaskCreate: function(data) {
    const errors = [];
    
    if (!data.title && !data.description) {
      errors.push('Task title or description is required');
    }
    
    if (data.priority && !['HIGH', 'MEDIUM', 'LOW'].includes(data.priority)) {
      errors.push('Invalid priority value');
    }
    
    if (data.dueDate && !this.isValidDate(data.dueDate)) {
      errors.push('Invalid due date format');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  validateClientNote: function(data) {
    const errors = [];
    
    if (!data.clientName) {
      errors.push('Client name is required');
    }
    
    if (!data.noteContent) {
      errors.push('Note content is required');
    }
    
    if (data.noteType && !['MEETING', 'CALL', 'EMAIL', 'FOLLOW_UP', 'GENERAL'].includes(data.noteType)) {
      errors.push('Invalid note type');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  validateLeadCreate: function(data) {
    const errors = [];
    
    if (!data.companyName) {
      errors.push('Company name is required');
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Invalid phone format');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  validateCalendarSchedule: function(data) {
    const errors = [];
    
    if (!data.date) {
      errors.push('Date is required');
    }
    
    if (!data.startTime) {
      errors.push('Start time is required');
    }
    
    if (!data.title && !data.clientName) {
      errors.push('Title or client name is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  // Helper validation methods
  isValidDate: function(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
  
  isValidEmail: function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidPhone: function(phone) {
    // Basic phone validation - adjust for your needs
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 9;
  }
};

// ====================================
// LOGGER
// ====================================

const Logger = {
  /**
   * Log request
   */
  logRequest: function(method, e) {
    if (CONFIG.LOG_LEVEL === 'DEBUG') {
      console.log(`${method} Request:`, {
        parameters: e.parameter,
        headers: e.headers,
        user: e.user,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Log error
   */
  logError: function(context, error) {
    console.error(`Error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Log to sheet if configured
    if (CONFIG.LOG_SHEET_ID) {
      try {
        const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Errors') ||
                     SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).insertSheet('Errors');
        
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(['Timestamp', 'Context', 'Error Message', 'Stack Trace']);
        }
        
        sheet.appendRow([
          new Date(),
          context,
          error.message,
          error.stack || 'No stack trace'
        ]);
        
      } catch (logError) {
        console.error('Failed to log to sheet:', logError);
      }
    }
  },
  
  /**
   * Log info
   */
  logInfo: function(message, data) {
    if (['DEBUG', 'INFO'].includes(CONFIG.LOG_LEVEL)) {
      console.log(message, data || '');
    }
  }
};

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Create JSON response
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create error response
 */
function createErrorResponse(code, message, details) {
  const response = {
    success: false,
    error: {
      code: code,
      message: message,
      details: details
    },
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Parse time string to Date
 */
function parseTime(timeString, baseDate) {
  // Handle various time formats: "14:30", "2:30 PM", "14:30:00"
  const base = baseDate || new Date();
  const timeParts = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  
  if (!timeParts) {
    throw new Error('Invalid time format: ' + timeString);
  }
  
  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const seconds = parseInt(timeParts[3] || '0');
  const meridiem = timeParts[4];
  
  if (meridiem) {
    if (meridiem.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
  }
  
  const result = new Date(base);
  result.setHours(hours, minutes, seconds, 0);
  return result;
}

/**
 * Calculate progress percentage
 */
function calculateProgress(goal) {
  if (!goal.target_value || goal.target_value === 0) {
    return 0;
  }
  
  const progress = (goal.current_progress / goal.target_value) * 100;
  return Math.min(Math.round(progress), 100);
}

/**
 * Calculate remaining days
 */
function calculateRemainingDays(deadline) {
  if (!deadline) return null;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Determine goal status
 */
function determineGoalStatus(goal) {
  const progress = calculateProgress(goal);
  const remainingDays = calculateRemainingDays(goal.deadline);
  
  if (progress >= 100) {
    return 'COMPLETED';
  }
  
  if (remainingDays !== null && remainingDays < 0) {
    return 'OVERDUE';
  }
  
  if (remainingDays !== null && remainingDays <= 7 && progress < 50) {
    return 'AT_RISK';
  }
  
  return 'ON_TRACK';
}

// ====================================
// INITIALIZATION
// ====================================

/**
 * Run on script installation
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Run on script open
 */
function onOpen(e) {
  // Set up triggers if needed
  setupTriggers();
  
  // Initialize database connection
  testDatabaseConnection();
}

/**
 * Set up time-based triggers
 */
function setupTriggers() {
  // Clear existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Set up daily cleanup trigger
  ScriptApp.newTrigger('dailyCleanup')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}

/**
 * Daily cleanup function
 */
function dailyCleanup() {
  // Clean up old logs
  if (CONFIG.LOG_SHEET_ID) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
      const errorSheet = sheet.getSheetByName('Errors');
      
      if (errorSheet && errorSheet.getLastRow() > 1000) {
        // Keep only last 1000 entries
        errorSheet.deleteRows(2, errorSheet.getLastRow() - 1001);
      }
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

/**
 * Test database connection
 */
function testDatabaseConnection() {
  try {
    const result = DatabaseService.executeQuery('SELECT 1 as test');
    Logger.logInfo('Database connection successful', result);
    return true;
  } catch (error) {
    Logger.logError('Database connection failed', error);
    return false;
  }
}

/**
 * Manual test function
 */
function testVoiceEndpoint() {
  const testRequest = {
    parameter: {
      path: '/voice/tasks/today',
      apiKey: CONFIG.API_KEY
    },
    headers: {
      'X-API-Key': CONFIG.API_KEY
    }
  };
  
  const response = doGet(testRequest);
  console.log('Test response:', response.getContent());
}