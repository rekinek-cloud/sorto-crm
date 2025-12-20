import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import AudioVisualizer from './AudioVisualizer';
import Button from '../common/Button';

interface VoiceRecorderProps {
  onSave?: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave, onCancel }) => {
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
      <div className="p-6 text-center bg-red-50 rounded-lg">
        <p className="text-red-600">
          Twoja przeglądarka nie obsługuje nagrywania audio.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-lg">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={clearRecording} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Nagrywanie głosowe
        </h3>
        <div className="text-3xl font-mono text-indigo-600">
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
          <Button
            onClick={startRecording}
            variant="primary"
            size="lg"
            className="flex items-center space-x-2"
          >
            <Mic size={20} />
            <span>Rozpocznij nagrywanie</span>
          </Button>
        )}

        {isRecording && (
          <div className="flex space-x-3">
            {!isPaused ? (
              <Button
                onClick={pauseRecording}
                variant="secondary"
                size="lg"
              >
                <Pause size={20} />
              </Button>
            ) : (
              <Button
                onClick={resumeRecording}
                variant="primary"
                size="lg"
              >
                <Play size={20} />
              </Button>
            )}
            
            <Button
              onClick={stopRecording}
              variant="outline"
              size="lg"
              className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            >
              <Square size={20} />
            </Button>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {audioUrl && !isRecording && (
        <div className="space-y-4">
          <div className="flex justify-center space-x-3">
            <Button
              onClick={handlePlayPause}
              variant="primary"
              size="lg"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
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
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Zapisz nagranie</span>
            </Button>
            
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} />
              <span>Usuń</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;