import React from 'react';
import { Calendar, Mic, Tag, FileText } from 'lucide-react';
import { useNotesStore } from '../../store/notesStore';
import type { Note } from '../../types';

interface NotesListProps {
  onNoteSelect?: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ onNoteSelect }) => {
  const { getFilteredNotes, setCurrentNote } = useNotesStore();
  const notes = getFilteredNotes();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNoteClick = (note: Note) => {
    setCurrentNote(note);
    if (onNoteSelect) {
      onNoteSelect(note);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Brak notatek
        </h3>
        <p className="text-gray-500">
          Rozpocznij nagrywanie swojej pierwszej notatki głosowej
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          onClick={() => handleNoteClick(note)}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
              {note.title}
            </h3>
            {note.recording && (
              <div className="flex items-center text-indigo-600">
                <Mic size={16} className="mr-1" />
                <span className="text-sm">
                  {formatDuration(note.recording.duration)}
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {note.content || note.recording?.transcription || 'Brak treści'}
          </p>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{note.tags.length - 3} więcej
                </span>
              )}
            </div>
          )}

          {/* Summary if available */}
          {note.recording?.summary && (
            <div className="bg-indigo-50 p-2 rounded text-sm text-indigo-800 mb-3">
              <strong>AI Streszczenie:</strong> {note.recording.summary}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              {formatDate(note.timestamp)}
            </div>
            
            {note.category && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {note.category}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesList;