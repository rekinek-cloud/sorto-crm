import OpenAI from 'openai';
import { ChunkData } from '../types';

export class EmbedderService {
  private openai: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(apiKey?: string, model = 'text-embedding-3-small', dimensions = 1536) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = model;
    this.dimensions = dimensions;
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        dimensions: this.dimensions,
      });

      return response.data.map((d) => d.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for chunks
   */
  async embedChunks(chunks: ChunkData[]): Promise<ChunkData[]> {
    if (chunks.length === 0) return [];

    const texts = chunks.map((c) => c.content);
    const embeddings = await this.embedBatch(texts);

    return chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));
  }

  /**
   * Generate embedding for search query
   */
  async embedQuery(query: string): Promise<number[]> {
    return this.embed(query);
  }

  /**
   * Process chunks in batches to avoid rate limits
   */
  async embedChunksWithRateLimit(
    chunks: ChunkData[],
    batchSize = 100,
    delayMs = 500
  ): Promise<ChunkData[]> {
    const results: ChunkData[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddedBatch = await this.embedChunks(batch);
      results.push(...embeddedBatch);

      // Add delay between batches to avoid rate limits
      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.model;
  }
}
