/**
 * 🎤 Coqui TTS Service - Text-to-Speech Integration
 * Komunikacja z Coqui TTS microservice dla Voice AI
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import config from '../../config';

export interface TTSRequest {
  text: string;
  language?: string;
  speakerWav?: Buffer; // Voice cloning sample
  speed?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
}

export interface TTSResponse {
  audioBuffer: Buffer;
  duration: number;
  sampleRate: number;
  format: string;
}

export interface VoiceModel {
  name: string;
  language: string;
  description: string;
  isMultilingual: boolean;
}

/**
 * Coqui TTS Service dla zaawansowanego text-to-speech
 */
export class CoquiTTSService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.COQUI_TTS_URL || 'http://voice-tts-v1:5002';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30s timeout dla TTS processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🎤 CoquiTTSService initialized with URL: ${this.baseUrl}`);
  }

  /**
   * Pobiera listę dostępnych modeli głosowych
   */
  async getAvailableModels(): Promise<VoiceModel[]> {
    try {
      const response = await this.client.get('/api/tts/models');
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to get TTS models:', error);
      return [];
    }
  }

  /**
   * Sprawdza czy serwis TTS jest aktywny
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('TTS health check failed:', error);
      return false;
    }
  }

  /**
   * Syntetyzuje tekst na mowę (podstawowa wersja)
   */
  async synthesizeText(
    text: string, 
    language: string = 'pl',
    options: Partial<TTSRequest> = {}
  ): Promise<TTSResponse> {
    try {
      console.log(`🎤 Synthesizing TTS: "${text.substring(0, 50)}..." (${language})`);
      
      // Create FormData for mock TTS API
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('language', language);
      formData.append('emotion', options.emotion || 'neutral');
      formData.append('speed', (options.speed || 1.0).toString());

      // Wywołanie Mock TTS API
      const response = await this.client.post('/api/tts', formData, {
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders()
        }
      });

      // Konwersja na Buffer
      const audioBuffer = Buffer.from(response.data);
      
      // Metadata z headers (jeśli dostępne)
      const duration = parseFloat(response.headers['x-audio-duration'] || '0');
      const sampleRate = parseInt(response.headers['x-sample-rate'] || '22050');

      console.log(`✅ TTS completed: ${audioBuffer.length} bytes, ${duration}s`);

      return {
        audioBuffer,
        duration,
        sampleRate,
        format: 'wav',
      };

    } catch (error: any) {
      console.error('TTS synthesis failed:', error.response?.data || error.message);
      throw new Error(`TTS synthesis failed: ${error.message}`);
    }
  }

  /**
   * Syntetyzuje z cloned voice (zaawansowana)
   */
  async synthesizeWithVoiceCloning(
    text: string,
    speakerWav: Buffer,
    language: string = 'pl',
    options: Partial<TTSRequest> = {}
  ): Promise<TTSResponse> {
    try {
      console.log(`🎭 Voice cloning TTS: "${text.substring(0, 50)}..."`);

      // FormData dla voice cloning
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('language', language);
      formData.append('speaker_wav', speakerWav, 'speaker.wav');
      formData.append('emotion', options.emotion || 'neutral');
      formData.append('speed', (options.speed || 1.0).toString());

      const response = await this.client.post('/api/tts/clone_voice', formData, {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
      });

      const audioBuffer = Buffer.from(response.data);
      const duration = parseFloat(response.headers['x-audio-duration'] || '0');
      const sampleRate = parseInt(response.headers['x-sample-rate'] || '22050');

      console.log(`✅ Voice cloning completed: ${audioBuffer.length} bytes`);

      return {
        audioBuffer,
        duration,
        sampleRate,
        format: 'wav',
      };

    } catch (error: any) {
      console.error('Voice cloning TTS failed:', error.response?.data || error.message);
      throw new Error(`Voice cloning failed: ${error.message}`);
    }
  }

  /**
   * Personality-aware synthesis (dla różnych poziomów sarkazmu)
   */
  async synthesizeWithPersonality(
    text: string,
    personalityLevel: number = 5, // 1-10 scale
    language: string = 'pl'
  ): Promise<TTSResponse> {
    // Mapowanie personality level na parametry TTS
    const personalityMap = {
      1: { emotion: 'neutral', speed: 0.9 },     // Bardzo spokojny
      3: { emotion: 'neutral', speed: 1.0 },     // Neutralny  
      5: { emotion: 'happy', speed: 1.1 },       // Przyjazny
      7: { emotion: 'surprised', speed: 1.2 },   // Energiczny
      10: { emotion: 'angry', speed: 1.3 },      // Sarkastyczny
    };

    // Znajdź najbliższą wartość
    const closestLevel = Object.keys(personalityMap)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - personalityLevel) < Math.abs(prev - personalityLevel) ? curr : prev
      );

    const settings = personalityMap[closestLevel as keyof typeof personalityMap];

    // Modyfikuj tekst dla większego sarkazmu
    let modifiedText = text;
    if (personalityLevel >= 7) {
      // Dodaj pauzę i emphasis dla sarkazmu
      modifiedText = text.replace(/\./g, '... ').replace(/!/g, '?!');
    }

    return this.synthesizeText(modifiedText, language, settings);
  }

  /**
   * Streaming TTS (dla real-time responses)
   */
  async synthesizeStreaming(
    text: string,
    language: string = 'pl',
    onChunk: (chunk: Buffer) => void
  ): Promise<void> {
    try {
      console.log(`🌊 Streaming TTS synthesis: "${text.substring(0, 50)}..."`);

      const response = await this.client.post('/api/tts/stream', {
        text: text.trim(),
        language,
      }, {
        responseType: 'stream',
      });

      // Stream chunks do callback
      response.data.on('data', (chunk: Buffer) => {
        onChunk(chunk);
      });

      response.data.on('end', () => {
        console.log('✅ TTS streaming completed');
      });

      response.data.on('error', (error: Error) => {
        console.error('TTS streaming error:', error);
        throw error;
      });

    } catch (error: any) {
      console.error('TTS streaming failed:', error.message);
      throw new Error(`TTS streaming failed: ${error.message}`);
    }
  }
}

// Singleton instance
export const coquiTTSService = new CoquiTTSService();