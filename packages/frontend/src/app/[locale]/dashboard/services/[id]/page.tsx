'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Service, servicesApi } from '@/lib/api/services';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Share2,
  Eye,
  Tag,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Building2,
  Users,
  MapPin,
  Box
} from 'lucide-react';

const statusConfig = {
  AVAILABLE: { icon: CheckCircle, label: 'Dostepna', color: 'green' },
  UNAVAILABLE: { icon: XCircle, label: 'Niedostepna', color: 'slate' },
  TEMPORARILY_UNAVAILABLE: { icon: AlertTriangle, label: 'Tymczasowo niedostepna', color: 'yellow' },
  DISCONTINUED: { icon: AlertTriangle, label: 'Wycofana', color: 'red' }
};

const billingTypeLabels = {
  ONE_TIME: 'Jednorazowa',
  HOURLY: 'Godzinowa',
  DAILY: 'Dzienna',
  WEEKLY: 'Tygodniowa',
  MONTHLY: 'Miesieczna',
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
    if (params.id) { loadService(); }
  }, [params.id]);

  const loadService = async () => {
    try {
      setLoading(true);
      const serviceData = await servicesApi.getService(params.id as string);
      setService(serviceData);
    } catch (error: any) {
      console.error('Failed to load service:', error);
      toast.error('Nie udalo sie zaladowac uslugi');
      router.push('/dashboard/services');
    } finally { setLoading(false); }
  };

  const handleEdit = () => { router.push(`/dashboard/services?edit=${service?.id}`); };

  const handleDuplicate = async () => {
    if (!service) return;
    try { await servicesApi.duplicateService(service.id); toast.success('Usluga zostala zduplikowana'); router.push('/dashboard/services'); }
    catch (error: any) { console.error('Failed to duplicate service:', error); toast.error('Nie udalo sie zduplikowac uslugi'); }
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm(`Czy na pewno chcesz usunac usluge "${service.name}"?`)) return;
    try { setDeleting(true); await servicesApi.deleteService(service.id); toast.success('Usluga zostala usunieta'); router.push('/dashboard/services'); }
    catch (error: any) { console.error('Failed to delete service:', error); toast.error('Nie udalo sie usunac uslugi'); }
    finally { setDeleting(false); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pl-PL', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
  };

  if (loading) return <PageShell><SkeletonPage /></PageShell>;
  if (!service) return null;

  const StatusIcon = statusConfig[service.status as keyof typeof statusConfig]?.icon || CheckCircle;
  const statusInfo = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.AVAILABLE;

  return (
    <PageShell>
      <PageHeader
        title={service.name}
        subtitle={service.category || 'Service Details'}
        icon={Settings}
        iconColor="text-purple-600"
        breadcrumbs={[{ label: 'Services', href: '/dashboard/services' }, { label: service.name }]}
        actions={
          <div className="flex items-center space-x-2">
            <button onClick={handleDuplicate} className="btn btn-outline btn-sm"><Box className="w-4 h-4 mr-1" />Duplikuj</button>
            <button onClick={handleEdit} className="btn btn-outline btn-sm"><Pencil className="w-4 h-4 mr-1" />Edytuj</button>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700">
              <Trash2 className="w-4 h-4 mr-1" />{deleting ? 'Usuwanie...' : 'Usun'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-8">
              {/* Status badges */}
              <div className="flex items-center space-x-3 mb-6">
                <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700 dark:bg-${statusInfo.color}-900/30 dark:text-${statusInfo.color}-400`}>
                  {statusInfo.label}
                </span>
                {service.isFeatured && <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Wyrozniona</span>}
                {!service.isActive && <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400">Nieaktywna</span>}
              </div>

              {service.images?.[0] && (
                <div className="mb-8"><img src={service.images?.[0]} alt={service.name} className="w-full max-w-md mx-auto rounded-lg shadow-sm" /></div>
              )}
              {service.description && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Opis uslugi</h3>
                  <div className="prose max-w-none"><p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{service.description}</p></div>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Szczegoly uslugi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.duration && (
                    <div className="flex items-center space-x-3"><Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Czas realizacji</p><p className="text-sm text-slate-600 dark:text-slate-400">{service.duration} {service.unit || 'godzin'}</p></div></div>
                  )}
                  {service.deliveryMethod && (
                    <div className="flex items-center space-x-3"><MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Sposob realizacji</p><p className="text-sm text-slate-600 dark:text-slate-400">{deliveryMethodLabels[service.deliveryMethod as keyof typeof deliveryMethodLabels] || service.deliveryMethod}</p></div></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Cennik</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Cena</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(service.price)}</p></div></div>
              {service.billingType && (
                <div className="flex items-center space-x-3"><div className="w-5 h-5" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Typ rozliczenia</p><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300">{billingTypeLabels[service.billingType as keyof typeof billingTypeLabels] || service.billingType}</span></div></div>
              )}
            </div>
          </motion.div>

          <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Informacje</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3"><Tag className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Kategoria</p><p className="text-sm text-slate-600 dark:text-slate-400">{service.category || 'Brak kategorii'}</p></div></div>
              <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Utworzono</p><p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(service.createdAt)}</p></div></div>
              <div className="flex items-center space-x-3"><Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" /><div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Ostatnia aktualizacja</p><p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(service.updatedAt)}</p></div></div>
            </div>
          </motion.div>

          {service.tags && service.tags.length > 0 && (
            <motion.div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Tagi</h3>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-full"><Tag className="w-3 h-3 mr-1" />{tag}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
