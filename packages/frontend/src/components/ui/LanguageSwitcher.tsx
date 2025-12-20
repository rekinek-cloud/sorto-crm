'use client';

import { useState } from 'react';

const languages = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState('pl');

  const switchLanguage = (newLocale: string) => {
    setLocale(newLocale);
    // Language switching will be implemented when i18n is configured
    console.log('Language switched to:', newLocale);
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLanguage(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
