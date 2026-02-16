'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Deal, Company, Contact } from '@/types/crm';
import { User } from '@/types/streams';
import { dealsApi } from '@/lib/api/deals';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import DealForm from '@/components/crm/DealForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import NotesSection from '@/components/shared/NotesSection';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  DollarSign,
  Building2,
  User as UserIcon,
  Calendar,
  BarChart3,
  Clock,
  Link,
  Pencil,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

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
      case 'PROSPECT': return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
      case 'QUALIFIED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PROPOSAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'CLOSED_WON': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CLOSED_LOST': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'PROSPECT': return <Clock className="w-5 h-5" />;
      case 'QUALIFIED': return <Play className="w-5 h-5" />;
      case 'PROPOSAL': return <BarChart3 className="w-5 h-5" />;
      case 'NEGOTIATION': return <AlertTriangle className="w-5 h-5" />;
      case 'CLOSED_WON': return <CheckCircle className="w-5 h-5" />;
      case 'CLOSED_LOST': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-slate-500 dark:text-slate-400';
    if (probability >= 75) return 'text-green-600 dark:text-green-400';
    if (probability >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (probability >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
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
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (error || !deal) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <DollarSign className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Deal not found</h3>
            <p className="text-slate-600 dark:text-slate-400">{error || 'The deal you are looking for does not exist.'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </PageShell>
    );
  }

  const expectedValue = deal.value && deal.probability ? (deal.value * deal.probability / 100) : 0;

  return (
    <PageShell>
      <PageHeader
        title={deal.title}
        subtitle={`${deal.stage.toLowerCase().replace('_', ' ')} - ${formatCurrency(deal.value)}`}
        icon={DollarSign}
        iconColor="text-green-600"
        breadcrumbs={[{ label: 'Deals', href: '/dashboard/deals' }, { label: deal.title }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGraphModal(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Zobacz powiazania"
            >
              <Link className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDealForm(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Edit deal"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center ${getStageColor(deal.stage)}`}>
                  {getStageIcon(deal.stage)}
                  <span className="ml-1">{deal.stage.toLowerCase().replace('_', ' ')}</span>
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-3">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(deal.value)}
                </div>
                {deal.probability !== undefined && (
                  <div className={`text-lg font-semibold ${getProbabilityColor(deal.probability)}`}>
                    {deal.probability}% probability
                  </div>
                )}
                {expectedValue > 0 && (
                  <div className="text-lg text-slate-600 dark:text-slate-400">
                    Expected: {formatCurrency(expectedValue)}
                  </div>
                )}
              </div>

              {deal.description && (
                <p className="text-slate-700 dark:text-slate-300 mb-4">{deal.description}</p>
              )}

              {/* Key Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {deal.company && (
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-4 h-4" />
                    <a
                      href={`/dashboard/companies/${deal.company.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
                    <Calendar className="w-4 h-4" />
                    <span className={isOverdue(deal.expectedCloseDate) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      Expected: {formatDate(deal.expectedCloseDate)}
                      {isOverdue(deal.expectedCloseDate) && ' (Overdue)'}
                    </span>
                  </div>
                )}
                {deal.actualCloseDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Closed: {formatDate(deal.actualCloseDate)}</span>
                  </div>
                )}
                {deal.createdAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {formatDate(deal.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deal Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(deal.value)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Probability</p>
                <p className={`text-2xl font-bold ${getProbabilityColor(deal.probability)}`}>
                  {deal.probability || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expected Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(expectedValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Days to Close</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
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
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Deal Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Currency</label>
                <p className="text-slate-900 dark:text-slate-100">{deal.currency || 'USD'}</p>
              </div>

              {deal.tags && deal.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {deal.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {deal.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Notes</label>
                  <p className="text-slate-900 dark:text-slate-100 mt-1">{deal.notes}</p>
                </div>
              )}

              {deal.lostReason && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Lost Reason</label>
                  <p className="text-red-600 dark:text-red-400 mt-1">{deal.lostReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline / Activities */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Deal Timeline</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {deal.createdAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Deal Created</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(deal.createdAt)}</p>
                    </div>
                  </div>
                )}

                {deal.actualCloseDate && (
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      deal.stage === 'CLOSED_WON' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {deal.stage === 'CLOSED_WON' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        Deal {deal.stage === 'CLOSED_WON' ? 'Won' : 'Lost'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(deal.actualCloseDate)}</p>
                    </div>
                  </div>
                )}

                {!deal.actualCloseDate && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p>Deal timeline coming soon</p>
                    <p className="text-sm">Track stage changes and activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <NotesSection entityType="DEAL" entityId={dealId} />
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
      </div>

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
            <div className="fixed inset-0 transition-opacity bg-slate-500/75 dark:bg-slate-900/80" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
              <DealForm
                deal={deal}
                companies={[]}
                contacts={[]}
                onSubmit={async (data) => {
                  try {
                    await dealsApi.updateDeal(deal.id, data);
                    toast.success('Deal zaktualizowany pomyslnie');
                    setShowDealForm(false);
                    await loadDeal();
                  } catch (error: any) {
                    console.error('Error updating deal:', error);
                    toast.error(error.message || 'Blad aktualizacji deala');
                  }
                }}
                onCancel={() => {
                  setShowDealForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
