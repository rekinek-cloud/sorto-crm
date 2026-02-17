/**
 * MCP Server Controller
 * Endpointy MCP protocol
 */

import { Request, Response } from 'express';
import { mcpServerService } from './mcp-server.service';
import { McpRequest } from './types/mcp.types';
import logger from '../config/logger';

export class McpServerController {
  /**
   * GET /mcp
   * Podstawowe info o MCP server
   */
  async getInfo(req: Request, res: Response): Promise<any> {
    return res.json({
      name: 'Sorto CRM MCP Server',
      version: '1.0.0',
      description: 'Rozmawiaj ze swoim CRM przez ChatGPT, Claude lub Cursor',
      endpoints: {
        listTools: 'POST /mcp/tools/list',
        callTool: 'POST /mcp/tools/call',
      },
    });
  }

  /**
   * POST /mcp/tools/list
   * Zwraca listę dostępnych narzędzi MCP
   */
  async listTools(req: Request, res: Response): Promise<any> {
    try {
      const mcpReq = req as McpRequest;
      const tools = mcpServerService.getAvailableTools();

      logger.info(`[McpController] Tools list requested by org: ${mcpReq.mcpContext.organization.name}`);

      return res.json({ tools });
    } catch (error) {
      logger.error('[McpController] listTools error:', error);
      return res.status(500).json({
        error: 'Błąd pobierania listy narzędzi',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * POST /mcp/tools/call
   * Wywołuje narzędzie MCP
   */
  async callTool(req: Request, res: Response): Promise<any> {
    try {
      const mcpReq = req as McpRequest;
      const { name, arguments: args } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Brak nazwy narzędzia',
          code: 'MISSING_TOOL_NAME',
        });
        return;
      }

      logger.info(`[McpController] Tool call: ${name}`, {
        org: mcpReq.mcpContext.organization.name,
        args,
      });

      const result = await mcpServerService.executeTool(
        name,
        args || {},
        mcpReq.mcpContext
      );

      return res.json(result);
    } catch (error) {
      logger.error('[McpController] callTool error:', error);
      return res.status(500).json({
        content: [{
          type: 'text',
          text: 'Błąd wykonania narzędzia',
        }],
        isError: true,
      });
    }
  }
}

export const mcpServerController = new McpServerController();
