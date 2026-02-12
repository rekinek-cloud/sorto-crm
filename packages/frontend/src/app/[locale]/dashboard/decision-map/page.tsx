// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  UserPlus,
  Users,
  Star,
  ShieldAlert,
  BarChart3,
  Smile,
  Meh,
  Frown,
  CircleHelp,
  AlertTriangle,
  Trash2,
  Search,
  Award,
} from 'lucide-react';
import { dealStakeholdersApi, DealStakeholdersResponse, CreateDealStakeholderRequest } from '@/lib/api/dealStakeholders';
import { DealStakeholder } from '@/types/gtd';
import { dealsApi } from '@/lib/api/deals';
import { contactsApi } from '@/lib/api/contacts';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const ROLES = [
  { value: 'DECISION_MAKER', label: 'Decydent', variant: 'info' as const },
  { value: 'INFLUENCER', label: 'Influencer', variant: 'info' as const },
  { value: 'CHAMPION', label: 'Champion', variant: 'success' as const },
  { value: 'BLOCKER', label: 'Bloker', variant: 'error' as const },
  { value: 'USER_ROLE', label: 'Uzytkownik', variant: 'neutral' as const },
  { value: 'TECHNICAL', label: 'Techniczny', variant: 'neutral' as const },
  { value: 'FINANCIAL', label: 'Finansowy', variant: 'neutral' as const },
  { value: 'LEGAL', label: 'Prawny', variant: 'neutral' as const },
  { value: 'PROCUREMENT', label: 'Zakupy', variant: 'neutral' as const },
];

