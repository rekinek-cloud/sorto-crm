'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sourceApi, SourceItem, SourceFilters } from '@/lib/api/source';
import { flowApi, FlowAction, FlowPendingItem, FLOW_ELEMENT_TYPE_LABELS } from '@/lib/api/flow';
import { FlowProcessModal, FlowBatchProcessor, FlowStatsPanel, FlowConversationModal } from '@/components/flow';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import {
    Inbox,
    Sparkles,
    ClipboardList,
    Lightbulb,
    FileText,
    Mail,
    Archive,
    CheckCircle,
    Calendar,
    User,
    LayoutGrid,
    RefreshCw,
    BarChart3,
    MessageSquare,
    Mic,
    Zap,
    Tag,
    Building2,
    DollarSign,
    Clock,
    Users,
    Scissors,
    PenSquare,
    XCircle,
    GraduationCap,
    Search,
    Filter,
    ArrowDownWideNarrow,
    AlertTriangle,
    ArrowUp,
    Minus,
    ArrowDown,
    Plus,
    X,
    LucideIcon,
} from 'lucide-react';
import VoiceRecorder from '@/components/source/VoiceRecorder';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// Source types with Lucide icons
const CAPTURE_SOURCES: Record<string, {
    name: string;
    icon: LucideIcon;
    color: string;
    darkColor: string;
    description: string;
}> = {
    MEETING_NOTES: {
        name: 'Notatki ze spotkan',
        icon: ClipboardList,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        darkColor: 'dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300',
        description: 'Notatki z rozmow, spotkan, telefonow'
    },
    IDEA: {
        name: 'Pomysly',
        icon: Lightbulb,
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        darkColor: 'dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-300',
        description: 'Pomysly ktore przyszly do glowy'
    },
    DOCUMENT: {
        name: 'Dokumenty',
        icon: FileText,
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        darkColor: 'dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-300',
        description: 'Dokumenty, pliki, zalaczniki'
    },
    EMAIL: {
        name: 'E-maile',
        icon: Mail,
        color: 'bg-red-50 border-red-200 text-red-800',
        darkColor: 'dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300',
        description: 'E-maile wymagajace akcji'
    },
    VOICE: {
        name: 'Nagranie glosowe',
        icon: Mic,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        darkColor: 'dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-300',
        description: 'Nagrania glosowe i dyktafon'
    },
    OTHER: {
        name: 'Inne',
        icon: Archive,
        color: 'bg-slate-50 border-slate-200 text-slate-800',
        darkColor: 'dark:bg-slate-800/50 dark:border-slate-600/50 dark:text-slate-300',
        description: 'Wszystko inne'
    }
};

interface Stream {
    id: string;
    name: string;
    color?: string;
    description?: string;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

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
    const [useDialogMode, setUseDialogMode] = useState(true);
    const [correctionMode, setCorrectionMode] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [sortBy, setSortBy] = useState<SourceFilters['sortBy']>('date_desc');
    const [urgencyLevel, setUrgencyLevel] = useState<SourceFilters['urgencyLevel']>('all');

