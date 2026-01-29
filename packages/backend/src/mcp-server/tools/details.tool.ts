/**
 * Details Tool
 * Pobieranie szczegółowych informacji o obiektach CRM
 */

import { prisma } from '../../config/database';
import { DetailsEntityType, ToolExecutionResult } from '../types/mcp.types';
import logger from '../../config/logger';

export class DetailsTool {
  /**
   * Pobierz szczegóły obiektu
   */
  async execute(
    type: DetailsEntityType,
    id: string,
    organizationId: string
  ): Promise<ToolExecutionResult> {
    try {
      logger.info(`[DetailsTool] Getting ${type}:${id} for org: ${organizationId}`);

      let result: string;

      switch (type) {
        case 'company':
          result = await this.getCompanyDetails(id, organizationId);
          break;
        case 'contact':
          result = await this.getContactDetails(id, organizationId);
          break;
        case 'deal':
          result = await this.getDealDetails(id, organizationId);
          break;
        case 'task':
          result = await this.getTaskDetails(id, organizationId);
          break;
        case 'stream':
          result = await this.getStreamDetails(id, organizationId);
          break;
        default:
          return { success: false, error: `Nieznany typ obiektu: ${type}` };
      }

      return { success: true, data: result };
    } catch (error) {
      logger.error('[DetailsTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania szczegółów'
      };
    }
  }

  private async getCompanyDetails(id: string, organizationId: string): Promise<string> {
    const company = await prisma.company.findFirst({
      where: { id, organizationId },
      include: {
        assignedContacts: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        deals: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: {
            owner: { select: { firstName: true, lastName: true } },
          },
        },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      return 'Nie znaleziono firmy o podanym ID.';
    }

    const lines: string[] = [
      `**${company.name}**`,
      ``,
      `Dane podstawowe:`,
      `  Branża: ${company.industry || 'brak'}`,
      `  Adres: ${company.address || 'brak'}`,
      `  Telefon: ${company.phone || 'brak'}`,
      `  Email: ${company.email || 'brak'}`,
      `  Strona: ${company.website || 'brak'}`,
      `  Status: ${company.status}`,
      ``,
    ];

    if (company.description) {
      lines.push(`Opis: ${company.description}`);
      lines.push('');
    }

    if (company.assignedContacts.length > 0) {
      lines.push(`Kontakty (${company.assignedContacts.length}):`);
      for (const contact of company.assignedContacts) {
        lines.push(`  - ${contact.firstName} ${contact.lastName} (${contact.position || 'brak stanowiska'})`);
        lines.push(`    ${contact.email || 'brak email'} | ${contact.phone || 'brak tel'}`);
      }
      lines.push('');
    }

    if (company.deals.length > 0) {
      lines.push(`Deale (${company.deals.length}):`);
      for (const deal of company.deals) {
        const owner = deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'brak';
        lines.push(`  - ${deal.title}: ${deal.value?.toLocaleString('pl-PL')} PLN (${deal.stage})`);
        lines.push(`    Właściciel: ${owner}`);
      }
      lines.push('');
    }

    if (company.activities.length > 0) {
      lines.push(`Ostatnie aktywności:`);
      for (const activity of company.activities) {
        const date = activity.createdAt.toISOString().split('T')[0];
        lines.push(`  - ${date}: ${activity.type} - ${activity.description || 'brak opisu'}`);
      }
    }

    return lines.join('\n');
  }

  private async getContactDetails(id: string, organizationId: string): Promise<string> {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        assignedCompany: { select: { name: true } },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      return 'Nie znaleziono kontaktu o podanym ID.';
    }

    const companyName = contact.assignedCompany?.name || contact.company || 'brak';

    const lines: string[] = [
      `**${contact.firstName} ${contact.lastName}**`,
      ``,
      `Dane podstawowe:`,
      `  Stanowisko: ${contact.position || 'brak'}`,
      `  Dział: ${contact.department || 'brak'}`,
      `  Firma: ${companyName}`,
      `  Email: ${contact.email || 'brak'}`,
      `  Telefon: ${contact.phone || 'brak'}`,
      `  Status: ${contact.status}`,
      `  Źródło: ${contact.source || 'brak'}`,
      ``,
    ];

    if (contact.notes) {
      lines.push(`Notatki:`);
      lines.push(`  ${contact.notes}`);
      lines.push('');
    }

    if (contact.activities.length > 0) {
      lines.push(`Ostatnie aktywności:`);
      for (const activity of contact.activities) {
        const date = activity.createdAt.toISOString().split('T')[0];
        lines.push(`  - ${date}: ${activity.type} - ${activity.description || 'brak opisu'}`);
      }
    }

    return lines.join('\n');
  }

