import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, Recording } from '../types';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
}

interface NotesActions {
  // Notes CRUD
  addNote: (note: Omit<Note, 'id' | 'timestamp' | 'lastModified'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  
  // Recording management
  addRecordingToNote: (noteId: string, recording: Recording) => void;
  
  // UI state
  setCurrentNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed values
  getFilteredNotes: () => Note[];
  getCategories: () => string[];
  
  // Utility
  clearAllNotes: () => void;
  exportNotes: () => string;
  importNotes: (jsonData: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotesStore = create<NotesState & NotesActions>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      currentNote: null,
      searchQuery: '',
      selectedCategory: 'all',
      isLoading: false,

      // Actions
      addNote: (noteData) => {
        const newNote: Note = {
          ...noteData,
          id: generateId(),
          timestamp: new Date(),
          lastModified: new Date(),
        };
        
        set((state) => ({
          notes: [newNote, ...state.notes],
          currentNote: newNote
        }));
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, lastModified: new Date() }
              : note
          ),
          currentNote: state.currentNote?.id === id 
            ? { ...state.currentNote, ...updates, lastModified: new Date() }
            : state.currentNote
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote
        }));
      },

      getNoteById: (id) => {
        return get().notes.find((note) => note.id === id);
      },

      addRecordingToNote: (noteId, recording) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, recording, lastModified: new Date() }
              : note
          )
        }));
      },

      setCurrentNote: (note) => {
        set({ currentNote: note });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      getFilteredNotes: () => {
        const { notes, searchQuery, selectedCategory } = get();
        
        return notes.filter((note) => {
          const matchesSearch = !searchQuery || 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
          
          const matchesCategory = selectedCategory === 'all' || 
            note.category === selectedCategory;
          
          return matchesSearch && matchesCategory;
        });
      },

      getCategories: () => {
        const { notes } = get();
        const categories = new Set<string>();
        
        notes.forEach((note) => {
          if (note.category) {
            categories.add(note.category);
          }
        });
        
        return Array.from(categories).sort();
      },

      clearAllNotes: () => {
        set({
          notes: [],
          currentNote: null,
          searchQuery: '',
          selectedCategory: 'all'
        });
      },

      exportNotes: () => {
        const { notes } = get();
        return JSON.stringify(notes, null, 2);
      },

      importNotes: (jsonData) => {
        try {
          const importedNotes = JSON.parse(jsonData) as Note[];
          set({ notes: importedNotes });
        } catch (error) {
          console.error('Failed to import notes:', error);
        }
      },
    }),
    {
      name: 'smartnotes-storage',
      partialize: (state) => ({
        notes: state.notes,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);