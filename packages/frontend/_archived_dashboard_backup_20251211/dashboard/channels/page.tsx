'use client';

import { redirect } from 'next/navigation';

/**
 * Channels - przekierowanie do STREAMS Communication Channels
 */
export default function ChannelsPage() {
  redirect('/crm/dashboard/channels');
}
