'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Target } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';

interface FocusTask {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  dueDate: string | null;
  isOverdue: boolean;
  estimatedHours: number | null;
  projectName: string | null;
  streamName: string | null;
  streamColor: string | null;
  companyName: string | null;
}

interface FocusDayWidgetProps {
  tasks: FocusTask[];
  loading?: boolean;
}

const priorityDot: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-slate-400',
};

function formatDueDate(dueDate: string | null, isOverdue: boolean): { text: string; className: string } | null {
  if (!dueDate) return null;
  if (isOverdue) return { text: 'Zalegly', className: 'bg-red-100 text-red-700' };
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { text: 'Dzis', className: 'bg-amber-100 text-amber-700' };
  if (diff === 1) return { text: 'Jutro', className: 'bg-blue-100 text-blue-700' };
  return { text: `za ${diff}d`, className: 'bg-slate-100 text-slate-600' };
}

export function FocusDayWidget({ tasks, loading }: FocusDayWidgetProps) {
  const router = useRouter();

  return (
    <BentoCard
      title="Fokus Dnia"
      icon={Target}
      iconColor="text-amber-600"
      variant="glass"
      loading={loading}
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">Brak priorytetowych zadan</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map(task => {
            const due = formatDueDate(task.dueDate, task.isOverdue);
            return (
              <div
                key={task.id}
                onClick={() => router.push('/dashboard/tasks')}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority] || 'bg-slate-400'}`} />
                <span className="text-sm text-slate-700 truncate flex-1">{task.title}</span>
                {task.streamName && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    style={{
                      backgroundColor: (task.streamColor || '#3B82F6') + '20',
                      color: task.streamColor || '#3B82F6'
                    }}
                  >
                    {task.streamName}
                  </span>
                )}
                {due && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${due.className}`}>
                    {due.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
}
