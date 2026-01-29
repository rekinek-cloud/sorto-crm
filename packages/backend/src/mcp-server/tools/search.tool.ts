/**
 * Search Tool
 * Elastyczne wyszukiwanie w CRM
 */

import { prisma } from '../../config/database';
import { SearchEntityType, SearchFilters, ToolExecutionResult } from '../types/mcp.types';
import logger from '../../config/logger';

export class SearchTool {
  /**
   * Wykonaj wyszukiwanie na podstawie zapytania
   */
  async execute(query: string, organizationId: string): Promise<ToolExecutionResult> {
    try {
      logger.info(`[SearchTool] Query: "${query}" for org: ${organizationId}`);

      // Parsuj zapytanie (prosty parser - bez AI na razie)
      const interpretation = this.parseQuery(query);

      // Wykonaj wyszukiwanie
      const results = await this.executeSearch(interpretation, organizationId);

      // Formatuj wyniki
      const formatted = this.formatResults(results, query);

      return { success: true, data: formatted };
    } catch (error) {
      logger.error('[SearchTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Błąd wyszukiwania'
      };
    }
  }

  /**
   * Prosty parser zapytania (bez AI)
   */
  private parseQuery(query: string): { searchType: SearchEntityType; filters: SearchFilters; limit: number } {
    const queryLower = query.toLowerCase();

    let searchType: SearchEntityType = 'mixed';
    const filters: SearchFilters = {};

    // Wykryj typ
    if (queryLower.includes('firma') || queryLower.includes('firmy') || queryLower.includes('company')) {
      searchType = 'company';
    } else if (queryLower.includes('kontakt') || queryLower.includes('contact') || queryLower.includes('osob')) {
      searchType = 'contact';
    } else if (queryLower.includes('deal') || queryLower.includes('lead') || queryLower.includes('szansa')) {
      searchType = 'deal';
    } else if (queryLower.includes('zadani') || queryLower.includes('task') || queryLower.includes('todo')) {
      searchType = 'task';
    } else if (queryLower.includes('stream') || queryLower.includes('wątek')) {
      searchType = 'stream';
    }

    // Wykryj filtry - branża
    const industryMatch = queryLower.match(/(?:branż[ay]?|industry)\s+(\w+)/i) ||
                          queryLower.match(/(?:z|from)\s+(?:branży\s+)?(\w+)/i);
    if (industryMatch) {
      filters.industry = industryMatch[1];
    }

    // IT jako specjalny przypadek branży
    if (queryLower.includes(' it') || queryLower.includes('it ') || queryLower === 'it') {
      filters.industry = 'IT';
    }

    // Status
    if (queryLower.includes('aktywn') || queryLower.includes('active')) {
      filters.status = 'ACTIVE';
    } else if (queryLower.includes('zamknięt') || queryLower.includes('closed')) {
      filters.status = 'CLOSED';
    } else if (queryLower.includes('now')) {
      filters.status = 'NEW';
    }

    // Wartość
    const valueMatch = queryLower.match(/(?:powyżej|above|>)\s*(\d+)\s*k?/i);
    if (valueMatch) {
      let value = parseInt(valueMatch[1]);
      if (queryLower.includes('k')) value *= 1000;
      filters.value = { min: value };
    }

    return {
      searchType,
      filters,
      limit: 10,
    };
  }

  /**
   * Wykonaj wyszukiwanie w bazie
   */
  private async executeSearch(
    interpretation: { searchType: SearchEntityType; filters: SearchFilters; limit: number },
    organizationId: string
  ): Promise<any[]> {
    const { searchType, filters, limit } = interpretation;

    switch (searchType) {
      case 'company':
        return this.searchCompanies(filters, organizationId, limit);
      case 'contact':
        return this.searchContacts(filters, organizationId, limit);
      case 'deal':
        return this.searchDeals(filters, organizationId, limit);
      case 'task':
        return this.searchTasks(filters, organizationId, limit);
      case 'stream':
        return this.searchStreams(filters, organizationId, limit);
      default:
        return this.searchMixed(filters, organizationId, limit);
    }
  }

  private async searchCompanies(filters: SearchFilters, organizationId: string, limit: number) {
    const where: any = { organizationId };

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' };
    }

