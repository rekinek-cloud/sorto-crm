/**
 * 🎤 Speech Recognition Service
 * Web Speech API implementation for voice input
 */

export interface SpeechRecognitionConfig {
  language: 'pl-PL' | 'en-US';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
}

export interface SpeechRecognitionError {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted';
  message: string;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Speech Recognition Service using Web Speech API
 */
export class SpeechRecognitionService {
  private recognition: any;
  private isListening: boolean = false;
  private config: SpeechRecognitionConfig;
  private isSupported: boolean = false;
  
  // Callbacks
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: SpeechRecognitionError) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private onSpeechStartCallback?: () => void;
  private onSpeechEndCallback?: () => void;

  constructor(config: Partial<SpeechRecognitionConfig> = {}) {
    this.config = {
      language: 'pl-PL',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      ...config
    };

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser');
      this.isSupported = false;
      return;
    }

    // Initialize recognition
    try {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
      this.isSupported = true;
    } catch (error: any) {
      console.error('Failed to initialize speech recognition:', error);
      this.isSupported = false;
    }
  }

  /**
   * Setup recognition parameters and event handlers
   */
  private setupRecognition(): void {
    // Apply configuration
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Event handlers
    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
      this.onStartCallback?.();
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      this.isListening = false;
      this.onEndCallback?.();
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ Speech detected');
      this.onSpeechStartCallback?.();
    };

    this.recognition.onspeechend = () => {
      console.log('🤫 Speech ended');
      this.onSpeechEndCallback?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleError(event);
    };

    this.recognition.onnomatch = () => {
      console.log('❓ No speech match found');
    };

    this.recognition.onaudiostart = () => {
      console.log('🎵 Audio capture started');
    };

    this.recognition.onaudioend = () => {
      console.log('🔇 Audio capture ended');
    };
  }

  /**
   * Handle recognition results
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    const resultIndex = event.resultIndex;
    const result = event.results[resultIndex];
    
    // Extract main transcript and alternatives
    const mainTranscript = result[0].transcript;
    const confidence = result[0].confidence || 0.9; // Default confidence if not provided
    
    const alternatives: Array<{ transcript: string; confidence: number }> = [];
    for (let i = 1; i < result.length && i < this.config.maxAlternatives; i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence || 0.5
      });
    }

    const recognitionResult: SpeechRecognitionResult = {
      transcript: mainTranscript,
      confidence,
      isFinal: result.isFinal,
      alternatives
    };

    console.log(`📝 Recognition result: "${mainTranscript}" (confidence: ${confidence}, final: ${result.isFinal})`);
    
    this.onResultCallback?.(recognitionResult);
  }

  /**
   * Handle recognition errors
   */
  private handleError(event: SpeechRecognitionErrorEvent): void {
    let errorType: SpeechRecognitionError['error'];
    let message: string;

    switch (event.error) {
      case 'no-speech':
        errorType = 'no-speech';
        message = 'Nie wykryto mowy. Spróbuj ponownie.';
        break;
      case 'audio-capture':
        errorType = 'audio-capture';
        message = 'Nie można uzyskać dostępu do mikrofonu.';
        break;
      case 'not-allowed':
        errorType = 'not-allowed';
        message = 'Brak uprawnień do mikrofonu. Sprawdź ustawienia przeglądarki.';
        break;
      case 'network':
        errorType = 'network';
        message = 'Błąd połączenia sieciowego.';
        break;
      case 'aborted':
        errorType = 'aborted';
        message = 'Rozpoznawanie zostało przerwane.';
        break;
      default:
        errorType = 'network';
        message = `Nieznany błąd: ${event.error}`;
    }

    const error: SpeechRecognitionError = { error: errorType, message };
    console.error('❌ Speech recognition error:', error);
    
    this.onErrorCallback?.(error);
  }

  /**
   * Start listening for speech
   */
  start(): void {
    if (!this.isSupported) {
      this.onErrorCallback?.({
        error: 'not-allowed',
        message: 'Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce'
      });
      return;
    }

    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error: any) {
      console.error('Failed to start recognition:', error);
      this.onErrorCallback?.({
        error: 'audio-capture',
        message: 'Nie można rozpocząć nasłuchiwania'
      });
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.isListening) {
      console.warn('⚠️ Not currently listening');
      return;
    }

    this.recognition.stop();
  }

  /**
   * Abort current recognition
   */
  abort(): void {
    this.recognition.abort();
  }

  /**
   * Change language
   */
  setLanguage(language: 'pl-PL' | 'en-US'): void {
    this.config.language = language;
    this.recognition.lang = language;
    console.log(`🌐 Language changed to: ${language}`);
  }

  /**
   * Set event callbacks
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: SpeechRecognitionError) => void): void {
    this.onErrorCallback = callback;
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  onSpeechStart(callback: () => void): void {
    this.onSpeechStartCallback = callback;
  }

  onSpeechEnd(callback: () => void): void {
    this.onSpeechEndCallback = callback;
  }

  /**
   * Check if currently listening
   */
  get listening(): boolean {
    return this.isListening;
  }

  /**
   * Check if speech recognition is supported in this instance
   */
  get supported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current configuration
   */
  get configuration(): SpeechRecognitionConfig {
    return { ...this.config };
  }

  /**
   * Static method to check browser support
   */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Request microphone permission
   */
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }
}

// Export singleton instance - created lazily to avoid constructor errors
export const createSpeechRecognitionService = (config?: Partial<SpeechRecognitionConfig>) => 
  new SpeechRecognitionService(config);