const SENTIMENTS = [
  { value: 'POSITIVE', label: 'Pozytywny', icon: Smile, color: 'text-emerald-500 dark:text-emerald-400' },
  { value: 'NEUTRAL', label: 'Neutralny', icon: Meh, color: 'text-slate-500 dark:text-slate-400' },
  { value: 'SKEPTICAL', label: 'Sceptyczny', icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400' },
  { value: 'NEGATIVE', label: 'Negatywny', icon: Frown, color: 'text-red-500 dark:text-red-400' },
  { value: 'UNKNOWN', label: 'Nieznany', icon: CircleHelp, color: 'text-slate-400 dark:text-slate-500' },
];

const getRoleVariant = (role: string) => {
  return ROLES.find(r => r.value === role)?.variant || 'neutral';
};

const getRoleLabel = (role: string) => {
  return ROLES.find(r => r.value === role)?.label || role;
};

const getSentimentIcon = (sentiment: string) => {
  return SENTIMENTS.find(s => s.value === sentiment)?.icon || CircleHelp;
};

const getSentimentColor = (sentiment: string) => {
  return SENTIMENTS.find(s => s.value === sentiment)?.color || 'text-slate-400';
};

const getSentimentLabel = (sentiment: string) => {
  return SENTIMENTS.find(s => s.value === sentiment)?.label || sentiment;
};

const getInfluenceColor = (influence: number) => {
  if (influence >= 70) return 'bg-red-500 dark:bg-red-600';
  if (influence >= 40) return 'bg-amber-500 dark:bg-amber-600';
  return 'bg-blue-500 dark:bg-blue-600';
};

const cardClass = 'bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30';
const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

export default function DecisionMapPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedDealTitle, setSelectedDealTitle] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);

  const [stakeholders, setStakeholders] = useState<DealStakeholder[]>([]);
  const [summary, setSummary] = useState<DealStakeholdersResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Contact search for form
  const [contactSearch, setContactSearch] = useState('');
  const [contactOptions, setContactOptions] = useState<{ id: string; label: string }[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const [formData, setFormData] = useState({
    contactId: '',
    contactLabel: '',
    role: 'INFLUENCER' as string,
    influence: 50,
    sentiment: 'NEUTRAL' as string,
    isChampion: false,
    objections: '',
    motivations: '',
    winStrategy: '',
  });

  // Load deals
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const res = await dealsApi.getDeals({ limit: 100 });
        setDeals(res.deals);
      } catch (error) {
        console.error('Failed to load deals:', error);
      }
    };
    loadDeals();
  }, []);

  // Search deals
  useEffect(() => {
    if (dealSearch.length < 1) {
      setFilteredDeals(deals.slice(0, 10));
    } else {
      const term = dealSearch.toLowerCase();
      setFilteredDeals(deals.filter(d => d.title.toLowerCase().includes(term)).slice(0, 10));
    }
  }, [dealSearch, deals]);

  // Search contacts
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (contactSearch.length < 2) {
        setContactOptions([]);
        return;
      }
      try {
        const res = await contactsApi.getContacts({ search: contactSearch, limit: 20 });
        setContactOptions(res.contacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}${c.position ? ` (${c.position})` : ''}` })));
        setShowContactDropdown(true);
      } catch (error) {
        console.error('Contact search failed:', error);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactSearch]);

  // Load stakeholders
  const loadStakeholders = useCallback(async () => {
    if (!selectedDealId) return;
    try {
      setIsLoading(true);
      const res = await dealStakeholdersApi.getStakeholders(selectedDealId);
      setStakeholders(res.stakeholders || []);
      setSummary(res.summary || null);
    } catch (error) {
      console.error('Failed to load stakeholders:', error);
      toast.error('Nie udalo sie zaladowac interesariuszy');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDealId]);

  useEffect(() => {
    if (selectedDealId) {
      loadStakeholders();
    } else {
      setStakeholders([]);
      setSummary(null);
    }
  }, [selectedDealId, loadStakeholders]);

  const selectDeal = (deal: any) => {
    setSelectedDealId(deal.id);
    setSelectedDealTitle(deal.title);
    setDealSearch(deal.title);
    setShowDealDropdown(false);
  };

  const handleAddStakeholder = async () => {
    if (!formData.contactId) {
      toast.error('Wybierz kontakt');
      return;
    }
    try {
      const data: CreateDealStakeholderRequest = {
        dealId: selectedDealId,
        contactId: formData.contactId,
        role: formData.role as any,
        influence: formData.influence,
        sentiment: formData.sentiment as any,
        isChampion: formData.isChampion,
        objections: formData.objections.trim() || undefined,
        motivations: formData.motivations.trim() || undefined,
        winStrategy: formData.winStrategy.trim() || undefined,
      };

      await dealStakeholdersApi.createStakeholder(data);
      toast.success('Interesariusz dodany!');
      setShowAddForm(false);
      setFormData({
        contactId: '',
        contactLabel: '',
        role: 'INFLUENCER',
        influence: 50,
        sentiment: 'NEUTRAL',
        isChampion: false,
        objections: '',
        motivations: '',
        winStrategy: '',
      });
      setContactSearch('');
      loadStakeholders();
    } catch (error) {
      console.error('Failed to add stakeholder:', error);
      toast.error('Nie udalo sie dodac interesariusza');
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">Usunac tego interesariusza?</span>
        <div className="flex gap-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await dealStakeholdersApi.deleteStakeholder(id);
                toast.success('Interesariusz usuniety');
                loadStakeholders();
              } catch (error) {
                console.error('Failed to delete stakeholder:', error);
                toast.error('Blad usuwania');
              }
            }}
            className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Usun
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2 py-1 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  return (
    <PageShell>
      <PageHeader
        title="Mapa decyzji"
        subtitle="Zarzadzaj interesariuszami w dealach"
        icon={Map}
        iconColor="text-violet-600 dark:text-violet-400"
        breadcrumbs={[
          { label: 'Deale', href: '/dashboard/deals' },
          { label: 'Mapa decyzji' },
        ]}
      />

      {/* Deal Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${cardClass} p-6 mb-6`}
      >
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          Wybierz deal
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={dealSearch}
              onChange={(e) => { setDealSearch(e.target.value); if (selectedDealId) { setSelectedDealId(''); setSelectedDealTitle(''); } }}
              onFocus={() => setShowDealDropdown(true)}
              onBlur={() => setTimeout(() => setShowDealDropdown(false), 200)}
              className={`${inputClass} pl-9`}
              placeholder="Szukaj deala..."
            />
            <AnimatePresence>
              {showDealDropdown && filteredDeals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => selectDeal(deal)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100">{deal.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {deal.stage} | {deal.value ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: deal.currency || 'PLN' }).format(deal.value) : '-'}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedDealId && (
            <ActionButton
              icon={UserPlus}
              onClick={() => setShowAddForm(true)}
            >
              Dodaj interesariusza
            </ActionButton>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {!selectedDealId ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardClass} p-6`}
        >
          <EmptyState
            icon={Map}
            title="Wybierz deal"
            description="Wyszukaj deal powyzej aby zobaczyc mape interesariuszy"
          />
        </motion.div>
      ) : isLoading ? (
        <SkeletonPage />
      ) : (
        <div className="space-y-6">
          {/* Summary Panel */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <StatCard
                label="Interesariusze"
                value={summary.total}
                icon={Users}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Championi"
                value={summary.champions}
                icon={Award}
                iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
              <StatCard
                label="Blokerzy"
                value={summary.blockers}
                icon={ShieldAlert}
                iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
              />
              <StatCard
                label="Sredni wplyw"
                value={Math.round(summary.averageInfluence)}
                icon={BarChart3}
                iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
              />
            </motion.div>
          )}

          {/* Stakeholder Cards */}
          {stakeholders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${cardClass} p-6`}
            >
              <EmptyState
                icon={Users}
                title="Brak interesariuszy"
                description="Dodaj pierwszego interesariusza do tego deala"
                action={
                  <ActionButton icon={UserPlus} onClick={() => setShowAddForm(true)}>
                    Dodaj interesariusza
                  </ActionButton>
                }
              />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stakeholders.map((stakeholder, idx) => {
                const SentimentIcon = getSentimentIcon(stakeholder.sentiment);
                return (
                  <motion.div
                    key={stakeholder.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`${cardClass} p-5 hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {stakeholder.isChampion && (
                          <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-900/30" title="Champion">
                            <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {stakeholder.contact
                              ? `${stakeholder.contact.firstName} ${stakeholder.contact.lastName}`
                              : 'Kontakt'}
                          </h4>
                          {stakeholder.contact?.position && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{stakeholder.contact.position}</p>
                          )}
                        </div>
                      </div>
                      <div className={`${getSentimentColor(stakeholder.sentiment)}`} title={getSentimentLabel(stakeholder.sentiment)}>
                        <SentimentIcon className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-3">
                      <StatusBadge variant={getRoleVariant(stakeholder.role)} dot>
                        {getRoleLabel(stakeholder.role)}
                      </StatusBadge>
                    </div>

                    {/* Influence Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-slate-400">Wplyw</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{stakeholder.influence}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getInfluenceColor(stakeholder.influence)}`}
                          style={{ width: `${stakeholder.influence}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      {stakeholder.objections && (
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-red-600 dark:text-red-400">Obiekcje:</span> {stakeholder.objections}
                        </div>
                      )}
                      {stakeholder.motivations && (
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Motywacje:</span> {stakeholder.motivations}
                        </div>
                      )}
                      {stakeholder.winStrategy && (
                        <div className="text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-blue-600 dark:text-blue-400">Strategia:</span> {stakeholder.winStrategy}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                      <button
                        onClick={() => handleDeleteStakeholder(stakeholder.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Usun
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Stakeholder Modal */}
      <FormModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nowy interesariusz"
        subtitle="Dodaj interesariusza do wybranego deala"
        position="right"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              onClick={handleAddStakeholder}
              disabled={!formData.contactId}
              icon={UserPlus}
            >
              Dodaj
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {/* Contact picker */}
          <div className="relative">
            <label className={labelClass}>Kontakt *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.contactLabel || contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  if (formData.contactId) {
                    setFormData({ ...formData, contactId: '', contactLabel: '' });
                  }
                }}
                onFocus={() => contactOptions.length > 0 && setShowContactDropdown(true)}
                onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                className={`${inputClass} pl-9`}
                placeholder="Szukaj kontaktu..."
              />
            </div>
            {showContactDropdown && contactOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {contactOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, contactId: option.id, contactLabel: option.label });
                      setContactSearch(option.label);
                      setShowContactDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rola</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={inputClass}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sentyment</label>
              <select
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                className={inputClass}
              >
                {SENTIMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Wplyw: {formData.influence}/100
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={formData.influence}
              onChange={(e) => setFormData({ ...formData, influence: parseInt(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Niski</span>
              <span>Wysoki</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isChampion}
              onChange={(e) => setFormData({ ...formData, isChampion: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
              id="isChampion"
            />
            <label htmlFor="isChampion" className="text-sm text-slate-700 dark:text-slate-300">
              Jest championem (wspiera nas wewnetrznie)
            </label>
          </div>

          <div>
            <label className={labelClass}>Obiekcje</label>
            <textarea
              value={formData.objections}
              onChange={(e) => setFormData({ ...formData, objections: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Jakie ma obiekcje/obawy..."
            />
          </div>

          <div>
            <label className={labelClass}>Motywacje</label>
            <textarea
              value={formData.motivations}
              onChange={(e) => setFormData({ ...formData, motivations: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Co go motywuje do wspolpracy..."
            />
          </div>

          <div>
            <label className={labelClass}>Strategia wygrania</label>
            <textarea
              value={formData.winStrategy}
              onChange={(e) => setFormData({ ...formData, winStrategy: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Jak przekonac te osobe..."
            />
          </div>
        </div>
      </FormModal>
    </PageShell>
  );
}
