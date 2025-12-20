'use client';

import React, { useState, useEffect } from 'react';
import { sourceApi, SourceItem } from '@/lib/api/source';
import { toast } from 'react-hot-toast';
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
    XMarkIcon
} from '@heroicons/react/24/outline';

// Source types
const CAPTURE_SOURCES = {
    MEETING_NOTES: {
        name: 'Notatki ze spotkan',
        icon: ClipboardDocumentListIcon,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        description: 'Notatki z rozmow, spotkan, telefonow'
    },
    IDEA: {
        name: 'Pomysly',
        icon: LightBulbIcon,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        description: 'Pomysly ktore przyszly do glowy'
    },
    DOCUMENT: {
        name: 'Dokumenty',
        icon: DocumentTextIcon,
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        description: 'Dokumenty, pliki, zalaczniki'
    },
    EMAIL: {
        name: 'E-maile',
        icon: EnvelopeIcon,
        color: 'bg-red-50 border-red-200 text-red-800',
        description: 'E-maile wymagajace akcji'
    },
    OTHER: {
        name: 'Inne',
        icon: ArchiveBoxIcon,
        color: 'bg-gray-50 border-gray-200 text-gray-800',
        description: 'Wszystko inne'
    }
};

export default function SourcePage() {
    const [items, setItems] = useState<SourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCaptureForm, setShowCaptureForm] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [captureContent, setCaptureContent] = useState('');
    const [captureNote, setCaptureNote] = useState('');
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processingItem, setProcessingItem] = useState<SourceItem | null>(null);

    // Load source data
    const loadSourceData = async () => {
        try {
            setLoading(true);
            setError(null);
            const sourceItems = await sourceApi.getItems();
            setItems(sourceItems || []);
        } catch (err: any) {
            console.error('Error loading source data:', err);
            // Don't show error for auth issues - user might not be logged in
            if (err?.response?.status !== 401) {
                setError('Nie udalo sie zaladowac danych');
            }
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Quick capture
    const handleQuickCapture = async () => {
        if (!selectedSource || !captureContent.trim()) {
            toast.error('Wybierz zrodlo i wprowadz tresc');
            return;
        }

        try {
            await sourceApi.addItem({
                content: captureContent.trim(),
                note: captureNote.trim() || undefined,
                sourceType: selectedSource,
                source: 'manual'
            });

            toast.success('Dodano do Zrodla!');
            setCaptureContent('');
            setCaptureNote('');
            setSelectedSource('');
            setShowCaptureForm(false);
            loadSourceData();
        } catch (error: any) {
            console.error('Error capturing item:', error);
            toast.error('Blad podczas dodawania do zrodla');
        }
    };

    // Handle process item
    const handleProcess = (item: SourceItem) => {
        setProcessingItem(item);
        setShowProcessModal(true);
    };

    // Load data on mount
    useEffect(() => {
        loadSourceData();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'przed chwila';
        if (diffHours < 24) return `${diffHours}h temu`;
        if (diffDays < 7) return `${diffDays} dni temu`;
        return date.toLocaleDateString('pl-PL');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Ladowanie Zrodla...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <SparklesIcon className="w-8 h-8 text-blue-600" />
                        Zrodlo (Source)
                    </h1>
                    <p className="text-gray-600 mt-2 max-w-2xl">
                        <strong>Wszystko zaczyna sie tutaj.</strong> To jest Twoje centralne miejsce zrzutu.
                        Wszystkie nowe informacje, pomysly i zadania trafiaja tutaj, zanim poplyna do odpowiednich Strumieni.
                    </p>
                </div>
                <button
                    onClick={() => setShowCaptureForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                    Dodaj do Zrodla
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Elementy w Zrodle ({items.length})
                    </h2>
                </div>

                {items.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <h3 className="text-xl font-bold text-green-600 mb-2">Zrodlo jest czyste!</h3>
                        <p className="text-gray-600">
                            Wszystko zostalo przetworzone i poplyneloie do odpowiednich strumieni.
                        </p>
                        <button
                            onClick={() => setShowCaptureForm(true)}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            + Dodaj nowy element
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {items.map((item) => {
                            const sourceConfig = CAPTURE_SOURCES[item.sourceType as keyof typeof CAPTURE_SOURCES] || CAPTURE_SOURCES.OTHER;
                            const SourceIcon = sourceConfig.icon;
                            return (
                                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${sourceConfig.color}`}>
                                                    <SourceIcon className="w-4 h-4" />
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

                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    {formatTimeAgo(item.capturedAt)}
                                                </span>
                                                {item.capturedBy && (
                                                    <span className="flex items-center gap-1">
                                                        <UserIcon className="w-4 h-4" />
                                                        {item.capturedBy.firstName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleProcess(item)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                            Przetworz (Flow)
                                        </button>
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                                Dodaj do Zrodla
                            </h3>
                            <button
                                onClick={() => setShowCaptureForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Typ zrodla</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(CAPTURE_SOURCES).map(([key, source]) => {
                                    const Icon = source.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedSource(key)}
                                            className={`p-3 rounded-lg border text-left transition-colors ${selectedSource === key
                                                ? source.color + ' border-current'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="font-medium flex items-center gap-2">
                                                <Icon className="w-5 h-5" />
                                                {source.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tresc *</label>
                            <textarea
                                value={captureContent}
                                onChange={(e) => setCaptureContent(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Opisz co chcesz dodac..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notatka (opcjonalnie)</label>
                            <textarea
                                value={captureNote}
                                onChange={(e) => setCaptureNote(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                                placeholder="Dodatkowe informacje..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCaptureForm(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleQuickCapture}
                                disabled={!selectedSource || !captureContent.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                            >
                                Dodaj
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Process Modal */}
            {showProcessModal && processingItem && (
                <ProcessModal
                    item={processingItem}
                    onClose={() => {
                        setShowProcessModal(false);
                        setProcessingItem(null);
                    }}
                    onProcess={async (decision, data) => {
                        try {
                            await sourceApi.processItem(processingItem.id, {
                                decision: decision as any,
                                ...data
                            });
                            toast.success('Element poplynal do strumienia!');
                            loadSourceData();
                            setShowProcessModal(false);
                            setProcessingItem(null);
                        } catch (error: any) {
                            console.error('Error processing item:', error);
                            toast.error('Blad podczas przetwarzania');
                        }
                    }}
                />
            )}
        </div>
    );
}

// Process Modal Component
function ProcessModal({ item, onClose, onProcess }: {
    item: SourceItem;
    onClose: () => void;
    onProcess: (d: string, data: any) => Promise<void>;
}) {
    const [decision, setDecision] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Auto-run AI routing
        const runAi = async () => {
            setLoadingAi(true);
            try {
                const suggestion = await sourceApi.routeContent(item.content + (item.note ? ' ' + item.note : ''));
                setAiSuggestion(suggestion);
            } catch (e) {
                console.error('AI routing failed', e);
            } finally {
                setLoadingAi(false);
            }
        };
        runAi();
    }, [item]);

    const handleSubmit = async () => {
        if (!decision) return;
        setProcessing(true);
        try {
            await onProcess(decision, { actionData: { title: item.content } });
        } finally {
            setProcessing(false);
        }
    };

    const decisions = [
        { key: 'DO', label: 'Zrob teraz', color: 'bg-green-100 border-green-500 text-green-800' },
        { key: 'DEFER', label: 'Odloz', color: 'bg-yellow-100 border-yellow-500 text-yellow-800' },
        { key: 'DELEGATE', label: 'Deleguj', color: 'bg-blue-100 border-blue-500 text-blue-800' },
        { key: 'PROJECT', label: 'Projekt', color: 'bg-purple-100 border-purple-500 text-purple-800' },
        { key: 'SOMEDAY', label: 'Kiedys/Moze', color: 'bg-orange-100 border-orange-500 text-orange-800' },
        { key: 'REFERENCE', label: 'Referencja', color: 'bg-gray-100 border-gray-500 text-gray-800' },
        { key: 'DELETE', label: 'Usun', color: 'bg-red-100 border-red-500 text-red-800' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-indigo-600" />
                        Przetwarzanie (Flow)
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="text-gray-900 font-medium">{item.content}</p>
                    {item.note && (
                        <p className="text-gray-600 text-sm mt-2">{item.note}</p>
                    )}
                </div>

                {/* AI Suggestion */}
                <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="flex items-center mb-2">
                        <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
                        <h3 className="font-semibold text-purple-900">AI Sugeruje:</h3>
                    </div>
                    {loadingAi ? (
                        <div className="animate-pulse h-4 bg-purple-200 rounded w-1/2"></div>
                    ) : aiSuggestion ? (
                        <div>
                            <p className="text-purple-800">
                                Strumien: <strong>{aiSuggestion.streamName}</strong> (Pewnosc: {(aiSuggestion.confidence * 100).toFixed(0)}%)
                            </p>
                            {aiSuggestion.reasoning?.[0] && (
                                <p className="text-xs text-purple-600 mt-1">{aiSuggestion.reasoning[0]}</p>
                            )}
                            {aiSuggestion.streamId && (
                                <button
                                    onClick={() => onProcess('DO', { targetStreamId: aiSuggestion.streamId, actionData: { title: item.content } })}
                                    className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
                                >
                                    Akceptuj sugestie
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Brak sugestii AI</p>
                    )}
                </div>

                {/* Manual Decisions */}
                <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Wybierz akcje:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {decisions.map(d => (
                            <button
                                key={d.key}
                                onClick={() => setDecision(d.key)}
                                className={`p-3 border-2 rounded-lg transition-all ${
                                    decision === d.key
                                        ? d.color + ' border-current shadow-sm'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!decision || processing}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        {processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        Zatwierdz
                    </button>
                </div>
            </div>
        </div>
    );
}
