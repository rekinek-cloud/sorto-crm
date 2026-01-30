'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  LanguageIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface TTSModel {
  id: string;
  name: string;
  language: string;
  description?: string;
}

interface SynthesisHistory {
  id: string;
  text: string;
  language: string;
  duration: number;
  timestamp: Date;
  audioUrl?: string;
}

export default function VoicePage() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  const [personalityLevel, setPersonalityLevel] = useState(5);
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'sad' | 'angry' | 'surprised'>('neutral');
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<TTSModel[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<SynthesisHistory[]>([]);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    checkHealth();
    loadModels();
  }, []);

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const checkHealth = async () => {
    try {
      const response = await apiClient.get('/voice-simple/health');
      setHealthStatus(response.data.success ? 'healthy' : 'unhealthy');
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const loadModels = async () => {
    try {
      const response = await apiClient.get('/voice-simple/models');
      if (response.data.success) {
        setModels(response.data.data.models || []);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      toast.error('Wprowadz tekst do syntezy');
      return;
    }

    if (text.length > 2000) {
      toast.error('Tekst nie moze przekraczac 2000 znakow');
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post(
        '/voice-simple/synthesize',
        {
          text,
          language,
          personalityLevel,
          emotion,
          speed,
        },
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      // Cleanup previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioBlob(blob);
      setAudioUrl(url);

      // Add to history
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          language,
          duration: 0,
          timestamp: new Date(),
          audioUrl: url,
        },
        ...prev.slice(0, 9),
      ]);

      toast.success('Synteza zakonczona');
    } catch (error) {
      console.error('Synthesis failed:', error);
      toast.error('Synteza nie powiodla sie');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(audioBlob);
      link.download = `tts_${language}_${Date.now()}.wav`;
      link.click();
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <MicrophoneIcon className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice TTS</h1>
            <p className="text-sm text-gray-600">Synteza tekstu na mowe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              healthStatus === 'healthy'
                ? 'bg-green-100 text-green-700'
                : healthStatus === 'unhealthy'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {healthStatus === 'healthy'
              ? 'TTS Online'
              : healthStatus === 'unhealthy'
              ? 'TTS Offline'
              : 'Sprawdzam...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tekst do syntezy
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Wprowadz tekst, ktory chcesz zamienic na mowe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
              rows={6}
              maxLength={2000}
            />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{text.length} / 2000 znakow</span>
              <button
                onClick={() => setText('')}
                className="text-gray-400 hover:text-gray-600"
              >
                Wyczysc
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              Ustawienia
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <LanguageIcon className="h-4 w-4 inline mr-1" />
                  Jezyk
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'pl' | 'en')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pl">Polski</option>
                  <option value="en">Angielski</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Emocja</label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value as typeof emotion)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="neutral">Neutralna</option>
                  <option value="happy">Wesola</option>
                  <option value="sad">Smutna</option>
                  <option value="angry">Zla</option>
                  <option value="surprised">Zdziwiona</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Predkosc: {speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Osobowosc: {personalityLevel}
                </label>
                <input
                  type="range"
                  value={personalityLevel}
                  onChange={(e) => setPersonalityLevel(parseInt(e.target.value))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={loading || !text.trim() || healthStatus !== 'healthy'}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Generuje...
                </>
              ) : (
                <>
                  <SpeakerWaveIcon className="h-5 w-5" />
                  Generuj mowe
                </>
              )}
            </button>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <SpeakerWaveIcon className="h-5 w-5" />
                Odtwarzacz
              </h3>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnd}
                className="hidden"
              />

              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlay}
                  className="p-4 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-6 w-6" />
                  ) : (
                    <PlayIcon className="h-6 w-6" />
                  )}
                </button>

                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-violet-600 transition-all ${
                      isPlaying ? 'animate-pulse' : ''
                    }`}
                    style={{ width: isPlaying ? '100%' : '0%' }}
                  />
                </div>

                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 hover:text-violet-600 transition-colors"
                  title="Pobierz WAV"
                >
                  <ArrowDownTrayIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Models */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <MicrophoneIcon className="h-5 w-5" />
              Dostepne modele
            </h3>
            {models.length === 0 ? (
              <p className="text-sm text-gray-500">Brak dostepnych modeli</p>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="p-2 border border-gray-100 rounded-lg text-sm"
                  >
                    <p className="font-medium text-gray-900">{model.name}</p>
                    <p className="text-gray-500">{model.language}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Historia
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Brak historii syntez
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (item.audioUrl) {
                        setAudioUrl(item.audioUrl);
                      }
                    }}
                  >
                    <p className="text-sm text-gray-900 line-clamp-2">{item.text}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="uppercase">{item.language}</span>
                      <span>
                        {item.timestamp.toLocaleTimeString('pl-PL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Phrases */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Szybkie frazy</h3>
            <div className="space-y-2">
              {[
                'Dzien dobry, w czym moge pomoc?',
                'Dziekujemy za kontakt.',
                'Prosimy o cierpliwosc.',
                'Oddzwonimy najszybciej jak to mozliwe.',
              ].map((phrase, index) => (
                <button
                  key={index}
                  onClick={() => setText(phrase)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
