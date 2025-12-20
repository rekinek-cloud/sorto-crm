// Stub for useLocale - defaults to Polish
const useLocale = () => 'pl';

import { pl, enUS } from 'date-fns/locale';
import { formatDistanceToNow, format } from 'date-fns';

// Get date-fns locale based on current locale
export function getDateFnsLocale(locale?: string) {
  const currentLocale = locale || 'pl';

  switch (currentLocale) {
    case 'en':
      return enUS;
    case 'pl':
    default:
      return pl;
  }
}

// Hook for localized date formatting
export function useDateFormat() {
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const formatRelative = (date: Date | string) => {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObject, {
      addSuffix: true,
      locale: dateFnsLocale
    });
  };

  const formatDate = (date: Date | string, formatString = 'PPP') => {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return format(dateObject, formatString, { locale: dateFnsLocale });
  };

  const formatDateTime = (date: Date | string) => {
    const dateObject = typeof date === 'string' ? new Date(date) : date;
    return format(dateObject, 'PPP p', { locale: dateFnsLocale });
  };

  return {
    formatRelative,
    formatDate,
    formatDateTime,
    locale: dateFnsLocale
  };
}
