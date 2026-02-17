import OpenAI from 'openai';
import { config } from '../config/index.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  speakers?: Array<{
    speaker: string;
    segments: Array<{
      text: string;
      startTime: number;
      endTime: number;
    }>;
  }>;
}

export interface ProjectAnalysis {
  projectName: string;
  clientName?: string;
  budget?: number;
  duration?: string;
  currency?: string;
  features: string[];
  suggestedTasks: Array<{
    title: string;
    description: string;
    estimatedHours: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
  nextSteps: string[];
  riskFactors?: string[];
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
  try {
    if (!config.OPENAI.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pl', // Polish language
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    return {
      text: transcription.text,
      confidence: 0.95, // OpenAI doesn't provide confidence, use default high value
      words: transcription.words?.map(word => ({
        word: word.word,
        startTime: word.start,
        endTime: word.end,
        confidence: 0.95
      })),
      speakers: [{
        speaker: 'Użytkownik',
        segments: [{
          text: transcription.text,
          startTime: 0,
          endTime: transcription.duration || 0
        }]
      }]
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Analyze project information from transcription using GPT-4
 */
export async function analyzeProjectFromTranscription(transcription: string): Promise<ProjectAnalysis> {
  try {
    if (!config.OPENAI.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analizuj następującą notatką głosową i wyciągnij szczegółowe informacje o projekcie. 
Zwróć odpowiedź w formacie JSON zgodnym z poniższą strukturą.

Transkrypcja: "${transcription}"

Przeanalizuj i wyciągnij:
1. Nazwę projektu/klienta
2. Budżet (jeśli podany) - konwertuj na liczbę
3. Czas realizacji
4. Walutę (PLN, EUR, USD)
5. Główne funkcjonalności
6. Proponowane zadania z szacunkami godzin
7. Następne kroki
8. Potencjalne ryzyka

Zwróć JSON w formacie:
{
  "projectName": "string",
  "clientName": "string lub null",
  "budget": number lub null,
  "duration": "string lub null",
  "currency": "PLN/EUR/USD lub null", 
  "features": ["lista", "funkcjonalności"],
  "suggestedTasks": [
    {
      "title": "nazwa zadania",
      "description": "opis zadania", 
      "estimatedHours": liczba_godzin,
      "priority": "high/medium/low",
      "category": "development/design/testing/management"
    }
  ],
  "nextSteps": ["kolejne", "kroki"],
  "riskFactors": ["potencjalne", "ryzyka"]
}

Jeśli nie możesz wyciągnąć konkretnej informacji, ustaw wartość na null lub pustą tablicę.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ 
        role: 'user', 
        content: prompt 
      }],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('Empty response from OpenAI');
    }

    const analysis = JSON.parse(result) as ProjectAnalysis;
    
    // Validate and set defaults
    if (!analysis.projectName) {
      analysis.projectName = 'Nowy Projekt';
    }
    if (!analysis.features) {
      analysis.features = [];
    }
    if (!analysis.suggestedTasks) {
      analysis.suggestedTasks = [];
    }
    if (!analysis.nextSteps) {
      analysis.nextSteps = [];
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw new Error('Failed to analyze project information');
  }
}

/**
 * Generate smart summary from transcription
 */
export async function generateSmartSummary(transcription: string): Promise<string> {
  try {
    if (!config.OPENAI.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Przygotuj zwięzłe, ale szczegółowe podsumowanie następującej notatki głosowej. 
        Skup się na najważniejszych informacjach, decyzjach i działaniach do podjęcia.
        
        Transkrypcja: "${transcription}"
        
        Podsumowanie:"`
      }],
      max_tokens: 300,
      temperature: 0.5,
    });

    return completion.choices[0].message.content || 'Nie udało się wygenerować podsumowania.';
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

/**
 * Extract keywords and tags from transcription
 */
export async function extractKeywords(transcription: string): Promise<string[]> {
  try {
    if (!config.OPENAI.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Wyciągnij 5-10 najważniejszych słów kluczowych z następującego tekstu. 
        Zwróć tylko słowa kluczowe oddzielone przecinkami, bez dodatkowych wyjaśnień.
        
        Tekst: "${transcription}"`
      }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const keywords = completion.choices[0].message.content;
    if (!keywords) return [];

    return keywords
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)
      .slice(0, 10);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
}

export default {
  transcribeAudio,
  analyzeProjectFromTranscription,
  generateSmartSummary,
  extractKeywords
};
