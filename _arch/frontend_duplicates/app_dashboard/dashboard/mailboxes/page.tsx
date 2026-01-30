'use client';

import React from 'react';
import { redirect } from 'next/navigation';

// Redirect to existing smart-mailboxes page
export default function MailboxesPage() {
  redirect('/dashboard/smart-mailboxes');
}
