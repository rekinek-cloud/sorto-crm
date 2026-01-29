/**
 * Tasks Tool
 * Lista zadań z różnymi filtrami
 */

import { prisma } from '../../config/database';
import { TaskFilterType, ToolExecutionResult } from '../types/mcp.types';
import logger from '../../config/logger';

export class TasksTool {
  /**
   * Pobierz listę zadań
   */
  async execute(
    filter: TaskFilterType = 'today',
    organizationId: string
  ): Promise<ToolExecutionResult> {
    try {
      logger.info(`[TasksTool] Getting tasks with filter: ${filter} for org: ${organizationId}`);

      const where: any = {
        organizationId,
        status: { notIn: ['COMPLETED', 'CANCELED'] },
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

      switch (filter) {
        case 'today':
          where.dueDate = {
            gte: today,
            lt: tomorrow,
          };
          break;
        case 'overdue':
          where.dueDate = {
            lt: today,
          };
          break;
        case 'this_week':
          where.dueDate = {
            gte: today,
            lt: endOfWeek,
          };
          break;
        case 'all':
          // Bez dodatkowego filtra daty
          break;
      }

      const tasks = await prisma.task.findMany({
        where,
        take: 20,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          project: { select: { name: true } },
        },
      });

      if (tasks.length === 0) {
        return {
          success: true,
          data: this.getEmptyMessage(filter),
        };
      }

      const formatted = this.formatTasks(tasks, filter);
      return { success: true, data: formatted };
    } catch (error) {
      logger.error('[TasksTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania zadań'
      };
    }
  }

  private getEmptyMessage(filter: TaskFilterType): string {
    switch (filter) {
      case 'today':
        return 'Brak zadań na dziś. Dobra robota!';
      case 'overdue':
        return 'Brak zaległych zadań. Wszystko na bieżąco!';
      case 'this_week':
        return 'Brak zadań na ten tydzień.';
      case 'all':
        return 'Brak aktywnych zadań.';
    }
  }

  private formatTasks(tasks: any[], filter: TaskFilterType): string {
    const header = this.getHeader(filter, tasks.length);
    const lines: string[] = [header, ''];

    // Grupuj po priorytecie
    const urgent = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
    const normal = tasks.filter(t => t.priority === 'MEDIUM' || t.priority === 'NORMAL');
    const low = tasks.filter(t => t.priority === 'LOW');

    if (urgent.length > 0) {
      lines.push('**Pilne:**');
      for (const task of urgent) {
        lines.push(this.formatTask(task));
      }
      lines.push('');
    }

    if (normal.length > 0) {
      lines.push('**Normalne:**');
      for (const task of normal) {
        lines.push(this.formatTask(task));
      }
      lines.push('');
    }

    if (low.length > 0) {
      lines.push('**Niska priorytet:**');
      for (const task of low) {
        lines.push(this.formatTask(task));
      }
    }

    return lines.join('\n');
  }

  private getHeader(filter: TaskFilterType, count: number): string {
    switch (filter) {
      case 'today':
        return `Zadania na dziś (${count}):`;
      case 'overdue':
        return `Zaległe zadania (${count}):`;
      case 'this_week':
        return `Zadania na ten tydzień (${count}):`;
      case 'all':
        return `Wszystkie aktywne zadania (${count}):`;
    }
  }

  private formatTask(task: any): string {
    const dueDate = task.dueDate
      ? task.dueDate.toISOString().split('T')[0]
      : 'brak terminu';

    const assignee = task.assignedTo
      ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
      : 'nieprzypisane';

    const project = task.project?.name ? ` [${task.project.name}]` : '';

    return `  - ${task.title}${project}\n    Termin: ${dueDate} | ${assignee} | ${task.status}`;
  }
}

export const tasksTool = new TasksTool();
