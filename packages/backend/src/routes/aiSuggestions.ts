import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, requireRole } from '../shared/middleware/auth';
import { AppError } from '../shared/middleware/error';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/v1/ai-suggestions
 * List AI suggestions with filters
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const { status, type, messageId, limit = '50' } = req.query;

      const where: any = {
        organization_id: req.user!.organizationId,
      };

      if (status) where.status = status;
      if (type) {
        where.context = type; // Use context field for suggestion type
      }
      if (messageId) {
        where.input_data = { path: ['messageId'], equals: messageId };
      }

      const suggestions = await prisma.ai_suggestions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Math.min(parseInt(limit as string), 100),
      });

      // Map to consistent format
      const mapped = suggestions.map(s => ({
        id: s.id,
        organizationId: s.organization_id,
        userId: s.user_id,
        suggestionType: s.context,
        title: (s.suggestion as any)?.title || 'Sugestia AI',
        description: (s.suggestion as any)?.description || s.reasoning,
        data: s.suggestion,
        inputData: s.input_data,
        confidence: s.confidence || 0,
        status: s.status,
        createdAt: s.created_at.toISOString(),
        resolvedAt: s.resolved_at?.toISOString() || null,
      }));

      return res.json({ success: true, data: mapped });
    } catch (error) {
      logger.error('Failed to list AI suggestions:', error);
      throw new AppError('Nie udało się pobrać sugestii', 500);
    }
  }
);

/**
 * POST /api/v1/ai-suggestions/:id/accept
 * Accept an AI suggestion
 */
