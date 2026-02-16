// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Plus,
  Building2,
  AlertTriangle,
  Activity,
  Ban,
  Trash2,
  Search,
  ExternalLink,
  TrendingDown,
  Lightbulb,
  Target,
  CalendarClock,
  Trophy,
  X,
  ShieldAlert,
} from 'lucide-react';
import { dealCompetitorsApi, CreateDealCompetitorRequest, CreateLostAnalysisRequest, LostAnalysis } from '@/lib/api/dealCompetitors';
import { DealCompetitor } from '@/types/streams';
import { dealsApi } from '@/lib/api/deals';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormModal } from '@/components/ui/FormModal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const THREAT_LEVELS = [
  { value: 'LOW', label: 'Niski', variant: 'success' as const },
  { value: 'MEDIUM', label: 'Sredni', variant: 'warning' as const },
  { value: 'HIGH', label: 'Wysoki', variant: 'error' as const },
  { value: 'CRITICAL', label: 'Krytyczny', variant: 'error' as const },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Aktywny', variant: 'info' as const },
  { value: 'ELIMINATED', label: 'Wyeliminowany', variant: 'neutral' as const },
  { value: 'WON', label: 'Wygral', variant: 'success' as const },
  { value: 'UNKNOWN', label: 'Nieznany', variant: 'default' as const },
];

const getThreatVariant = (level: string) => {
  return THREAT_LEVELS.find(t => t.value === level)?.variant || 'default';
};

const getThreatLabel = (level: string) => {
  return THREAT_LEVELS.find(t => t.value === level)?.label || level;
};

const getStatusVariant = (status: string) => {
  return STATUSES.find(s => s.value === status)?.variant || 'default';
};

const getStatusLabel = (status: string) => {
  return STATUSES.find(s => s.value === status)?.label || status;
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency || 'PLN',
  }).format(amount);
};

const cardClass = 'bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30';
const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

