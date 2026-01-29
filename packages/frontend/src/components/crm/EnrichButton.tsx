'use client';

import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useEnrichment } from '@/hooks/useEnrichment';
import { EnrichmentResult } from '@/lib/api/enrichment';

interface EnrichButtonProps {
  /** Domena firmy do wzbogacenia */
  domain?: string;
  /** ID firmy w CRM (opcjonalne) */
  companyId?: string;
  /** Email kontaktu (dla wzbogacania kontaktu) */
  email?: string;
  /** ID kontaktu (opcjonalne) */
  contactId?: string;
  /** Typ wzbogacania */
  type?: 'company' | 'contact';
  /** Callback po pomyślnym wzbogaceniu */
  onSuccess?: (result: EnrichmentResult) => void;
  /** Callback po błędzie */
  onError?: (error: Error) => void;
  /** Dodatkowe klasy CSS */
  className?: string;
  /** Rozmiar przycisku */
  size?: 'sm' | 'default' | 'lg' | 'icon';
  /** Wariant przycisku */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Czy pokazać tooltip z info o limitach */
  showTooltip?: boolean;
  /** Tekst przycisku (domyślnie "Wzbogać dane") */
  label?: string;
  /** Tylko ikona */
  iconOnly?: boolean;
}

export function EnrichButton({
  domain,
  companyId,
  email,
  contactId,
  type = 'company',
  onSuccess,
  onError,
  className,
  size = 'sm',
  variant = 'outline',
  showTooltip = true,
  label = 'Wzbogać dane',
  iconOnly = false,
}: EnrichButtonProps) {
  const [showInfo, setShowInfo] = useState(false);

  const {
    enrichCompany,
    enrichContact,
    isEnriching,
    hasAccess,
    remaining,
    limit,
    plan,
  } = useEnrichment({
    onSuccess,
    onError,
  });

  const handleClick = async () => {
    if (type === 'company' && domain) {
      await enrichCompany(domain, companyId);
    } else if (type === 'contact' && email) {
      await enrichContact(email, contactId, domain);
    }
  };

  const isDisabled = !hasAccess || (remaining === 0 && limit !== -1);
  const canEnrich = type === 'company' ? !!domain : !!email;

  if (!hasAccess) {
    return null; // Nie pokazuj przycisku jeśli użytkownik nie ma dostępu
  }

  const tooltipContent = () => {
    if (!hasAccess) return 'Funkcja dostępna w planie Professional i Enterprise';
    if (remaining === 0 && limit !== -1) return 'Wykorzystano limit wzbogacania';
    if (limit === -1) return 'Nielimitowane wzbogacanie (Enterprise)';
    return `Pozostało ${remaining} z ${limit} wzbogaceń w tym miesiącu`;
  };

  return (
    <div className="relative inline-block">
      <Button
        variant={variant}
        size={iconOnly ? 'icon' : size}
        onClick={handleClick}
        disabled={isDisabled || !canEnrich || isEnriching}
        loading={isEnriching}
        className={cn(
          'gap-1.5',
          isEnriching && 'cursor-wait',
          className
        )}
        onMouseEnter={() => showTooltip && setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        title={!showTooltip ? tooltipContent() : undefined}
      >
        <SparklesIcon className={cn('h-4 w-4', iconOnly ? '' : '-ml-0.5')} />
        {!iconOnly && !isEnriching && label}
        {!iconOnly && isEnriching && 'Wzbogacanie...'}
      </Button>

      {/* Tooltip */}
      {showTooltip && showInfo && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            {tooltipContent()}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrichButton;
