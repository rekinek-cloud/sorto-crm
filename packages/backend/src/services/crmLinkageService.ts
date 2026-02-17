import { Contact, Company, Deal, ContactStatus, DealStage } from '@prisma/client';
import { prisma } from '../config/database';
import { EmailMessage } from './emailService';

export interface CRMLinkageResult {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  isNewContact?: boolean;
  isNewCompany?: boolean;
}

export class CRMLinkageService {
  /**
   * Find or create contact from email message
   */
  async findOrCreateContactFromEmail(
    email: EmailMessage, 
    organizationId: string,
    userId?: string
  ): Promise<Contact | null> {
    try {
      const emailAddress = email.from.address.toLowerCase();
      
      // First, try to find existing contact by email
      let contact = await prisma.contact.findFirst({
        where: {
          organizationId,
          email: emailAddress
        }
      });

      if (!contact) {
        // Extract name parts
        const nameParts = this.parseEmailName(email.from.name || emailAddress);
        
        // Extract domain for company hint
        const domain = emailAddress.split('@')[1];
        
        // Try to find company by domain
        const company = await this.findCompanyByDomain(domain, organizationId);
        
        // Determine contact status based on email content
        const contactStatus = await this.determineContactStatus(email);
        const tags = ['auto-created', 'from-email'];
        
        // Add additional tags based on email analysis
        if (contactStatus === 'INACTIVE') {
          tags.push('outbound-offer', 'unqualified', 'sales-email');
        } else if (contactStatus === 'ARCHIVED') {
          tags.push('business-document', 'administrative', 'no-action-needed');
        } else if (contactStatus === 'LEAD') {
          tags.push('potential-customer', 'qualified', 'needs-follow-up');
        }

        // Create new contact
        contact = await prisma.contact.create({
          data: {
            organizationId,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            email: emailAddress,
            source: 'Email',
            status: contactStatus as ContactStatus,
            companyId: company?.id,
            tags
          }
        });
      }

      // Update interaction tracking
      await this.updateContactInteraction(contact.id);

      return contact;
    } catch (error) {
      console.error('Error finding/creating contact:', error);
      return null;
    }
  }

  /**
   * Determine contact status using AI-powered email classification
   */
  private async determineContactStatus(email: EmailMessage): Promise<string> {
    try {
      // If OpenAI is configured, use AI classification
      if (process.env.OPENAI_API_KEY) {
        return await this.classifyEmailWithAI(email);
      }
      
      // Fallback to rule-based classification
      return this.classifyEmailWithRules(email);
    } catch (error) {
      console.error('Error in email classification:', error);
      // Fallback to rule-based classification
      return this.classifyEmailWithRules(email);
    }
  }

