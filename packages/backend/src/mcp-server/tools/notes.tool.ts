/**
 * Notes Tool
 * Dodawanie notatek do obiektów CRM
 */

import crypto from 'crypto';
import { prisma } from '../../config/database';
import { NoteTargetType, ToolExecutionResult } from '../types/mcp.types';
import logger from '../../config/logger';

export class NotesTool {
  /**
   * Dodaj notatkę do obiektu
   */
  async execute(
    targetType: NoteTargetType,
    targetId: string,
    content: string,
    organizationId: string
  ): Promise<ToolExecutionResult> {
    try {
      logger.info(`[NotesTool] Adding note to ${targetType}:${targetId}`);

      // Sprawdź czy obiekt istnieje i należy do organizacji
      const targetExists = await this.verifyTarget(targetType, targetId, organizationId);
      if (!targetExists) {
        return {
          success: false,
          error: `Nie znaleziono ${this.getPolishName(targetType)} o podanym ID.`
        };
      }

      // Dodaj aktywność typu NOTE_ADDED
      const activityData: any = {
        id: crypto.randomUUID(),
        organizationId,
        type: 'NOTE_ADDED',
        title: 'Notatka dodana przez MCP',
        description: content,
        updatedAt: new Date(),
      };

      if (targetType === 'company') activityData.companyId = targetId;
      if (targetType === 'contact') activityData.contactId = targetId;
      if (targetType === 'deal') activityData.dealId = targetId;

      await prisma.activities.create({ data: activityData });

      // Dla kontaktów i deali zaktualizuj pole notes
      await this.appendNote(targetType, targetId, content);

      const targetName = await this.getTargetName(targetType, targetId);

      return {
        success: true,
        data: `Dodano notatkę do ${this.getPolishName(targetType)} "${targetName}":\n"${content}"`
      };
    } catch (error) {
      logger.error('[NotesTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Błąd dodawania notatki'
      };
    }
  }

  private async verifyTarget(
    targetType: NoteTargetType,
    targetId: string,
    organizationId: string
  ): Promise<boolean> {
    let result: any = null;

    switch (targetType) {
      case 'company':
        result = await prisma.company.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        break;
      case 'contact':
        result = await prisma.contact.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        break;
      case 'deal':
        result = await prisma.deal.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true },
        });
        break;
    }

    return result !== null;
  }

  private async getTargetName(targetType: NoteTargetType, targetId: string): Promise<string> {
    switch (targetType) {
      case 'company': {
        const company = await prisma.company.findUnique({
          where: { id: targetId },
          select: { name: true },
        });
        return company?.name || 'Nieznana firma';
      }
      case 'contact': {
        const contact = await prisma.contact.findUnique({
          where: { id: targetId },
          select: { firstName: true, lastName: true },
        });
        return contact ? `${contact.firstName} ${contact.lastName}` : 'Nieznany kontakt';
      }
      case 'deal': {
        const deal = await prisma.deal.findUnique({
          where: { id: targetId },
          select: { title: true },
        });
        return deal?.title || 'Nieznany deal';
      }
    }
  }

  private async appendNote(
    targetType: NoteTargetType,
    targetId: string,
    content: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const noteWithTimestamp = `[${timestamp}] ${content}`;

    // Company nie ma pola notes - tylko dodajemy activity
    if (targetType === 'company') {
      return;
    }

    // Contact i Deal mają pole notes
    switch (targetType) {
      case 'contact': {
        const contact = await prisma.contact.findUnique({
          where: { id: targetId },
          select: { notes: true },
        });
        const existingNotes = contact?.notes || '';
        const newNotes = existingNotes
          ? `${noteWithTimestamp}\n\n${existingNotes}`
          : noteWithTimestamp;
        await prisma.contact.update({
          where: { id: targetId },
          data: { notes: newNotes },
        });
        break;
      }
      case 'deal': {
        const deal = await prisma.deal.findUnique({
          where: { id: targetId },
          select: { notes: true },
        });
        const existingNotes = deal?.notes || '';
        const newNotes = existingNotes
          ? `${noteWithTimestamp}\n\n${existingNotes}`
          : noteWithTimestamp;
        await prisma.deal.update({
          where: { id: targetId },
          data: { notes: newNotes },
        });
        break;
      }
    }
  }

  private getPolishName(targetType: NoteTargetType): string {
    switch (targetType) {
      case 'company':
        return 'firmy';
      case 'contact':
        return 'kontaktu';
      case 'deal':
        return 'deala';
    }
  }
}

export const notesTool = new NotesTool();
