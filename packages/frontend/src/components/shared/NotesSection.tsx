'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

interface NoteData {
  id: string;
  title?: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

interface NotesSectionProps {
  entityType: 'TASK' | 'PROJECT' | 'MEETING' | 'DEAL' | 'COMPANY' | 'CONTACT' | 'STREAM';
  entityId: string;
}

export default function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', isPinned: false });

  useEffect(() => {
    loadNotes();
  }, [entityType, entityId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/notes?entityType=${entityType}&entityId=${entityId}&limit=50`);
      setNotes(data.notes || data || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    try {
      if (editingNote) {
        await apiClient.patch(`/notes/${editingNote.id}`, formData);
      } else {
        await apiClient.post('/notes', {
          entityType,
          entityId,
          ...formData,
        });
      }
      setFormData({ title: '', content: '', isPinned: false });
      setShowForm(false);
      setEditingNote(null);
      await loadNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Usunąć notatkę?')) return;
    try {
      await apiClient.delete(`/notes/${noteId}`);
      await loadNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleEdit = (note: NoteData) => {
    setEditingNote(note);
    setFormData({ title: note.title || '', content: note.content, isPinned: note.isPinned });
    setShowForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Notatki ({notes.length})</h3>
        <button
          onClick={() => {
            setEditingNote(null);
            setFormData({ title: '', content: '', isPinned: false });
            setShowForm(!showForm);
          }}
          className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Dodaj notatkę
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <input
            type="text"
            placeholder="Tytuł (opcjonalnie)"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
          />
          <textarea
            placeholder="Treść notatki..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
            rows={3}
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              />
              <span>Przypnij</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingNote(null); }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {editingNote ? 'Zapisz' : 'Dodaj'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-3">
          {notes
            .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
            .map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${note.isPinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {note.title && (
                      <h4 className="font-medium text-gray-900 mb-1">
                        {note.isPinned && <span className="mr-1">📌</span>}
                        {note.title}
                      </h4>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>{formatDate(note.createdAt)}</span>
                      {note.createdBy && (
                        <span>{note.createdBy.firstName} {note.createdBy.lastName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edytuj"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Usuń"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Brak notatek</p>
          <p className="text-xs mt-1">Dodaj pierwszą notatkę do tej encji</p>
        </div>
      )}
    </div>
  );
}