router.post('/:id/accept',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const suggestion = await prisma.ai_suggestions.findFirst({
        where: { id, organization_id: req.user!.organizationId },
      });

      if (!suggestion) throw new AppError('Sugestia nie znaleziona', 404);
      if (suggestion.status !== 'PENDING') throw new AppError('Sugestia już rozpatrzona', 400);

      // User can send modifications in request body
      const { modifications } = req.body || {};
      const data = modifications
        ? { ...(suggestion.suggestion as any), ...modifications }
        : (suggestion.suggestion as any);

      let createdEntity: any = null;

      // Apply the suggestion based on type
      switch (suggestion.context) {
        case 'BLACKLIST_DOMAIN':
          if (data?.domain) {
            await prisma.email_domain_rules.create({
              data: {
                pattern: data.domain,
                patternType: 'DOMAIN',
                listType: 'BLACKLIST',
                classification: data.classification || 'NEWSLETTER',
                source: 'AI_SUGGESTED',
                reason: data.reason || 'Zaakceptowana sugestia AI',
                confidence: (suggestion.confidence || 0) / 100,
                createdBy: req.user!.id,
                organizationId: req.user!.organizationId,
              },
            }).catch(() => { /* Ignore if already exists */ });
          }
          break;

        case 'CREATE_TASK': {
          const dueDate = data.dueDate || data.deadline;
          let parsedDueDate: Date | null = null;
          if (dueDate) {
            const d = new Date(dueDate);
            if (!isNaN(d.getTime())) parsedDueDate = d;
          }
          createdEntity = await prisma.task.create({
            data: {
              title: data.title || 'Zadanie z sugestii AI',
              description: data.description || null,
              priority: data.priority || 'MEDIUM',
              status: 'NEW',
              dueDate: parsedDueDate,
              estimatedHours: data.estimatedTime ? data.estimatedTime / 60 : null,
              createdById: req.user!.id,
              organizationId: req.user!.organizationId,
              streamId: data.streamId || null,
              projectId: data.projectId || null,
            },
          });
          break;
        }

        case 'CREATE_DEAL':
          createdEntity = await prisma.deal.create({
            data: {
              title: data.title || 'Transakcja z sugestii AI',
              value: data.value ? parseFloat(String(data.value)) : 0,
              currency: data.currency || 'PLN',
              stage: data.stage || 'PROSPECT',
              probability: data.probability || 0,
              expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
              notes: data.notes || data.description || null,
              source: data.source || undefined,
              companyId: data.companyId || undefined,
              organizationId: req.user!.organizationId,
              ownerId: req.user!.id,
            },
          });
          break;

        case 'UPDATE_CONTACT':
          if (data?.contactId && data?.fieldsToUpdate) {
            const updateData: any = {};
            for (const [field, value] of Object.entries(data.fieldsToUpdate)) {
              if (['firstName', 'lastName', 'email', 'phone', 'position', 'notes'].includes(field)) {
                updateData[field] = value;
              }
            }
            if (Object.keys(updateData).length > 0) {
              createdEntity = await prisma.contact.update({
                where: { id: data.contactId },
                data: updateData,
              }).catch((err: any): null => {
                logger.warn(`Could not update contact ${data.contactId}:`, err.message);
                return null;
              });
            }
          }
          break;

        case 'CREATE_COMPANY':
          createdEntity = await prisma.company.create({
            data: {
              name: data.name || 'Firma z sugestii AI',
              domain: data.domain || undefined,
              website: data.website || undefined,
              email: data.email || undefined,
              nip: data.nip || undefined,
              status: data.status || 'PROSPECT',
              tags: data.tags || ['from-email-analysis'],
              organizationId: req.user!.organizationId,
            },
          });
          break;

        case 'CREATE_CONTACT':
          createdEntity = await prisma.contact.create({
            data: {
              firstName: data.firstName || 'Nieznany',
              lastName: data.lastName || '',
              email: data.email || undefined,
              phone: data.phone || undefined,
              company: data.companyName || undefined,
              position: data.position || undefined,
              source: data.source || 'Email',
              status: data.status || 'LEAD',
              companyId: data.companyId || undefined,
              tags: data.tags || ['from-email-analysis'],
              organizationId: req.user!.organizationId,
            },
          });
          break;

        case 'CREATE_LEAD':
          createdEntity = await prisma.lead.create({
            data: {
              title: data.title || 'Lead z sugestii AI',
              description: data.description || null,
              company: data.company || undefined,
              contactPerson: data.contactPerson || undefined,
              status: 'NEW',
              priority: data.priority || 'MEDIUM',
              source: data.source || 'Email',
              organizationId: req.user!.organizationId,
            },
          });
          break;

        case 'SEND_NOTIFICATION':
          // Notification suggestions are informational — just log acceptance
          logger.info(`Notification suggestion accepted: ${data?.subject || 'no subject'}`);
          break;
      }

      // Mark as accepted
      await prisma.ai_suggestions.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          resolved_at: new Date(),
          user_modifications: modifications
            ? { acceptedBy: req.user!.id, modifications }
            : { acceptedBy: req.user!.id },
        },
      });

      logger.info(`AI suggestion accepted: ${id} (${suggestion.context}) by ${req.user!.email}`);
      return res.json({
        success: true,
        message: 'Sugestia zaakceptowana',
        createdEntity: createdEntity ? { id: createdEntity.id, type: suggestion.context } : null,
      });
    } catch (error) {
      logger.error('Failed to accept suggestion:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się zaakceptować sugestii', 500);
    }
  }
);

/**
 * POST /api/v1/ai-suggestions/:id/reject
 * Reject an AI suggestion
 */
