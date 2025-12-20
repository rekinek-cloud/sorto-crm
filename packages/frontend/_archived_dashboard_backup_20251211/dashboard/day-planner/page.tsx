'use client';

import { redirect } from 'next/navigation';

/**
 * Day Planner - przekierowanie do STREAMS Smart Day Planner
 */
export default function DayPlannerPage() {
  redirect('/crm/dashboard/day-planner');
}
