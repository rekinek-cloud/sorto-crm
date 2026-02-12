'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  ClipboardCheck,
  BarChart3,
  LayoutGrid,
  Play,
  RotateCcw,
  CheckCircle,
  Circle,
  Inbox,
  Waves,
  Snowflake,
  Target,
  AlertTriangle,
  Users,
  Lightbulb,
  CalendarDays,
  ListChecks,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: boolean;
  actionRequired?: boolean;
  count?: number;
}

interface WeeklyReviewData {
  lastReviewDate?: string;
  sourceItems: number;
  activeStreams: number;
  frozenStreams: number;
  completedThisWeek: number;
  overdueItems: number;
  delegatedItems: number;
  reviewProgress: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Zrodlo': return Inbox;
    case 'Strumienie': return Waves;
    case 'Zamrozone': return Snowflake;
    case 'Planowanie': return Target;
    default: return CheckCircle;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Zrodlo': return 'text-slate-500 bg-slate-100 dark:bg-slate-700/50 dark:text-slate-400';
    case 'Strumienie': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400';
    case 'Zamrozone': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Planowanie': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    default: return 'text-slate-500 bg-slate-100 dark:bg-slate-700/50';
  }
};

export default function WeeklyReviewPage() {
  const [reviewData, setReviewData] = useState<WeeklyReviewData>({
    sourceItems: 0,
    activeStreams: 0,
    frozenStreams: 0,
    completedThisWeek: 0,
    overdueItems: 0,
    delegatedItems: 0,
    reviewProgress: 0
  });

  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const reviewSteps: ReviewItem[] = [
    {
      id: '1',
      category: 'Zrodlo',
      title: 'Oproznij Zrodlo',
      description: 'Przetworz wszystkie elementy ze Zrodla - kategoryzuj, przypisz do strumieni lub usun',
      completed: false,
      actionRequired: true
    },
    {
      id: '2',
      category: 'Zrodlo',
      title: 'Przejrzyj poczte',
      description: 'Przetworz nieprzeczytane wiadomosci i utworz zadania w odpowiednich strumieniach',
      completed: false,
      actionRequired: true
    },
    {
      id: '3',
      category: 'Zrodlo',
      title: 'Zbierz notatki fizyczne',
      description: 'Zbierz elementy z notesow, karteczek i innych fizycznych zrodel do systemu',
      completed: false
    },
    {
      id: '4',
      category: 'Strumienie',
      title: 'Przeglad aktywnych strumieni',
      description: 'Sprawdz kazdy aktywny strumien - czy ma zadania do zrobienia? Czy przeplywa?',
      completed: false,
      actionRequired: true
    },
    {
      id: '5',
      category: 'Strumienie',
      title: 'Przeglad delegowanych zadan',
      description: 'Sprawdz zadania przekazane innym - czy sa postepy? Przypomnij jesli trzeba',
      completed: false,
      actionRequired: true
    },
    {
      id: '6',
      category: 'Strumienie',
      title: 'Przeglad strumieni projektowych',
      description: 'Kazdy projekt powinien miec jasne nastepne dzialanie. Dodaj brakujace',
      completed: false,
      actionRequired: true
    },
    {
      id: '7',
      category: 'Strumienie',
      title: 'Przeglad kalendarza',
      description: 'Sprawdz minione i przyszle wydarzenia - czy wymagaja dzialan w strumieniach?',
      completed: false
    },
    {
      id: '8',
      category: 'Zamrozone',
      title: 'Przeglad zamrozonych strumieni',
      description: 'Czy ktorys zamrozony strumien powinien zostac odmrozony? Czy cos jest juz nieaktualne?',
      completed: false,
      actionRequired: true
    },
    {
      id: '9',
      category: 'Planowanie',
      title: 'Nowe pomysly i strumienie',
      description: 'Rozwaz nowe mozliwosci, cele i kreatywne idee. Utworz nowe strumienie jesli potrzeba',
      completed: false
    },
    {
      id: '10',
      category: 'Planowanie',
      title: 'Zaplanuj nastepny tydzien',
      description: 'Ustal priorytety i glowne strumienie na nadchodzacy tydzien',
      completed: false
    }
  ];

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setReviewData({
        lastReviewDate: '2024-01-08T10:00:00Z',
        sourceItems: 12,
        activeStreams: 8,
        frozenStreams: 3,
        completedThisWeek: 23,
        overdueItems: 3,
        delegatedItems: 5,
        reviewProgress: 0
      });
      setReviewItems(reviewSteps);
    } catch (error: any) {
      console.error('Error loading review data:', error);
      toast.error('Nie udalo sie zaladowac danych przegladu');
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setReviewStarted(true);
    setCurrentStep(0);
    toast.success('Przeglad tygodniowy rozpoczety! Postepuj wedlug listy kontrolnej.');
  };

  const completeStep = (stepId: string) => {
    setReviewItems(prev =>
      prev.map(item =>
        item.id === stepId
          ? { ...item, completed: true }
          : item
      )
    );

    const nextIncompleteStep = reviewItems.findIndex((item, index) =>
      index > currentStep && !item.completed
    );

    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep);
    }

    const completedCount = reviewItems.filter(item => item.completed).length + 1;
    const progress = Math.round((completedCount / reviewItems.length) * 100);

    setReviewData(prev => ({ ...prev, reviewProgress: progress }));

    if (completedCount === reviewItems.length) {
      toast.success('Przeglad tygodniowy zakonczony! Swietna robota.');
    }
  };

  const resetReview = () => {
    setReviewStarted(false);
    setCurrentStep(0);
    setReviewItems(reviewSteps);
    setReviewData(prev => ({ ...prev, reviewProgress: 0 }));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-amber-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-slate-300 dark:bg-slate-600';
  };

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
        title="Przeglad tygodniowy"
        subtitle="Cotygodniowa refleksja i planowanie"
        icon={ClipboardCheck}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Przeglady', href: '/dashboard/reviews' }, { label: 'Tygodniowy' }]}
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              onClick={() => window.location.href = '/dashboard/reviews/weekly/burndown'}
              variant="ghost"
              icon={BarChart3}
              size="sm"
            >
              Wykres postepu
            </ActionButton>
            <ActionButton
              onClick={() => window.location.href = '/dashboard/reviews/weekly/scrum'}
              variant="ghost"
              icon={LayoutGrid}
              size="sm"
            >
              Tablica Scrum
            </ActionButton>
            {!reviewStarted ? (
              <ActionButton onClick={startReview} variant="primary" icon={Play}>
                Rozpocznij przeglad
              </ActionButton>
            ) : (
              <ActionButton onClick={resetReview} variant="secondary" icon={RotateCcw}>
                Zresetuj
              </ActionButton>
            )}
          </div>
        }
      />

      {/* Progress Bar */}
      <AnimatePresence>
        {reviewStarted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Postep przegladu</h2>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {reviewData.reviewProgress}% ukonczono
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(reviewData.reviewProgress)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${reviewData.reviewProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label="Elementow w Zrodle"
            value={reviewData.sourceItems}
            icon={Inbox}
            iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Aktywnych strumieni"
            value={reviewData.activeStreams}
            icon={Waves}
            iconColor="text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Ukonczono w tym tyg."
            value={reviewData.completedThisWeek}
            icon={CheckCircle}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Przeterminowanych"
            value={reviewData.overdueItems}
            icon={AlertTriangle}
            iconColor="text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
          />
        </motion.div>
      </motion.div>

      {/* Review Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-sm dark:bg-slate-800/80 dark:border-slate-700/30 overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/30">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {reviewStarted ? 'Lista kontrolna przegladu' : 'Przeglad strumieni'}
          </h2>
          {reviewData.lastReviewDate && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ostatni przeglad: {new Date(reviewData.lastReviewDate).toLocaleDateString('pl-PL')}
            </p>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
          {reviewItems.map((item, index) => {
            const CategoryIcon = getCategoryIcon(item.category);
            const categoryColor = getCategoryColor(item.category);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-5 transition-all duration-200 ${
                  reviewStarted && currentStep === index
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 p-2 rounded-xl ${categoryColor}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                        {item.actionRequired && (
                          <StatusBadge variant="error">
                            Wymaga dzialania
                          </StatusBadge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {item.description}
                      </p>
                      {item.count && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                          {item.count} elementow do przegladu
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    {item.completed ? (
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    ) : reviewStarted ? (
                      <ActionButton
                        onClick={() => completeStep(item.id)}
                        variant="primary"
                        size="sm"
                      >
                        Ukoncz
                      </ActionButton>
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Review Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50/80 dark:bg-blue-900/10 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Wskazowki do przegladu strumieni</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-800 dark:text-blue-300">
          <div>
            <strong>Regularnosc:</strong> Ustal staly czas na przeglad (piatek popoludniu lub niedziela wieczorem)
          </div>
          <div>
            <strong>Srodowisko:</strong> Znajdz spokojne miejsce gdzie nikt Ci nie przerwie
          </div>
          <div>
            <strong>Nie spiesz sie:</strong> Dokladny przeglad zajmuje zwykle 1-2 godziny
          </div>
          <div>
            <strong>Skup sie:</strong> Nie zaczynaj wykonywac zadan podczas przegladu - tylko kategoryzuj i planuj
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
}
