/**
 * Embeddings Service
 * Generates vector embeddings using Qwen/OpenAI compatible API
 * Used for RAG (Retrieval-Augmented Generation)
 */

import OpenAI from 'openai';
import logger from '../../config/logger';

export const EMBEDDING_MODEL = 'text-embedding-v3';
export const EMBEDDING_DIMENSIONS = 1536;

export class EmbeddingsService {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.QWEN_API_KEY;
    if (!key) {
      throw new Error('QWEN_API_KEY not configured for embeddings');
    }

    this.client = new OpenAI({
      apiKey: key,
      baseURL: process.env.QWEN_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }

  /**
   * Generate embedding for a single text
   * @param text - Text to embed
   * @returns Vector of EMBEDDING_DIMENSIONS dimensions
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      logger.error('Failed to create embedding:', error);
      throw new Error(`Embedding creation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param texts - Array of texts to embed
   * @returns Array of vectors
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // Qwen supports batch up to 25 texts
    const batchSize = 25;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await this.client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch,
          dimensions: EMBEDDING_DIMENSIONS,
        });

        results.push(...response.data.map(d => d.embedding));
      } catch (error: any) {
        logger.error(`Failed to create embeddings for batch ${i}:`, error);
        throw new Error(`Batch embedding creation failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Format embedding vector for PostgreSQL pgvector
   * @param embedding - Vector array
   * @returns PostgreSQL vector string format
   */
  static formatForPostgres(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param a - First vector
   * @param b - Second vector
   * @returns Similarity score (0-1)
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default EmbeddingsService;
