/**
 * 🔍 Public Search API Demo
 * No authentication required for testing
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const router = Router();

/**
 * POST /api/v1/search-public/demo
 * Demo search without authentication
 */
router.post('/demo', async (req, res) => {
  try {
    const { query, types, limit } = z.object({
      query: z.string().min(1).max(500),
      types: z.array(z.enum(['task', 'project', 'contact', 'company', 'deal', 'communication', 'knowledge', 'activity'])).optional(),
      limit: z.number().min(1).max(50).default(20)
    }).parse(req.body);

    console.log(`🔍 Demo search: "${query}"`);

    // Try to use real vectors table if available
    let searchResults = [];
    try {
      // Search in actual vectors table  
      const vectorResults = await prisma.$queryRaw`
        SELECT * FROM vectors 
        WHERE content ILIKE ${'%' + query + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      
      searchResults = vectorResults.map((row: any, index: number) => ({
        id: row.id,
        type: row.metadata.type || 'unknown',
        entityId: row.metadata.entityId || row.id,
        title: `Real result: ${query}`,
        summary: row.content.substring(0, 150) + '...',
        content: row.content,
        metadata: row.metadata,
        relevanceScore: Math.max(0.5, 1 - (index * 0.1)) // Simple relevance scoring
      }));
      
      console.log(`Found ${searchResults.length} real vector results for query: "${query}"`);
    } catch (error) {
      console.error('Failed to search vectors table, using demo:', error);
      console.error('Error details:', error.message);
      searchResults = generateDemoSearchResults(query, types, limit);
    }
    
    // If no real results, fall back to demo
    if (searchResults.length === 0) {
      searchResults = generateDemoSearchResults(query, types, limit);
    }

    const response = {
      query,
      keywords: query.split(' ').filter(w => w.length > 2),
      totalResults: searchResults.length,
      results: searchResults,
      groupedResults: groupResultsByType(searchResults),
      stats: {
        byType: getStatsByType(searchResults),
        searchTime: Math.random() * 100 + 50 // 50-150ms
      }
    };

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate demo search results
 */
function generateDemoSearchResults(query: string, types?: string[], limit: number = 20) {
  const allTypes = ['task', 'project', 'contact', 'company', 'deal', 'communication', 'knowledge', 'activity'];
  const searchTypes = types || allTypes;
  
  const demoData = [
    {
      id: '1',
      type: 'task',
      entityId: 'task-1',
      title: `Zadanie związane z: ${query}`,
      summary: `To jest demo zadanie które pasuje do wyszukiwania "${query}"`,
      content: `Szczegółowy opis zadania zawierający słowa kluczowe: ${query}`,
      metadata: {
        type: 'task',
        source: 'tasks',
        importance: 8,
        tags: ['demo', 'search', 'task'],
        createdAt: '2025-06-26T06:00:00Z',
        updatedAt: '2025-06-26T06:00:00Z'
      },
      relevanceScore: 0.95
    },
    {
      id: '2',
      type: 'project',
      entityId: 'project-1',
      title: `Projekt demo: ${query}`,
      summary: `Demo projekt dla wyszukiwania "${query}"`,
      content: `Opis projektu zawierający frazę: ${query}`,
      metadata: {
        type: 'project',
        source: 'projects',
        importance: 9,
        tags: ['demo', 'search', 'project'],
        createdAt: '2025-06-25T10:00:00Z',
        updatedAt: '2025-06-26T05:00:00Z'
      },
      relevanceScore: 0.88
    },
    {
      id: '3',
      type: 'contact',
      entityId: 'contact-1',
      title: `Kontakt: Jan Kowalski (${query})`,
      summary: `Demo kontakt powiązany z "${query}"`,
      content: `Kontakt z notatkami o: ${query}`,
      metadata: {
        type: 'contact',
        source: 'contacts',
        importance: 7,
        tags: ['demo', 'search', 'contact'],
        createdAt: '2025-06-20T14:00:00Z',
        updatedAt: '2025-06-25T12:00:00Z'
      },
      relevanceScore: 0.76
    },
    {
      id: '4',
      type: 'company',
      entityId: 'company-1',
      title: `Firma ABC Corp (${query})`,
      summary: `Demo firma związana z "${query}"`,
      content: `Informacje o firmie dotyczące: ${query}`,
      metadata: {
        type: 'company',
        source: 'companies',
        importance: 8,
        tags: ['demo', 'search', 'company'],
        createdAt: '2025-06-18T09:00:00Z',
        updatedAt: '2025-06-24T16:00:00Z'
      },
      relevanceScore: 0.82
    },
    {
      id: '5',
      type: 'knowledge',
      entityId: 'knowledge-1',
      title: `Artykuł: ${query} w praktyce`,
      summary: `Demo artykuł o "${query}"`,
      content: `Szczegółowy artykuł omawiający temat: ${query}`,
      metadata: {
        type: 'knowledge',
        source: 'knowledge',
        importance: 6,
        tags: ['demo', 'search', 'knowledge'],
        createdAt: '2025-06-15T11:00:00Z',
        updatedAt: '2025-06-22T14:00:00Z'
      },
      relevanceScore: 0.71
    }
  ];

  // Filter by types and limit
  return demoData
    .filter(item => searchTypes.includes(item.type))
    .slice(0, limit);
}

/**
 * Group results by type
 */
function groupResultsByType(results: any[]) {
  return results.reduce((groups, result) => {
    const type = result.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {} as Record<string, any[]>);
}

/**
 * Get statistics by type
 */
function getStatsByType(results: any[]) {
  const stats = results.reduce((acc, result) => {
    const type = result.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(stats).map(([type, count]) => ({ type, count }));
}

export default router;