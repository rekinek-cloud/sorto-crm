/**
 * useEnrichment Hook
 * Hook do wzbogacania danych firm z obsługą cache i limitów
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  getEnrichmentUsage,
  enrichCompany,
  enrichContact,
  EnrichmentUsageStats,
  EnrichmentResult,
} from '@/lib/api/enrichment';

interface UseEnrichmentOptions {
  onSuccess?: (result: EnrichmentResult) => void;
  onError?: (error: Error) => void;
}

export function useEnrichment(options?: UseEnrichmentOptions) {
  const queryClient = useQueryClient();
  const [isEnriching, setIsEnriching] = useState(false);

  // Pobierz statystyki użycia
  const {
    data: usage,
    isLoading: isLoadingUsage,
    refetch: refetchUsage,
  } = useQuery<EnrichmentUsageStats>(
    ['enrichment-usage'],
    getEnrichmentUsage,
    {
      staleTime: 60 * 1000, // 1 minuta
      retry: false,
    }
  );

  // Mutacja do wzbogacania firmy
  const enrichCompanyMutation = useMutation(
    ({ domain, companyId }: { domain: string; companyId?: string }) =>
      enrichCompany(domain, companyId),
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(
            result.cacheHit
              ? 'Dane pobrane z cache'
              : 'Dane firmy zostały wzbogacone'
          );
          options?.onSuccess?.(result);
        } else {
          toast.error(result.error || 'Nie udało się wzbogacić danych');
        }
        // Odśwież statystyki użycia
        queryClient.invalidateQueries(['enrichment-usage']);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Błąd wzbogacania danych');
        options?.onError?.(error);
      },
      onSettled: () => {
        setIsEnriching(false);
      },
    }
  );

  // Mutacja do wzbogacania kontaktu
  const enrichContactMutation = useMutation(
    ({
      email,
      contactId,
      companyDomain,
    }: {
      email: string;
      contactId?: string;
      companyDomain?: string;
    }) => enrichContact(email, contactId, companyDomain),
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success(
            result.cacheHit
              ? 'Dane pobrane z cache'
              : 'Dane kontaktu zostały wzbogacone'
          );
          options?.onSuccess?.(result);
        } else {
          toast.error(result.error || 'Nie udało się wzbogacić danych');
        }
        queryClient.invalidateQueries(['enrichment-usage']);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Błąd wzbogacania danych');
        options?.onError?.(error);
      },
      onSettled: () => {
        setIsEnriching(false);
      },
    }
  );

  // Wzbogać firmę
  const handleEnrichCompany = useCallback(
    async (domain: string, companyId?: string) => {
      if (!usage?.hasAccess) {
        toast.error('Brak dostępu do funkcji wzbogacania danych');
        return null;
      }

      if (usage.remaining === 0 && usage.limit !== -1) {
        toast.error('Wykorzystano limit wzbogacania w tym miesiącu');
        return null;
      }

      setIsEnriching(true);
      return enrichCompanyMutation.mutateAsync({ domain, companyId });
    },
    [usage, enrichCompanyMutation]
  );

  // Wzbogać kontakt
  const handleEnrichContact = useCallback(
    async (email: string, contactId?: string, companyDomain?: string) => {
      if (!usage?.hasAccess) {
        toast.error('Brak dostępu do funkcji wzbogacania danych');
        return null;
      }

      if (usage.remaining === 0 && usage.limit !== -1) {
        toast.error('Wykorzystano limit wzbogacania w tym miesiącu');
        return null;
      }

      setIsEnriching(true);
      return enrichContactMutation.mutateAsync({ email, contactId, companyDomain });
    },
    [usage, enrichContactMutation]
  );

  return {
    // Stan
    isEnriching,
    isLoadingUsage,

    // Dane użycia
    usage,
    hasAccess: usage?.hasAccess ?? false,
    remaining: usage?.remaining ?? 0,
    limit: usage?.limit ?? 0,
    plan: usage?.plan ?? 'none',

    // Akcje
    enrichCompany: handleEnrichCompany,
    enrichContact: handleEnrichContact,
    refetchUsage,

    // Statusy mutacji
    isEnrichingCompany: enrichCompanyMutation.isLoading,
    isEnrichingContact: enrichContactMutation.isLoading,
  };
}

export default useEnrichment;
