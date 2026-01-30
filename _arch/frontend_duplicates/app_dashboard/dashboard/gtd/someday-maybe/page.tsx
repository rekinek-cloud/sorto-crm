'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Strona GTD Someday/Maybe została zastąpiona przez Zamrożone Strumienie w metodologii STREAMS.
 * Automatyczne przekierowanie do /dashboard/streams/frozen
 */
export default function GTDSomedayMaybeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/dashboard/streams/frozen');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Przekierowanie do Zamrożonych Strumieni...</p>
        <p className="text-sm text-gray-500 mt-2">
          W metodologii STREAMS używamy Zamrożonych Strumieni zamiast Someday/Maybe.
        </p>
      </div>
    </div>
  );
}
