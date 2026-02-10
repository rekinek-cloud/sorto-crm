import { apiClient } from './client';

const API_URL = '/source';

export interface SourceItem {
    id: string;
    content: string;
    note?: string;
    sourceType: string;
    source: string;
    sourceUrl?: string;
    processed: boolean;
    capturedAt: string;
    capturedBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    // Flow Engine AI fields
    flowStatus?: string;
    elementType?: string;
    aiAnalysis?: {
        summary: string;
        elementType: string;
        entities: Array<{ type: string; value: string; confidence: number }>;
        keywords: string[];
        sentiment: string;
        urgency: string;
        actionability: string;
        estimatedTime?: string;
        splitRequired?: boolean;
    };
    suggestedAction?: string;
    suggestedStreams?: Array<{
        streamId: string;
        streamName: string;
        confidence: number;
        reason: string;
    }>;
    aiConfidence?: number;
    aiReasoning?: string;
    splitFromId?: string;
    userDecisionReason?: string;
}

export interface AddSourceItemInput {
    content: string;
    note?: string;
    sourceType?: string;
    source?: string;
    sourceUrl?: string;
    urgencyScore?: number;
    metadata?: {
        audioData?: string;
        audioDuration?: number;
        audioType?: string;
        transcription?: string;
        [key: string]: any;
    };
}

export interface ProcessSourceItemInput {
    decision: 'DO' | 'DEFER' | 'DELEGATE' | 'PROJECT' | 'SOMEDAY' | 'REFERENCE' | 'DELETE';
    targetStreamId?: string;
    actionData?: {
        title: string;
        description?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        dueDate?: string;
        assignedToId?: string;
        estimatedHours?: number;
    };
}

export interface SourceFilters {
    search?: string;
    source?: string;
    sortBy?: 'date_asc' | 'date_desc' | 'urgency_asc' | 'urgency_desc';
    urgencyLevel?: 'high' | 'medium' | 'low' | 'all';
    processed?: boolean;
}

export const sourceApi = {
    // Get all source items with optional filters
    getItems: async (filters?: SourceFilters): Promise<SourceItem[]> => {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.source) params.set('source', filters.source);
        if (filters?.sortBy) params.set('sortBy', filters.sortBy);
        if (filters?.urgencyLevel && filters.urgencyLevel !== 'all') params.set('urgencyLevel', filters.urgencyLevel);
        if (filters?.processed !== undefined) params.set('processed', String(filters.processed));
        const query = params.toString();
        const response = await apiClient.get(query ? `${API_URL}?${query}` : API_URL);
        return response.data;
    },

    // Add new item to source (uses quick-capture endpoint for full features including voice)
    addItem: async (data: AddSourceItemInput): Promise<SourceItem> => {
        const response = await apiClient.post(`${API_URL}/quick-capture`, data);
        return response.data.item;
    },

    // Process item
    processItem: async (id: string, data: ProcessSourceItemInput): Promise<void> => {
        await apiClient.post(`${API_URL}/${id}/process`, data);
    },

    // AI Routing
    routeContent: async (content: string): Promise<any> => {
        const response = await apiClient.post('/gtd-streams/route/content', { content });
        return response.data.data;
    }
};
