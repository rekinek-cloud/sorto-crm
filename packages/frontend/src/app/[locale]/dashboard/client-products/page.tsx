'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api/client';
import { clientProductsApi, CreateClientProductRequest } from '@/lib/api/clientProducts';
import { ClientProduct, ClientProductStats } from '@/types/gtd';

// ─── Status config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Aktywny',    color: 'bg-green-100 text-green-700' },
  TRIAL:     { label: 'Okres prob', color: 'bg-blue-100 text-blue-700' },
  SUSPENDED: { label: 'Zawieszony', color: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: 'Anulowany',  color: 'bg-red-100 text-red-700' },
  EXPIRED:   { label: 'Wygasly',    color: 'bg-gray-100 text-gray-700' },
};

const USAGE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
const USAGE_LABELS: Record<string, string> = {
  LOW: 'Niski',
  MEDIUM: 'Sredni',
  HIGH: 'Wysoki',
};

interface CompanyOption {
  id: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function formatDate(d?: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pl-PL');
}

function formatCurrency(val?: number | null, currency?: string): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency || 'PLN' }).format(val);
}

function satisfactionStars(score?: number | null): string {
  if (score == null) return '-';
  return Array.from({ length: 5 }, (_, i) => (i < score ? '\u2605' : '\u2606')).join('');
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ClientProductsPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [stats, setStats] = useState<ClientProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<{
    type: string;
    status: string;
    customName: string;
    quantity: string;
    unitPrice: string;
    currency: string;
    startDate: string;
    renewalDate: string;
    contractEndDate: string;
    autoRenew: boolean;
    satisfactionScore: string;
    usageLevel: string;
    notes: string;
  }>({
    type: 'PRODUCT',
    status: 'ACTIVE',
    customName: '',
    quantity: '1',
    unitPrice: '',
    currency: 'PLN',
    startDate: '',
    renewalDate: '',
    contractEndDate: '',
    autoRenew: false,
    satisfactionScore: '',
    usageLevel: 'MEDIUM',
    notes: '',
  });

  // ─── Load companies ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/companies?limit=200');
        const data = res.data?.data || res.data;
        const list: CompanyOption[] = Array.isArray(data) ? data : data?.companies || data?.items || [];
        setCompanies(list);
      } catch {
        toast.error('Nie udalo sie pobrac firm');
      } finally {
        setCompaniesLoading(false);
      }
    })();
  }, []);

  // ─── Load products + stats ────────────────────────────────────────
  const loadData = useCallback(async (companyId: string) => {
    if (!companyId) {
      setProducts([]);
      setStats(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [prodRes, statsRes] = await Promise.allSettled([
        clientProductsApi.getClientProducts({ companyId, limit: 100 }),
        clientProductsApi.getClientProductStats(companyId),
      ]);

      if (prodRes.status === 'fulfilled') {
        const raw = prodRes.value;
        const list = Array.isArray(raw) ? raw : raw?.items || [];
        setProducts(list);
      } else {
        setProducts([]);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      } else {
        setStats(null);
      }
    } catch {
      setError('Nie udalo sie pobrac produktow klienta');
      toast.error('Blad podczas ladowania danych');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadData(selectedCompanyId);
    }
  }, [selectedCompanyId, loadData]);

  // ─── Create product ───────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setFormLoading(true);
    try {
      const req: CreateClientProductRequest = {
        companyId: selectedCompanyId,
        type: form.type || undefined,
        status: form.status || undefined,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
        currency: form.currency || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        renewalDate: form.renewalDate ? new Date(form.renewalDate).toISOString() : undefined,
        contractEndDate: form.contractEndDate ? new Date(form.contractEndDate).toISOString() : undefined,
        autoRenew: form.autoRenew,
        satisfactionScore: form.satisfactionScore ? parseInt(form.satisfactionScore) : undefined,
        usageLevel: form.usageLevel || undefined,
        notes: form.notes.trim() || undefined,
      };
      await clientProductsApi.createClientProduct(req);
      toast.success('Produkt klienta dodany');
      setShowForm(false);
      setForm({
        type: 'PRODUCT', status: 'ACTIVE', customName: '', quantity: '1', unitPrice: '',
        currency: 'PLN', startDate: '', renewalDate: '', contractEndDate: '',
        autoRenew: false, satisfactionScore: '', usageLevel: 'MEDIUM', notes: '',
      });
      loadData(selectedCompanyId);
    } catch {
      toast.error('Nie udalo sie dodac produktu');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete product ───────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten produkt klienta?')) return;
    try {
      await clientProductsApi.deleteClientProduct(id);
      toast.success('Produkt klienta usuniety');
      loadData(selectedCompanyId);
    } catch {
      toast.error('Nie udalo sie usunac produktu');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produkty klienta</h1>
          <p className="text-sm text-gray-500 mt-1">Przegladaj produkty i uslugi wykorzystywane przez firmy</p>
        </div>
        {selectedCompanyId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Dodaj produkt
          </button>
        )}
      </div>

      {/* Company selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz firme</label>
        {companiesLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Wybierz firme --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* No company selected */}
      {!selectedCompanyId && !companiesLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5M3.75 3v18m16.5-18v18M5.25 3h13.5M5.25 21V3m13.5 18V3M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15" /></svg>
          <p className="mt-3 text-gray-500">Wybierz firme, aby zobaczyc jej produkty</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-500">Ladowanie...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          <button onClick={() => loadData(selectedCompanyId)} className="ml-3 underline">Sprobuj ponownie</button>
        </div>
      )}

      {/* Data */}
      {!loading && !error && selectedCompanyId && (
        <>
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.orderCount ?? products.length}</div>
                <div className="text-xs text-gray-500">Produkty razem</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalValue)}
                </div>
                <div className="text-xs text-gray-500">Laczna wartosc</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.averageRating != null ? `${stats.averageRating.toFixed(1)}/5` : '-'}
                </div>
                <div className="text-xs text-gray-500">Srednia ocena</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.averageValue)}
                </div>
                <div className="text-xs text-gray-500">Srednia wartosc</div>
              </div>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Brak produktow dla tej firmy</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Dodaj pierwszy produkt
              </button>
            </div>
          ) : (
            /* Table */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nazwa</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Wartosc</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Ocena</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Dostarczone</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const sc = STATUS_CONFIG[p.currency] || null; // fallback
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {p.customName || (p.productId ? `Produkt #${p.productId.slice(0, 8)}` : p.serviceId ? `Usluga #${p.serviceId.slice(0, 8)}` : 'Produkt')}
                            </div>
                            {p.customDescription && (
                              <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.customDescription}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                              Dostarczony
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(p.value, p.currency)}
                          </td>
                          <td className="px-4 py-3 text-center text-yellow-500 text-sm">
                            {satisfactionStars(p.rating)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(p.deliveredAt)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                              title="Usun"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Create Form Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Nowy produkt klienta</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="PRODUCT">Produkt</option>
                  <option value="SERVICE">Usluga</option>
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {/* Quantity + Unit Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ilosc</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cena jednostkowa</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczecia</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data odnowienia</label>
                  <input
                    type="date"
                    value={form.renewalDate}
                    onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Koniec umowy</label>
                <input
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              {/* Auto Renew */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRenew}
                  onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Automatyczne odnowienie</span>
              </label>
              {/* Satisfaction Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ocena satysfakcji (1-5)</label>
                <select
                  value={form.satisfactionScore}
                  onChange={(e) => setForm({ ...form, satisfactionScore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">-- Brak oceny --</option>
                  <option value="1">1 - Bardzo niska</option>
                  <option value="2">2 - Niska</option>
                  <option value="3">3 - Srednia</option>
                  <option value="4">4 - Wysoka</option>
                  <option value="5">5 - Bardzo wysoka</option>
                </select>
              </div>
              {/* Usage Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poziom uzytkowania</label>
                <select
                  value={form.usageLevel}
                  onChange={(e) => setForm({ ...form, usageLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {USAGE_LEVELS.map((l) => (
                    <option key={l} value={l}>{USAGE_LABELS[l]}</option>
                  ))}
                </select>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  placeholder="Dodatkowe informacje..."
                />
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Dodawanie...' : 'Dodaj produkt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
