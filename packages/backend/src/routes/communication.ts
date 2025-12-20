import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken as requireAuth, AuthenticatedRequest } from '../shared/middleware/auth';
import { emailService, EmailConfig } from '../services/emailService';
import { slackService, SlackConfig } from '../services/slackService';
import { processMessageContent } from '../services/messageProcessor';
import { aiAnalysisService } from '../services/aiAnalysisService';

const router = express.Router();
const prisma = new PrismaClient();

// Get all communication channels for organization
router.get('/channels', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const channels = await prisma.communicationChannel.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        streamChannels: {
          include: { stream: true }
        },
        processingRules: {
          where: { active: true }
        },
        _count: {
          select: {
            messages: {
              where: { isRead: false }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Create new communication channel
router.post('/channels', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      type,
      emailAddress,
      displayName,
      config,
      autoProcess = true,
      createTasks = false,
      defaultStream
    } = req.body;

    // Validate config based on type (skip validation in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log(`Creating channel in ${isDevelopment ? 'development' : 'production'} mode`);
    
    if (type === 'EMAIL' && !isDevelopment) {
      const emailConfig = config as EmailConfig;
      const isValid = await emailService.testConnection(emailConfig);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid email configuration' });
      }
    } else if (type === 'SLACK' && !isDevelopment) {
      const slackConfig = config as SlackConfig;
      const isValid = await slackService.testConnection(slackConfig);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Slack configuration' });
      }
    }

    const channel = await prisma.communicationChannel.create({
      data: {
        name,
        type,
        emailAddress,
        displayName,
        config,
        autoProcess,
        createTasks,
        defaultStream,
        organizationId: req.user!.organizationId,
        userId: req.user!.id
      }
    });

    // Start monitoring if auto process is enabled
    if (autoProcess) {
      if (type === 'EMAIL') {
        await emailService.connectToChannel(channel.id);
      } else if (type === 'SLACK') {
        await slackService.connectToChannel(channel.id);
      }
    }

    return res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Update communication channel
router.put('/channels/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const updatedChannel = await prisma.communicationChannel.update({
      where: { id },
      data: updates
    });

    // Restart monitoring if config changed
    if (updates.config) {
      if (channel.type === 'EMAIL') {
        await emailService.disconnectChannel(id);
        if (updatedChannel.autoProcess) {
          await emailService.connectToChannel(id);
        }
      } else if (channel.type === 'SLACK') {
        await slackService.disconnectChannel(id);
        if (updatedChannel.autoProcess) {
          await slackService.connectToChannel(id);
        }
      }
    }

    return res.json(updatedChannel);
  } catch (error) {
    console.error('Error updating channel:', error);
    return res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete communication channel
router.delete('/channels/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Disconnect service
    if (channel.type === 'EMAIL') {
      await emailService.disconnectChannel(id);
    } else if (channel.type === 'SLACK') {
      await slackService.disconnectChannel(id);
    }

    await prisma.communicationChannel.delete({
      where: { id }
    });

    return res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Test email connection
router.post('/channels/test-email', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const config = req.body as EmailConfig;
    const isValid = await emailService.testConnection(config);
    
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// Test Slack connection
router.post('/channels/test-slack', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const config = req.body as SlackConfig;
    const isValid = await slackService.testConnection(config);
    
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error testing Slack connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

// Sync Slack messages for a channel
router.post('/channels/:id/sync-slack', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
        type: 'SLACK'
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Slack channel not found' });
    }

    const result = await slackService.syncMessages(id);
    
    return res.json({
      message: 'Slack sync completed',
      syncedCount: result.syncedCount,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error syncing Slack messages:', error);
    return res.status(500).json({ error: 'Failed to sync Slack messages' });
  }
});

// Sync Email messages for a channel
router.post('/channels/:id/sync-email', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
        type: 'EMAIL'
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Email channel not found' });
    }

    const result = await emailService.syncMessages(id);
    
    return res.json({
      message: 'Email sync completed',
      syncedCount: result.syncedCount,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error syncing Email messages:', error);
    return res.status(500).json({ error: 'Failed to sync Email messages' });
  }
});

// General sync endpoint for any channel type
router.post('/channels/:id/sync', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    let result;
    
    if (channel.type === 'EMAIL') {
      result = await emailService.syncMessages(id);
    } else if (channel.type === 'SLACK') {
      result = await slackService.syncMessages(id);
    } else {
      return res.status(400).json({ 
        error: `Sync not supported for channel type: ${channel.type}` 
      });
    }
    
    return res.json({
      message: `${channel.type} sync completed`,
      syncedCount: result.syncedCount,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error syncing channel:', error);
    return res.status(500).json({ error: 'Failed to sync channel' });
  }
});

// Get Slack channels for a connected workspace
router.get('/channels/:id/slack-channels', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId,
        type: 'SLACK'
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Slack channel not found' });
    }

    const slackChannels = await slackService.getChannels(id);
    
    return res.json(slackChannels);
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    return res.status(500).json({ error: 'Failed to fetch Slack channels' });
  }
});

