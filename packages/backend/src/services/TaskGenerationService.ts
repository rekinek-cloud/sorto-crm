import { RecurringTask, Task, Priority } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';

export class TaskGenerationService {
  /**
   * Generuje zadania z zadań cyklicznych, które mają termin wykonania w przeszłości lub dziś
   */
  static async generateDueTasks(): Promise<{ generated: number; errors: string[] }> {
    const errors: string[] = [];
    let generated = 0;

    try {
      const now = new Date();
      logger.info(`🔄 TaskGeneration: Sprawdzanie zadań cyklicznych na ${now.toISOString()}`);

      // Znajdź zadania cykliczne, które powinny być wykonane
      const dueRecurringTasks = await prisma.recurringTask.findMany({
        where: {
          isActive: true,
          nextOccurrence: {
            lte: now
          }
        },
        include: {
          users: true,
          companies: true,
          contacts: true,
          projects: true,
          streams: true,
          deals: true
        }
      });

      logger.info(`📋 Znaleziono ${dueRecurringTasks.length} zadań cyklicznych do wykonania`);

      for (const recurringTask of dueRecurringTasks) {
        try {
          // Note: maxExecutions and workdaysOnly fields don't exist in current schema
          // They would need to be added to RecurringTask model if needed
          
          // Check basic conditions for task generation
          const nextOcc = recurringTask.nextOccurrence;
          if (!nextOcc) {
            logger.warn(`⚠️ Zadanie ${recurringTask.title} nie ma nextOccurrence - pomijam`);
            continue;
          }

          // Utwórz zadanie
          const task = await this.createTaskFromRecurring(recurringTask);
          generated++;

          // Zaktualizuj zadanie cykliczne
          const nextOccurrence = this.calculateNextOccurrence(recurringTask);
          await prisma.recurringTask.update({
            where: { id: recurringTask.id },
            data: {
              lastExecuted: now,
              executionCount: recurringTask.executionCount + 1,
              nextOccurrence
            }
          });

          logger.info(`✅ Utworzono zadanie: ${task.title} (ID: ${task.id})`);

        } catch (error) {
          const errorMsg = `Błąd generowania zadania z ${recurringTask.title}: ${error}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      logger.info(`🎯 TaskGeneration zakończone: ${generated} zadań utworzonych, ${errors.length} błędów`);
      return { generated, errors };

    } catch (error) {
      logger.error('Błąd w generateDueTasks:', error);
      throw error;
    }
  }

  /**
   * Tworzy Task na podstawie RecurringTask
   */
  private static async createTaskFromRecurring(recurringTask: RecurringTask & {
    assignedTo?: any;
    company?: any;
    contact?: any;
    project?: any;
    stream?: any;
    deal?: any;
  }): Promise<Task> {
    const dueDate = recurringTask.nextOccurrence || new Date();
    
    // Dodaj czas wykonania do daty
    if (recurringTask.time) {
      const [hours, minutes] = recurringTask.time.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const taskData = {
      title: `${recurringTask.title} (${dueDate.toLocaleDateString('pl-PL')})`,
      description: recurringTask.description 
        ? `${recurringTask.description}\n\n📅 Zadanie cykliczne - wykonanie nr ${recurringTask.executionCount + 1}`
        : `📅 Zadanie cykliczne - wykonanie nr ${recurringTask.executionCount + 1}`,
      priority: recurringTask.priority as Priority,
      dueDate,
      estimatedHours: recurringTask.estimatedMinutes ? recurringTask.estimatedMinutes / 60 : undefined,
      contextId: recurringTask.context ? await this.findContextByName(recurringTask.context, recurringTask.organizationId) : undefined,
      assignedToId: recurringTask.assignedToId,
      companyId: recurringTask.companyId,
      projectId: recurringTask.projectId,
      streamId: recurringTask.streamId,
      organizationId: recurringTask.organizationId,
      createdById: recurringTask.assignedToId || await this.getSystemUserId(recurringTask.organizationId) // fallback to system user
    };

    return await prisma.task.create({
      data: taskData
    });
  }

  /**
   * Znajduje ID kontekstu na podstawie nazwy
   */
  private static async findContextByName(contextName: string, organizationId: string): Promise<string | undefined> {
    const context = await prisma.context.findFirst({
      where: {
        name: contextName,
        organizationId,
        isActive: true
      }
    });
    return context?.id;
  }

  /**
   * Znajduje ID pierwszego dostępnego użytkownika w organizacji (fallback dla createdById)
   */
  private static async getSystemUserId(organizationId: string): Promise<string> {
    const user = await prisma.user.findFirst({
      where: {
        organizationId,
        isActive: true
      },
      select: { id: true }
    });
    
    if (!user) {
      throw new Error(`Nie znaleziono aktywnego użytkownika w organizacji ${organizationId}`);
    }
    
    return user.id;
  }

  /**
   * Oblicza następne wystąpienie zadania cyklicznego
   */
  private static calculateNextOccurrence(recurringTask: RecurringTask): Date | null {
    if (!recurringTask.nextOccurrence) return null;

    const current = new Date(recurringTask.nextOccurrence);
    const next = new Date(current);

    switch (recurringTask.frequency) {
      case 'DAILY':
        next.setDate(current.getDate() + recurringTask.interval);
        break;

      case 'WEEKLY':
        next.setDate(current.getDate() + (7 * recurringTask.interval));
        break;

      case 'BIWEEKLY':
        next.setDate(current.getDate() + 14);
        break;

      case 'MONTHLY':
        next.setMonth(current.getMonth() + recurringTask.interval);
        break;

      case 'BIMONTHLY':
        next.setMonth(current.getMonth() + 2);
        break;

      case 'QUARTERLY':
        next.setMonth(current.getMonth() + 3);
        break;

      case 'YEARLY':
        next.setFullYear(current.getFullYear() + recurringTask.interval);
        break;

      case 'CUSTOM':
        // Dla CUSTOM używamy dni tygodnia
        if (recurringTask.daysOfWeek && recurringTask.daysOfWeek.length > 0) {
          next.setDate(current.getDate() + 1);
          while (!recurringTask.daysOfWeek.includes(next.getDay())) {
            next.setDate(next.getDate() + 1);
          }
        } else {
          // Fallback - dodaj interval dni
          next.setDate(current.getDate() + recurringTask.interval);
        }
        break;

      default:
        logger.warn(`Nieznana częstotliwość: ${recurringTask.frequency}`);
        return null;
    }

    // Note: workdaysOnly field doesn't exist in current schema

    return next;
  }

  /**
   * Zwraca następny dzień roboczy (pomija weekendy)
   */
  private static getNextWorkday(date: Date): Date {
    const result = new Date(date);
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  /**
   * Manualne wygenerowanie zadania z konkretnego RecurringTask
   */
  static async generateTaskFromRecurring(recurringTaskId: string): Promise<Task> {
    const recurringTask = await prisma.recurringTask.findUnique({
      where: { id: recurringTaskId },
      include: {
        users: true,
        companies: true,
        contacts: true,
        projects: true,
        streams: true,
        deals: true
      }
    });

    if (!recurringTask) {
      throw new Error('Nie znaleziono zadania cyklicznego');
    }

    if (!recurringTask.isActive) {
      throw new Error('Zadanie cykliczne jest nieaktywne');
    }

    const task = await this.createTaskFromRecurring(recurringTask);

    // Zaktualizuj liczniki
    await prisma.recurringTask.update({
      where: { id: recurringTaskId },
      data: {
        lastExecuted: new Date(),
        executionCount: recurringTask.executionCount + 1
      }
    });

    logger.info(`🔧 Manualne utworzenie zadania: ${task.title} z ${recurringTask.title}`);
    return task;
  }

  /**
   * Podgląd zadań, które byłyby wygenerowane (bez tworzenia)
   */
  static async previewDueTasks(): Promise<Array<{
    recurringTask: RecurringTask;
    wouldGenerate: boolean;
    reason: string;
  }>> {
    const now = new Date();
    const recurringTasks = await prisma.recurringTask.findMany({
      where: { isActive: true }
    });

    return recurringTasks.map(task => {
      let wouldGenerate = false;
      let reason = '';

      if (!task.nextOccurrence) {
        reason = 'Brak nextOccurrence';
      } else if (task.nextOccurrence > now) {
        reason = `Termin w przyszłości: ${task.nextOccurrence.toISOString()}`;
      } else {
        wouldGenerate = true;
        reason = 'Zadanie zostanie wygenerowane';
      }

      return {
        recurringTask: task,
        wouldGenerate,
        reason
      };
    });
  }
}
