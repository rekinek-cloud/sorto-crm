'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Deal, Company, Contact } from '@/types/crm';
import { User } from '@/types/gtd';
import { dealsApi } from '@/lib/api/deals';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import DealForm from '@/components/crm/DealForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  LinkIcon,
  PencilIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DealWithRelations extends Deal {
  contact?: Contact;
  tags?: string[];
  lostReason?: string;
  company?: Company;
}

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);

  useEffect(() => {
    if (dealId) {
      loadDeal();
    }
  }, [dealId]);

  const loadDeal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dealsApi.getDeal(dealId);
      setDeal(response as DealWithRelations);
    } catch (err: any) {
      console.error('Error loading deal:', err);
      setError('Failed to load deal details');
      toast.error('Failed to load deal details');
    } finally {
      setLoading(false);
    }
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

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return <ClockIcon className="w-5 h-5" />;
      case 'QUALIFIED': return <PlayIcon className="w-5 h-5" />;
      case 'PROPOSAL': return <ChartBarIcon className="w-5 h-5" />;
      case 'NEGOTIATION': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'CLOSED_WON': return <CheckCircleIcon className="w-5 h-5" />;
      case 'CLOSED_LOST': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-500';
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Deal not found</h3>
          <p className="text-gray-600">{error || 'The deal you are looking for does not exist.'}</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const expectedValue = deal.value && deal.probability ? (deal.value * deal.probability / 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CurrencyDollarIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStageColor(deal.stage)}`}>
                  {getStageIcon(deal.stage)}
                  <span className="ml-1">{deal.stage.toLowerCase().replace('_', ' ')}</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(deal.value)}
                </div>
                {deal.probability !== undefined && (
                  <div className={`text-lg font-semibold ${getProbabilityColor(deal.probability)}`}>
                    {deal.probability}% probability
                  </div>
                )}
                {expectedValue > 0 && (
                  <div className="text-lg text-gray-600">
                    Expected: {formatCurrency(expectedValue)}
                  </div>
                )}
              </div>
              
              {deal.description && (
                <p className="text-gray-700 mb-4">{deal.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {deal.company && (
                  <div className="flex items-center space-x-1">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <a 
                      href={`/crm/dashboard/companies/${deal.company.id}`} 
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {deal.company.name}
                    </a>
                  </div>
                )}
                {deal.owner && (
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{deal.owner.firstName} {deal.owner.lastName}</span>
                  </div>
                )}
                {deal.expectedCloseDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className={isOverdue(deal.expectedCloseDate) ? 'text-red-600 font-medium' : ''}>
                      Expected: {formatDate(deal.expectedCloseDate)}
                      {isOverdue(deal.expectedCloseDate) && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {deal.actualCloseDate && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Closed: {formatDate(deal.actualCloseDate)}</span>
                  </div>
                )}
                {deal.createdAt && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created: {formatDate(deal.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGraphModal(true)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Zobacz powiązania"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDealForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit deal"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Deal Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(deal.value)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Probability</p>
              <p className={`text-2xl font-bold ${getProbabilityColor(deal.probability)}`}>
                {deal.probability || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expected Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(expectedValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Days to Close</p>
              <p className="text-2xl font-bold text-gray-900">
                {deal.expectedCloseDate 
                  ? Math.ceil((new Date(deal.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Details */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Deal Details</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Currency</label>
              <p className="text-gray-900">{deal.currency || 'USD'}</p>
            </div>
            
            {deal.tags && deal.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {deal.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {deal.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 mt-1">{deal.notes}</p>
              </div>
            )}
            
            {deal.lostReason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Lost Reason</label>
                <p className="text-red-600 mt-1">{deal.lostReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline / Activities - Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Deal Timeline</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {deal.createdAt && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Deal Created</p>
                    <p className="text-sm text-gray-500">{formatDate(deal.createdAt)}</p>
                  </div>
                </div>
              )}
              
              {deal.actualCloseDate && (
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    deal.stage === 'CLOSED_WON' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {deal.stage === 'CLOSED_WON' ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Deal {deal.stage === 'CLOSED_WON' ? 'Won' : 'Lost'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(deal.actualCloseDate)}</p>
                  </div>
                </div>
              )}
              
              {!deal.actualCloseDate && (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Deal timeline coming soon</p>
                  <p className="text-sm">Track stage changes and activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Communication Panel */}
      <CommunicationPanel
        companyId={deal.company?.id || deal.id}
        contacts={deal.contact ? [{
          id: deal.contact.id,
          firstName: deal.contact.firstName,
          lastName: deal.contact.lastName,
          email: deal.contact.email,
          phone: deal.contact.phone
        }] : []}
        onCommunicationSent={loadDeal}
      />

      {/* Graph Modal */}
      {showGraphModal && (
        <GraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          entityId={deal.id}
          entityType="deal"
          entityName={deal.title}
        />
      )}

      {/* Deal Form Modal */}
      {showDealForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <DealForm
                deal={deal}
                companies={[]}
                contacts={[]}
                onSubmit={async (data) => {
                  console.log('Deal data:', data);
                  setShowDealForm(false);
                  await loadDeal();
                }}
                onCancel={() => {
                  setShowDealForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}