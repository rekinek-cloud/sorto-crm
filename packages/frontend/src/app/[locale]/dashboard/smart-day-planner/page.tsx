'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarDays, ClipboardList, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}

export default function SmartDayPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          setError('Brak tokenu - zaloguj sie ponownie');
          setLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await axios.get(`${baseUrl}/api/v1/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        });

        const data = response.data?.data;
        setTasks(data?.items || data || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err?.response?.data?.error || err?.message || 'Blad pobierania zadan');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Ladowanie...</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader
          title="Planer Dnia"
          subtitle="Planuj swój dzień według priorytetów strumieni i zadań"
          icon={CalendarDays}
          iconColor="text-indigo-600"
        />
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-5 max-w-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-red-700 dark:text-red-300 font-semibold mb-1">Blad</h2>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Planer Dnia"
        subtitle="Planuj swój dzień według priorytetów strumieni i zadań"
        icon={CalendarDays}
        iconColor="text-indigo-600"
      />

      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <strong className="text-slate-900 dark:text-slate-100">Zadania ({tasks.length})</strong>
        </div>

        {tasks.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Brak zadan</p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{task.title}</span>
                {task.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {task.priority}
                  </span>
                )}
                {task.status && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.status === 'DONE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {task.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
