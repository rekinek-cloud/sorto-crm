import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Lista obsługiwanych języków
  locales: ['pl', 'en'],

  // Domyślny język
  defaultLocale: 'pl',

  // Ukryj domyślny locale w URL (opcjonalnie)
  // localePrefix: 'as-needed'
});

// Eksportuj helpery nawigacji dla komponentów
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
