// Stub for useLocale - defaults to Polish
const useLocale = () => 'pl';

// Hook for localized number and currency formatting
export function useNumberFormat() {
  const locale = useLocale();

  // Get Intl locale code
  const intlLocale = locale === 'pl' ? 'pl-PL' : 'en-US';

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(intlLocale, options).format(value);
  };

  const formatCurrency = (value: number, currency = 'PLN') => {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 1) => {
    return new Intl.NumberFormat(intlLocale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  };

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat(intlLocale, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  return {
    formatNumber,
    formatCurrency,
    formatPercent,
    formatCompact,
    locale: intlLocale
  };
}
