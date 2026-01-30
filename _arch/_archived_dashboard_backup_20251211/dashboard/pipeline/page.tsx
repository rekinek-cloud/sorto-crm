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
import {
  FunnelIcon,
  ChartBarIcon,
  Squares2X2Icon,
  TableCellsIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

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
      toast.error('Failed to load pipeline data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async (data: any) => {
    try {
      const newDeal = await dealsApi.createDeal(data);
      setDeals(prev => [newDeal, ...prev]);
      setIsFormOpen(false);
      toast.success('Deal created successfully');
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
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
      toast.success('Deal updated successfully');
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast.error('Failed to update deal');
      throw error;
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await dealsApi.deleteDeal(id);
      setDeals(prev => prev.filter(deal => deal.id !== id));
      toast.success('Deal deleted successfully');
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage your deals and track sales performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Pipeline Summary */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{formatCurrency(totalPipelineValue)}</div>
              <div className="text-gray-600">Pipeline Value</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{formatCurrency(wonValue)}</div>
              <div className="text-gray-600">Won Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary-600">{deals.length}</div>
              <div className="text-gray-600">Total Deals</div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="w-4 h-4 mr-2" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'analytics' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>

          {/* Add Deal Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Deal
          </button>
        </div>
      </div>

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
    </motion.div>
  );
}