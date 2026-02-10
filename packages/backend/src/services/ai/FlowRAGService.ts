import { PrismaClient } from '@prisma/client';

// =============================================================================
// Interfaces
// =============================================================================

export interface MatchedContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  companyName: string | null;
  companyId: string | null;
  tags: string[];
  matchReason: 'email' | 'domain' | 'phone';
}

export interface MatchedCompany {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  email: string | null;
  website: string | null;
  status: string;
  tags: string[];
  matchReason: 'domain' | 'email' | 'name';
  contactCount: number;
}

export interface StreamSummary {
  id: string;
  name: string;
  description: string | null;
  streamType: string;
  gtdRole: string | null;
  recentItemCount: number;
}

export interface HistoryMatch {
  contentPreview: string;
  finalAction: string;
  streamId: string | null;
  streamName: string | null;
  wasUserOverride: boolean;
  completedAt: Date;
}

export interface FlowRAGContext {
  matchedContacts: MatchedContact[];
  matchedCompanies: MatchedCompany[];
  activeStreams: StreamSummary[];
  historyMatches: HistoryMatch[];
  extractedEmails: string[];
  extractedDomains: string[];
  buildTimeMs: number;
}

// Common free email domains to exclude from company matching
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'yahoo.pl', 'wp.pl', 'o2.pl', 'onet.pl', 'interia.pl',
  'op.pl', 'poczta.fm', 'gazeta.pl', 'tlen.pl', 'icloud.com', 'me.com',
  'protonmail.com', 'proton.me', 'aol.com', 'mail.com', 'zoho.com',
]);

// =============================================================================
// FlowRAGService
// =============================================================================

