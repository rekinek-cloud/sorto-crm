'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, StopIcon, SparklesIcon, ChatBubbleBottomCenterTextIcon, CogIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface VoiceCommand {
  id: string;
  transcript: string;
  timestamp: Date;
  response?: string;
  ragEnabled: boolean;
  processingTime: number;
  confidence: number;
}

interface VoiceSettings {
  language: string;
  ragMode: boolean;
  autoExecute: boolean;
  voiceFeedback: boolean;
  sensitivity: number;
}

export default function VoiceRAGPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'pl-PL',
    ragMode: true,
    autoExecute: false,
    voiceFeedback: true,
    sensitivity: 0.7
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = settings.language;
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
          
          if (finalTranscript && settings.autoExecute) {
            processVoiceCommand(finalTranscript, event.results[event.results.length - 1][0].confidence);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
      }
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [settings.language, settings.autoExecute, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceCommand = async (command: string, confidence: number = 1) => {
    if (!command.trim()) return;

    setProcessing(true);
    const startTime = Date.now();

    try {
      let response = '';
      
      if (settings.ragMode) {
        // Process with RAG (Knowledge Base)
        response = await processWithRAG(command);
      } else {
        // Process with traditional command matching
        response = await processTraditionalCommand(command);
      }

      const newCommand: VoiceCommand = {
        id: Date.now().toString(),
        transcript: command,
        timestamp: new Date(),
        response,
        ragEnabled: settings.ragMode,
        processingTime: Date.now() - startTime,
        confidence
      };

      setCommands(prev => [newCommand, ...prev.slice(0, 9)]);

      // Voice feedback
      if (settings.voiceFeedback && response) {
        speakResponse(response);
      }

    } catch (error: any) {
      console.error('Failed to process voice command:', error);
    } finally {
      setProcessing(false);
      setTranscript('');
    }
  };

  const processWithRAG = async (command: string): Promise<string> => {
    // Mock RAG processing - replace with actual API call
    const ragResponses = {
      'projekt': 'Na podstawie analizy bazy danych: masz 3 aktywne projekty. Projekt "Q4 Strategy" wymaga uwagi - 2 zadania po terminie.',
      'zadania': 'Dziś masz 5 zadań: 2 wysokiego priorytetu (prezentacja klienta, analiza budżetu), 3 średniego. Zalecam zacząć od zadań @computer.',
      'klient': 'W systemie znalazłem 12 aktywnych kontaktów. 3 klientów wymaga kontaktu w tym tygodniu: TechCorp, StartupXYZ, Global Solutions.',
      'default': 'Przeanalizowałem zapytanie w kontekście bazy wiedzy. Czy możesz być bardziej precyzyjny?'
    };

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing

    const lowerCommand = command.toLowerCase();
    for (const [key, response] of Object.entries(ragResponses)) {
      if (lowerCommand.includes(key)) {
        return response;
      }
    }
    
    return ragResponses.default;
  };

  const processTraditionalCommand = async (command: string): Promise<string> => {
    // Mock traditional command processing
    const traditionalResponses = {
      'utwórz projekt': 'Projekt utworzony. Podaj nazwę i szczegóły.',
      'dodaj zadanie': 'Nowe zadanie dodane do listy.',
      'pokaż kalendarz': 'Otwieranie kalendarza...',
      'default': 'Komenda rozpoznana. Sprawdź szczegóły w systemie.'
    };

    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate processing

    const lowerCommand = command.toLowerCase();
    for (const [key, response] of Object.entries(traditionalResponses)) {
      if (lowerCommand.includes(key.split(' ')[0])) {
        return response;
      }
    }
    
    return traditionalResponses.default;
  };

  const speakResponse = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pl-PL';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const manualProcess = () => {
    if (transcript.trim()) {
      processVoiceCommand(transcript, 1);
    }
  };

  const exampleCommands = [
    { 
      category: 'RAG Queries',
      commands: [
        'Które projekty są zagrożone?',
        'Jakie mam zadania na dziś?',
        'Pokaż komunikację z klientami',
        'Analiza wydajności zespołu'
      ]
    },
    {
      category: 'Direct Commands',
      commands: [
        'Utwórz nowy projekt',
        'Dodaj zadanie pilne',
        'Otwórz kalendarz',
        'Wyślij raport'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Commands + RAG</h1>
          <p className="text-gray-600">Komendy głosowe z integracją RAG Knowledge Base</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            settings.ragMode ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {settings.ragMode ? 'RAG Mode' : 'Traditional'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isListening ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'
          }`}>
            {isListening ? 'Słucham...' : 'Gotowy'}
          </div>
        </div>
      </div>

      {/* Voice Input Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={processing}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-500 hover:bg-purple-600'
              } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
              ) : isListening ? (
                <StopIcon className="w-10 h-10 text-white" />
              ) : (
                <MicrophoneIcon className="w-10 h-10 text-white" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isListening ? 'Słucham...' : 'Kliknij aby rozpocząć'}
            </h3>
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-gray-700">{transcript}</p>
                {!settings.autoExecute && transcript && (
                  <button
                    onClick={manualProcess}
                    disabled={processing}
                    className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    Wykonaj komendę
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CogIcon className="w-5 h-5 mr-2" />
          Ustawienia Voice
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.ragMode}
              onChange={(e) => setSettings({...settings, ragMode: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">RAG Mode</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoExecute}
              onChange={(e) => setSettings({...settings, autoExecute: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">Auto Execute</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.voiceFeedback}
              onChange={(e) => setSettings({...settings, voiceFeedback: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm">Voice Feedback</span>
          </label>

          <select
            value={settings.language}
            onChange={(e) => setSettings({...settings, language: e.target.value})}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="pl-PL">Polski</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>

      {/* Command History */}
      {commands.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historia komend</h3>
          <div className="space-y-3">
            {commands.map((command) => (
              <div key={command.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MicrophoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{command.transcript}</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      command.ragEnabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {command.ragEnabled ? 'RAG' : 'CMD'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{command.processingTime}ms</span>
                    <span>{Math.round(command.confidence * 100)}%</span>
                    <span>{command.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                
                {command.response && (
                  <div className="flex items-start space-x-2 mt-2 p-3 bg-gray-50 rounded">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-purple-500 mt-0.5" />
                    <p className="text-sm text-gray-700">{command.response}</p>
                    {settings.voiceFeedback && (
                      <button
                        onClick={() => speakResponse(command.response!)}
                        className="ml-auto p-1 text-gray-400 hover:text-purple-600"
                      >
                        <SpeakerWaveIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Commands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exampleCommands.map((category, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2 text-purple-500" />
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.commands.map((cmd, cmdIndex) => (
                <button
                  key={cmdIndex}
                  onClick={() => processVoiceCommand(cmd, 1)}
                  className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}