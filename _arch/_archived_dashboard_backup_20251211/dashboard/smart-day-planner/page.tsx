'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  smartDayPlannerApi, 
  type TimeBlock, 
  type ScheduledTask,
  type DailySchedule,
  type FocusMode,
  type PerformanceInsights,
  type AIRecommendation,
  type UserPattern,
  type PatternLearningInsights,
  type DayTemplate
} from '../../../lib/api/smartDayPlanner';
import TimeBlockModal from '../../../components/smart-day-planner/TimeBlockModal';
import TemplateGeneratorModal from '../../../components/smart-day-planner/TemplateGeneratorModal';

// =============================================================================
// SMART DAY PLANNER - FRONTEND INTERFACE  
// =============================================================================
// System inteligentnego planowania dnia z energią, przerwami i kontekstami
// Autor: Claude Code 2025-07-07

const SmartDayPlannerPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showFocusModesPanel, setShowFocusModesPanel] = useState(false);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [learningInsights, setLearningInsights] = useState<PatternLearningInsights | null>(null);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  // Weekly Templates - FAZA 1
  const [showWeeklySetup, setShowWeeklySetup] = useState(false);
  const [currentWeeklyTemplate, setCurrentWeeklyTemplate] = useState<any>(null);
  const [weeklyTemplates, setWeeklyTemplates] = useState<DayTemplate[]>([]);
  const fetchingRef = useRef(false);
  
  // Event Creation Modal - NOWE
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    selectedDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    context: '@computer',
    energyRequired: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'CREATIVE' | 'ADMINISTRATIVE'
  });

  // Database Tasks Loading - NOWE
  const [loadedTasks, setLoadedTasks] = useState<any[]>([]);
  const [showTasksPanel, setShowTasksPanel] = useState(false);
  const [tasksStats, setTasksStats] = useState<any>(null);

  // View Mode State - NOWE
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [weekData, setWeekData] = useState<any>(null);
  const [monthData, setMonthData] = useState<any>(null);

  // Kolory dla poziomów energii
  const energyColors = {
    HIGH: 'bg-red-100 border-red-300 text-red-800',
    MEDIUM: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    LOW: 'bg-blue-100 border-blue-300 text-blue-800',
    CREATIVE: 'bg-purple-100 border-purple-300 text-purple-800',
    ADMINISTRATIVE: 'bg-gray-100 border-gray-300 text-gray-800'
  };

  const priorityColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800', 
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };

  // Helper functions
  const getEnergyIcon = (energyLevel: string) => {
    const icons = {
      HIGH: '⚡',
      MEDIUM: '🔋',
      LOW: '🔌',
      CREATIVE: '🎨',
      ADMINISTRATIVE: '📈'
    };
    return icons[energyLevel as keyof typeof icons] || '🔋';
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchDailySchedule(),
          fetchFocusModes(),
          fetchPerformanceInsights(),
          fetchAIData(),
          fetchTemplates(),
          fetchCurrentWeeklyTemplate()
        ]);
      } finally {
        fetchingRef.current = false;
      }
    };
    
    fetchAllData();
  }, [selectedDate]);

  const fetchAIData = async () => {
    try {
      const [recommendationsResponse, patternsResponse, insightsResponse] = await Promise.all([
        smartDayPlannerApi.getAIRecommendations(),
        smartDayPlannerApi.getUserPatterns(),
        smartDayPlannerApi.getLearningInsights()
      ]);

      if (recommendationsResponse.success) {
        setAIRecommendations(recommendationsResponse.data);
      }
      if (patternsResponse.success) {
        setUserPatterns(patternsResponse.data);
      }
      if (insightsResponse.success) {
        setLearningInsights(insightsResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching AI data:', error);
    }
  };

  const fetchDailySchedule = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Pobierz harmonogram na wybrany dzień  
      const scheduleResponse = await smartDayPlannerApi.getDailySchedule(dateStr);
      
      // Pobierz też wszystkie dostępne bloki czasowe (bez filtra daty)
      const allBlocksResponse = await smartDayPlannerApi.getTimeBlocks();
      
      if (scheduleResponse.success) {
        setDailySchedule(scheduleResponse.data);
        
        // Użyj wszystkich bloków zamiast tylko tych z harmonogramu
        if (allBlocksResponse.success) {
          // Połącz dane z harmonogramu (zaplanowane zadania) z wszystkimi blokami
          const allBlocks = allBlocksResponse.data.map((block: any) => {
            const scheduleBlock = scheduleResponse.data.timeBlocks.find((sb: any) => sb.id === block.id);
            return {
              ...block,
              scheduledTasks: scheduleBlock?.scheduledTasks || []
            };
          });
          setTimeBlocks(allBlocks);
        } else {
          setTimeBlocks(scheduleResponse.data.timeBlocks);
        }
      }
    } catch (error: any) {
      console.error('Error fetching daily schedule:', error);
      toast.error('Błąd podczas pobierania harmonogramu');
    } finally {
      setLoading(false);
    }
  };

  const fetchFocusModes = async () => {
    try {
      const response = await smartDayPlannerApi.getFocusModes();
      if (response.success) {
        setFocusModes(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching focus modes:', error);
    }
  };

  const fetchPerformanceInsights = async () => {
    try {
      const response = await smartDayPlannerApi.getPerformanceInsights('30d');
      if (response.success) {
        setPerformanceInsights(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching performance insights:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await smartDayPlannerApi.getTemplates();
      if (response.success) {
        setTemplates(response.data);
        // Also fetch weekly templates
        setWeeklyTemplates(response.data.filter(t => (t as any).weeklyTemplate));
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  // Weekly Templates Functions - FAZA 1
  const fetchCurrentWeeklyTemplate = async () => {
    try {
      const monday = getMonday(selectedDate);
      console.log('🗓️ Fetching weekly template for Monday:', monday.toISOString().split('T')[0]);
      
      const response = await smartDayPlannerApi.getCurrentWeeklyTemplate(
        monday.toISOString().split('T')[0]
      );
      
      console.log('📋 Weekly template response:', response);
      
      if (response.success && response.data) {
        setCurrentWeeklyTemplate(response.data);
        console.log('✅ Weekly template set:', response.data);
      } else {
        console.log('❌ Weekly template not found or failed:', response);
        toast.error('Błąd podczas pobierania danych tygodnia');
      }
    } catch (error: any) {
      console.error('💥 Error fetching current weekly template:', error);
      toast.error('Błąd podczas pobierania danych tygodnia');
    }
  };

  const handleQuickWeeklySetup = async (config: any) => {
    try {
      setLoading(true);
      const monday = getMonday(selectedDate);
      
      const response = await smartDayPlannerApi.quickWeeklySetup({
        ...config,
        weekStartDate: monday.toISOString().split('T')[0]
      });

      if (response.success) {
        toast.success(response.message);
        await fetchDailySchedule();
        await fetchCurrentWeeklyTemplate();
        setShowWeeklySetup(false);
      }
    } catch (error: any) {
      console.error('Error in quick weekly setup:', error);
      toast.error('Błąd podczas tworzenia szablonu tygodniowego');
    } finally {
      setLoading(false);
    }
  };

  const applyWeeklyTemplate = async (template: DayTemplate) => {
    try {
      setLoading(true);
      const monday = getMonday(selectedDate);
      
      const response = await smartDayPlannerApi.applyWeeklyTemplate(template.id, {
        weekStartDate: monday.toISOString().split('T')[0]
      });

      if (response.success) {
        toast.success(response.message);
        await fetchDailySchedule();
        await fetchCurrentWeeklyTemplate();
      }
    } catch (error: any) {
      console.error('Error applying weekly template:', error);
      toast.error('Błąd podczas aplikowania szablonu tygodniowego');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get Monday of the week
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };

  const applyTemplate = async (template: DayTemplate) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const response = await smartDayPlannerApi.applyTemplate(template.id, {
        date: dateStr,
        modifications: [] // No modifications for now
      });

      if (response.success) {
        toast.success(`Szablon "${template.name}" został zastosowany na dzień ${dateStr}!`);
        
        // Refresh data to show applied blocks
        await fetchDailySchedule();
        
        // Update template usage count
        await fetchTemplates();
      }
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast.error(`Błąd podczas aplikowania szablonu: ${error}`);
    }
  };

  // Load Tasks from Database - NOWE
  const loadTasksFromDatabase = async () => {
    setLoading(true);
    try {
      const targetDate = selectedDate.toISOString().split('T')[0];
      
      // Pobierz zadania z różnych źródeł bazy danych
      const response = await smartDayPlannerApi.getTaskQueue({
        date: targetDate,
        includeInbox: true,
        includeProjects: true,
        includeRecurring: true
      });

      if (response.success && response.data) {
        const { tasks, statistics } = response.data;
        
        // Zapisz załadowane zadania i statystyki
        setLoadedTasks(tasks);
        setTasksStats(statistics);
        setShowTasksPanel(true);
        
        // Pokaż statystyki załadowanych zadań
        toast.success(
          `Załadowano ${statistics.total} zadań:\n` +
          `• GTD Inbox: ${statistics.bySource.gtdInbox}\n` +
          `• Projekty: ${statistics.bySource.projects}\n` +
          `• Cykliczne: ${statistics.bySource.recurring}`,
          { duration: 5000 }
        );

        // Automatycznie przypisz zadania do bloków czasowych
        if (tasks.length > 0) {
          const assignmentResponse = await smartDayPlannerApi.smartAssignment({
            date: targetDate,
            tasks: tasks,
            strategy: 'BALANCED',
            saveAssignments: true
          });

          if (assignmentResponse.success) {
            const { assignments, statistics: assignStats } = assignmentResponse.data;
            
            // Odśwież harmonogram
            await fetchDailySchedule();
            
            toast.success(
              `Przypisano ${assignStats.assignedTasks}/${assignStats.totalTasks} zadań\n` +
              `Wykorzystano ${assignStats.blocksUsed}/${assignStats.totalBlocks} bloków`,
              { duration: 4000 }
            );
            
            // Jeśli są nieprzypisane zadania, pokaż informację
            if (assignStats.unassignedTasks > 0) {
              toast(
                `${assignStats.unassignedTasks} zadań nie mogło być przypisanych. Sprawdź dostępność bloków czasowych.`,
                { duration: 6000, icon: '⚠️' }
              );
            }
          }
        } else {
          toast('Brak zadań do załadowania z bazy danych');
        }
      }
    } catch (error: any) {
      console.error('Error loading tasks from database:', error);
      toast.error('Błąd podczas ładowania zadań z bazy');
    } finally {
      setLoading(false);
    }
  };

  const scheduleTasksAutomatically = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Pobierz zadania z API (przykładowe zadania na demo)
      const tasks = [
        {
          title: "Code Review",
          description: "Review pull requests",
          estimatedMinutes: 60,
          priority: "HIGH" as const,
          context: "@computer",
          energyRequired: "HIGH" as const
        },
        {
          title: "Email Response", 
          description: "Respond to important emails",
          estimatedMinutes: 30,
          priority: "MEDIUM" as const,
          context: "@computer",
          energyRequired: "MEDIUM" as const
        }
      ];

      const response = await smartDayPlannerApi.scheduleTasks({
        date: dateStr,
        tasks,
        strategy: 'ENERGY_MATCH'
      });

      if (response.success) {
        await fetchDailySchedule();
        const data = response.data as any;
        toast.success(`Zaplanowano ${data.scheduledCount || 0} z ${data.statistics?.totalTasks || 0} zadań`);
      }
    } catch (error: any) {
      console.error('Error scheduling tasks:', error);
      toast.error('Błąd podczas automatycznego planowania');
    } finally {
      setLoading(false);
    }
  };

  // Event Creation Function - NOWE
  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      
      // Utwórz zaplanowane zadanie na konkretną datę
      const eventData = {
        title: eventFormData.title,
        description: eventFormData.description,
        estimatedMinutes: calculateEventDuration(eventFormData.startTime, eventFormData.endTime),
        priority: eventFormData.priority,
        context: eventFormData.context,
        energyRequired: eventFormData.energyRequired,
        scheduledDate: new Date(`${eventFormData.selectedDate}T${eventFormData.startTime}:00`).toISOString(),
        status: 'PLANNED' as const,
        wasRescheduled: false,
        specificTimeSlot: {
          date: eventFormData.selectedDate,
          startTime: eventFormData.startTime,
          endTime: eventFormData.endTime
        }
      };

      const response = await smartDayPlannerApi.createScheduledTask(eventData as any);
      
      if (response.success) {
        // Odśwież harmonogram
        await fetchDailySchedule();
        
        // Wyczyść formularz
        setEventFormData({
          title: '',
          description: '',
          selectedDate: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
          priority: 'MEDIUM',
          context: '@computer',
          energyRequired: 'MEDIUM'
        });
        
        setShowEventModal(false);
        toast.success(`Utworzono wydarzenie: ${eventFormData.title}`);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error('Błąd podczas tworzenia wydarzenia');
    } finally {
      setLoading(false);
    }
  };

  // Helper function do kalkulacji czasu trwania
  const calculateEventDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  const handleCreateBlock = async (blockData: any) => {
    try {
      const response = await smartDayPlannerApi.createTimeBlock(blockData);
      if (response.success) {
        await fetchDailySchedule();
        toast.success('Blok czasowy został utworzony');
      }
    } catch (error: any) {
      console.error('Error creating time block:', error);
      toast.error('Błąd podczas tworzenia bloku');
    }
  };

  const handleUpdateBlock = async (blockData: any) => {
    if (!editingBlock) return;
    
    try {
      const response = await smartDayPlannerApi.updateTimeBlock(editingBlock.id, blockData);
      if (response.success) {
        await fetchDailySchedule();
        toast.success('Blok czasowy został zaktualizowany');
      }
    } catch (error: any) {
      console.error('Error updating time block:', error);
      toast.error('Błąd podczas aktualizacji bloku');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten blok czasowy?')) return;
    
    try {
      const response = await smartDayPlannerApi.deleteTimeBlock(blockId);
      if (response.success) {
        await fetchDailySchedule();
        toast.success('Blok czasowy został usunięty');
      }
    } catch (error: any) {
      console.error('Error deleting time block:', error);
      toast.error('Błąd podczas usuwania bloku');
    }
  };

  // Navigation Functions - NOWE
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const getDateRangeDisplay = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  };

  // Fetch Week Data
  const fetchWeekData = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('🗓️ Fetching week data for:', dateStr);
      console.log('🔍 smartDayPlannerApi functions:', Object.keys(smartDayPlannerApi));
      console.log('🔍 getWeeklySchedule exists:', typeof smartDayPlannerApi.getWeeklySchedule);
      
      if (typeof smartDayPlannerApi.getWeeklySchedule !== 'function') {
        console.error('❌ getWeeklySchedule is not a function!');
        toast.error('Funkcja getWeeklySchedule nie istnieje - wymagany restart aplikacji');
        return;
      }
      
      const weekSchedule = await smartDayPlannerApi.getWeeklySchedule(dateStr);
      console.log('📊 Week schedule result:', weekSchedule);
      
      if (weekSchedule.success) {
        setWeekData(weekSchedule.data);
        console.log('✅ Week data set:', weekSchedule.data);
      } else {
        console.log('❌ Week schedule failed:', weekSchedule);
        toast.error('Nie udało się załadować danych tygodnia');
      }
    } catch (error: any) {
      console.error('💥 Error fetching week data:', error);
      toast.error('Błąd podczas pobierania danych tygodnia');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Month Data  
  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1; // API expects 1-based month
      
      const monthSchedule = await smartDayPlannerApi.getMonthlySchedule(year, month);
      
      if (monthSchedule.success) {
        setMonthData(monthSchedule.data);
      } else {
        toast.error('Nie udało się załadować danych miesiąca');
      }
    } catch (error: any) {
      console.error('Error fetching month data:', error);
      toast.error('Błąd podczas pobierania danych miesiąca');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when view mode or date changes
  useEffect(() => {
    if (viewMode === 'week') {
      fetchWeekData();
    } else if (viewMode === 'month') {
      fetchMonthData();
    } else {
      fetchDailySchedule();
    }
  }, [viewMode, selectedDate]);

  const handleDeleteBlock2 = async (blockId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten blok czasowy?')) return;
    
    try {
      const response = await smartDayPlannerApi.deleteTimeBlock(blockId);
      if (response.success) {
        await fetchDailySchedule();
        toast.success('Blok czasowy został usunięty');
      }
    } catch (error: any) {
      console.error('Error deleting time block:', error);
      toast.error('Błąd podczas usuwania bloku');
    }
  };

  const handleAssignFocusMode = async (blockId: string, focusModeId: string | null) => {
    try {
      const response = await smartDayPlannerApi.assignFocusModeToBlock(blockId, focusModeId);
      if (response.success) {
        await fetchDailySchedule();
        const modeName = focusModes.find(m => m.id === focusModeId)?.name || 'Brak';
        toast.success(`Przypisano tryb koncentracji: ${modeName}`);
      }
    } catch (error: any) {
      console.error('Error assigning focus mode:', error);
      toast.error('Błąd podczas przypisywania trybu koncentracji');
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };


  const handleDetectPatterns = async () => {
    setLoading(true);
    try {
      const response = await smartDayPlannerApi.detectUserPatterns(30);
      if (response.success) {
        toast.success(`Wykryto ${response.data.patterns.length} wzorców, zapisano ${response.data.stored} nowych`);
        await fetchAIData();
      }
    } catch (error: any) {
      console.error('Error detecting patterns:', error);
      toast.error('Błąd podczas wykrywania wzorców');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (recommendation: AIRecommendation, accept: boolean) => {
    try {
      // Find pattern ID if available - simplified for demo
      const patternId = `pattern_${recommendation.type}_${Date.now()}`;
      
      await smartDayPlannerApi.submitPatternFeedback(patternId, accept, accept);
      
      if (accept) {
        toast.success('Rekomendacja zaakceptowana');
      } else {
        toast.success('Feedback zapisany');
      }
      
      await fetchAIData();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Błąd podczas zapisywania feedback');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span>📅</span> Smart Day Planner
            </h1>
            <p className="text-gray-600 mt-1">
              Inteligentne planowanie dnia z energią, kontekstami i przerwami
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingBlock(null);
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              ➕ Nowy Blok
            </button>
            <button
              onClick={() => setShowEventModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              📅 Dodaj Wydarzenie
            </button>
            <button
              onClick={loadTasksFromDatabase}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              📋 Załaduj z Bazy
            </button>
            {loadedTasks.length > 0 && (
              <button
                onClick={() => setShowTasksPanel(!showTasksPanel)}
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center gap-2"
              >
                📋 Zadania ({loadedTasks.length})
              </button>
            )}
            <button
              onClick={scheduleTasksAutomatically}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              🔄 Auto-Planuj
            </button>
            <button
              onClick={() => setShowFocusModesPanel(!showFocusModesPanel)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              🎯 Focus Modes
            </button>
            <button
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center gap-2"
            >
              🧠 Enhanced AI
            </button>
            <button
              onClick={() => setShowTemplateGenerator(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 font-medium"
            >
              🪄 Generate Template
            </button>
            <button
              onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              📋 View Templates ({templates.length})
            </button>
            
            {/* Weekly Templates - FAZA 1 */}
            <button
              onClick={() => setShowWeeklySetup(!showWeeklySetup)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              📅 Weekly Setup
            </button>
            
            {currentWeeklyTemplate && (
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                📌 Current: {currentWeeklyTemplate.template?.name}
              </div>
            )}
            
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2">
              ⚙️ Ustawienia
            </button>
          </div>
        </div>

        {/* View Mode Selector & Date Picker */}
        <div className="flex items-center gap-4">
          {/* View Mode Buttons */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📅 Dzień
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📆 Tydzień
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🗓️ Miesiąc
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ◀️
            </button>
            
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ▶️
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {getDateRangeDisplay()}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Different views based on viewMode */}
      {viewMode === 'day' && (
        <div className="space-y-6">
          {/* Daily Schedule Content (existing) */}
          {dailySchedule && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  📅 Harmonogram na dzień
                </h2>
                <div className="mt-2 text-sm text-gray-600">
                  📊 {dailySchedule.statistics.totalTasks} zadań | 
                  ⏱️ {Math.round(dailySchedule.statistics.totalPlannedMinutes / 60 * 10) / 10}h zaplanowane |
                  🎯 {Math.round(dailySchedule.statistics.utilizationRate * 100)}% wykorzystanie
                </div>
              </div>
              
              <div className="p-6">
                {timeBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {timeBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          block.isBreak 
                            ? 'border-orange-200 bg-orange-50'
                            : energyColors[block.energyLevel] || 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-medium text-gray-900">
                              {block.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {block.startTime} - {block.endTime}
                            </div>
                            {!block.isBreak && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                energyColors[block.energyLevel] || 'bg-gray-100 text-gray-800'
                              }`}>
                                {getEnergyIcon(block.energyLevel)} {block.energyLevel}
                              </span>
                            )}
                            {block.isBreak && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                ☕ {block.breakType || 'BREAK'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBlock(block);
                                setShowCreateModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                              ✏️ Edytuj
                            </button>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              🗑️ Usuń
                            </button>
                          </div>
                        </div>
                        
                        {/* Scheduled Tasks in this block */}
                        {block.scheduledTasks && block.scheduledTasks.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm font-medium text-gray-700">📋 Zaplanowane zadania:</div>
                            {block.scheduledTasks.map((task) => (
                              <div key={task.id} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{task.title}</div>
                                    {task.description && (
                                      <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                      <span>⏱️ {task.estimatedMinutes} min</span>
                                      <span className={`px-2 py-1 rounded ${priorityColors[task.priority]}`}>
                                        {task.priority}
                                      </span>
                                      <span>{task.context}</span>
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Context information */}
                        {!block.isBreak && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>📍 {block.primaryContext}</span>
                              {block.alternativeContexts && block.alternativeContexts.length > 0 && (
                                <span>🔄 Alt: {block.alternativeContexts.join(', ')}</span>
                              )}
                              {block.focusMode && (
                                <span>🎯 {block.focusMode.name}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Brak bloków czasowych</h3>
                    <p className="text-gray-600 mb-4">
                      Utwórz swój pierwszy blok czasowy, aby zacząć planować dzień.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      ➕ Utwórz blok czasowy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              📆 Widok tygodniowy
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Planowanie i przegląd całego tygodnia
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-600">Ładowanie danych tygodnia...</p>
              </div>
            ) : weekData ? (
              <div className="space-y-4">
                {/* Week Summary */}
                {weekData.summary && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">{weekData.summary.activeDays}/7</div>
                        <div className="text-sm text-indigo-600">Aktywne dni</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{weekData.summary.totalTasks}</div>
                        <div className="text-sm text-blue-600">Całkowite zadania</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{weekData.summary.totalPlannedHours}h</div>
                        <div className="text-sm text-green-600">Zaplanowane godziny</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{weekData.summary.averageTasksPerDay}</div>
                        <div className="text-sm text-purple-600">Śr. zadań/dzień</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-4">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((dayName, index) => {
                    const dayData = weekData.days?.[index];
                    const dayDate = dayData ? new Date(dayData.date) : null;
                    return (
                      <div key={index} className="border rounded-lg">
                        <div className={`p-3 text-center font-medium ${
                          dayDate?.toDateString() === new Date().toDateString()
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-50 text-gray-900'
                        }`}>
                          <div className="text-sm">{dayName}</div>
                          <div className="text-lg">{dayDate?.getDate() || '-'}</div>
                        </div>
                        
                        <div className="p-3 min-h-[200px]">
                          {dayData?.statistics?.totalTasks > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-600">
                                📋 {dayData.statistics.totalTasks} zadań
                              </div>
                              {dayData.timeBlocks?.slice(0, 3).map((block: any, blockIndex: number) => (
                                <div key={blockIndex} className="text-xs p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{block.startTime}</div>
                                  <div className="text-gray-600 truncate">{block.name}</div>
                                  {block.scheduledTasks?.length > 0 && (
                                    <div className="text-indigo-600">• {block.scheduledTasks.length} zadań</div>
                                  )}
                                </div>
                              ))}
                              {(dayData.timeBlocks?.length || 0) > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{(dayData.timeBlocks?.length || 0) - 3} więcej
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 py-8">
                              <div className="text-2xl mb-1">📭</div>
                              <div className="text-xs">Brak planów</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📆</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak danych tygodnia</h3>
                <p className="text-gray-600 mb-4">
                  Nie udało się załadować danych dla tego tygodnia.
                </p>
                <button
                  onClick={fetchWeekData}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  🔄 Odśwież dane
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🗓️ Widok miesięczny
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Przegląd wydarzeń i planów na cały miesiąc
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-600">Ładowanie danych miesiąca...</p>
              </div>
            ) : monthData ? (
              <div>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((dayName) => (
                    <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-600">
                      {dayName}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthData.days?.map((day: any, index: number) => {
                    const dayDate = new Date(day.date);
                    const isToday = dayDate.toDateString() === new Date().toDateString();
                    const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(dayDate)}
                        className={`min-h-[80px] p-2 border rounded cursor-pointer transition-all ${
                          isToday 
                            ? 'bg-indigo-100 border-indigo-500' 
                            : isSelected
                            ? 'bg-blue-100 border-blue-500'
                            : day.hasEvents
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-indigo-700' : 
                          isSelected ? 'text-blue-700' :
                          'text-gray-900'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        
                        {day.hasEvents && (
                          <div className="mt-1">
                            <div className="text-xs text-green-600">
                              📋 {day.statistics?.totalTasks || 0}
                            </div>
                            {day.scheduledTasks?.slice(0, 2).map((task: any, taskIndex: number) => (
                              <div key={taskIndex} className="text-xs text-gray-600 truncate">
                                • {task.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }) || []}
                </div>
                
                {/* Month Statistics */}
                {monthData.summary && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {monthData.summary.activeDays}
                        </div>
                        <div className="text-sm text-blue-600">Dni z planami</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {monthData.summary.totalTasks}
                        </div>
                        <div className="text-sm text-green-600">Łączne zadania</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {monthData.summary.totalPlannedHours}
                        </div>
                        <div className="text-sm text-purple-600">Godzin zaplanowanych</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {monthData.summary.completionRate}%
                        </div>
                        <div className="text-sm text-orange-600">Wskaźnik ukończenia</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🗓️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak danych miesiąca</h3>
                <p className="text-gray-600 mb-4">
                  Nie udało się załadować danych dla tego miesiąca.
                </p>
                <button
                  onClick={fetchMonthData}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  🔄 Odśwież dane
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Focus Modes Panel */}
      {showFocusModesPanel && (
        <div className="mb-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🎯 Focus Modes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zarządzaj trybami koncentracji dla bloków czasowych
            </p>
          </div>
          
          <div className="p-6">
            {focusModes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {focusModes.map((mode) => (
                  <div
                    key={mode.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{mode.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[mode.priority]}`}>
                        {mode.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{getEnergyIcon(mode.energyLevel)}</span>
                        <span>{mode.energyLevel}</span>
                      </div>
                      <div>⏱️ {mode.duration} min</div>
                      {mode.contextName && (
                        <div>📍 {mode.contextName}</div>
                      )}
                      {mode.category && (
                        <div>📂 {mode.category}</div>
                      )}
                      {mode.timeBlocks && mode.timeBlocks.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="text-green-600">
                            ✅ Używany w {mode.timeBlocks.length} blokach
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak trybów koncentracji</h3>
                <p className="text-gray-600 mb-4">
                  Utwórz swój pierwszy tryb koncentracji, aby uporządkować workflow.
                </p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  🎯 Utwórz Focus Mode
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Analytics Panel */}
      {showPerformancePanel && (
        <div className="mb-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              📊 Performance Analytics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analiza wydajności, wzorców pracy i sugestie optymalizacji
            </p>
          </div>
          
          <div className="p-6">
            {performanceInsights ? (
              <div className="space-y-6">
                {/* Performance Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Ogólny Wynik Wydajności</h3>
                      <p className="text-sm text-gray-600 mt-1">Łączna ocena produktywności i well-being</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-indigo-600">
                        {Math.round(performanceInsights.performanceScore)}
                      </div>
                      <div className="text-sm text-gray-500">/ 100 punktów</div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                {performanceInsights.insights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Insights</h3>
                    <div className="space-y-2">
                      {performanceInsights.insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trends */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Trendy (30 dni)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(performanceInsights.trends).map(([key, trend]) => {
                      const icons = {
                        productivity: '🚀',
                        completionRate: '✅',
                        stressLevel: '😰',
                        burnoutRisk: '🔥',
                        energyConsistency: '⚡'
                      };
                      
                      const colors = {
                        up: trend.direction === 'up' && (key === 'stressLevel' || key === 'burnoutRisk') 
                          ? 'text-red-600' : 'text-green-600',
                        down: trend.direction === 'down' && (key === 'stressLevel' || key === 'burnoutRisk') 
                          ? 'text-green-600' : 'text-red-600',
                        stable: 'text-gray-600'
                      };

                      return (
                        <div key={key} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{icons[key as keyof typeof icons]}</span>
                            <span className="font-medium text-gray-900 text-sm capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                          <div className={`text-lg font-semibold ${colors[trend.direction]}`}>
                            {trend.direction === 'up' && '↗️'}
                            {trend.direction === 'down' && '↘️'}
                            {trend.direction === 'stable' && '→'}
                            {trend.percentage > 0 && ` ${trend.percentage.toFixed(1)}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Best Focus Mode */}
                {performanceInsights.bestPerformingFocusMode && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Najlepszy Focus Mode</h3>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {performanceInsights.bestPerformingFocusMode.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {performanceInsights.bestPerformingFocusMode.duration} min • 
                            {performanceInsights.bestPerformingFocusMode.energyLevel}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {(performanceInsights.bestPerformingFocusMode.avgEfficiency * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">efektywność</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {performanceInsights.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Rekomendacje</h3>
                    <div className="space-y-2">
                      {performanceInsights.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimal Patterns */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Optymalne Wzorce</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Najlepszy czas energii</h4>
                      <p className="text-sm text-gray-600">
                        {performanceInsights.optimalWorkPatterns.bestEnergyTime || 'Brak danych'}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Optymalna liczba zadań</h4>
                      <p className="text-sm text-gray-600">
                        {performanceInsights.optimalWorkPatterns.optimalTaskCount || 'Brak danych'} zadań dziennie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Zbieranie danych analitycznych</h3>
                <p className="text-gray-600 mb-4">
                  Ukończ więcej sesji pracy aby wygenerować insights o wydajności.
                </p>
                <button
                  onClick={fetchPerformanceInsights}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  🔄 Odśwież Analytics
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Panel */}
      {showTemplatesPanel && (
        <div className="mb-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              📋 My Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zarządzaj swoimi szablonami dni i aplikuj je na konkretne daty
            </p>
          </div>
          <div className="p-6">
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const timeBlocks = JSON.parse(template.timeBlocks || '[]');
                  const workBlocks = timeBlocks.filter((block: any) => !block.isBreak);
                  const breakBlocks = timeBlocks.filter((block: any) => block.isBreak);
                  
                  return (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {template.templateType}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bloki pracy:</span>
                          <span className="font-medium">{workBlocks.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Przerwy:</span>
                          <span className="font-medium">{breakBlocks.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Czas pracy:</span>
                          <span className="font-medium">{Math.round(template.totalWorkTime / 60)}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Użyć:</span>
                          <span className="font-medium">{template.usageCount || 0}x</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => applyTemplate(template)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Apply
                        </button>
                        <button 
                          onClick={() => {
                            // TODO: Implement preview
                            toast(`Podgląd szablonu "${template.name}"`);
                          }}
                          className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brak szablonów</h3>
                <p className="text-gray-600 mb-4">
                  Utwórz swój pierwszy szablon dnia korzystając z AI Generator.
                </p>
                <button
                  onClick={() => setShowTemplateGenerator(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  🪄 Generate Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced AI Panel */}
      {showAIPanel && (
        <div className="mb-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🧠 Enhanced AI - Pattern Learning
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              System uczenia się wzorców i personalizowanych rekomendacji
            </p>
          </div>
          
          <div className="p-6">
            {/* AI Action Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={handleDetectPatterns}
                disabled={loading}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
              >
                🔍 Wykryj Wzorce
              </button>
              <button
                onClick={fetchAIData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                🔄 Odśwież AI Data
              </button>
            </div>

            {/* Learning Insights */}
            {learningInsights && (
              <div className="mb-6 bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Learning Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{learningInsights.totalPatterns}</div>
                    <div className="text-sm text-gray-600">Wzorce</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{learningInsights.highConfidencePatterns}</div>
                    <div className="text-sm text-gray-600">Wysokie zaufanie</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{learningInsights.acceptedPatterns}</div>
                    <div className="text-sm text-gray-600">Zaakceptowane</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(learningInsights.learningEffectiveness * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Efektywność</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Personalizowane Rekomendacje</h3>
                <div className="space-y-3">
                  {aiRecommendations.slice(0, 5).map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                              recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {recommendation.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(recommendation.confidence * 100)}% pewności
                            </span>
                            {recommendation.patternBased && (
                              <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                Oparty na wzorcu
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{recommendation.title}</h4>
                          <p className="text-sm text-gray-600">{recommendation.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            Oczekiwany wpływ: {Math.round(recommendation.expectedImpact * 100)}%
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleAcceptRecommendation(recommendation, true)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ✅ Akceptuj
                          </button>
                          <button
                            onClick={() => handleAcceptRecommendation(recommendation, false)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            ❌ Odrzuć
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Patterns */}
            {userPatterns.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Wykryte Wzorce Użytkownika</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPatterns.slice(0, 6).map((pattern) => (
                    <div
                      key={pattern.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {pattern.patternType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(pattern.confidence * 100)}% pewności
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Siła: {Math.round(pattern.strength * 100)}% | Próbki: {pattern.sampleSize}
                      </div>
                      <div className="text-xs text-gray-500">
                        Źródło: {pattern.learningSource}
                      </div>
                      {pattern.userAcceptance && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">
                            Akceptacja użytkownika: {Math.round(pattern.userAcceptance * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {aiRecommendations.length === 0 && userPatterns.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🧠</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI uczy się Twoich wzorców</h3>
                <p className="text-gray-600 mb-4">
                  Ukończ więcej sesji pracy, aby system mógł wykryć Twoje wzorce produktywności.
                </p>
                <button
                  onClick={handleDetectPatterns}
                  disabled={loading}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  🔍 Rozpocznij Detekcję Wzorców
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Statistics */}
      {dailySchedule && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              🕐 Bloki Pracy
            </div>
            <div className="text-2xl font-bold text-gray-900">{dailySchedule.statistics.workBlocks}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              ☕ Przerwy
            </div>
            <div className="text-2xl font-bold text-gray-900">{dailySchedule.statistics.breakBlocks}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              🎯 Zadania
            </div>
            <div className="text-2xl font-bold text-gray-900">{dailySchedule.statistics.totalTasks}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              ⏰ Czas Pracy
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(dailySchedule.statistics.totalPlannedMinutes / 60 * 10) / 10}h
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              📊 Wykorzystanie
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(dailySchedule.statistics.utilizationRate * 100)}%
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              ✅ Bloki z zadaniami
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {dailySchedule.statistics.blocksWithTasks}/{dailySchedule.statistics.workBlocks}
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule Summary */}
      {dailySchedule && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📅 Harmonogram na {selectedDate.toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          
          {dailySchedule.timeBlocks.filter(b => (b.scheduledTasks?.length || 0) > 0).length > 0 ? (
            <div className="space-y-3">
              {dailySchedule.timeBlocks
                .filter(block => (block.scheduledTasks?.length || 0) > 0)
                .map(block => (
                  <div key={block.id} className="bg-white rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </span>
                        <span className="text-sm text-gray-600">{block.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${energyColors[block.energyLevel]}`}>
                        {getEnergyIcon(block.energyLevel)} {block.energyLevel}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {(block.scheduledTasks || []).map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className="text-gray-900">{task.title}</span>
                          <span className="text-gray-500">({task.estimatedMinutes} min)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-gray-600">Brak zaplanowanych zadań na ten dzień</p>
              <button 
                onClick={scheduleTasksAutomatically}
                className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                🔄 Auto-Planuj Zadania
              </button>
            </div>
          )}
        </div>
      )}

      {/* Time Blocks List */}
      {loading ? (
        <div className="bg-white rounded-lg border shadow-sm p-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      ) : timeBlocks.length > 0 ? (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Wszystkie bloki czasowe</h2>
            <p className="text-sm text-gray-600 mt-1">
              Wszystkie zdefiniowane bloki czasowe - szablon dla planowania zadań
            </p>
          </div>
          
          <div className="divide-y">
            {timeBlocks.map((block) => (
              <div
                key={block.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  activeBlock === block.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-medium text-gray-900">
                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${energyColors[block.energyLevel]}`}>
                        {getEnergyIcon(block.energyLevel)} {block.energyLevel}
                      </div>
                      {block.focusMode && (
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          🎯 {block.focusMode.name}
                        </div>
                      )}
                      {block.isBreak && (
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          ☕ Przerwa
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{block.name}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <span>📍</span> {block.primaryContext}
                      </span>
                      {block.alternativeContexts.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span>🔄</span> Alt: {block.alternativeContexts.join(', ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span>⏱️</span> {calculateDuration(block.startTime, block.endTime)} min
                      </span>
                    </div>
                    
                    {/* Scheduled Tasks */}
                    {block.scheduledTasks && block.scheduledTasks.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium text-gray-700">Zaplanowane zadania:</div>
                        {block.scheduledTasks.map((task) => (
                          <div
                            key={task.id}
                            className="ml-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <span className="font-medium text-gray-900">{task.title}</span>
                              </div>
                              <span className="text-sm text-gray-600">{task.estimatedMinutes} min</span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* Focus Mode Selector */}
                    <select
                      value={block.focusModeId || ''}
                      onChange={(e) => handleAssignFocusMode(block.id, e.target.value || null)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-600 hover:border-purple-400 focus:border-purple-500 focus:outline-none"
                      title="Wybierz tryb koncentracji"
                    >
                      <option value="">Brak focus mode</option>
                      {focusModes.map((mode) => (
                        <option key={mode.id} value={mode.id}>
                          🎯 {mode.name} ({mode.duration}min)
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => {
                        setEditingBlock(block);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                      title="Edytuj blok"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Usuń blok"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Smart Day Planner</h2>
            <p className="text-sm text-gray-600 mt-1">
              System inteligentnego planowania dnia z energią, kontekstami alternatywnymi i przerwami
            </p>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak bloków czasowych</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Utwórz swój pierwszy blok czasowy, aby rozpocząć inteligentne planowanie dnia.
                System automatycznie dopasuje zadania do Twojego poziomu energii i kontekstów.
              </p>
            
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-4xl mx-auto">
                <h4 className="font-semibold text-gray-900 mb-4">🎯 Kluczowe Funkcjonalności:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">⚡ System Fallback Kontekstów:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Primary: @computer → Brak zadań ❌</div>
                      <div>Alt1: @reading → ✅ "Dokumentacja" (30m)</div>
                      <div>Alt2: @planning → Fallback jeśli @reading pusty</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">☕ Automatyczne Przerwy:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>🌅 7:00-7:45 [HIGH Energy + @computer]</div>
                      <div>☕ 7:45-8:00 [COFFEE BREAK]</div>
                      <div>⚡ 8:00-8:45 [HIGH Energy + @calls]</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">🧠 AI Learning System:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Uczy się Twoich wzorców energii</div>
                      <div>• Optymalizuje planowanie</div>
                      <div>• Adaptuje konteksty do produktywności</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">🔧 Zaawansowane Opcje:</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Energy Pattern Analytics</div>
                      <div>• Smart Task Scheduling</div>
                      <div>• Adaptive Planning w czasie rzeczywistym</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEditingBlock(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 mr-3"
                >
                  🔧 Skonfiguruj Bloki Czasowe
                </button>
                
                <button
                  onClick={scheduleTasksAutomatically}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  🚀 Rozpocznij Auto-Planowanie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Block Modal */}
      <TimeBlockModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBlock(null);
        }}
        onSave={editingBlock ? handleUpdateBlock : handleCreateBlock}
        block={editingBlock}
        dayOfWeek={selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
      />

      {/* Template Generator Modal */}
      <TemplateGeneratorModal
        isOpen={showTemplateGenerator}
        onClose={() => setShowTemplateGenerator(false)}
        onTemplateGenerated={(template) => {
          setTemplates([...templates, template]);
          toast.success(`Szablon "${template.name}" został dodany!`);
        }}
      />

      {/* Weekly Template Setup Modal - FAZA 1 */}
      {showWeeklySetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📅 Weekly Template Setup</h2>
              <button
                onClick={() => setShowWeeklySetup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Current Week Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🗓️ Current Week</h3>
                <p className="text-blue-800">
                  {getMonday(selectedDate).toLocaleDateString('pl-PL')} - {' '}
                  {new Date(getMonday(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL')}
                </p>
              </div>

              {/* Quick Setup Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">⚡ Quick Weekly Setup</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Standard Work Week"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="templateName"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day Intensity
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="dayIntensity"
                      defaultValue="MEDIUM"
                    >
                      <option value="LIGHT">Light</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HEAVY">Heavy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Start Time
                    </label>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="workStart"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work End Time
                    </label>
                    <input
                      type="time"
                      defaultValue="17:00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="workEnd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lunch Time
                    </label>
                    <input
                      type="time"
                      defaultValue="12:00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="lunchTime"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lunch Duration (min)
                    </label>
                    <input
                      type="number"
                      defaultValue="60"
                      min="30"
                      max="120"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      id="lunchDuration"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <button
                    onClick={() => {
                      const form = document.getElementById('templateName') as HTMLInputElement;
                      const config = {
                        templateName: (document.getElementById('templateName') as HTMLInputElement).value,
                        dayIntensity: (document.getElementById('dayIntensity') as HTMLSelectElement).value,
                        workHours: {
                          start: (document.getElementById('workStart') as HTMLInputElement).value,
                          end: (document.getElementById('workEnd') as HTMLInputElement).value
                        },
                        lunchBreak: {
                          start: (document.getElementById('lunchTime') as HTMLInputElement).value,
                          duration: parseInt((document.getElementById('lunchDuration') as HTMLInputElement).value)
                        }
                      };
                      handleQuickWeeklySetup(config);
                    }}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? '⏳ Creating...' : '🚀 Create & Apply Weekly Template'}
                  </button>
                </div>
              </div>

              {/* Existing Weekly Templates */}
              {weeklyTemplates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">📋 Existing Weekly Templates</h3>
                  <div className="grid gap-3">
                    {weeklyTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.description} • Used {template.usageCount} times
                          </div>
                        </div>
                        <button
                          onClick={() => applyWeeklyTemplate(template)}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Apply Week
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Tasks Panel - NOWY PANEL */}
      {showTasksPanel && loadedTasks.length > 0 && (
        <div className="mb-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  📋 Zadania z Bazy Danych
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {tasksStats && `${tasksStats.total} zadań z GTD Inbox, projektów i zadań cyklicznych`}
                </p>
              </div>
              <button
                onClick={() => setShowTasksPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Statystyki */}
            {tasksStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Źródła Zadań</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>📥 GTD Inbox:</span>
                      <span className="font-medium">{tasksStats.bySource.gtdInbox}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🎯 Projekty:</span>
                      <span className="font-medium">{tasksStats.bySource.projects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔄 Cykliczne:</span>
                      <span className="font-medium">{tasksStats.bySource.recurring}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2">Priorytety</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>🔴 Wysoki:</span>
                      <span className="font-medium">{tasksStats.byPriority.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🟡 Średni:</span>
                      <span className="font-medium">{tasksStats.byPriority.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🟢 Niski:</span>
                      <span className="font-medium">{tasksStats.byPriority.low}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">Energia</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>⚡ Wysoka:</span>
                      <span className="font-medium">{tasksStats.byEnergyLevel.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔋 Średnia:</span>
                      <span className="font-medium">{tasksStats.byEnergyLevel.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔌 Niska:</span>
                      <span className="font-medium">{tasksStats.byEnergyLevel.low}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista zadań */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Lista Zadań</h3>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {loadedTasks.map((task, index) => (
                  <div key={task.id || index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {task.source === 'GTD_INBOX' && '📥'}
                            {task.source === 'PROJECTS' && '🎯'}
                            {task.source === 'RECURRING' && '🔄'}
                          </span>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>⏱️ {task.estimatedMinutes}min</span>
                          <span>📍 {task.context}</span>
                          <span>
                            {task.energyRequired === 'HIGH' && '⚡ Wysoka'}
                            {task.energyRequired === 'MEDIUM' && '🔋 Średnia'}
                            {task.energyRequired === 'LOW' && '🔌 Niska'}
                            {task.energyRequired === 'CREATIVE' && '🎨 Kreatywna'}
                            {task.energyRequired === 'ADMINISTRATIVE' && '📊 Admin'}
                          </span>
                          {task.deadline && (
                            <span className="text-red-600">
                              📅 {new Date(task.deadline).toLocaleDateString('pl-PL')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.source === 'GTD_INBOX' && 'Inbox'}
                          {task.source === 'PROJECTS' && 'Projekt'}
                          {task.source === 'RECURRING' && 'Cykliczne'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total estimated time */}
            {tasksStats && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">Łączny szacowany czas:</span>
                  <span className="font-bold text-gray-900">
                    {Math.floor(tasksStats.totalEstimatedTime / 60)}h {tasksStats.totalEstimatedTime % 60}min
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Creation Modal - NOWY MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  📅 Dodaj Nowe Wydarzenie
                </h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Utwórz jednorazowe wydarzenie na konkretną datę
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Tytuł wydarzenia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa wydarzenia *
                </label>
                <input
                  type="text"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="np. Spotkanie z klientem, Prezentacja, Wywiad..."
                />
              </div>

              {/* Opis wydarzenia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis (opcjonalny)
                </label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Dodatkowe szczegóły wydarzenia..."
                />
              </div>

              {/* Data wydarzenia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data wydarzenia *
                </label>
                <input
                  type="date"
                  value={eventFormData.selectedDate}
                  onChange={(e) => setEventFormData({ ...eventFormData, selectedDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Czas rozpoczęcia i zakończenia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Od *
                  </label>
                  <input
                    type="time"
                    value={eventFormData.startTime}
                    onChange={(e) => setEventFormData({ ...eventFormData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do *
                  </label>
                  <input
                    type="time"
                    value={eventFormData.endTime}
                    onChange={(e) => setEventFormData({ ...eventFormData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Czas trwania (automatycznie obliczany) */}
              {eventFormData.startTime && eventFormData.endTime && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  ⏱️ Czas trwania: {calculateEventDuration(eventFormData.startTime, eventFormData.endTime)} minut
                </div>
              )}

              {/* Priorytet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorytet
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setEventFormData({ ...eventFormData, priority: priority as any })}
                      className={`p-2 text-xs rounded-lg border-2 transition-all ${
                        eventFormData.priority === priority
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {priority === 'LOW' && '🟢 Niski'}
                      {priority === 'MEDIUM' && '🟡 Średni'}
                      {priority === 'HIGH' && '🟠 Wysoki'}
                      {priority === 'URGENT' && '🔴 Pilny'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kontekst */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontekst
                </label>
                <select
                  value={eventFormData.context}
                  onChange={(e) => setEventFormData({ ...eventFormData, context: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="@computer">💻 @computer</option>
                  <option value="@calls">📞 @calls</option>
                  <option value="@office">🏢 @office</option>
                  <option value="@home">🏠 @home</option>
                  <option value="@errands">🚗 @errands</option>
                  <option value="@online">🌐 @online</option>
                  <option value="@reading">📚 @reading</option>
                  <option value="@creative">🎨 @creative</option>
                </select>
              </div>

              {/* Energia wymagana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energia wymagana
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'LOW', label: '🔌 Niska', color: 'border-green-300 bg-green-50' },
                    { value: 'MEDIUM', label: '🔋 Średnia', color: 'border-yellow-300 bg-yellow-50' },
                    { value: 'HIGH', label: '⚡ Wysoka', color: 'border-red-300 bg-red-50' },
                    { value: 'CREATIVE', label: '🎨 Kreatywna', color: 'border-purple-300 bg-purple-50' },
                    { value: 'ADMINISTRATIVE', label: '📊 Admin', color: 'border-gray-300 bg-gray-50' }
                  ].map((energy) => (
                    <button
                      key={energy.value}
                      type="button"
                      onClick={() => setEventFormData({ ...eventFormData, energyRequired: energy.value as any })}
                      className={`p-2 text-xs rounded-lg border-2 transition-all ${
                        eventFormData.energyRequired === energy.value
                          ? `border-emerald-500 bg-emerald-50`
                          : `${energy.color} hover:border-gray-400`
                      }`}
                    >
                      {energy.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Przyciski akcji */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleCreateEvent}
                  disabled={!eventFormData.title || loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '⏳ Tworzenie...' : '📅 Utwórz Wydarzenie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDayPlannerPage;