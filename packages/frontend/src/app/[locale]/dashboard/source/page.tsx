'use client';

import React, { useState, useEffect } from 'react';
import { sourceApi, SourceItem } from '@/lib/api/source';
import { flowApi, FlowPendingItem, FLOW_ELEMENT_TYPE_LABELS } from '@/lib/api/flow';
import { FlowProcessModal, FlowBatchProcessor, FlowStatsPanel, FlowConversationModal } from '@/components/flow';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import {
    SparklesIcon,
    ClipboardDocumentListIcon,
    LightBulbIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    ArchiveBoxIcon,
    CheckCircleIcon,
    CalendarIcon,
    UserIcon,
    Squares2X2Icon,
    ArrowPathIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    MicrophoneIcon,
    BoltIcon,
    TagIcon,
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ClockIcon,
    UserGroupIcon,
    ScissorsIcon,
    PencilSquareIcon,
    XCircleIcon,
    AcademicCapIcon,
} from '@heroicons/react/24/outline';
import VoiceRecorder from '@/components/source/VoiceRecorder';

// Source types
const CAPTURE_SOURCES = {
    MEETING_NOTES: {
        name: 'Notatki ze spotkań',
        icon: ClipboardDocumentListIcon,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        description: 'Notatki z rozmów, spotkań, telefonów'
    },
    IDEA: {
        name: 'Pomysły',
        icon: LightBulbIcon,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        description: 'Pomysły które przyszły do głowy'
    },
    DOCUMENT: {
        name: 'Dokumenty',
        icon: DocumentTextIcon,
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        description: 'Dokumenty, pliki, załączniki'
    },
    EMAIL: {
        name: 'E-maile',
        icon: EnvelopeIcon,
        color: 'bg-red-50 border-red-200 text-red-800',
        description: 'E-maile wymagające akcji'
    },
    VOICE: {
        name: 'Nagranie głosowe',
        icon: MicrophoneIcon,
        color: 'bg-green-50 border-green-200 text-green-800',
        description: 'Nagrania głosowe i dyktafon'
    },
    OTHER: {
        name: 'Inne',
        icon: ArchiveBoxIcon,
        color: 'bg-gray-50 border-gray-200 text-gray-800',
        description: 'Wszystko inne'
    }
};

interface Stream {
    id: string;
    name: string;
    color?: string;
    description?: string;
}

