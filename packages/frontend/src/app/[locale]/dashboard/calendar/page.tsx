'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import { calendarApi, CalendarEvent, CalendarEventsResponse, CalendarFilters } from '@/lib/api/calendar';
import { recurringTasksApi } from '@/lib/api/recurring';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  Building2,
  Target,
  Loader2,
  RotateCcw,
  AlertTriangle,
  CheckSquare,
  FolderKanban,
  Users,
  Repeat,
  Handshake,
  Zap,
  Heart,
  FileText,
  ClipboardCheck,
  Circle,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);

  // Polish day and month names
  const polishDaysShort = ['Nie', 'Pon', 'Wto', 'Sro', 'Czw', 'Pia', 'Sob'];
  const polishMonths = [
    'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
  ];

  // Type colors, labels, and icons
  const typeInfo: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    TASK: { label: 'Zadania', color: '#3B82F6', icon: CheckSquare },
    PROJECT: { label: 'Projekty', color: '#10B981', icon: FolderKanban },
    MEETING: { label: 'Spotkania', color: '#8B5CF6', icon: Users },
    RECURRING_TASK: { label: 'Zadania cykliczne', color: '#F59E0B', icon: Repeat },
    DEAL: { label: 'Deale', color: '#EF4444', icon: Handshake },
    NEXT_ACTION: { label: 'Nastepne akcje', color: '#06B6D4', icon: Zap },
    HABIT: { label: 'Nawyki', color: '#14B8A6', icon: Heart },
    INVOICE: { label: 'Faktury', color: '#6366F1', icon: FileText },
    WEEKLY_REVIEW: { label: 'Przeglady tygodniowe', color: '#14B8A6', icon: ClipboardCheck }
  };

  // Priority info with icons instead of emojis
  const priorityInfo: Record<string, { label: string; icon: React.ElementType; variant: 'error' | 'warning' | 'info' | 'neutral' }> = {
    URGENT: { label: 'Pilne', icon: AlertCircle, variant: 'error' },
    HIGH: { label: 'Wysokie', icon: ArrowUp, variant: 'warning' },
    MEDIUM: { label: 'Srednie', icon: Minus, variant: 'info' },
    LOW: { label: 'Niskie', icon: ArrowDown, variant: 'neutral' },
  };

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const response = await calendarApi.getEvents({
        ...filters,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      setEvents(response.events);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('Blad podczas ladowania wydarzen kalendarza');
    } finally {
      setLoading(false);
    }
  };

  // Generate tasks from recurring tasks
  const generateRecurringTasks = async () => {
    try {
      setGeneratingTasks(true);
      const result = await recurringTasksApi.generateTasks();

      if (result.generated > 0) {
        toast.success(`Wygenerowano ${result.generated} zadan z zadan cyklicznych!`);
        await loadEvents();
      } else {
        toast('Brak zadan cyklicznych do wygenerowania', { icon: '>' });
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
      toast.error('Blad podczas generowania zadan');
    } finally {
      setGeneratingTasks(false);
    }
  };

  // Get view date range
  const getViewStartDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setDate(date.getDate() - date.getDay());
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
    } else {
      date.setDate(date.getDate() - 14);
    }
    return date;
  };

  const getViewEndDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1, 0);
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay() + 6);
    } else {
      date.setDate(date.getDate() + 42);
    }
    return date;
  };

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Format time
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  // Generate calendar days for month view
  const generateCalendarDays = (): Date[] => {
    const startDate = getViewStartDate();
    const days: Date[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  // Generate week days for week view
  const generateWeekDays = (): Date[] => {
    const startDate = getViewStartDate();
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  // Effects
  useEffect(() => {
    loadEvents();
  }, [currentDate, view, filters]);

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Kalendarz"
        subtitle="Zarzadzaj wydarzeniami i terminami"
        icon={Calendar}
        iconColor="text-teal-600"
        breadcrumbs={[{ label: 'Kalendarz' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              onClick={generateRecurringTasks}
              loading={generatingTasks}
              icon={RotateCcw}
              variant="secondary"
            >
              Generuj zadania
            </ActionButton>

            <ActionButton
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'ghost'}
              icon={Filter}
            >
              Filtry
            </ActionButton>
          </div>
        }
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Filtry kalendarza</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Typ wydarzen (wybierz wiele)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(typeInfo).map(([type, info]) => {
                      const selectedTypes = filters.types ? filters.types.split(',') : [];
                      const isSelected = selectedTypes.includes(type);
                      const IconComp = info.icon;
                      return (
                        <label
                          key={type}
                          className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600'
                              : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              let newTypes: string[];
                              if (isSelected) {
                                newTypes = selectedTypes.filter(t => t !== type);
                              } else {
                                newTypes = [...selectedTypes, type];
                              }
                              setFilters(prev => ({ ...prev, types: newTypes.join(',') || undefined }));
                            }}
                            className="rounded text-blue-600 dark:bg-slate-700 dark:border-slate-600"
                          />
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="text-xs text-slate-700 dark:text-slate-300">{info.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {filters.types && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, types: undefined }))}
                      className="text-xs text-blue-600 hover:underline mt-2 dark:text-blue-400"
                    >
                      Odznacz wszystkie
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Priorytet</label>
                  <select
                    value={filters.priority || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any || undefined }))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Wszystkie priorytety</option>
                    <option value="URGENT">Pilne</option>
                    <option value="HIGH">Wysokie</option>
                    <option value="MEDIUM">Srednie</option>
                    <option value="LOW">Niskie</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <ActionButton
                    onClick={() => setFilters({})}
                    variant="secondary"
                    icon={X}
                    className="w-full"
                  >
                    Wyczysc filtry
                  </ActionButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <ActionButton onClick={navigatePrevious} variant="ghost" size="sm" icon={ChevronLeft} />
          <ActionButton onClick={navigateToday} variant="secondary" size="sm">
            Dzis
          </ActionButton>
          <ActionButton onClick={navigateNext} variant="ghost" size="sm" icon={ChevronRight} />

          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 ml-4">
            {view === 'month' && `${polishMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Tydzien ${getViewStartDate().getDate()}-${getViewEndDate().getDate()} ${polishMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'list' && 'Lista wydarzen'}
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-1">
          {(['month', 'week', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                view === v
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {v === 'month' ? 'Miesiac' : v === 'week' ? 'Tydzien' : 'Lista'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6"
      >
        {Object.entries(typeInfo).map(([type, info]) => {
          const count = events.filter(e => e.type === type).length;
          if (count === 0) return null;

          return (
            <motion.div key={type} variants={itemVariants}>
              <StatCard
                label={info.label}
                value={count}
                icon={info.icon}
                iconColor={`bg-opacity-10 dark:bg-opacity-20`}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Month View */}
      {view === 'month' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 p-4"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {polishDaysShort.map(day => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.005 }}
                  className={`min-h-[100px] p-2 border rounded-xl transition-all duration-200 ${
                    isCurrentMonth
                      ? 'bg-white/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800/60'
                      : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100/50 dark:border-slate-800/20 text-slate-400 dark:text-slate-600'
                  } ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-200 dark:border-blue-600' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCurrentMonth
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => {
                      const TypeIcon = typeInfo[event.type]?.icon || Circle;
                      return (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded-lg text-white truncate flex items-center gap-1"
                          style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          title={`${event.title} - ${event.description || ''}`}
                        >
                          <TypeIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-1">
                        +{dayEvents.length - 3} wiecej
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 p-4"
        >
          <div className="grid grid-cols-7 gap-4">
            {generateWeekDays().map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-2"
                >
                  <div className={`text-center p-2 rounded-xl transition-all duration-200 ${
                    isToday
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold ring-1 ring-blue-300 dark:ring-blue-700'
                      : 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
                  }`}>
                    <div className="text-xs uppercase tracking-wider">{polishDaysShort[date.getDay()]}</div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>

                  <div className="space-y-1">
                    {dayEvents.map(event => {
                      const TypeIcon = typeInfo[event.type]?.icon || Circle;
                      return (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded-xl text-white backdrop-blur-sm"
                          style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          title={event.description}
                        >
                          <div className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.startDate)}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <TypeIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* List View */}
      {view === 'list' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {events.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30">
              <EmptyState
                icon={Calendar}
                title="Brak wydarzen"
                description="Nie znaleziono wydarzen w wybranym okresie."
              />
            </div>
          ) : (
            Object.entries(calendarApi.groupEventsByDate(events))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dayEvents]) => (
                <motion.div
                  key={date}
                  variants={itemVariants}
                  className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/30">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {new Date(date).toLocaleDateString('pl-PL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {dayEvents.map(event => {
                      const TypeIcon = typeInfo[event.type]?.icon || Circle;
                      const prio = event.priority ? priorityInfo[event.priority] : null;
                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-700/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-200"
                        >
                          <div
                            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                {event.title}
                              </span>
                              {prio && (
                                <StatusBadge variant={prio.variant} dot>
                                  {prio.label}
                                </StatusBadge>
                              )}
                            </div>

                            {event.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(event.startDate)}
                                {event.endDate && ` - ${formatTime(event.endDate)}`}
                              </div>

                              {event.metadata?.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {event.metadata.assignedTo}
                                </div>
                              )}

                              {event.metadata?.company && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {event.metadata.company}
                                </div>
                              )}

                              {event.metadata?.project && (
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {event.metadata.project}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))
          )}
        </motion.div>
      )}
    </PageShell>
  );
};

export default CalendarPage;