// Get messages for organization
router.get('/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      channelId, 
      unreadOnly = 'false', 
      limit = '50', 
      offset = '0',
      search 
    } = req.query;

    const where: any = {
      organizationId: req.user!.organizationId
    };

    if (channelId) {
      where.channelId = channelId;
    }

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { fromAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        channel: {
          select: { name: true, type: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        attachments: true,
        processingResults: {
          include: { rule: true }
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message details
router.get('/messages/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      },
      include: {
        channel: true,
        task: true,
        attachments: true,
        processingResults: {
          include: { rule: true }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read
    await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Mark message as read
router.put('/messages/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Message marked as read', data: updatedMessage });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Send email
router.post('/messages/send', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId, to, subject, content, html } = req.body;

    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id: channelId,
        organizationId: req.user!.organizationId,
        type: 'EMAIL'
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Email channel not found' });
    }

    await emailService.sendEmail(channelId, to, subject, content, html);

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Reprocess message
router.post('/messages/:id/reprocess', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Create EmailMessage object for reprocessing
    const emailMessage = {
      messageId: message.messageId || '',
      from: { address: message.fromAddress, name: message.fromName || undefined },
      to: [{ address: message.toAddress }],
      subject: message.subject || '',
      text: message.content,
      html: message.htmlContent || undefined,
      date: message.sentAt || message.receivedAt
    };

    const results = await processMessageContent(id, emailMessage);

    res.json({ 
      message: 'Message reprocessed successfully',
      results 
    });
  } catch (error) {
    console.error('Error reprocessing message:', error);
    res.status(500).json({ error: 'Failed to reprocess message' });
  }
});

// Get processing rules
router.get('/processing-rules', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rules = await prisma.processingRule.findMany({
      where: { organizationId: req.user!.organizationId },
      include: {
        channel: {
          select: { name: true, type: true }
        },
        _count: {
          select: { processingResults: true }
        }
      },
      orderBy: { priority: 'desc' }
    });

    res.json(rules);
  } catch (error) {
    console.error('Error fetching processing rules:', error);
    res.status(500).json({ error: 'Failed to fetch processing rules' });
  }
});

// Create processing rule
router.post('/processing-rules', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      description,
      conditions,
      actions,
      priority = 0,
      channelId,
      active = true
    } = req.body;

    const rule = await prisma.processingRule.create({
      data: {
        name,
        description,
        conditions,
        actions,
        priority,
        channelId,
        active,
        organizationId: req.user!.organizationId
      }
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating processing rule:', error);
    res.status(500).json({ error: 'Failed to create processing rule' });
  }
});

// Update processing rule
router.put('/processing-rules/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await prisma.processingRule.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!rule) {
      return res.status(404).json({ error: 'Processing rule not found' });
    }

    const updatedRule = await prisma.processingRule.update({
      where: { id },
      data: updates
    });

    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating processing rule:', error);
    res.status(500).json({ error: 'Failed to update processing rule' });
  }
});

// Delete processing rule
router.delete('/processing-rules/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.processingRule.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      }
    });

    if (!rule) {
      return res.status(404).json({ error: 'Processing rule not found' });
    }

    await prisma.processingRule.delete({
      where: { id }
    });

    res.json({ message: 'Processing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting processing rule:', error);
    res.status(500).json({ error: 'Failed to delete processing rule' });
  }
});

// Connect stream to channel
router.post('/stream-channels', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      streamId,
      channelId,
      autoCreateTasks = false,
      defaultContext,
      defaultPriority = 'MEDIUM'
    } = req.body;

    // Verify stream and channel belong to organization
    const [stream, channel] = await Promise.all([
      prisma.stream.findFirst({
        where: { id: streamId, organizationId: req.user!.organizationId }
      }),
      prisma.communicationChannel.findFirst({
        where: { id: channelId, organizationId: req.user!.organizationId }
      })
    ]);

    if (!stream || !channel) {
      return res.status(404).json({ error: 'Stream or channel not found' });
    }

    const streamChannel = await prisma.streamChannel.create({
      data: {
        streamId,
        channelId,
        autoCreateTasks,
        defaultContext,
        defaultPriority
      }
    });

    res.status(201).json(streamChannel);
  } catch (error) {
    console.error('Error connecting stream to channel:', error);
    res.status(500).json({ error: 'Failed to connect stream to channel' });
  }
});

