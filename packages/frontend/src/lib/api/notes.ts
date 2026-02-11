import apiClient from './client';
import { Note } from '@/types/gtd';

export interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NoteFilters {
  entityType?: 'TASK' | 'PROJECT' | 'MEETING' | 'DEAL' | 'COMPANY' | 'CONTACT' | 'STREAM';
  entityId?: string;
  page?: number;
  limit?: number;
}

export interface CreateNoteRequest {
  entityType: 'TASK' | 'PROJECT' | 'MEETING' | 'DEAL' | 'COMPANY' | 'CONTACT' | 'STREAM';
  entityId: string;
  title?: string;
  content: string;
  isPinned?: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  isPinned?: boolean;
}

export const notesApi = {
  async getNotes(filters: NoteFilters = {}): Promise<NotesResponse> {
    const params = new URLSearchParams();
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<NotesResponse>(`/notes?${params.toString()}`);
    return response.data;
  },

  async getNote(id: string): Promise<Note> {
    const response = await apiClient.get<Note>(`/notes/${id}`);
    return response.data;
  },

  async createNote(data: CreateNoteRequest): Promise<Note> {
    const response = await apiClient.post<Note>('/notes', data);
    return response.data;
  },

  async updateNote(id: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await apiClient.patch<Note>(`/notes/${id}`, data);
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await apiClient.delete(`/notes/${id}`);
  },
};

export default notesApi;
