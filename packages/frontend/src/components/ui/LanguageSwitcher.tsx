'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const languages = [
  { code: 'pl', name: 'PL', flag: '🇵🇱' },
  { code: 'en', name: 'EN', flag: '🇬🇧' }
];

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    // Replace current locale in path
    const segments = pathname.split('/');
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.unshift('', newLocale);
    }

    const newPath = segments.join('/').replace('//', '/');
    router.push(newPath);

    // Save preference to cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
            currentLocale === lang.code
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
