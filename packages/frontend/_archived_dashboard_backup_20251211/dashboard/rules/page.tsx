'use client';

import { redirect } from 'next/navigation';

/**
 * Rules - przekierowanie do STREAMS Rules
 */
export default function RulesPage() {
  redirect('/crm/dashboard/rules');
}