export default function CompetitionPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [dealSearch, setDealSearch] = useState('');
  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [filteredDeals, setFilteredDeals] = useState<any[]>([]);

  const [competitors, setCompetitors] = useState<DealCompetitor[]>([]);
  const [lostAnalysis, setLostAnalysis] = useState<LostAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLostForm, setShowLostForm] = useState(false);

  const [formData, setFormData] = useState({
    competitorName: '',
    competitorWebsite: '',
    estimatedPrice: '',
    currency: 'PLN',
    threatLevel: 'MEDIUM' as string,
    theirStrengths: '',
    theirWeaknesses: '',
    ourAdvantages: '',
  });

  const [lostForm, setLostForm] = useState({
    winnerName: '',
    winnerPrice: '',
    lostReasons: [''],
    lessonsLearned: '',
    improvementAreas: [''],
    followUpDate: '',
    followUpNotes: '',
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

  // Filter deals
  useEffect(() => {
    if (dealSearch.length < 1) {
      setFilteredDeals(deals.slice(0, 10));
    } else {
      const term = dealSearch.toLowerCase();
      setFilteredDeals(deals.filter(d => d.title.toLowerCase().includes(term)).slice(0, 10));
    }
  }, [dealSearch, deals]);

  // Load competitors
  const loadCompetitors = useCallback(async () => {
    if (!selectedDeal) return;
    try {
      setIsLoading(true);
      const [competitorsRes, lostRes] = await Promise.allSettled([
        dealCompetitorsApi.getCompetitors(selectedDeal.id),
        dealCompetitorsApi.getLostAnalysis(selectedDeal.id),
      ]);
      if (competitorsRes.status === 'fulfilled') {
        setCompetitors(competitorsRes.value || []);
      }
      if (lostRes.status === 'fulfilled') {
        setLostAnalysis(lostRes.value);
      } else {
        setLostAnalysis(null);
      }
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeal]);

  useEffect(() => {
    if (selectedDeal) {
      loadCompetitors();
    } else {
      setCompetitors([]);
      setLostAnalysis(null);
    }
  }, [selectedDeal, loadCompetitors]);

  const selectDeal = (deal: any) => {
    setSelectedDeal(deal);
    setDealSearch(deal.title);
    setShowDealDropdown(false);
  };

  const handleAddCompetitor = async () => {
    if (!formData.competitorName.trim()) {
      toast.error('Nazwa konkurenta jest wymagana');
      return;
    }
    try {
      const data: CreateDealCompetitorRequest = {
        dealId: selectedDeal.id,
        competitorName: formData.competitorName.trim(),
        competitorWebsite: formData.competitorWebsite.trim() || undefined,
        estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
        currency: formData.currency,
        threatLevel: formData.threatLevel as any,
        theirStrengths: formData.theirStrengths.trim() || undefined,
        theirWeaknesses: formData.theirWeaknesses.trim() || undefined,
        ourAdvantages: formData.ourAdvantages.trim() || undefined,
      };

      await dealCompetitorsApi.createCompetitor(data);
      toast.success('Konkurent dodany!');
      setShowAddForm(false);
      setFormData({
        competitorName: '',
        competitorWebsite: '',
        estimatedPrice: '',
        currency: 'PLN',
        threatLevel: 'MEDIUM',
        theirStrengths: '',
        theirWeaknesses: '',
        ourAdvantages: '',
      });
      loadCompetitors();
    } catch (error) {
      console.error('Failed to add competitor:', error);
      toast.error('Nie udalo sie dodac konkurenta');
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">Usunac tego konkurenta?</span>
        <div className="flex gap-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await dealCompetitorsApi.deleteCompetitor(id);
                toast.success('Konkurent usuniety');
                loadCompetitors();
              } catch (error) {
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await dealCompetitorsApi.updateCompetitor(id, { status: status as any });
      toast.success('Status zaktualizowany');
      loadCompetitors();
    } catch (error) {
      toast.error('Blad aktualizacji');
    }
  };

  const handleSaveLostAnalysis = async () => {
    const reasons = lostForm.lostReasons.filter(r => r.trim());
    if (reasons.length === 0) {
      toast.error('Podaj co najmniej jeden powod przegranej');
      return;
    }
    try {
      const data: CreateLostAnalysisRequest = {
        dealId: selectedDeal.id,
        winnerName: lostForm.winnerName.trim() || undefined,
        winnerPrice: lostForm.winnerPrice ? parseFloat(lostForm.winnerPrice) : undefined,
        lostReasons: reasons,
        lessonsLearned: lostForm.lessonsLearned.trim() || undefined,
        improvementAreas: lostForm.improvementAreas.filter(a => a.trim()),
        followUpDate: lostForm.followUpDate || undefined,
        followUpNotes: lostForm.followUpNotes.trim() || undefined,
      };

      await dealCompetitorsApi.createLostAnalysis(data);
      toast.success('Analiza przegranej zapisana!');
      setShowLostForm(false);
      loadCompetitors();
    } catch (error) {
      console.error('Failed to save lost analysis:', error);
      toast.error('Nie udalo sie zapisac analizy');
    }
  };

  const addLostReason = () => {
    setLostForm({ ...lostForm, lostReasons: [...lostForm.lostReasons, ''] });
  };

  const updateLostReason = (index: number, value: string) => {
    const reasons = [...lostForm.lostReasons];
    reasons[index] = value;
    setLostForm({ ...lostForm, lostReasons: reasons });
  };

  const removeLostReason = (index: number) => {
    if (lostForm.lostReasons.length <= 1) return;
    const reasons = lostForm.lostReasons.filter((_, i) => i !== index);
    setLostForm({ ...lostForm, lostReasons: reasons });
  };

  const addImprovementArea = () => {
    setLostForm({ ...lostForm, improvementAreas: [...lostForm.improvementAreas, ''] });
  };

  const updateImprovementArea = (index: number, value: string) => {
    const areas = [...lostForm.improvementAreas];
    areas[index] = value;
    setLostForm({ ...lostForm, improvementAreas: areas });
  };

  const isDealLost = selectedDeal && (selectedDeal.status === 'LOST' || selectedDeal.status === 'CLOSED_LOST');

  // DataTable columns
  const tableColumns: Column<DealCompetitor>[] = [
    {
      key: 'competitorName',
      label: 'Konkurent',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.competitorName}</div>
          {row.competitorWebsite && (
            <a
              href={row.competitorWebsite.startsWith('http') ? row.competitorWebsite : `https://${row.competitorWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {row.competitorWebsite}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'estimatedPrice',
      label: 'Cena szacunkowa',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {formatCurrency(row.estimatedPrice, row.currency)}
        </span>
      ),
    },
    {
      key: 'threatLevel',
      label: 'Zagrozenie',
      sortable: true,
      render: (_, row) => (
        <StatusBadge variant={getThreatVariant(row.threatLevel)} dot>
          {getThreatLabel(row.threatLevel)}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => (
        <select
          value={row.status}
          onChange={(e) => {
            e.stopPropagation();
            handleUpdateStatus(row.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'theirStrengths',
      label: 'Mocne strony',
      sortable: false,
      render: (_, row) => (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={row.theirStrengths}>
          {row.theirStrengths || '-'}
        </p>
      ),
    },
    {
      key: 'ourAdvantages',
      label: 'Nasze przewagi',
      sortable: false,
      render: (_, row) => (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={row.ourAdvantages}>
          {row.ourAdvantages || '-'}
        </p>
      ),
    },
    {
      key: 'actions',
      label: 'Akcje',
      sortable: false,
      width: 'w-20',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCompetitor(row.id);
          }}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Usun
        </button>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Konkurencja w dealach"
        subtitle="Sledz konkurentow i analizuj ich oferty"
        icon={Swords}
        iconColor="text-orange-600 dark:text-orange-400"
        breadcrumbs={[
          { label: 'Deale', href: '/dashboard/deals' },
          { label: 'Konkurencja' },
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
              onChange={(e) => { setDealSearch(e.target.value); if (selectedDeal) { setSelectedDeal(null); } }}
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
                        {deal.stage} | {deal.status} | {deal.value ? formatCurrency(deal.value, deal.currency) : '-'}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedDeal && (
            <div className="flex gap-2">
              <ActionButton
                icon={Plus}
                onClick={() => setShowAddForm(true)}
              >
                Dodaj konkurenta
              </ActionButton>
              {isDealLost && !lostAnalysis && (
                <ActionButton
                  variant="danger"
                  icon={TrendingDown}
                  onClick={() => setShowLostForm(true)}
                >
                  Analiza przegranej
                </ActionButton>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {!selectedDeal ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardClass} p-6`}
        >
          <EmptyState
            icon={Swords}
            title="Wybierz deal"
            description="Wyszukaj deal powyzej aby zobaczyc analize konkurencji"
          />
        </motion.div>
      ) : isLoading ? (
        <SkeletonPage />
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <StatCard
              label="Konkurenci"
              value={competitors.length}
              icon={Building2}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              label="Krytyczni"
              value={competitors.filter(c => c.threatLevel === 'CRITICAL').length}
              icon={ShieldAlert}
              iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
            />
            <StatCard
              label="Aktywni"
              value={competitors.filter(c => c.status === 'ACTIVE').length}
              icon={Activity}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              label="Wyeliminowani"
              value={competitors.filter(c => c.status === 'ELIMINATED').length}
              icon={Ban}
              iconColor="text-slate-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-400"
            />
          </motion.div>

          {/* Competitors Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${cardClass} p-4`}
          >
            <div className="mb-3 px-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Konkurenci ({competitors.length})
              </h3>
            </div>

            {competitors.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Brak konkurentow"
                description="Dodaj pierwszego konkurenta do analizy"
                action={
                  <ActionButton icon={Plus} onClick={() => setShowAddForm(true)}>
                    Dodaj konkurenta
                  </ActionButton>
                }
              />
            ) : (
              <DataTable
                columns={tableColumns}
                data={competitors}
                storageKey="competition-table"
                pageSize={20}
                emptyMessage="Brak konkurentow"
              />
            )}
          </motion.div>

          {/* Lost Analysis Section (if deal is lost) */}
          {isDealLost && lostAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-red-50/80 dark:bg-red-900/10 backdrop-blur-xl border border-red-200/50 dark:border-red-800/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Analiza przegranej</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {lostAnalysis.winnerName && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trophy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zwyciezca</p>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{lostAnalysis.winnerName}</p>
                    </div>
                  )}
                  {lostAnalysis.winnerPrice && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cena zwyciezcy</p>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{formatCurrency(lostAnalysis.winnerPrice)}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Powody przegranej</p>
                    </div>
                    <ul className="list-disc list-inside text-sm text-slate-900 dark:text-slate-200 mt-1 space-y-0.5">
                      {lostAnalysis.lostReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  {lostAnalysis.lessonsLearned && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wnioski</p>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{lostAnalysis.lessonsLearned}</p>
                    </div>
                  )}
                  {lostAnalysis.improvementAreas.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Obszary do poprawy</p>
                      </div>
                      <ul className="list-disc list-inside text-sm text-slate-900 dark:text-slate-200 mt-1 space-y-0.5">
                        {lostAnalysis.improvementAreas.map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lostAnalysis.followUpNotes && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notatki follow-up</p>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{lostAnalysis.followUpNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Add Competitor Modal */}
      <FormModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nowy konkurent"
        subtitle="Dodaj konkurenta do analizy deala"
        position="right"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAddForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              onClick={handleAddCompetitor}
              disabled={!formData.competitorName.trim()}
              icon={Plus}
            >
              Dodaj konkurenta
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nazwa konkurenta *</label>
              <input
                type="text"
                value={formData.competitorName}
                onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
                className={inputClass}
                placeholder="Np. FirmaCo"
              />
            </div>
            <div>
              <label className={labelClass}>Strona WWW</label>
              <input
                type="text"
                value={formData.competitorWebsite}
                onChange={(e) => setFormData({ ...formData, competitorWebsite: e.target.value })}
                className={inputClass}
                placeholder="www.competitor.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Cena szacunkowa</label>
              <input
                type="number"
                step="0.01"
                value={formData.estimatedPrice}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Waluta</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={inputClass}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Poziom zagrozenia</label>
              <select
                value={formData.threatLevel}
                onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value })}
                className={inputClass}
              >
                {THREAT_LEVELS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ich mocne strony</label>
            <textarea
              value={formData.theirStrengths}
              onChange={(e) => setFormData({ ...formData, theirStrengths: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="W czym sa lepsi od nas..."
            />
          </div>

          <div>
            <label className={labelClass}>Ich slabe strony</label>
            <textarea
              value={formData.theirWeaknesses}
              onChange={(e) => setFormData({ ...formData, theirWeaknesses: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Jakie maja slabosci..."
            />
          </div>

          <div>
            <label className={labelClass}>Nasze przewagi</label>
            <textarea
              value={formData.ourAdvantages}
              onChange={(e) => setFormData({ ...formData, ourAdvantages: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="W czym jestesmy lepsi..."
            />
          </div>
        </div>
      </FormModal>

      {/* Lost Analysis Modal */}
      <FormModal
        isOpen={showLostForm}
        onClose={() => setShowLostForm(false)}
        title="Analiza przegranej"
        subtitle="Dokumentuj wnioski z przegranego deala"
        position="right"
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowLostForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              variant="danger"
              onClick={handleSaveLostAnalysis}
              icon={TrendingDown}
            >
              Zapisz analize
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Zwyciezca</label>
              <input
                type="text"
                value={lostForm.winnerName}
                onChange={(e) => setLostForm({ ...lostForm, winnerName: e.target.value })}
                className={inputClass}
                placeholder="Nazwa zwycieskiej firmy"
              />
            </div>
            <div>
              <label className={labelClass}>Cena zwyciezcy</label>
              <input
                type="number"
                step="0.01"
                value={lostForm.winnerPrice}
                onChange={(e) => setLostForm({ ...lostForm, winnerPrice: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Powody przegranej *</label>
            <div className="space-y-2">
              {lostForm.lostReasons.map((reason, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => updateLostReason(idx, e.target.value)}
                    className={inputClass}
                    placeholder={`Powod ${idx + 1}`}
                  />
                  {lostForm.lostReasons.length > 1 && (
                    <button
                      onClick={() => removeLostReason(idx)}
                      className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addLostReason}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj powod
            </button>
          </div>

          <div>
            <label className={labelClass}>Wnioski</label>
            <textarea
              value={lostForm.lessonsLearned}
              onChange={(e) => setLostForm({ ...lostForm, lessonsLearned: e.target.value })}
              className={inputClass}
              rows={3}
              placeholder="Czego sie nauczylismy..."
            />
          </div>

          <div>
            <label className={labelClass}>Obszary do poprawy</label>
            <div className="space-y-2">
              {lostForm.improvementAreas.map((area, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => updateImprovementArea(idx, e.target.value)}
                    className={inputClass}
                    placeholder={`Obszar ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addImprovementArea}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj obszar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data follow-up</label>
              <input
                type="date"
                value={lostForm.followUpDate}
                onChange={(e) => setLostForm({ ...lostForm, followUpDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Notatki follow-up</label>
              <input
                type="text"
                value={lostForm.followUpNotes}
                onChange={(e) => setLostForm({ ...lostForm, followUpNotes: e.target.value })}
                className={inputClass}
                placeholder="Plan dalszego dzialania..."
              />
            </div>
          </div>
        </div>
      </FormModal>
    </PageShell>
  );
}
