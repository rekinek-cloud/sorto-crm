'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DomainListsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/ai-rules?tab=domains');
  }, [router]);

  return null;
}
