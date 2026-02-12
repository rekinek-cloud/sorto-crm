'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Rocket,
  Plus,
  X,
  FileText,
  Zap,
  SlidersHorizontal,
  Lightbulb,
  Target,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  createdAt: string;
  deadline?: string;
  progress: number;
  smartScore: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timeBound: number;
    overall: number;
  };
}

interface SmartAnalysis {
  goalId: string;
  analysis: {
    specific: {
      score: number;
      feedback: string;
      improvements: string[];
    };
    measurable: {
      score: number;
      feedback: string;
      improvements: string[];
    };
    achievable: {
      score: number;
      feedback: string;
      improvements: string[];
    };
    relevant: {
      score: number;
      feedback: string;
      improvements: string[];
    };
    timeBound: {
      score: number;
      feedback: string;
      improvements: string[];
    };
  };
  overallRecommendations: string[];
  lastAnalyzed: string;
}

export default function SmartAnalysisPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setTimeout(() => {
      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Zwiekszyc konwersje na stronie o 15%',
          description: 'Poprawic optymalizacje landing page i UX aby podniesc konwersje z 2.3% do 2.65% do konca Q2',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 2592000000).toISOString(),
          deadline: new Date(Date.now() + 5184000000).toISOString(),
          progress: 65,
          smartScore: {
            specific: 85,
            measurable: 95,
            achievable: 75,
            relevant: 90,
            timeBound: 80,
            overall: 85
          }
        },
        {
          id: '2',
          title: 'Uruchomic aplikacje mobilna',
          description: 'Opracowac i wydac aplikacje mobilna na iOS i Android',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 1296000000).toISOString(),
          deadline: new Date(Date.now() + 7776000000).toISOString(),
          progress: 40,
          smartScore: {
            specific: 60,
            measurable: 40,
            achievable: 70,
            relevant: 85,
            timeBound: 65,
            overall: 64
          }
        },
        {
          id: '3',
          title: 'Skrocic czas odpowiedzi supportu do 2 godzin',
          description: 'Wdrozyc automatyczny system ticketow i zatrudnic 2 dodatkowych agentow supportu aby osiagnac sredni czas odpowiedzi ponizej 2 godzin',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 5184000000).toISOString(),
          deadline: new Date(Date.now() - 1296000000).toISOString(),
          progress: 100,
          smartScore: {
            specific: 90,
            measurable: 100,
            achievable: 85,
            relevant: 95,
            timeBound: 90,
            overall: 92
          }
        }
      ];

      setGoals(mockGoals);
      if (mockGoals.length > 0) {
        setSelectedGoal(mockGoals[0]);
        loadAnalysis(mockGoals[0].id);
      }
      setIsLoading(false);
    }, 500);
  };

  const loadAnalysis = async (goalId: string) => {
    setTimeout(() => {
      const mockAnalysis: SmartAnalysis = {
        goalId,
        analysis: {
          specific: {
            score: 85,
            feedback: "Cel jasno okresla co zostanie poprawione (wskaznik konwersji) i o ile (15%). Dobrze zdefiniowany cel.",
            improvements: [
              "Rozważ sprecyzowanie, na które strony lub segmenty użytkowników się skupić",
              "Zdefiniuj dokładniej, co stanowi 'konwersję'"
            ]
          },
          measurable: {
            score: 95,
            feedback: "Doskonała mierzalność z konkretnymi celami procentowymi (2.3% do 2.65%). Łatwy do śledzenia postęp.",
            improvements: [
              "Rozważ dodanie pośrednich kamieni milowych",
              "Zdefiniuj częstotliwość pomiarów (dziennie, tygodniowo)"
            ]
          },
          achievable: {
            score: 75,
            feedback: "Poprawa o 15% jest ambitna, ale osiągalna przy odpowiednich działaniach optymalizacyjnych. Realistyczne biorąc pod uwagę obecną bazę.",
            improvements: [
              "Zweryfikuj wykonalność z danymi historycznymi",
              "Rozważ wymagania zasobowe do wdrożenia",
              "Podziel na mniejsze cele przyrostowe"
            ]
          },
          relevant: {
            score: 90,
            feedback: "Bardzo istotne dla wzrostu biznesu i przychodów. Bezpośredni wpływ na wynik finansowy i doświadczenie użytkownika.",
            improvements: [
              "Połącz z szerszymi celami biznesowymi",
              "Rozważ wpływ na inne metryki"
            ]
          },
          timeBound: {
            score: 80,
            feedback: "Jasno określony termin (koniec Q2). Wystarczający przedział czasowy na wdrożenie i pomiar.",
            improvements: [
              "Dodaj konkretną datę zamiast odniesienia do kwartału",
              "Dołącz daty kamieni milowych do sprawdzania postępów"
            ]
          }
        },
        overallRecommendations: [
          "Podziel cel na tygodniowe lub dwutygodniowe kamienie milowe",
          "Zdefiniuj konkretne taktyki: testy A/B, badania użytkowników, zmiany w designie",
          "Skonfiguruj automatyczne śledzenie i raportowanie",
          "Rozważ potencjalne przeszkody i strategie ich łagodzenia",
          "Uzgodnij z zespołami marketingu i designu alokację zasobów"
        ],
        lastAnalyzed: new Date().toISOString()
      };

      setAnalysis(mockAnalysis);
    }, 300);
  };

  const runAnalysis = async (goalId: string) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      toast.success('Analiza SMART zakończona!');
      loadAnalysis(goalId);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error('Tytuł celu jest wymagany');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      deadline: newGoal.deadline || undefined,
      progress: 0,
      smartScore: {
        specific: 0,
        measurable: 0,
        achievable: 0,
        relevant: 0,
        timeBound: 0,
        overall: 0
      }
    };

    setGoals(prev => [goal, ...prev]);
    setNewGoal({ title: '', description: '', deadline: '' });
    setShowNewGoalModal(false);
    toast.success('Cel utworzony! Uruchom analizę, aby uzyskać wynik SMART.');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Analiza SMART"
        subtitle="Szczegółowa analiza i ocena celów SMART"
        icon={BarChart3}
        iconColor="text-indigo-600"
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nowy cel
            </button>
            {selectedGoal && (
              <button
                onClick={() => runAnalysis(selectedGoal.id)}
                disabled={isAnalyzing}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analizowanie...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Uruchom analizę
                  </>
                )}
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cele ({goals.length})</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    selectedGoal?.id === goal.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedGoal(goal);
                    loadAnalysis(goal.id);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{goal.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        goal.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        goal.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {goal.status === 'COMPLETED' ? 'Ukończony' :
                         goal.status === 'ACTIVE' ? 'Aktywny' :
                         goal.status === 'PAUSED' ? 'Wstrzymany' : 'Szkic'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center">
                        <SlidersHorizontal className="w-3 h-3 mr-1" />
                        {goal.smartScore.overall}% SMART
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(goal.deadline)}
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                      <div
                        className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          {selectedGoal && analysis ? (
            <div className="space-y-6">
              {/* Goal Overview */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedGoal.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedGoal.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedGoal.smartScore.overall)}`}>
                    {selectedGoal.smartScore.overall}% SMART
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(selectedGoal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                    <div key={dimension} className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{score}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">{dimension}</div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${getScoreBarColor(score)}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Szczegółowa analiza</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ostatnia analiza: {formatDate(analysis.lastAnalyzed)}</p>
                </div>

                <div className="p-6 space-y-6">
                  {Object.entries(analysis.analysis).map(([dimension, data]) => (
                    <div key={dimension} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">{dimension}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(data.score)}`}>
                          {data.score}/100
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 mb-3">{data.feedback}</p>

                      {data.improvements.length > 0 && (
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Sugestie ulepszeń:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            {data.improvements.map((improvement, index) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Ogólne rekomendacje
                </h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-300">
                  {analysis.overallRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">&#8226;</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
              <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Wybierz cel do analizy</h3>
              <p className="text-slate-600 dark:text-slate-400">Wybierz cel z listy, aby zobaczyć szczegółową analizę SMART</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utwórz nowy cel</h3>
                <button
                  onClick={() => setShowNewGoalModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tytuł celu *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="np. Zwiększyć sprzedaż o 20%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opis
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder="Opisz szczegółowo swój cel..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Termin realizacji
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateGoal}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={!newGoal.title.trim()}
              >
                Utwórz cel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}