export default function SourcePage() {
    const [items, setItems] = useState<SourceItem[]>([]);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCaptureForm, setShowCaptureForm] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [captureContent, setCaptureContent] = useState('');
    const [captureNote, setCaptureNote] = useState('');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioDuration, setAudioDuration] = useState<number>(0);

    // Flow Engine states
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showConversationModal, setShowConversationModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [processingItem, setProcessingItem] = useState<SourceItem | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [useDialogMode, setUseDialogMode] = useState(true); // Domyslnie tryb dialogowy

    // Human-in-the-Loop states
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());

    // Load source data and streams
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [sourceItems, streamsResponse] = await Promise.all([
                sourceApi.getItems(),
                apiClient.get('/gtd-streams'),
            ]);

            setItems(sourceItems || []);
            setStreams(streamsResponse.data?.data || []);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Błąd podczas ładowania danych');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle voice recording complete
    const handleVoiceRecordingComplete = (blob: Blob, duration: number) => {
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (blob.size > maxSize) {
            toast.error(`Nagranie jest za duże (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maksimum to 5MB.`);
            setAudioBlob(null);
            return;
        }
        setAudioBlob(blob);
        setAudioDuration(duration);
    };

    // Format audio duration
    const formatAudioDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Quick capture
    const handleQuickCapture = async () => {
        // Voice type requires audio blob
        if (selectedSource === 'VOICE') {
            if (!audioBlob) {
                toast.error('Nagraj najpierw wiadomość głosową');
                return;
            }
            // Convert blob to base64 for storage
            const reader = new FileReader();
            reader.onerror = () => {
                console.error('FileReader error:', reader.error);
                toast.error('Błąd odczytu nagrania. Spróbuj ponownie.');
            };
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                try {
                    await sourceApi.addItem({
                        content: captureContent.trim() || `Nagranie głosowe (${formatAudioDuration(audioDuration)})`,
                        note: captureNote.trim() || undefined,
                        sourceType: 'VOICE',
                        source: 'voice',
                        metadata: {
                            audioData: base64Audio,
                            audioDuration: audioDuration,
                            audioType: 'audio/webm'
                        }
                    });
                    toast.success('Nagranie dodane do Źródła!');
                    resetCaptureForm();
                    loadData();
                } catch (error: any) {
                    console.error('Error capturing voice:', error);
                    const msg = error?.response?.status === 413
                        ? 'Nagranie jest za duże dla serwera. Nagraj krótszą wiadomość.'
                        : 'Błąd podczas dodawania nagrania';
                    toast.error(msg);
                }
            };
            reader.readAsDataURL(audioBlob);
            return;
        }

        // Regular capture
        if (!selectedSource || !captureContent.trim()) {
            toast.error('Wybierz źródło i wprowadź treść');
            return;
        }

        try {
            await sourceApi.addItem({
                content: captureContent.trim(),
                note: captureNote.trim() || undefined,
                sourceType: selectedSource,
                source: 'manual'
            });

            toast.success('Dodano do Źródła!');
            resetCaptureForm();
            loadData();
        } catch (error: any) {
            console.error('Error capturing item:', error);
            toast.error('Błąd podczas dodawania do źródła');
        }
    };

    // Reset capture form
    const resetCaptureForm = () => {
        setCaptureContent('');
        setCaptureNote('');
        setSelectedSource('');
        setAudioBlob(null);
        setAudioDuration(0);
        setShowCaptureForm(false);
    };

    // Handle process item with Flow Engine
    const handleProcess = (item: SourceItem) => {
        setProcessingItem(item);
        if (useDialogMode) {
            setShowConversationModal(true);
        } else {
            setShowProcessModal(true);
        }
    };

    // Handle batch processing
    const handleBatchProcess = () => {
        if (selectedItems.size === 0) {
            toast.error('Wybierz elementy do przetworzenia');
            return;
        }
        setShowBatchModal(true);
    };

    // Quick approve AI suggestion (Human-in-the-Loop: Zatwierdź)
    const handleQuickApprove = async (item: SourceItem) => {
        if (!item.suggestedAction) return;

        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            const streamId = item.suggestedStreams?.[0]?.streamId;

            // Use confirm endpoint - triggers learning automatically
            await apiClient.post(`/flow/confirm/${item.id}`, {
                action: item.suggestedAction,
                streamId,
                reason: 'Zatwierdzono sugestię AI'
            });

            // Record positive feedback
            await flowApi.recordFeedback(item.id, {
                suggestedAction: item.suggestedAction as any,
                actualAction: item.suggestedAction as any,
                wasHelpful: true
            });

            // Show learning indicator
            setLearnedIds(prev => new Set(prev).add(item.id));
            toast.success('Zatwierdzone! AI się uczy z Twojej decyzji');

            // Refresh after short delay to show the learning indicator
            setTimeout(() => {
                loadData();
                setLearnedIds(prev => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                });
            }, 1500);
        } catch (error: any) {
            console.error('Quick approve error:', error);
            toast.error('Błąd podczas zatwierdzania: ' + (error?.response?.data?.error || error.message));
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    // Reject AI suggestion (Human-in-the-Loop: Odrzuć)
    const handleReject = async (item: SourceItem) => {
        if (!item.suggestedAction) return;

        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            // Record negative feedback - weakens pattern
            await flowApi.recordFeedback(item.id, {
                suggestedAction: item.suggestedAction as any,
                actualAction: 'USUN' as any, // Rejection
                wasHelpful: false
            });

            toast.success('Sugestia odrzucona. AI się uczy.');
            setRejectingId(null);
            setRejectReason('');
            loadData();
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.error('Błąd podczas odrzucania');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    // Toggle item selection
    const toggleItemSelection = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    // Select all items
    const selectAllItems = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(i => i.id)));
        }
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'przed chwilą';
        if (diffHours < 24) return `${diffHours}h temu`;
        if (diffDays < 7) return `${diffDays} dni temu`;
        return date.toLocaleDateString('pl-PL');
    };

    // Convert SourceItem to FlowPendingItem for batch processing
    const sourceItemsToFlowItems = (sourceItems: SourceItem[]): FlowPendingItem[] => {
        return sourceItems.map(item => ({
            id: item.id,
            type: (item.sourceType === 'EMAIL' ? 'EMAIL' :
                   item.sourceType === 'IDEA' ? 'IDEA' :
                   item.sourceType === 'DOCUMENT' ? 'DOCUMENT' :
                   item.sourceType === 'MEETING_NOTES' ? 'NOTE' : 'OTHER') as any,
            title: item.content,
            content: item.note,
            capturedAt: item.capturedAt,
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3">Ładowanie Źródła...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-blue-600" />
                        Źródło (Source)
                    </h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">
                        <strong>Wszystko zaczyna się tutaj.</strong> To jest Twoje centralne miejsce zrzutu.
                        Wszystkie nowe informacje, pomysły i zadania trafiają tutaj, zanim popłyną do odpowiednich Strumieni.
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Dialog Mode Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setUseDialogMode(false)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                !useDialogMode
                                    ? 'bg-white shadow text-indigo-700'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <SparklesIcon className="w-4 h-4" />
                            Klasyczny
                        </button>
                        <button
                            onClick={() => setUseDialogMode(true)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                useDialogMode
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            Dialogowy
                        </button>
                    </div>

                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            showStats
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        Statystyki
                    </button>
                    <button
                        onClick={() => setShowCaptureForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                        Dodaj do Źródła
                    </button>
                </div>
            </div>

            {/* Stats Panel */}
            {showStats && (
                <FlowStatsPanel />
            )}

            {/* Batch Actions Bar */}
            {items.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedItems.size === items.length && items.length > 0}
                                onChange={selectAllItems}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-600">
                                Zaznacz wszystkie ({selectedItems.size}/{items.length})
                            </span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Odśwież
                        </button>

                        {selectedItems.size > 0 && (
                            <button
                                onClick={handleBatchProcess}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Squares2X2Icon className="w-5 h-5" />
                                Przetwórz zaznaczone ({selectedItems.size})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Elementy w Źródle ({items.length})
                    </h2>
                </div>

                {items.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <h3 className="text-xl font-bold text-green-600 mb-2">Źródło jest czyste!</h3>
                        <p className="text-gray-600">
                            Wszystko zostało przetworzone i popłynęło do odpowiednich strumieni.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {items.map((item) => {
                            const sourceConfig = CAPTURE_SOURCES[item.sourceType as keyof typeof CAPTURE_SOURCES] || CAPTURE_SOURCES.OTHER;
                            const isSelected = selectedItems.has(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`p-6 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleItemSelection(item.id)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${sourceConfig.color}`}>
                                                    <sourceConfig.icon className="w-4 h-4" />
                                                    {sourceConfig.name}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-medium text-gray-900 mb-2">
                                                {item.content}
                                            </h3>

                                            {item.note && (
                                                <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                                                    {item.note}
                                                </p>
                                            )}

                                            {/* AI Analysis Results */}
                                            {item.aiAnalysis && (
                                                <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <SparklesIcon className="w-4 h-4 text-indigo-600" />
                                                        <span className="text-xs font-semibold text-indigo-700 uppercase">Analiza AI</span>
                                                        {item.aiConfidence != null && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                item.aiConfidence >= 0.8 ? 'bg-green-100 text-green-700' :
                                                                item.aiConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {Math.round(item.aiConfidence * 100)}%
                                                            </span>
                                                        )}
                                                        {item.flowStatus && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                item.flowStatus === 'AWAITING_DECISION' ? 'bg-amber-100 text-amber-700' :
                                                                item.flowStatus === 'SPLIT' ? 'bg-blue-100 text-blue-700' :
                                                                item.flowStatus === 'PROCESSED' ? 'bg-green-100 text-green-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {item.flowStatus === 'AWAITING_DECISION' ? 'Czeka na decyzję' :
                                                                 item.flowStatus === 'SPLIT' ? 'Podzielony' :
                                                                 item.flowStatus === 'PROCESSED' ? 'Przetworzony' :
                                                                 item.flowStatus}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* AI Summary */}
                                                    <p className="text-sm text-gray-700 mb-2">{item.aiAnalysis.summary}</p>

                                                    {/* Suggested Action + Stream */}
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {item.suggestedAction && (
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${
                                                                item.suggestedAction === 'ZROB_TERAZ' ? 'bg-red-100 text-red-700' :
                                                                item.suggestedAction === 'ZAPLANUJ' ? 'bg-blue-100 text-blue-700' :
                                                                item.suggestedAction === 'PROJEKT' ? 'bg-purple-100 text-purple-700' :
                                                                item.suggestedAction === 'KIEDYS_MOZE' ? 'bg-cyan-100 text-cyan-700' :
                                                                item.suggestedAction === 'REFERENCJA' ? 'bg-gray-100 text-gray-700' :
                                                                item.suggestedAction === 'USUN' ? 'bg-red-50 text-red-500' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                <BoltIcon className="w-3 h-3" />
                                                                {item.suggestedAction === 'ZROB_TERAZ' ? 'Zrób teraz' :
                                                                 item.suggestedAction === 'ZAPLANUJ' ? 'Zaplanuj' :
                                                                 item.suggestedAction === 'PROJEKT' ? 'Projekt' :
                                                                 item.suggestedAction === 'KIEDYS_MOZE' ? 'Kiedyś/może' :
                                                                 item.suggestedAction === 'REFERENCJA' ? 'Referencja' :
                                                                 item.suggestedAction === 'USUN' ? 'Usuń' :
                                                                 item.suggestedAction}
                                                            </span>
                                                        )}
                                                        {item.suggestedStreams?.[0] && (
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-indigo-100 text-indigo-700">
                                                                <TagIcon className="w-3 h-3" />
                                                                → {item.suggestedStreams[0].streamName}
                                                            </span>
                                                        )}
                                                        {item.aiAnalysis.urgency && (
                                                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                                                                item.aiAnalysis.urgency === 'high' ? 'bg-red-50 text-red-600' :
                                                                item.aiAnalysis.urgency === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                                                'bg-green-50 text-green-600'
                                                            }`}>
                                                                {item.aiAnalysis.urgency === 'high' ? '🔴 Pilne' :
                                                                 item.aiAnalysis.urgency === 'medium' ? '🟡 Średnie' : '🟢 Niskie'}
                                                            </span>
                                                        )}
                                                        {item.aiAnalysis.estimatedTime && (
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-50 text-gray-600">
                                                                <ClockIcon className="w-3 h-3" />
                                                                {item.aiAnalysis.estimatedTime}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Entities */}
                                                    {item.aiAnalysis.entities.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.aiAnalysis.entities.slice(0, 6).map((entity, idx) => (
                                                                <span key={idx} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                                                                    entity.type === 'person' ? 'bg-blue-50 text-blue-600' :
                                                                    entity.type === 'company' ? 'bg-purple-50 text-purple-600' :
                                                                    entity.type === 'amount' ? 'bg-green-50 text-green-600' :
                                                                    entity.type === 'date' || entity.type === 'deadline' ? 'bg-orange-50 text-orange-600' :
                                                                    entity.type === 'task' ? 'bg-cyan-50 text-cyan-600' :
                                                                    'bg-gray-50 text-gray-500'
                                                                }`}>
                                                                    {entity.type === 'person' && <UserGroupIcon className="w-3 h-3" />}
                                                                    {entity.type === 'company' && <BuildingOfficeIcon className="w-3 h-3" />}
                                                                    {entity.type === 'amount' && <CurrencyDollarIcon className="w-3 h-3" />}
                                                                    {(entity.type === 'date' || entity.type === 'deadline') && <CalendarIcon className="w-3 h-3" />}
                                                                    {entity.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reject reason input */}
                                            {rejectingId === item.id && (
                                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm font-medium text-red-700 mb-2">Dlaczego odrzucasz sugestię?</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="Opcjonalny powód..."
                                                            className="flex-1 px-3 py-1.5 text-sm border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleReject(item); }}
                                                        />
                                                        <button
                                                            onClick={() => handleReject(item)}
                                                            disabled={processingIds.has(item.id)}
                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-md"
                                                        >
                                                            Odrzuć
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md"
                                                        >
                                                            Anuluj
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Split indicator */}
                                            {item.flowStatus === 'SPLIT' && (
                                                <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded">
                                                    <ScissorsIcon className="w-4 h-4" />
                                                    Element podzielony na części — podzadania są w Źródle
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    {formatTimeAgo(item.capturedAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <UserIcon className="w-4 h-4" />
                                                    {item.capturedBy?.firstName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons - Human-in-the-Loop */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {item.aiAnalysis && item.suggestedAction && item.flowStatus !== 'PROCESSED' ? (
                                                <>
                                                    {/* Zatwierdź - Quick approve */}
                                                    <button
                                                        onClick={() => handleQuickApprove(item)}
                                                        disabled={processingIds.has(item.id)}
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        {processingIds.has(item.id) ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                        )}
                                                        Zatwierdź
                                                    </button>

                                                    {/* Koryguj - Open modal for editing */}
                                                    <button
                                                        onClick={() => handleProcess(item)}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                        Koryguj
                                                    </button>

                                                    {/* Odrzuć - Reject suggestion */}
                                                    <button
                                                        onClick={() => setRejectingId(rejectingId === item.id ? null : item.id)}
                                                        disabled={processingIds.has(item.id)}
                                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                        Odrzuć
                                                    </button>

                                                    {/* Learning indicator */}
                                                    {learnedIds.has(item.id) && (
                                                        <div className="flex items-center gap-1 text-xs text-indigo-600 animate-pulse">
                                                            <AcademicCapIcon className="w-3.5 h-3.5" />
                                                            AI się uczy...
                                                        </div>
                                                    )}
                                                </>
                                            ) : item.flowStatus === 'PROCESSED' ? (
                                                <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center gap-2">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Przetworzony
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleProcess(item)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <SparklesIcon className="w-4 h-4" />
                                                    Flow
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Capture Form Modal */}
            {showCaptureForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                            Dodaj do Źródła
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(CAPTURE_SOURCES).map(([key, source]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedSource(key);
                                            // Reset audio when switching away from VOICE
                                            if (key !== 'VOICE') {
                                                setAudioBlob(null);
                                                setAudioDuration(0);
                                            }
                                        }}
                                        className={`p-3 rounded-lg border text-left transition-colors ${selectedSource === key
                                            ? source.color + ' border-current'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            <source.icon className="w-5 h-5" />
                                            {source.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Recorder - shown when VOICE type selected */}
                        {selectedSource === 'VOICE' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nagranie głosowe
                                </label>
                                <VoiceRecorder
                                    onRecordingComplete={handleVoiceRecordingComplete}
                                    maxDuration={300}
                                    className="mb-2"
                                />
                                {audioBlob && (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Nagranie gotowe ({formatAudioDuration(audioDuration)})
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Content field - optional for voice, required for others */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {selectedSource === 'VOICE' ? 'Tytuł nagrania (opcjonalnie)' : 'Treść'}
                            </label>
                            <textarea
                                value={captureContent}
                                onChange={(e) => setCaptureContent(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={selectedSource === 'VOICE' ? 2 : 3}
                                placeholder={selectedSource === 'VOICE' ? 'Opcjonalny opis nagrania...' : 'Co chcesz przechwycić?'}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notatka (opcjonalnie)</label>
                            <textarea
                                value={captureNote}
                                onChange={(e) => setCaptureNote(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="Dodatkowe informacje..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={resetCaptureForm}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleQuickCapture}
                                disabled={
                                    !selectedSource ||
                                    (selectedSource === 'VOICE' ? !audioBlob : !captureContent.trim())
                                }
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700"
                            >
                                {selectedSource === 'VOICE' ? 'Dodaj nagranie' : 'Dodaj'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Flow Process Modal (Classic Mode) */}
            {showProcessModal && processingItem && (
                <FlowProcessModal
                    item={processingItem}
                    streams={streams}
                    onClose={() => {
                        setShowProcessModal(false);
                        setProcessingItem(null);
                    }}
                    onProcessed={() => {
                        loadData();
                        setSelectedItems(new Set());
                    }}
                />
            )}

            {/* Flow Conversation Modal (Dialog Mode) */}
            {showConversationModal && processingItem && (
                <FlowConversationModal
                    item={processingItem}
                    streams={streams}
                    onClose={() => {
                        setShowConversationModal(false);
                        setProcessingItem(null);
                    }}
                    onProcessed={() => {
                        loadData();
                        setSelectedItems(new Set());
                    }}
                />
            )}

            {/* Flow Batch Processor Modal */}
            {showBatchModal && (
                <FlowBatchProcessor
                    items={sourceItemsToFlowItems(items.filter(i => selectedItems.has(i.id)))}
                    streams={streams}
                    onClose={() => setShowBatchModal(false)}
                    onProcessed={() => {
                        loadData();
                        setSelectedItems(new Set());
                    }}
                />
            )}
        </div>
    );
}
