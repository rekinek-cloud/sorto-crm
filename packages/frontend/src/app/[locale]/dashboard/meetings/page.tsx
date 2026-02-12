// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Meeting, MeetingFilters, MeetingStats, CalendarMeetings } from '@/lib/api/meetings';
import { meetingsApi } from '@/lib/api/meetings';
import MeetingCard from '@/components/meetings/MeetingCard';
import MeetingForm from '@/components/meetings/MeetingForm';
import MeetingFiltersComponent from '@/components/meetings/MeetingFilters';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  CalendarDays,
  Clock,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
  User,
  Pencil,
  Trash2,
  CalendarPlus,
  XCircle,
} from 'lucide-react';

import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

type ViewMode = 'grid' | 'list' | 'calendar';

const statusVariantMap: Record<string, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELED: 'error',
};

const statusLabelMap: Record<string, string> = {
  SCHEDULED: 'Zaplanowane',
  IN_PROGRESS: 'W trakcie',
  COMPLETED: 'Zakonczone',
  CANCELED: 'Anulowane',
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarMeetings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filters, setFilters] = useState<MeetingFilters>({
    page: 1,
    limit: 20,
    sortBy: 'startTime',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load meetings when filters change
  useEffect(() => {
    if (!isLoading) {
      loadMeetings();
    }
  }, [filters]);

  // Load calendar data when current date changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadCalendarData();
    }
  }, [currentDate, viewMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [
        meetingsApi.getMeetings(filters),
        meetingsApi.getMeetingsStats(),
      ];

      if (viewMode === 'calendar') {
        promises.push(
          meetingsApi.getCalendarMeetings(currentDate.getFullYear(), currentDate.getMonth() + 1)
        );
      }

      const results = await Promise.all(promises);
      const [meetingsData, statsData, calendarDataResult] = results;

      setMeetings(meetingsData.meetings);
      setPagination(meetingsData.pagination);
      setStats(statsData);

      if (calendarDataResult) {
        setCalendarData(calendarDataResult as CalendarMeetings);
      }
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac spotkan');
      console.error('Error loading meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      const calendarDataResult = await meetingsApi.getCalendarMeetings(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setCalendarData(calendarDataResult);
    } catch (error: any) {
      console.error('Error loading calendar data:', error);
    }
  };

  const loadMeetings = async () => {
    try {
      const meetingsData = await meetingsApi.getMeetings(filters);
      setMeetings(meetingsData.meetings);
      setPagination(meetingsData.pagination);
    } catch (error: any) {
      toast.error('Nie udalo sie zaladowac spotkan');
      console.error('Error loading meetings:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await meetingsApi.createMeeting(data);
      toast.success('Spotkanie zostalo zaplanowane');
      setIsMeetingFormOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.conflicts) {
        toast.error('Spotkanie koliduje z istniejacymi spotkaniami');
      } else {
        toast.error('Nie udalo sie zaplanowac spotkania');
      }
      console.error('Error creating meeting:', error);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await meetingsApi.updateMeeting(id, data);
      toast.success('Spotkanie zostalo zaktualizowane');
      setEditingMeeting(undefined);
      setIsMeetingFormOpen(false);
      loadData();
    } catch (error: any) {
      if (error.response?.data?.conflicts) {
        toast.error('Spotkanie koliduje z istniejacymi spotkaniami');
      } else {
        toast.error('Nie udalo sie zaktualizowac spotkania');
      }
      console.error('Error updating meeting:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'SCHEDULED') => {
    try {
      await meetingsApi.updateMeeting(id, { status });
      toast.success(`Status spotkania zmieniony na: ${statusLabelMap[status] || status}`);
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie zmienic statusu spotkania');
      console.error('Error updating meeting status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac to spotkanie?')) return;

    try {
      await meetingsApi.deleteMeeting(id);
      toast.success('Spotkanie zostalo usuniete');
      loadData();
    } catch (error: any) {
      toast.error('Nie udalo sie usunac spotkania');
      console.error('Error deleting meeting:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = !searchQuery ||
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Calendar navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getDateKey = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toISOString().split('T')[0];
  };

  const isTodayCheck = (day: number) => {
    const today = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const getEventsForDay = (day: number) => {
    const dateKey = getDateKey(day);
    return calendarData?.meetings?.[dateKey] || [];
  };

  // DataTable columns for list view
  const tableColumns: Column<Meeting>[] = [
    {
      key: 'title',
      label: 'Tytul',
      render: (_, meeting) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{meeting.title}</p>
          {meeting.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[250px]">
              {meeting.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'startTime',
      label: 'Data i czas',
      sortable: true,
      render: (_, meeting) => {
        const timeRange = meetingsApi.formatTimeRange(meeting.startTime, meeting.endTime);
        const isMeetingToday = meetingsApi.isToday(meeting.startTime);
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{timeRange}</span>
            {isMeetingToday && (
              <StatusBadge variant="info" size="sm">Dzisiaj</StatusBadge>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, meeting) => (
        <StatusBadge variant={statusVariantMap[meeting.status] || 'default'} dot>
          {statusLabelMap[meeting.status] || meeting.status}
        </StatusBadge>
      ),
    },
    {
      key: 'location',
      label: 'Lokalizacja',
      render: (_, meeting) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          {meeting.meetingUrl ? (
            <>
              <Video className="w-3.5 h-3.5" />
              <span>Online</span>
            </>
          ) : meeting.location ? (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{meeting.location}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Kontakt',
      render: (_, meeting) => (
        meeting.contact ? (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span>{meeting.contact.firstName} {meeting.contact.lastName}</span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">-</span>
        )
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: 'w-24',
      render: (_, meeting) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingMeeting(meeting);
              setIsMeetingFormOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title="Edytuj"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(meeting.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Usun"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Filter bar configuration
  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setStatusFilter(value);
      if (value !== 'all') {
        setFilters(prev => ({ ...prev, status: value as any, page: 1 }));
      } else {
        setFilters(prev => {
          const { status, ...rest } = prev;
          return { ...rest, page: 1 };
        });
      }
    }
  };

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Spotkania"
        subtitle="Zarzadzaj spotkaniami i kalendarzem"
        icon={CalendarDays}
        iconColor="text-purple-600"
        breadcrumbs={[{ label: 'Spotkania' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              icon={CalendarDays}
              onClick={() => window.location.href = '/dashboard/meetings/calendar'}
              size="sm"
            >
              Pelny kalendarz
            </ActionButton>
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setIsMeetingFormOpen(true)}
            >
              Nowe spotkanie
            </ActionButton>
          </div>
        }
      />

      {/* Loading state */}
      {isLoading ? (
        <SkeletonPage />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Statistics */}
          {stats && (
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Planowane"
                value={stats.scheduledMeetings}
                icon={CalendarPlus}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Dzisiaj"
                value={stats.todayMeetings}
                icon={Clock}
                iconColor="text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400"
              />
              <StatCard
                label="Zakonczone"
                value={stats.completedMeetings}
                icon={CheckCircle}
                iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
              <StatCard
                label="Anulowane"
                value={stats.canceledMeetings}
                icon={XCircle}
                iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
              />
            </motion.div>
          )}

          {/* Filter Bar + View Toggle */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <FilterBar
                search={searchQuery}
                onSearchChange={(val) => {
                  setSearchQuery(val);
                  if (!val) {
                    setFilters(prev => {
                      const { search, ...rest } = prev;
                      return { ...rest, page: 1 };
                    });
                  }
                }}
                searchPlaceholder="Szukaj spotkania..."
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'SCHEDULED', label: 'Zaplanowane' },
                      { value: 'IN_PROGRESS', label: 'W trakcie' },
                      { value: 'COMPLETED', label: 'Zakonczone' },
                      { value: 'CANCELED', label: 'Anulowane' },
                    ],
                  },
                ]}
                filterValues={{ status: statusFilter }}
                onFilterChange={handleFilterChange}
                actions={
                  <div className="flex items-center">
                    {/* View toggle */}
                    <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-1 border border-white/20 dark:border-slate-700/30">
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          viewMode === 'calendar'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Widok kalendarza"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Widok siatki"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="Widok listy"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </motion.div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <MeetingFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Calendar View */}
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' && (
              <motion.div
                key="calendar"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Calendar Header */}
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {formatMonthYear(currentDate)}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        Dzis
                      </button>
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Pon', 'Wt', 'Sr', 'Czw', 'Pt', 'Sob', 'Nie'].map((day) => (
                      <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: getFirstDayOfMonth(currentDate) === 0 ? 6 : getFirstDayOfMonth(currentDate) - 1 }).map((_, index) => (
                      <div key={`empty-${index}`} className="h-24 p-1" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                      const day = index + 1;
                      const dayEvents = getEventsForDay(day);
                      const isTodayDate = isTodayCheck(day);
                      const isSelected = selectedDate === getDateKey(day);

                      return (
                        <motion.div
                          key={day}
                          whileHover={{ scale: 1.02 }}
                          className={`h-24 p-1.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                            isTodayDate
                              ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'
                              : 'border-slate-200/50 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          } ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-sm' : ''}`}
                          onClick={() => setSelectedDate(getDateKey(day))}
                        >
                          <div className="h-full flex flex-col">
                            <div className={`text-sm font-semibold ${
                              isTodayDate
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {day}
                            </div>
                            <div className="flex-1 overflow-hidden mt-0.5">
                              {dayEvents.slice(0, 2).map((meeting: Meeting, eventIndex: number) => {
                                const startTime = new Date(meeting.startTime);
                                const timeStr = startTime.toLocaleTimeString('pl-PL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                                const variant = statusVariantMap[meeting.status] || 'default';

                                return (
                                  <div
                                    key={eventIndex}
                                    className={`text-[10px] leading-tight px-1.5 py-0.5 mb-0.5 rounded-md truncate font-medium ${
                                      variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                      variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                      variant === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                      variant === 'error' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                                      'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                    title={`${timeStr} - ${meeting.title}`}
                                  >
                                    {timeStr} {meeting.title}
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 font-medium">
                                  +{dayEvents.length - 2} wiecej
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Details */}
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200/50 dark:border-slate-700/30 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Spotkania - {new Date(selectedDate).toLocaleDateString('pl-PL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {getEventsForDay(new Date(selectedDate).getDate()).length === 0 ? (
                          <EmptyState
                            icon={CalendarDays}
                            title="Brak spotkan w tym dniu"
                            description="Nie zaplanowano zadnych spotkan na ten dzien."
                            action={
                              <ActionButton
                                variant="primary"
                                icon={Plus}
                                size="sm"
                                onClick={() => setIsMeetingFormOpen(true)}
                              >
                                Zaplanuj spotkanie
                              </ActionButton>
                            }
                          />
                        ) : (
                          <div className="space-y-3">
                            {getEventsForDay(new Date(selectedDate).getDate()).map((meeting: Meeting) => {
                              const timeRange = meetingsApi.formatTimeRange(meeting.startTime, meeting.endTime);

                              return (
                                <motion.div
                                  key={meeting.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-200/30 dark:border-slate-700/30 hover:shadow-sm transition-all"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{meeting.title}</h4>
                                      <StatusBadge variant={statusVariantMap[meeting.status] || 'default'} dot size="sm">
                                        {statusLabelMap[meeting.status] || meeting.status}
                                      </StatusBadge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {timeRange}
                                      </span>
                                      {meeting.location && (
                                        <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                          <MapPin className="w-3.5 h-3.5" />
                                          {meeting.location}
                                        </span>
                                      )}
                                    </div>
                                    {meeting.description && (
                                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                                        {meeting.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-3 shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingMeeting(meeting);
                                        setIsMeetingFormOpen(true);
                                      }}
                                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                      title="Edytuj"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(meeting.id)}
                                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                      title="Usun"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div
                key="grid"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {filteredMeetings.length === 0 ? (
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
                    <EmptyState
                      icon={CalendarDays}
                      title="Nie znaleziono spotkan"
                      description={searchQuery ? 'Brak spotkan pasujacych do kryteriow wyszukiwania.' : 'Zacznij organizowac swoj harmonogram planujac pierwsze spotkanie.'}
                      action={
                        <ActionButton
                          variant="primary"
                          icon={Plus}
                          onClick={() => setIsMeetingFormOpen(true)}
                        >
                          Zaplanuj spotkanie
                        </ActionButton>
                      }
                    />
                  </div>
                ) : (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {filteredMeetings.map((meeting) => (
                      <motion.div key={meeting.id} variants={fadeUp}>
                        <MeetingCard
                          meeting={meeting}
                          onEdit={(meeting) => {
                            setEditingMeeting(meeting);
                            setIsMeetingFormOpen(true);
                          }}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div
                key="list"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {filteredMeetings.length === 0 ? (
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
                    <EmptyState
                      icon={CalendarDays}
                      title="Nie znaleziono spotkan"
                      description={searchQuery ? 'Brak spotkan pasujacych do kryteriow wyszukiwania.' : 'Zacznij organizowac swoj harmonogram planujac pierwsze spotkanie.'}
                      action={
                        <ActionButton
                          variant="primary"
                          icon={Plus}
                          onClick={() => setIsMeetingFormOpen(true)}
                        >
                          Zaplanuj spotkanie
                        </ActionButton>
                      }
                    />
                  </div>
                ) : (
                  <DataTable
                    columns={tableColumns}
                    data={filteredMeetings}
                    storageKey="meetings-table"
                    pageSize={pagination.limit}
                    emptyMessage="Brak spotkan"
                    onRowClick={(meeting) => {
                      setEditingMeeting(meeting);
                      setIsMeetingFormOpen(true);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination for grid view */}
          {viewMode === 'grid' && pagination.pages > 1 && (
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {(pagination.page - 1) * pagination.limit + 1}
                {' - '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                {' z '}
                {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Meeting Form Modal */}
      {isMeetingFormOpen && (
        <MeetingForm
          meeting={editingMeeting}
          onSubmit={editingMeeting ?
            (data) => handleEdit(editingMeeting.id, data) :
            handleCreate
          }
          onCancel={() => {
            setIsMeetingFormOpen(false);
            setEditingMeeting(undefined);
          }}
        />
      )}
    </PageShell>
  );
}
