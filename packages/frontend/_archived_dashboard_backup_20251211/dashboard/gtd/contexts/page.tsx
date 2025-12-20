'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect: GTD Contexts → STREAMS Tagi
 */
export default function GTDContextsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/dashboard/tags');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Przekierowanie do Tagów...</span>
    </div>
  );
}
