import React, { useState } from 'react';
import { Plus, FileText, Mic } from 'lucide-react';
import VoiceRecorder from '../components/recording/VoiceRecorder';
import TranscriptionView from '../components/transcription/TranscriptionView';
import NotesList from '../components/notes/NotesList';
import NotesSearch from '../components/notes/NotesSearch';
import NoteEditor from '../components/notes/NoteEditor';
import Button from '../components/common/Button';
import { useNotesStore } from '../store/notesStore';
import type { Note, Recording } from '../types';
import type { TranscriptionResult } from '../utils/transcription';

type ViewMode = 'list' | 'recording' | 'transcription' | 'editor';

const MainView: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [currentRecordingData, setCurrentRecordingData] = useState<{
    blob: Blob;
    duration: number;
  } | null>(null);
  
  const { addNote, currentNote, setCurrentNote } = useNotesStore();

  const handleStartRecording = () => {
    setCurrentView('recording');
  };

  const handleRecordingSaved = (audioBlob: Blob, duration: number) => {
    setCurrentRecordingData({ blob: audioBlob, duration });
    setCurrentAudioBlob(audioBlob);
    setCurrentView('transcription');
  };

  const handleTranscriptionComplete = (
    result: TranscriptionResult, 
    summary: string, 
    keywords: string[]
  ) => {
    if (!currentRecordingData) return;

    // Create new note with recording and transcription
    const recording: Recording = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Nagranie ${new Date().toLocaleString('pl-PL')}`,
      timestamp: new Date(),
      duration: currentRecordingData.duration,
      transcription: result.text,
      summary: summary,
      speakers: result.speakers?.map(s => s.speaker),
      tags: keywords,
    };

    const newNote = {
      title: summary || `Notatka z ${new Date().toLocaleDateString('pl-PL')}`,
      content: result.text,
      recording: recording,
      tags: keywords,
      category: 'Nagrania głosowe',
    };

    addNote(newNote);
    
    // Reset state and go back to list
    setCurrentAudioBlob(null);
    setCurrentRecordingData(null);
    setCurrentView('list');
  };

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note);
    setCurrentView('editor');
  };

  const handleBackToList = () => {
    setCurrentNote(null);
    setCurrentView('list');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'recording':
        return (
          <VoiceRecorder
            onSave={handleRecordingSaved}
            onCancel={() => setCurrentView('list')}
          />
        );

      case 'transcription':
        return (
          <TranscriptionView
            audioBlob={currentAudioBlob}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        );

      case 'editor':
        return currentNote ? (
          <NoteEditor
            note={currentNote}
            onClose={handleBackToList}
          />
        ) : (
          <div>Notatka nie została znaleziona</div>
        );

      case 'list':
      default:
        return (
          <div className="space-y-6">
            <NotesSearch />
            <NotesList onNoteSelect={handleNoteSelect} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Mic className="mr-3 text-indigo-600" size={28} />
                SmartNotes AI
              </h1>
              <p className="text-gray-600 mt-1">
                Inteligentne notatki głosowe z transkrypcją AI
              </p>
            </div>

            <div className="flex space-x-3">
              {currentView !== 'list' && (
                <Button
                  onClick={handleBackToList}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Lista notatek</span>
                </Button>
              )}
              
              {currentView === 'list' && (
                <Button
                  onClick={handleStartRecording}
                  variant="primary"
                  className="flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Nowa notatka</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderCurrentView()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>SmartNotes AI - Twoje notatki głosowe z mocą sztucznej inteligencji</p>
        </div>
      </div>
    </div>
  );
};

export default MainView;