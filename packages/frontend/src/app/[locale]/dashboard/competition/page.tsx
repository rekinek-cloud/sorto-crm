// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { dealCompetitorsApi, CreateDealCompetitorRequest, CreateLostAnalysisRequest, LostAnalysis } from '@/lib/api/dealCompetitors';
import { DealCompetitor } from '@/types/gtd';
import { dealsApi } from '@/lib/api/deals';

const THREAT_LEVELS = [
  { value: 'LOW', label: 'Niski', color: 'bg-green-100 text-green-700' },
  { value: 'MEDIUM', label: 'Sredni', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH', label: 'Wysoki', color: 'bg-orange-100 text-orange-700' },
  { value: 'CRITICAL', label: 'Krytyczny', color: 'bg-red-100 text-red-700' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Aktywny', color: 'bg-blue-100 text-blue-700' },
  { value: 'ELIMINATED', label: 'Wyeliminowany', color: 'bg-gray-100 text-gray-600' },
  { value: 'WON', label: 'Wygral', color: 'bg-green-100 text-green-700' },
  { value: 'UNKNOWN', label: 'Nieznany', color: 'bg-gray-100 text-gray-500' },
];

const getThreatColor = (level: string) => {
  return THREAT_LEVELS.find(t => t.value === level)?.color || 'bg-gray-100 text-gray-700';
};

const getThreatLabel = (level: string) => {
  return THREAT_LEVELS.find(t => t.value === level)?.label || level;
};

const getStatusColor = (status: string) => {
  return STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
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
    if (!confirm('Usunac tego konkurenta?')) return;
    try {
      await dealCompetitorsApi.deleteCompetitor(id);
      toast.success('Konkurent usuniety');
      loadCompetitors();
    } catch (error) {
      toast.error('Blad usuwania');
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konkurencja w dealach</h1>
          <p className="text-gray-600">Sledz konkurentow i analizuj ich oferty</p>
        </div>
      </div>

      {/* Deal Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Wybierz deal</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={dealSearch}
              onChange={(e) => { setDealSearch(e.target.value); if (selectedDeal) { setSelectedDeal(null); } }}
              onFocus={() => setShowDealDropdown(true)}
              onBlur={() => setTimeout(() => setShowDealDropdown(false), 200)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Szukaj deala..."
            />
            {showDealDropdown && filteredDeals.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => selectDeal(deal)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors"
                  >
                    <div className="font-medium">{deal.title}</div>
                    <div className="text-xs text-gray-500">
                      {deal.stage} | {deal.status} | {deal.value ? formatCurrency(deal.value, deal.currency) : '-'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDeal && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj konkurenta
              </button>
              {isDealLost && !lostAnalysis && (
                <button
                  onClick={() => setShowLostForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                >
                  Analiza przegranej
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedDeal ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-3">⚔️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Wybierz deal</h3>
          <p className="text-gray-600">Wyszukaj deal powyzej aby zobaczyc analize konkurencji</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">Konkurenci</p>
              <p className="text-2xl font-bold text-gray-900">{competitors.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
              <p className="text-sm text-gray-600">Krytyczni</p>
              <p className="text-2xl font-bold text-red-600">{competitors.filter(c => c.threatLevel === 'CRITICAL').length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
              <p className="text-sm text-gray-600">Aktywni</p>
              <p className="text-2xl font-bold text-blue-600">{competitors.filter(c => c.status === 'ACTIVE').length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">Wyeliminowani</p>
              <p className="text-2xl font-bold text-gray-500">{competitors.filter(c => c.status === 'ELIMINATED').length}</p>
            </div>
          </div>

          {/* Competitors Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Konkurenci ({competitors.length})</h3>
            </div>

            {competitors.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-4xl mb-3">🏢</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Brak konkurentow</h3>
                <p className="text-gray-600 mb-4">Dodaj pierwszego konkurenta do analizy</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Dodaj konkurenta
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konkurent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cena szacunkowa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zagrozenie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mocne strony</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nasze przewagi</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competitors.map((competitor) => (
                      <tr key={competitor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{competitor.competitorName}</div>
                          {competitor.competitorWebsite && (
                            <a
                              href={competitor.competitorWebsite.startsWith('http') ? competitor.competitorWebsite : `https://${competitor.competitorWebsite}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {competitor.competitorWebsite}
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatCurrency(competitor.estimatedPrice, competitor.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getThreatColor(competitor.threatLevel)}`}>
                            {getThreatLabel(competitor.threatLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={competitor.status}
                            onChange={(e) => handleUpdateStatus(competitor.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusColor(competitor.status)}`}
                          >
                            {STATUSES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                          <p className="truncate" title={competitor.theirStrengths}>{competitor.theirStrengths || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                          <p className="truncate" title={competitor.ourAdvantages}>{competitor.ourAdvantages || '-'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleDeleteCompetitor(competitor.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Usun
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lost Analysis Section (if deal is lost) */}
          {isDealLost && lostAnalysis && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Analiza przegranej</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {lostAnalysis.winnerName && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600">Zwyciezca</p>
                      <p className="text-gray-900">{lostAnalysis.winnerName}</p>
                    </div>
                  )}
                  {lostAnalysis.winnerPrice && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600">Cena zwyciezcy</p>
                      <p className="text-gray-900">{formatCurrency(lostAnalysis.winnerPrice)}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-600">Powody przegranej</p>
                    <ul className="list-disc list-inside text-gray-900 text-sm mt-1">
                      {lostAnalysis.lostReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  {lostAnalysis.lessonsLearned && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600">Wnioski</p>
                      <p className="text-gray-900 text-sm">{lostAnalysis.lessonsLearned}</p>
                    </div>
                  )}
                  {lostAnalysis.improvementAreas.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600">Obszary do poprawy</p>
                      <ul className="list-disc list-inside text-gray-900 text-sm mt-1">
                        {lostAnalysis.improvementAreas.map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lostAnalysis.followUpNotes && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600">Notatki follow-up</p>
                      <p className="text-gray-900 text-sm">{lostAnalysis.followUpNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Competitor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Nowy konkurent</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa konkurenta *</label>
                  <input
                    type="text"
                    value={formData.competitorName}
                    onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Np. FirmaCo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strona WWW</label>
                  <input
                    type="text"
                    value={formData.competitorWebsite}
                    onChange={(e) => setFormData({ ...formData, competitorWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="www.competitor.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cena szacunkowa</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="PLN">PLN</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poziom zagrozenia</label>
                  <select
                    value={formData.threatLevel}
                    onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {THREAT_LEVELS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ich mocne strony</label>
                <textarea
                  value={formData.theirStrengths}
                  onChange={(e) => setFormData({ ...formData, theirStrengths: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="W czym sa lepsi od nas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ich slabe strony</label>
                <textarea
                  value={formData.theirWeaknesses}
                  onChange={(e) => setFormData({ ...formData, theirWeaknesses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Jakie maja slabosci..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nasze przewagi</label>
                <textarea
                  value={formData.ourAdvantages}
                  onChange={(e) => setFormData({ ...formData, ourAdvantages: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="W czym jestesmy lepsi..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddCompetitor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.competitorName.trim()}
              >
                Dodaj konkurenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Analysis Modal */}
      {showLostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Analiza przegranej</h3>
                <button onClick={() => setShowLostForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zwyciezca</label>
                  <input
                    type="text"
                    value={lostForm.winnerName}
                    onChange={(e) => setLostForm({ ...lostForm, winnerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Nazwa zwycieskiej firmy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cena zwyciezcy</label>
                  <input
                    type="number"
                    step="0.01"
                    value={lostForm.winnerPrice}
                    onChange={(e) => setLostForm({ ...lostForm, winnerPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Powody przegranej *</label>
                {lostForm.lostReasons.map((reason, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => updateLostReason(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Powod ${idx + 1}`}
                    />
                    {lostForm.lostReasons.length > 1 && (
                      <button
                        onClick={() => removeLostReason(idx)}
                        className="text-red-500 hover:text-red-700 px-2"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addLostReason}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Dodaj powod
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wnioski</label>
                <textarea
                  value={lostForm.lessonsLearned}
                  onChange={(e) => setLostForm({ ...lostForm, lessonsLearned: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Czego sie nauczylismy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obszary do poprawy</label>
                {lostForm.improvementAreas.map((area, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => updateImprovementArea(idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Obszar ${idx + 1}`}
                    />
                  </div>
                ))}
                <button
                  onClick={addImprovementArea}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Dodaj obszar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data follow-up</label>
                  <input
                    type="date"
                    value={lostForm.followUpDate}
                    onChange={(e) => setLostForm({ ...lostForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notatki follow-up</label>
                  <input
                    type="text"
                    value={lostForm.followUpNotes}
                    onChange={(e) => setLostForm({ ...lostForm, followUpNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Plan dalszego dzialania..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowLostForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveLostAnalysis}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Zapisz analize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
