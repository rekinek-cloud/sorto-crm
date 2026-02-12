'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Handshake,
  Plus,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Deal, Company, Contact } from '@/types/crm';
import { dealsApi } from '@/lib/api/deals';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { formatCurrency } from '@/lib/utils';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import DealForm from './DealForm';

// --- helpers ---

function getStageBadgeVariant(stage: string): 'info' | 'warning' | 'success' | 'error' | 'default' {
  switch (stage) {
    case 'LEAD':
    case 'QUALIFICATION':
    case 'PROSPECT':
    case 'QUALIFIED':
      return 'info';
    case 'PROPOSAL':
    case 'NEGOTIATION':
      return 'warning';
    case 'WON':
    case 'CLOSED_WON':
      return 'success';
    case 'LOST':
    case 'CLOSED_LOST':
      return 'error';
    default:
      return 'default';
  }
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    PROSPECT: 'Prospekt',
    QUALIFIED: 'Kwalifikacja',
    PROPOSAL: 'Oferta',
    NEGOTIATION: 'Negocjacja',
    CLOSED_WON: 'Wygrana',
    CLOSED_LOST: 'Przegrana',
  };
  return labels[stage] ?? stage;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// --- animation variants ---

const statsAnimation = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// --- component ---

export default function DealsList() {
  const router = useRouter();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Derived selected stage from filter values
  const selectedStage = filterValues.stage && filterValues.stage !== 'all' ? filterValues.stage : '';

  // --- data fetching (preserved) ---

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedStage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dealsResponse, companiesResponse, contactsResponse, pipelineResponse] = await Promise.all([
        dealsApi.getDeals({
          search: searchTerm,
          stage: (selectedStage || undefined) as any,
        }),
        companiesApi.getCompanies({ limit: 100 }),
        contactsApi.getContacts({ limit: 500 }),
        dealsApi.getPipeline(),
      ]);

      setDeals(dealsResponse.deals);
      setCompanies(companiesResponse.companies);
      setContacts(contactsResponse.contacts);
      setPipeline(pipelineResponse);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Nie udalo sie zaladowac transakcji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async (data: any) => {
    try {
      const newDeal = await dealsApi.createDeal(data);
      setDeals((prev) => [newDeal, ...prev]);
      setIsFormOpen(false);
      toast.success('Transakcja utworzona');

      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error('Nie udalo sie utworzyc transakcji');
      throw error;
    }
  };

  const handleUpdateDeal = async (data: any) => {
    if (!editingDeal) return;

    try {
      const updatedDeal = await dealsApi.updateDeal(editingDeal.id, data);
      setDeals((prev) => prev.map((deal) => (deal.id === editingDeal.id ? updatedDeal : deal)));
      setEditingDeal(null);
      setIsFormOpen(false);
      toast.success('Transakcja zaktualizowana');

      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error('Nie udalo sie zaktualizowac transakcji');
      throw error;
    }
  };

  const handleDeleteDeal = async (id: string) => {
    try {
      await dealsApi.deleteDeal(id);
      setDeals((prev) => prev.filter((deal) => deal.id !== id));
      toast.success('Transakcja usunieta');

      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error('Nie udalo sie usunac transakcji');
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDeal(null);
  };

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRowClick = useCallback(
    (deal: Deal) => {
      router.push(`/dashboard/deals/${deal.id}`);
    },
    [router],
  );

  // --- computed stats ---

  const stats = useMemo(() => {
    const total = deals.length;
    const won = deals.filter((d) => d.stage === 'CLOSED_WON').length;
    const inProgress = deals.filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length;
    const pipelineValue = deals
      .filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    return { total, won, inProgress, pipelineValue };
  }, [deals]);

  // --- filter config ---

  const stageFilterConfig = useMemo(
    () => [
      {
        key: 'stage',
        label: 'Wszystkie etapy',
        options: [
          { value: 'PROSPECT', label: 'Prospekt' },
          { value: 'QUALIFIED', label: 'Kwalifikacja' },
          { value: 'PROPOSAL', label: 'Oferta' },
          { value: 'NEGOTIATION', label: 'Negocjacja' },
          { value: 'CLOSED_WON', label: 'Wygrana' },
          { value: 'CLOSED_LOST', label: 'Przegrana' },
        ],
      },
    ],
    [],
  );

  // --- table columns ---

  const columns: Column<Deal>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Tytul',
        sortable: true,
        render: (_value: any, row: Deal) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.title}</span>
        ),
      },
      {
        key: 'company',
        label: 'Firma',
        sortable: true,
        getValue: (row: Deal) => row.company?.name ?? '',
        render: (_value: any, row: Deal) => (
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {row.company?.name ?? '-'}
          </span>
        ),
      },
      {
        key: 'value',
        label: 'Wartosc',
        sortable: true,
        getValue: (row: Deal) => row.value ?? 0,
        render: (_value: any, row: Deal) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {row.value != null ? formatCurrency(row.value, row.currency || 'PLN') : '-'}
          </span>
        ),
      },
      {
        key: 'stage',
        label: 'Etap',
        sortable: true,
        render: (_value: any, row: Deal) => (
          <StatusBadge variant={getStageBadgeVariant(row.stage)} dot>
            {getStageLabel(row.stage)}
          </StatusBadge>
        ),
      },
      {
        key: 'probability',
        label: 'Prawdopodobienstwo',
        sortable: true,
        render: (_value: any, row: Deal) => (
          <span className="text-slate-600 dark:text-slate-400">
            {row.probability != null ? `${row.probability}%` : '-'}
          </span>
        ),
      },
      {
        key: 'expectedCloseDate',
        label: 'Planowane zamkniecie',
        sortable: true,
        render: (_value: any, row: Deal) => (
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(row.expectedCloseDate)}
          </span>
        ),
      },
    ],
    [],
  );

  // --- loading state ---

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  // --- render ---

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Transakcje"
        subtitle="Zarzadzaj pipeline sprzedazy i monitoruj przychody"
        icon={Handshake}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Transakcje' }]}
        actions={
          <ActionButton icon={Plus} onClick={() => setIsFormOpen(true)}>
            Dodaj transakcje
          </ActionButton>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div custom={0} initial="hidden" animate="visible" variants={statsAnimation}>
          <StatCard
            label="Lacznie"
            value={stats.total}
            icon={Handshake}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
          />
        </motion.div>
        <motion.div custom={1} initial="hidden" animate="visible" variants={statsAnimation}>
          <StatCard
            label="Wygrane"
            value={stats.won}
            icon={TrendingUp}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
        </motion.div>
        <motion.div custom={2} initial="hidden" animate="visible" variants={statsAnimation}>
          <StatCard
            label="W toku"
            value={stats.inProgress}
            icon={Building2}
            iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </motion.div>
        <motion.div custom={3} initial="hidden" animate="visible" variants={statsAnimation}>
          <StatCard
            label="Wartosc pipeline"
            value={formatCurrency(stats.pipelineValue)}
            icon={DollarSign}
            iconColor="text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400"
          />
        </motion.div>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Szukaj transakcji..."
          filters={stageFilterConfig}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Deals table or empty state */}
      {deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Brak transakcji"
          description={
            searchTerm || selectedStage
              ? 'Sprobuj zmienic filtry wyszukiwania'
              : 'Zacznij od dodania pierwszej transakcji'
          }
          action={
            !searchTerm && !selectedStage ? (
              <ActionButton icon={Plus} onClick={() => setIsFormOpen(true)}>
                Dodaj pierwsza transakcje
              </ActionButton>
            ) : undefined
          }
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DataTable<Deal>
            columns={columns}
            data={deals}
            onRowClick={handleRowClick}
            storageKey="deals-list"
            pageSize={20}
            emptyMessage="Brak transakcji"
            stickyHeader
          />
        </motion.div>
      )}

      {/* Deal Form Modal */}
      {isFormOpen && (
        <DealForm
          deal={editingDeal || undefined}
          companies={companies}
          contacts={contacts}
          onSubmit={editingDeal ? handleUpdateDeal : handleCreateDeal}
          onCancel={handleCloseForm}
        />
      )}
    </PageShell>
  );
}
