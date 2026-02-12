'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// REDIRECT: Email redirects to Mailboxes
export default function EmailPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const getLocale = () => {
    const match = pathname?.match(/^\/crm\/([a-z]{2})\//);
    return match ? match[1] : 'pl';
  };

  useEffect(() => {
    router.replace(`/${getLocale()}/dashboard/mailboxes`);
  }, [router, pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Przekierowywanie do Mailboxes...</p>
      </div>
    </div>
  );
}
