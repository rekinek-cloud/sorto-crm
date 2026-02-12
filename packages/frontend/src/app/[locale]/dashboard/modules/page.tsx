'use client';

import { useState, useEffect } from 'react';
import { useOverlay } from '@/lib/contexts/OverlayContext';
import {
  PlatformModule,
  getAvailableModules,
  getPurchasedModules,
  purchaseModule,
  cancelModule,
} from '@/lib/api/modules';
import {
  Package,
  Check,
  Clock,
  ExternalLink,
  XCircle,
  Loader2,
  Sparkles,
  Camera,
  Cloud,
  Target,
  CalendarDays,
  Globe,
  FileText,
  Users,
  BarChart3,
  Car,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

// Icon mapping for modules using Lucide icons
const moduleIconComponents: Record<string, React.ReactNode> = {
  'focus-photo': <Camera className="w-6 h-6" />,
  'focus-cloud': <Cloud className="w-6 h-6" />,
  'flyball': <Target className="w-6 h-6" />,
  'slotify': <CalendarDays className="w-6 h-6" />,
  'sites': <Globe className="w-6 h-6" />,
  'faktury-ksef': <FileText className="w-6 h-6" />,
  'hr': <Users className="w-6 h-6" />,
  'projekty': <BarChart3 className="w-6 h-6" />,
  'flota': <Car className="w-6 h-6" />,
};

export default function ModulesPage() {
  const { branding } = useOverlay();
  const [availableModules, setAvailableModules] = useState<PlatformModule[]>([]);
  const [purchasedModules, setPurchasedModules] = useState<PlatformModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [available, purchased] = await Promise.all([
        getAvailableModules(),
        getPurchasedModules(),
      ]);
      setAvailableModules(available);
      setPurchasedModules(purchased);
    } catch (err: any) {
      setError(err.message || 'Nie udalo sie pobrac modulow');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handlePurchase = async (slug: string) => {
    try {
      setActionLoading(slug);
      setError(null);
      setSuccessMessage(null);

      const result = await purchaseModule(slug);

      if (result.stripeCheckoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.stripeCheckoutUrl;
        return;
      }

      setSuccessMessage(result.message);
      await fetchModules();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Nie udalo sie aktywowac modulu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (slug: string) => {
    if (!confirm('Czy na pewno chcesz dezaktywowac ten modul?')) {
      return;
    }

    try {
      setActionLoading(slug);
      setError(null);
      setSuccessMessage(null);

      const result = await cancelModule(slug);
      setSuccessMessage(result.message);
      await fetchModules();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Nie udalo sie dezaktywowac modulu');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(price);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: branding.primaryColor }} />
        </div>
      </PageShell>
    );
  }

  // Separate not purchased from purchased
  const notPurchased = availableModules.filter(m => !m.isPurchased);

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Header */}
        <PageHeader
          title="Moduly"
          subtitle="Rozszerz mozliwosci platformy o dodatkowe moduly"
          icon={Package}
          iconColor="text-indigo-600"
        />

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {/* Active Modules */}
        {purchasedModules.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Aktywne moduly
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchasedModules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white/80 backdrop-blur-xl border border-green-200 dark:border-green-800/40 dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300"
                        style={{ backgroundColor: `${branding.primaryColor}15` }}
                      >
                        {moduleIconComponents[module.slug] || <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{module.name}</h3>
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Aktywny
                        </span>
                      </div>
                    </div>
                  </div>

                  {module.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{module.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {module.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Wygasa: {formatDate(module.expiresAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {module.url && (
                        <a
                          href={module.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            color: branding.primaryColor,
                            backgroundColor: `${branding.primaryColor}10`,
                          }}
                        >
                          Otworz
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleCancel(module.slug)}
                        disabled={actionLoading === module.slug}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === module.slug ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Anuluj
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Modules */}
        {notPurchased.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: branding.primaryColor }} />
              Dostepne moduly
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notPurchased.map((module) => (
                <div
                  key={module.id}
                  className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300">
                        {moduleIconComponents[module.slug] || <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{module.name}</h3>
                        <span className="text-sm font-medium" style={{ color: branding.primaryColor }}>
                          {formatPrice(module.monthlyPrice)}/mies.
                        </span>
                      </div>
                    </div>
                  </div>

                  {module.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{module.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handlePurchase(module.slug)}
                      disabled={actionLoading === module.slug}
                      className="w-full inline-flex items-center justify-center gap-2 text-white font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      {actionLoading === module.slug ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Wyprobuj za darmo (30 dni)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {availableModules.length === 0 && purchasedModules.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500" />
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">Brak dostepnych modulow</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Obecnie nie ma zadnych dodatkowych modulow dostepnych dla Twojego planu.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
