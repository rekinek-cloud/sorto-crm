'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, Plus, Users, UserCheck, Handshake, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Company, CompanyFilters } from '@/types/crm';
import { companiesApi } from '@/lib/api/companies';
import CompanyForm from './CompanyForm';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

// --- Status mapping ---
const STATUS_BADGE_MAP: Record<string, { variant: 'info' | 'success' | 'warning' | 'neutral'; label: string }> = {
  PROSPECT: { variant: 'info', label: 'Prospekt' },
  CUSTOMER: { variant: 'success', label: 'Klient' },
  PARTNER: { variant: 'warning', label: 'Partner' },
  INACTIVE: { variant: 'neutral', label: 'Nieaktywna' },
  ARCHIVED: { variant: 'neutral', label: 'Archiwum' },
};

// --- Date formatter ---
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '-';
  }
}

export default function CompaniesList() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [filters, setFilters] = useState<CompanyFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // ---- Data loading ----
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companiesApi.getCompanies(filters as any);
      setCompanies(response.companies);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Nie udalo sie zaladowac firm');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // ---- CRUD handlers ----
  const handleCreate = async (data: any) => {
    try {
      await companiesApi.createCompany(data);
      setShowForm(false);
      toast.success('Firma zostala utworzona');
      loadCompanies();
    } catch (err) {
      console.error('Error creating company:', err);
      throw err;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingCompany) return;
    try {
      await companiesApi.updateCompany(editingCompany.id, data);
      setEditingCompany(undefined);
      setShowForm(false);
      toast.success('Firma zostala zaktualizowana');
      loadCompanies();
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await companiesApi.deleteCompany(id);
      toast.success('Firma zostala usunieta');
      loadCompanies();
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('Nie udalo sie usunac firmy');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  // ---- Filter handlers ----
  const handleFilterChange = (newFilters: Partial<CompanyFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // ---- Stat counters ----
  const stats = useMemo(() => {
    const total = pagination.total;
    const customers = companies.filter(c => c.status === 'CUSTOMER').length;
    const prospects = companies.filter(c => c.status === 'PROSPECT').length;
    const partners = companies.filter(c => c.status === 'PARTNER').length;
    return { total, customers, prospects, partners };
  }, [companies, pagination.total]);

  // ---- FilterBar config ----
  const filterConfigs = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PROSPECT', label: 'Prospekt' },
        { value: 'CUSTOMER', label: 'Klient' },
        { value: 'PARTNER', label: 'Partner' },
        { value: 'INACTIVE', label: 'Nieaktywna' },
        { value: 'ARCHIVED', label: 'Archiwum' },
      ],
    },
    {
      key: 'size',
      label: 'Wielkosc',
      options: [
        { value: 'STARTUP', label: 'Startup' },
        { value: 'SMALL', label: 'Mala' },
        { value: 'MEDIUM', label: 'Srednia' },
        { value: 'LARGE', label: 'Duza' },
        { value: 'ENTERPRISE', label: 'Korporacja' },
      ],
    },
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'name:asc', label: 'Nazwa A-Z' },
    { value: 'name:desc', label: 'Nazwa Z-A' },
    { value: 'createdAt:desc', label: 'Najnowsze' },
    { value: 'createdAt:asc', label: 'Najstarsze' },
    { value: 'updatedAt:desc', label: 'Ostatnio zmienione' },
  ], []);

  const filterValues = useMemo(() => ({
    status: filters.status || 'all',
    size: filters.size || 'all',
  }), [filters.status, filters.size]);

  const handleFilterBarChange = useCallback((key: string, value: string) => {
    const actualValue = value === 'all' ? undefined : value;
    handleFilterChange({ [key]: actualValue });
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [string, 'asc' | 'desc'];
    handleFilterChange({ sortBy, sortOrder });
  }, []);

  const currentSortValue = `${filters.sortBy || 'name'}:${filters.sortOrder || 'asc'}`;

  // ---- DataTable columns ----
  const columns: Column<Company>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Nazwa',
      sortable: true,
      render: (value: any) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
      ),
    },
    {
      key: 'nip',
      label: 'NIP',
      sortable: false,
      render: (value: any) => value || '-',
    },
    {
      key: 'address',
      label: 'Miasto',
      sortable: false,
      render: (value: any) => {
        if (!value) return '-';
        // Extract city from address - typically the last meaningful part
        const parts = value.split(',').map((p: string) => p.trim());
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
      },
    },
    {
      key: 'industry',
      label: 'Branza',
      sortable: true,
      render: (value: any) => value || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any) => {
        const mapping = STATUS_BADGE_MAP[value] || { variant: 'neutral' as const, label: value };
        return <StatusBadge variant={mapping.variant} dot>{mapping.label}</StatusBadge>;
      },
    },
    {
      key: 'createdAt',
      label: 'Dodano',
      sortable: true,
      render: (value: any) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(value)}</span>
      ),
    },
  ], []);

  // ---- Row click ----
  const handleRowClick = useCallback((company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  }, [router]);

  // ---- Loading state ----
  if (loading && companies.length === 0) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Page header */}
      <PageHeader
        title="Firmy"
        subtitle={`Zarzadzaj firmami i relacjami biznesowymi`}
        icon={Building2}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Firmy' }]}
        actions={
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditingCompany(undefined);
              setShowForm(true);
            }}
          >
            Dodaj firme
          </ActionButton>
        }
      />

      {/* Stat cards row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          label="Total"
          value={stats.total}
          icon={Building2}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Klienci"
          value={stats.customers}
          icon={UserCheck}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Prospekty"
          value={stats.prospects}
          icon={Users}
          iconColor="text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <StatCard
          label="Partnerzy"
          value={stats.partners}
          icon={Handshake}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FilterBar
          search={filters.search || ''}
          onSearchChange={(value) => handleFilterChange({ search: value || undefined })}
          searchPlaceholder="Szukaj firm..."
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={handleFilterBarChange}
          sortOptions={sortOptions}
          sortValue={currentSortValue}
          onSortChange={handleSortChange}
        />
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Companies table or empty state */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {!loading && companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Brak firm"
            description="Zacznij od dodania pierwszej firmy do systemu."
            action={
              <ActionButton
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingCompany(undefined);
                  setShowForm(true);
                }}
              >
                Dodaj pierwsza firme
              </ActionButton>
            }
          />
        ) : (
          <DataTable<Company>
            columns={columns}
            data={companies}
            onRowClick={handleRowClick}
            storageKey="companies-list"
            pageSize={filters.limit || 20}
            emptyMessage="Brak firm do wyswietlenia"
            loading={loading}
          />
        )}
      </motion.div>

      {/* Server-side pagination (when using API pagination, not DataTable internal) */}
      {!loading && pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-between mt-4 text-sm"
        >
          <span className="text-slate-500 dark:text-slate-400">
            {((pagination.page - 1) * pagination.limit) + 1}
            {' - '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}
            {' z '}
            {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Poprzednia
            </ActionButton>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === pagination.pages ||
                Math.abs(page - pagination.page) <= 2
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 py-1 text-slate-400 dark:text-slate-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={
                      page === pagination.page
                        ? 'w-8 h-8 rounded-lg text-sm font-medium bg-blue-600 text-white'
                        : 'w-8 h-8 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                    }
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Nastepna
            </ActionButton>
          </div>
        </motion.div>
      )}

      {/* Company form modal */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSubmit={editingCompany ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingCompany(undefined);
          }}
        />
      )}
    </PageShell>
  );
}
