/**
 * 🎤 Voice Simple (TTS) API Client
 * Text-to-speech synthesis endpoints
 */

import { apiClient } from './client';

export interface TTSModel {
  id: string;
  name: string;
  language: string;
  description?: string;
}

export interface TTSRequest {
  text: string;
  language: 'pl' | 'en';
  personalityLevel?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
  speed?: number;
}

export interface HealthStatus {
  success: boolean;
  service: string;
  timestamp: string;
}

export const voiceSimpleApi = {
  /**
   * Check TTS service health
   */
  async healthCheck(): Promise<HealthStatus> {
    const response = await apiClient.get('/voice-simple/health');
    return response.data;
  },

  /**
   * Get available TTS models
   */
  async getModels(): Promise<{ models: TTSModel[] }> {
    const response = await apiClient.get('/voice-simple/models');
    return response.data.success ? response.data.data : { models: [] };
  },

  /**
   * Synthesize text to speech
   */
  async synthesize(request: TTSRequest): Promise<Blob> {
    const response = await apiClient.post('/voice-simple/synthesize', request, {
      responseType: 'blob',
    });
    return new Blob([response.data], { type: 'audio/wav' });
  },
};