  /**
   * AI-powered email classification using OpenAI
   */
  private async classifyEmailWithAI(email: EmailMessage): Promise<string> {
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });

      const prompt = `
Analyze this email and classify the sender's relationship to our business. 

Email Subject: "${email.subject || 'No subject'}"
From: ${email.from.address} (${email.from.name || 'No name'})
Content: "${(email.text || '').substring(0, 1000)}"

CLASSIFICATION RULES:
1. LEAD - Potential customer inquiring about our products/services, asking for quotes, showing interest in cooperation
2. INACTIVE - Sales/marketing emails, spam, newsletters, promotional content, people trying to sell TO us
3. ARCHIVED - Administrative emails, invoices, receipts, system notifications, existing business documents
4. ACTIVE - Existing business contacts, partners, or unclear cases that need manual review

Consider these factors:
- Is this someone trying to SELL to us or BUY from us?
- Is this a business document (invoice, receipt, notification)?
- Is this marketing/promotional content?
- Is this a genuine business inquiry?

Examples:
- "Oferta budowy stoisk" = INACTIVE (trying to sell to us)
- "Faktura nr 123" = ARCHIVED (business document)
- "Zapytanie o wycenę" = LEAD (potential customer)
- "Newsletter" = INACTIVE (marketing)

Respond with ONLY one word: LEAD, INACTIVE, ARCHIVED, or ACTIVE
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email classifier for CRM systems. Your job is to determine if an email represents a sales lead or not.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const classification = response.choices[0]?.message?.content?.trim().toUpperCase();
      
      // Validate the response
      const validStatuses = ['LEAD', 'INACTIVE', 'ARCHIVED', 'ACTIVE'];
      if (validStatuses.includes(classification)) {
        console.log(`AI classified email from ${email.from.address} as: ${classification}`);
        return classification;
      } else {
        console.warn(`Invalid AI classification: ${classification}, falling back to rules`);
        return this.classifyEmailWithRules(email);
      }
    } catch (error) {
      console.error('OpenAI classification failed:', error);
      return this.classifyEmailWithRules(email);
    }
  }

  /**
   * Rule-based email classification (fallback)
   */
  private classifyEmailWithRules(email: EmailMessage): string {
    const subject = (email.subject || '').toLowerCase();
    const content = (email.text || '').toLowerCase();
    const fullText = `${subject} ${content}`;
    const fromEmail = email.from.address.toLowerCase();

    // Business documents - should be ARCHIVED
    const documentKeywords = [
      'faktura', 'rachunek', 'paragon', 'invoice', 'receipt', 'bill',
      'potwierdzenie', 'confirmation', 'powiadomienie', 'notification',
      'płatność', 'payment', 'przelew', 'transfer', 'księgowość', 'accounting'
    ];

    // Marketing/Sales emails - should be INACTIVE
    const marketingKeywords = [
      'oferta', 'promocja', 'sprzedaż', 'budowa', 'realizujemy', 'oferujemy',
      'nasza firma', 'nasze usługi', 'newsletter', 'reklama', 'marketing',
      'offer', 'promotion', 'sale', 'marketing', 'advertising'
    ];

    // Customer inquiries - should be LEAD
    const inquiryKeywords = [
      'zapytanie', 'pytanie', 'interesuje mnie', 'chciałbym', 'potrzebuję',
      'szukam', 'czy możecie', 'ile kosztuje', 'wycena', 'ofertę proszę',
      'współpraca', 'zlecenie', 'inquiry', 'question', 'interested', 
      'would like', 'need', 'looking for', 'quote', 'quotation'
    ];

    // System emails
    const systemEmailPatterns = [
      'noreply@', 'no-reply@', 'system@', 'admin@', 'support@'
    ];

    // Check document keywords
    const documentMatches = documentKeywords.filter(keyword => fullText.includes(keyword)).length;
    if (documentMatches >= 1) {
      return 'ARCHIVED';
    }

    // Check system emails
    if (systemEmailPatterns.some(pattern => fromEmail.includes(pattern))) {
      return 'ARCHIVED';
    }

    // Check marketing keywords
    const marketingMatches = marketingKeywords.filter(keyword => fullText.includes(keyword)).length;
    if (marketingMatches >= 2) {
      return 'INACTIVE';
    }

    // Check inquiry keywords
    const inquiryMatches = inquiryKeywords.filter(keyword => fullText.includes(keyword)).length;
    if (inquiryMatches >= 1) {
      return 'LEAD';
    }

    // If unclear, mark as ACTIVE for manual review
    return 'ACTIVE';
  }

  /**
   * Find company by email domain
   */
  async findCompanyByDomain(domain: string, organizationId: string): Promise<Company | null> {
    try {
      // Clean domain
      domain = domain.toLowerCase().trim();
      
      // Skip common email providers
      const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'wp.pl', 'onet.pl'];
      if (commonProviders.includes(domain)) {
        return null;
      }

      // Try to find by website domain
      const company = await prisma.company.findFirst({
        where: {
          organizationId,
          OR: [
            { website: { contains: domain } },
            { email: { contains: domain } }
          ]
        }
      });

      return company;
    } catch (error) {
      console.error('Error finding company by domain:', error);
      return null;
    }
  }

  /**
   * Find or create company from domain
   */
  async findOrCreateCompanyFromDomain(
    domain: string, 
    organizationId: string,
    additionalData?: {
      name?: string;
      contactEmail?: string;
    }
  ): Promise<Company | null> {
    try {
      // First try to find existing
      let company = await this.findCompanyByDomain(domain, organizationId);
      
      if (!company) {
        // Skip common providers
        const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'wp.pl', 'onet.pl'];
        if (commonProviders.includes(domain)) {
          return null;
        }

        // Generate company name from domain
        const companyName = additionalData?.name || this.generateCompanyNameFromDomain(domain);
        
        company = await prisma.company.create({
          data: {
            organizationId,
            name: companyName,
            website: `https://${domain}`,
            email: additionalData?.contactEmail,
            status: 'PROSPECT',
            tags: ['auto-created', 'from-email']
          }
        });
      }

      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      return null;
    }
  }

  /**
   * Link message to CRM entities
   */
  async linkMessageToCRM(
    messageId: string,
    email: EmailMessage,
    organizationId: string,
    userId?: string
  ): Promise<CRMLinkageResult> {
    const result: CRMLinkageResult = {};

    try {
      // Find or create contact
      const contact = await this.findOrCreateContactFromEmail(email, organizationId, userId);
      if (contact) {
        result.contactId = contact.id;
        result.isNewContact = contact.createdAt.getTime() > Date.now() - 5000; // Created in last 5 seconds

        // Update message with contact
        await prisma.message.update({
          where: { id: messageId },
          data: { 
            contactId: contact.id,
            companyId: contact.companyId,
            interactionType: 'email_received'
          }
        });

        // If contact has a company, link it
        if (contact.companyId) {
          result.companyId = contact.companyId;
          await this.updateCompanyInteraction(contact.companyId);
        } else {
          // Try to create company from domain
          const domain = email.from.address.split('@')[1];
          const company = await this.findOrCreateCompanyFromDomain(domain, organizationId, {
            contactEmail: email.from.address
          });
          
          if (company) {
            result.companyId = company.id;
            result.isNewCompany = company.createdAt.getTime() > Date.now() - 5000;
            
            // Update contact with company
            await prisma.contact.update({
              where: { id: contact.id },
              data: { companyId: company.id }
            });
            
            // Update message with company
            await prisma.message.update({
              where: { id: messageId },
              data: { companyId: company.id }
            });

            await this.updateCompanyInteraction(company.id);
          }
        }

        // Check if there's an active deal for this contact/company
        if (result.companyId) {
          const activeDeal = await prisma.deal.findFirst({
            where: {
              companyId: result.companyId,
              stage: {
                notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
              }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (activeDeal) {
            result.dealId = activeDeal.id;
            
            // Update message with deal
            await prisma.message.update({
              where: { id: messageId },
              data: { dealId: activeDeal.id }
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error linking message to CRM:', error);
      return result;
    }
  }

  /**
   * Update contact status based on email interaction
   */
  async updateContactStatus(contactId: string, status: ContactStatus): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId },
      data: { status }
    });
  }

  /**
   * Add tags to contact
   */
  async addContactTags(contactId: string, tags: string[]): Promise<void> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tags: true }
    });

    if (contact) {
      const uniqueTags = Array.from(new Set([...contact.tags, ...tags]));
      
      await prisma.contact.update({
        where: { id: contactId },
        data: { tags: uniqueTags }
      });
    }
  }

  /**
   * Create deal from email interaction
   */
  async createDealFromEmail(
    contactId: string,
    companyId: string,
    email: EmailMessage,
    dealData: {
      stage?: DealStage;
      value?: number;
      ownerId: string;
      organizationId: string;
    }
  ): Promise<Deal> {
    const deal = await prisma.deal.create({
      data: {
        title: `Deal from ${email.from.name || email.from.address}`,
        description: `Created from email: ${email.subject}`,
        stage: dealData.stage || DealStage.PROSPECT,
        value: dealData.value || 0,
        source: 'Email',
        companyId,
        ownerId: dealData.ownerId,
        organizationId: dealData.organizationId,
        notes: `Original email:\nFrom: ${email.from.address}\nSubject: ${email.subject}\nDate: ${email.date}`
      }
    });

    return deal;
  }

  /**
   * Record interaction in CRM
   */
  async recordInteraction(
    type: 'email_received' | 'email_sent' | 'meeting' | 'call',
    entityId: string,
    entityType: 'contact' | 'company' | 'deal',
    messageId?: string
  ): Promise<void> {
    // This could be expanded to a separate Interaction model
    // For now, we just update the last interaction timestamp
    
    if (entityType === 'contact') {
      await this.updateContactInteraction(entityId);
    } else if (entityType === 'company') {
      await this.updateCompanyInteraction(entityId);
    }
  }

  /**
   * Update contact interaction tracking
   */
  private async updateContactInteraction(contactId: string): Promise<void> {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        lastInteractionAt: new Date(),
        interactionCount: { increment: 1 }
      }
    });
  }

  /**
   * Update company interaction tracking
   */
  private async updateCompanyInteraction(companyId: string): Promise<void> {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        lastInteractionAt: new Date(),
        interactionCount: { increment: 1 }
      }
    });
  }

  /**
   * Parse email name into first and last name
   */
  private parseEmailName(fullName: string): { firstName: string; lastName: string } {
    // Remove email if name contains it
    fullName = fullName.replace(/<.*>/, '').trim();
    
    // Split by space
    const parts = fullName.split(' ').filter(p => p.length > 0);
    
    if (parts.length === 0) {
      return { firstName: 'Unknown', lastName: 'Contact' };
    } else if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    } else {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
  }

  /**
   * Generate company name from domain
   */
  private generateCompanyNameFromDomain(domain: string): string {
    // Remove common TLDs
    const name = domain
      .replace(/\.(com|net|org|io|pl|eu|biz|info|co\.uk|de|fr)$/i, '')
      .split('.')
      .pop() || domain;
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Find deals for contact
   */
  async findDealsForContact(contactId: string): Promise<Deal[]> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { companies: true }
    });

    if (!contact) return [];

    const companyIds = [
      contact.companyId,
      ...contact.companies.map(c => c.id)
    ].filter(Boolean) as string[];

    if (companyIds.length === 0) return [];

    return prisma.deal.findMany({
      where: {
        companyId: { in: companyIds }
      },
      include: {
        company: true,
        owner: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update deal stage based on email interaction
   */
  async updateDealFromEmail(dealId: string, message: EmailMessage): Promise<void> {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId }
    });

    if (!deal) return;

    // Simple logic - could be expanded with AI analysis
    const content = `${message.subject} ${message.text}`.toLowerCase();
    
    let updates: any = {};
    
    // Check for positive signals
    if (content.includes('interested') || content.includes('zainteresowany')) {
      if (deal.stage === DealStage.PROSPECT) {
        updates.stage = DealStage.QUALIFIED;
      }
    }
    
    if (content.includes('proposal') || content.includes('oferta') || content.includes('quote')) {
      if (deal.stage === DealStage.QUALIFIED) {
        updates.stage = DealStage.PROPOSAL;
      }
    }
    
    if (content.includes('accept') || content.includes('akceptuje') || content.includes('zgoda')) {
      if (deal.stage === DealStage.PROPOSAL || deal.stage === DealStage.NEGOTIATION) {
        updates.stage = DealStage.CLOSED_WON;
        updates.actualCloseDate = new Date();
      }
    }
    
    // Check for negative signals
    if (content.includes('not interested') || content.includes('nie zainteresowany') || 
        content.includes('reject') || content.includes('odrzucam')) {
      updates.stage = DealStage.CLOSED_LOST;
      updates.actualCloseDate = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await prisma.deal.update({
        where: { id: dealId },
        data: updates
      });
    }
  }
}

// Export singleton instance
export const crmLinkageService = new CRMLinkageService();
