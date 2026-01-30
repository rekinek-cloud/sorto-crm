'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface Deal {
  id: string;
  title: string;
  value?: number;
  currency: string;
  stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  description?: string;
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  probability: number;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { 
    id: 'PROSPECT', 
    name: 'Prospect', 
    color: '#6B7280', 
    bgColor: '#F9FAFB',
    probability: 10 
  },
  { 
    id: 'QUALIFIED', 
    name: 'Qualified', 
    color: '#3B82F6', 
    bgColor: '#EFF6FF',
    probability: 25 
  },
  { 
    id: 'PROPOSAL', 
    name: 'Proposal', 
    color: '#F59E0B', 
    bgColor: '#FFFBEB',
    probability: 50 
  },
  { 
    id: 'NEGOTIATION', 
    name: 'Negotiation', 
    color: '#F97316', 
    bgColor: '#FFF7ED',
    probability: 75 
  },
  { 
    id: 'CLOSED_WON', 
    name: 'Won', 
    color: '#10B981', 
    bgColor: '#ECFDF5',
    probability: 100 
  },
  { 
    id: 'CLOSED_LOST', 
    name: 'Lost', 
    color: '#EF4444', 
    bgColor: '#FEF2F2',
    probability: 0 
  }
];

export default function DealsKanbanPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !Cookies.get('access_token'))) {
      window.location.href = '/auth/login/';
    }
  }, [isLoading, isAuthenticated]);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [pipelineStats, setPipelineStats] = useState<Record<string, { count: number; value: number; weightedValue: number }>>({});

  useEffect(() => {
    loadDeals();
  }, [searchTerm]);

  const loadDeals = async () => {
    if (!isAuthenticated || !Cookies.get('access_token')) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.get('/deals', {
        params: {
          search: searchTerm || undefined,
          limit: 500
        }
      });
      
      setDeals(response.data.deals || []);
      calculatePipelineStats(response.data.deals || []);
    } catch (error: any) {
      console.error('Error loading deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const calculatePipelineStats = (dealsList: Deal[]) => {
    const stats: Record<string, { count: number; value: number; weightedValue: number }> = {};
    
    PIPELINE_STAGES.forEach(stage => {
      const stageDeals = dealsList.filter(deal => deal.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const weightedValue = totalValue * (stage.probability / 100);
      
      stats[stage.id] = {
        count: stageDeals.length,
        value: totalValue,
        weightedValue: weightedValue
      };
    });
    
    setPipelineStats(stats);
  };

  const handleUpdateDealStage = async (dealId: string, newStage: string) => {
    try {
      const updateData: any = { stage: newStage };
      
      // Auto-set close date for closed deals
      if (newStage === 'CLOSED_WON' || newStage === 'CLOSED_LOST') {
        updateData.actualCloseDate = new Date().toISOString();
      }
      
      await apiClient.put(`/deals/${dealId}`, updateData);
      toast.success('Deal stage updated');
      await loadDeals();
    } catch (error: any) {
      console.error('Error updating deal stage:', error);
      toast.error('Failed to update deal stage');
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedDeal) return;

    // Prevent moving closed deals
    if (draggedDeal.stage === 'CLOSED_WON' || draggedDeal.stage === 'CLOSED_LOST') {
      toast.error('Closed deals cannot be moved');
      setDraggedDeal(null);
      return;
    }

    if (draggedDeal.stage !== targetStage) {
      await handleUpdateDealStage(draggedDeal.id, targetStage);
    }
    setDraggedDeal(null);
  };

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDueDate = (date?: string) => {
    if (!date) return null;
    const dueDate = new Date(date);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 text-xs">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 text-xs">Today</span>;
    } else if (diffDays <= 7) {
      return <span className="text-yellow-600 text-xs">{diffDays}d</span>;
    }
    return null;
  };

  const DealCard = ({ deal }: { deal: Deal }) => (
    <div
      draggable={deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST'}
      onDragStart={(e) => handleDragStart(e, deal)}
      className={`p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-3 border-l-4 ${
        deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST' 
          ? 'cursor-default opacity-75' 
          : 'cursor-move'
      }`}
      style={{ 
        backgroundColor: 'white',
        borderLeftColor: PIPELINE_STAGES.find(s => s.id === deal.stage)?.color || '#6B7280'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">{deal.title}</h4>
        <div className="flex items-center space-x-1">
          {deal.value && (
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(deal.value)}
            </span>
          )}
          {formatDueDate(deal.expectedCloseDate)}
        </div>
      </div>
      
      {deal.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {deal.company && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">{deal.company.name}</span>
          )}
          {deal.contact && (
            <span className="text-gray-600">{deal.contact.firstName} {deal.contact.lastName}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <span 
            className="px-1.5 py-0.5 rounded text-xs font-medium"
            style={{ 
              backgroundColor: `${PIPELINE_STAGES.find(s => s.id === deal.stage)?.color}20`,
              color: PIPELINE_STAGES.find(s => s.id === deal.stage)?.color 
            }}
          >
            {deal.probability}%
          </span>
          <button
            onClick={() => router.push(`/crm/dashboard/deals/${deal.id}/edit`)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalPipelineValue = Object.values(pipelineStats).reduce((sum, stat) => sum + stat.value, 0);
  const totalWeightedValue = Object.values(pipelineStats).reduce((sum, stat) => sum + stat.weightedValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage deals through your sales process</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/deals')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            List View
          </button>
          <button 
            onClick={() => router.push('/dashboard/deals/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Add Deal
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{deals.length}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPipelineValue)}</div>
            <div className="text-sm text-gray-600">Pipeline Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalWeightedValue)}</div>
            <div className="text-sm text-gray-600">Weighted Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalPipelineValue > 0 ? Math.round((totalWeightedValue / totalPipelineValue) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg. Probability</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          const stageStats = pipelineStats[stage.id] || { count: 0, value: 0, weightedValue: 0 };
          
          return (
            <div
              key={stage.id}
              className="rounded-lg shadow-sm border-2 border-dashed border-gray-200 min-h-[500px]"
              style={{ backgroundColor: stage.bgColor }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div 
                className="p-4 border-b border-gray-200"
                style={{ backgroundColor: `${stage.color}10` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{stage.name}</h3>
                  <span 
                    className="text-xs font-medium px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stageStats.count}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium">{formatCurrency(stageStats.value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weighted:</span>
                    <span className="font-medium text-green-600">{formatCurrency(stageStats.weightedValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probability:</span>
                    <span className="font-medium">{stage.probability}%</span>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-3">
                {stageDeals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-2xl mb-2">💼</div>
                    <p className="text-xs">Drop deals here</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {deals.length === 0 && (
        <div className="bg-white rounded-lg shadow text-center py-12">
          <div className="text-6xl mb-4">💼</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deals</h3>
          <p className="text-gray-600">Create your first deal to see it on the pipeline</p>
        </div>
      )}
    </div>
  );
}