    const companies = await prisma.company.findMany({
      where,
      take: limit,
      include: {
        assignedContacts: { take: 1 },
        deals: {
          where: { stage: { not: 'CLOSED_WON' } },
          take: 1
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return companies.map(c => ({
      type: 'company',
      id: c.id,
      name: c.name,
      industry: c.industry,
      address: c.address,
      status: c.status,
      contactsCount: c.assignedContacts.length,
      hasActiveDeals: c.deals.length > 0,
    }));
  }

  private async searchContacts(filters: SearchFilters, organizationId: string, limit: number) {
    const where: any = { organizationId };

    if (filters.name) {
      where.OR = [
        { firstName: { contains: filters.name, mode: 'insensitive' } },
        { lastName: { contains: filters.name, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      take: limit,
      include: {
        assignedCompany: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return contacts.map(c => ({
      type: 'contact',
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
      position: c.position,
      company: c.assignedCompany?.name || c.company,
    }));
  }

  private async searchDeals(filters: SearchFilters, organizationId: string, limit: number) {
    const where: any = { organizationId };

    if (filters.status) {
      where.stage = filters.status;
    }
    if (filters.value?.min) {
      where.value = { gte: filters.value.min };
    }
    if (filters.value?.max) {
      where.value = { ...where.value, lte: filters.value.max };
    }

    const deals = await prisma.deal.findMany({
      where,
      take: limit,
      include: {
        company: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return deals.map(d => ({
      type: 'deal',
      id: d.id,
      name: d.title,
      value: d.value,
      stage: d.stage,
      company: d.company?.name,
      probability: d.probability,
    }));
  }

  private async searchTasks(filters: SearchFilters, organizationId: string, limit: number) {
    const where: any = { organizationId };

    if (filters.status) {
      where.status = filters.status;
    }

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString().split('T')[0],
    }));
  }

  private async searchStreams(filters: SearchFilters, organizationId: string, limit: number) {
    const where: any = { organizationId };

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    const streams = await prisma.stream.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return streams.map(s => ({
      type: 'stream',
      id: s.id,
      name: s.name,
      status: s.status,
      streamType: s.streamType,
    }));
  }

  private async searchMixed(filters: SearchFilters, organizationId: string, limit: number) {
    // Szukaj we wszystkich typach
    const [companies, contacts, deals, tasks] = await Promise.all([
      this.searchCompanies(filters, organizationId, 3),
      this.searchContacts(filters, organizationId, 3),
      this.searchDeals(filters, organizationId, 3),
      this.searchTasks(filters, organizationId, 3),
    ]);

    return [...companies, ...contacts, ...deals, ...tasks].slice(0, limit);
  }

  /**
   * Formatuj wyniki dla użytkownika
   */
  private formatResults(results: any[], query: string): string {
    if (results.length === 0) {
      return `Nie znalazłem wyników dla: "${query}"`;
    }

    const lines: string[] = [`Znalazłem ${results.length} wyników:\n`];

    for (const result of results) {
      switch (result.type) {
        case 'company':
          lines.push(`**${result.name}** (Firma)`);
          lines.push(`  Branża: ${result.industry || 'brak'} | Adres: ${result.address || 'brak'}`);
          lines.push(`  Status: ${result.status} | Aktywne deale: ${result.hasActiveDeals ? 'Tak' : 'Nie'}`);
          lines.push('');
          break;

        case 'contact':
          lines.push(`**${result.name}** (Kontakt)`);
          lines.push(`  ${result.position || 'brak stanowiska'} @ ${result.company || 'brak firmy'}`);
          lines.push(`  Email: ${result.email || 'brak'} | Tel: ${result.phone || 'brak'}`);
          lines.push('');
          break;

        case 'deal':
          lines.push(`**${result.name}** (Deal)`);
          lines.push(`  Firma: ${result.company || 'brak'} | Wartość: ${result.value?.toLocaleString('pl-PL')} PLN`);
          lines.push(`  Etap: ${result.stage} | Szansa: ${result.probability}%`);
          lines.push('');
          break;

        case 'task':
          lines.push(`**${result.title}** (Zadanie)`);
          lines.push(`  Status: ${result.status} | Priorytet: ${result.priority}`);
          lines.push(`  Termin: ${result.dueDate || 'brak'}`);
          lines.push('');
          break;

        case 'stream':
          lines.push(`**${result.name}** (Stream)`);
          lines.push(`  Typ: ${result.streamType} | Status: ${result.status}`);
          lines.push('');
          break;
      }
    }

    return lines.join('\n');
  }
}

export const searchTool = new SearchTool();
