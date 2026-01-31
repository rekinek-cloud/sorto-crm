import { AppMapping, ClassificationResult, DEFAULT_APP_MAPPINGS, ParsedConversation } from '../types';

export class ClassifierService {
  private appMappings: AppMapping[];

  constructor(customMappings?: AppMapping[]) {
    this.appMappings = customMappings || DEFAULT_APP_MAPPINGS;
  }

  /**
   * Classify a conversation based on keywords in title and content
   */
  classify(conversation: ParsedConversation): ClassificationResult {
    const textToAnalyze = this.prepareText(conversation);
    const results: { appName: string; score: number; keywords: string[] }[] = [];

    for (const mapping of this.appMappings) {
      if (mapping.keywords.length === 0) continue; // Skip default/fallback

      const matchedKeywords: string[] = [];
      let score = 0;

      for (const keyword of mapping.keywords) {
        const keywordLower = keyword.toLowerCase();
        const occurrences = this.countOccurrences(textToAnalyze, keywordLower);

        if (occurrences > 0) {
          matchedKeywords.push(keyword);
          // Score based on keyword presence and frequency
          score += Math.min(occurrences * 0.1, 1); // Cap at 1 per keyword
        }
      }

      if (matchedKeywords.length > 0) {
        // Normalize score based on total keywords matched
        const normalizedScore = Math.min(score / mapping.keywords.length * 2, 1);
        results.push({
          appName: mapping.appName,
          score: normalizedScore,
          keywords: matchedKeywords,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return best match or default to 'general'
    if (results.length > 0 && results[0].score > 0.1) {
      return results[0];
    }

    return {
      appName: 'general',
      score: 0,
      keywords: [],
    };
  }

  /**
   * Prepare text for analysis (combine title and messages)
   */
  private prepareText(conversation: ParsedConversation): string {
    const parts: string[] = [conversation.title.toLowerCase()];

    // Include first few messages (most relevant for classification)
    const messagesToInclude = Math.min(conversation.messages.length, 5);
    for (let i = 0; i < messagesToInclude; i++) {
      parts.push(conversation.messages[i].content.toLowerCase());
    }

    return parts.join(' ');
  }

  /**
   * Count occurrences of a keyword in text
   */
  private countOccurrences(text: string, keyword: string): number {
    const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Add custom app mapping
   */
  addMapping(mapping: AppMapping): void {
    const existingIndex = this.appMappings.findIndex((m) => m.appName === mapping.appName);
    if (existingIndex >= 0) {
      this.appMappings[existingIndex] = mapping;
    } else {
      this.appMappings.push(mapping);
    }
  }

  /**
   * Get all mappings
   */
  getMappings(): AppMapping[] {
    return [...this.appMappings];
  }
}
