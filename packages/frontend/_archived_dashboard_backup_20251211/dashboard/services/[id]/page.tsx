'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Service, servicesApi } from '@/lib/api/services';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const statusConfig = {
  AVAILABLE: { icon: CheckCircleIcon, label: 'Dostępna', color: 'green' },
  UNAVAILABLE: { icon: XCircleIcon, label: 'Niedostępna', color: 'gray' },
  TEMPORARILY_UNAVAILABLE: { icon: ExclamationTriangleIcon, label: 'Tymczasowo niedostępna', color: 'yellow' },
  DISCONTINUED: { icon: ExclamationTriangleIcon, label: 'Wycofana', color: 'red' }
};

const billingTypeLabels = {
  ONE_TIME: 'Jednorazowa',
  HOURLY: 'Godzinowa',
  DAILY: 'Dzienna',
  WEEKLY: 'Tygodniowa',
  MONTHLY: 'Miesięczna',
  YEARLY: 'Roczna',
  PROJECT_BASED: 'Za projekt'
};

const deliveryMethodLabels = {
  ON_SITE: 'Na miejscu',
  REMOTE: 'Zdalnie',
  HYBRID: 'Hybrydowo',
  OFFICE_VISIT: 'Wizyta w biurze'
};

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadService();
    }
  }, [params.id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const serviceData = await servicesApi.getService(params.id as string);
      setService(serviceData);
    } catch (error: any) {
      console.error('Failed to load service:', error);
      toast.error('Nie udało się załadować usługi');
      router.push('/crm/dashboard/services');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/crm/dashboard/services?edit=${service?.id}`);
  };

  const handleDuplicate = async () => {
    if (!service) return;
    
    try {
      await servicesApi.duplicateService(service.id);
      toast.success('Usługa została zduplikowana');
      router.push('/crm/dashboard/services');
    } catch (error: any) {
      console.error('Failed to duplicate service:', error);
      toast.error('Nie udało się zduplikować usługi');
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    
    if (!confirm(`Czy na pewno chcesz usunąć usługę "${service.name}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      await servicesApi.deleteService(service.id);
      toast.success('Usługa została usunięta');
      router.push('/crm/dashboard/services');
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      toast.error('Nie udało się usunąć usługi');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  const StatusIcon = statusConfig[service.status as keyof typeof statusConfig]?.icon || CheckCircleIcon;
  const statusInfo = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.AVAILABLE;

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                {service.images?.[0] ? (
                  <img
                    src={service.images?.[0]}
                    alt={service.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CogIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {service.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                      {statusInfo.label}
                    </span>
                    {service.isFeatured && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Wyróżniona
                      </span>
                    )}
                    {!service.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        Nieaktywna
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleDuplicate}
                className="btn btn-outline btn-sm"
              >
                <CubeIcon className="w-4 h-4 mr-1" />
                Duplikuj
              </button>
              <button 
                onClick={handleEdit}
                className="btn btn-outline btn-sm"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edytuj
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-300"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                {deleting ? 'Usuwanie...' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              className="bg-white rounded-lg shadow-sm border border-gray-200"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="p-8">
                {/* Service Image */}
                {service.images?.[0] && (
                  <div className="mb-8">
                    <img
                      src={service.images?.[0]}
                      alt={service.name}
                      className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {/* Service Description */}
                {service.description && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Opis usługi</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{service.description}</p>
                    </div>
                  </div>
                )}

                {/* Service Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Szczegóły usługi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service.duration && (
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Czas realizacji</p>
                          <p className="text-sm text-gray-600">
                            {service.duration} {service.unit || 'godzin'}
                          </p>
                        </div>
                      </div>
                    )}

                    {service.deliveryMethod && (
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sposób realizacji</p>
                          <p className="text-sm text-gray-600">
                            {deliveryMethodLabels[service.deliveryMethod as keyof typeof deliveryMethodLabels] || service.deliveryMethod}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Pricing */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cennik</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cena</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                  </div>

                  {service.billingType && (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Typ rozliczenia</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {billingTypeLabels[service.billingType as keyof typeof billingTypeLabels] || service.billingType}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>

              {/* Service Info */}
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informacje</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TagIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Kategoria</p>
                      <p className="text-sm text-gray-600">
                        {service.category || 'Brak kategorii'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Utworzono</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(service.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ostatnia aktualizacja</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(service.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <motion.div
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tagi</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}