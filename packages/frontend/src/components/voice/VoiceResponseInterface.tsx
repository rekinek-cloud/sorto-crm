'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { VoiceResponseAPI, VoiceResponseRequest, VoiceResponseData, VoiceFeedback } from '@/lib/api/voice-response';

interface VoiceResponseInterfaceProps {
  onResponse?: (response: VoiceResponseData) => void;
  context?: any;
  className?: string;
}

export const VoiceResponseInterface: React.FC<VoiceResponseInterfaceProps> = ({
  onResponse,
  context,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<VoiceResponseData | null>(null);
  const [query, setQuery] = useState('');
  const [responseType, setResponseType] = useState<'TASK' | 'CLIENT' | 'CALENDAR' | 'GOAL' | 'ERROR'>('TASK');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceEngineRef = useRef<any>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pl-PL';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleVoiceQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Błąd rozpoznawania mowy');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize voice response engine
    if (typeof window !== 'undefined' && (window as any).VoiceResponseEngine) {
      voiceEngineRef.current = new (window as any).VoiceResponseEngine(
        VoiceResponseAPI,
        new (window as any).AnalyticsTracker()
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      toast.success('Słucham...');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceQuery = async (voiceQuery: string) => {
    if (!voiceQuery.trim()) return;

    setIsProcessing(true);
    
    try {
      const request: VoiceResponseRequest = {
        query: voiceQuery,
        responseType,
        context: {
          userId: context?.userId,
          timeOfDay: getTimeOfDay(),
          productivity: context?.productivity || 0.7,
          emotionalState: context?.emotionalState || 'neutral',
          userPreferences: {
            voiceSpeed: 'normal',
            formality: 'professional',
            motivation: true
          }
        },
        maxResponseDuration: 45
      };

      let response: VoiceResponseData;
      
      // Use voice engine if available for enhanced processing
      if (voiceEngineRef.current) {
        response = await voiceEngineRef.current.generateResponse(request);
      } else {
        // Fallback to direct API call
        response = await VoiceResponseAPI.generateResponse(request);
      }

      setCurrentResponse(response);
      onResponse?.(response);
      
      // Speak the response
      await speakResponse(response);
      
    } catch (error: any) {
      console.error('Voice query processing failed:', error);
      toast.error('Błąd przetwarzania zapytania głosowego');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextQuery = async () => {
    if (!query.trim()) return;
    await handleVoiceQuery(query);
  };

  const speakResponse = async (response: VoiceResponseData): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.lang = 'pl-PL';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          synthesisRef.current = null;
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          synthesisRef.current = null;
          resolve();
        };
        
        synthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const submitFeedback = async (rating: number, comments?: string) => {
    if (!currentResponse) return;

    try {
      const feedback: VoiceFeedback = {
        responseId: currentResponse.id,
        rating,
        feedbackType: 'rating',
        comments,
        contextRelevant: true
      };

      await VoiceResponseAPI.submitFeedback(feedback);
      
      // Track in voice engine if available
      if (voiceEngineRef.current) {
        await voiceEngineRef.current.analyticsTracker.trackUserFeedback(
          currentResponse.id,
          feedback
        );
      }
      
      toast.success('Dziękujemy za opinię!');
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast.error('Błąd podczas wysyłania opinii');
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  return (
    <div className={`voice-response-interface bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">🎤 Asystent Głosowy</h3>
        <div className="flex items-center space-x-2">
          <select 
            value={responseType} 
            onChange={(e) => setResponseType(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="TASK">Zadania</option>
            <option value="CLIENT">Klienci</option>
            <option value="CALENDAR">Kalendarz</option>
            <option value="GOAL">Cele</option>
          </select>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing || isSpeaking}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span>{isListening ? '🔴' : '🎤'}</span>
          <span>{isListening ? 'Zatrzymaj' : 'Rozpocznij'}</span>
        </button>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <span>⏹️</span>
            <span>Stop</span>
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Przetwarzam...</span>
          </div>
        )}
      </div>

      {/* Text Input Alternative */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextQuery()}
            placeholder="Lub wpisz zapytanie tekstowe..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing || isSpeaking}
          />
          <button
            onClick={handleTextQuery}
            disabled={isProcessing || isSpeaking || !query.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Wyślij
          </button>
        </div>
      </div>

      {/* Current Response */}
      {currentResponse && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-gray-900">Odpowiedź:</h4>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {currentResponse.responseType}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">{currentResponse.text}</p>
          
          {currentResponse.emotionalContext && (
            <div className="text-xs text-gray-500 mb-3">
              Emocja: {currentResponse.emotionalContext.primaryEmotion} 
              (pewność: {(currentResponse.emotionalContext.confidence * 100).toFixed(0)}%)
            </div>
          )}
          
          {currentResponse.followUpSuggestions?.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sugerowane pytania:</h5>
              <div className="flex flex-wrap gap-2">
                {currentResponse.followUpSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(suggestion);
                      handleVoiceQuery(suggestion);
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Feedback */}
          <div className="border-t pt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Jak oceniasz tę odpowiedź?</h5>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => submitFeedback(rating)}
                  className="text-lg hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex space-x-4">
          <span className={`flex items-center space-x-1 ${
            'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
              ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>🎤</span>
            <span>Rozpoznawanie mowy</span>
          </span>
          <span className={`flex items-center space-x-1 ${
            'speechSynthesis' in window ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>🔊</span>
            <span>Synteza mowy</span>
          </span>
        </div>
        
        {currentResponse && (
          <span>Czas generowania: {currentResponse.generationTime}ms</span>
        )}
      </div>
    </div>
  );
};

export default VoiceResponseInterface;
