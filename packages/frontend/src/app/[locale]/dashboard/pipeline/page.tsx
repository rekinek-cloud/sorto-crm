'use client';

import React, { useState, useEffect } from 'react';
import { Deal, Company, Contact } from '@/types/crm';
import DealForm from '@/components/crm/DealForm';
import PipelineBoard from '@/components/crm/PipelineBoard';
import PipelineAnalytics from '@/components/crm/PipelineAnalytics';
import { dealsApi } from '@/lib/api/deals';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Filter, BarChart3, LayoutGrid, Table, Plus } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'kanban' | 'analytics'>('kanban');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dealsResponse, companiesResponse, contactsResponse] = await Promise.all([
        dealsApi.getDeals({}),
        companiesApi.getCompanies({ limit: 100 }),
        contactsApi.getContacts({ limit: 500 })
      ]);

      setDeals(dealsResponse.deals);
      setCompanies(companiesResponse.companies);
      setContacts(contactsResponse.contacts);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Nie udało się załadować danych pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async (data: any) => {
    try {
      const newDeal = await dealsApi.createDeal(data);
      setDeals(prev => [newDeal, ...prev]);
      setIsFormOpen(false);
      toast.success('Transakcja utworzona pomyślnie');
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error('Nie udało się utworzyć transakcji');
      throw error;
    }
  };

  const handleUpdateDeal = async (data: any) => {
    if (!editingDeal) return;

    try {
      const updatedDeal = await dealsApi.updateDeal(editingDeal.id, data);
      setDeals(prev => prev.map(deal =>
        deal.id === editingDeal.id ? updatedDeal : deal
      ));
      setEditingDeal(undefined);
      setIsFormOpen(false);
      toast.success('Transakcja zaktualizowana pomyślnie');
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error('Nie udało się zaktualizować transakcji');
      throw error;
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę transakcję?')) return;

    try {
      await dealsApi.deleteDeal(id);
      setDeals(prev => prev.filter(deal => deal.id !== id));
      toast.success('Transakcja usunięta pomyślnie');
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error('Nie udało się usunąć transakcji');
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDeal(undefined);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalPipelineValue = deals
    .filter(deal => !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage))
    .reduce((sum, deal) => sum + (deal.value || 0), 0);

  const wonValue = deals
    .filter(deal => deal.stage === 'CLOSED_WON')
    .reduce((sum, deal) => sum + (deal.value || 0), 0);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Pipeline sprzedaży"
        subtitle="Zarządzaj transakcjami i śledź wyniki sprzedaży"
        icon={Filter}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-4">
            {/* Pipeline Summary */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalPipelineValue)}</div>
                <div className="text-slate-600 dark:text-slate-400">Wartość pipeline</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(wonValue)}</div>
                <div className="text-slate-600 dark:text-slate-400">Wygrane</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{deals.length}</div>
                <div className="text-slate-600 dark:text-slate-400">Transakcje</div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'analytics'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analityka
              </button>
            </div>

            {/* Add Deal Button */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nowa transakcja
            </button>
          </div>
        }
      />

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <PipelineBoard
          deals={deals}
          companies={companies}
          contacts={contacts}
          onEditDeal={handleEditDeal}
          onDeleteDeal={handleDeleteDeal}
          onDealsChange={setDeals}
        />
      ) : (
        <PipelineAnalytics deals={deals} />
      )}

      {/* Deal Form Modal */}
      {isFormOpen && (
        <DealForm
          deal={editingDeal}
          companies={companies}
          contacts={contacts}
          onSubmit={editingDeal ? handleUpdateDeal : handleCreateDeal}
          onCancel={handleCloseForm}
        />
      )}
    </PageShell>
  );
}
