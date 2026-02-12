'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, MessageSquare, Settings, Volume2 } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

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
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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
        response = await processWithRAG(command);
      } else {
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
    const ragResponses: Record<string, string> = {
      'projekt': 'Na podstawie analizy bazy danych: masz 3 aktywne projekty. Projekt "Q4 Strategy" wymaga uwagi - 2 zadania po terminie.',
      'zadania': 'Dzis masz 5 zadan: 2 wysokiego priorytetu (prezentacja klienta, analiza budzetu), 3 sredniego. Zalecam zaczac od zadan @computer.',
      'klient': 'W systemie znalazlem 12 aktywnych kontaktow. 3 klientow wymaga kontaktu w tym tygodniu: TechCorp, StartupXYZ, Global Solutions.',
      'default': 'Przeanalyzowalem zapytanie w kontekscie bazy wiedzy. Czy mozesz byc bardziej precyzyjny?'
    };

    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerCommand = command.toLowerCase();
    for (const [key, response] of Object.entries(ragResponses)) {
      if (lowerCommand.includes(key)) {
        return response;
      }
    }

    return ragResponses.default;
  };

  const processTraditionalCommand = async (command: string): Promise<string> => {
    const traditionalResponses: Record<string, string> = {
      'utworz projekt': 'Projekt utworzony. Podaj nazwe i szczegoly.',
      'dodaj zadanie': 'Nowe zadanie dodane do listy.',
      'pokaz kalendarz': 'Otwieranie kalendarza...',
      'default': 'Komenda rozpoznana. Sprawdz szczegoly w systemie.'
    };

    await new Promise(resolve => setTimeout(resolve, 300));

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
        'Ktore projekty sa zagrozone?',
        'Jakie mam zadania na dzis?',
        'Pokaz komunikacje z klientami',
        'Analiza wydajnosci zespolu'
      ]
    },
    {
      category: 'Direct Commands',
      commands: [
        'Utworz nowy projekt',
        'Dodaj zadanie pilne',
        'Otworz kalendarz',
        'Wyslij raport'
      ]
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="Voice Commands + RAG"
        subtitle="Komendy glosowe z integracja RAG Knowledge Base"
        icon={Mic}
        iconColor="text-purple-600"
        actions={
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              settings.ragMode ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {settings.ragMode ? 'RAG Mode' : 'Traditional'}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isListening ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {isListening ? 'Slucham...' : 'Gotowy'}
            </div>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Voice Input Interface */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
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
                  <Square className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isListening ? 'Slucham...' : 'Kliknij aby rozpoczac'}
              </h3>
              {transcript && (
                <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-slate-700 dark:text-slate-300">{transcript}</p>
                  {!settings.autoExecute && transcript && (
                    <button
                      onClick={manualProcess}
                      disabled={processing}
                      className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Wykonaj komende
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Ustawienia Voice
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.ragMode}
                onChange={(e) => setSettings({...settings, ragMode: e.target.checked})}
                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">RAG Mode</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoExecute}
                onChange={(e) => setSettings({...settings, autoExecute: e.target.checked})}
                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Auto Execute</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.voiceFeedback}
                onChange={(e) => setSettings({...settings, voiceFeedback: e.target.checked})}
                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Voice Feedback</span>
            </label>

            <select
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className="border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="pl-PL">Polski</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>

        {/* Command History */}
        {commands.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Historia komend</h3>
            <div className="space-y-3">
              {commands.map((command) => (
                <div key={command.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{command.transcript}</span>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        command.ragEnabled ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {command.ragEnabled ? 'RAG' : 'CMD'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{command.processingTime}ms</span>
                      <span>{Math.round(command.confidence * 100)}%</span>
                      <span>{command.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {command.response && (
                    <div className="flex items-start space-x-2 mt-2 p-3 bg-slate-50 dark:bg-slate-700/40 rounded">
                      <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{command.response}</p>
                      {settings.voiceFeedback && (
                        <button
                          onClick={() => speakResponse(command.response!)}
                          className="ml-auto p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          <Volume2 className="w-4 h-4" />
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
            <div key={index} className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.commands.map((cmd, cmdIndex) => (
                  <button
                    key={cmdIndex}
                    onClick={() => processVoiceCommand(cmd, 1)}
                    className="block w-full text-left px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded transition-colors"
                  >
                    &quot;{cmd}&quot;
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
