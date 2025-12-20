'use client';

import React from 'react';
import { redirect } from 'next/navigation';

// Redirect to existing smart-day-planner page
export default function DayPlannerPage() {
  redirect('/dashboard/smart-day-planner');
}
