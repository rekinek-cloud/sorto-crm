'use client';

import React from 'react';
import { redirect } from 'next/navigation';

// Redirect to existing communication channels page
export default function ChannelsPage() {
  redirect('/dashboard/communication/channels');
}
