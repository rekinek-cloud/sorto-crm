'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { calendarApi, CalendarEvent, CalendarEventsResponse, CalendarFilters } from '@/lib/api/calendar';
import { recurringTasksApi } from '@/lib/api/recurring';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Calendar as CalendarIcon,
  Clock,
  User,
  Building2,
  Target,
  Loader2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

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
  const polishDays = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const polishDaysShort = ['Nie', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'];
  const polishMonths = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  // Type colors and labels
  const typeInfo = {
    TASK: { label: 'Zadania', color: '#3B82F6', emoji: '📋' },
    PROJECT: { label: 'Projekty', color: '#10B981', emoji: '🎯' },
    MEETING: { label: 'Spotkania', color: '#8B5CF6', emoji: '📞' },
    RECURRING_TASK: { label: 'Zadania cykliczne', color: '#F59E0B', emoji: '🔄' },
    DEAL: { label: 'Deale', color: '#EF4444', emoji: '💰' },
    NEXT_ACTION: { label: 'Następne akcje', color: '#06B6D4', emoji: '⚡' },
    HABIT: { label: 'Nawyki', color: '#14B8A6', emoji: '🎯' },
    INVOICE: { label: 'Faktury', color: '#6366F1', emoji: '📄' },
    WEEKLY_REVIEW: { label: 'Przeglądy tygodniowe', color: '#14B8A6', emoji: '📊' }
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
      console.log(`📅 Loaded ${response.events.length} calendar events`);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('Błąd podczas ładowania wydarzeń kalendarza');
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
        alert(`✅ Wygenerowano ${result.generated} zadań z zadań cyklicznych!`);
        await loadEvents(); // Refresh calendar
      } else {
        alert('📝 Brak zadań cyklicznych do wygenerowania');
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
      alert('❌ Błąd podczas generowania zadań');
    } finally {
      setGeneratingTasks(false);
    }
  };

  // Get view date range
  const getViewStartDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      // First day of month
      date.setDate(1);
      // Go back to start of week (Sunday)
      date.setDate(date.getDate() - date.getDay());
    } else if (view === 'week') {
      // Start of week (Sunday)
      date.setDate(date.getDate() - date.getDay());
    } else {
      // List view - show 2 weeks before
      date.setDate(date.getDate() - 14);
    }
    return date;
  };

  const getViewEndDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      // Last day of month
      date.setMonth(date.getMonth() + 1, 0);
      // Go forward to end of week (Saturday)
      date.setDate(date.getDate() + (6 - date.getDay()));
    } else if (view === 'week') {
      // End of week (Saturday)
      date.setDate(date.getDate() - date.getDay() + 6);
    } else {
      // List view - show 6 weeks forward
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
    
    for (let i = 0; i < 42; i++) { // 6 weeks x 7 days
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Ładowanie kalendarza...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Kalendarz Integrowany
          </h1>
          <p className="text-gray-600 mt-1">
            Wszystkie wydarzenia z datami w jednym miejscu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={generateRecurringTasks}
            disabled={generatingTasks}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {generatingTasks ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Generuj zadania
          </Button>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'default' : 'outline'}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtry
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtry kalendarza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Typ wydarzeń</label>
                <select
                  value={filters.types || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, types: e.target.value || undefined }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Wszystkie typy</option>
                  <option value="TASK">📋 Zadania</option>
                  <option value="PROJECT">🎯 Projekty</option>
                  <option value="MEETING">📞 Spotkania</option>
                  <option value="RECURRING_TASK">🔄 Zadania cykliczne</option>
                  <option value="DEAL">💰 Deale</option>
                  <option value="NEXT_ACTION">⚡ Następne akcje</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priorytet</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any || undefined }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Wszystkie priorytety</option>
                  <option value="URGENT">🔴 Pilne</option>
                  <option value="HIGH">🟠 Wysokie</option>
                  <option value="MEDIUM">🟡 Średnie</option>
                  <option value="LOW">🔵 Niskie</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => setFilters({})}
                  variant="outline"
                  className="w-full"
                >
                  Wyczyść filtry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={navigatePrevious} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button onClick={navigateToday} variant="outline" size="sm">
            Dziś
          </Button>
          
          <Button onClick={navigateNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold ml-4">
            {view === 'month' && `${polishMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'week' && `Tydzień ${getViewStartDate().getDate()}-${getViewEndDate().getDate()} ${polishMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {view === 'list' && 'Lista wydarzeń'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setView('month')}
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            Miesiąc
          </Button>
          <Button
            onClick={() => setView('week')}
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            Tydzień
          </Button>
          <Button
            onClick={() => setView('list')}
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
          >
            Lista
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(typeInfo).map(([type, info]) => {
          const count = events.filter(e => e.type === type).length;
          if (count === 0) return null;
          
          return (
            <Card key={type} className="p-3">
              <div className="text-center">
                <div className="text-lg font-semibold" style={{ color: info.color }}>
                  {info.emoji} {count}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {info.label}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Calendar Views */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month View */}
      {view === 'month' && (
        <Card>
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {polishDaysShort.map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-50 rounded">
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
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded text-white truncate"
                          style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          title={`${event.title} - ${event.description || ''}`}
                        >
                          {typeInfo[event.type]?.emoji} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} więcej
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {view === 'week' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-4">
              {generateWeekDays().map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={index} className="space-y-2">
                    <div className={`text-center p-2 rounded ${isToday ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-50'}`}>
                      <div className="text-sm">{polishDaysShort[date.getDay()]}</div>
                      <div className="text-lg">{date.getDate()}</div>
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded text-white"
                          style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          title={event.description}
                        >
                          <div className="font-medium">{formatTime(event.startDate)}</div>
                          <div>{typeInfo[event.type]?.emoji} {event.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak wydarzeń</h3>
                <p className="text-gray-600">Nie znaleziono wydarzeń w wybranym okresie.</p>
              </CardContent>
            </Card>
          ) : (
            // Group events by date
            Object.entries(calendarApi.groupEventsByDate(events))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dayEvents]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {new Date(date).toLocaleDateString('pl-PL', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dayEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: calendarApi.getEventColor(event) }}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {typeInfo[event.type]?.emoji} {event.title}
                              </span>
                              {event.priority && (
                                <Badge variant="outline" className="text-xs">
                                  {event.priority === 'URGENT' && '🔴 Pilne'}
                                  {event.priority === 'HIGH' && '🟠 Wysokie'}
                                  {event.priority === 'MEDIUM' && '🟡 Średnie'}
                                  {event.priority === 'LOW' && '🔵 Niskie'}
                                </Badge>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;