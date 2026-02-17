'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAiSuggestions } from '@/hooks/useAiSuggestions';
import {
  Lightbulb,
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ListTodo,
  Handshake,
  Bell,
  UserCog,
  ShieldAlert,
  RefreshCw,
  MessageSquare,
  Filter,
  Mail,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CREATE_TASK: { label: 'Utworz zadanie', icon: ListTodo, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  CREATE_DEAL: { label: 'Utworz transakcje', icon: Handshake, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' },
  UPDATE_CONTACT: { label: 'Zaktualizuj kontakt', icon: UserCog, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400' },
  SEND_NOTIFICATION: { label: 'Wyslij powiadomienie', icon: Bell, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  BLACKLIST_DOMAIN: { label: 'Dodaj do blacklisty', icon: ShieldAlert, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: 'Oczekuje', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ACCEPTED: { label: 'Zaakceptowana', icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  REJECTED: { label: 'Odrzucona', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

interface AISuggestionsManagerProps {
  className?: string;
}

export function AISuggestionsManager({ className = '' }: AISuggestionsManagerProps) {
  const { suggestions, isLoading, loadSuggestions, accept, reject, edit } = useAiSuggestions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editReasoning, setEditReasoning] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectCorrection, setRejectCorrection] = useState('');
  const [customClassification, setCustomClassification] = useState('');
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setExpandedId(null);
    setEditingId(null);
    loadSuggestions(status);
  };

  const startEditing = (s: any) => {
    setEditingId(s.id);
    setEditTitle(s.data?.title || s.title || '');
    setEditDescription(s.data?.description || s.description || '');
    setEditPriority(s.data?.priority || 'MEDIUM');
    setEditReasoning('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('MEDIUM');
    setEditReasoning('');
  };

  const handleSaveEdit = async (id: string) => {
    setProcessingId(id);
    try {
      await edit(id, {
        suggestion: {
          title: editTitle,
          description: editDescription,
          priority: editPriority,
        },
        reasoning: editReasoning || undefined,
      });
      toast.success('Sugestia zaktualizowana');
      setEditingId(null);
    } catch {
      toast.error('Blad podczas zapisu zmian');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      const modifications = editingId === id ? {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      } : undefined;

      const result = await accept(id, modifications);
      const entity = result?.createdEntity;
      if (entity) {
        toast.success(`Zaakceptowano i utworzono: ${entity.type === 'CREATE_TASK' ? 'zadanie' : entity.type === 'CREATE_DEAL' ? 'transakcje' : 'element'}`);
      } else {
        toast.success('Sugestia zaakceptowana');
      }
      setEditingId(null);
      setExpandedId(null);
    } catch {
      toast.error('Blad podczas akceptacji');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptWithEdit = async (id: string) => {
    setProcessingId(id);
    try {
      const modifications: Record<string, any> = {};
      if (editTitle) modifications.title = editTitle;
      if (editDescription) modifications.description = editDescription;
      if (editPriority) modifications.priority = editPriority;

      // Save reasoning first for AI learning
      if (editReasoning) {
        await edit(id, { reasoning: editReasoning });
      }

      const result = await accept(id, Object.keys(modifications).length > 0 ? modifications : undefined);
      const entity = result?.createdEntity;
      if (entity) {
        toast.success(`Zaakceptowano ze zmianami i utworzono: ${entity.type === 'CREATE_TASK' ? 'zadanie' : entity.type === 'CREATE_DEAL' ? 'transakcje' : 'element'}`);
      } else {
        toast.success('Zaakceptowano ze zmianami');
      }
      setEditingId(null);
      setExpandedId(null);
    } catch {
      toast.error('Blad podczas akceptacji ze zmianami');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, suggestionType?: string) => {
    setProcessingId(id);
    try {
      const correction = customClassification || rejectCorrection || undefined;
      await reject(id, {
        note: rejectNote || undefined,
        correctClassification: correction,
        feedback: correction
          ? `Uzytkownik poprawil: prawidlowa klasyfikacja to ${correction}. ${rejectNote || ''}`
          : rejectNote || undefined,
      });
      if (correction) {
        toast.success(`Odrzucono i poprawiono — prawidlowa klasyfikacja: ${correction}`);
      } else {
        toast.success('Sugestia odrzucona');
      }
      setShowRejectForm(null);
      setRejectNote('');
      setRejectCorrection('');
      setCustomClassification('');
      setExpandedId(null);
    } catch {
      toast.error('Blad podczas odrzucania');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    if (confidence >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            Sugestie AI
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Przegladaj, edytuj i zatwierdzaj propozycje AI. Twoje decyzje ucza model.
          </p>
        </div>
        <button
          onClick={() => loadSuggestions(statusFilter)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Odswiez
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['PENDING', 'ACCEPTED', 'REJECTED'] as const).map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Suggestions list */}
      {suggestions.length === 0 ? (
        <div className="text-center py-16 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <Filter className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {statusFilter === 'PENDING'
              ? 'Brak oczekujacych sugestii AI'
              : statusFilter === 'ACCEPTED'
              ? 'Brak zaakceptowanych sugestii'
              : 'Brak odrzuconych sugestii'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const typeConfig = TYPE_CONFIG[s.suggestionType] || {
              label: s.suggestionType,
              icon: Sparkles,
              color: 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400',
            };
            const TypeIcon = typeConfig.icon;
            const isExpanded = expandedId === s.id;
            const isEditing = editingId === s.id;
            const isProcessing = processingId === s.id;
            const isPending = s.status === 'PENDING' || statusFilter === 'PENDING';

            return (
              <div
                key={s.id}
                className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border rounded-2xl shadow-sm transition-all ${
                  isExpanded
                    ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-800'
                    : 'border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Suggestion header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : s.id);
                    if (isEditing && !isExpanded) cancelEditing();
                  }}
                >
                  {/* Type icon */}
                  <div className={`p-2 rounded-xl ${typeConfig.color} flex-shrink-0`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {s.title || typeConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {s.description || (s.data as any)?.description || ''}
                    </p>
                  </div>

                  {/* Confidence + Date */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {s.confidence > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getConfidenceColor(s.confidence)}`}
                            style={{ width: `${Math.min(s.confidence, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">
                          {s.confidence}%
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(s.createdAt)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700/50">
                    {/* Email context for BLACKLIST_DOMAIN */}
                    {(s.suggestionType === 'BLACKLIST_DOMAIN' || s.suggestionType === 'EMAIL_CLASSIFICATION') && (
                      <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                        <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          Wiadomosc ktora wywolala sugestie
                        </h4>
                        <div className="space-y-2">
                          <div className="flex gap-2 text-sm">
                            <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 font-medium">Od:</span>
                            <span className="text-slate-900 dark:text-slate-100">
                              {s.inputData?.fromName || s.inputData?.email || (s.data as any)?.domain || '—'}
                            </span>
                          </div>
                          {(s.inputData?.subject || (s.data as any)?.title) && (
                            <div className="flex gap-2 text-sm">
                              <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 font-medium">Temat:</span>
                              <span className="text-slate-900 dark:text-slate-100 font-medium">
                                {s.inputData?.subject || (s.data as any)?.title || '—'}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-2 text-sm">
                            <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 font-medium">Domena:</span>
                            <span className="text-slate-900 dark:text-slate-100 font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                              {(s.data as any)?.domain || '—'}
                            </span>
                          </div>
                          {s.inputData?.bodySnippet && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Podglad tresci:</span>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap line-clamp-6 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                {s.inputData?.bodySnippet}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* AI reasoning */}
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Uzasadnienie AI:</span>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                            {s.description || 'Brak uzasadnienia'}
                          </p>
                          {(s.data as any)?.reason && (s.data as any)?.reason !== 'Automatyczna detekcja newslettera' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {(s.data as any).reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Generic data preview for non-email suggestions */}
                    {s.suggestionType !== 'BLACKLIST_DOMAIN' && s.suggestionType !== 'EMAIL_CLASSIFICATION' && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Szczegoly sugestii
                          </h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 space-y-2">
                            {s.data && Object.entries(s.data).filter(([k]) =>
                              !['type', 'rawContent'].includes(k) && typeof s.data[k] !== 'object'
                            ).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{key}:</span>
                                <span className="text-slate-900 dark:text-slate-100 font-medium text-right max-w-[60%] truncate">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                            {(!s.data || Object.keys(s.data).length === 0) && (
                              <p className="text-sm text-slate-400">Brak dodatkowych danych</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Uzasadnienie AI
                          </h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {s.description || 'Brak uzasadnienia'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && isPending && (
                      <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200/50 dark:border-indigo-700/30 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                          <Pencil className="w-4 h-4 text-indigo-500" />
                          Edytuj sugestie
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Tytul / Opis dzialania
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Wpisz wlasny tytul lub opis dzialania..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Szczegolowy opis
                            </label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              placeholder="Opisz co dokladnie powinno sie wydarzyc..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Priorytet
                              </label>
                              <select
                                value={editPriority}
                                onChange={(e) => setEditPriority(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              >
                                <option value="LOW">Niski</option>
                                <option value="MEDIUM">Sredni</option>
                                <option value="HIGH">Wysoki</option>
                                <option value="URGENT">Pilny</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Pewnosc AI
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getConfidenceColor(s.confidence)}`}
                                    style={{ width: `${s.confidence}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{s.confidence}%</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                              Twoj komentarz / powod zmiany (AI sie uczy z Twoich decyzji)
                            </label>
                            <textarea
                              value={editReasoning}
                              onChange={(e) => setEditReasoning(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                              placeholder="Np. 'Zmieniam priorytet bo klient jest VIP' lub 'Wolę to jako projekt a nie zadanie'..."
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              Ten komentarz pomoze AI lepiej rozumiec Twoje preferencje w przyszlosci.
                            </p>
                          </div>
                        </div>

                        {/* Edit action buttons */}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => handleAcceptWithEdit(s.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            {isProcessing ? 'Zapisywanie...' : 'Zaakceptuj ze zmianami'}
                          </button>
                          <button
                            onClick={() => handleSaveEdit(s.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            Zapisz zmiany (bez akceptacji)
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reject form with correction */}
                    {showRejectForm === s.id && isPending && (
                      <div className="mt-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-700/30 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                          <X className="w-4 h-4 text-red-500" />
                          Odrzuc i popraw AI
                        </h4>

                        {/* Correction options — context-dependent */}
                        {(s.suggestionType === 'BLACKLIST_DOMAIN' || s.suggestionType === 'EMAIL_CLASSIFICATION') && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                              AI sie myli — jaka jest prawidlowa klasyfikacja?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { value: 'BUSINESS', label: 'Oferta / Biznes', emoji: '💼' },
                                { value: 'NEWSLETTER', label: 'Newsletter', emoji: '📰' },
                                { value: 'SPAM', label: 'Spam', emoji: '🚫' },
                                { value: 'TRANSACTIONAL', label: 'Transakcyjny', emoji: '🧾' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    setRejectCorrection(rejectCorrection === opt.value ? '' : opt.value);
                                    setCustomClassification('');
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                                    rejectCorrection === opt.value && !customClassification
                                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                  }`}
                                >
                                  <span>{opt.emoji}</span>
                                  <span>{opt.label}</span>
                                </button>
                              ))}
                            </div>
                            <div className="mt-2">
                              <input
                                type="text"
                                value={customClassification}
                                onChange={(e) => { setCustomClassification(e.target.value); setRejectCorrection(''); }}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Lub wpisz wlasna klasyfikacje..."
                              />
                            </div>
                            {(rejectCorrection === 'BUSINESS' || customClassification.toLowerCase().includes('biznes') || customClassification.toLowerCase().includes('oferta')) && s.suggestionType === 'BLACKLIST_DOMAIN' && (
                              <p className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                                Domena zostanie dodana do whitelisty — przyszle emaile z tej domeny beda traktowane jako biznesowe.
                              </p>
                            )}
                          </div>
                        )}

                        {/* General correction for task/deal suggestions */}
                        {(s.suggestionType === 'CREATE_TASK' || s.suggestionType === 'CREATE_DEAL' || s.suggestionType === 'UPDATE_CONTACT' || s.suggestionType === 'SEND_NOTIFICATION') && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                              Co powinno byc zamiast tego?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {[
                                { value: 'UNNECESSARY', label: 'Niepotrzebne', emoji: '🚫' },
                                { value: 'ALREADY_DONE', label: 'Juz zrobione', emoji: '✅' },
                                { value: 'WRONG_TYPE', label: 'Zly typ akcji', emoji: '🔄' },
                                { value: 'WRONG_DATA', label: 'Bledne dane', emoji: '❌' },
                                { value: 'TOO_EARLY', label: 'Za wczesnie', emoji: '⏳' },
                                { value: 'OTHER', label: 'Inny powod', emoji: '💬' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    setRejectCorrection(rejectCorrection === opt.value ? '' : opt.value);
                                    setCustomClassification('');
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                                    rejectCorrection === opt.value && !customClassification
                                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                  }`}
                                >
                                  <span>{opt.emoji}</span>
                                  <span>{opt.label}</span>
                                </button>
                              ))}
                            </div>
                            <div className="mt-2">
                              <input
                                type="text"
                                value={customClassification}
                                onChange={(e) => { setCustomClassification(e.target.value); setRejectCorrection(''); }}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Lub wpisz wlasny powod..."
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                            Twoje wyjasnienie (pomaga AI sie uczyc)
                          </label>
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                            placeholder={
                              s.suggestionType === 'BLACKLIST_DOMAIN'
                                ? 'Np. "To jest oferta od naszego dostawcy" lub "Ten nadawca jest naszym klientem"...'
                                : 'Np. "To zadanie juz zostalo wykonane" lub "Priorytet jest za wysoki"...'
                            }
                          />
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Im dokladniej wyjasniasz, tym lepiej AI bedzie rozumiec Twoje preferencje.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleReject(s.id, s.suggestionType)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            {isProcessing ? 'Zapisywanie...' : rejectCorrection ? 'Odrzuc i popraw' : 'Odrzuc'}
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(null); setRejectNote(''); setRejectCorrection(''); setCustomClassification(''); }}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons — context-dependent */}
                    {!isEditing && showRejectForm !== s.id && isPending && (
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        {s.suggestionType === 'BLACKLIST_DOMAIN' || s.suggestionType === 'EMAIL_CLASSIFICATION' ? (
                          <>
                            <button
                              onClick={() => handleAccept(s.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              {isProcessing ? 'Dodawanie...' : 'Tak, to newsletter — zablokuj'}
                            </button>
                            <button
                              onClick={() => { setShowRejectForm(s.id); setRejectNote(''); }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Nie, AI sie myli
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAccept(s.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              {isProcessing ? 'Akceptowanie...' : 'Zaakceptuj'}
                            </button>
                            <button
                              onClick={() => startEditing(s)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              Zmien i zaakceptuj
                            </button>
                            <button
                              onClick={() => { setShowRejectForm(s.id); setRejectNote(''); }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Odrzuc
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Resolved info */}
                    {!isPending && s.resolvedAt && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.status === 'ACCEPTED' ? 'Zaakceptowana' : 'Odrzucona'} {formatDate(s.resolvedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
