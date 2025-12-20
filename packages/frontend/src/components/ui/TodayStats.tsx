'use client';

import { useState, useEffect } from 'react';
import { Fire, ListChecks, CheckCircle, Warning } from 'phosphor-react';
import Link from 'next/link';

interface Stats {
  urgent: number;
  today: number;
  completed: number;
  overdue: number;
}

export default function TodayStats() {
  const [stats, setStats] = useState<Stats>({ urgent: 0, today: 0, completed: 0, overdue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch tasks stats
        const response = await fetch('/api/v1/tasks/stats', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            urgent: data.urgent || data.highPriority || 0,
            today: data.dueToday || data.total || 0,
            completed: data.completedToday || data.completed || 0,
            overdue: data.overdue || 0,
          });
        } else {
          // Fallback - try general tasks endpoint
          const tasksResponse = await fetch('/api/v1/tasks?limit=1000', {
            credentials: 'include',
          });

          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            const tasks = tasksData.tasks || tasksData || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const urgent = tasks.filter((t: any) => t.priority === 'HIGH' || t.priority === 'URGENT').length;
            const dueToday = tasks.filter((t: any) => {
              if (!t.dueDate) return false;
              const due = new Date(t.dueDate);
              return due >= today && due < tomorrow;
            }).length;
            const completed = tasks.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;
            const overdue = tasks.filter((t: any) => {
              if (!t.dueDate || t.status === 'DONE' || t.status === 'COMPLETED') return false;
              return new Date(t.dueDate) < today;
            }).length;

            setStats({ urgent, today: dueToday || tasks.length, completed, overdue });
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <div className="animate-pulse flex gap-3">
          <span className="bg-gray-200 rounded h-5 w-16"></span>
          <span className="bg-gray-200 rounded h-5 w-16"></span>
          <span className="bg-gray-200 rounded h-5 w-16"></span>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Fire,
      value: stats.urgent,
      label: 'pilne',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/dashboard/tasks?priority=HIGH',
      show: stats.urgent > 0,
    },
    {
      icon: Warning,
      value: stats.overdue,
      label: 'po terminie',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/dashboard/tasks?overdue=true',
      show: stats.overdue > 0,
    },
    {
      icon: ListChecks,
      value: stats.today,
      label: 'na dziś',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/tasks',
      show: true,
    },
    {
      icon: CheckCircle,
      value: stats.completed,
      label: 'ukończone',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/tasks?status=DONE',
      show: true,
    },
  ];

  const visibleStats = statItems.filter(s => s.show);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {visibleStats.map((stat, index) => (
        <Link
          key={stat.label}
          href={stat.href}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium
            ${stat.bgColor} ${stat.color}
            hover:opacity-80 transition-opacity
          `}
          title={`${stat.value} ${stat.label}`}
        >
          <stat.icon weight="bold" className="w-4 h-4" />
          <span className="font-semibold">{stat.value}</span>
          <span className="hidden md:inline text-xs opacity-75">{stat.label}</span>
        </Link>
      ))}
    </div>
  );
}