router.post('/:id/reject',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { note, correctClassification, correctAction, feedback } = req.body;

      const suggestion = await prisma.ai_suggestions.findFirst({
        where: { id, organization_id: req.user!.organizationId },
      });

      if (!suggestion) throw new AppError('Sugestia nie znaleziona', 404);
      if (suggestion.status !== 'PENDING') throw new AppError('Sugestia już rozpatrzona', 400);

      // Build structured user correction for AI learning
      const userCorrection: Record<string, any> = {
        rejectedBy: req.user!.id,
        rejectedAt: new Date().toISOString(),
      };
      if (note) userCorrection.note = note;
      if (correctClassification) userCorrection.correctClassification = correctClassification;
      if (correctAction) userCorrection.correctAction = correctAction;
      if (feedback) userCorrection.feedback = feedback;

      await prisma.ai_suggestions.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolved_at: new Date(),
          user_modifications: userCorrection,
        },
      });

      // If user provided correct classification for a BLACKLIST_DOMAIN, add to whitelist
      if (suggestion.context === 'BLACKLIST_DOMAIN' && correctClassification === 'BUSINESS') {
        const domain = (suggestion.suggestion as any)?.domain;
        if (domain) {
          await prisma.email_domain_rules.create({
            data: {
              pattern: domain,
              patternType: 'DOMAIN',
              listType: 'WHITELIST',
              classification: 'BUSINESS',
              source: 'USER_CORRECTION',
              reason: note || `Uzytkownik poprawil klasyfikacje AI: to jest ${correctClassification}`,
              confidence: 1.0,
              createdBy: req.user!.id,
              organizationId: req.user!.organizationId,
            },
          }).catch(() => { /* Ignore if already exists */ });
          logger.info(`Domain ${domain} added to WHITELIST after user correction`);
        }
      }

      logger.info(`AI suggestion rejected: ${id} (${suggestion.context}) by ${req.user!.email}, correction: ${correctClassification || correctAction || 'none'}`);
      return res.json({ success: true, message: 'Sugestia odrzucona z poprawka' });
    } catch (error) {
      logger.error('Failed to reject suggestion:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udało się odrzucić sugestii', 500);
    }
  }
);

/**
 * PUT /api/v1/ai-suggestions/:id
 * Edit a pending suggestion before accepting/rejecting
 */
router.put('/:id',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { suggestion: updatedSuggestion, reasoning, confidence } = req.body;

      const existing = await prisma.ai_suggestions.findFirst({
        where: { id, organization_id: req.user!.organizationId },
      });

      if (!existing) throw new AppError('Sugestia nie znaleziona', 404);
      if (existing.status !== 'PENDING') throw new AppError('Tylko oczekujace sugestie mozna edytowac', 400);

      const updateData: any = {};
      if (updatedSuggestion) {
        updateData.suggestion = { ...(existing.suggestion as any), ...updatedSuggestion };
      }
      if (reasoning !== undefined) updateData.reasoning = reasoning;
      if (confidence !== undefined) updateData.confidence = confidence;
      updateData.user_modifications = {
        ...(existing.user_modifications as any || {}),
        editedBy: req.user!.id,
        editedAt: new Date().toISOString(),
      };

      const updated = await prisma.ai_suggestions.update({
        where: { id },
        data: updateData,
      });

      logger.info(`AI suggestion edited: ${id} by ${req.user!.email}`);
      return res.json({
        success: true,
        data: {
          id: updated.id,
          suggestionType: updated.context,
          data: updated.suggestion,
          confidence: updated.confidence,
          reasoning: updated.reasoning,
          status: updated.status,
        },
      });
    } catch (error) {
      logger.error('Failed to edit suggestion:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Nie udalo sie edytowac sugestii', 500);
    }
  }
);

/**
 * POST /api/v1/ai-suggestions/bulk-action
 * Accept or reject multiple suggestions at once
 */
