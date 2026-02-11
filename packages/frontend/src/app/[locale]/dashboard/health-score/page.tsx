// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { healthScoreApi, CreateHealthScoreRequest, CreateHealthAlertRequest } from '@/lib/api/healthScore';
import { RelationshipHealth, HealthAlert } from '@/types/gtd';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { dealsApi } from '@/lib/api/deals';

const ENTITY_TYPES = [
  { value: 'COMPANY', label: 'Firma' },
  { value: 'CONTACT', label: 'Kontakt' },
  { value: 'DEAL', label: 'Deal' },
];

const getScoreColor = (score: number) => {
  if (score >= 67) return 'text-green-600';
  if (score >= 34) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBarColor = (score: number) => {
  if (score >= 67) return 'bg-green-500';
  if (score >= 34) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getScoreBgColor = (score: number) => {
  if (score >= 67) return 'bg-green-50 border-green-200';
  if (score >= 34) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};

const getTrendLabel = (trend: string) => {
  switch (trend) {
    case 'RISING': return { label: 'Rosnacy', color: 'text-green-600', icon: '↑' };
    case 'STABLE': return { label: 'Stabilny', color: 'text-blue-600', icon: '→' };
    case 'DECLINING': return { label: 'Spadajacy', color: 'text-orange-600', icon: '↓' };
    case 'CRITICAL': return { label: 'Krytyczny', color: 'text-red-600', icon: '↓↓' };
    default: return { label: trend, color: 'text-gray-600', icon: '-' };
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW': return 'bg-green-100 text-green-700';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
    case 'HIGH': return 'bg-orange-100 text-orange-700';
    case 'CRITICAL': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'INFO': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pl-PL');
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

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zdrowie relacji</h1>
          <p className="text-gray-600">Monitoruj jakosc relacji z klientami i dealami</p>
        </div>
      </div>

      {/* Entity Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Wybierz podmiot</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {ENTITY_TYPES.map(et => (
              <button
                key={et.value}
                onClick={() => { setEntityType(et.value as any); setEntityId(''); setEntitySearch(''); setSelectedEntityLabel(''); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${entityType === et.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {et.label}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={entitySearch}
              onChange={(e) => { setEntitySearch(e.target.value); if (entityId) { setEntityId(''); setSelectedEntityLabel(''); } }}
              onFocus={() => entityOptions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Szukaj..."
            />
            {showDropdown && entityOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {entityOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectEntity(option)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {!entityId ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-3">💚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Wybierz podmiot</h3>
          <p className="text-gray-600">Wyszukaj firme, kontakt lub deal aby zobaczyc wynik zdrowia relacji</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Health Score Dashboard */}
          {healthScore ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Score */}
              <div className={`rounded-lg border-2 p-6 text-center ${getScoreBgColor(healthScore.healthScore)}`}>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Wynik ogolny</h3>
                <div className={`text-6xl font-bold ${getScoreColor(healthScore.healthScore)}`}>
                  {healthScore.healthScore}
                </div>
                <div className="text-sm text-gray-500 mt-1">/ 100</div>

                {/* Trend */}
                {healthScore.trend && (
                  <div className="mt-4">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${getTrendLabel(healthScore.trend).color}`}>
                      {getTrendLabel(healthScore.trend).icon} {getTrendLabel(healthScore.trend).label}
                    </span>
                  </div>
                )}

                {/* Risk Level */}
                {healthScore.riskLevel && (
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(healthScore.riskLevel)}`}>
                      Ryzyko: {healthScore.riskLevel}
                    </span>
                  </div>
                )}

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
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edytuj wynik
                </button>
              </div>

              {/* Sub-scores */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Szczegolowe wyniki</h3>
                <div className="space-y-4">
                  <ScoreBar label="Punkty styku (Touchpoints)" score={healthScore.recencyScore || 0} />
                  <ScoreBar label="Responsywnosc" score={healthScore.responseScore || 0} />
                  <ScoreBar label="Zaangazowanie" score={healthScore.engagementScore || 0} />
                  <ScoreBar label="Sentyment" score={healthScore.sentimentScore || 0} />
                  <ScoreBar label="Czestotliwosc" score={healthScore.frequencyScore || 0} />
                </div>

                {healthScore.lastContactAt && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Ostatni kontakt: {formatDate(healthScore.lastContactAt)}
                    {healthScore.lastContactType && ` (${healthScore.lastContactType})`}
                  </div>
                )}

                {healthScore.riskFactors && healthScore.riskFactors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Czynniki ryzyka</h4>
                    <div className="flex flex-wrap gap-2">
                      {healthScore.riskFactors.map((factor, idx) => (
                        <span key={idx} className="inline-flex px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak wyniku zdrowia</h3>
              <p className="text-gray-600 mb-4">Utworz pierwszy wynik zdrowia dla: {selectedEntityLabel}</p>
              <button
                onClick={() => setShowScoreForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Utworz wynik zdrowia
              </button>
            </div>
          )}

          {/* Alerts Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Alerty ({alerts.filter(a => !a.isDismissed).length})
              </h3>
              <button
                onClick={() => setShowAlertForm(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dodaj alert
              </button>
            </div>

            {alerts.filter(a => !a.isDismissed).length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Brak aktywnych alertow
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {alerts.filter(a => !a.isDismissed).map((alert) => (
                  <div key={alert.id} className={`px-6 py-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        {alert.suggestion && (
                          <p className="text-sm text-blue-600 mt-1">Sugestia: {alert.suggestion}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Odrzuc
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Score Form Modal */}
      {showScoreForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {healthScore ? 'Edytuj wynik zdrowia' : 'Nowy wynik zdrowia'}
                </h3>
                <button onClick={() => setShowScoreForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {[
                { key: 'overallScore', label: 'Wynik ogolny' },
                { key: 'touchpointScore', label: 'Punkty styku' },
                { key: 'responseScore', label: 'Responsywnosc' },
                { key: 'engagementScore', label: 'Zaangazowanie' },
                { key: 'satisfactionScore', label: 'Satysfakcja' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}: <span className={`font-bold ${getScoreColor(scoreForm[key])}`}>{scoreForm[key]}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreForm[key]}
                    onChange={(e) => setScoreForm({ ...scoreForm, [key]: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trend</label>
                  <select
                    value={scoreForm.trend}
                    onChange={(e) => setScoreForm({ ...scoreForm, trend: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="RISING">Rosnacy</option>
                    <option value="STABLE">Stabilny</option>
                    <option value="DECLINING">Spadajacy</option>
                    <option value="CRITICAL">Krytyczny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poziom ryzyka</label>
                  <select
                    value={scoreForm.riskLevel}
                    onChange={(e) => setScoreForm({ ...scoreForm, riskLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="LOW">Niskie</option>
                    <option value="MEDIUM">Srednie</option>
                    <option value="HIGH">Wysokie</option>
                    <option value="CRITICAL">Krytyczne</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowScoreForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateScore}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Form Modal */}
      {showAlertForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nowy alert</h3>
                <button onClick={() => setShowAlertForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ alertu</label>
                  <input
                    type="text"
                    value={alertForm.alertType}
                    onChange={(e) => setAlertForm({ ...alertForm, alertType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="INACTIVITY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waznosc</label>
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Ostrzezenie</option>
                    <option value="CRITICAL">Krytyczny</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tytul *</label>
                <input
                  type="text"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Np. Brak kontaktu od 30 dni"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis *</label>
                <textarea
                  value={alertForm.description}
                  onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Szczegolowy opis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sugerowana akcja</label>
                <input
                  type="text"
                  value={alertForm.suggestedAction}
                  onChange={(e) => setAlertForm({ ...alertForm, suggestedAction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Np. Zaplanuj spotkanie"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowAlertForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateAlert}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!alertForm.title.trim() || !alertForm.description.trim()}
              >
                Utworz alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
