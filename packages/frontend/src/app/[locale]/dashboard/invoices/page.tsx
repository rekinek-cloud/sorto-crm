'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Plus,
  X,
  Eye,
  Pencil,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Filter,
  Search,
  CreditCard,
} from 'lucide-react';
import { invoicesApi, type Invoice as ApiInvoice, type InvoiceStatus } from '@/lib/api/invoices';
import { apiClient } from '@/lib/api/client';

// Map API status to display status
type DisplayStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  amount: number;
  currency: string;
  status: DisplayStatus;
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

const GLASS_CARD = 'bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm';

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

  // Company search for client picker
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [productList, setProductList] = useState<any[]>([]);

  const searchCompanies = async (query: string) => {
    if (query.length < 2) { setShowCompanySuggestions(false); return; }
    try {
      const res = await apiClient.get('/companies', { params: { search: query, limit: 5 } });
      const companies = res.data?.companies || res.data || [];
      setCompanySuggestions(Array.isArray(companies) ? companies : []);
      setShowCompanySuggestions(true);
    } catch { setCompanySuggestions([]); }
  };

  const selectCompany = (company: any) => {
    setFormData(prev => ({
      ...prev,
      clientName: company.name || '',
      clientEmail: company.email || '',
      clientAddress: company.address || '',
    }));
    setShowCompanySuggestions(false);
  };

  const loadProducts = async () => {
    try {
      const res = await apiClient.get('/products', { params: { limit: 100 } });
      setProductList(res.data?.products || res.data || []);
    } catch { /* ignore */ }
  };

  const addProductItem = (product: any) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: product.name,
        description: product.description || '',
        quantity: 1,
        unitPrice: product.price || 0,
        productId: product.id,
      }],
      amount: prev.amount + (product.price || 0),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => {
      const items = [...prev.items];
      const removed = items.splice(index, 1)[0];
      return { ...prev, items, amount: prev.amount - ((removed as any).unitPrice * (removed as any).quantity || 0) };
    });
  };

  useEffect(() => {
    loadInvoices();
    loadProducts();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  // Map API status to display status
  const mapStatus = (status: InvoiceStatus): DisplayStatus => {
    switch (status) {
      case 'PENDING': return 'DRAFT';
      case 'CANCELED': return 'CANCELLED';
      default: return status as DisplayStatus;
    }
  };

  // Map API invoice to display invoice
  const mapInvoice = (apiInvoice: ApiInvoice): Invoice => ({
    id: apiInvoice.id,
    number: apiInvoice.invoiceNumber,
    clientName: apiInvoice.title,
    clientEmail: apiInvoice.customerEmail || '',
    clientAddress: apiInvoice.customerAddress,
    amount: apiInvoice.totalAmount,
    currency: apiInvoice.currency,
    status: mapStatus(apiInvoice.status),
    issueDate: apiInvoice.createdAt,
    dueDate: apiInvoice.dueDate || apiInvoice.createdAt,
    description: apiInvoice.description || '',
    items: apiInvoice.items.map((item, index) => ({
      id: item.id || String(index),
      description: item.customDescription || item.customName || `Pozycja ${index + 1}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.totalPrice || item.quantity * item.unitPrice,
    })),
    taxRate: apiInvoice.totalTax > 0 ? 23 : 0,
    discountRate: apiInvoice.totalDiscount > 0 ? (apiInvoice.totalDiscount / apiInvoice.subtotal) * 100 : 0,
    notes: apiInvoice.paymentNotes,
    createdAt: apiInvoice.createdAt,
    updatedAt: apiInvoice.updatedAt,
  });

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const { invoices: data } = await invoicesApi.getInvoices({ limit: 100 });
      setInvoices(data.map(mapInvoice));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Nie udało się pobrać faktur');
    } finally {
      setIsLoading(false);
    }
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

  const handleCreateInvoice = async () => {
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      toast.error('Nazwa klienta i email są wymagane');
      return;
    }

    try {
      await invoicesApi.createInvoice({
        title: formData.clientName.trim(),
        description: formData.description.trim(),
        amount: formData.amount,
        currency: 'PLN',
        status: 'PENDING',
        dueDate: formData.dueDate || undefined,
        customerEmail: formData.clientEmail.trim(),
        customerAddress: formData.clientAddress.trim() || undefined,
        paymentNotes: formData.notes.trim() || undefined,
        items: formData.items.map((item) => ({
          itemType: 'CUSTOM' as const,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          customDescription: item.description,
        })),
      });

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
      loadInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast.error('Nie udało się utworzyć faktury');
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    try {
      const apiStatus: InvoiceStatus = status === 'DRAFT' ? 'PENDING' : status === 'CANCELLED' ? 'CANCELED' : status;
      await invoicesApi.updateInvoice(invoiceId, { status: apiStatus });

      const statusText = {
        DRAFT: 'Szkic',
        SENT: 'Wysłana',
        PAID: 'Zapłacona',
        OVERDUE: 'Przeterminowana',
        CANCELLED: 'Anulowana'
      };

      toast.success(`Status faktury zmieniony na: ${statusText[status]}`);
      loadInvoices();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      toast.error('Nie udało się zmienić statusu faktury');
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      await invoicesApi.deleteInvoice(invoiceId);
      toast.success('Faktura została usunięta');
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Nie udało się usunąć faktury');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      case 'SENT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'OVERDUE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'CANCELLED': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return FileText;
      case 'SENT': return Send;
      case 'PAID': return CheckCircle2;
      case 'OVERDUE': return AlertCircle;
      case 'CANCELLED': return X;
      default: return FileText;
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
      <PageShell>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Faktury"
        subtitle="Zarządzaj fakturami i płatnościami"
        icon={FileText}
        iconColor="text-indigo-600"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Faktury' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex rounded-xl border border-slate-300 dark:border-slate-600">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm rounded-l-xl ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/80 text-slate-700 hover:bg-slate-50 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Tabela
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm rounded-r-xl ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/80 text-slate-700 hover:bg-slate-50 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Siatka
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Utwórz Fakturę
            </button>
          </div>
        }
      />

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={GLASS_CARD + ' p-6'}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Łącznie</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.subtotal)}</p>
              </div>
            </div>
          </div>

          <div className={GLASS_CARD + ' p-6'}>
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zapłacone</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.paid)}</p>
              </div>
            </div>
          </div>

          <div className={GLASS_CARD + ' p-6'}>
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Do zapłaty</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.outstanding)}</p>
              </div>
            </div>
          </div>

          <div className={GLASS_CARD + ' p-6'}>
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Przeterminowane</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totals.overdue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={GLASS_CARD + ' p-4'}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj faktury..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white/80 dark:bg-slate-700/80 dark:text-slate-200"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white/80 dark:bg-slate-700/80 dark:text-slate-200"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="DRAFT">Szkice</option>
                <option value="SENT">Wysłane</option>
                <option value="PAID">Zapłacone</option>
                <option value="OVERDUE">Przeterminowane</option>
                <option value="CANCELLED">Anulowane</option>
              </select>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              Znaleziono: {filteredInvoices.length} z {invoices.length}
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {viewMode === 'table' ? (
          <div className={GLASS_CARD + ' overflow-hidden'}>
            <div className="px-6 py-4 border-b border-white/20 dark:border-slate-700/30">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Faktury ({filteredInvoices.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Numer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Klient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kwota</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Termin</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak faktur</h3>
                        <p className="text-slate-600 dark:text-slate-400">Utwórz pierwszą fakturę</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice, index) => {
                      const StatusIcon = getStatusIcon(invoice.status);
                      return (
                        <motion.tr
                          key={invoice.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.number}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(invoice.issueDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.clientName}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{invoice.clientEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {invoice.status === 'DRAFT' && 'Szkic'}
                              {invoice.status === 'SENT' && 'Wysłana'}
                              {invoice.status === 'PAID' && 'Zapłacona'}
                              {invoice.status === 'OVERDUE' && 'Przeterminowana'}
                              {invoice.status === 'CANCELLED' && 'Anulowana'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900 dark:text-slate-100">{formatDate(invoice.dueDate)}</div>
                            {invoice.paidDate && (
                              <div className="text-sm text-green-600 dark:text-green-400">Zapłacona: {formatDate(invoice.paidDate)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => { setSelectedInvoice(invoice); setShowDetailsModal(true); }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Zobacz szczegóły"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" title="Pobierz PDF">
                                <Download className="w-4 h-4" />
                              </button>
                              {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Oznacz jako zapłaconą"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Usuń"
                              >
                                <Trash2 className="w-4 h-4" />
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
              <div className={'col-span-full p-12 text-center ' + GLASS_CARD}>
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak faktur</h3>
                <p className="text-slate-600 dark:text-slate-400">Utwórz pierwszą fakturę</p>
              </div>
            ) : (
              filteredInvoices.map((invoice, index) => {
                const StatusIcon = getStatusIcon(invoice.status);
                return (
                  <motion.div
                    key={invoice.id}
                    className={GLASS_CARD + ' hover:shadow-md transition-shadow'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{invoice.number}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.clientName}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {invoice.status === 'DRAFT' && 'Szkic'}
                          {invoice.status === 'SENT' && 'Wysłana'}
                          {invoice.status === 'PAID' && 'Zapłacona'}
                          {invoice.status === 'OVERDUE' && 'Przeterminowana'}
                          {invoice.status === 'CANCELLED' && 'Anulowana'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{invoice.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                          onClick={() => { setSelectedInvoice(invoice); setShowDetailsModal(true); }}
                          className="btn btn-outline text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Szczegóły
                        </button>

                        {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'PAID')}
                            className="btn btn-primary text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
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
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ maxWidth: '42rem' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utwórz nową fakturę</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa klienta *</label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => { setFormData({ ...formData, clientName: e.target.value }); searchCompanies(e.target.value); }}
                        onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                        placeholder="Wpisz nazwę firmy..."
                      />
                      {showCompanySuggestions && companySuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {companySuggestions.map((company: any) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => selectCompany(company)}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-600 text-sm"
                            >
                              <div className="font-medium text-slate-900 dark:text-slate-100">{company.name}</div>
                              {company.email && <div className="text-slate-500 dark:text-slate-400 text-xs">{company.email}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email klienta *</label>
                      <input
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                        placeholder="kontakt@firma.pl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adres klienta</label>
                    <textarea
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                      rows={2}
                      placeholder="ul. Przykładowa 1&#10;00-001 Warszawa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis usług</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                      rows={3}
                      placeholder="Opis świadczonych usług..."
                    />
                  </div>

                  {/* Product/Service picker */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pozycje faktury</label>
                    {formData.items.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {formData.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded text-sm">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600 dark:text-slate-400">{item.quantity} x {item.unitPrice?.toFixed(2)} PLN</span>
                              <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {productList.length > 0 ? (
                      <select
                        onChange={(e) => {
                          const product = productList.find((p: any) => p.id === e.target.value);
                          if (product) addProductItem(product);
                          e.target.value = '';
                        }}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
                        defaultValue=""
                      >
                        <option value="" disabled>Wybierz produkt/usługę z listy...</option>
                        {productList.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {p.price?.toFixed(2)} PLN
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Brak produktów w katalogu. Dodaj produkty w sekcji Produkty.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kwota (PLN)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Termin płatności</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notatki</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200"
                      rows={2}
                      placeholder="Dodatkowe informacje..."
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                  <button onClick={() => setShowCreateModal(false)} className="btn btn-outline flex-1">Anuluj</button>
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
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ maxWidth: '56rem' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Faktura {selectedInvoice.number}</h3>
                    <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Informacje o kliencie</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
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
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Szczegóły faktury</h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
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
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Opis usług</h4>
                    <p className="text-slate-700 dark:text-slate-300">{selectedInvoice.description}</p>
                  </div>

                  {selectedInvoice.items.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Pozycje faktury</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-50/80 dark:bg-slate-700/80">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Opis</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ilość</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cena jedn.</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Suma</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {selectedInvoice.items.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100">{item.description}</td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100 text-right">{item.quantity}</td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-sm text-slate-900 dark:text-slate-100 text-right font-medium">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold text-slate-900 dark:text-slate-100">
                      <span>Łączna kwota:</span>
                      <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.taxRate > 0 && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 text-right">
                        (w tym VAT {selectedInvoice.taxRate}%)
                      </div>
                    )}
                  </div>

                  {selectedInvoice.notes && (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Notatki</h4>
                      <p className="text-slate-700 dark:text-slate-300">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                  <button onClick={() => setShowDetailsModal(false)} className="btn btn-outline flex-1">Zamknij</button>
                  <button className="btn btn-outline">
                    <Download className="w-4 h-4 mr-2" />
                    Pobierz PDF
                  </button>
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                    <button
                      onClick={() => { updateInvoiceStatus(selectedInvoice.id, 'PAID'); setShowDetailsModal(false); }}
                      className="btn btn-primary"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Oznacz jako zapłaconą
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageShell>
  );
}