export class FlowRAGService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Build targeted RAG context for an inbox item.
   * Runs all queries in parallel. Target: <100ms total.
   */
  async buildContext(
    organizationId: string,
    inboxItem: { id: string; content: string; rawContent?: string | null; source?: string; sourceType?: string }
  ): Promise<FlowRAGContext> {
    const startTime = Date.now();
    const content = inboxItem.rawContent || inboxItem.content || '';

    // Step 1: Extract identifiers from content
    const emails = this.extractEmailAddresses(content);
    const domains = this.extractDomains(content);

    // Step 2: Run all SQL queries in parallel
    const [matchedContacts, matchedCompanies, activeStreams, historyMatches] = await Promise.all([
      this.matchContacts(organizationId, emails, domains),
      this.matchCompanies(organizationId, domains, emails),
      this.getActiveStreams(organizationId),
      this.matchHistory(organizationId, emails, domains),
    ]);

    return {
      matchedContacts,
      matchedCompanies,
      activeStreams,
      historyMatches,
      extractedEmails: emails,
      extractedDomains: domains,
      buildTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Format RAG context as structured text for AI prompt injection.
   */
  formatContextForPrompt(context: FlowRAGContext): string {
    const sections: string[] = [];

    if (context.matchedContacts.length > 0) {
      const lines = context.matchedContacts.map(c => {
        let line = `- ${c.firstName} ${c.lastName}`;
        if (c.email) line += ` (${c.email})`;
        if (c.position && c.companyName) line += ` — ${c.position} w ${c.companyName}`;
        else if (c.companyName) line += ` — ${c.companyName}`;
        if (c.tags.length > 0) line += ` [${c.tags.slice(0, 3).join(', ')}]`;
        line += ` (contactId: ${c.id})`;
        return line;
      });
      sections.push(`=== ROZPOZNANE KONTAKTY ===\n${lines.join('\n')}`);
    }

    if (context.matchedCompanies.length > 0) {
      const lines = context.matchedCompanies.map(c => {
        let line = `- ${c.name}`;
        if (c.industry) line += ` (${c.industry})`;
        if (c.domain) line += ` — domena: ${c.domain}`;
        line += ` [status: ${c.status}, kontakty: ${c.contactCount}]`;
        line += ` (companyId: ${c.id})`;
        return line;
      });
      sections.push(`=== ROZPOZNANE FIRMY ===\n${lines.join('\n')}`);
    }

    if (context.activeStreams.length > 0) {
      const lines = context.activeStreams.map(s => {
        let line = `- ${s.name}`;
        if (s.description) line += `: ${s.description.substring(0, 80)}`;
        if (s.recentItemCount > 0) line += ` (${s.recentItemCount} elementow w 30d)`;
        line += ` (streamId: ${s.id})`;
        return line;
      });
      sections.push(`=== DOSTEPNE STRUMIENIE ===\n${lines.join('\n')}`);
    }

    if (context.historyMatches.length > 0) {
      const lines = context.historyMatches.map(h => {
        let line = `- "${h.contentPreview}..."`;
        line += ` → ${h.finalAction}`;
        if (h.streamName) line += ` → strumien: ${h.streamName}`;
        if (h.wasUserOverride) line += ` (korekta uzytkownika)`;
        return line;
      });
      sections.push(
        `=== HISTORIA PODOBNYCH ELEMENTOW ===\n` +
        `Wczesniejsze decyzje dla elementow od tego samego nadawcy/domeny:\n` +
        lines.join('\n')
      );
    }

    if (sections.length === 0) return '';

    return '\n\n--- KONTEKST ORGANIZACYJNY (RAG) ---\n' +
      sections.join('\n\n') +
      '\n--- KONIEC KONTEKSTU ---';
  }

  // ===========================================================================
  // Extraction methods
  // ===========================================================================

  private extractEmailAddresses(content: string): string[] {
    const emailRegex = /[\w.+-]+@[\w.-]+\.\w+/g;
    const matches = content.match(emailRegex) || [];
    return [...new Set(matches.map(e => e.toLowerCase()))];
  }

  private extractDomains(content: string): string[] {
    const domains = new Set<string>();

    // From emails (exclude free providers)
    const emails = this.extractEmailAddresses(content);
    for (const email of emails) {
      const domain = email.split('@')[1];
      if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
        domains.add(domain);
      }
    }

    // From URLs
    const urlRegex = /https?:\/\/([\w.-]+)/g;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      const domain = match[1].replace(/^www\./, '');
      if (!FREE_EMAIL_DOMAINS.has(domain) && !domain.includes('google.') && !domain.includes('facebook.')) {
        domains.add(domain);
      }
    }

    return [...domains];
  }

  // ===========================================================================
  // SQL matching methods
  // ===========================================================================

  private async matchContacts(
    organizationId: string,
    emails: string[],
    domains: string[]
  ): Promise<MatchedContact[]> {
    if (emails.length === 0 && domains.length === 0) return [];

    const orConditions: any[] = [];

    // Exact email match
    if (emails.length > 0) {
      for (const email of emails) {
        orConditions.push({ email: { equals: email, mode: 'insensitive' as const } });
      }
    }

    // Domain match (email ends with @domain)
    for (const domain of domains) {
      orConditions.push({ email: { endsWith: `@${domain}`, mode: 'insensitive' as const } });
    }

    if (orConditions.length === 0) return [];

    try {
      const contacts = await this.prisma.contact.findMany({
        where: {
          organizationId,
          OR: orConditions,
        },
        include: {
          assignedCompany: { select: { id: true, name: true } },
        },
        take: 10,
      });

      return contacts.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        position: c.position,
        companyName: c.assignedCompany?.name || c.company || null,
        companyId: c.companyId,
        tags: c.tags || [],
        matchReason: emails.includes(c.email?.toLowerCase() || '') ? 'email' as const : 'domain' as const,
      }));
    } catch (error) {
      console.error('[FlowRAG] matchContacts error:', error);
      return [];
    }
  }

  private async matchCompanies(
    organizationId: string,
    domains: string[],
    emails: string[]
  ): Promise<MatchedCompany[]> {
    if (domains.length === 0 && emails.length === 0) return [];

    const orConditions: any[] = [];

    for (const domain of domains) {
      orConditions.push({ domain: { equals: domain, mode: 'insensitive' as const } });
      orConditions.push({ website: { contains: domain, mode: 'insensitive' as const } });
      orConditions.push({ email: { endsWith: `@${domain}`, mode: 'insensitive' as const } });
    }

    if (orConditions.length === 0) return [];

    try {
      const companies = await this.prisma.company.findMany({
        where: {
          organizationId,
          OR: orConditions,
        },
        include: {
          _count: { select: { assignedContacts: true } },
        },
        take: 5,
      });

      return companies.map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        email: c.email,
        website: c.website,
        status: c.status,
        tags: c.tags || [],
        matchReason: domains.includes(c.domain?.toLowerCase() || '') ? 'domain' as const : 'email' as const,
        contactCount: c._count.assignedContacts,
      }));
    } catch (error) {
      console.error('[FlowRAG] matchCompanies error:', error);
      return [];
    }
  }

  private async getActiveStreams(organizationId: string): Promise<StreamSummary[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const streams = await this.prisma.stream.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          description: true,
          streamType: true,
          gtdRole: true,
          _count: {
            select: {
              inboxItems: {
                where: { capturedAt: { gte: thirtyDaysAgo } },
              },
            },
          },
        },
      });

      return streams.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        streamType: s.streamType,
        gtdRole: s.gtdRole,
        recentItemCount: s._count.inboxItems,
      }));
    } catch (error) {
      console.error('[FlowRAG] getActiveStreams error:', error);
      return [];
    }
  }

  private async matchHistory(
    organizationId: string,
    emails: string[],
    domains: string[]
  ): Promise<HistoryMatch[]> {
    if (emails.length === 0 && domains.length === 0) return [];

    const orConditions: any[] = [];

    // Match items whose content or source contains the email/domain
    for (const email of emails) {
      orConditions.push({ content: { contains: email, mode: 'insensitive' as const } });
      orConditions.push({ source: { contains: email, mode: 'insensitive' as const } });
    }
    for (const domain of domains) {
      orConditions.push({ content: { contains: `@${domain}`, mode: 'insensitive' as const } });
      orConditions.push({ source: { contains: domain, mode: 'insensitive' as const } });
    }

    if (orConditions.length === 0) return [];

    try {
      const items = await this.prisma.inboxItem.findMany({
        where: {
          organizationId,
          processed: true,
          flowStatus: 'PROCESSED',
          OR: orConditions,
        },
        select: {
          content: true,
          userDecision: true,
          suggestedAction: true,
          streamId: true,
          aiConfidence: true,
          processedAt: true,
          userDecisionReason: true,
          stream: { select: { name: true } },
        },
        orderBy: { processedAt: 'desc' },
        take: 5,
      });

      return items.map(item => ({
        contentPreview: item.content.substring(0, 100),
        finalAction: (item.userDecision || item.suggestedAction || 'UNKNOWN') as string,
        streamId: item.streamId,
        streamName: item.stream?.name || null,
        wasUserOverride: item.userDecision != null && item.userDecision !== item.suggestedAction,
        completedAt: item.processedAt || new Date(),
      }));
    } catch (error) {
      console.error('[FlowRAG] matchHistory error:', error);
      return [];
    }
  }
}
