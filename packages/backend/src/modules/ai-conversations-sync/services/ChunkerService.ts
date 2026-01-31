import { ChunkData, ParsedConversation, ParsedMessage } from '../types';

// Tiktoken encoder interface
interface TiktokenEncoder {
  encode(text: string): number[];
  decode(tokens: number[]): string;
}

// Import tiktoken dynamically to handle potential missing dependency
let tiktokenEncoder: TiktokenEncoder | null = null;
let tiktokenLoadAttempted = false;

async function getEncoder(): Promise<TiktokenEncoder | null> {
  if (tiktokenEncoder) return tiktokenEncoder;
  if (tiktokenLoadAttempted) return null;

  tiktokenLoadAttempted = true;

  try {
    // Dynamic import with error handling
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tiktoken = await (async (): Promise<{ encoding_for_model?: (model: string) => TiktokenEncoder } | null> => {
      try {
        return require('tiktoken');
      } catch {
        return null;
      }
    })();
    if (tiktoken && tiktoken.encoding_for_model) {
      tiktokenEncoder = tiktoken.encoding_for_model('gpt-4');
      return tiktokenEncoder;
    }
  } catch {
    // Silently fail - tiktoken is optional
  }

  console.warn('tiktoken not available, using fallback token counting');
  return null;
}

export class ChunkerService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(chunkSize = 500, chunkOverlap = 50) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Chunk conversation content for RAG indexing
   */
  async chunkConversation(conversation: ParsedConversation): Promise<ChunkData[]> {
    const chunks: ChunkData[] = [];
    const fullText = this.prepareConversationText(conversation);

    // Get encoder for accurate token counting
    const encoder = await getEncoder();

    if (encoder) {
      // Use tiktoken for accurate chunking
      const tokens = encoder.encode(fullText);
      chunks.push(...this.chunkByTokens(fullText, tokens, encoder));
    } else {
      // Fallback: approximate word-based chunking
      chunks.push(...this.chunkByWords(fullText));
    }

    return chunks;
  }

  /**
   * Prepare conversation text for chunking
   * Format: [Role]: Content
   */
  private prepareConversationText(conversation: ParsedConversation): string {
    const parts: string[] = [`Title: ${conversation.title}`, ''];

    for (const message of conversation.messages) {
      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      parts.push(`[${roleLabel}]: ${message.content}`);
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Chunk text using tiktoken tokens
   */
  private chunkByTokens(fullText: string, tokens: number[], encoder: any): ChunkData[] {
    const chunks: ChunkData[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < tokens.length; i += this.chunkSize - this.chunkOverlap) {
      const chunkTokens = tokens.slice(i, i + this.chunkSize);
      const chunkContent = encoder.decode(chunkTokens);

      chunks.push({
        content: chunkContent,
        chunkIndex,
        tokenCount: chunkTokens.length,
      });

      chunkIndex++;

      // Stop if we've reached the end
      if (i + this.chunkSize >= tokens.length) break;
    }

    return chunks;
  }

  /**
   * Fallback: chunk by words (approximate)
   * Assumes ~0.75 tokens per word on average
   */
  private chunkByWords(fullText: string): ChunkData[] {
    const chunks: ChunkData[] = [];
    const words = fullText.split(/\s+/);
    const wordsPerChunk = Math.floor(this.chunkSize * 0.75);
    const overlapWords = Math.floor(this.chunkOverlap * 0.75);
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const chunkContent = chunkWords.join(' ');
      const estimatedTokens = Math.ceil(chunkWords.length / 0.75);

      chunks.push({
        content: chunkContent,
        chunkIndex,
        tokenCount: estimatedTokens,
      });

      chunkIndex++;

      // Stop if we've reached the end
      if (i + wordsPerChunk >= words.length) break;
    }

    return chunks;
  }

  /**
   * Count tokens in text
   */
  async countTokens(text: string): Promise<number> {
    const encoder = await getEncoder();
    if (encoder) {
      return encoder.encode(text).length;
    }
    // Fallback: estimate based on words
    return Math.ceil(text.split(/\s+/).length / 0.75);
  }

  /**
   * Chunk a single message
   */
  async chunkMessage(message: ParsedMessage): Promise<ChunkData[]> {
    const encoder = await getEncoder();
    const text = `[${message.role === 'user' ? 'User' : 'Assistant'}]: ${message.content}`;

    if (encoder) {
      const tokens = encoder.encode(text);
      return this.chunkByTokens(text, tokens, encoder);
    }

    return this.chunkByWords(text);
  }
}
