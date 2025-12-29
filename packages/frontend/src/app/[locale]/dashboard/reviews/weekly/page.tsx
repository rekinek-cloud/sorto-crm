'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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

  // Przegląd strumieni według metodologii SORTO STREAMS
  const reviewSteps: ReviewItem[] = [
    {
      id: '1',
      category: 'Źródło',
      title: 'Opróżnij Źródło',
      description: 'Przetwórz wszystkie elementy ze Źródła - kategoryzuj, przypisz do strumieni lub usuń',
      completed: false,
      actionRequired: true
    },
    {
      id: '2',
      category: 'Źródło',
      title: 'Przejrzyj pocztę',
      description: 'Przetwórz nieprzeczytane wiadomości i utwórz zadania w odpowiednich strumieniach',
      completed: false,
      actionRequired: true
    },
    {
      id: '3',
      category: 'Źródło',
      title: 'Zbierz notatki fizyczne',
      description: 'Zbierz elementy z notesów, karteczek i innych fizycznych źródeł do systemu',
      completed: false
    },
    {
      id: '4',
      category: 'Strumienie',
      title: 'Przegląd aktywnych strumieni',
      description: 'Sprawdź każdy aktywny strumień - czy ma zadania do zrobienia? Czy przepływa?',
      completed: false,
      actionRequired: true
    },
    {
      id: '5',
      category: 'Strumienie',
      title: 'Przegląd delegowanych zadań',
      description: 'Sprawdź zadania przekazane innym - czy są postępy? Przypomnij jeśli trzeba',
      completed: false,
      actionRequired: true
    },
    {
      id: '6',
      category: 'Strumienie',
      title: 'Przegląd strumieni projektowych',
      description: 'Każdy projekt powinien mieć jasne następne działanie. Dodaj brakujące',
      completed: false,
      actionRequired: true
    },
    {
      id: '7',
      category: 'Strumienie',
      title: 'Przegląd kalendarza',
      description: 'Sprawdź minione i przyszłe wydarzenia - czy wymagają działań w strumieniach?',
      completed: false
    },
    {
      id: '8',
      category: 'Zamrożone',
      title: 'Przegląd zamrożonych strumieni',
      description: 'Czy któryś zamrożony strumień powinien zostać odmrożony? Czy coś jest już nieaktualne?',
      completed: false,
      actionRequired: true
    },
    {
      id: '9',
      category: 'Planowanie',
      title: 'Nowe pomysły i strumienie',
      description: 'Rozważ nowe możliwości, cele i kreatywne idee. Utwórz nowe strumienie jeśli potrzeba',
      completed: false
    },
    {
      id: '10',
      category: 'Planowanie',
      title: 'Zaplanuj następny tydzień',
      description: 'Ustal priorytety i główne strumienie na nadchodzący tydzień',
      completed: false
    }
  ];

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      // Mock data - w prawdziwej aplikacji wywołanie API
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
      toast.error('Nie udało się załadować danych przeglądu');
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setReviewStarted(true);
    setCurrentStep(0);
    toast.success('Przegląd tygodniowy rozpoczęty! Postępuj według listy kontrolnej.');
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
      toast.success('🎉 Przegląd tygodniowy zakończony! Świetna robota.');
    }
  };

  const resetReview = () => {
    setReviewStarted(false);
    setCurrentStep(0);
    setReviewItems(reviewSteps);
    setReviewData(prev => ({ ...prev, reviewProgress: 0 }));
  };

  const getStepIcon = (category: string) => {
    switch (category) {
      case 'Źródło': return '⚪';
      case 'Strumienie': return '🌊';
      case 'Zamrożone': return '❄️';
      case 'Planowanie': return '🎯';
      default: return '✅';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Przegląd Tygodniowy</h1>
          <p className="text-gray-600">Przegląd strumieni: Źródło → Strumienie → Planowanie</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '/dashboard/reviews/weekly/burndown'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Wykres postępu
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/reviews/weekly/scrum'}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Tablica Scrum
          </button>
          {!reviewStarted ? (
            <button onClick={startReview} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Rozpocznij przegląd
            </button>
          ) : (
            <button onClick={resetReview} className="btn btn-secondary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Zresetuj
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {reviewStarted && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Postęp przeglądu</h2>
            <span className="text-sm font-medium text-gray-600">
              {reviewData.reviewProgress}% ukończono
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(reviewData.reviewProgress)}`}
              style={{ width: `${reviewData.reviewProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">⚪</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">{reviewData.sourceItems}</div>
              <div className="text-sm text-gray-500">Elementów w Źródle</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">🌊</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-cyan-600">{reviewData.activeStreams}</div>
              <div className="text-sm text-gray-500">Aktywnych strumieni</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">✅</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{reviewData.completedThisWeek}</div>
              <div className="text-sm text-gray-500">Ukończono w tym tyg.</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">🚨</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{reviewData.overdueItems}</div>
              <div className="text-sm text-gray-500">Przeterminowanych</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Checklist */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {reviewStarted ? 'Lista kontrolna przeglądu' : 'Przegląd strumieni'}
          </h2>
          {reviewData.lastReviewDate && (
            <p className="text-sm text-gray-600 mt-1">
              Ostatni przegląd: {new Date(reviewData.lastReviewDate).toLocaleDateString('pl-PL')}
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {reviewItems.map((item, index) => (
            <div key={item.id} className={`p-6 ${reviewStarted && currentStep === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    <div className="text-2xl">{getStepIcon(item.category)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.category}
                      </span>
                      {item.actionRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Wymaga działania
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                    {item.count && (
                      <p className="text-sm text-blue-600 mt-2">
                        {item.count} elementów do przeglądu
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  {item.completed ? (
                    <div className="flex items-center text-green-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : reviewStarted ? (
                    <button
                      onClick={() => completeStep(item.id)}
                      className="btn btn-sm btn-primary"
                    >
                      Ukończ
                    </button>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Wskazówki do przeglądu strumieni</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Regularność:</strong> Ustal stały czas na przegląd (piątek popołudniu lub niedziela wieczorem)
          </div>
          <div>
            <strong>Środowisko:</strong> Znajdź spokojne miejsce gdzie nikt Ci nie przerwie
          </div>
          <div>
            <strong>Nie spiesz się:</strong> Dokładny przegląd zajmuje zwykle 1-2 godziny
          </div>
          <div>
            <strong>Skup się:</strong> Nie zaczynaj wykonywać zadań podczas przeglądu - tylko kategoryzuj i planuj
          </div>
        </div>
      </div>
    </div>
  );
}
