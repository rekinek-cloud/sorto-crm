'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Strona GTD Inbox została zastąpiona przez Źródło (Source) w metodologii STREAMS.
 * Automatyczne przekierowanie do /dashboard/source
 */
export default function GTDInboxRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/source');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Przekierowanie do Źródła (Source)...</p>
        <p className="text-sm text-gray-500 mt-2">
          W metodologii STREAMS używamy Źródła zamiast GTD Inbox.
        </p>
      </div>
    </div>
  );
}