    // Human-in-the-Loop states
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());

    // Stats
    const stats = useMemo(() => {
        const total = items.length;
        const unprocessed = items.filter(i => !i.flowStatus || i.flowStatus === 'NEW' || i.flowStatus === 'AWAITING_DECISION').length;
        const processed = items.filter(i => i.flowStatus === 'PROCESSED').length;
        const archived = items.filter(i => i.flowStatus === 'REFERENCE' || i.flowStatus === 'DELETED' || i.flowStatus === 'FROZEN').length;
        return { total, unprocessed, processed, archived };
    }, [items]);

    // Load source data and streams
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: SourceFilters = {};
            if (searchQuery.trim()) filters.search = searchQuery.trim();
            if (filterSource) filters.source = filterSource;
            if (sortBy) filters.sortBy = sortBy;
            if (urgencyLevel && urgencyLevel !== 'all') filters.urgencyLevel = urgencyLevel;

            const [sourceItems, streamsResponse] = await Promise.all([
                sourceApi.getItems(Object.keys(filters).length > 0 ? filters : undefined),
                apiClient.get('/stream-management'),
            ]);

            setItems(sourceItems || []);
            setStreams(streamsResponse.data?.data || []);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Blad podczas ladowania danych');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle voice recording complete
    const handleVoiceRecordingComplete = (blob: Blob, duration: number) => {
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (blob.size > maxSize) {
            toast.error(`Nagranie jest za duze (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maksimum to 5MB.`);
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
                toast.error('Nagraj najpierw wiadomosc glosowa');
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => {
                console.error('FileReader error:', reader.error);
                toast.error('Blad odczytu nagrania. Sprobuj ponownie.');
            };
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                try {
                    await sourceApi.addItem({
                        content: captureContent.trim() || `Nagranie glosowe (${formatAudioDuration(audioDuration)})`,
                        note: captureNote.trim() || undefined,
                        sourceType: 'VOICE',
                        source: 'voice',
                        metadata: {
                            audioData: base64Audio,
                            audioDuration: audioDuration,
                            audioType: 'audio/webm'
                        }
                    });
                    toast.success('Nagranie dodane do Zrodla!');
                    resetCaptureForm();
                    loadData();
                } catch (error: any) {
                    console.error('Error capturing voice:', error);
                    const msg = error?.response?.status === 413
                        ? 'Nagranie jest za duze dla serwera. Nagraj krotsza wiadomosc.'
                        : 'Blad podczas dodawania nagrania';
                    toast.error(msg);
                }
            };
            reader.readAsDataURL(audioBlob);
            return;
        }

        // Regular capture
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
            resetCaptureForm();
            loadData();
        } catch (error: any) {
            console.error('Error capturing item:', error);
            toast.error('Blad podczas dodawania do zrodla');
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
    const handleProcess = (item: SourceItem, isCorrection = false) => {
        setProcessingItem(item);
        setCorrectionMode(isCorrection);
        if (useDialogMode) {
            setShowConversationModal(true);
        } else {
            setShowProcessModal(true);
        }
    };

    // Handle analyze item
    const handleAnalyze = async (item: SourceItem) => {
        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            await apiClient.post(`/flow/process/${item.id}`, { autoExecute: false });
            toast.success('Analiza AI zakonczona');
            loadData();
        } catch (error: any) {
            console.error('Analyze error:', error);
            toast.error(error?.response?.data?.error || 'Blad analizy AI');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
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

    // Quick approve AI suggestion
    const handleQuickApprove = async (item: SourceItem) => {
        if (!item.suggestedAction) return;

        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            const streamId = item.suggestedStreams?.[0]?.streamId;

            await apiClient.post(`/flow/confirm/${item.id}`, {
                action: item.suggestedAction,
                streamId,
                reason: 'Zatwierdzono sugestie AI'
            });

            await flowApi.recordFeedback(item.id, {
                suggestedAction: item.suggestedAction as any,
                actualAction: item.suggestedAction as any,
                wasHelpful: true
            });

            setLearnedIds(prev => new Set(prev).add(item.id));
            toast.success('Zatwierdzone! AI sie uczy z Twojej decyzji');

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
            toast.error('Blad podczas zatwierdzania: ' + (error?.response?.data?.error || error.message));
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    // Reject AI suggestion
    const handleReject = async (item: SourceItem) => {
        if (!item.suggestedAction) return;

        setProcessingIds(prev => new Set(prev).add(item.id));
        try {
            await flowApi.recordFeedback(item.id, {
                suggestedAction: item.suggestedAction as any,
                actualAction: 'USUN' as any,
                wasHelpful: false
            });

            toast.success('Sugestia odrzucona. AI sie uczy.');
            setRejectingId(null);
            setRejectReason('');
            loadData();
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.error('Blad podczas odrzucania');
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

    // Helper: get effective suggested action
    const getEffectiveSuggestedAction = (item: SourceItem): string | undefined => {
        if (item.suggestedAction) return item.suggestedAction;
        const analysis = item.aiAnalysis as any;
        if (analysis?.suggestedAction) return analysis.suggestedAction;
        if (analysis?.action) return analysis.action;
        return undefined;
    };

    // Load data on mount and when filters change
    useEffect(() => {
        loadData();
    }, [filterSource, sortBy, urgencyLevel]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    // Priority icon helper
    const renderPriorityIcon = (urgency: string) => {
        switch (urgency) {
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Pilne
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <ArrowUp className="w-3.5 h-3.5" />
                        Srednie
                    </span>
                );
            case 'low':
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Minus className="w-3.5 h-3.5" />
                        Niskie
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <PageShell>
                <SkeletonPage />
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Header */}
            <PageHeader
                title="Zrodlo"
                subtitle="Przechwytuj i przetwarzaj mysli, pomysly i informacje"
                icon={Inbox}
                iconColor="text-indigo-600"
                breadcrumbs={[{ label: 'Zrodlo' }]}
                actions={
                    <div className="flex gap-2 items-center">
                        {/* Dialog Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            <button
                                onClick={() => setUseDialogMode(false)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                    !useDialogMode
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-400'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                Klasyczny
                            </button>
                            <button
                                onClick={() => setUseDialogMode(true)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                    useDialogMode
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Dialogowy
                            </button>
                        </div>

                        <ActionButton
                            variant={showStats ? 'primary' : 'secondary'}
                            icon={BarChart3}
                            onClick={() => setShowStats(!showStats)}
                        >
                            Statystyki
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            icon={Plus}
                            onClick={() => setShowCaptureForm(true)}
                        >
                            Dodaj do Zrodla
                        </ActionButton>
                    </div>
                }
            />

            {/* Stat Cards Row */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            >
                <StatCard
                    label="Lacznie"
                    value={stats.total}
                    icon={Inbox}
                    iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
                />
                <StatCard
                    label="Nieprzetworzone"
                    value={stats.unprocessed}
                    icon={AlertTriangle}
                    iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
                />
                <StatCard
                    label="Przetworzone"
                    value={stats.processed}
                    icon={CheckCircle}
                    iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <StatCard
                    label="Zarchiwizowane"
                    value={stats.archived}
                    icon={Archive}
                    iconColor="text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400"
                />
            </motion.div>

            {/* Flow Stats Panel */}
            {showStats && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                >
                    <FlowStatsPanel />
                </motion.div>
            )}

            {/* Filter Bar */}
            <div className="mb-6">
                <FilterBar
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Szukaj w tresci..."
                    filters={[
                        {
                            key: 'source',
                            label: 'Wszystkie typy',
                            options: [
                                { value: 'MEETING_NOTES', label: 'Notatki' },
                                { value: 'IDEA', label: 'Pomysly' },
                                { value: 'DOCUMENT', label: 'Dokumenty' },
                                { value: 'EMAIL', label: 'E-maile' },
                                { value: 'VOICE', label: 'Nagrania' },
                                { value: 'OTHER', label: 'Inne' },
                            ]
                        },
                        {
                            key: 'urgency',
                            label: 'Wszystkie pilnosci',
                            options: [
                                { value: 'high', label: 'Pilne' },
                                { value: 'medium', label: 'Srednie' },
                                { value: 'low', label: 'Niskie' },
                            ]
                        },
                    ]}
                    filterValues={{ source: filterSource, urgency: urgencyLevel || '' }}
                    onFilterChange={(key, value) => {
                        if (key === 'source') setFilterSource(value === 'all' ? '' : value);
                        if (key === 'urgency') setUrgencyLevel((value === 'all' ? 'all' : value) as SourceFilters['urgencyLevel']);
                    }}
                    sortOptions={[
                        { value: 'date_desc', label: 'Najnowsze' },
                        { value: 'date_asc', label: 'Najstarsze' },
                        { value: 'urgency_desc', label: 'Najbardziej pilne' },
                        { value: 'urgency_asc', label: 'Najmniej pilne' },
                    ]}
                    sortValue={sortBy}
                    onSortChange={(val) => setSortBy(val as SourceFilters['sortBy'])}
                />
            </div>

            {/* Batch Actions Bar */}
            {items.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4 flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedItems.size === items.length && items.length > 0}
                                onChange={selectAllItems}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Zaznacz wszystkie ({selectedItems.size}/{items.length})
                            </span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <ActionButton
                            variant="ghost"
                            icon={RefreshCw}
                            onClick={loadData}
                            size="sm"
                        >
                            Odswiez
                        </ActionButton>

                        {selectedItems.size > 0 && (
                            <ActionButton
                                variant="primary"
                                icon={LayoutGrid}
                                onClick={handleBatchProcess}
                            >
                                Przetworz zaznaczone ({selectedItems.size})
                            </ActionButton>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Items List */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            >
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Elementy w Zrodle ({items.length})
                    </h2>
                </div>

                {items.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="Zrodlo jest czyste!"
                        description="Wszystko zostalo przetworzone i poplynelow do odpowiednich strumieni."
                        className="py-16"
                    />
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="divide-y divide-slate-100 dark:divide-slate-700/50"
                    >
                        {items.map((item) => {
                            const sourceConfig = CAPTURE_SOURCES[item.sourceType as keyof typeof CAPTURE_SOURCES] || CAPTURE_SOURCES.OTHER;
                            const SourceIcon = sourceConfig.icon;
                            const isSelected = selectedItems.has(item.id);

                            return (
                                <motion.div
                                    key={item.id}
                                    variants={itemVariants}
                                    className={`p-6 transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20'
                                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/20'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleItemSelection(item.id)}
                                            className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${sourceConfig.color} ${sourceConfig.darkColor}`}>
                                                    <SourceIcon className="w-4 h-4" />
                                                    {sourceConfig.name}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-2">
                                                {item.content}
                                            </h3>

                                            {item.note && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                                                    {item.note}
                                                </p>
                                            )}

                                            {/* AI Analysis Results */}
                                            {item.aiAnalysis && (
                                                <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase">Analiza AI</span>
                                                        {item.aiConfidence != null && (
                                                            <StatusBadge variant={
                                                                item.aiConfidence >= 0.8 ? 'success' :
                                                                item.aiConfidence >= 0.6 ? 'warning' : 'neutral'
                                                            }>
                                                                {Math.round(item.aiConfidence * 100)}%
                                                            </StatusBadge>
                                                        )}
                                                        {item.flowStatus && (
                                                            <StatusBadge
                                                                variant={
                                                                    item.flowStatus === 'AWAITING_DECISION' ? 'warning' :
                                                                    item.flowStatus === 'SPLIT' ? 'info' :
                                                                    item.flowStatus === 'PROCESSED' ? 'success' : 'neutral'
                                                                }
                                                                dot
                                                            >
                                                                {item.flowStatus === 'AWAITING_DECISION' ? 'Czeka na decyzje' :
                                                                 item.flowStatus === 'SPLIT' ? 'Podzielony' :
                                                                 item.flowStatus === 'PROCESSED' && item.userDecisionReason === 'AUTOPILOT'
                                                                   ? `Autopilot ${Math.round((item.aiConfidence || 0) * 100)}%`
                                                                   : item.flowStatus === 'PROCESSED' ? 'Przetworzony' :
                                                                 item.flowStatus}
                                                            </StatusBadge>
                                                        )}
                                                    </div>

                                                    {/* AI Summary */}
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{item.aiAnalysis.summary}</p>

                                                    {/* Suggested Action + Stream */}
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {(() => {
                                                            const action = getEffectiveSuggestedAction(item);
                                                            return action ? (
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium ${
                                                                action === 'ZROB_TERAZ' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                action === 'ZAPLANUJ' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                action === 'PROJEKT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                action === 'KIEDYS_MOZE' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                                                action === 'REFERENCJA' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                                action === 'USUN' ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' :
                                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                                <Zap className="w-3 h-3" />
                                                                {action === 'ZROB_TERAZ' ? 'Zrob teraz' :
                                                                 action === 'ZAPLANUJ' ? 'Zaplanuj' :
                                                                 action === 'PROJEKT' ? 'Projekt' :
                                                                 action === 'KIEDYS_MOZE' ? 'Kiedys/moze' :
                                                                 action === 'REFERENCJA' ? 'Referencja' :
                                                                 action === 'USUN' ? 'Usun' :
                                                                 action}
                                                            </span>
                                                            ) : null;
                                                        })()}
                                                        {item.suggestedStreams?.[0] && (
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                                <Tag className="w-3 h-3" />
                                                                {item.suggestedStreams[0].streamName}
                                                            </span>
                                                        )}
                                                        {item.aiAnalysis.urgency && renderPriorityIcon(item.aiAnalysis.urgency)}
                                                        {item.aiAnalysis.estimatedTime && (
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                                                <Clock className="w-3 h-3" />
                                                                {item.aiAnalysis.estimatedTime}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Entities */}
                                                    {item.aiAnalysis.entities.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {item.aiAnalysis.entities.slice(0, 6).map((entity: any, idx: number) => (
                                                                <span key={idx} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                                                                    entity.type === 'person' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    entity.type === 'company' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                    entity.type === 'amount' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                    entity.type === 'date' || entity.type === 'deadline' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    entity.type === 'task' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                                                    'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                                }`}>
                                                                    {entity.type === 'person' && <Users className="w-3 h-3" />}
                                                                    {entity.type === 'company' && <Building2 className="w-3 h-3" />}
                                                                    {entity.type === 'amount' && <DollarSign className="w-3 h-3" />}
                                                                    {(entity.type === 'date' || entity.type === 'deadline') && <Calendar className="w-3 h-3" />}
                                                                    {entity.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reject reason input */}
                                            {rejectingId === item.id && (
                                                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                                                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Dlaczego odrzucasz sugestie?</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="Opcjonalny powod..."
                                                            className="flex-1 px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleReject(item); }}
                                                        />
                                                        <button
                                                            onClick={() => handleReject(item)}
                                                            disabled={processingIds.has(item.id)}
                                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded-lg font-medium transition-colors"
                                                        >
                                                            Odrzuc
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg font-medium transition-colors"
                                                        >
                                                            Anuluj
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Split indicator */}
                                            {item.flowStatus === 'SPLIT' && (
                                                <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                                                    <Scissors className="w-4 h-4" />
                                                    Element podzielony na czesci -- podzadania sa w Zrodle
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatTimeAgo(item.capturedAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {item.capturedBy?.firstName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action buttons - Human-in-the-Loop */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {['PROCESSED', 'SPLIT', 'FROZEN', 'REFERENCE', 'DELETED'].includes(item.flowStatus || '') ? (
                                                <StatusBadge
                                                    variant={
                                                        item.flowStatus === 'PROCESSED' ? 'success' :
                                                        item.flowStatus === 'SPLIT' ? 'info' :
                                                        item.flowStatus === 'FROZEN' ? 'info' :
                                                        item.flowStatus === 'REFERENCE' ? 'neutral' : 'error'
                                                    }
                                                    size="md"
                                                    dot
                                                >
                                                    {item.flowStatus === 'PROCESSED' && item.userDecisionReason === 'AUTOPILOT'
                                                      ? `Autopilot ${Math.round((item.aiConfidence || 0) * 100)}%`
                                                      : item.flowStatus === 'PROCESSED' ? 'Przetworzony' :
                                                     item.flowStatus === 'SPLIT' ? 'Podzielony' :
                                                     item.flowStatus === 'FROZEN' ? 'Zamrozony' :
                                                     item.flowStatus === 'REFERENCE' ? 'Referencja' :
                                                     'Usuniety'}
                                                </StatusBadge>
                                            ) : item.aiAnalysis ? (() => {
                                                const effectiveAction = getEffectiveSuggestedAction(item);
                                                return (
                                                <>
                                                    {/* Approve */}
                                                    {effectiveAction && (
                                                        <ActionButton
                                                            variant="primary"
                                                            icon={CheckCircle}
                                                            size="sm"
                                                            loading={processingIds.has(item.id)}
                                                            onClick={() => handleQuickApprove({
                                                                ...item,
                                                                suggestedAction: effectiveAction
                                                            })}
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                        >
                                                            Zatwierdz
                                                        </ActionButton>
                                                    )}

                                                    {/* Correct */}
                                                    <ActionButton
                                                        variant="secondary"
                                                        icon={PenSquare}
                                                        size="sm"
                                                        onClick={() => handleProcess({
                                                            ...item,
                                                            suggestedAction: effectiveAction || item.suggestedAction
                                                        }, true)}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                                    >
                                                        Koryguj
                                                    </ActionButton>

                                                    {/* Reject */}
                                                    {effectiveAction && (
                                                        <ActionButton
                                                            variant="ghost"
                                                            icon={XCircle}
                                                            size="sm"
                                                            disabled={processingIds.has(item.id)}
                                                            onClick={() => setRejectingId(rejectingId === item.id ? null : item.id)}
                                                        >
                                                            Odrzuc
                                                        </ActionButton>
                                                    )}

                                                    {/* Learning indicator */}
                                                    {learnedIds.has(item.id) && (
                                                        <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                                                            <GraduationCap className="w-3.5 h-3.5" />
                                                            AI sie uczy...
                                                        </div>
                                                    )}
                                                </>
                                                );
                                            })() : (
                                                <ActionButton
                                                    variant="primary"
                                                    icon={Sparkles}
                                                    size="sm"
                                                    loading={processingIds.has(item.id)}
                                                    onClick={() => handleAnalyze(item)}
                                                >
                                                    Analizuj
                                                </ActionButton>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </motion.div>

            {/* Capture Form Modal */}
            <AnimatePresence>
                {showCaptureForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={(e) => { if (e.target === e.currentTarget) resetCaptureForm(); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                Dodaj do Zrodla
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Typ</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(CAPTURE_SOURCES).map(([key, source]) => {
                                        const ItemIcon = source.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSelectedSource(key);
                                                    if (key !== 'VOICE') {
                                                        setAudioBlob(null);
                                                        setAudioDuration(0);
                                                    }
                                                }}
                                                className={`p-3 rounded-xl border text-left transition-all ${selectedSource === key
                                                    ? `${source.color} ${source.darkColor} border-current shadow-sm`
                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <div className="font-medium flex items-center gap-2 text-sm">
                                                    <ItemIcon className="w-5 h-5" />
                                                    {source.name}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Voice Recorder */}
                            {selectedSource === 'VOICE' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Nagranie glosowe
                                    </label>
                                    <VoiceRecorder
                                        onRecordingComplete={handleVoiceRecordingComplete}
                                        maxDuration={300}
                                        className="mb-2"
                                    />
                                    {audioBlob && (
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Nagranie gotowe ({formatAudioDuration(audioDuration)})
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Content field */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {selectedSource === 'VOICE' ? 'Tytul nagrania (opcjonalnie)' : 'Tresc'}
                                </label>
                                <textarea
                                    value={captureContent}
                                    onChange={(e) => setCaptureContent(e.target.value)}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    rows={selectedSource === 'VOICE' ? 2 : 3}
                                    placeholder={selectedSource === 'VOICE' ? 'Opcjonalny opis nagrania...' : 'Co chcesz przechwycic?'}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notatka (opcjonalnie)</label>
                                <textarea
                                    value={captureNote}
                                    onChange={(e) => setCaptureNote(e.target.value)}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    rows={2}
                                    placeholder="Dodatkowe informacje..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <ActionButton
                                    variant="ghost"
                                    onClick={resetCaptureForm}
                                >
                                    Anuluj
                                </ActionButton>
                                <ActionButton
                                    variant="primary"
                                    onClick={handleQuickCapture}
                                    disabled={
                                        !selectedSource ||
                                        (selectedSource === 'VOICE' ? !audioBlob : !captureContent.trim())
                                    }
                                >
                                    {selectedSource === 'VOICE' ? 'Dodaj nagranie' : 'Dodaj'}
                                </ActionButton>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flow Process Modal (Classic Mode) */}
            {showProcessModal && processingItem && (
                <FlowProcessModal
                    item={processingItem}
                    streams={streams}
                    initialSuggestion={correctionMode && processingItem.suggestedAction ? {
                        action: processingItem.suggestedAction as FlowAction,
                        streamId: processingItem.suggestedStreams?.[0]?.streamId,
                        streamName: processingItem.suggestedStreams?.[0]?.streamName,
                        confidence: (processingItem.aiConfidence || 0.8) * 100,
                    } : undefined}
                    onClose={() => {
                        setShowProcessModal(false);
                        setProcessingItem(null);
                        setCorrectionMode(false);
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
                    correctionMode={correctionMode}
                    initialAction={correctionMode ? (processingItem.suggestedAction || (processingItem.aiAnalysis as any)?.suggestedAction || (processingItem.aiAnalysis as any)?.action) as FlowAction : undefined}
                    initialStreamId={correctionMode ? (processingItem.suggestedStreams?.[0]?.streamId || (processingItem.aiAnalysis as any)?.suggestedStreams?.[0]?.streamId) : undefined}
                    initialAnalysisData={correctionMode ? {
                        summary: (processingItem.aiAnalysis as any)?.summary,
                        entities: (processingItem.aiAnalysis as any)?.entities,
                        urgency: (processingItem.aiAnalysis as any)?.urgency,
                        estimatedTime: (processingItem.aiAnalysis as any)?.estimatedTime,
                        confidence: processingItem.aiConfidence || (processingItem.aiAnalysis as any)?.confidence,
                        suggestedAction: processingItem.suggestedAction || (processingItem.aiAnalysis as any)?.suggestedAction,
                        suggestedStreams: processingItem.suggestedStreams || (processingItem.aiAnalysis as any)?.suggestedStreams,
                    } : undefined}
                    onClose={() => {
                        setShowConversationModal(false);
                        setProcessingItem(null);
                        setCorrectionMode(false);
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
        </PageShell>
    );
}
