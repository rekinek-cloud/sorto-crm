/**
 * Stats Tool
 * Statystyki pipeline sprzedaży
 */

import { prisma } from '../../config/database';
import { PipelineStats, ToolExecutionResult } from '../types/mcp.types';
import logger from '../../config/logger';

export class StatsTool {
  /**
   * Pobierz statystyki pipeline
   */
  async execute(organizationId: string): Promise<ToolExecutionResult> {
    try {
      logger.info(`[StatsTool] Getting pipeline stats for org: ${organizationId}`);

      const stats = await this.calculateStats(organizationId);
      const formatted = this.formatStats(stats);

      return { success: true, data: formatted };
    } catch (error) {
      logger.error('[StatsTool] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Błąd pobierania statystyk'
      };
    }
  }

  private async calculateStats(organizationId: string): Promise<PipelineStats> {
    // Pobierz wszystkie aktywne deale (nie zamknięte)
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
        stage: { notIn: ['CLOSED_LOST'] },
      },
      select: {
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
      },
    });

    // Policz deale po etapach (zgodnie z enum DealStage)
    const newLeads = deals.filter(d => d.stage === 'PROSPECT').length;
    const qualified = deals.filter(d => d.stage === 'QUALIFIED').length;
    const proposals = deals.filter(d => d.stage === 'PROPOSAL').length;
    const negotiations = deals.filter(d => d.stage === 'NEGOTIATION').length;
    const closed = deals.filter(d => d.stage === 'CLOSED_WON').length;

    // Aktywne deale (nie zamknięte)
    const activeDeals = deals.filter(d => d.stage !== 'CLOSED_WON');

    // Wartości aktywnych deali
    const totalValue = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    // Prognoza na ten miesiąc (ważona prawdopodobieństwem)
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const forecastThisMonth = activeDeals
      .filter(d => d.expectedCloseDate && d.expectedCloseDate <= endOfMonth)
      .reduce((sum, d) => {
        const probability = (d.probability || 50) / 100;
        return sum + (d.value || 0) * probability;
      }, 0);

    // Konwersja (zamknięte wygrane / wszystkie historyczne)
    const allDealsCount = await prisma.deal.count({
      where: { organizationId },
    });

    const wonDealsCount = await prisma.deal.count({
      where: { organizationId, stage: 'CLOSED_WON' },
    });

    const conversionRate = allDealsCount > 0 ? (wonDealsCount / allDealsCount) * 100 : 0;

    return {
      newLeads,
      inProgress: qualified + proposals,
      offersSent: proposals,
      negotiations,
      closed,
      totalValue,
      forecastThisMonth,
      conversionRate,
    };
  }

  private formatStats(stats: PipelineStats): string {
    const formatPLN = (value: number) =>
      value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });

    const lines: string[] = [
      `**Pipeline sprzedaży**`,
      ``,
      `Etapy:`,
      `  - Nowe leady (Prospect): ${stats.newLeads}`,
      `  - W trakcie kwalifikacji: ${stats.inProgress}`,
      `  - Wysłane oferty: ${stats.offersSent}`,
      `  - Negocjacje: ${stats.negotiations}`,
      `  - Zamknięte (wygrane): ${stats.closed}`,
      ``,
      `Wartości:`,
      `  - Łączna wartość aktywnych deali: ${formatPLN(stats.totalValue)}`,
      `  - Prognoza (ten miesiąc): ${formatPLN(stats.forecastThisMonth)}`,
      ``,
      `Konwersja:`,
      `  - Wskaźnik wygranych: ${stats.conversionRate.toFixed(1)}%`,
    ];

    return lines.join('\n');
  }
}

export const statsTool = new StatsTool();
