'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onTranscriptionComplete?: (text: string) => void;
  maxDuration?: number; // max duration in seconds
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing';

export default function VoiceRecorder({
  onRecordingComplete,
  onTranscriptionComplete,
  maxDuration = 300, // 5 minutes default
  className = '',
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingState('recorded');
        onRecordingComplete(audioBlob, duration);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecordingState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      toast.success('Nagrywanie rozpoczete');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Nie udalo sie uruchomic mikrofonu. Sprawdz uprawnienia.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setRecordingState('playing');
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setRecordingState('recorded');
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingState('idle');
    setDuration(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioEnded = () => {
    setRecordingState('recorded');
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
      )}

      {/* Recording visualization */}
      <div className="flex items-center justify-center gap-4">
        {/* Main action button */}
        {recordingState === 'idle' && (
          <button
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
            title="Rozpocznij nagrywanie"
          >
            <Mic className="w-8 h-8" />
          </button>
        )}

        {recordingState === 'recording' && (
          <div className="flex items-center gap-4">
            {/* Recording indicator */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-600 font-medium">Nagrywanie...</span>
            </div>

            {/* Timer */}
            <span className="text-lg font-mono font-bold text-gray-700">
              {formatTime(duration)} / {formatTime(maxDuration)}
            </span>

            {/* Stop button */}
            <button
              onClick={stopRecording}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
              title="Zatrzymaj nagrywanie"
            >
              <Square className="w-6 h-6" />
            </button>
          </div>
        )}

        {(recordingState === 'recorded' || recordingState === 'playing') && (
          <div className="flex items-center gap-4 w-full">
            {/* Play/Pause button */}
            {recordingState === 'recorded' ? (
              <button
                onClick={playRecording}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="Odtworz"
              >
                <Play className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-lg"
                title="Pauza"
              >
                <Pause className="w-6 h-6" />
              </button>
            )}

            {/* Duration */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 font-medium">Nagranie glosowe</span>
              </div>
              <span className="text-sm text-gray-500">Dlugosc: {formatTime(duration)}</span>
            </div>

            {/* Delete button */}
            <button
              onClick={deleteRecording}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors"
              title="Usun nagranie"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar during recording */}
      {recordingState === 'recording' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      {recordingState === 'idle' && (
        <p className="text-center text-sm text-gray-500 mt-3">
          Kliknij przycisk mikrofonu aby rozpoczac nagrywanie (max {Math.floor(maxDuration / 60)} min)
        </p>
      )}

      {/* Transcription loading */}
      {isTranscribing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
          <span className="text-sm">Transkrybowanie...</span>
        </div>
      )}
    </div>
  );
}
