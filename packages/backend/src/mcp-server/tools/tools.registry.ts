/**
 * MCP Tools Registry
 * Definicje wszystkich dostępnych narzędzi MCP
 */

import { McpTool } from '../types/mcp.types';

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'search',
    description: `Szukaj w CRM - firmy, kontakty, leady, deale, zadania.
Rozumie naturalny język, np. "leady z IT", "firmy z Poznania", "zadania na dziś", "kontakty CEO".
Zwraca listę wyników z podstawowymi informacjami.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Zapytanie w naturalnym języku, np. "firmy z branży IT", "leady powyżej 50K", "zadania zaległe"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_details',
    description: 'Pobierz szczegółowe informacje o konkretnym obiekcie (firma, kontakt, deal, zadanie, stream)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['company', 'contact', 'deal', 'task', 'stream'],
          description: 'Typ obiektu do pobrania',
        },
        id: {
          type: 'string',
          description: 'ID obiektu (UUID)',
        },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'create_note',
    description: 'Dodaj notatkę do firmy, kontaktu lub deala. Notatka zostanie zapisana z aktualną datą.',
    inputSchema: {
      type: 'object',
      properties: {
        target_type: {
          type: 'string',
          enum: ['company', 'contact', 'deal'],
          description: 'Typ obiektu, do którego dodajemy notatkę',
        },
        target_id: {
          type: 'string',
          description: 'ID obiektu (UUID)',
        },
        content: {
          type: 'string',
          description: 'Treść notatki',
        },
      },
      required: ['target_type', 'target_id', 'content'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Pokaż zadania - domyślnie na dziś. Można filtrować: dziś, zaległe, ten tydzień, wszystkie.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['today', 'overdue', 'this_week', 'all'],
          description: 'Filtr zadań (domyślnie: today)',
          default: 'today',
        },
      },
    },
  },
  {
    name: 'get_pipeline_stats',
    description: 'Statystyki pipeline sprzedaży - ile leadów na każdym etapie, wartość, konwersja',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export function getToolByName(name: string): McpTool | undefined {
  return MCP_TOOLS.find(tool => tool.name === name);
}
