'use client';

import React, { useState } from 'react';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Mic, Bot, Zap, Globe, Brain, Wifi } from 'lucide-react';

export default function VoiceDemoPage() {
  const [lastTranscript, setLastTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<Array<{
    transcript: string;
    timestamp: Date;
    isFinal: boolean;
  }>>([]);

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    setLastTranscript(transcript);
    
    if (isFinal) {
      setCommandHistory(prev => [...prev, {
        transcript,
        timestamp: new Date(),
        isFinal
      }]);
    }
  };

  const exampleCommands = [
    { 
      icon: <Zap className="h-5 w-5" />,
      command: "Stwórz projekt konferencji Q4",
      description: "Tworzy nowy projekt z automatycznym statusem"
    },
    {
      icon: <Brain className="h-5 w-5" />,
      command: "Jakie mam zadania na dziś?",
      description: "Pokazuje listę zadań z priorytetami"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      command: "Pokaż mi aktywne projekty",
      description: "Wyświetla projekty w toku"
    },
    {
      icon: <Wifi className="h-5 w-5" />,
      command: "Włącz światło w biurze",
      description: "🚧 Funkcjonalność w rozwoju - dostępna w przyszłych wersjach"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Bot className="h-10 w-10 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Voice AI Demo</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Testuj rozpoznawanie mowy i komendy głosowe. System wykorzystuje AI do naturalnego
          przetwarzania języka i wykonywania akcji w CRM.
        </p>
      </div>

      {/* Main Voice Input */}
      <Card className="p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-6">Wypróbuj Voice AI</h2>
          
          <VoiceInput
            onTranscript={handleTranscript}
            language="pl-PL"
            className="flex justify-center"
          />

          {lastTranscript && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Ostatnia transkrypcja:</p>
              <p className="text-lg font-medium text-gray-900">{lastTranscript}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Example Commands */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mic className="h-5 w-5 text-indigo-600" />
            Przykładowe komendy
          </h3>
          
          <div className="space-y-4">
            {exampleCommands.map((example, index) => (
              <div key={index} className="flex gap-3">
                <div className="text-indigo-600 mt-1">{example.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">"{example.command}"</p>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Funkcjonalności</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="success">Aktywne</Badge>
              <span className="text-sm">Speech Recognition (Web Speech API)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Aktywne</Badge>
              <span className="text-sm">Text-to-Speech (Web Speech + Coqui)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">W trakcie</Badge>
              <span className="text-sm">AI Command Processing (OpenAI)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Planowane</Badge>
              <span className="text-sm">Google Nest Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Planowane</Badge>
              <span className="text-sm">Vector Database (Conversation Memory)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Historia komend</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commandHistory.map((item, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                <p className="text-gray-900">{item.transcript}</p>
                <span className="text-xs text-gray-500 ml-4">
                  {item.timestamp.toLocaleTimeString('pl-PL')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technical Details */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Szczegóły techniczne</h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Frontend:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Web Speech API dla rozpoznawania mowy</li>
              <li>• Real-time transkrypcja z interim results</li>
              <li>• Wizualizacja aktywności głosowej</li>
              <li>• Wsparcie dla PL i EN</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Backend:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• AI Voice Processor z OpenAI</li>
              <li>• Intent classification & entity extraction</li>
              <li>• Coqui TTS dla syntezy mowy</li>
              <li>• RESTful API + WebSocket (planowane)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}