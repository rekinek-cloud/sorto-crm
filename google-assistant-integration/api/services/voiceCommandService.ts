import { VoiceCommand, VoiceResponse, TaskCreationRequest, ProjectCreationRequest, TaskFilter, ContactFilter } from '../types';
import { CRMIntegrationService } from './crmIntegrationService';
import { createLogger } from './logger';

export class VoiceCommandService {
  private crmService: CRMIntegrationService;
  private logger: ReturnType<typeof createLogger>;

  constructor() {
    this.crmService = new CRMIntegrationService();
    this.logger = createLogger();
  }

  /**
   * Obsługa dodawania zadań przez głos
   */
  async handleAddTask(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const { parameters } = command;
      
      const taskTitle = parameters.task_title || parameters.title;
      const taskPriority = parameters.task_priority || parameters.priority || 'MEDIUM';
      const taskContext = parameters.task_context || parameters.context || '@computer';
      const taskDescription = parameters.description || '';
      
      if (!taskTitle) {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Potrzebuję nazwy zadania. Powiedz na przykład "Dodaj zadanie przygotowanie prezentacji".']
              }
            }]
          }
        };
      }
      
      const taskData: TaskCreationRequest = {
        title: taskTitle,
        priority: this.normalizePriority(taskPriority),
        context: taskContext,
        description: taskDescription
      };
      
      const result = await this.crmService.createTask(taskData);
      
      if (result.success) {
        const priority = taskData.priority === 'HIGH' ? 'wysokim' : 
                        taskData.priority === 'LOW' ? 'niskim' : 'średnim';
        
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Zadanie "${taskTitle}" zostało dodane z priorytetem ${priority}.`]
              }
            }, {
              card: {
                title: 'Nowe zadanie utworzone',
                subtitle: `Priorytet: ${priority}`,
                text: taskTitle
              }
            }]
          }
        };
      } else {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Przepraszam, nie udało się dodać zadania. Spróbuj ponownie później.']
              }
            }]
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in handleAddTask:', error);
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Wystąpił błąd podczas dodawania zadania. Spróbuj ponownie.']
            }
          }]
        }
      };
    }
  }

  /**
   * Obsługa wyświetlania zadań przez głos
   */
  async handleShowTasks(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const { parameters } = command;
      
      const filter: TaskFilter = {
        limit: 5 // Ograniczenie dla głosu
      };
      
      // Analiza filtrów
      if (parameters.task_filter) {
        const filterValue = parameters.task_filter.toLowerCase();
        if (filterValue.includes('dzisiaj') || filterValue.includes('today')) {
          filter.date = new Date().toISOString().split('T')[0];
        } else if (filterValue.includes('pilne') || filterValue.includes('wysokie')) {
          filter.priority = 'HIGH';
        }
      }
      
      if (parameters.task_date) {
        filter.date = parameters.task_date;
      }
      
      if (parameters.priority) {
        filter.priority = this.normalizePriority(parameters.priority);
      }
      
      const result = await this.crmService.getTasks(filter);
      
      if (result.success && result.data) {
        const tasks = result.data;
        
        if (tasks.length === 0) {
          return {
            fulfillmentResponse: {
              messages: [{
                text: {
                  text: ['Nie masz żadnych zadań do wykonania. Świetna robota!']
                }
              }]
            }
          };
        }
        
        // Formatowanie listy zadań dla głosu
        const tasksList = tasks.slice(0, 3).map((task: any, index: number) => {
          const priority = task.priority === 'HIGH' ? 'wysokim' : 
                          task.priority === 'LOW' ? 'niskim' : 'średnim';
          return `${index + 1}. ${task.title} - priorytet ${priority}`;
        }).join('\n');
        
        const totalText = tasks.length > 3 ? 
          ` Pokazuję pierwsze 3 z ${tasks.length} zadań.` : '';
        
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Masz ${tasks.length} zadań:${totalText}\n\n${tasksList}`]
              }
            }, {
              carouselCard: {
                items: tasks.slice(0, 3).map((task: any) => ({
                  title: task.title,
                  description: `Priorytet: ${task.priority} | Kontekst: ${task.context || '@computer'}`
                }))
              }
            }]
          }
        };
        
      } else {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Nie udało się pobrać zadań. Spróbuj ponownie później.']
              }
            }]
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in handleShowTasks:', error);
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Wystąpił błąd podczas pobierania zadań. Spróbuj ponownie.']
            }
          }]
        }
      };
    }
  }

  /**
   * Obsługa tworzenia projektów przez głos
   */
  async handleCreateProject(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const { parameters } = command;
      
      const projectName = parameters.project_name || parameters.name;
      const projectDescription = parameters.project_description || parameters.description || '';
      
      if (!projectName) {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Potrzebuję nazwy projektu. Powiedz na przykład "Utwórz projekt modernizacja strony".']
              }
            }]
          }
        };
      }
      
      const projectData: ProjectCreationRequest = {
        name: projectName,
        description: projectDescription,
        status: 'PLANNING',
        priority: 'MEDIUM'
      };
      
      const result = await this.crmService.createProject(projectData);
      
      if (result.success) {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Projekt "${projectName}" został utworzony i jest w fazie planowania.`]
              }
            }, {
              card: {
                title: 'Nowy projekt utworzony',
                subtitle: 'Status: Planowanie',
                text: projectName
              }
            }]
          }
        };
      } else {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Przepraszam, nie udało się utworzyć projektu. Spróbuj ponownie później.']
              }
            }]
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in handleCreateProject:', error);
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Wystąpił błąd podczas tworzenia projektu. Spróbuj ponownie.']
            }
          }]
        }
      };
    }
  }

  /**
   * Obsługa wyświetlania kontaktów przez głos
   */
  async handleShowContacts(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const { parameters } = command;
      
      const filter: ContactFilter = {
        limit: 5 // Ograniczenie dla głosu
      };
      
      if (parameters.contact_filter || parameters.search) {
        filter.search = parameters.contact_filter || parameters.search;
      }
      
      if (parameters.company) {
        filter.company = parameters.company;
      }
      
      const result = await this.crmService.getContacts(filter);
      
      if (result.success && result.data) {
        const contacts = result.data;
        
        if (contacts.length === 0) {
          return {
            fulfillmentResponse: {
              messages: [{
                text: {
                  text: ['Nie znaleziono kontaktów pasujących do kryteriów.']
                }
              }]
            }
          };
        }
        
        // Formatowanie listy kontaktów dla głosu
        const contactsList = contacts.slice(0, 3).map((contact: any, index: number) => {
          return `${index + 1}. ${contact.name} - ${contact.email}`;
        }).join('\n');
        
        const totalText = contacts.length > 3 ? 
          ` Pokazuję pierwsze 3 z ${contacts.length} kontaktów.` : '';
        
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Znaleziono ${contacts.length} kontaktów:${totalText}\n\n${contactsList}`]
              }
            }, {
              carouselCard: {
                items: contacts.slice(0, 3).map((contact: any) => ({
                  title: contact.name,
                  description: `Email: ${contact.email}${contact.company ? ` | Firma: ${contact.company}` : ''}`
                }))
              }
            }]
          }
        };
        
      } else {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Nie udało się pobrać kontaktów. Spróbuj ponownie później.']
              }
            }]
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in handleShowContacts:', error);
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Wystąpił błąd podczas pobierania kontaktów. Spróbuj ponownie.']
            }
          }]
        }
      };
    }
  }

  /**
   * Obsługa przetwarzania GTD Inbox przez głos
   */
  async handleProcessInbox(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const result = await this.crmService.getInboxItems();
      
      if (result.success && result.data) {
        const inboxItems = result.data;
        
        if (inboxItems.length === 0) {
          return {
            fulfillmentResponse: {
              messages: [{
                text: {
                  text: ['Twoja skrzynka GTD jest pusta. Wspaniała robota z przetwarzaniem!']
                }
              }]
            }
          };
        }
        
        // Formatowanie elementów inbox dla głosu
        const itemsList = inboxItems.slice(0, 3).map((item: any, index: number) => {
          const sourceType = this.translateSourceType(item.sourceType);
          return `${index + 1}. ${item.title} (${sourceType})`;
        }).join('\n');
        
        const totalText = inboxItems.length > 3 ? 
          ` Pokazuję pierwsze 3 z ${inboxItems.length} elementów.` : '';
        
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: [`Masz ${inboxItems.length} elementów do przetworzenia:${totalText}\n\n${itemsList}\n\nPrzejdź do aplikacji aby je przetworzyć zgodnie z metodologią GTD.`]
              }
            }]
          }
        };
        
      } else {
        return {
          fulfillmentResponse: {
            messages: [{
              text: {
                text: ['Nie udało się pobrać elementów z skrzynki. Spróbuj ponownie później.']
              }
            }]
          }
        };
      }
      
    } catch (error) {
      this.logger.error('Error in handleProcessInbox:', error);
      return {
        fulfillmentResponse: {
          messages: [{
            text: {
              text: ['Wystąpił błąd podczas pobierania skrzynki. Spróbuj ponownie.']
            }
          }]
        }
      };
    }
  }

  /**
   * Normalizacja priorytetu zadania
   */
  private normalizePriority(priority: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const normalizedPriority = priority.toLowerCase();
    
    if (normalizedPriority.includes('wysoki') || normalizedPriority.includes('pilne') || normalizedPriority === 'high') {
      return 'HIGH';
    } else if (normalizedPriority.includes('niski') || normalizedPriority === 'low') {
      return 'LOW';
    } else {
      return 'MEDIUM';
    }
  }

  /**
   * Tłumaczenie typu źródła na polski
   */
  private translateSourceType(sourceType: string): string {
    const translations: Record<string, string> = {
      'QUICK_CAPTURE': 'Szybka notatka',
      'MEETING_NOTES': 'Notatki ze spotkania',
      'PHONE_CALL': 'Rozmowa telefoniczna',
      'EMAIL': 'Email',
      'IDEA': 'Pomysł',
      'DOCUMENT': 'Dokument',
      'OTHER': 'Inne'
    };
    
    return translations[sourceType] || sourceType;
  }
}