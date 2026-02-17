/**
 * 🔍 Universal Search API
 * Semantic search across all vectorized data
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticateUser } from '../shared/middleware/auth';
import { prisma } from '../config/database';


const router = Router();

// Extended Request type for auth
type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
};

/**
 * POST /api/v1/search/demo
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

    // Generate demo search results
    const demoResults = [
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
      }
    ].filter(item => !types || types.includes(item.type as any)).slice(0, limit);

    const response = {
      query,
      keywords: query.split(' ').filter(w => w.length > 2),
      totalResults: demoResults.length,
      results: demoResults,
      groupedResults: demoResults.reduce((groups: any, result) => {
        const type = result.type;
        if (!groups[type]) groups[type] = [];
        groups[type].push(result);
        return groups;
      }, {}),
      stats: {
        byType: demoResults.reduce((acc: any, result) => {
          const type = result.type;
          const existing = acc.find((item: any) => item.type === type);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ type, count: 1 });
          }
          return acc;
        }, []),
        searchTime: Math.random() * 100 + 50
      }
    };

    return res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Demo search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/search/universal
 * Universal semantic search across all data types
 */
router.post('/universal', authenticateUser, async (req: any, res) => {
  try {
    const { query, types, limit, includeContent } = z.object({
      query: z.string().min(1).max(500),
      types: z.array(z.enum(['task', 'project', 'contact', 'company', 'deal', 'communication', 'knowledge', 'activity'])).optional(),
      limit: z.number().min(1).max(50).default(20),
      includeContent: z.boolean().default(true)
    }).parse(req.body);

    const organizationId = req.user?.organizationId || 'test-org';
    const userEmail = req.user?.email || 'test@example.com';

    console.log(`🔍 Universal search from ${userEmail}: "${query}"`);

    // Extract keywords for search
    const keywords = extractKeywords(query);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    // Build search query
    let whereClause = `WHERE metadata->>'organizationId' = $1`;
    const params: any[] = [organizationId];
    let paramIndex = 1;

    // Filter by types if specified
    if (types && types.length > 0) {
      whereClause += ` AND metadata->>'type' = ANY($${++paramIndex})`;
      params.push(types);
    }

    // Search by keywords
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(() => {
        return `content ILIKE $${++paramIndex}`;
      });
      whereClause += ` AND (${keywordConditions.join(' OR ')})`;
      keywords.forEach(keyword => params.push(`%${keyword}%`));
    }

    // Execute search
    const searchQuery = `
      SELECT 
        id, 
        ${includeContent ? 'content,' : ''} 
        metadata,
        created_at,
        updated_at
      FROM vectors 
      ${whereClause}
      ORDER BY (metadata->>'importance')::int DESC, created_at DESC
      LIMIT $${++paramIndex}
    `;
    params.push(limit);

    const results = await prisma.$queryRawUnsafe(searchQuery, ...params) as any[];

    // Process results
    const searchResults = results.map((row: any) => ({
      id: row.id,
      type: row.metadata.type,
      entityId: row.metadata.entityId,
      title: extractTitle(row.content, row.metadata.type),
      summary: row.content.substring(0, 200) + (row.content.length > 200 ? '...' : ''),
      content: includeContent ? row.content : undefined,
      metadata: {
        type: row.metadata.type,
        source: row.metadata.source,
        importance: row.metadata.importance,
        tags: row.metadata.tags || [],
        createdAt: row.metadata.createdAt,
        updatedAt: row.metadata.updatedAt
      },
      relevanceScore: calculateRelevanceScore(query, row.content, row.metadata)
    }));

    // Sort by relevance
    searchResults.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    // Group by type for better UX
    const groupedResults = groupResultsByType(searchResults);

    return res.json({
      success: true,
      data: {
        query,
        keywords,
        totalResults: searchResults.length,
        results: searchResults,
        groupedResults,
        stats: {
          byType: calculateTypeStats(searchResults),
          searchTime: Date.now() - req.startTime
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Universal search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

/**
 * GET /api/v1/search/suggestions/:query
 * Get search suggestions based on existing data
 */
router.get('/suggestions/:query', authenticateUser, async (req: any, res) => {
  try {
    const { query } = req.params;
    const organizationId = req.user?.organizationId || 'test-org';

    if (!query || query.length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    // Get suggestions from vector content
    const suggestions = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT
        CASE
          WHEN metadata->>'type' = 'company' THEN regexp_replace(content, '^Firma: ([^\\n]+).*', '\\1')
          WHEN metadata->>'type' = 'contact' THEN regexp_replace(content, '^Kontakt: ([^\\n]+).*', '\\1')
          WHEN metadata->>'type' = 'task' THEN regexp_replace(content, '^Zadanie: ([^\\n]+).*', '\\1')
          WHEN metadata->>'type' = 'project' THEN regexp_replace(content, '^Projekt: ([^\\n]+).*', '\\1')
          WHEN metadata->>'type' = 'deal' THEN regexp_replace(content, '^Deal: ([^\\n]+).*', '\\1')
          ELSE 'Nieznany typ'
        END as suggestion,
        metadata->>'type' as type
      FROM vectors
      WHERE metadata->>'organizationId' = $1
      AND content ILIKE $2
      LIMIT 10
    `, organizationId, `%${query}%`) as any[];

    return res.json({
      success: true,
      data: {
        suggestions: suggestions.map((s: any) => ({
          text: s.suggestion,
          type: s.type
        }))
      }
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

/**
 * GET /api/v1/search/stats
 * Get search statistics
 */
router.get('/stats', authenticateUser, async (req: any, res) => {
  try {
    const organizationId = req.user?.organizationId || 'test-org';

    const stats = await prisma.$queryRawUnsafe(`
      SELECT
        metadata->>'type' as type,
        COUNT(*) as count,
        AVG((metadata->>'importance')::int) as avg_importance
      FROM vectors
      WHERE metadata->>'organizationId' = $1
      GROUP BY metadata->>'type'
      ORDER BY count DESC
    `, organizationId) as any[];

    const totalVectors = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM vectors
      WHERE metadata->>'organizationId' = $1
    `, organizationId) as any[];

    return res.json({
      success: true,
      data: {
        totalVectors: Number(totalVectors[0]?.total || 0),
        byType: stats.map((s: any) => ({
          type: s.type,
          count: Number(s.count),
          avgImportance: Number(s.avg_importance).toFixed(1)
        })),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get search statistics'
    });
  }
});

// Helper functions
function extractKeywords(query: string): string[] {
  const stopWords = ['i', 'a', 'o', 'w', 'z', 'na', 'do', 'od', 'dla', 'ze', 'czy', 'jak', 'co', 'gdzie', 'kiedy', 'który', 'która', 'które', 'jakie', 'jaką', 'jaki', 'mam', 'mamy', 'jest', 'są', 'będzie', 'będą', 'pokaż', 'znajdź', 'szukam', 'pokażesz', 'masz'];
  
  return query.toLowerCase()
    .replace(/[^\w\sąćęłńóśźż]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5); // Max 5 keywords
}

function extractTitle(content: string, type: string): string {
  const firstLine = content.split('\n')[0];
  
  switch (type) {
    case 'company':
      return firstLine.replace('Firma: ', '');
    case 'contact':
      return firstLine.replace('Kontakt: ', '');
    case 'task':
      return firstLine.replace('Zadanie: ', '');
    case 'project':
      return firstLine.replace('Projekt: ', '');
    case 'deal':
      return firstLine.replace('Deal: ', '');
    case 'communication':
      return firstLine.replace('Wiadomość: ', '');
    case 'knowledge':
      return firstLine.replace('Wiedza: ', '');
    case 'activity':
      return firstLine.replace('Aktywność: ', '');
    default:
      return firstLine.substring(0, 50);
  }
}

function calculateRelevanceScore(query: string, content: string, metadata: any): number {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match
  if (contentLower.includes(queryLower)) {
    score += 10;
  }
  
  // Word matches
  const queryWords = extractKeywords(query);
  queryWords.forEach(word => {
    if (contentLower.includes(word.toLowerCase())) {
      score += 3;
    }
  });
  
  // Type importance
  const typeScores = {
    deal: 9,
    project: 8,
    task: 7,
    knowledge: 6,
    communication: 5,
    company: 4,
    contact: 3,
    activity: 2
  };
  score += typeScores[metadata.type as keyof typeof typeScores] || 1;
  
  // Metadata importance
  score += metadata.importance || 0;
  
  return score;
}

function groupResultsByType(results: any[]): any {
  const grouped = results.reduce((acc, result) => {
    const type = result.metadata.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {});
  
  return grouped;
}

function calculateTypeStats(results: any[]): any[] {
  const stats = results.reduce((acc, result) => {
    const type = result.metadata.type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type]++;
    return acc;
  }, {});
  
  return Object.entries(stats).map(([type, count]) => ({ type, count }));
}

export default router;
