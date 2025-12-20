import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import AudioVisualizer from './AudioVisualizer';

interface VoiceRecorderProps {
  onSave?: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave, onCancel, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  } = useAudioRecording();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = () => {
    if (audioBlob && onSave) {
      onSave(audioBlob, recordingTime);
      clearRecording();
    }
  };

  const handleClear = () => {
    clearRecording();
    setIsPlaying(false);
    if (onCancel) {
      onCancel();
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-6 text-center bg-red-50 rounded-lg ${className}`}>
        <p className="text-red-600">
          Twoja przeglądarka nie obsługuje nagrywania audio.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center bg-red-50 rounded-lg ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={clearRecording}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nagrywanie głosowe
        </h3>
        <div className="text-3xl font-mono text-primary-600">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* Audio Visualizer */}
      <div className="mb-6">
        <AudioVisualizer 
          isRecording={isRecording}
          stream={undefined} // Will be passed from the hook in a more advanced implementation
        />
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Mic size={20} className="mr-2" />
            Rozpocznij nagrywanie
          </button>
        )}

        {isRecording && (
          <div className="flex space-x-3">
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="p-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Pause size={20} />
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="p-3 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Play size={20} />
              </button>
            )}
            
            <button
              onClick={stopRecording}
              className="p-3 border border-red-200 rounded-md text-red-600 bg-red-50 hover:bg-red-100"
            >
              <Square size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {audioUrl && !isRecording && (
        <div className="space-y-4">
          <div className="flex justify-center space-x-3">
            <button
              onClick={handlePlayPause}
              className="p-3 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="w-full"
            controls
          />

          <div className="flex justify-center space-x-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Save size={16} className="mr-2" />
              Zapisz nagranie
            </button>
            
            <button
              onClick={handleClear}
              className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
            >
              <Trash2 size={16} className="mr-2" />
              Usuń
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;