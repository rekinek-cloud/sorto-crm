'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  dashboardApi,
  smartDayPlannerApi, 
  type DailyWidgetData, 
  type QuickActionRequest,
  type TaskSuggestion 
} from '../../lib/api/smartDayPlanner';

// =============================================================================
// DAILY WIDGET COMPONENT - Dashboard Integration FAZA 3
// =============================================================================
// Widget dnia dla głównego dashboard z quick actions i timeline
// Autor: Claude Code 2025-07-07

interface DailyWidgetProps {
  className?: string;
  onTaskClick?: (taskId: string) => void;
  onBlockClick?: (blockId: string) => void;
  selectedDate?: string; // ISO date string
  onDateChange?: (date: string) => void;
}

const DailyWidget: React.FC<DailyWidgetProps> = ({ 
  className = '',
  onTaskClick,
  onBlockClick,
  selectedDate,
  onDateChange
}) => {
  const [data, setData] = useState<DailyWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  
  // Nawigacja między dniami
  const [currentDate, setCurrentDate] = useState<string>(
    selectedDate || new Date().toISOString().split('T')[0]
  );
  // NOWE: Sugestie następnych zadań
  const [nextSuggestions, setNextSuggestions] = useState<TaskSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  // NOWE: Skrócony dzień pracy
  const [showPartialDayModal, setShowPartialDayModal] = useState(false);
  const [partialDayEndTime, setPartialDayEndTime] = useState('14:00');
  const [partialDayStrategy, setPartialDayStrategy] = useState<'COMPRESS_BLOCKS' | 'RESCHEDULE_REMAINING'>('RESCHEDULE_REMAINING');
  const [processingPartialDay, setProcessingPartialDay] = useState(false);

  // Kolory dla poziomów energii
  const energyColors = {
    HIGH: 'bg-red-100 border-red-300 text-red-800',
    MEDIUM: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    LOW: 'bg-blue-100 border-blue-300 text-blue-800',
    CREATIVE: 'bg-purple-100 border-purple-300 text-purple-800',
    ADMINISTRATIVE: 'bg-gray-100 border-gray-300 text-gray-800'
  };

  const forecastColors = {
    HIGH: 'text-green-600 bg-green-50',
    MEDIUM: 'text-yellow-600 bg-yellow-50',
    LOW: 'text-red-600 bg-red-50'
  };

  useEffect(() => {
    fetchDailyWidget();
    
    // Auto-refresh co 5 minut
    const interval = setInterval(fetchDailyWidget, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // Aktualizuj currentDate gdy selectedDate się zmieni
  useEffect(() => {
    if (selectedDate && selectedDate !== currentDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  // Funkcja formatowania daty
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Dzisiaj";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Wczoraj";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Jutro";
    } else {
      return date.toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const fetchDailyWidget = async () => {
    try {
      setLoading(true);
      // Jeśli data nie jest dzisiejsza, używamy parametru date
      const response = currentDate === new Date().toISOString().split('T')[0] 
        ? await dashboardApi.getDailyWidget()
        : await dashboardApi.getDailyWidget(currentDate);
      
      if (response.success) {
        setData(response.data);
      } else {
        toast.error('Nie udało się pobrać danych dnia');
      }
    } catch (error: any) {
      console.error('Error fetching daily widget:', error);
      toast.error('Błąd podczas pobierania danych');
    } finally {
      setLoading(false);
    }
  };

  // Funkcje nawigacji między dniami
  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    const newDate = prev.toISOString().split('T')[0];
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    const newDate = next.toISOString().split('T')[0];
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    onDateChange?.(today);
  };

  // Formatowanie daty dla wyświetlenia
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Dzisiaj';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Wczoraj';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Jutro';
    } else {
      return date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const executeQuickAction = async (action: QuickActionRequest, actionId: string) => {
    try {
      setExecutingAction(actionId);
      
      const response = await dashboardApi.executeQuickAction(action);
      
      if (response.success) {
        toast.success(response.data.message || 'Akcja wykonana pomyślnie');
        await fetchDailyWidget(); // Refresh widget po akcji
      } else {
        toast.error('Nie udało się wykonać akcji');
      }
    } catch (error: any) {
      console.error('Error executing quick action:', error);
      toast.error('Błąd podczas wykonywania akcji');
    } finally {
      setExecutingAction(null);
    }
  };

  const handleAddUrgent = () => {
    const title = prompt('Tytuł pilnego zadania:');
    if (!title) return;

    const estimatedMinutes = parseInt(prompt('Szacowany czas (minuty):') || '30');
    const context = prompt('Kontekst (@computer, @calls, @office):') || '@computer';

    executeQuickAction({
      actionType: 'ADD_URGENT',
      data: { title, estimatedMinutes, context }
    }, 'add-urgent-task');
  };

  // NOWE: Pobierz sugestie następnych zadań
  const fetchNextSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      
      // Symulowane dane dla obecnie ukończonego zadania
      const currentBlock = data?.currentActivity.currentBlock;
      const availableMinutes = currentBlock ? 60 : 30; // Przykładowe 60 min dostępne
      
      const response = await smartDayPlannerApi.getNextTaskSuggestions({
        completedTaskId: 'current-task',
        availableMinutes,
        energyLevel: currentBlock?.energyLevel || 'MEDIUM',
        currentContext: '@computer'
      });

      if (response.success) {
        setNextSuggestions(response.data);
        setShowSuggestions(true);
        toast.success(`Znaleziono ${response.data.length} sugestii zadań`);
      } else {
        toast.error('Nie udało się pobrać sugestii');
      }
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      toast.error('Błąd podczas pobierania sugestii');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // NOWE: Obsługa skróconego dnia pracy
  const handlePartialDay = async () => {
    try {
      setProcessingPartialDay(true);
      
      const response = await smartDayPlannerApi.handlePartialDay({
        endTime: partialDayEndTime,
        strategy: partialDayStrategy
      });

      if (response.success) {
        const result = response.data;
        
        toast.success(`Dzień skrócony do ${result.summary.endTime}. ${
          result.strategy === 'COMPRESS_BLOCKS' 
            ? `Skompresowano ${result.summary.compressedBlocks} bloków`
            : `Przełożono ${result.summary.rescheduledTasks} zadań`
        }`);
        
        setShowPartialDayModal(false);
        await fetchDailyWidget(); // Refresh widget
        
        // Pokazuj ostrzeżenia jeśli są
        if (result.warnings.length > 0) {
          setTimeout(() => {
            result.warnings.forEach(warning => toast.error(warning));
          }, 1000);
        }
      } else {
        toast.error('Nie udało się przetworzyć skróconego dnia');
      }
    } catch (error: any) {
      console.error('Error handling partial day:', error);
      toast.error('Błąd podczas przetwarzania skróconego dnia');
    } finally {
      setProcessingPartialDay(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-gray-500">Brak danych dla dzisiejszego dnia</p>
      </div>
    );
  }

  const completionPercentage = data.summary.completionRate;
  const currentBlock = data.currentActivity.currentBlock;
  const nextBlock = data.currentActivity.nextBlock;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header z nawigacją między dniami */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Plan Dnia</h3>
              <p className="text-sm text-gray-600">{formatDisplayDate(currentDate)}</p>
              <p className="text-xs text-gray-500">{new Date(currentDate).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</p>
            </div>
          </div>
          
          {/* Nawigacja między dniami */}
          <div className="flex items-center space-x-2">
            {/* Przycisk poprzedni dzień */}
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Poprzedni dzień"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Przycisk dzisiaj (tylko jeśli nie jest dzisiaj) */}
            {currentDate !== new Date().toISOString().split('T')[0] && (
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                title="Wróć do dzisiaj"
              >
                Dzisiaj
              </button>
            )}
            
            {/* Przycisk następny dzień */}
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Następny dzień"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Przycisk odśwież */}
            <div className="border-l border-gray-300 pl-2 ml-2">
              <button
                onClick={fetchDailyWidget}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                title="Odśwież dane"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Główne statystyki */}
      <div className="px-6 py-4 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalBlocks}</div>
            <div className="text-xs text-gray-500">Bloki czasowe</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.completedTasks}</div>
            <div className="text-xs text-gray-500">Ukończone</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.summary.inProgressTasks}</div>
            <div className="text-xs text-gray-500">W toku</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completionPercentage}%</div>
            <div className="text-xs text-gray-500">Realizacja</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Postęp dnia</span>
            <span>{data.summary.completedTasks}/{data.summary.totalTasks} zadań</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bieżąca aktywność */}
      <div className="px-6 py-4 border-b">
        <h4 className="font-medium text-gray-900 mb-3">Bieżąca aktywność</h4>
        
        {currentBlock ? (
          <div 
            className={`p-3 rounded-lg border-2 hover:shadow-md transition-all ${energyColors[currentBlock.energyLevel]}`}
            onClick={() => {
              // ZMIANA: W dashboard nie przekierowuj do block view - wyłącz kliknięcie na blok
              // Użytkownicy powinni klikać na konkretne zadania zamiast na bloki
              console.log('Block clicked - użyj kliknięć na zadania zamiast bloku');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{currentBlock.name}</div>
                <div className="text-sm opacity-75">
                  {currentBlock.startTime} - {currentBlock.endTime}
                  {currentBlock.isBreak && (
                    <span className="ml-2 px-2 py-1 bg-white/50 rounded text-xs">Przerwa</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{currentBlock.activeTasks.length} zadań</div>
                <div className="text-xs">aktywnych</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm">Brak aktywnego bloku czasowego</p>
          </div>
        )}

        {/* Następny blok */}
        {nextBlock && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Następny:</p>
            <div 
              className={`p-2 rounded border hover:shadow-sm transition-all ${energyColors[nextBlock.energyLevel]} opacity-70`}
              onClick={() => {
                // ZMIANA: W dashboard nie przekierowuj do block view - wyłącz kliknięcie na blok
                // Użytkownicy powinni klikać na konkretne zadania zamiast na bloki
                console.log('Next block clicked - użyj kliknięć na zadania zamiast bloku');
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">{nextBlock.name}</div>
                  <div className="text-xs">o {nextBlock.startTime}</div>
                </div>
                <div className="text-xs">{nextBlock.upcomingTasks.length} zadań</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="px-6 py-4 border-b">
        <h4 className="font-medium text-gray-900 mb-3">Insights</h4>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Prognoza dnia:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${forecastColors[data.insights.todayForecast]}`}>
            {data.insights.todayForecast === 'HIGH' ? 'Wysoka produktywność' :
             data.insights.todayForecast === 'MEDIUM' ? 'Średnia produktywność' :
             'Wyzwania'}
          </span>
        </div>

        {data.insights.recommendations.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 {data.insights.recommendations[0]}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 border-b">
        <h4 className="font-medium text-gray-900 mb-3">Szybkie akcje</h4>
        
        <div className="grid grid-cols-1 gap-2">
          {data.quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.type === 'ADD_URGENT') {
                  handleAddUrgent();
                } else {
                  executeQuickAction({
                    actionType: action.type as any,
                    targetId: action.target
                  }, action.id);
                }
              }}
              disabled={executingAction === action.id}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="text-sm font-medium">{action.label}</span>
              {executingAction === action.id ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
          
          {/* NOWE: Przycisk sugestii następnych zadań */}
          <button
            onClick={fetchNextSuggestions}
            disabled={loadingSuggestions}
            className="flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 border border-indigo-200"
          >
            <span className="text-sm font-medium text-indigo-800">💡 Co dalej? (Sugestie zadań)</span>
            {loadingSuggestions ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
          </button>
          
          {/* NOWE: Przycisk skróconego dnia pracy */}
          <button
            onClick={() => setShowPartialDayModal(true)}
            className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
          >
            <span className="text-sm font-medium text-orange-800">⏰ Skrócę dzień pracy</span>
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Daily Planner - Papierowy styl XXI wieku */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            📋 Plan dnia
          </h4>
          <div className="text-xs text-gray-500">
            {data.timeline.length} bloków czasowych
          </div>
        </div>
        
        {/* Nowoczesny papierowy planner */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 shadow-sm">
          {/* Header dnia */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {currentDate ? new Date(currentDate).getDate() : new Date().getDate()}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {formatDateDisplay(currentDate)}
                </div>
                <div className="text-xs text-gray-600">
                  {data.summary.totalTasks} zadań • {data.summary.completionRate}% wykonane
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Status dnia</div>
              <div className={`text-sm font-medium ${
                data.summary.completionRate >= 80 ? 'text-green-600' :
                data.summary.completionRate >= 50 ? 'text-yellow-600' :
                'text-orange-600'
              }`}>
                {data.summary.completionRate >= 80 ? '🎯 Produktywny' :
                 data.summary.completionRate >= 50 ? '⚡ W toku' :
                 '🔥 Intensywny'}
              </div>
            </div>
          </div>
          
          {/* Timeline jak w papierowym plannerze */}
          <div className="space-y-1">
            {data.timeline.map((block, index) => (
              <div
                key={block.id}
                className={`group relative transition-all duration-200 ${
                  block.isActive ? 'scale-102 shadow-md' : 'hover:scale-101'
                }`}
                onClick={() => {
                  // ZMIANA: W dashboard nie przekierowuj do block view - wyłącz kliknięcie na blok
                  // Użytkownicy powinni klikać na konkretne zadania zamiast na bloki
                  console.log('Timeline block clicked - użyj kliknięć na zadania zamiast bloku');
                }}
              >
                {/* Linia czasu po lewej */}
                <div className="flex items-start gap-3">
                  {/* Pionowa linia i godzina */}
                  <div className="flex flex-col items-center w-16 flex-shrink-0">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {block.startTime}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      block.isActive ? 'bg-blue-500 border-blue-500 shadow-lg' :
                      block.isNext ? 'bg-yellow-400 border-yellow-400' :
                      block.isBreak ? 'bg-gray-300 border-gray-400' :
                      block.energyLevel === 'HIGH' ? 'bg-red-400 border-red-500' :
                      block.energyLevel === 'MEDIUM' ? 'bg-yellow-300 border-yellow-400' :
                      block.energyLevel === 'LOW' ? 'bg-blue-300 border-blue-400' :
                      block.energyLevel === 'CREATIVE' ? 'bg-purple-400 border-purple-500' :
                      'bg-gray-300 border-gray-400'
                    }`}>
                      {block.isActive && (
                        <div className="w-2 h-2 bg-white rounded-full m-auto animate-pulse"></div>
                      )}
                    </div>
                    {index < data.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  
                  {/* Zawartość bloku */}
                  <div className={`flex-1 min-w-0 p-3 rounded-lg border transition-all ${
                    block.isActive ? 'bg-blue-50 border-blue-200 shadow-sm' :
                    block.isNext ? 'bg-yellow-50 border-yellow-200' :
                    block.isBreak ? 'bg-gray-50 border-gray-200' :
                    'bg-white border-gray-200 group-hover:border-gray-300 group-hover:shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900 truncate">
                            {block.name}
                          </h5>
                          {block.isBreak && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              Przerwa
                            </span>
                          )}
                          {block.isActive && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium animate-pulse">
                              TERAZ
                            </span>
                          )}
                          {block.isNext && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                              NASTĘPNY
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{block.startTime} - {block.endTime}</span>
                          {!block.isBreak && (
                            <span className={`px-2 py-0.5 rounded ${
                              block.energyLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                              block.energyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              block.energyLevel === 'LOW' ? 'bg-blue-100 text-blue-700' :
                              block.energyLevel === 'CREATIVE' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {block.energyLevel === 'HIGH' ? '🔥 Wysoka energia' :
                               block.energyLevel === 'MEDIUM' ? '⚡ Średnia energia' :
                               block.energyLevel === 'LOW' ? '🌊 Niska energia' :
                               block.energyLevel === 'CREATIVE' ? '🎨 Kreatywny' :
                               '📋 Administracyjny'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status zadań */}
                      <div className="text-right flex-shrink-0 ml-3">
                        {block.tasksCount > 0 ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {block.completedTasksCount}/{block.tasksCount}
                            </div>
                            <div className="text-xs text-gray-500">zadań</div>
                            {/* Mini progress bar */}
                            <div className="w-12 h-1 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-1 bg-green-500 rounded-full transition-all"
                                style={{ 
                                  width: `${block.tasksCount > 0 ? (block.completedTasksCount / block.tasksCount) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            Brak zadań
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Lista zadań w bloku */}
                    {(block as any).scheduledTasks && (block as any).scheduledTasks.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {(block as any).scheduledTasks.slice(0, 3).map((task: any, taskIndex: number) => (
                          <div
                            key={task.id || taskIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Task clicked:', task.id, task.title);
                              
                              // Sprawdź czy to scheduled task (Smart Day Planner) czy zwykły task
                              if (task.id && task.id.length > 10) {
                                // POPRAWKA: Scheduled tasks z Smart Day Planner nie mają strony szczegółów
                                // Pokazujemy alert zamiast próby przekierowania na nieistniejącą stronę
                                alert(`Szczegóły zadania:\n\nTytuł: ${task.title}\nStatus: ${task.status}\nPriorytet: ${task.priority}\nCzas: ${task.estimatedMinutes}min\n\nTo jest zadanie zaplanowane w Smart Day Planner.\nAby zobaczyć pełne szczegóły, przejdź do Smart Day Planner.`);
                              } else {
                                console.log('Task bez ID - prawdopodobnie mock data');
                              }
                            }}
                            className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded border cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                task.status === 'COMPLETED' ? 'bg-green-500' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                task.status === 'OVERDUE' ? 'bg-red-500' :
                                'bg-gray-400'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${
                                  task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center space-x-2">
                                  <span>⏱️ {task.estimatedMinutes}min</span>
                                  <span className={`px-1 py-0.5 rounded text-xs ${
                                    task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(block as any).scheduledTasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{(block as any).scheduledTasks.length - 3} więcej zadań
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer plannera */}
          <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>🔥 {data.timeline.filter(b => b.energyLevel === 'HIGH').length} high energy</span>
              <span>⚡ {data.timeline.filter(b => b.energyLevel === 'MEDIUM').length} medium</span>
              <span>🌊 {data.timeline.filter(b => b.energyLevel === 'LOW').length} low</span>
            </div>
            <div>
              Łącznie: {Math.round(data.timeline.reduce((sum, b) => {
                const [startH, startM] = b.startTime.split(':').map(Number);
                const [endH, endM] = b.endTime.split(':').map(Number);
                return sum + ((endH * 60 + endM) - (startH * 60 + startM));
              }, 0) / 60 * 10) / 10}h
            </div>
          </div>
        </div>
      </div>

      {/* NOWE: Modal z sugestiami następnych zadań */}
      {showSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">💡 Sugestie następnych zadań</h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Masz wolny czas? Oto zadania które możesz wykonać teraz:
              </p>

              <div className="space-y-3">
                {nextSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            suggestion.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>⏱️ {suggestion.estimatedMinutes} min</span>
                          <span>🎯 {suggestion.context}</span>
                          <span className={`px-2 py-1 rounded ${
                            suggestion.source === 'SCHEDULED_LATER' ? 'bg-blue-100 text-blue-700' :
                            suggestion.source === 'GTD_INBOX' || suggestion.source === 'PROJECT_BACKLOG' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {suggestion.source === 'SCHEDULED_LATER' ? 'Zaplanowane później' :
                             suggestion.source === 'GTD_INBOX' || suggestion.source === 'PROJECT_BACKLOG' ? 'Źródło' :
                             'Quick Win'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2 italic">{suggestion.reason}</p>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-indigo-600 mb-1">{suggestion.score}</div>
                        <div className="text-xs text-gray-500">score</div>
                        
                        <button 
                          onClick={() => {
                            toast.success(`Rozpoczynam: ${suggestion.title}`);
                            setShowSuggestions(false);
                            // Tu można dodać logikę rozpoczęcia zadania
                          }}
                          className="mt-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                        >
                          Rozpocznij
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {nextSuggestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>Brak sugestii zadań. Możesz odpocząć lub przejść do Smart Day Planner!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOWE: Modal skróconego dnia pracy */}
      {showPartialDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">⏰ Skrócenie dnia pracy</h3>
                <button
                  onClick={() => setShowPartialDayModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O której kończysz pracę?
                  </label>
                  <input
                    type="time"
                    value={partialDayEndTime}
                    onChange={(e) => setPartialDayEndTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Co zrobić z pozostałymi zadaniami?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="RESCHEDULE_REMAINING"
                        checked={partialDayStrategy === 'RESCHEDULE_REMAINING'}
                        onChange={(e) => setPartialDayStrategy(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">📅 Przełóż na jutro (zalecane)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="COMPRESS_BLOCKS"
                        checked={partialDayStrategy === 'COMPRESS_BLOCKS'}
                        onChange={(e) => setPartialDayStrategy(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">⚡ Skompresuj bloki czasowe</span>
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {partialDayStrategy === 'RESCHEDULE_REMAINING' 
                      ? '📋 Zadania po tej godzinie zostaną przełożone na jutro z zachowaniem priorytetów.'
                      : '⚠️ Bloki czasowe zostaną skrócone o 30%. Może to wpłynąć na jakość wykonania zadań.'
                    }
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowPartialDayModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handlePartialDay}
                    disabled={processingPartialDay}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {processingPartialDay ? 'Przetwarzam...' : 'Potwierdź'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyWidget;