'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Contact, Company, Deal } from '@/types/crm';
import { Task } from '@/types/gtd';
import { contactsApi } from '@/lib/api/contacts';
import { dealsApi } from '@/lib/api/deals';
import { tasksApi } from '@/lib/api/tasks';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import ContactForm from '@/components/crm/ContactForm';
import DealForm from '@/components/crm/DealForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  BriefcaseIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

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
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'LEAD': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDealStageColor = (stage: string) => {
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
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <UserIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Contact not found</h3>
          <p className="text-gray-600">{error || 'The contact you are looking for does not exist.'}</p>
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

  const totalDealsValue = contact.deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  const activeDeals = contact.deals?.filter(deal => !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) || [];
  const wonDeals = contact.deals?.filter(deal => deal.stage === 'CLOSED_WON') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(contact.status || 'ACTIVE')}`}>
                  {(contact.status || 'ACTIVE').toLowerCase()}
                </span>
              </div>
              
              {contact.position && (
                <p className="text-gray-600 mb-2 flex items-center">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />
                  {contact.position}
                  {contact.department && ` • ${contact.department}`}
                </p>
              )}
              
              {contact.assignedCompany && (
                <p className="text-gray-600 mb-2 flex items-center">
                  <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                  <a 
                    href={`/dashboard/companies/${contact.assignedCompany.id}`} 
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {contact.assignedCompany.name}
                  </a>
                </p>
              )}

              {contact.notes && (
                <p className="text-gray-700 mb-4">{contact.notes}</p>
              )}

              {/* Contact Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {contact.email && (
                  <div className="flex items-center space-x-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center space-x-1">
                    <PhoneIcon className="w-4 h-4" />
                    <a href={`tel:${contact.phone}`} className="text-primary-600 hover:text-primary-700">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.createdAt && (
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
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
                      className="text-blue-600 hover:text-blue-700 text-sm"
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
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              )}
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
              onClick={() => setShowContactForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit contact"
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
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{contact.deals?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900">{activeDeals.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDealsValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Won Deals</p>
              <p className="text-2xl font-bold text-gray-900">{wonDeals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Deals ({contact.deals?.length || 0})
              </h2>
              <button
                onClick={() => setShowDealForm(true)}
                className="btn btn-sm btn-primary"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {contact.deals && contact.deals.length > 0 ? (
              <div className="space-y-4">
                {contact.deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          <a 
                            href={`/dashboard/deals/${deal.id}`}
                            className="text-gray-900 hover:text-primary-600"
                          >
                            {deal.title}
                          </a>
                        </h4>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(deal.value)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDealStageColor(deal.stage)}`}>
                          {deal.stage.toLowerCase()}
                        </span>
                        {deal.probability !== undefined && (
                          <span className="text-gray-500">{deal.probability}% probability</span>
                        )}
                        {deal.expectedCloseDate && (
                          <span className="text-gray-500">
                            Expected: {formatDate(deal.expectedCloseDate)}
                          </span>
                        )}
                      </div>
                      {deal.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{deal.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No deals for this contact</p>
                <button
                  onClick={() => setShowDealForm(true)}
                  className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                >
                  Create the first deal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Tasks ({contact.tasks?.length || 0})
              </h2>
              <button
                className="btn btn-sm btn-primary"
                onClick={async () => {
                  const title = prompt('Task title:');
                  if (!title?.trim()) return;
                  try {
                    await tasksApi.createTask({ title: title.trim() });
                    toast.success('Task created');
                    await loadContact();
                  } catch (err: any) {
                    toast.error('Failed to create task');
                    console.error('Error creating task:', err);
                  }
                }}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Task
              </button>
            </div>
          </div>

          <div className="p-6">
            {contact.tasks && contact.tasks.length > 0 ? (
              <div className="space-y-3">
                {contact.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{task.status}</span>
                        {task.priority && <span className="text-xs text-gray-500">{task.priority}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks yet</p>
                <p className="text-sm">Track follow-ups and activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communication Panel */}
      <CommunicationPanel
        companyId={contact.assignedCompany?.id || contact.id}
        contacts={[{
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone
        }]}
        onCommunicationSent={loadContact}
      />

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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
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
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
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
                    toast.error('Nie udało się utworzyć deala');
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
    </div>
  );
}