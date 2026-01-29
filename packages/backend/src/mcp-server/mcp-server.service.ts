/**
 * MCP Server Service
 * Główna logika MCP Server
 */

import { prisma } from '../config/database';
import { MCP_TOOLS, getToolByName } from './tools/tools.registry';
import { searchTool } from './tools/search.tool';
import { detailsTool } from './tools/details.tool';
import { notesTool } from './tools/notes.tool';
import { tasksTool } from './tools/tasks.tool';
import { statsTool } from './tools/stats.tool';
import {
  McpTool,
  McpToolCallResponse,
  McpRequestContext,
  ToolExecutionResult,
} from './types/mcp.types';
import logger from '../config/logger';

export class McpServerService {
  /**
   * Zwraca listę dostępnych narzędzi
   */
  getAvailableTools(): McpTool[] {
    return MCP_TOOLS;
  }

  /**
   * Wykonuje narzędzie MCP
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: McpRequestContext
  ): Promise<McpToolCallResponse> {
    const startTime = Date.now();

    try {
      logger.info(`[McpServer] Executing tool: ${toolName}`, { args, org: context.organization.id });

      // Sprawdź czy tool istnieje
      const tool = getToolByName(toolName);
      if (!tool) {
        await this.logUsage(context, toolName, args, false, Date.now() - startTime, `Nieznane narzędzie: ${toolName}`);
        return this.errorResponse(`Nieznane narzędzie: ${toolName}`);
      }

      // Wykonaj odpowiednie narzędzie
      let result: ToolExecutionResult;

      switch (toolName) {
        case 'search':
          result = await searchTool.execute(args.query, context.organization.id);
          break;

        case 'get_details':
          result = await detailsTool.execute(args.type, args.id, context.organization.id);
          break;

        case 'create_note':
          result = await notesTool.execute(
            args.target_type,
            args.target_id,
            args.content,
            context.organization.id
          );
          break;

        case 'list_tasks':
          result = await tasksTool.execute(args.filter || 'today', context.organization.id);
          break;

        case 'get_pipeline_stats':
          result = await statsTool.execute(context.organization.id);
          break;

        default:
          result = { success: false, error: `Narzędzie ${toolName} nie jest zaimplementowane` };
      }

      const responseTime = Date.now() - startTime;

      // Loguj użycie
      await this.logUsage(
        context,
        toolName,
        args,
        result.success,
        responseTime,
        result.error
      );

      if (result.success) {
        return this.successResponse(result.data || '');
      } else {
        return this.errorResponse(result.error || 'Błąd wykonania narzędzia');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Nieoczekiwany błąd';

      logger.error(`[McpServer] Tool execution error: ${toolName}`, error);

      await this.logUsage(context, toolName, args, false, responseTime, errorMessage);

      return this.errorResponse(errorMessage);
    }
  }

  /**
   * Loguje użycie narzędzia
   */
  private async logUsage(
    context: McpRequestContext,
    toolName: string,
    args: Record<string, any>,
    success: boolean,
    responseTimeMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.mcpUsageLog.create({
        data: {
          apiKeyId: context.apiKeyId,
          organizationId: context.organization.id,
          toolName,
          query: args.query || null,
          arguments: args,
          success,
          responseTimeMs,
          errorMessage: errorMessage || null,
        },
      });
    } catch (error) {
      // Nie przerywaj jeśli logowanie się nie powiodło
      logger.error('[McpServer] Failed to log usage:', error);
    }
  }

  /**
   * Tworzy odpowiedź sukcesu
   */
  private successResponse(text: string): McpToolCallResponse {
    return {
      content: [{ type: 'text', text }],
    };
  }

  /**
   * Tworzy odpowiedź błędu
   */
  private errorResponse(error: string): McpToolCallResponse {
    return {
      content: [{ type: 'text', text: `Błąd: ${error}` }],
      isError: true,
    };
  }
}

export const mcpServerService = new McpServerService();
