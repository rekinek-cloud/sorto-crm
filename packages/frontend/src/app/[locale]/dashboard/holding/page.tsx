'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Briefcase, TrendingUp, Plus, ArrowRight, X, Loader2 } from 'lucide-react';
import { holdingsApi } from '@/lib/api/holdings';
import { Holding, OrganizationSummary, CompanyType } from '@/types/holding';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import toast from 'react-hot-toast';

const companyTypeLabels: Record<CompanyType, string> = {
  PRODUCTION: 'Produkcja',
  SALES: 'Sprzedaż',
  SERVICES: 'Usługi',
  EXPORT: 'Eksport',
  OTHER: 'Inne',
};

export default function HoldingPage() {
  const { switchOrganization, activeOrganization } = useCompanyContext();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingOrg, setAddingOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    shortName: '',
    companyType: 'OTHER' as CompanyType,
    color: '#6366f1',
  });

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await holdingsApi.getHoldings();
      setHoldings(data);
    } catch (err) {
      toast.error('Nie udało się pobrać danych holdingu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganization = async () => {
    if (!holdings[0]?.id) return;
    if (!newOrg.name.trim()) {
      toast.error('Nazwa organizacji jest wymagana');
      return;
    }
    try {
      setAddingOrg(true);
      await holdingsApi.addOrganization(holdings[0].id, newOrg);
      toast.success('Organizacja została dodana');
      setShowAddModal(false);
      setNewOrg({ name: '', shortName: '', companyType: 'OTHER', color: '#6366f1' });
      fetchHoldings();
    } catch (err) {
      toast.error('Nie udało się dodać organizacji');
    } finally {
      setAddingOrg(false);
    }
  };

  const handleSwitch = async (orgId: string) => {
    await switchOrganization(orgId);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const holding = holdings[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Holding</h1>
        <p className="text-gray-500 mt-1">Zarządzaj spółkami i strukturą organizacyjną</p>
      </div>

      {/* Holding info card */}
      {holding && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-white/70" />
                <span className="text-sm text-white/70 font-medium">Holding</span>
              </div>
              <h2 className="text-xl font-bold mb-1">{holding.name}</h2>
              {holding.nip && (
                <p className="text-sm text-white/60">NIP: {holding.nip}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Spółek</p>
              <p className="text-2xl font-bold">{holding.organizations?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  holding.settings.consolidatedReporting ? 'bg-emerald-400' : 'bg-white/30'
                }`}
              />
              <span className="text-xs text-white/70">Skonsolidowane raporty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  holding.settings.sharedAIAgents ? 'bg-emerald-400' : 'bg-white/30'
                }`}
              />
              <span className="text-xs text-white/70">Współdzieleni agenci AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  holding.settings.allowCrossCompanyContacts ? 'bg-emerald-400' : 'bg-white/30'
                }`}
              />
              <span className="text-xs text-white/70">Kontakty cross-company</span>
            </div>
          </div>
        </div>
      )}

      {/* Organizations header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Spółki</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Dodaj spółkę
        </button>
      </div>

      {/* Organizations grid */}
      {holding?.organizations && holding.organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holding.organizations.map((org) => {
            const isActive = org.id === activeOrganization?.id;
            return (
              <div
                key={org.id}
                className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'border-indigo-300 shadow-md shadow-indigo-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="p-5">
                  {/* Org header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: org.color || '#6366f1' }}
                    >
                      {org.icon || org.shortName?.slice(0, 2) || org.name.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{org.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {org.shortName && (
                          <span className="text-xs text-gray-400">{org.shortName}</span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                          {companyTypeLabels[org.companyType] || org.companyType}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                        Aktywna
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center px-2 py-2 rounded-lg bg-gray-50">
                      <Users className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                      <p className="text-sm font-semibold text-gray-900">
                        {org._count?.employees || 0}
                      </p>
                      <p className="text-[10px] text-gray-400">Pracownicy</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-gray-50">
                      <Briefcase className="w-4 h-4 text-emerald-500 mx-auto mb-0.5" />
                      <p className="text-sm font-semibold text-gray-900">
                        {org._count?.companies || 0}
                      </p>
                      <p className="text-[10px] text-gray-400">Klienci</p>
                    </div>
                    <div className="text-center px-2 py-2 rounded-lg bg-gray-50">
                      <TrendingUp className="w-4 h-4 text-purple-500 mx-auto mb-0.5" />
                      <p className="text-sm font-semibold text-gray-900">
                        {org._count?.deals || 0}
                      </p>
                      <p className="text-[10px] text-gray-400">Deale</p>
                    </div>
                  </div>
                </div>

                {/* Switch button */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => handleSwitch(org.id)}
                    disabled={isActive}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-400 cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                  >
                    {isActive ? (
                      'Aktywna organizacja'
                    ) : (
                      <>
                        Przełącz
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Brak spółek</h3>
          <p className="text-xs text-gray-400 mb-4">Dodaj pierwszą spółkę do holdingu</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj spółkę
          </button>
        </div>
      )}

      {/* Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Dodaj spółkę</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa spółki *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="np. Sorto Solutions Sp. z o.o."
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skrócona nazwa
                </label>
                <input
                  type="text"
                  value={newOrg.shortName}
                  onChange={(e) => setNewOrg({ ...newOrg, shortName: e.target.value })}
                  placeholder="np. SORT"
                  maxLength={8}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ spółki
                </label>
                <select
                  value={newOrg.companyType}
                  onChange={(e) =>
                    setNewOrg({ ...newOrg, companyType: e.target.value as CompanyType })
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                >
                  {Object.entries(companyTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kolor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newOrg.color}
                    onChange={(e) => setNewOrg({ ...newOrg, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setNewOrg({ ...newOrg, color })}
                          className={`w-8 h-8 rounded-lg transition-transform ${
                            newOrg.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddOrganization}
                disabled={addingOrg}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {addingOrg && <Loader2 className="w-4 h-4 animate-spin" />}
                Dodaj spółkę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