router.post('/bulk-action',
  authenticateToken,
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  async (req, res) => {
    try {
      const { ids, action } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required' });
      }
      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be "accept" or "reject"' });
      }

      const results: { accepted: number; rejected: number; created: Array<{ id: string; type: string }> } = {
        accepted: 0,
        rejected: 0,
        created: [],
      };

      for (const id of ids) {
        const suggestion = await prisma.ai_suggestions.findFirst({
          where: { id, organization_id: req.user!.organizationId, status: 'PENDING' },
        });
        if (!suggestion) continue;

        const data = suggestion.suggestion as any;

        if (action === 'accept') {
          let createdEntity: any = null;

          switch (suggestion.context) {
            case 'CREATE_COMPANY':
              createdEntity = await prisma.company.create({
                data: {
                  name: data.name || 'Firma z sugestii AI',
                  domain: data.domain || undefined,
                  website: data.website || undefined,
                  email: data.email || undefined,
                  nip: data.nip || undefined,
                  status: data.status || 'PROSPECT',
                  tags: data.tags || ['from-email-analysis'],
                  organizationId: req.user!.organizationId,
                },
              }).catch((): null => null);
              break;

            case 'CREATE_CONTACT':
              createdEntity = await prisma.contact.create({
                data: {
                  firstName: data.firstName || 'Nieznany',
                  lastName: data.lastName || '',
                  email: data.email || undefined,
                  phone: data.phone || undefined,
                  company: data.companyName || undefined,
                  position: data.position || undefined,
                  source: data.source || 'Email',
                  status: data.status || 'LEAD',
                  companyId: data.companyId || undefined,
                  tags: data.tags || ['from-email-analysis'],
                  organizationId: req.user!.organizationId,
                },
              }).catch((): null => null);
              break;

            case 'CREATE_LEAD':
              createdEntity = await prisma.lead.create({
                data: {
                  title: data.title || 'Lead z sugestii AI',
                  description: data.description || null,
                  company: data.company || undefined,
                  contactPerson: data.contactPerson || undefined,
                  status: 'NEW',
                  priority: data.priority || 'MEDIUM',
                  source: data.source || 'Email',
                  organizationId: req.user!.organizationId,
                },
              }).catch((): null => null);
              break;

            case 'CREATE_DEAL':
              createdEntity = await prisma.deal.create({
                data: {
                  title: data.title || 'Transakcja z sugestii AI',
                  value: data.value ? parseFloat(String(data.value)) : 0,
                  stage: data.stage || 'PROSPECT',
                  source: data.source || undefined,
                  companyId: data.companyId || undefined,
                  organizationId: req.user!.organizationId,
                  ownerId: req.user!.id,
                },
              }).catch((): null => null);
              break;

            case 'CREATE_TASK': {
              const dueDate = data.dueDate || data.deadline;
              let parsedDueDate: Date | null = null;
              if (dueDate) {
                const d = new Date(dueDate);
                if (!isNaN(d.getTime())) parsedDueDate = d;
              }
              createdEntity = await prisma.task.create({
                data: {
                  title: data.title || 'Zadanie z sugestii AI',
                  description: data.description || null,
                  priority: data.priority || 'MEDIUM',
                  status: 'NEW',
                  dueDate: parsedDueDate,
                  createdById: req.user!.id,
                  organizationId: req.user!.organizationId,
                },
              }).catch((): null => null);
              break;
            }

            case 'BLACKLIST_DOMAIN':
              if (data?.domain) {
                await prisma.email_domain_rules.create({
                  data: {
                    pattern: data.domain,
                    patternType: 'DOMAIN',
                    listType: 'BLACKLIST',
                    classification: data.classification || 'NEWSLETTER',
                    source: 'AI_SUGGESTED',
                    reason: 'Bulk accept',
                    confidence: (suggestion.confidence || 0) / 100,
                    createdBy: req.user!.id,
                    organizationId: req.user!.organizationId,
                  },
                }).catch((): null => null);
              }
              break;
          }

          await prisma.ai_suggestions.update({
            where: { id },
            data: {
              status: 'ACCEPTED',
              resolved_at: new Date(),
              user_modifications: { acceptedBy: req.user!.id, bulk: true },
            },
          });
          results.accepted++;
          if (createdEntity) {
            results.created.push({ id: createdEntity.id, type: suggestion.context });
          }
        } else {
          // reject
          await prisma.ai_suggestions.update({
            where: { id },
            data: {
              status: 'REJECTED',
              resolved_at: new Date(),
              user_modifications: { rejectedBy: req.user!.id, bulk: true },
            },
          });
          results.rejected++;
        }
      }

      logger.info(`Bulk ${action}: ${results.accepted} accepted, ${results.rejected} rejected by ${req.user!.email}`);
      return res.json({ success: true, data: results });
    } catch (error) {
      logger.error('Failed to bulk action suggestions:', error);
      throw new AppError('Nie udalo sie wykonac akcji zbiorczej', 500);
    }
  }
);

export default router;
