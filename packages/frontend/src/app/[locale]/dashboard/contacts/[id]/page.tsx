'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Contact, Company, Deal } from '@/types/crm';
import { Task } from '@/types/streams';
import { contactsApi } from '@/lib/api/contacts';
import { dealsApi } from '@/lib/api/deals';
import { tasksApi } from '@/lib/api/tasks';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import ContactForm from '@/components/crm/ContactForm';
import DealForm from '@/components/crm/DealForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import NotesSection from '@/components/shared/NotesSection';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Link,
  Pencil,
  Plus,
  Briefcase,
  Calendar
} from 'lucide-react';

interface ContactWithRelations extends Contact {
  deals?: Deal[];
  tasks?: Task[];
}

export default function ContactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);

  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactsApi.getContact(contactId);
      setContact(response);
    } catch (err: any) {
      console.error('Error loading contact:', err);
      setError('Failed to load contact details');
      toast.error('Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'INACTIVE': return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
      case 'LEAD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400';
    }
  };

  const getDealStageColor = (stage: string) => {
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

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (error || !contact) {
    return (
      <PageShell>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <User className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Contact not found</h3>
            <p className="text-slate-600 dark:text-slate-400">{error || 'The contact you are looking for does not exist.'}</p>
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

  const totalDealsValue = contact.deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  const activeDeals = contact.deals?.filter(deal => !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) || [];
  const wonDeals = contact.deals?.filter(deal => deal.stage === 'CLOSED_WON') || [];

  return (
    <PageShell>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={contact.position || 'Contact Details'}
        icon={User}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Contacts', href: '/dashboard/contacts' }, { label: `${contact.firstName} ${contact.lastName}` }]}
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
              onClick={() => setShowContactForm(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Edit contact"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">
                  {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(contact.status || 'ACTIVE')}`}>
                    {(contact.status || 'ACTIVE').toLowerCase()}
                  </span>
                </div>

                {contact.position && (
                  <p className="text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {contact.position}
                    {contact.department && ` - ${contact.department}`}
                  </p>
                )}

                {contact.assignedCompany && (
                  <p className="text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    <a
                      href={`/dashboard/companies/${contact.assignedCompany.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {contact.assignedCompany.name}
                    </a>
                  </p>
                )}

                {contact.notes && (
                  <p className="text-slate-700 dark:text-slate-300 mb-4">{contact.notes}</p>
                )}

                {/* Contact Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  {contact.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${contact.phone}`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(contact.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {contact.socialLinks && (
                  <div className="flex items-center gap-3 mt-3">
                    {contact.socialLinks.linkedin && (
                      <a
                        href={contact.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        LinkedIn
                      </a>
                    )}
                    {contact.socialLinks.twitter && (
                      <a
                        href={contact.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-500 text-sm"
                      >
                        Twitter
                      </a>
                    )}
                    {contact.socialLinks.facebook && (
                      <a
                        href={contact.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                      >
                        Facebook
                      </a>
                    )}
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
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Deals</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{contact.deals?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Deals</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeDeals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalDealsValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Won Deals</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{wonDeals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deals Section */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Deals ({contact.deals?.length || 0})
                </h2>
                <button
                  onClick={() => setShowDealForm(true)}
                  className="btn btn-sm btn-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Deal
                </button>
              </div>
            </div>

            <div className="p-6">
              {contact.deals && contact.deals.length > 0 ? (
                <div className="space-y-4">
                  {contact.deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            <a
                              href={`/dashboard/deals/${deal.id}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              {deal.title}
                            </a>
                          </h4>
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(deal.value)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDealStageColor(deal.stage)}`}>
                            {deal.stage.toLowerCase()}
                          </span>
                          {deal.probability !== undefined && (
                            <span className="text-slate-500 dark:text-slate-400">{deal.probability}% probability</span>
                          )}
                          {deal.expectedCloseDate && (
                            <span className="text-slate-500 dark:text-slate-400">
                              Expected: {formatDate(deal.expectedCloseDate)}
                            </span>
                          )}
                        </div>
                        {deal.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{deal.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p>No deals for this contact</p>
                  <button
                    onClick={() => setShowDealForm(true)}
                    className="mt-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                  >
                    Create the first deal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Tasks ({contact.tasks?.length || 0})
                </h2>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={async () => {
                    const title = prompt('Task title:');
                    if (!title?.trim()) return;
                    try {
                      await tasksApi.createTask({ title: title.trim(), contactId });
                      toast.success('Task created');
                      await loadContact();
                    } catch (err: any) {
                      toast.error('Failed to create task');
                      console.error('Error creating task:', err);
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </button>
              </div>
            </div>

            <div className="p-6">
              {contact.tasks && contact.tasks.length > 0 ? (
                <div className="space-y-3">
                  {contact.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{task.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{task.status}</span>
                          {task.priority && <span className="text-xs text-slate-500 dark:text-slate-400">{task.priority}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p>No tasks yet</p>
                  <p className="text-sm">Track follow-ups and activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <NotesSection entityType="CONTACT" entityId={contactId} />
        </div>

        {/* Communication Panel */}
        <CommunicationPanel
          companyId={contact.assignedCompany?.id}
          contactId={contact.id}
          contacts={[{
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone
          }]}
          onCommunicationSent={loadContact}
        />
      </div>

      {/* Graph Modal */}
      {showGraphModal && (
        <GraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          entityId={contact.id}
          entityType="contact"
          entityName={`${contact.firstName} ${contact.lastName}`}
        />
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-500/75 dark:bg-slate-900/80" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
              <ContactForm
                contact={contact}
                companies={[]}
                onSubmit={async (data) => {
                  console.log('Contact data:', data);
                  setShowContactForm(false);
                  await loadContact();
                }}
                onCancel={() => {
                  setShowContactForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Deal Form Modal */}
      {showDealForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-500/75 dark:bg-slate-900/80" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
              <DealForm
                companies={[]}
                contacts={[contact]}
                onSubmit={async (data) => {
                  try {
                    await dealsApi.createDeal({ ...data, contactId: contact.id });
                    toast.success('Deal utworzony');
                    setShowDealForm(false);
                    await loadContact();
                  } catch (error: any) {
                    toast.error('Nie udalo sie utworzyc deala');
                    console.error('Error creating deal:', error);
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
