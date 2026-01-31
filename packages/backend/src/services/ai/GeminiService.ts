/**
 * Gemini Service
 * Vision, 1M context, streaming chat
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../config/logger';

// Models (January 2026)
export const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-2.5-pro',
  FLASH_25: 'gemini-2.5-flash',
} as const;

// Safety settings (relaxed for business use)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export class GeminiService {
  private client: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    this.client = new GoogleGenerativeAI(key);
  }

  /**
   * Simple chat
   */
  async chat(prompt: string, options: { model?: string } = {}): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || GEMINI_MODELS.FLASH,
      safetySettings,
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Streaming chat
   */
  async *chatStream(prompt: string, options: { model?: string } = {}): AsyncGenerator<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || GEMINI_MODELS.FLASH,
      safetySettings,
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /**
   * Analyze image from file path
   */
  async analyzeImage(
    imagePath: string,
    prompt: string = 'Opisz ten obraz szczegółowo po polsku.',
    options: { model?: string } = {}
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || GEMINI_MODELS.PRO,
      safetySettings,
    });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    return result.response.text();
  }

  /**
   * Analyze image from buffer
   */
  async analyzeImageBuffer(
    buffer: Buffer,
    mimeType: string,
    prompt: string = 'Opisz ten obraz.',
    options: { model?: string } = {}
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || GEMINI_MODELS.PRO,
      safetySettings,
    });

    const base64Image = buffer.toString('base64');

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    return result.response.text();
  }

  /**
   * Auto-tag image (returns JSON with tags, category, etc.)
   */
  async autoTagImage(imagePath: string): Promise<{
    tags: string[];
    category: string;
    description: string;
    mood: string;
    colors: string[];
    objects: string[];
    people: boolean;
    facesCount: number;
  }> {
    const prompt = `Przeanalizuj to zdjęcie i zwróć JSON z tagami.
Format odpowiedzi (tylko JSON, bez markdown):
{
  "tags": ["tag1", "tag2", "tag3"],
  "category": "kategoria główna",
  "description": "krótki opis po polsku",
  "mood": "nastrój zdjęcia",
  "colors": ["kolor1", "kolor2"],
  "objects": ["obiekt1", "obiekt2"],
  "people": true/false,
  "facesCount": liczba
}`;

    const response = await this.analyzeImage(imagePath, prompt);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      tags: [],
      category: 'unknown',
      description: response,
      mood: 'neutral',
      colors: [],
      objects: [],
      people: false,
      facesCount: 0,
    };
  }

  /**
   * OCR - extract text from image
   */
  async ocr(imagePath: string, language: string = 'polski'): Promise<string> {
    const prompt = `Wyciągnij CAŁY tekst widoczny na tym obrazie.
Język dokumentu: ${language}.
Zachowaj formatowanie (akapity, listy).
Zwróć tylko tekst, bez komentarzy.`;

    return this.analyzeImage(imagePath, prompt);
  }

  /**
   * Analyze large context (1M tokens)
   */
  async analyzeLargeContext(
    files: Array<string | { name: string; content: string }>,
    prompt: string
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: GEMINI_MODELS.PRO, // Only Pro has 1M context
      safetySettings,
    });

    let context = '';

    for (const file of files) {
      if (typeof file === 'string') {
        const content = fs.readFileSync(file, 'utf-8');
        const filename = path.basename(file);
        context += `\n\n=== ${filename} ===\n${content}`;
      } else {
        context += `\n\n=== ${file.name} ===\n${file.content}`;
      }
    }

    const fullPrompt = `${prompt}\n\nKONTEKST:\n${context}`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  }

  /**
   * Count tokens
   */
  async countTokens(text: string): Promise<number> {
    const model = this.client.getGenerativeModel({ model: GEMINI_MODELS.FLASH });
    const result = await model.countTokens(text);
    return result.totalTokens;
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      { id: GEMINI_MODELS.FLASH, name: 'Gemini 2.0 Flash', description: 'Szybki, 1M kontekst' },
      { id: GEMINI_MODELS.FLASH_25, name: 'Gemini 2.5 Flash', description: 'Najnowszy Flash, 1M kontekst' },
      { id: GEMINI_MODELS.PRO, name: 'Gemini 2.5 Pro', description: 'Najlepszy, 1M kontekst' },
    ];
  }

  /**
   * Check status
   */
  async checkStatus(): Promise<{ isAvailable: boolean; message: string }> {
    try {
      await this.chat('ping');
      return { isAvailable: true, message: 'Gemini API is available' };
    } catch (error: any) {
      return { isAvailable: false, message: error.message };
    }
  }
}

export default GeminiService;
