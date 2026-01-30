'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// REDIRECT: Ta strona została przeniesiona do Smart Mailboxes
export default function CommunicationPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatyczny redirect do Smart Mailboxes
    router.replace('/dashboard/smart-mailboxes');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Przekierowywanie do Smart Mailboxes...</p>
      </div>
    </div>
  );
}