'use client';

import React from 'react';
import { redirect } from 'next/navigation';

// Redirect to existing rules-manager page
export default function RulesPage() {
  redirect('/dashboard/rules-manager');
}
