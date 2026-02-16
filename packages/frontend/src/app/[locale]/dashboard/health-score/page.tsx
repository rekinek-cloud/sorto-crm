// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Search,
  Plus,
  Building2,
  User,
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Activity,
  MessageSquare,
  BarChart3,
  Smile,
  Timer,
  Pencil,
  Bell,
  BellOff,
  Lightbulb,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';
import { healthScoreApi, CreateHealthScoreRequest, CreateHealthAlertRequest } from '@/lib/api/healthScore';
import { RelationshipHealth, HealthAlert } from '@/types/streams';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { dealsApi } from '@/lib/api/deals';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const ENTITY_TYPES = [
  { value: 'COMPANY', label: 'Firma', icon: Building2 },
  { value: 'CONTACT', label: 'Kontakt', icon: User },
  { value: 'DEAL', label: 'Deal', icon: Briefcase },
];

const getScoreColor = (score: number) => {
  if (score >= 67) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 34) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBarColor = (score: number) => {
  if (score >= 67) return 'bg-emerald-500';
  if (score >= 34) return 'bg-amber-500';
  return 'bg-red-500';
};

const getScoreBgGradient = (score: number) => {
  if (score >= 67) return 'from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/30';
  if (score >= 34) return 'from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/30';
  return 'from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-800/30';
};

const getTrendConfig = (trend: string) => {
  switch (trend) {
    case 'RISING': return { label: 'Rosnacy', variant: 'success' as const, icon: TrendingUp };
    case 'STABLE': return { label: 'Stabilny', variant: 'info' as const, icon: ArrowRight };
    case 'DECLINING': return { label: 'Spadajacy', variant: 'warning' as const, icon: TrendingDown };
    case 'CRITICAL': return { label: 'Krytyczny', variant: 'error' as const, icon: TrendingDown };
    default: return { label: trend, variant: 'neutral' as const, icon: ArrowRight };
  }
};

