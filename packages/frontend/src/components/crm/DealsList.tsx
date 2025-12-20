'use client';

import React, { useState, useEffect } from 'react';
import { Deal, Company, Contact } from '@/types/crm';
import DealForm from './DealForm';
import DealItem from './DealItem';
import { dealsApi } from '@/lib/api/deals';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { toast } from 'react-hot-toast';

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');

  // Fetch data
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
        dealsApi.getPipeline()
      ]);
      
      setDeals(dealsResponse.deals);
      setCompanies(companiesResponse.companies);
      setContacts(contactsResponse.contacts);
      setPipeline(pipelineResponse);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load deals');
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
      
      // Refresh pipeline data
      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
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
      setEditingDeal(null);
      setIsFormOpen(false);
      toast.success('Deal updated successfully');
      
      // Refresh pipeline data
      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
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
      
      // Refresh pipeline data
      const pipelineResponse = await dealsApi.getPipeline();
      setPipeline(pipelineResponse);
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
    setEditingDeal(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return 'bg-gray-100 text-gray-800';
      case 'QUALIFIED': return 'bg-blue-100 text-blue-800';
      case 'PROPOSAL': return 'bg-yellow-100 text-yellow-800';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-800';
      case 'CLOSED_WON': return 'bg-green-100 text-green-800';
      case 'CLOSED_LOST': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600">Track your sales pipeline and revenue opportunities</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'pipeline' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pipeline
            </button>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Deal
          </button>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        /* Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipeline.map((stage) => (
            <div key={stage.stage} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{stage.stage}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(stage.stage)}`}>
                  {stage.count}
                </span>
              </div>
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {formatCurrency(stage.value)}
              </div>
              <div className="text-sm text-gray-500">
                {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="input w-full"
              >
                <option value="">All stages</option>
                <option value="PROSPECT">Prospect</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Won</option>
                <option value="CLOSED_LOST">Lost</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Deals</h3>
              <p className="text-3xl font-bold text-primary-600">{deals.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Deals</h3>
              <p className="text-3xl font-bold text-blue-600">
                {deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Won Deals</h3>
              <p className="text-3xl font-bold text-success-600">
                {deals.filter(d => d.stage === 'CLOSED_WON').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Value</h3>
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(deals.reduce((sum, deal) => sum + (deal.value || 0), 0))}
              </p>
            </div>
          </div>

          {/* Deals List */}
          <div className="bg-white rounded-lg shadow">
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedStage 
                    ? 'Try adjusting your filters' 
                    : 'Start by creating your first deal'
                  }
                </p>
                {!searchTerm && !selectedStage && (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="btn btn-primary"
                  >
                    Create First Deal
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {deals.map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    companies={companies}
                    contacts={contacts}
                    onEdit={handleEditDeal}
                    onDelete={handleDeleteDeal}
                  />
                ))}
              </div>
            )}
          </div>
        </>
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
    </div>
  );
}