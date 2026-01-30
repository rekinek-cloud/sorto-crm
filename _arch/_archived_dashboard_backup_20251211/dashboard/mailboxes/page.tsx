'use client';

import { redirect } from 'next/navigation';

/**
 * Mailboxes - przekierowanie do STREAMS Smart Mailboxes
 */
export default function MailboxesPage() {
  redirect('/crm/dashboard/mailboxes');
}
