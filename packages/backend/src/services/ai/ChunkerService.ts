/**
 * Chunker Service
 * Splits documents into chunks for RAG processing
 * Supports text, markdown, and code files
 */

export interface ChunkResult {
  content: string;
  metadata: {
    section?: string | null;
    level?: number;
    part?: string | null;
    type?: string;
    language?: string;
    name?: string | null;
    lines?: string;
  };
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;  // ~500 tokens per chunk
const DEFAULT_OVERLAP = 50;     // overlap between chunks

export class ChunkerService {
  /**
   * Split plain text into chunks
   * @param text - Text to split
   * @param options - Chunking options
   * @returns Array of text chunks
   */
  static chunkText(text: string, options: ChunkOptions = {}): string[] {
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap || DEFAULT_OVERLAP;

    // Split into sentences
    const sentences = text
      .replace(/\n+/g, '\n')
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim());

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.split(/\s+/).length;

      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        // Save chunk
        chunks.push(currentChunk.join(' '));

        // Overlap - keep last sentences
        const overlapSentences: string[] = [];
        let overlapLength = 0;
        for (let i = currentChunk.length - 1; i >= 0 && overlapLength < overlap; i--) {
          overlapSentences.unshift(currentChunk[i]);
          overlapLength += currentChunk[i].split(/\s+/).length;
        }

        currentChunk = overlapSentences;
        currentLength = overlapLength;
      }

      currentChunk.push(sentence);
      currentLength += sentenceLength;
    }

    // Last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Split markdown into chunks (preserving sections)
   * @param markdown - Markdown content
   * @param options - Chunking options
   * @returns Array of chunks with metadata
   */
  static chunkMarkdown(markdown: string, options: ChunkOptions = {}): ChunkResult[] {
    const chunks: ChunkResult[] = [];

    // Split by headers
    const sections = markdown.split(/(?=^#{1,3}\s)/m);

    for (const section of sections) {
      if (!section.trim()) continue;

      // Extract header
      const headerMatch = section.match(/^(#{1,3})\s+(.+)$/m);
      const header = headerMatch ? headerMatch[2].trim() : null;
      const level = headerMatch ? headerMatch[1].length : 0;

      // Split section content into chunks
      const textChunks = this.chunkText(section, options);

      for (let i = 0; i < textChunks.length; i++) {
        chunks.push({
          content: textChunks[i],
          metadata: {
            section: header,
            level: level,
            part: textChunks.length > 1 ? `${i + 1}/${textChunks.length}` : null,
          },
        });
      }
    }

    return chunks;
  }

  /**
   * Split code into chunks (by functions/classes)
   * @param code - Code content
   * @param language - Programming language
   * @returns Array of chunks with metadata
   */
  static chunkCode(code: string, language: string = 'javascript'): ChunkResult[] {
    const chunks: ChunkResult[] = [];

    // For JS/TS - split by functions and classes
    if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(language.toLowerCase())) {
      // Regex for functions and classes
      const functionRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>|class\s+\w+)[^]*?(?=\n(?:export\s+)?(?:async\s+)?(?:function|const\s+\w+\s*=|class)|$)/g;

      let match;
      while ((match = functionRegex.exec(code)) !== null) {
        const content = match[0].trim();
        if (content.length > 50) {  // Ignore too short
          // Extract function/class name
          const nameMatch = content.match(/(?:function|const|class)\s+(\w+)/);
          chunks.push({
            content: content,
            metadata: {
              type: 'code',
              language: language,
              name: nameMatch ? nameMatch[1] : null,
            },
          });
        }
      }
    }

    // Fallback - split by lines
    if (chunks.length === 0) {
      const lines = code.split('\n');
      const chunkSize = 50;  // ~50 lines per chunk

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunkLines = lines.slice(i, i + chunkSize);
        chunks.push({
          content: chunkLines.join('\n'),
          metadata: {
            type: 'code',
            language: language,
            lines: `${i + 1}-${Math.min(i + chunkSize, lines.length)}`,
          },
        });
      }
    }

    return chunks;
  }

  /**
   * Estimate token count for text
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  static estimateTokens(text: string): number {
    // ~4 characters = 1 token (approximation)
    return Math.ceil(text.length / 4);
  }

  /**
   * Auto-detect content type and chunk accordingly
   * @param content - Content to chunk
   * @param filename - Optional filename for type detection
   * @returns Array of chunks with metadata
   */
  static autoChunk(content: string, filename?: string): ChunkResult[] {
    // Detect type from filename
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();

      if (['md', 'markdown'].includes(ext || '')) {
        return this.chunkMarkdown(content);
      }

      if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'php', 'go', 'rs', 'rb'].includes(ext || '')) {
        return this.chunkCode(content, ext || 'text');
      }
    }

    // Default to text chunking
    return this.chunkText(content).map(c => ({
      content: c,
      metadata: {},
    }));
  }
}

export default ChunkerService;
