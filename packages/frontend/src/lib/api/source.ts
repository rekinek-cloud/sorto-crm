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

export const sourceApi = {
    // Get all source items
    getItems: async (): Promise<SourceItem[]> => {
        const response = await apiClient.get(API_URL);
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
