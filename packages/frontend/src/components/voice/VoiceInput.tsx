'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  SpeechRecognitionService, 
  SpeechRecognitionResult,
  SpeechRecognitionError 
} from '@/lib/voice/speech-recognition';

interface VoiceInputProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onCommand?: (command: string) => void;
  language?: 'pl-PL' | 'en-US';
  className?: string;
  autoStart?: boolean;
}

/**
 * Voice Input Component with visual feedback
 */
export function VoiceInput({ 
  onTranscript, 
  onCommand,
  language = 'pl-PL',
  className = '',
  autoStart = false
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Check browser support
    if (!SpeechRecognitionService.isSupported()) {
      setIsSupported(false);
      toast.error('Przeglądarka nie obsługuje rozpoznawania mowy');
      return;
    }

    // Initialize speech recognition
    try {
      recognitionRef.current = new SpeechRecognitionService({
        language,
        continuous: true,
        interimResults: true,
        maxAlternatives: 3
      });

      // Check if instance is supported
      if (!recognitionRef.current.supported) {
        setIsSupported(false);
        toast.error('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce');
        return;
      }

      // Setup callbacks
      recognitionRef.current.onResult((result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          finalTranscriptRef.current += result.transcript + ' ';
          setTranscript(finalTranscriptRef.current);
          
          // Call command handler for final results
          onCommand?.(result.transcript);
        } else {
          // Show interim results
          setTranscript(finalTranscriptRef.current + result.transcript);
        }
        
        onTranscript?.(result.transcript, result.isFinal);
      });

      recognitionRef.current.onError((error: SpeechRecognitionError) => {
        console.error('Voice input error:', error);
        toast.error(error.message);
        setIsListening(false);
      });

      recognitionRef.current.onStart(() => {
        setIsListening(true);
        finalTranscriptRef.current = '';
        setTranscript('');
        toast.success('Nasłuchiwanie rozpoczęte');
      });

      recognitionRef.current.onEnd(() => {
        setIsListening(false);
        if (finalTranscriptRef.current) {
          toast('Nasłuchiwanie zakończone');
        }
      });

      recognitionRef.current.onSpeechStart(() => {
        setIsSpeaking(true);
      });

      recognitionRef.current.onSpeechEnd(() => {
        setIsSpeaking(false);
      });

    } catch (error: any) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSupported(false);
    }

    // Auto-start if requested
    if (autoStart && recognitionRef.current) {
      handleStart();
    }

    // Cleanup
    return () => {
      if (recognitionRef.current?.listening) {
        recognitionRef.current.stop();
      }
    };
  }, [language, autoStart]);

  const handleStart = async () => {
    if (!recognitionRef.current) return;

    // Request microphone permission first
    const hasPermission = await SpeechRecognitionService.requestMicrophonePermission();
    if (!hasPermission) {
      toast.error('Brak dostępu do mikrofonu');
      return;
    }

    recognitionRef.current.start();
  };

  const handleStop = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  const toggleListening = () => {
    if (isListening) {
      handleStop();
    } else {
      handleStart();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Rozpoznawanie mowy nie jest obsługiwane
      </div>
    );
  }

  return (
    <div className={`voice-input ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          onClick={toggleListening}
          variant={isListening ? 'destructive' : 'default'}
          size="lg"
          className="relative"
          disabled={!isSupported}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5 mr-2" />
              Zatrzymaj
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </>
          ) : (
            <>
              <Mic className="h-5 w-5 mr-2" />
              Mów do mnie
            </>
          )}
        </Button>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Nasłuchuję...</span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Rozpoznany tekst:</p>
          <p className="text-gray-900">{transcript}</p>
        </div>
      )}

      {/* Visual feedback for speaking */}
      {isListening && (
        <div className="mt-4 flex justify-center">
          <div className="voice-visualizer flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-blue-500 rounded-full transition-all duration-150 ${
                  isSpeaking ? 'animate-pulse' : ''
                }`}
                style={{
                  height: isSpeaking ? `${20 + Math.random() * 30}px` : '4px',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}