// Get statistics for communication overview
router.get('/statistics', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [
      totalChannels,
      unreadMessages,
      processedToday,
      tasksCreated
    ] = await Promise.all([
      prisma.communicationChannel.count({
        where: { 
          organizationId: req.user!.organizationId,
          active: true 
        }
      }),
      prisma.message.count({
        where: {
          organizationId: req.user!.organizationId,
          isRead: false
        }
      }),
      prisma.message.count({
        where: {
          organizationId: req.user!.organizationId,
          autoProcessed: true,
          receivedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.message.count({
        where: {
          organizationId: req.user!.organizationId,
          taskId: { not: null },
          receivedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      })
    ]);

    const autoProcessPercentage = processedToday > 0 
      ? Math.round((processedToday / (processedToday + unreadMessages)) * 100)
      : 0;

    res.json({
      totalChannels,
      unreadMessages,
      processedToday,
      tasksCreated,
      autoProcessPercentage
    });
  } catch (error) {
    console.error('Error fetching communication statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Manual AI Analysis endpoint
router.post('/messages/:id/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Find the message
    const message = await prisma.message.findFirst({
      where: {
        id,
        organizationId: req.user!.organizationId
      },
      include: {
        channel: true,
        contact: true,
        company: true,
        deal: true,
        task: true
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Convert to EmailMessage format for processing
    const emailMessage = {
      messageId: message.messageId || '',
      from: { address: message.fromAddress, name: message.fromName || undefined },
      to: [{ address: message.toAddress }],
      subject: message.subject || '',
      text: message.content,
      html: message.htmlContent || undefined,
      date: message.sentAt || message.receivedAt
    };

    // Run AI analysis first 
    const aiAnalysis = await aiAnalysisService.analyzeMessage(emailMessage);
    
    // Run full CRM-GTD-SMART analysis
    const results = await processMessageContent(id, emailMessage, req.user!.id);
    
    // Save AI analysis results
    await aiAnalysisService.saveAnalysisResults(id, aiAnalysis);

    // Get updated message with all new relationships
    const updatedMessage = await prisma.message.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    // Prepare response with analysis results
    const response = {
      success: true,
      message: 'AI analysis completed',
      urgencyScore: aiAnalysis.urgencyScore,
      actionNeeded: aiAnalysis.tasks.hasTasks,
      sentiment: aiAnalysis.sentiment.label,
      extractedTasks: aiAnalysis.tasks.extractedTasks,
      
      // AI Analysis details
      aiAnalysis: {
        sentiment: aiAnalysis.sentiment,
        tasks: aiAnalysis.tasks,
        category: aiAnalysis.category,
        complexity: aiAnalysis.complexity,
        keyTopics: aiAnalysis.keyTopics,
        summary: aiAnalysis.summary,
        recommendedActions: aiAnalysis.recommendedActions
      },
      
      // CRM data
      contactId: updatedMessage?.contactId,
      contact: updatedMessage?.contact,
      companyId: updatedMessage?.companyId,
      company: updatedMessage?.company,
      dealId: updatedMessage?.dealId,
      deal: updatedMessage?.deal,
      
      // GTD data
      taskId: updatedMessage?.taskId,
      task: updatedMessage?.task,
      
      // Processing results summary
      results: results.map(r => ({
        action: r.actionTaken,
        success: r.success,
        taskCreated: r.taskCreated,
        contactId: r.contactId,
        companyId: r.companyId,
        dealId: r.dealId
      })),
      
      // Friendly messages for UI
      taskCreated: results.some(r => r.taskCreated),
      taskTitle: updatedMessage?.task?.title,
      contactCreated: results.some(r => r.contactId && !message.contactId),
      contactName: updatedMessage?.contact ? `${updatedMessage.contact.firstName} ${updatedMessage.contact.lastName}` : null,
      dealCreated: results.some(r => r.dealId && !message.dealId),
      dealTitle: updatedMessage?.deal?.title
    };

    res.json(response);
  } catch (error) {
    console.error('Error analyzing message with AI:', error);
    res.status(500).json({ error: 'Failed to analyze message with AI' });
  }
});

export default router;