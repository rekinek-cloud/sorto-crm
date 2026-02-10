'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect from duplicate /knowledge-base to the real /knowledge page.
 * The /knowledge page has full backend integration with documents, wiki, and folders.
 */
export default function KnowledgeBaseRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pl';

  useEffect(() => {
    router.replace(`/${locale}/dashboard/knowledge`);
  }, [router, locale]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Przekierowanie do Bazy Wiedzy...</p>
    </div>
  );
}