  private async getDealDetails(id: string, organizationId: string): Promise<string> {
    const deal = await prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        company: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return 'Nie znaleziono deala o podanym ID.';
    }

    const lines: string[] = [
      `**${deal.title}**`,
      ``,
      `Dane podstawowe:`,
      `  Wartość: ${deal.value?.toLocaleString('pl-PL')} ${deal.currency}`,
      `  Etap: ${deal.stage}`,
      `  Prawdopodobieństwo: ${deal.probability}%`,
      `  Właściciel: ${deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'brak'}`,
      `  Źródło: ${deal.source || 'brak'}`,
      ``,
      `Powiązania:`,
      `  Firma: ${deal.company?.name || 'brak'}`,
      ``,
    ];

    if (deal.expectedCloseDate) {
      lines.push(`Planowane zamknięcie: ${deal.expectedCloseDate.toISOString().split('T')[0]}`);
    }
    if (deal.actualCloseDate) {
      lines.push(`Faktyczne zamknięcie: ${deal.actualCloseDate.toISOString().split('T')[0]}`);
    }

    if (deal.description) {
      lines.push(`Opis: ${deal.description}`);
      lines.push('');
    }

    if (deal.notes) {
      lines.push(`Notatki:`);
      lines.push(`  ${deal.notes}`);
      lines.push('');
    }

    if (deal.activities.length > 0) {
      lines.push(`Ostatnie aktywności:`);
      for (const activity of deal.activities) {
        const date = activity.createdAt.toISOString().split('T')[0];
        lines.push(`  - ${date}: ${activity.type} - ${activity.description || 'brak opisu'}`);
      }
    }

    return lines.join('\n');
  }

  private async getTaskDetails(id: string, organizationId: string): Promise<string> {
    const task = await prisma.task.findFirst({
      where: { id, organizationId },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        project: { select: { name: true } },
        stream: { select: { name: true } },
        context: { select: { name: true } },
      },
    });

    if (!task) {
      return 'Nie znaleziono zadania o podanym ID.';
    }

    const lines: string[] = [
      `**${task.title}**`,
      ``,
      `Status: ${task.status}`,
      `Priorytet: ${task.priority}`,
      `Termin: ${task.dueDate?.toISOString().split('T')[0] || 'brak'}`,
      `Energia: ${task.energy || 'brak'}`,
      ``,
      `Przypisane do: ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'nieprzypisane'}`,
      `Utworzone przez: ${task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'system'}`,
      `Projekt: ${task.project?.name || 'brak'}`,
      `Stream: ${task.stream?.name || 'brak'}`,
      `Kontekst: ${task.context?.name || 'brak'}`,
      ``,
    ];

    if (task.isWaitingFor) {
      lines.push(`**Oczekuje na:** ${task.waitingForNote || 'brak szczegółów'}`);
      lines.push('');
    }

    if (task.description) {
      lines.push(`Opis:`);
      lines.push(`  ${task.description}`);
    }

    if (task.estimatedHours) {
      lines.push(`Szacowany czas: ${task.estimatedHours}h`);
    }
    if (task.actualHours) {
      lines.push(`Faktyczny czas: ${task.actualHours}h`);
    }

    return lines.join('\n');
  }

  private async getStreamDetails(id: string, organizationId: string): Promise<string> {
    const stream = await prisma.stream.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        tasks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { title: true, status: true, priority: true },
        },
      },
    });

    if (!stream) {
      return 'Nie znaleziono streama o podanym ID.';
    }

    const lines: string[] = [
      `**${stream.name}**`,
      ``,
      `Typ: ${stream.streamType}`,
      `Status: ${stream.status}`,
      `Utworzony przez: ${stream.createdBy ? `${stream.createdBy.firstName} ${stream.createdBy.lastName}` : 'system'}`,
      ``,
    ];

    if (stream.description) {
      lines.push(`Opis:`);
      lines.push(`  ${stream.description}`);
      lines.push('');
    }

    if (stream.tasks.length > 0) {
      lines.push(`Zadania (${stream.tasks.length}):`);
      for (const task of stream.tasks) {
        lines.push(`  - ${task.title} (${task.status}, ${task.priority})`);
      }
    }

    return lines.join('\n');
  }
}

export const detailsTool = new DetailsTool();
