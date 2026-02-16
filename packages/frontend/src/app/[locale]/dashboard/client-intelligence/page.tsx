// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Building2,
  User,
  ThumbsUp,
  ThumbsDown,
  Settings2,
  FileText,
  AlertTriangle,
  Lightbulb,
  CalendarDays,
  GitBranch,
  MessageCircle,
  Trophy,
  Star,
  Eye,
  EyeOff,
  Lock,
  Info,
  ClipboardList,
} from 'lucide-react';
import { clientIntelligenceApi, CreateClientIntelligenceRequest, ClientBriefing } from '@/lib/api/clientIntelligence';
import { ClientIntelligence } from '@/types/streams';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const CATEGORIES = [
  { value: 'LIKES', label: 'Lubi', icon: ThumbsUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'DISLIKES', label: 'Nie lubi', icon: ThumbsDown, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'PREFERENCE', label: 'Preferencja', icon: Settings2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'FACT', label: 'Fakt', icon: FileText, color: 'text-slate-600 bg-slate-50 dark:bg-slate-700/30 dark:text-slate-400' },
  { value: 'WARNING', label: 'Ostrzezenie', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'TIP', label: 'Wskazowka', icon: Lightbulb, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'IMPORTANT_DATE', label: 'Wazna data', icon: CalendarDays, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'DECISION_PROCESS', label: 'Proces decyzyjny', icon: GitBranch, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'COMMUNICATION', label: 'Komunikacja', icon: MessageCircle, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400' },
  { value: 'SUCCESS', label: 'Sukces', icon: Trophy, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

const getCategoryConfig = (category: string) => {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
};

const getCategoryBadgeVariant = (category: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  switch (category) {
    case 'LIKES': return 'info';
    case 'DISLIKES': return 'warning';
    case 'PREFERENCE': return 'default';
    case 'FACT': return 'neutral';
    case 'WARNING': return 'error';
    case 'TIP': return 'success';
    case 'IMPORTANT_DATE': return 'warning';
    case 'DECISION_PROCESS': return 'info';
    case 'COMMUNICATION': return 'info';
    case 'SUCCESS': return 'success';
    default: return 'neutral';
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ClientIntelligencePage() {
  const [entityType, setEntityType] = useState<'COMPANY' | 'CONTACT'>('COMPANY');
  const [entityId, setEntityId] = useState<string>('');
  const [entitySearch, setEntitySearch] = useState('');
  const [entityOptions, setEntityOptions] = useState<{ id: string; label: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEntityLabel, setSelectedEntityLabel] = useState('');

  const [items, setItems] = useState<ClientIntelligence[]>([]);
  const [briefing, setBriefing] = useState<ClientBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'FACT' as string,
    content: '',
    importance: 3,
    source: '',
  });

  // Search entities
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (entitySearch.length < 2) {
        setEntityOptions([]);
        return;
      }
      try {
        if (entityType === 'COMPANY') {
          const res = await companiesApi.searchCompanies(entitySearch);
          setEntityOptions(res.map(c => ({ id: c.id, label: c.name })));
        } else {
          const res = await contactsApi.getContacts({ search: entitySearch, limit: 20 });
          setEntityOptions(res.contacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })));
        }
        setShowDropdown(true);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [entitySearch, entityType]);

  const selectEntity = (option: { id: string; label: string }) => {
    setEntityId(option.id);
    setSelectedEntityLabel(option.label);
    setEntitySearch(option.label);
    setShowDropdown(false);
  };

  // Load intelligence + briefing when entity selected
  const loadIntelligence = useCallback(async () => {
    if (!entityId) return;
    try {
      setIsLoading(true);
      const [itemsRes, briefingRes] = await Promise.allSettled([
        clientIntelligenceApi.getIntelligence({ entityType, entityId, limit: 100 }),
        clientIntelligenceApi.getBriefing(entityType, entityId),
      ]);
      if (itemsRes.status === 'fulfilled') {
        setItems(itemsRes.value.items);
      }
      if (briefingRes.status === 'fulfilled') {
        setBriefing(briefingRes.value);
      } else {
        setBriefing(null);
      }
    } catch (error) {
      console.error('Failed to load intelligence:', error);
      toast.error('Nie udalo sie zaladowac wywiadu');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      loadIntelligence();
    } else {
      setItems([]);
      setBriefing(null);
    }
  }, [entityId, loadIntelligence]);

  const handleAdd = async () => {
    if (!formData.content.trim()) {
      toast.error('Tresc jest wymagana');
      return;
    }
    if (!entityId) {
      toast.error('Wybierz najpierw podmiot');
      return;
    }

    try {
      const data: CreateClientIntelligenceRequest = {
        entityType,
        entityId,
        category: formData.category as any,
        content: formData.content.trim(),
        importance: formData.importance,
        source: formData.source.trim() || undefined,
      };

      await clientIntelligenceApi.createIntelligence(data);
      toast.success('Informacja dodana!');
      setFormData({ category: 'FACT', content: '', importance: 3, source: '' });
      setShowAddForm(false);
      loadIntelligence();
    } catch (error) {
      console.error('Failed to create intelligence:', error);
      toast.error('Nie udalo sie dodac informacji');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await clientIntelligenceApi.deleteIntelligence(id);
      toast.success('Informacja usunieta');
      loadIntelligence();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Blad usuwania');
    } finally {
      setDeletingId(null);
    }
  };

  // Group items by category
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat.value);
    if (catItems.length > 0) {
      acc.push({ ...cat, items: catItems });
    }
    return acc;
  }, [] as (typeof CATEGORIES[number] & { items: ClientIntelligence[] })[]);

  const importanceStars = (importance: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < importance ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
      />
    ));
  };

  return (
    <PageShell>
      <PageHeader
        title="Wywiad klienta"
        subtitle="Zbieraj kluczowe informacje o klientach i kontaktach"
        icon={Brain}
        iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
        breadcrumbs={[
          { label: 'Pulpit', href: '/dashboard' },
          { label: 'Wywiad klienta' },
        ]}
        actions={
          entityId ? (
            <ActionButton icon={Plus} onClick={() => setShowAddForm(true)}>
              Dodaj informacje
            </ActionButton>
          ) : undefined
        }
      />

      {/* Entity Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-5 shadow-sm mb-6"
      >
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          Wybierz podmiot
        </h3>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Type toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => {
                setEntityType('COMPANY');
                setEntityId('');
                setEntitySearch('');
                setSelectedEntityLabel('');
                setItems([]);
                setBriefing(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                entityType === 'COMPANY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Firma
            </button>
            <button
              onClick={() => {
                setEntityType('CONTACT');
                setEntityId('');
                setEntitySearch('');
                setSelectedEntityLabel('');
                setItems([]);
                setBriefing(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                entityType === 'CONTACT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              Kontakt
            </button>
          </div>

          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={entitySearch}
              onChange={(e) => {
                setEntitySearch(e.target.value);
                if (entityId) {
                  setEntityId('');
                  setSelectedEntityLabel('');
                }
              }}
              onFocus={() => entityOptions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={entityType === 'COMPANY' ? 'Szukaj firmy...' : 'Szukaj kontaktu...'}
            />
            <AnimatePresence>
              {showDropdown && entityOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {entityOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectEntity(option)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {!entityId ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
        >
          <EmptyState
            icon={Search}
            title="Wybierz firme lub kontakt"
            description="Wyszukaj podmiot powyzej aby zobaczyc zebrane informacje wywiadowcze"
          />
        </motion.div>
      ) : isLoading ? (
        <SkeletonPage />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Briefing Summary */}
          {briefing && (
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Briefing: {selectedEntityLabel}
                </h3>
              </div>
              {briefing.summary && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{briefing.summary}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Kluczowe fakty"
                  value={briefing.keyFacts?.length || 0}
                  icon={FileText}
                  iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                  label="Ostrzezenia"
                  value={briefing.warnings?.length || 0}
                  icon={AlertTriangle}
                  iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
                />
                <StatCard
                  label="Preferencje"
                  value={briefing.preferences?.length || 0}
                  icon={Settings2}
                  iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <StatCard
                  label="Nadchodzace daty"
                  value={briefing.upcomingDates?.length || 0}
                  icon={CalendarDays}
                  iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
                />
              </div>
            </motion.div>
          )}

          {/* Grouped Intelligence Items */}
          {groupedItems.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            >
              <EmptyState
                icon={ClipboardList}
                title="Brak informacji"
                description="Dodaj pierwsza informacje o tym podmiocie"
                action={
                  <ActionButton icon={Plus} onClick={() => setShowAddForm(true)}>
                    Dodaj informacje
                  </ActionButton>
                }
              />
            </motion.div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => {
                const CatIcon = group.icon;
                return (
                  <motion.div
                    key={group.value}
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${group.color}`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <StatusBadge variant={getCategoryBadgeVariant(group.value)} size="md">
                          {group.label}
                        </StatusBadge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {group.items.length} {group.items.length === 1 ? 'element' : 'elementow'}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {group.items.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                          className="px-5 py-4 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                                {item.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                {/* Importance stars */}
                                <div className="flex items-center gap-0.5">
                                  {importanceStars(item.importance)}
                                </div>
                                {item.source && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Zrodlo: {item.source}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {formatDate(item.createdAt)}
                                </span>
                                {item.isPrivate && (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    <Lock className="w-3 h-3" />
                                    Prywatne
                                  </span>
                                )}
                              </div>
                            </div>
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              loading={deletingId === item.id}
                              onClick={() => {
                                toast((t) => (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm">Usunac te informacje?</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          toast.dismiss(t.id);
                                          handleDelete(item.id);
                                        }}
                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                      >
                                        Usun
                                      </button>
                                      <button
                                        onClick={() => toast.dismiss(t.id)}
                                        className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                      >
                                        Anuluj
                                      </button>
                                    </div>
                                  </div>
                                ), { duration: 5000 });
                              }}
                              className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                              title="Usun"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Add Form Modal */}
      <FormModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nowa informacja"
        subtitle={`Dodaj informacje dla: ${selectedEntityLabel}`}
        position="center"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={handleAdd}
              disabled={!formData.content.trim()}
            >
              Dodaj
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Kategoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tresc <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={3}
              placeholder="Np. Preferuje kontakt mailowy przed 10:00..."
            />
          </div>

          {/* Importance + Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Waznosc: <span className="font-bold text-amber-600 dark:text-amber-400">{formData.importance}/5</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>Niska</span>
                <span>Wysoka</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Zrodlo
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Np. Spotkanie, email..."
              />
            </div>
          </div>
        </div>
      </FormModal>
    </PageShell>
  );
}
