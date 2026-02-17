'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect: GTD Waiting For → STREAMS Zadania (status: waiting)
 */
export default function GTDWaitingForRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/delegated');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Przekierowanie do Zadań oczekujących...</span>
    </div>
  );
}
