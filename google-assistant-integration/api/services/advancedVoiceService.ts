import { VoiceResponse, VoiceCommand } from '../types';
import { CRMIntegrationService } from './crmIntegrationService';
import { NLPProcessor } from './nlpProcessor';
import { createLogger } from './logger';
import { DatabaseService } from './databaseService';

export class AdvancedVoiceService {
  private crmService: CRMIntegrationService;
  private nlpProcessor: NLPProcessor;
  private logger: ReturnType<typeof createLogger>;
  private db: DatabaseService;

  constructor() {
    this.crmService = new CRMIntegrationService();
    this.nlpProcessor = new NLPProcessor();
    this.logger = createLogger();
    this.db = new DatabaseService();
  }

  /**
   * SMART Goals Operations
   */

  async handleGoalProgress(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const goalName = command.parameters.goal_name || '';
      
      if (!goalName) {
        return this.createErrorResponse('Podaj nazwę celu aby sprawdzić progress.');
      }
      
      const goal = await this.findGoalByName(goalName);
      
      if (!goal) {
        return this.createErrorResponse(`Nie znalazłem celu "${goalName}".`);
      }
      
      return this.createGoalProgressResponse(goal);
      
    } catch (error) {
      this.logger.error('Error in handleGoalProgress:', error);
      return this.createErrorResponse('Błąd podczas pobierania progressu celu.');
    }
  }

  async handleUpdateGoalProgress(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const goalName = command.parameters.goal_name || '';
      const progressPercentage = parseInt(command.parameters.progress_percentage) || 0;
      
      if (!goalName || progressPercentage < 0 || progressPercentage > 100) {
        return this.createErrorResponse('Podaj poprawną nazwę celu i procent (0-100).');
      }
      
      const goal = await this.findGoalByName(goalName);
      
      if (!goal) {
        return this.createErrorResponse(`Nie znalazłem celu "${goalName}".`);
      }
      
      const updateResult = await this.updateGoalProgress(goal.id, progressPercentage);
      
      if (updateResult.success) {
        return this.createGoalUpdatedResponse(goal, progressPercentage);
      } else {
        return this.createErrorResponse('Nie udało się zaktualizować progressu celu.');
      }
      
    } catch (error) {
      this.logger.error('Error in handleUpdateGoalProgress:', error);
      return this.createErrorResponse('Błąd podczas aktualizacji celu.');
    }
  }

  async handleQuarterlyGoals(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const quarterFilter = command.parameters.quarter_filter || '';
      const currentQuarter = this.getCurrentQuarter();
      
      const goals = await this.getQuarterlyGoals(quarterFilter || currentQuarter);
      
      if (goals.length === 0) {
        return this.createSuccessResponse({
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Nie masz celów na ${quarterFilter || 'bieżący kwartał'}.`]
              }
            }]
          }
        });
      }
      
      return this.createQuarterlyGoalsResponse(goals, quarterFilter || currentQuarter);
      
    } catch (error) {
      this.logger.error('Error in handleQuarterlyGoals:', error);
      return this.createErrorResponse('Błąd podczas pobierania celów kwartalnych.');
    }
  }

  /**
   * Enhanced Response Creators
   */

  async createTaskAddedResponse(taskData: any, createdTask: any): Promise<VoiceResponse> {
    const priorityText = this.getPriorityText(taskData.priority);
    const contextText = this.getContextText(taskData.context);
    
    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Zadanie "${taskData.title}" zostało dodane z priorytetem ${priorityText} w kontekście ${contextText}.`]
            }
          },
          {
            card: {
              title: 'Nowe zadanie',
              subtitle: `${priorityText} • ${contextText}`,
              text: taskData.title,
              image: {
                url: 'https://your-domain.com/images/task-icon.png',
                accessibilityText: 'Ikona zadania'
              }
            }
          }
        ]
      }
    };
  }

  async createTasksListResponse(tasks: any[], title: string): Promise<VoiceResponse> {
    if (tasks.length === 0) {
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Nie masz żadnych zadań. Świetna robota!']
            }
          }]
        }
      };
    }

    const tasksList = tasks.slice(0, 5).map((task, index) => {
      const priority = this.getPriorityText(task.priority);
      const context = this.getContextText(task.context);
      return `${index + 1}. ${task.title} (${priority}, ${context})`;
    }).join('\n');

    const moreTasksText = tasks.length > 5 ? `\n\nI ${tasks.length - 5} kolejnych zadań.` : '';

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`${title}\n\n${tasksList}${moreTasksText}`]
            }
          },
          {
            carouselCard: {
              items: tasks.slice(0, 3).map(task => ({
                title: task.title,
                description: `${this.getPriorityText(task.priority)} • ${this.getContextText(task.context)}`
              }))
            }
          }
        ]
      }
    };
  }

  async createTaskCompletedResponse(task: any): Promise<VoiceResponse> {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Świetnie! Zadanie "${task.title}" zostało oznaczone jako ukończone. 🎉`]
          }
        }]
      }
    };
  }

  async createTaskMovedResponse(task: any, newDate: Date): Promise<VoiceResponse> {
    const dateText = newDate.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Zadanie "${task.title}" zostało przeniesione na ${dateText}.`]
          }
        }]
      }
    };
  }

  async createNextTaskResponse(task: any): Promise<VoiceResponse> {
    const context = this.getContextText(task.context);
    const priority = this.getPriorityText(task.priority);

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Twoje następne priorytetowe zadanie to: "${task.title}" - ${priority}, ${context}.`]
            }
          },
          {
            card: {
              title: 'Następne zadanie',
              subtitle: `${priority} • ${context}`,
              text: task.title
            }
          }
        ]
      }
    };
  }

  async createNoteAddedResponse(client: any, noteContent: string): Promise<VoiceResponse> {
    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Notatka dla klienta ${client.name} została dodana: "${noteContent}"`]
          }
        }]
      }
    };
  }

  async createLeadStatusResponse(lead: any): Promise<VoiceResponse> {
    const statusText = this.getLeadStatusText(lead.status);
    const valueText = lead.estimatedValue ? 
      ` o wartości ${lead.estimatedValue} złotych` : '';

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Lead ${lead.companyName} ma status: ${statusText}${valueText}. Ostatnia aktywność: ${this.formatLastActivity(lead.lastActivity)}.`]
            }
          },
          {
            card: {
              title: lead.companyName,
              subtitle: statusText,
              text: `Kontakt: ${lead.contactPerson || 'Nie podano'}\nWartość: ${lead.estimatedValue || 'Nie określono'}`
            }
          }
        ]
      }
    };
  }

  async createFollowupScheduledResponse(client: any, date: Date, type: string): Promise<VoiceResponse> {
    const dateText = date.toLocaleDateString('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeText = this.getFollowupTypeText(type);

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`${typeText} z klientem ${client.name} został zaplanowany na ${dateText}.`]
          }
        }]
      }
    };
  }

  async createClosingDealsResponse(deals: any[]): Promise<VoiceResponse> {
    if (deals.length === 0) {
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Nie masz dealów zamykanych w tym tygodniu.']
            }
          }]
        }
      };
    }

    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const dealsList = deals.slice(0, 3).map((deal, index) => {
      return `${index + 1}. ${deal.clientName} - ${deal.value || 'Nie określono'} zł (${this.formatDate(deal.expectedCloseDate)})`;
    }).join('\n');

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Masz ${deals.length} dealów zamykanych w tym tygodniu o łącznej wartości ${totalValue} złotych:\n\n${dealsList}`]
            }
          }
        ]
      }
    };
  }

  async createLeadCreatedResponse(leadData: any, createdLead: any): Promise<VoiceResponse> {
    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Nowy lead dla firmy "${leadData.companyName}" został utworzony. Status: Nowy.`]
            }
          },
          {
            card: {
              title: 'Nowy lead',
              subtitle: 'Status: Nowy',
              text: leadData.companyName
            }
          }
        ]
      }
    };
  }

  async createInboxProcessingResponse(inboxItems: any[], actionType?: string): Promise<VoiceResponse> {
    const itemsList = inboxItems.slice(0, 3).map((item, index) => {
      const sourceType = this.translateSourceType(item.sourceType);
      return `${index + 1}. ${item.title} (${sourceType})`;
    }).join('\n');

    const processingHint = actionType ? 
      this.getProcessingHint(actionType) : 
      'Użyj aplikacji do przetworzenia według metodologii GTD.';

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Masz ${inboxItems.length} elementów do przetworzenia:\n\n${itemsList}\n\n${processingHint}`]
            }
          }
        ]
      }
    };
  }

  async createSomedayMaybeResponse(items: any[]): Promise<VoiceResponse> {
    if (items.length === 0) {
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Twoja lista "może kiedyś" jest pusta.']
            }
          }]
        }
      };
    }

    const itemsList = items.slice(0, 5).map((item, index) => {
      return `${index + 1}. ${item.title}`;
    }).join('\n');

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Na twojej liście "może kiedyś" masz ${items.length} elementów:\n\n${itemsList}`]
            }
          }
        ]
      }
    };
  }

  async createGoalProgressResponse(goal: any): Promise<VoiceResponse> {
    const progressText = `${goal.currentProgress || 0}%`;
    const statusText = this.getGoalStatusText(goal.status);
    const deadlineText = goal.deadline ? 
      ` Deadline: ${this.formatDate(goal.deadline)}.` : '';

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Cel "${goal.name}" ma progress ${progressText}. Status: ${statusText}.${deadlineText}`]
            }
          },
          {
            card: {
              title: goal.name,
              subtitle: `Progress: ${progressText} • ${statusText}`,
              text: goal.description || 'Brak opisu'
            }
          }
        ]
      }
    };
  }

  async createGoalUpdatedResponse(goal: any, newProgress: number): Promise<VoiceResponse> {
    const encouragement = this.getProgressEncouragement(newProgress);

    return {
      fulfillmentResponse: {
        messages: [{
          text: {
            text: [`Progress celu "${goal.name}" został zaktualizowany na ${newProgress}%. ${encouragement}`]
          }
        }]
      }
    };
  }

  async createQuarterlyGoalsResponse(goals: any[], quarter: string): Promise<VoiceResponse> {
    const goalsList = goals.slice(0, 5).map((goal, index) => {
      const progress = goal.currentProgress || 0;
      return `${index + 1}. ${goal.name} (${progress}%)`;
    }).join('\n');

    const avgProgress = goals.reduce((sum, goal) => sum + (goal.currentProgress || 0), 0) / goals.length;

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [`Cele na ${quarter} (średni progress ${Math.round(avgProgress)}%):\n\n${goalsList}`]
            }
          }
        ]
      }
    };
  }

  /**
   * Utility Methods
   */

  async getNextPriorityTask(userId?: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT id, title, priority, context, due_date, estimated_time
        FROM tasks 
        WHERE status = 'PENDING' 
        ${userId ? 'AND user_id = $1' : ''}
        ORDER BY 
          CASE priority 
            WHEN 'HIGH' THEN 1 
            WHEN 'MEDIUM' THEN 2 
            WHEN 'LOW' THEN 3 
          END,
          due_date ASC NULLS LAST,
          created_at ASC
        LIMIT 1
      `, userId ? [userId] : []);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } catch (error) {
      this.logger.error('Error getting next priority task:', error);
      return null;
    }
  }

  private async findGoalByName(goalName: string): Promise<any | null> {
    try {
      const result = await this.db.query(`
        SELECT id, name, description, current_progress, target_value, deadline, status
        FROM smart_goals 
        WHERE name ILIKE $1
        ORDER BY created_at DESC 
        LIMIT 1
      `, [`%${goalName}%`]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
      
    } catch (error) {
      this.logger.error('Error finding goal by name:', error);
      return null;
    }
  }

  private async updateGoalProgress(goalId: string, progress: number): Promise<any> {
    try {
      const result = await this.db.query(`
        UPDATE smart_goals 
        SET current_progress = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [goalId, progress]);
      
      return { success: result.rows.length > 0, data: result.rows[0] };
      
    } catch (error) {
      this.logger.error('Error updating goal progress:', error);
      return { success: false, error: error.message };
    }
  }

  private getCurrentQuarter(): string {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const quarter = Math.ceil(month / 3);
    
    return `Q${quarter} ${year}`;
  }

  private async getQuarterlyGoals(quarter: string): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT id, name, description, current_progress, target_value, deadline, status
        FROM smart_goals 
        WHERE quarter = $1 OR deadline BETWEEN $2 AND $3
        ORDER BY current_progress DESC
      `, [quarter, this.getQuarterStart(quarter), this.getQuarterEnd(quarter)]);
      
      return result.rows;
      
    } catch (error) {
      this.logger.error('Error getting quarterly goals:', error);
      return [];
    }
  }

  private getQuarterStart(quarter: string): Date {
    // Implementation depends on quarter format
    const year = new Date().getFullYear();
    const quarterNum = parseInt(quarter.charAt(1));
    return new Date(year, (quarterNum - 1) * 3, 1);
  }

  private getQuarterEnd(quarter: string): Date {
    // Implementation depends on quarter format
    const year = new Date().getFullYear();
    const quarterNum = parseInt(quarter.charAt(1));
    return new Date(year, quarterNum * 3, 0);
  }

  private getPriorityText(priority: string): string {
    const priorities = {
      HIGH: 'wysokim',
      MEDIUM: 'średnim',
      LOW: 'niskim'
    };
    return priorities[priority] || 'średnim';
  }

  private getContextText(context: string): string {
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
  }

  private getLeadStatusText(status: string): string {
    const statuses = {
      NEW: 'Nowy',
      CONTACTED: 'Skontaktowany',
      QUALIFIED: 'Kwalifikowany',
      PROPOSAL: 'Propozycja',
      NEGOTIATION: 'Negocjacje',
      CLOSED_WON: 'Wygrany',
      CLOSED_LOST: 'Przegrany'
    };
    return statuses[status] || status;
  }

  private getFollowupTypeText(type: string): string {
    const types = {
      CALL: 'Telefon',
      MEETING: 'Spotkanie',
      EMAIL: 'Email',
      DEMO: 'Demonstracja',
      PROPOSAL: 'Prezentacja oferty'
    };
    return types[type] || 'Follow-up';
  }

  private getGoalStatusText(status: string): string {
    const statuses = {
      ACTIVE: 'Aktywny',
      COMPLETED: 'Ukończony',
      PAUSED: 'Wstrzymany',
      CANCELLED: 'Anulowany'
    };
    return statuses[status] || status;
  }

  private getProgressEncouragement(progress: number): string {
    if (progress >= 100) return 'Gratulacje! Cel osiągnięty! 🎉';
    if (progress >= 75) return 'Świetnie! Jesteś bardzo blisko! 💪';
    if (progress >= 50) return 'Dobra robota! W połowie drogi! 👍';
    if (progress >= 25) return 'Dobrze Ci idzie! Tak trzymaj! 😊';
    return 'Każdy krok to progress! Dalej! 🚀';
  }

  private translateSourceType(sourceType: string): string {
    const translations = {
      QUICK_CAPTURE: 'szybka notatka',
      MEETING_NOTES: 'notatki ze spotkania',
      PHONE_CALL: 'rozmowa telefoniczna',
      EMAIL: 'email',
      IDEA: 'pomysł',
      DOCUMENT: 'dokument',
      OTHER: 'inne'
    };
    return translations[sourceType] || sourceType;
  }

  private getProcessingHint(actionType: string): string {
    const hints = {
      DO: 'Wykonaj natychmiast (2-minutowa reguła)',
      DEFER: 'Zaplanuj na konkretną datę',
      DELEGATE: 'Przypisz odpowiedniej osobie',
      DELETE: 'Usuń bez śladu'
    };
    return hints[actionType] || 'Zdecyduj: zrób, zaplanuj, deleguj lub usuń.';
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long'
    });
  }

  private formatLastActivity(activityDate: string): string {
    const date = new Date(activityDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'dzisiaj';
    if (diffDays === 1) return 'wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString('pl-PL');
  }

  async createSuccessResponse(data: any): Promise<VoiceResponse> {
    return data;
  }

  async createErrorResponse(message: string): Promise<VoiceResponse> {
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
}

export default AdvancedVoiceService;