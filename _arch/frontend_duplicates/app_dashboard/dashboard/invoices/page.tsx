'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description: string;
  items: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    description: '',
    amount: 0,
    dueDate: '',
    items: [] as Omit<InvoiceItem, 'id' | 'total'>[],
    taxRate: 23,
    discountRate: 0,
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadInvoices = async () => {
    setTimeout(() => {
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          number: 'INV-2024-001',
          clientName: 'TechCorp Sp. z o.o.',
          clientEmail: 'kontakt@techcorp.pl',
          clientAddress: 'ul. Technologiczna 15\n00-001 Warszawa',
          amount: 12300.00,
          currency: 'PLN',
          status: 'PAID',
          issueDate: new Date(Date.now() - 2592000000).toISOString(),
          dueDate: new Date(Date.now() - 1296000000).toISOString(),
          paidDate: new Date(Date.now() - 1000000000).toISOString(),
          description: 'Usługi programistyczne - rozwój aplikacji CRM',
          items: [
            {
              id: '1',
              description: 'Godziny programistyczne - Senior Developer',
              quantity: 80,
              unitPrice: 150,
              total: 12000
            },
            {
              id: '2',
              description: 'Konsultacje techniczne',
              quantity: 2,
              unitPrice: 150,
              total: 300
            }
          ],
          taxRate: 23,
          discountRate: 0,
          notes: 'Płatność w terminie 14 dni',
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          updatedAt: new Date(Date.now() - 1000000000).toISOString()
        },
        {
          id: '2',
          number: 'INV-2024-002',
          clientName: 'StartupBase Ltd.',
          clientEmail: 'billing@startupbase.com',
          clientAddress: 'Innovation Hub\n10 Tech Street\nLondon, UK',
          amount: 8500.00,
          currency: 'PLN',
          status: 'SENT',
          issueDate: new Date(Date.now() - 1296000000).toISOString(),
          dueDate: new Date(Date.now() + 604800000).toISOString(),
          description: 'Implementacja systemu zarządzania projektami',
          items: [
            {
              id: '3',
              description: 'Implementacja backendu',
              quantity: 40,
              unitPrice: 180,
              total: 7200
            },
            {
              id: '4',
              description: 'Testy i dokumentacja',
              quantity: 10,
              unitPrice: 130,
              total: 1300
            }
          ],
          taxRate: 23,
          discountRate: 0,
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          updatedAt: new Date(Date.now() - 1296000000).toISOString()
        },
        {
          id: '3',
          number: 'INV-2024-003',
          clientName: 'E-commerce Plus Sp. z o.o.',
          clientEmail: 'finanse@ecommerceplus.pl',
          clientAddress: 'ul. Handlowa 45\n50-123 Wrocław',
          amount: 15600.00,
          currency: 'PLN',
          status: 'OVERDUE',
          issueDate: new Date(Date.now() - 2592000000).toISOString(),
          dueDate: new Date(Date.now() - 604800000).toISOString(),
          description: 'Rozwój platformy e-commerce - faza 1',
          items: [
            {
              id: '5',
              description: 'Frontend React/TypeScript',
              quantity: 60,
              unitPrice: 160,
              total: 9600
            },
            {
              id: '6',
              description: 'Integracja z systemami płatności',
              quantity: 30,
              unitPrice: 200,
              total: 6000
            }
          ],
          taxRate: 23,
          discountRate: 0,
          notes: 'Pilne - termin płatności przekroczony',
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          updatedAt: new Date(Date.now() - 2592000000).toISOString()
        },
        {
          id: '4',
          number: 'INV-2024-004',
          clientName: 'Digital Agency Pro',
          clientEmail: 'admin@digitalagency.pl',
          clientAddress: 'ul. Kreatywna 8\n30-001 Kraków',
          amount: 6900.00,
          currency: 'PLN',
          status: 'DRAFT',
          issueDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 1209600000).toISOString(),
          description: 'Konsultacje i audyt techniczny',
          items: [
            {
              id: '7',
              description: 'Audyt infrastruktury IT',
              quantity: 20,
              unitPrice: 250,
              total: 5000
            },
            {
              id: '8',
              description: 'Raport z rekomendacjami',
              quantity: 1,
              unitPrice: 1900,
              total: 1900
            }
          ],
          taxRate: 23,
          discountRate: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          number: 'INV-2024-005',
          clientName: 'FinTech Solutions',
          clientEmail: 'accounts@fintech.com',
          amount: 22000.00,
          currency: 'PLN',
          status: 'SENT',
          issueDate: new Date(Date.now() - 604800000).toISOString(),
          dueDate: new Date(Date.now() + 2419200000).toISOString(),
          description: 'Aplikacja mobilna do zarządzania finansami',
          items: [
            {
              id: '9',
              description: 'Rozwój aplikacji mobilnej iOS/Android',
              quantity: 100,
              unitPrice: 180,
              total: 18000
            },
            {
              id: '10',
              description: 'Backend API i bezpieczeństwo',
              quantity: 20,
              unitPrice: 200,
              total: 4000
            }
          ],
          taxRate: 23,
          discountRate: 0,
          notes: 'Projekt w ramach długoterminowej współpracy',
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 604800000).toISOString()
        }
      ];

      setInvoices(mockInvoices);
      setIsLoading(false);
    }, 500);
  };

  const filterInvoices = () => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredInvoices(filtered);
  };

  const handleCreateInvoice = () => {
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast.error('Nazwa klienta i email są wymagane');
      return;
    }

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
      clientAddress: formData.clientAddress.trim() || undefined,
      amount: formData.amount,
      currency: 'PLN',
      status: 'DRAFT',
      issueDate: new Date().toISOString(),
      dueDate: formData.dueDate || new Date(Date.now() + 1209600000).toISOString(),
      description: formData.description.trim(),
      items: formData.items.map((item, index) => ({
        id: (index + 1).toString(),
        ...item,
        total: item.quantity * item.unitPrice
      })),
      taxRate: formData.taxRate,
      discountRate: formData.discountRate,
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setFormData({
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      description: '',
      amount: 0,
      dueDate: '',
      items: [],
      taxRate: 23,
      discountRate: 0,
      notes: ''
    });
    setShowCreateModal(false);
    toast.success('Faktura została utworzona!');
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    setInvoices(prev => prev.map(invoice =>
      invoice.id === invoiceId
        ? {
            ...invoice,
            status,
            paidDate: status === 'PAID' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          }
        : invoice
    ));

    const statusText = {
      DRAFT: 'Szkic',
      SENT: 'Wysłana',
      PAID: 'Zapłacona',
      OVERDUE: 'Przeterminowana',
      CANCELLED: 'Anulowana'
    };

    toast.success(`Status faktury zmieniony na: ${statusText[status]}`);
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
    toast.success('Faktura została usunięta');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SENT': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return DocumentIcon;
      case 'SENT': return PaperAirplaneIcon;
      case 'PAID': return CheckCircleIcon;
      case 'OVERDUE': return ExclamationCircleIcon;
      case 'CANCELLED': return XMarkIcon;
      default: return DocumentIcon;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const calculateTotals = () => {
    const subtotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paid = invoices.filter(i => i.status === 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
    const outstanding = invoices.filter(i => ['SENT', 'OVERDUE'].includes(i.status)).reduce((sum, invoice) => sum + invoice.amount, 0);
    const overdue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, invoice) => sum + invoice.amount, 0);

    return { subtotal, paid, outstanding, overdue };
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600">Zarządzaj fakturami i płatnościami</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm rounded-l-lg ${
                viewMode === 'table' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm rounded-r-lg ${
                viewMode === 'grid' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Siatka
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Utwórz Fakturę
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Zapłacone</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.paid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Do zapłaty</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.outstanding)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Przeterminowane</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.overdue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj faktury..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="DRAFT">Szkice</option>
              <option value="SENT">Wysłane</option>
              <option value="PAID">Zapłacone</option>
              <option value="OVERDUE">Przeterminowane</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Znaleziono: {filteredInvoices.length} z {invoices.length}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Faktury ({filteredInvoices.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Termin
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">💳</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak faktur</h3>
                      <p className="text-gray-600">Utwórz pierwszą fakturę</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <motion.tr
                        key={invoice.id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                          <div className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.clientName}</div>
                          <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(invoice.status)
                          }`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invoice.status === 'DRAFT' && 'Szkic'}
                            {invoice.status === 'SENT' && 'Wysłana'}
                            {invoice.status === 'PAID' && 'Zapłacona'}
                            {invoice.status === 'OVERDUE' && 'Przeterminowana'}
                            {invoice.status === 'CANCELLED' && 'Anulowana'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                          {invoice.paidDate && (
                            <div className="text-sm text-green-600">Zapłacona: {formatDate(invoice.paidDate)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Zobacz szczegóły"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900"
                              title="Pobierz PDF"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                                className="text-green-600 hover:text-green-900"
                                title="Oznacz jako zapłaconą"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Usuń"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak faktur</h3>
              <p className="text-gray-600">Utwórz pierwszą fakturę</p>
            </div>
          ) : (
            filteredInvoices.map((invoice, index) => {
              const StatusIcon = getStatusIcon(invoice.status);
              return (
                <motion.div
                  key={invoice.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{invoice.number}</h3>
                        <p className="text-sm text-gray-600">{invoice.clientName}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(invoice.status)
                      }`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {invoice.status === 'DRAFT' && 'Szkic'}
                        {invoice.status === 'SENT' && 'Wysłana'}
                        {invoice.status === 'PAID' && 'Zapłacona'}
                        {invoice.status === 'OVERDUE' && 'Przeterminowana'}
                        {invoice.status === 'CANCELLED' && 'Anulowana'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Wystawiona:</span>
                        <div>{formatDate(invoice.issueDate)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Termin:</span>
                        <div>{formatDate(invoice.dueDate)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetailsModal(true);
                        }}
                        className="btn btn-outline text-sm"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Szczegóły
                      </button>
                      
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                          className="btn btn-primary text-sm"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Zapłacona
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Utwórz nową fakturę</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa klienta *
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="np. Firma ABC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email klienta *
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="kontakt@firma.pl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres klienta
                  </label>
                  <textarea
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="ul. Przykładowa 1&#10;00-001 Warszawa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis usług
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Opis świadczonych usług..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kwota (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Termin płatności
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notatki
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Dodatkowe informacje..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="btn btn-primary flex-1"
                  disabled={!formData.clientName.trim() || !formData.clientEmail.trim()}
                >
                  Utwórz fakturę
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Faktura {selectedInvoice.number}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informacje o kliencie</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Nazwa:</strong> {selectedInvoice.clientName}</div>
                      <div><strong>Email:</strong> {selectedInvoice.clientEmail}</div>
                      {selectedInvoice.clientAddress && (
                        <div><strong>Adres:</strong><br />{selectedInvoice.clientAddress.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Szczegóły faktury</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Numer:</strong> {selectedInvoice.number}</div>
                      <div><strong>Data wystawienia:</strong> {formatDate(selectedInvoice.issueDate)}</div>
                      <div><strong>Termin płatności:</strong> {formatDate(selectedInvoice.dueDate)}</div>
                      {selectedInvoice.paidDate && (
                        <div><strong>Data zapłaty:</strong> {formatDate(selectedInvoice.paidDate)}</div>
                      )}
                      <div><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(selectedInvoice.status)}`}>
                          {selectedInvoice.status === 'DRAFT' && 'Szkic'}
                          {selectedInvoice.status === 'SENT' && 'Wysłana'}
                          {selectedInvoice.status === 'PAID' && 'Zapłacona'}
                          {selectedInvoice.status === 'OVERDUE' && 'Przeterminowana'}
                          {selectedInvoice.status === 'CANCELLED' && 'Anulowana'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Opis usług</h4>
                  <p className="text-gray-700">{selectedInvoice.description}</p>
                </div>

                {selectedInvoice.items.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Pozycje faktury</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Opis
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Ilość
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Cena jedn.
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                              Suma
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Łączna kwota:</span>
                    <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  {selectedInvoice.taxRate > 0 && (
                    <div className="text-sm text-gray-600 text-right">
                      (w tym VAT {selectedInvoice.taxRate}%)
                    </div>
                  )}
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Notatki</h4>
                    <p className="text-gray-700">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Zamknij
                </button>
                <button className="btn btn-outline">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Pobierz PDF
                </button>
                {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      updateInvoiceStatus(selectedInvoice.id, 'PAID');
                      setShowDetailsModal(false);
                    }}
                    className="btn btn-primary"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Oznacz jako zapłaconą
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}