'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Company, Contact, Deal } from '@/types/crm';
import { companiesApi } from '@/lib/api/companies';
import { contactsApi } from '@/lib/api/contacts';
import { dealsApi } from '@/lib/api/deals';
import { toast } from 'react-hot-toast';
import { GraphModal } from '@/components/graph/GraphModal';
import ContactForm from '@/components/crm/ContactForm';
import DealForm from '@/components/crm/DealForm';
import CompanyForm from '@/components/crm/CompanyForm';
import { CommunicationPanel } from '@/components/crm/CommunicationPanel';
import { 
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  FolderIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface CompanyWithRelations extends Company {
  assignedContacts?: Contact[];
  deals?: Deal[];
  relatedProjects?: Array<{
    id: string;
    name: string;
    status: string;
    progress?: number;
    endDate?: string;
  }>;
  relatedTasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority?: string;
    dueDate?: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    endDate?: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority?: string;
    dueDate?: string;
  }>;
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();

  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companiesApi.getCompany(companyId);
      setCompany(response);
    } catch (err: any) {
      console.error('Error loading company:', err);
      setError('Failed to load company details');
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CUSTOMER': return 'bg-green-100 text-green-800';
      case 'PROSPECT': return 'bg-blue-100 text-blue-800';
      case 'PARTNER': return 'bg-purple-100 text-purple-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSizeColor = (size?: string) => {
    if (!size) return 'bg-gray-100 text-gray-800';
    switch (size) {
      case 'STARTUP': return 'bg-purple-100 text-purple-800';
      case 'SMALL': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LARGE': return 'bg-orange-100 text-orange-800';
      case 'ENTERPRISE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContactStatusColor = (status: string) => {
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

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Company not found</h3>
          <p className="text-gray-600">{error || 'The company you are looking for does not exist.'}</p>
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

  const totalDealsValue = company.deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  const activeDeals = company.deals?.filter(deal => !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) || [];
  const wonDeals = company.deals?.filter(deal => deal.stage === 'CLOSED_WON') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(company.status)}`}>
                  {company.status.toLowerCase()}
                </span>
                {company.size && (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSizeColor(company.size)}`}>
                    {company.size.toLowerCase()}
                  </span>
                )}
              </div>
              
              {company.industry && (
                <p className="text-gray-600 mb-2">{company.industry}</p>
              )}
              
              {company.description && (
                <p className="text-gray-700">{company.description}</p>
              )}

              {/* Contact Information */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                {company.email && (
                  <div className="flex items-center space-x-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    <a href={`mailto:${company.email}`} className="text-primary-600 hover:text-primary-700">
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center space-x-1">
                    <PhoneIcon className="w-4 h-4" />
                    <a href={`tel:${company.phone}`} className="text-primary-600 hover:text-primary-700">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center space-x-1">
                    <GlobeAltIcon className="w-4 h-4" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                      Website
                    </a>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{company.address}</span>
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
              onClick={() => setShowCompanyForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit company"
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
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{company.assignedContacts?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900">{company.deals?.length || 0}</p>
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
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Przegląd
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 mr-1 inline" />
              Kontakty ({company.assignedContacts?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CurrencyDollarIcon className="w-4 h-4 mr-1 inline" />
              Deale ({company.deals?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FolderIcon className="w-4 h-4 mr-1 inline" />
              Projekty ({company.projects?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="w-4 h-4 mr-1 inline" />
              Zadania ({company.tasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('communication')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'communication'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <EnvelopeIcon className="w-4 h-4 mr-1 inline" />
              Komunikacja
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Szybki podgląd</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-6 h-6 text-blue-500" />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">Kontakty</p>
                        <p className="text-xl font-bold">{company.assignedContacts?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">Deale</p>
                        <p className="text-xl font-bold">{company.deals?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FolderIcon className="w-6 h-6 text-purple-500" />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">Projekty</p>
                        <p className="text-xl font-bold">{company.projects?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="w-6 h-6 text-orange-500" />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">Zadania</p>
                        <p className="text-xl font-bold">{company.tasks?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ostatnia aktywność</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Brak ostatniej aktywności</p>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Kontakty ({company.assignedContacts?.length || 0})</h3>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="btn btn-sm btn-primary"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Dodaj kontakt
                </button>
              </div>
              
              {company.assignedContacts && company.assignedContacts.length > 0 ? (
                <div className="space-y-4">
                  {company.assignedContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            <a 
                              href={`/crm/dashboard/contacts/${contact.id}`}
                              className="text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {contact.firstName} {contact.lastName}
                            </a>
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            {contact.position && <span>{contact.position}</span>}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700">
                                {contact.email}
                              </a>
                            )}
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getContactStatusColor(contact.status || 'ACTIVE')}`}>
                            {contact.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setShowContactForm(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">Brak kontaktów</h4>
                  <p className="mb-4">Nie ma jeszcze kontaktów przypisanych do tej firmy</p>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="btn btn-primary"
                  >
                    Dodaj pierwszy kontakt
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Deals Tab */}
          {activeTab === 'deals' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Deale ({company.deals?.length || 0})</h3>
                <button
                  onClick={() => setShowDealForm(true)}
                  className="btn btn-sm btn-primary"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Dodaj deal
                </button>
              </div>
              
              {company.deals && company.deals.length > 0 ? (
                <div className="space-y-4">
                  {company.deals.map((deal) => (
                    <div key={deal.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          <a 
                            href={`/crm/dashboard/deals/${deal.id}`}
                            className="text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            {deal.title}
                          </a>
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(deal.value)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingDeal(deal);
                              setShowDealForm(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDealStageColor(deal.stage)}`}>
                          {deal.stage.toLowerCase()}
                        </span>
                        {deal.probability !== undefined && (
                          <span className="text-gray-500">{deal.probability}% prawdopodobieństwo</span>
                        )}
                        {deal.expectedCloseDate && (
                          <span className="text-gray-500">
                            Przewidywane: {formatDate(deal.expectedCloseDate)}
                          </span>
                        )}
                      </div>
                      {deal.description && (
                        <p className="text-sm text-gray-600">{deal.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CurrencyDollarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">Brak deali</h4>
                  <p className="mb-4">Nie ma jeszcze deali dla tej firmy</p>
                  <button
                    onClick={() => setShowDealForm(true)}
                    className="btn btn-primary"
                  >
                    Utwórz pierwszy deal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Powiązane projekty ({company.projects?.length || 0})</h3>
              
              {company.projects && company.projects.length > 0 ? (
                <div className="space-y-4">
                  {company.projects.map((project) => (
                    <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            <a 
                              href={`/crm/dashboard/projects/${project.id}`}
                              className="text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {project.name}
                            </a>
                          </h4>
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                              {project.status.toLowerCase()}
                            </span>
                            {project.endDate && (
                              <span className="text-gray-500">Termin: {formatDate(project.endDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">Brak projektów</h4>
                  <p className="mb-4">Nie ma projektów powiązanych z tą firmą</p>
                  <button className="btn btn-primary">
                    Utwórz pierwszy projekt
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Powiązane zadania ({company.tasks?.length || 0})</h3>
              
              {company.tasks && company.tasks.length > 0 ? (
                <div className="space-y-4">
                  {company.tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            <a 
                              href={`/crm/dashboard/tasks/${task.id}`}
                              className="text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {task.title}
                            </a>
                          </h4>
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getContactStatusColor(task.status)}`}>
                              {task.status.toLowerCase()}
                            </span>
                            {task.priority && (
                              <span className="text-gray-500">{task.priority} priorytet</span>
                            )}
                            {task.dueDate && (
                              <span className="text-gray-500">Termin: {formatDate(task.dueDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">Brak zadań</h4>
                  <p className="mb-4">Nie ma zadań powiązanych z tą firmą</p>
                  <button className="btn btn-primary">
                    Utwórz pierwsze zadanie
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Panel komunikacji</h3>
              <CommunicationPanel
                companyId={company.id}
                contacts={company.assignedContacts || []}
                onCommunicationSent={loadCompany}
              />
            </div>
          )}
        </div>
      </div>

      {/* Graph Modal */}
      {showGraphModal && (
        <GraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          entityId={company.id}
          entityType="company"
          entityName={company.name}
        />
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <ContactForm
                contact={editingContact}
                companies={[company]}
                onSubmit={async (data) => {
                  try {
                    if (editingContact) {
                      console.log('Contact update data:', data);
                    } else {
                      await contactsApi.createContact(data);
                      toast.success('Contact created successfully');
                    }
                    setShowContactForm(false);
                    setEditingContact(undefined);
                    await loadCompany();
                  } catch (error: any) {
                    toast.error('Failed to save contact');
                    console.error('Error saving contact:', error);
                  }
                }}
                onCancel={() => {
                  setShowContactForm(false);
                  setEditingContact(undefined);
                }}
                preSelectedCompanyId={company.id}
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
                deal={editingDeal}
                companies={[company]}
                contacts={company.assignedContacts || []}
                onSubmit={async (data) => {
                  try {
                    if (editingDeal) {
                      await dealsApi.updateDeal(editingDeal.id, data);
                      toast.success('Deal updated successfully');
                    } else {
                      await dealsApi.createDeal(data);
                      toast.success('Deal created successfully');
                    }
                    setShowDealForm(false);
                    setEditingDeal(undefined);
                    await loadCompany();
                  } catch (error: any) {
                    toast.error('Failed to save deal');
                    console.error('Error saving deal:', error);
                  }
                }}
                onCancel={() => {
                  setShowDealForm(false);
                  setEditingDeal(undefined);
                }}
                preSelectedCompanyId={company.id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Company Form Modal */}
      {showCompanyForm && company && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <CompanyForm
                company={company}
                onSubmit={async (data) => {
                  try {
                    await companiesApi.updateCompany(company.id, data);
                    toast.success('Company updated successfully');
                    setShowCompanyForm(false);
                    await loadCompany();
                  } catch (error: any) {
                    toast.error('Failed to update company');
                    console.error('Error updating company:', error);
                  }
                }}
                onCancel={() => {
                  setShowCompanyForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}