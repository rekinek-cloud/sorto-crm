'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { BentoCard } from '@/components/dashboard-v2/BentoCard';
import { apiClient } from '@/lib/api/client';

interface TimelineItem {
  type: 'MEETING' | 'TASK';
  title: string;
  startMin: number;
  durationMin: number;
  color: string;
}

interface TimeSlot {
  hour: number;
  items: TimelineItem[];
  fillPercent: number;
}

interface TimelineData {
  currentHour: number;
  slots: TimeSlot[];
}

interface TimelineWidgetProps {
  loading?: boolean;
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function TimelineWidget({ loading: externalLoading }: TimelineWidgetProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/dashboard/day/timeline');
      setData(response.data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTimeline]);

  const loading = externalLoading || isLoading;
  const currentHour = data?.currentHour ?? new Date().getHours();
  const slots = data?.slots ?? [];

  return (
    <BentoCard
      title="Oś czasu"
      icon={Clock}
      iconColor="text-sky-600"
      variant="glass"
      loading={loading}
    >
      {slots.length === 0 && !loading ? (
        <p className="text-sm text-slate-400 py-4 text-center">Brak danych osi czasu</p>
      ) : (
        <div className="space-y-0 max-h-[320px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
          {slots.map((slot) => {
            const isNow = currentHour === slot.hour;
            const isPast = currentHour > slot.hour;

            return (
              <div key={slot.hour} className="relative">
                {/* NOW marker */}
                {isNow && (
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10 flex items-center pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                    <span className="text-[9px] font-bold text-red-500 ml-0.5 shrink-0">TERAZ</span>
                  </div>
                )}

                <div
                  className={`flex items-stretch gap-2 py-1 border-b border-slate-50 transition-opacity ${
                    isPast && !isNow ? 'opacity-40' : ''
                  }`}
                >
                  {/* Time label */}
                  <div
                    className={`w-11 shrink-0 text-[11px] pt-0.5 text-right font-mono ${
                      isNow ? 'font-bold text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {formatHour(slot.hour)}
                  </div>

                  {/* Slot content */}
                  <div className="flex-1 min-h-[28px] relative">
                    {slot.items.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {slot.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium truncate"
                            style={{
                              backgroundColor: item.color + '18',
                              color: item.color,
                              borderLeft: `3px solid ${item.color}`,
                            }}
                            title={`${item.title} (${item.durationMin}min)`}
                          >
                            <span className="truncate">{item.title}</span>
                            <span className="text-[9px] opacity-70 shrink-0 ml-auto">
                              {item.durationMin}m
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center">
                        <div className="w-full h-1 bg-slate-100 rounded-full" />
                      </div>
                    )}

                    {/* Fill indicator */}
                    {slot.fillPercent > 0 && (
                      <div className="absolute right-0 top-0 bottom-0 flex items-center">
                        <span className="text-[9px] text-slate-300 font-medium">
                          {slot.fillPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
}
