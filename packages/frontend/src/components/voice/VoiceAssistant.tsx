'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Bot, X } from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { voiceApi } from '@/lib/api/voice';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
}

/**
 * Voice Assistant Component - Main interface for voice interactions
 */
export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation when assistant opens
  useEffect(() => {
    if (isOpen && !conversationId) {
      startConversation();
    }
  }, [isOpen]);

  const startConversation = async () => {
    try {
      const conversation = await voiceApi.startConversation();
      setConversationId(conversation.conversationId);
      
      // Add welcome message
      addMessage('assistant', conversation.message || 'Cześć! W czym mogę pomóc?');
      
      // Speak welcome message
      speakText(conversation.message || 'Cześć! W czym mogę pomóc?');
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error('Nie udało się rozpocząć rozmowy');
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, metadata?: any) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date(),
      ...metadata
    }]);
  };

  const handleVoiceCommand = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message
    addMessage('user', transcript);
    setIsProcessing(true);

    try {
      // Process command with AI
      const result = await voiceApi.processCommand(transcript, conversationId || undefined);
      
      // Add assistant response
      addMessage('assistant', result.response || result.suggestedResponse, {
        intent: result.intent,
        entities: result.entities
      });

      // Speak the response
      speakText(result.response || result.suggestedResponse);

      // Handle specific intents with navigation
      handleIntentActions(result);

    } catch (error: any) {
      console.error('Voice command error:', error);
      const errorMessage = 'Przepraszam, wystąpił błąd. Spróbuj ponownie.';
      addMessage('assistant', errorMessage);
      speakText(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIntentActions = (result: any) => {
    // Navigate or perform actions based on intent
    switch (result.intent) {
      case 'CREATE_PROJECT':
        if (result.entities.projectId) {
          toast.success('Projekt został utworzony!');
          router.push(`/dashboard/projects/${result.entities.projectId}`);
        }
        break;
      
      case 'CREATE_TASK':
        if (result.entities.taskId) {
          toast.success('Zadanie zostało utworzone!');
          router.push('/dashboard/gtd/next-actions');
        }
        break;
      
      case 'GET_TASKS':
        router.push('/dashboard/gtd/next-actions');
        break;
      
      case 'GET_PROJECTS':
        router.push('/dashboard/projects');
        break;
    }
  };

  const speakText = async (text: string) => {
    if (!text || isSpeaking) return;

    setIsSpeaking(true);
    
    // Use Web Speech API for now (later can switch to TTS service)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      console.error('Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Opening assistant
      setMessages([]);
      setConversationId(null);
    } else {
      // Closing assistant
      stopSpeaking();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Voice Assistant"
      >
        <Bot className="h-6 w-6" />
        {isOpen && (
          <span className="absolute -top-1 -right-1 h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-indigo-50">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Asystent Głosowy</h3>
              </div>
              <button
                onClick={toggleAssistant}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600">Myślę...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Controls */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2">
                <VoiceInput
                  onCommand={handleVoiceCommand}
                  language="pl-PL"
                  className="flex-1"
                />
                
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    variant="secondary"
                    size="sm"
                  >
                    <VolumeX className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powiedz "pomoc" aby zobaczyć dostępne komendy
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}