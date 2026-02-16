'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Package,
  Plus,
  ShoppingBag,
  DollarSign,
  Star,
  TrendingUp,
  Trash2,
  Building2,
  Calendar,
  RefreshCw,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

import apiClient from '@/lib/api/client';
import { clientProductsApi, CreateClientProductRequest } from '@/lib/api/clientProducts';
import { ClientProduct, ClientProductStats } from '@/types/streams';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { FormModal } from '@/components/ui/FormModal';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  ACTIVE:    { label: 'Aktywny',    variant: 'success' },
  TRIAL:     { label: 'Okres prob.', variant: 'info' },
  SUSPENDED: { label: 'Zawieszony', variant: 'warning' },
  CANCELLED: { label: 'Anulowany',  variant: 'error' },
  EXPIRED:   { label: 'Wygasly',    variant: 'neutral' },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d?: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pl-PL');
}

function formatCurrency(val?: number | null, currency?: string): string {
  if (val == null) return '-';
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency || 'PLN' }).format(val);
}

function renderStars(score?: number | null): React.ReactNode {
  if (score == null) return <span className="text-slate-400 dark:text-slate-500">-</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < score
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 dark:text-slate-600'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputClass =
  'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

// ---------------------------------------------------------------------------
// Form defaults
// ---------------------------------------------------------------------------

interface ProductForm {
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
}

const EMPTY_FORM: ProductForm = {
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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClientProductsPage() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [stats, setStats] = useState<ClientProductStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter
  const [search, setSearch] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load companies
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Load products + stats
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => {
      const name = p.customName || '';
      const desc = p.customDescription || '';
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }, [products, search]);

  // ---------------------------------------------------------------------------
  // Create product
  // ---------------------------------------------------------------------------
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
      setForm(EMPTY_FORM);
      loadData(selectedCompanyId);
    } catch {
      toast.error('Nie udalo sie dodac produktu');
    } finally {
      setFormLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete product (toast-based confirmation)
  // ---------------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    if (deletingId) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Czy na pewno chcesz usunac ten produkt klienta?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setDeletingId(id);
                try {
                  await clientProductsApi.deleteClientProduct(id);
                  toast.success('Produkt klienta usuniety');
                  loadData(selectedCompanyId);
                } catch {
                  toast.error('Nie udalo sie usunac produktu');
                } finally {
                  setDeletingId(null);
                }
              }}
              className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Usun
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  const columns: Column<ClientProduct>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Nazwa',
      sortable: true,
      getValue: (p) => p.customName || p.productId || p.serviceId || '',
      render: (_val: any, p: ClientProduct) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {p.customName || (p.productId ? `Produkt #${p.productId.slice(0, 8)}` : p.serviceId ? `Usluga #${p.serviceId.slice(0, 8)}` : 'Produkt')}
          </div>
          {p.customDescription && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {p.customDescription}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: () => (
        <StatusBadge variant="success" dot>Dostarczony</StatusBadge>
      ),
    },
    {
      key: 'value',
      label: 'Wartosc',
      sortable: true,
      getValue: (p) => p.value,
      render: (_val: any, p: ClientProduct) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {formatCurrency(p.value, p.currency)}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Ocena',
      sortable: true,
      getValue: (p) => p.rating ?? -1,
      render: (_val: any, p: ClientProduct) => renderStars(p.rating),
    },
    {
      key: 'deliveredAt',
      label: 'Dostarczone',
      sortable: true,
      getValue: (p) => p.deliveredAt || '',
      render: (_val: any, p: ClientProduct) => (
        <span className="text-slate-500 dark:text-slate-400">{formatDate(p.deliveredAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Akcje',
      sortable: false,
      render: (_val: any, p: ClientProduct) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
            disabled={deletingId === p.id}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Usun"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [deletingId, selectedCompanyId]);

  // ---------------------------------------------------------------------------
  // Company filter config for FilterBar
  // ---------------------------------------------------------------------------
  const companyFilterConfig = useMemo(() => {
    if (companiesLoading) return [];
    return [{
      key: 'company',
      label: 'Wybierz firme',
      options: companies.map((c) => ({ value: c.id, label: c.name })),
    }];
  }, [companies, companiesLoading]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Full-page skeleton while companies load
  if (companiesLoading) {
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
        title="Produkty klienta"
        subtitle="Przegladaj produkty i uslugi wykorzystywane przez firmy"
        icon={Package}
        iconColor="text-indigo-600 dark:text-indigo-400"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Produkty klienta' },
        ]}
        actions={
          selectedCompanyId ? (
            <ActionButton icon={Plus} onClick={() => setShowForm(true)}>
              Dodaj produkt
            </ActionButton>
          ) : undefined
        }
      />

      {/* Company selector + Search */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Szukaj po nazwie produktu..."
        className="mb-6"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-w-[220px]"
              >
                <option value="">-- Wybierz firme --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {selectedCompanyId && (
              <ActionButton
                variant="ghost"
                icon={RefreshCw}
                size="sm"
                onClick={() => loadData(selectedCompanyId)}
                title="Odswiez dane"
              />
            )}
          </div>
        }
      />

      {/* No company selected */}
      {!selectedCompanyId && (
        <EmptyState
          icon={Building2}
          title="Wybierz firme"
          description="Wybierz firme z listy powyzej, aby zobaczyc jej produkty i uslugi"
        />
      )}

      {/* Loading */}
      {loading && selectedCompanyId && <SkeletonPage />}

      {/* Error */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={() => loadData(selectedCompanyId)}
          >
            Sprobuj ponownie
          </ActionButton>
        </motion.div>
      )}

      {/* Data */}
      {!loading && !error && selectedCompanyId && (
        <>
          {/* Stats cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <StatCard
                label="Produkty razem"
                value={stats.orderCount ?? products.length}
                icon={ShoppingBag}
                iconColor="text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
              />
              <StatCard
                label="Laczna wartosc"
                value={formatCurrency(stats.totalValue)}
                icon={DollarSign}
                iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
              <StatCard
                label="Srednia ocena"
                value={stats.averageRating != null ? `${stats.averageRating.toFixed(1)}/5` : '-'}
                icon={Star}
                iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
              />
              <StatCard
                label="Srednia wartosc"
                value={formatCurrency(stats.averageValue)}
                icon={TrendingUp}
                iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
              />
            </motion.div>
          )}

          {/* Table or EmptyState */}
          {filteredProducts.length === 0 ? (
            products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Brak produktow"
                description="Ta firma nie posiada jeszcze zadnych produktow ani uslug"
                action={
                  <ActionButton icon={Plus} onClick={() => setShowForm(true)}>
                    Dodaj pierwszy produkt
                  </ActionButton>
                }
              />
            ) : (
              <EmptyState
                icon={Package}
                title="Brak wynikow"
                description="Zmien kryteria wyszukiwania, aby znalezc produkty"
              />
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <DataTable
                columns={columns}
                data={filteredProducts}
                storageKey="client-products"
                pageSize={20}
                emptyMessage="Brak produktow"
              />
            </motion.div>
          )}
        </>
      )}

      {/* ─── Create Form Modal ──────────────────────────────────────────── */}
      <FormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nowy produkt klienta"
        subtitle="Dodaj nowy produkt lub usluge do portfela firmy"
        position="right"
        footer={
          <>
            <ActionButton
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Anuluj
            </ActionButton>
            <ActionButton
              icon={Plus}
              loading={formLoading}
              onClick={(e: any) => handleCreate(e)}
            >
              Dodaj produkt
            </ActionButton>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Type */}
          <div>
            <label className={labelClass}>Typ</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputClass}
            >
              <option value="PRODUCT">Produkt</option>
              <option value="SERVICE">Usluga</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ilosc</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cena jednostkowa</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className={labelClass}>Waluta</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={inputClass}
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data rozpoczecia</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Data odnowienia</label>
              <input
                type="date"
                value={form.renewalDate}
                onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Koniec umowy</label>
            <input
              type="date"
              value={form.contractEndDate}
              onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Auto Renew */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoRenew}
              onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Automatyczne odnowienie</span>
          </label>

          {/* Satisfaction Score */}
          <div>
            <label className={labelClass}>Ocena satysfakcji (1-5)</label>
            <select
              value={form.satisfactionScore}
              onChange={(e) => setForm({ ...form, satisfactionScore: e.target.value })}
              className={inputClass}
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
            <label className={labelClass}>Poziom uzytkowania</label>
            <select
              value={form.usageLevel}
              onChange={(e) => setForm({ ...form, usageLevel: e.target.value })}
              className={inputClass}
            >
              {USAGE_LEVELS.map((l) => (
                <option key={l} value={l}>{USAGE_LABELS[l]}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notatki</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Dodatkowe informacje..."
            />
          </div>
        </form>
      </FormModal>
    </PageShell>
  );
}