const getRiskConfig = (risk: string) => {
  switch (risk) {
    case 'LOW': return { label: 'Niskie', variant: 'success' as const, icon: ShieldCheck };
    case 'MEDIUM': return { label: 'Srednie', variant: 'warning' as const, icon: Shield };
    case 'HIGH': return { label: 'Wysokie', variant: 'warning' as const, icon: ShieldAlert };
    case 'CRITICAL': return { label: 'Krytyczne', variant: 'error' as const, icon: ShieldAlert };
    default: return { label: risk, variant: 'neutral' as const, icon: Shield };
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'INFO': return { label: 'Informacja', variant: 'info' as const, icon: Info };
    case 'WARNING': return { label: 'Ostrzezenie', variant: 'warning' as const, icon: AlertCircle };
    case 'CRITICAL': return { label: 'Krytyczny', variant: 'error' as const, icon: ShieldAlert };
    default: return { label: severity, variant: 'neutral' as const, icon: Info };
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
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function HealthScorePage() {
  const [entityType, setEntityType] = useState<'COMPANY' | 'CONTACT' | 'DEAL'>('COMPANY');
  const [entityId, setEntityId] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [entityOptions, setEntityOptions] = useState<{ id: string; label: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEntityLabel, setSelectedEntityLabel] = useState('');

  const [healthScore, setHealthScore] = useState<RelationshipHealth | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  const [scoreForm, setScoreForm] = useState({
    overallScore: 50,
    touchpointScore: 50,
    responseScore: 50,
    engagementScore: 50,
    satisfactionScore: 50,
    trend: 'STABLE' as string,
    riskLevel: 'LOW' as string,
  });

  const [alertForm, setAlertForm] = useState({
    alertType: 'INACTIVITY',
    severity: 'WARNING' as string,
    title: '',
    description: '',
    suggestedAction: '',
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
        } else if (entityType === 'CONTACT') {
          const res = await contactsApi.getContacts({ search: entitySearch, limit: 20 });
          setEntityOptions(res.contacts.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}` })));
        } else {
          const res = await dealsApi.getDeals({ search: entitySearch, limit: 20 });
          setEntityOptions(res.deals.map(d => ({ id: d.id, label: d.title })));
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

  // Load health data
  const loadHealthData = useCallback(async () => {
    if (!entityId) return;
    try {
      setIsLoading(true);
      const [scoreRes, alertsRes] = await Promise.allSettled([
        healthScoreApi.getHealthScore({ entityType, entityId }),
        healthScoreApi.getHealthAlerts({ entityType }),
      ]);
      if (scoreRes.status === 'fulfilled') {
        setHealthScore(scoreRes.value);
      } else {
        setHealthScore(null);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.filter(a => a.entityId === entityId));
      }
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      loadHealthData();
    } else {
      setHealthScore(null);
      setAlerts([]);
    }
  }, [entityId, loadHealthData]);

  const handleCreateScore = async () => {
    try {
      const data: CreateHealthScoreRequest = {
        entityType,
        entityId,
        overallScore: scoreForm.overallScore,
        touchpointScore: scoreForm.touchpointScore,
        responseScore: scoreForm.responseScore,
        engagementScore: scoreForm.engagementScore,
        satisfactionScore: scoreForm.satisfactionScore,
        trend: scoreForm.trend as any,
        riskLevel: scoreForm.riskLevel as any,
      };

      if (healthScore) {
        await healthScoreApi.updateHealthScore(healthScore.id, data);
        toast.success('Wynik zdrowia zaktualizowany!');
      } else {
        await healthScoreApi.createHealthScore(data);
        toast.success('Wynik zdrowia utworzony!');
      }
      setShowScoreForm(false);
      loadHealthData();
    } catch (error) {
      console.error('Failed to save health score:', error);
      toast.error('Nie udalo sie zapisac wyniku');
    }
  };

  const handleCreateAlert = async () => {
    if (!alertForm.title.trim() || !alertForm.description.trim()) {
      toast.error('Tytul i opis sa wymagane');
      return;
    }
    try {
      const data: CreateHealthAlertRequest = {
        entityType,
        entityId,
        alertType: alertForm.alertType,
        severity: alertForm.severity as any,
        title: alertForm.title.trim(),
        description: alertForm.description.trim(),
        suggestedAction: alertForm.suggestedAction.trim() || undefined,
      };
      await healthScoreApi.createHealthAlert(data);
      toast.success('Alert utworzony!');
      setShowAlertForm(false);
      setAlertForm({ alertType: 'INACTIVITY', severity: 'WARNING', title: '', description: '', suggestedAction: '' });
      loadHealthData();
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast.error('Nie udalo sie utworzyc alertu');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await healthScoreApi.updateHealthAlert(alertId, { isDismissed: true });
      toast.success('Alert odrzucony');
      loadHealthData();
    } catch (error) {
      toast.error('Blad');
    }
  };

  const ScoreBar = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon className="w-4 h-4" />
          {label}
        </span>
        <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-2 rounded-full transition-all ${getScoreBarColor(score)}`}
        />
      </div>
    </div>
  );

  const activeAlerts = alerts.filter(a => !a.isDismissed);

  return (
    <PageShell>
      <PageHeader
        title="Zdrowie relacji"
        subtitle="Monitoruj jakosc relacji z klientami i dealami"
        icon={HeartPulse}
        iconColor="text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400"
        breadcrumbs={[
          { label: 'Pulpit', href: '/dashboard' },
          { label: 'Zdrowie relacji' },
        ]}
        actions={
          entityId ? (
            <div className="flex items-center gap-2">
              <ActionButton variant="secondary" icon={Bell} onClick={() => setShowAlertForm(true)} size="sm">
                Dodaj alert
              </ActionButton>
              <ActionButton
                icon={healthScore ? Pencil : Plus}
                onClick={() => {
                  if (healthScore) {
                    setScoreForm({
                      overallScore: healthScore.healthScore,
                      touchpointScore: healthScore.recencyScore || 50,
                      responseScore: healthScore.responseScore || 50,
                      engagementScore: healthScore.engagementScore || 50,
                      satisfactionScore: healthScore.sentimentScore || 50,
                      trend: healthScore.trend || 'STABLE',
                      riskLevel: healthScore.riskLevel || 'LOW',
                    });
                  }
                  setShowScoreForm(true);
                }}
                size="sm"
              >
                {healthScore ? 'Edytuj wynik' : 'Nowy wynik'}
              </ActionButton>
            </div>
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
            {ENTITY_TYPES.map(et => {
              const EtIcon = et.icon;
              return (
                <button
                  key={et.value}
                  onClick={() => {
                    setEntityType(et.value as any);
                    setEntityId('');
                    setEntitySearch('');
                    setSelectedEntityLabel('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    entityType === et.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <EtIcon className="w-4 h-4" />
                  {et.label}
                </button>
              );
            })}
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
              placeholder="Szukaj..."
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
            icon={HeartPulse}
            title="Wybierz podmiot"
            description="Wyszukaj firme, kontakt lub deal aby zobaczyc wynik zdrowia relacji"
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
          {/* Health Score Dashboard */}
          {healthScore ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Score Card */}
              <motion.div
                className={`bg-gradient-to-br ${getScoreBgGradient(healthScore.healthScore)} backdrop-blur-xl border rounded-2xl p-6 text-center shadow-sm`}
              >
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Wynik ogolny
                </h3>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className={`text-6xl font-bold ${getScoreColor(healthScore.healthScore)}`}
                >
                  {healthScore.healthScore}
                </motion.div>
                <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">/ 100</div>

                {/* Trend */}
                {healthScore.trend && (() => {
                  const trendConfig = getTrendConfig(healthScore.trend);
                  const TrendIcon = trendConfig.icon;
                  return (
                    <div className="mt-4">
                      <StatusBadge variant={trendConfig.variant} size="md" dot>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {trendConfig.label}
                      </StatusBadge>
                    </div>
                  );
                })()}

                {/* Risk Level */}
                {healthScore.riskLevel && (() => {
                  const riskConfig = getRiskConfig(healthScore.riskLevel);
                  const RiskIcon = riskConfig.icon;
                  return (
                    <div className="mt-2">
                      <StatusBadge variant={riskConfig.variant} size="md">
                        <RiskIcon className="w-3.5 h-3.5" />
                        Ryzyko: {riskConfig.label}
                      </StatusBadge>
                    </div>
                  );
                })()}

                <button
                  onClick={() => {
                    setScoreForm({
                      overallScore: healthScore.healthScore,
                      touchpointScore: healthScore.recencyScore || 50,
                      responseScore: healthScore.responseScore || 50,
                      engagementScore: healthScore.engagementScore || 50,
                      satisfactionScore: healthScore.sentimentScore || 50,
                      trend: healthScore.trend || 'STABLE',
                      riskLevel: healthScore.riskLevel || 'LOW',
                    });
                    setShowScoreForm(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edytuj wynik
                </button>
              </motion.div>

              {/* Sub-scores */}
              <motion.div
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-6 shadow-sm lg:col-span-2"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-5 uppercase tracking-wider">
                  Szczegolowe wyniki
                </h3>
                <div className="space-y-4">
                  <ScoreBar label="Punkty styku (Touchpoints)" score={healthScore.recencyScore || 0} icon={Activity} />
                  <ScoreBar label="Responsywnosc" score={healthScore.responseScore || 0} icon={MessageSquare} />
                  <ScoreBar label="Zaangazowanie" score={healthScore.engagementScore || 0} icon={BarChart3} />
                  <ScoreBar label="Sentyment" score={healthScore.sentimentScore || 0} icon={Smile} />
                  <ScoreBar label="Czestotliwosc" score={healthScore.frequencyScore || 0} icon={Timer} />
                </div>

                {healthScore.lastContactAt && (
                  <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Timer className="w-4 h-4" />
                    Ostatni kontakt: {formatDate(healthScore.lastContactAt)}
                    {healthScore.lastContactType && (
                      <StatusBadge variant="neutral" size="sm">{healthScore.lastContactType}</StatusBadge>
                    )}
                  </div>
                )}

                {healthScore.riskFactors && healthScore.riskFactors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Czynniki ryzyka
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {healthScore.riskFactors.map((factor, idx) => (
                        <StatusBadge key={idx} variant="error" size="sm">
                          {factor}
                        </StatusBadge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            >
              <EmptyState
                icon={HeartPulse}
                title="Brak wyniku zdrowia"
                description={`Utworz pierwszy wynik zdrowia dla: ${selectedEntityLabel}`}
                action={
                  <ActionButton icon={Plus} onClick={() => setShowScoreForm(true)}>
                    Utworz wynik zdrowia
                  </ActionButton>
                }
              />
            </motion.div>
          )}

          {/* Alerts Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Alerty
                </h3>
                {activeAlerts.length > 0 && (
                  <StatusBadge variant="warning" size="sm">{activeAlerts.length}</StatusBadge>
                )}
              </div>
              <ActionButton variant="secondary" icon={Plus} size="sm" onClick={() => setShowAlertForm(true)}>
                Dodaj alert
              </ActionButton>
            </div>

            {activeAlerts.length === 0 ? (
              <EmptyState
                icon={BellOff}
                title="Brak aktywnych alertow"
                description="Wszystkie alerty zostaly obsluzone"
                className="py-8"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {activeAlerts.map((alert) => {
                  const sevConfig = getSeverityConfig(alert.severity);
                  const SevIcon = sevConfig.icon;
                  return (
                    <motion.div
                      key={alert.id}
                      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.3)' }}
                      className="px-5 py-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            <SevIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusBadge variant={sevConfig.variant} size="sm">
                                {sevConfig.label}
                              </StatusBadge>
                              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {alert.title}
                              </h4>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                            {alert.suggestion && (
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                                Sugestia: {alert.suggestion}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                              {formatDate(alert.createdAt)}
                            </p>
                          </div>
                        </div>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissAlert(alert.id)}
                          className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 flex-shrink-0"
                        >
                          Odrzuc
                        </ActionButton>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Score Form Modal */}
      <FormModal
        isOpen={showScoreForm}
        onClose={() => setShowScoreForm(false)}
        title={healthScore ? 'Edytuj wynik zdrowia' : 'Nowy wynik zdrowia'}
        subtitle={`Podmiot: ${selectedEntityLabel}`}
        position="center"
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowScoreForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton variant="primary" onClick={handleCreateScore}>
              Zapisz
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {[
            { key: 'overallScore', label: 'Wynik ogolny', icon: HeartPulse },
            { key: 'touchpointScore', label: 'Punkty styku', icon: Activity },
            { key: 'responseScore', label: 'Responsywnosc', icon: MessageSquare },
            { key: 'engagementScore', label: 'Zaangazowanie', icon: BarChart3 },
            { key: 'satisfactionScore', label: 'Satysfakcja', icon: Smile },
          ].map(({ key, label, icon: SliderIcon }) => (
            <div key={key}>
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="flex items-center gap-2">
                  <SliderIcon className="w-4 h-4 text-slate-400" />
                  {label}
                </span>
                <span className={`font-bold ${getScoreColor(scoreForm[key])}`}>{scoreForm[key]}</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={scoreForm[key]}
                onChange={(e) => setScoreForm({ ...scoreForm, [key]: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Trend
              </label>
              <select
                value={scoreForm.trend}
                onChange={(e) => setScoreForm({ ...scoreForm, trend: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="RISING">Rosnacy</option>
                <option value="STABLE">Stabilny</option>
                <option value="DECLINING">Spadajacy</option>
                <option value="CRITICAL">Krytyczny</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Poziom ryzyka
              </label>
              <select
                value={scoreForm.riskLevel}
                onChange={(e) => setScoreForm({ ...scoreForm, riskLevel: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="LOW">Niskie</option>
                <option value="MEDIUM">Srednie</option>
                <option value="HIGH">Wysokie</option>
                <option value="CRITICAL">Krytyczne</option>
              </select>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Alert Form Modal */}
      <FormModal
        isOpen={showAlertForm}
        onClose={() => setShowAlertForm(false)}
        title="Nowy alert"
        subtitle={`Alert dla: ${selectedEntityLabel}`}
        position="center"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setShowAlertForm(false)}>
              Anuluj
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Bell}
              onClick={handleCreateAlert}
              disabled={!alertForm.title.trim() || !alertForm.description.trim()}
            >
              Utworz alert
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Typ alertu
              </label>
              <input
                type="text"
                value={alertForm.alertType}
                onChange={(e) => setAlertForm({ ...alertForm, alertType: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="INACTIVITY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Waznosc
              </label>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="INFO">Informacja</option>
                <option value="WARNING">Ostrzezenie</option>
                <option value="CRITICAL">Krytyczny</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tytul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={alertForm.title}
              onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Np. Brak kontaktu od 30 dni"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Opis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={alertForm.description}
              onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={3}
              placeholder="Szczegolowy opis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Sugerowana akcja
            </label>
            <input
              type="text"
              value={alertForm.suggestedAction}
              onChange={(e) => setAlertForm({ ...alertForm, suggestedAction: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Np. Zaplanuj spotkanie"
            />
          </div>
        </div>
      </FormModal>
    </PageShell>
  );
}
