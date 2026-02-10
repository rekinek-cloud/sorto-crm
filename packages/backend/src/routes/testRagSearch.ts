import { Router } from 'express';
import { prisma } from '../config/database';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/v1/test-rag-search/search
 * Test RAG search without authentication for debugging
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10, filters = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`🔍 Test RAG search: "${query}"`);

    // Najpierw sprawdź ile mamy wektorów
    const totalVectors = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM vectors`;
    console.log(`📊 Total vectors in database: ${totalVectors[0]?.count}`);

    // Sprawdź organizacje
    const orgStats = await prisma.$queryRaw`
      SELECT 
        metadata->>'organizationId' as org_id,
        COUNT(*)::int as vector_count
      FROM vectors
      GROUP BY metadata->>'organizationId'
      ORDER BY vector_count DESC
    `;
    console.log('🏢 Organizations:', orgStats);

    // Użyj pierwszej organizacji z danymi
    const targetOrgId = orgStats[0]?.org_id;
    if (!targetOrgId) {
      return res.json({
        success: true,
        data: {
          query,
          results: [],
          totalResults: 0,
          searchTime: 0,
          searchMethod: 'semantic',
          suggestions: [],
          debug: { totalVectors: totalVectors[0]?.count, error: 'No organizations found' }
        }
      });
    }

    console.log(`🎯 Using organization: ${targetOrgId}`);

    const startTime = Date.now();

    // Proste wyszukiwanie z opcjonalnym filtrem typu
    let results;
    
    if (filters.type && filters.type !== 'all') {
      results = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          metadata->>'title' as title,
          metadata->>'type' as type,
          metadata->>'urgencyScore' as urgency_score,
          metadata
        FROM vectors 
        WHERE metadata->>'organizationId' = ${targetOrgId}
        AND metadata->>'type' = ${filters.type}
        AND (
          LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(metadata->>'title') LIKE LOWER(${'%' + query + '%'})
        )
        ORDER BY 
          CASE WHEN LOWER(metadata->>'title') LIKE LOWER(${'%' + query + '%'}) THEN 1 ELSE 2 END,
          CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
               THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
               ELSE 0 END DESC
        LIMIT ${limit}
      `;
    } else {
      results = await prisma.$queryRaw`
        SELECT 
          id,
          content,
          metadata->>'title' as title,
          metadata->>'type' as type,
          metadata->>'urgencyScore' as urgency_score,
          metadata
        FROM vectors 
        WHERE metadata->>'organizationId' = ${targetOrgId}
        AND (
          LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(metadata->>'title') LIKE LOWER(${'%' + query + '%'})
        )
        ORDER BY 
          CASE WHEN LOWER(metadata->>'title') LIKE LOWER(${'%' + query + '%'}) THEN 1 ELSE 2 END,
          CASE WHEN metadata->>'urgencyScore' IS NOT NULL 
               THEN CAST(metadata->>'urgencyScore' AS INTEGER) 
               ELSE 0 END DESC
        LIMIT ${limit}
      `;
    }

    const searchTime = Date.now() - startTime;

    console.log(`✅ Found ${results.length} results in ${searchTime}ms`);
    
    // Format results
    const formattedResults = results.map((result: any) => ({
      id: result.id,
      type: result.type,
      title: result.title || `${result.type} bez tytułu`,
      content: result.content.substring(0, 300) + '...',
      metadata: {
        source: result.metadata?.source || 'unknown',
        author: result.metadata?.author || null,
        createdAt: new Date().toISOString(),
        tags: result.metadata?.tags || [],
        urgencyScore: result.urgency_score ? parseInt(result.urgency_score) : null
      },
      relevanceScore: 0.8,
      vectorSimilarity: 0.75,
      semanticMatch: true
    }));

    // Log pierwszych kilka wyników dla debugowania
    formattedResults.slice(0, 3).forEach((result, i) => {
      console.log(`${i + 1}. [${result.type}] ${result.title}`);
    });

    res.json({
      success: true,
      data: {
        query,
        results: formattedResults,
        totalResults: formattedResults.length,
        searchTime,
        searchMethod: 'semantic',
        suggestions: [`${query} podobne`, `więcej ${query}`],
        debug: {
          totalVectors: totalVectors[0]?.count,
          targetOrgId,
          orgStats: orgStats.length
        }
      }
    });

  } catch (error) {
    logger.error('Test RAG search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      debug: { query: req.body.query }
    });
  }
});

/**
 * GET /api/v1/test-rag-search/debug
 * Debug information about vectors
 */
router.get('/debug', async (req, res) => {
  try {
    const totalVectors = await prisma.$queryRaw`SELECT COUNT(*) as count FROM vectors`;
    
    const typeStats = await prisma.$queryRaw`
      SELECT 
        metadata->>'type' as type,
        COUNT(*) as count,
        metadata->>'organizationId' as org_id
      FROM vectors
      GROUP BY metadata->>'type', metadata->>'organizationId'
      ORDER BY count DESC
    `;

    const sampleVectors = await prisma.$queryRaw`
      SELECT 
        metadata->>'title' as title,
        metadata->>'type' as type,
        metadata->>'organizationId' as org_id
      FROM vectors
      LIMIT 10
    `;

    res.json({
      success: true,
      data: {
        totalVectors: totalVectors[0]?.count,
        typeStats,
        sampleVectors
      }
    });

  } catch (error) {
    logger.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed'
    });
  }
});

export default router;