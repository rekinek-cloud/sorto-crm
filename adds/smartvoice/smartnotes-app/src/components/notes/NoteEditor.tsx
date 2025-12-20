import React, { useState, useEffect } from 'react';
import { Save, Trash2, Edit3, Tag, Folder } from 'lucide-react';
import { useNotesStore } from '../../store/notesStore';
import Button from '../common/Button';
import type { Note } from '../../types';

interface NoteEditorProps {
  note: Note;
  onClose?: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onClose }) => {
  const { updateNote, deleteNote } = useNotesStore();
  
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category || '');
  const [tags, setTags] = useState(note.tags.join(', '));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || '');
    setTags(note.tags.join(', '));
  }, [note]);

  const handleSave = () => {
    const updatedNote = {
      title: title.trim() || 'Bez tytułu',
      content: content.trim(),
      category: category.trim() || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
    };

    updateNote(note.id, updatedNote);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
      deleteNote(note.id);
      if (onClose) {
        onClose();
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-xl font-semibold placeholder-white/70 border-b border-white/30 focus:border-white outline-none"
                placeholder="Tytuł notatki..."
              />
            ) : (
              <h2 className="text-xl font-semibold">{note.title}</h2>
            )}
            <p className="text-white/80 text-sm mt-1">
              Utworzona: {formatDate(note.timestamp)}
            </p>
            {note.lastModified.getTime() !== note.timestamp.getTime() && (
              <p className="text-white/80 text-sm">
                Zmodyfikowana: {formatDate(note.lastModified)}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2 ml-4">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="secondary"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Edit3 size={16} />
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  variant="secondary"
                  size="sm"
                  className="bg-green-500 border-green-500 text-white hover:bg-green-600"
                >
                  <Save size={16} />
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Anuluj
                </Button>
              </div>
            )}
            
            <Button
              onClick={handleDelete}
              variant="secondary"
              size="sm"
              className="bg-red-500 border-red-500 text-white hover:bg-red-600"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recording Info */}
        {note.recording && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Nagranie głosowe</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Czas trwania:</span>
                <span className="ml-2 font-medium">
                  {Math.floor(note.recording.duration / 60)}:
                  {(note.recording.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {note.recording.summary && (
                <div className="col-span-2">
                  <span className="text-blue-700">AI Streszczenie:</span>
                  <p className="mt-1 text-blue-800">{note.recording.summary}</p>
                </div>
              )}
            </div>
            
            {note.recording.audioUrl && (
              <audio controls className="w-full mt-3">
                <source src={note.recording.audioUrl} type="audio/webm" />
                Twoja przeglądarka nie obsługuje elementu audio.
              </audio>
            )}
          </div>
        )}

        {/* Transcription */}
        {note.recording?.transcription && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Transkrypcja</h3>
            <p className="text-gray-700 leading-relaxed">
              {note.recording.transcription}
            </p>
          </div>
        )}

        {/* Content */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Treść notatki</h3>
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="Napisz swoją notatkę..."
            />
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
              {content ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
              ) : (
                <p className="text-gray-500 italic">Brak treści</p>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Folder size={16} className="inline mr-1" />
              Kategoria
            </label>
            {isEditing ? (
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="np. Praca, Osobiste..."
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-lg">
                {note.category ? (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                    {note.category}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">Brak kategorii</span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag size={16} className="inline mr-1" />
              Tagi
            </label>
            {isEditing ? (
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="tag1, tag2, tag3..."
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-lg min-h-[36px]">
                {note.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 italic">Brak tagów</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;