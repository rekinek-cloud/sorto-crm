'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import CustomerSelect from '@/components/ui/CustomerSelect';
import {
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  notes?: string;
  trackingNumber?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

interface SelectedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [formData, setFormData] = useState({
    items: [] as Omit<OrderItem, 'id' | 'totalPrice'>[],
    notes: '',
    priority: 'MEDIUM' as Order['priority'],
    deliveryDate: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const loadOrders = async () => {
    setTimeout(() => {
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-2024-001',
          customerName: 'Jan Kowalski',
          customerEmail: 'jan.kowalski@email.pl',
          customerPhone: '+48 123 456 789',
          customerAddress: 'ul. Kwiatowa 15\n00-001 Warszawa',
          status: 'DELIVERED',
          priority: 'MEDIUM',
          orderDate: new Date(Date.now() - 1296000000).toISOString(),
          deliveryDate: new Date(Date.now() - 432000000).toISOString(),
          totalAmount: 2499.99,
          currency: 'PLN',
          items: [
            {
              id: '1',
              productName: 'Laptop Dell XPS 13',
              productSku: 'DELL-XPS13-2024',
              quantity: 1,
              unitPrice: 2299.99,
              totalPrice: 2299.99,
              category: 'Elektronika'
            },
            {
              id: '2',
              productName: 'Mysz bezprzewodowa',
              productSku: 'MOUSE-WIRELESS-001',
              quantity: 1,
              unitPrice: 89.99,
              totalPrice: 89.99,
              category: 'Akcesoria'
            },
            {
              id: '3',
              productName: 'Mata pod mysz',
              productSku: 'MOUSEPAD-001',
              quantity: 1,
              unitPrice: 29.99,
              totalPrice: 29.99,
              category: 'Akcesoria'
            }
          ],
          trackingNumber: 'DHL123456789PL',
          paymentStatus: 'PAID',
          paymentMethod: 'Karta kredytowa',
          notes: 'Dostawa pod nieobecność do paczkomatu',
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          updatedAt: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: '2',
          orderNumber: 'ORD-2024-002',
          customerName: 'Anna Nowak',
          customerEmail: 'anna.nowak@firma.pl',
          customerPhone: '+48 987 654 321',
          customerAddress: 'ul. Biznesowa 88\n50-123 Wrocław',
          status: 'PROCESSING',
          priority: 'HIGH',
          orderDate: new Date(Date.now() - 259200000).toISOString(),
          deliveryDate: new Date(Date.now() + 345600000).toISOString(),
          totalAmount: 15799.00,
          currency: 'PLN',
          items: [
            {
              id: '4',
              productName: 'MacBook Pro 16"',
              productSku: 'APPLE-MBP16-2024',
              quantity: 2,
              unitPrice: 7899.50,
              totalPrice: 15799.00,
              category: 'Elektronika'
            }
          ],
          paymentStatus: 'PAID',
          paymentMethod: 'Przelew bankowy',
          notes: 'Zamówienie firmowe - wymagana faktura VAT',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          orderNumber: 'ORD-2024-003',
          customerName: 'Michał Wiśniewski',
          customerEmail: 'michal.w@gmail.com',
          customerAddress: 'ul. Sportowa 22\n30-001 Kraków',
          status: 'SHIPPED',
          priority: 'MEDIUM',
          orderDate: new Date(Date.now() - 518400000).toISOString(),
          deliveryDate: new Date(Date.now() + 172800000).toISOString(),
          totalAmount: 899.99,
          currency: 'PLN',
          items: [
            {
              id: '5',
              productName: 'Smartwatch Samsung Galaxy Watch',
              productSku: 'SAMSUNG-GW6-2024',
              quantity: 1,
              unitPrice: 899.99,
              totalPrice: 899.99,
              category: 'Elektronika'
            }
          ],
          trackingNumber: 'UPS987654321PL',
          paymentStatus: 'PAID',
          paymentMethod: 'BLIK',
          createdAt: new Date(Date.now() - 518400000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '4',
          orderNumber: 'ORD-2024-004',
          customerName: 'Katarzyna Zielińska',
          customerEmail: 'kasia.zielinska@hotmail.com',
          customerPhone: '+48 555 666 777',
          customerAddress: 'ul. Słoneczna 5\n60-123 Poznań',
          status: 'PENDING',
          priority: 'LOW',
          orderDate: new Date(Date.now() - 86400000).toISOString(),
          totalAmount: 299.99,
          currency: 'PLN',
          items: [
            {
              id: '6',
              productName: 'Słuchawki bezprzewodowe AirPods',
              productSku: 'APPLE-AIRPODS-PRO',
              quantity: 1,
              unitPrice: 299.99,
              totalPrice: 299.99,
              category: 'Audio'
            }
          ],
          paymentStatus: 'PENDING',
          notes: 'Klient prosi o kontakt przed wysyłką',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '5',
          orderNumber: 'ORD-2024-005',
          customerName: 'Piotr Lewandowski',
          customerEmail: 'p.lewandowski@tech.com',
          customerPhone: '+48 111 222 333',
          customerAddress: 'ul. Przemysłowa 77\n90-001 Łódź',
          status: 'CANCELLED',
          priority: 'MEDIUM',
          orderDate: new Date(Date.now() - 1728000000).toISOString(),
          totalAmount: 4599.99,
          currency: 'PLN',
          items: [
            {
              id: '7',
              productName: 'Monitor Samsung 32" 4K',
              productSku: 'SAMSUNG-MON32-4K',
              quantity: 1,
              unitPrice: 2299.99,
              totalPrice: 2299.99,
              category: 'Monitory'
            },
            {
              id: '8',
              productName: 'Klawiatura mechaniczna',
              productSku: 'KEYBOARD-MECH-RGB',
              quantity: 1,
              unitPrice: 599.99,
              totalPrice: 599.99,
              category: 'Akcesoria'
            },
            {
              id: '9',
              productName: 'Mysz gamingowa',
              productSku: 'MOUSE-GAMING-PRO',
              quantity: 1,
              unitPrice: 199.99,
              totalPrice: 199.99,
              category: 'Akcesoria'
            }
          ],
          paymentStatus: 'REFUNDED',
          paymentMethod: 'Karta kredytowa',
          notes: 'Klient anulował zamówienie - produkty niedostępne',
          createdAt: new Date(Date.now() - 1728000000).toISOString(),
          updatedAt: new Date(Date.now() - 1555200000).toISOString()
        },
        {
          id: '6',
          orderNumber: 'ORD-2024-006',
          customerName: 'Robert Kaczmarek',
          customerEmail: 'robert.k@startup.pl',
          customerAddress: 'ul. Innowacyjna 10\n00-950 Warszawa',
          status: 'CONFIRMED',
          priority: 'URGENT',
          orderDate: new Date(Date.now() - 43200000).toISOString(),
          deliveryDate: new Date(Date.now() + 259200000).toISOString(),
          totalAmount: 12999.99,
          currency: 'PLN',
          items: [
            {
              id: '10',
              productName: 'iPhone 15 Pro Max 1TB',
              productSku: 'APPLE-IP15PM-1TB',
              quantity: 3,
              unitPrice: 4333.33,
              totalPrice: 12999.99,
              category: 'Telefony'
            }
          ],
          paymentStatus: 'PAID',
          paymentMethod: 'Przelew ekspresowy',
          notes: 'Pilne zamówienie firmowe - ekspresowa dostawa',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 21600000).toISOString()
        }
      ];

      setOrders(mockOrders);
      setIsLoading(false);
    }, 500);
  };

  const filterOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });

    setFilteredOrders(filtered);
  };

  const handleCreateOrder = () => {
    if (!selectedCustomer) {
      toast.error('Proszę wybrać klienta');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Dodaj przynajmniej jeden produkt');
      return;
    }

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-2024-${String(orders.length + 1).padStart(3, '0')}`,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email || '',
      customerPhone: selectedCustomer.phone || undefined,
      customerAddress: selectedCustomer.address || '',
      status: 'PENDING',
      priority: formData.priority,
      orderDate: new Date().toISOString(),
      deliveryDate: formData.deliveryDate || undefined,
      totalAmount,
      currency: 'PLN',
      items: formData.items.map((item, index) => ({
        id: (index + 1).toString(),
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })),
      notes: formData.notes.trim() || undefined,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedCustomer(null);
    setFormData({
      items: [],
      notes: '',
      priority: 'MEDIUM',
      deliveryDate: ''
    });
    setShowCreateModal(false);
    toast.success('Zamówienie zostało utworzone!');
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? {
            ...order,
            status,
            deliveryDate: status === 'DELIVERED' ? new Date().toISOString() : order.deliveryDate,
            updatedAt: new Date().toISOString()
          }
        : order
    ));

    const statusText = {
      PENDING: 'Oczekujące',
      CONFIRMED: 'Potwierdzone',
      PROCESSING: 'W realizacji',
      SHIPPED: 'Wysłane',
      DELIVERED: 'Dostarczone',
      CANCELLED: 'Anulowane',
      RETURNED: 'Zwrócone'
    };

    toast.success(`Status zamówienia zmieniony na: ${statusText[status]}`);
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    toast.success('Zamówienie zostało usunięte');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PROCESSING': return 'bg-purple-100 text-purple-700';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'RETURNED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'REFUNDED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
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
    const totalRevenue = orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length;
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / totalOrders : 0;

    return { totalRevenue, pendingOrders, totalOrders, averageOrderValue };
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
          <h1 className="text-2xl font-bold text-gray-900">Zamówienia</h1>
          <p className="text-gray-600">Zarządzaj zamówieniami klientów i realizacją</p>
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
            Nowe Zamówienie
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łączne przychody</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Łącznie zamówień</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Oczekujące</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Średnia wartość</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.averageOrderValue)}</p>
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
                placeholder="Szukaj zamówienia..."
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
              <option value="PENDING">Oczekujące</option>
              <option value="CONFIRMED">Potwierdzone</option>
              <option value="PROCESSING">W realizacji</option>
              <option value="SHIPPED">Wysłane</option>
              <option value="DELIVERED">Dostarczone</option>
              <option value="CANCELLED">Anulowane</option>
              <option value="RETURNED">Zwrócone</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie płatności</option>
              <option value="PENDING">Oczekujące</option>
              <option value="PAID">Zapłacone</option>
              <option value="FAILED">Nieudane</option>
              <option value="REFUNDED">Zwrócone</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Znaleziono: {filteredOrders.length} z {orders.length}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Zamówienia ({filteredOrders.length})
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
                    Płatność
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak zamówień</h3>
                      <p className="text-gray-600">Utwórz pierwsze zamówienie</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.orderDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </div>
                        <div className="text-sm text-gray-500">{order.items.length} produkt(ów)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(order.status)
                        }`}>
                          {order.status === 'PENDING' && 'Oczekujące'}
                          {order.status === 'CONFIRMED' && 'Potwierdzone'}
                          {order.status === 'PROCESSING' && 'W realizacji'}
                          {order.status === 'SHIPPED' && 'Wysłane'}
                          {order.status === 'DELIVERED' && 'Dostarczone'}
                          {order.status === 'CANCELLED' && 'Anulowane'}
                          {order.status === 'RETURNED' && 'Zwrócone'}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            getPriorityColor(order.priority)
                          }`}>
                            {order.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getPaymentStatusColor(order.paymentStatus)
                        }`}>
                          {order.paymentStatus === 'PENDING' && 'Oczekuje'}
                          {order.paymentStatus === 'PAID' && 'Zapłacone'}
                          {order.paymentStatus === 'FAILED' && 'Nieudane'}
                          {order.paymentStatus === 'REFUNDED' && 'Zwrócone'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                        {order.deliveryDate && (
                          <div className="text-sm text-green-600">Dostawa: {formatDate(order.deliveryDate)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Zobacz szczegóły"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                              className="text-green-600 hover:text-green-900"
                              title="Oznacz jako dostarczone"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Usuń"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak zamówień</h3>
              <p className="text-gray-600">Utwórz pierwsze zamówienie</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(order.status)
                      }`}>
                        {order.status === 'PENDING' && 'Oczekujące'}
                        {order.status === 'CONFIRMED' && 'Potwierdzone'}
                        {order.status === 'PROCESSING' && 'W realizacji'}
                        {order.status === 'SHIPPED' && 'Wysłane'}
                        {order.status === 'DELIVERED' && 'Dostarczone'}
                        {order.status === 'CANCELLED' && 'Anulowane'}
                        {order.status === 'RETURNED' && 'Zwrócone'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        getPriorityColor(order.priority)
                      }`}>
                        {order.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.items.length} produkt(ów)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Zamówiono:</span>
                      <div>{formatDate(order.orderDate)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Płatność:</span>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus === 'PENDING' && 'Oczekuje'}
                          {order.paymentStatus === 'PAID' && 'Zapłacone'}
                          {order.paymentStatus === 'FAILED' && 'Nieudane'}
                          {order.paymentStatus === 'REFUNDED' && 'Zwrócone'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      className="btn btn-outline text-sm"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Szczegóły
                    </button>
                    
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="btn btn-primary text-sm"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Dostarczone
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Order Modal */}
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
                  <h3 className="text-lg font-semibold text-gray-900">Utwórz nowe zamówienie</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Klient *
                  </label>
                  <CustomerSelect
                    value={selectedCustomer?.id}
                    onCustomerSelect={setSelectedCustomer}
                    placeholder="Wybierz klienta z listy..."
                    required={true}
                  />
                  {selectedCustomer && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        {selectedCustomer.email && (
                          <div><strong>Email:</strong> {selectedCustomer.email}</div>
                        )}
                        {selectedCustomer.phone && (
                          <div><strong>Telefon:</strong> {selectedCustomer.phone}</div>
                        )}
                        {selectedCustomer.company && (
                          <div className="col-span-2"><strong>Firma:</strong> {selectedCustomer.company}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as Order['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                      <option value="URGENT">Pilny</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data dostawy
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
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
                    placeholder="Dodatkowe informacje o zamówieniu..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Produkty</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Dodaj produkty do zamówienia (funkcjonalność w przygotowaniu)
                  </p>
                  <div className="text-sm text-gray-500">
                    Symulacja: dodano przykładowy produkt o wartości 100 PLN
                  </div>
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
                  onClick={() => {
                    // Symulacja dodania produktu
                    const updatedFormData = {
                      ...formData,
                      items: [{
                        productName: 'Przykładowy produkt',
                        productSku: 'EXAMPLE-001',
                        quantity: 1,
                        unitPrice: 100,
                        category: 'Inne'
                      }]
                    };
                    setFormData(updatedFormData);
                    handleCreateOrder();
                  }}
                  className="btn btn-primary flex-1"
                  disabled={!selectedCustomer}
                >
                  Utwórz zamówienie
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
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
                    Zamówienie {selectedOrder.orderNumber}
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
                      <div><strong>Nazwa:</strong> {selectedOrder.customerName}</div>
                      <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                      {selectedOrder.customerPhone && (
                        <div><strong>Telefon:</strong> {selectedOrder.customerPhone}</div>
                      )}
                      <div><strong>Adres:</strong><br />{selectedOrder.customerAddress.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Szczegóły zamówienia</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Numer:</strong> {selectedOrder.orderNumber}</div>
                      <div><strong>Data zamówienia:</strong> {formatDate(selectedOrder.orderDate)}</div>
                      {selectedOrder.deliveryDate && (
                        <div><strong>Data dostawy:</strong> {formatDate(selectedOrder.deliveryDate)}</div>
                      )}
                      <div><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status === 'PENDING' && 'Oczekujące'}
                          {selectedOrder.status === 'CONFIRMED' && 'Potwierdzone'}
                          {selectedOrder.status === 'PROCESSING' && 'W realizacji'}
                          {selectedOrder.status === 'SHIPPED' && 'Wysłane'}
                          {selectedOrder.status === 'DELIVERED' && 'Dostarczone'}
                          {selectedOrder.status === 'CANCELLED' && 'Anulowane'}
                          {selectedOrder.status === 'RETURNED' && 'Zwrócone'}
                        </span>
                      </div>
                      <div><strong>Płatność:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                          {selectedOrder.paymentStatus === 'PENDING' && 'Oczekuje'}
                          {selectedOrder.paymentStatus === 'PAID' && 'Zapłacone'}
                          {selectedOrder.paymentStatus === 'FAILED' && 'Nieudane'}
                          {selectedOrder.paymentStatus === 'REFUNDED' && 'Zwrócone'}
                        </span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div><strong>Numer śledzenia:</strong> {selectedOrder.trackingNumber}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Produkty</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Produkt
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            SKU
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
                        {selectedOrder.items.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              {item.category && (
                                <div className="text-gray-500">{item.category}</div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.productSku || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Łączna kwota:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Notatki</h4>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
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
                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'DELIVERED');
                      setShowDetailsModal(false);
                    }}
                    className="btn btn-primary"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Oznacz jako dostarczone
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