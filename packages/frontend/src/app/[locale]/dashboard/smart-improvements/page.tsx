'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Zap,
  Lightbulb,
  CheckCircle2,
  X,
  ArrowRight,
  AlertTriangle,
  Clock,
  Rocket,
  BarChart3,
  Pencil,
  Target,
  Wrench,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  smartScore: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timeBound: number;
    overall: number;
  };
}

interface Improvement {
  id: string;
  goalId: string;
  dimension: 'specific' | 'measurable' | 'achievable' | 'relevant' | 'timeBound';
  currentScore: number;
  targetScore: number;
  suggestion: string;
  originalText: string;
  improvedText: string;
  explanation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  applied: boolean;
}

interface GeneratedImprovements {
  goalId: string;
  improvements: Improvement[];
  overallImpact: number;
  generatedAt: string;
}

export default function SmartImprovementsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [improvements, setImprovements] = useState<GeneratedImprovements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState<Improvement | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

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
          title: 'Poprawic zarzadzanie czasem',
          description: 'Poprawic produktywnosc i organizacje',
          status: 'DRAFT',
          smartScore: {
            specific: 30,
            measurable: 25,
            achievable: 50,
            relevant: 70,
            timeBound: 20,
            overall: 39
          }
        }
      ];

      setGoals(mockGoals);
      if (mockGoals.length > 0) {
        setSelectedGoal(mockGoals[1]);
      }
      setIsLoading(false);
    }, 500);
  };

  const generateImprovements = async (goalId: string) => {
    setIsGenerating(true);

    setTimeout(() => {
      const mockImprovements: GeneratedImprovements = {
        goalId,
        improvements: [
          {
            id: '1',
            goalId,
            dimension: 'specific',
            currentScore: 60,
            targetScore: 85,
            suggestion: "Zdefiniuj konkretne funkcje, platformy i grupę docelową",
            originalText: "Uruchomić aplikację mobilną",
            improvedText: "Uruchomić aplikację mobilną na iOS i Android z kluczowymi funkcjami (autentykacja, synchronizacja offline, powiadomienia push) dla obecnych użytkowników webowych do Q3 2024",
            explanation: "Precyzuje platformy, kluczowe funkcje i grupę docelową",
            priority: 'HIGH',
            applied: false
          },
          {
            id: '2',
            goalId,
            dimension: 'measurable',
            currentScore: 40,
            targetScore: 90,
            suggestion: "Dodaj konkretne metryki i kryteria sukcesu",
            originalText: "Opracować i wydać aplikację mobilną na iOS i Android",
            improvedText: "Opracować i wydać aplikację mobilną osiągając 1000 pobrań w pierwszym miesiącu, ocenę 4.5+ w sklepie i 60% wskaźnik adopcji funkcji",
            explanation: "Zawiera konkretne cele pobrań, metryki jakości i wskaźniki użytkowania",
            priority: 'HIGH',
            applied: false
          },
          {
            id: '3',
            goalId,
            dimension: 'timeBound',
            currentScore: 65,
            targetScore: 85,
            suggestion: "Dodaj konkretne kamienie milowe i terminy",
            originalText: "do Q3 2024",
            improvedText: "Wydanie beta do 15 sierpnia 2024; Złożenie do sklepu do 1 września; Pełne uruchomienie do 30 września 2024",
            explanation: "Dzieli oś czasu na konkretne kamienie milowe z jasnymi terminami",
            priority: 'MEDIUM',
            applied: false
          },
          {
            id: '4',
            goalId,
            dimension: 'achievable',
            currentScore: 70,
            targetScore: 80,
            suggestion: "Rozważ ograniczenia zasobowe i zweryfikuj wykonalność",
            originalText: "Opracować i wydać aplikację mobilną na iOS i Android",
            improvedText: "Opracować MVP aplikacji z 2 developerami przez 4 miesiące, skupiając się na kluczowych funkcjach zwalidowanych testami użytkowników",
            explanation: "Uwzględnia wielkość zespołu, oś czasu i walidację zakresu",
            priority: 'MEDIUM',
            applied: false
          }
        ],
        overallImpact: 25,
        generatedAt: new Date().toISOString()
      };

      setImprovements(mockImprovements);
      setIsGenerating(false);
      toast.success('Ulepszenia wygenerowane pomyślnie!');
    }, 2500);
  };

  const applyImprovement = (improvement: Improvement) => {
    setImprovements(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        improvements: prev.improvements.map(imp =>
          imp.id === improvement.id ? { ...imp, applied: true } : imp
        )
      };
    });

    setSelectedGoal(prev => {
      if (!prev) return prev;

      const updatedScore = { ...prev.smartScore };
      updatedScore[improvement.dimension] = improvement.targetScore;

      const dimensions = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const;
      const average = dimensions.reduce((sum, dim) => sum + updatedScore[dim], 0) / dimensions.length;
      updatedScore.overall = Math.round(average);

      return {
        ...prev,
        smartScore: updatedScore
      };
    });

    toast.success('Ulepszenie zastosowane do celu!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'LOW': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
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
        title="Ulepszenia SMART"
        subtitle="Sugestie AI do ulepszania celów"
        icon={Zap}
        iconColor="text-amber-600"
        actions={
          selectedGoal ? (
            <button
              onClick={() => generateImprovements(selectedGoal.id)}
              disabled={isGenerating}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generowanie...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Generuj ulepszenia
                </>
              )}
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cele ({goals.length})</h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    selectedGoal?.id === goal.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedGoal(goal);
                    setImprovements(null);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{goal.title}</h4>
                      <span className={`text-sm font-medium ${getScoreColor(goal.smartScore.overall)}`}>
                        {goal.smartScore.overall}%
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {Object.entries(goal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                        <div key={dimension} className="text-center">
                          <div className={`font-medium ${getScoreColor(score)}`}>{score}</div>
                          <div className="text-slate-500 dark:text-slate-400 capitalize">{dimension.charAt(0)}</div>
                        </div>
                      ))}
                    </div>

                    {goal.smartScore.overall < 70 && (
                      <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Wymaga ulepszenia
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Improvements Panel */}
        <div className="lg:col-span-2">
          {selectedGoal ? (
            <div className="space-y-6">
              {/* Goal Overview */}
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedGoal.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedGoal.description}</p>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(selectedGoal.smartScore.overall)}`}>
                    {selectedGoal.smartScore.overall}%
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-4 mt-4">
                  {Object.entries(selectedGoal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                    <div key={dimension} className="text-center">
                      <div className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">{dimension}</div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              {improvements ? (
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Sugestie ulepszeń ({improvements.improvements.length})
                      </h3>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Wygenerowano: {formatDate(improvements.generatedAt)}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800/30">
                      <div className="flex items-center">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-blue-900 dark:text-blue-300 font-medium">
                          Potencjalna poprawa: +{improvements.overallImpact} punktów ogólnie
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {improvements.improvements.map((improvement, index) => (
                        <motion.div
                          key={improvement.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 capitalize">
                                {improvement.dimension}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(improvement.priority)}`}>
                                {improvement.priority === 'HIGH' ? 'Wysoki' : improvement.priority === 'MEDIUM' ? 'Średni' : 'Niski'}
                              </span>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className={getScoreColor(improvement.currentScore)}>
                                  {improvement.currentScore}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span className={getScoreColor(improvement.targetScore)}>
                                  {improvement.targetScore}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedImprovement(improvement);
                                  setShowComparisonModal(true);
                                }}
                                className="flex items-center px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Podgląd
                              </button>
                              <button
                                onClick={() => applyImprovement(improvement)}
                                disabled={improvement.applied}
                                className={`flex items-center px-2 py-1 text-sm rounded-lg transition-colors ${
                                  improvement.applied
                                    ? 'border border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 opacity-50 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {improvement.applied ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Zastosowano
                                  </>
                                ) : (
                                  'Zastosuj'
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 mb-2">{improvement.suggestion}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{improvement.explanation}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
                  <Wrench className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Generuj ulepszenia</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Kliknij &quot;Generuj ulepszenia&quot;, aby uzyskać sugestie AI dla tego celu
                  </p>
                  <button
                    onClick={() => generateImprovements(selectedGoal.id)}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generowanie...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Generuj ulepszenia
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
              <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Wybierz cel</h3>
              <p className="text-slate-600 dark:text-slate-400">Wybierz cel z listy, aby wygenerować ulepszenia</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparisonModal && selectedImprovement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Podgląd ulepszenia: {selectedImprovement.dimension.charAt(0).toUpperCase() + selectedImprovement.dimension.slice(1)}
                  </h3>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Obecna wersja</h4>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                      <p className="text-red-900 dark:text-red-300">{selectedImprovement.originalText}</p>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                        Wynik: {selectedImprovement.currentScore}/100
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Ulepszona wersja</h4>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                      <p className="text-green-900 dark:text-green-300">{selectedImprovement.improvedText}</p>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                        Wynik: {selectedImprovement.targetScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Dlaczego to ulepszenie pomaga</h4>
                  <p className="text-slate-700 dark:text-slate-300">{selectedImprovement.explanation}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Zamknij
                </button>
                <button
                  onClick={() => {
                    applyImprovement(selectedImprovement);
                    setShowComparisonModal(false);
                  }}
                  disabled={selectedImprovement.applied}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {selectedImprovement.applied ? 'Już zastosowano' : 'Zastosuj ulepszenie'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Improvement Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Wskazówki dotyczące ulepszeń SMART
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-300">
          <div>
            <strong>Specific (Konkretny):</strong> Użyj konkretnych szczegółów, liczb i jasnych rezultatów
          </div>
          <div>
            <strong>Measurable (Mierzalny):</strong> Dołącz metryki, KPI i metody śledzenia
          </div>
          <div>
            <strong>Achievable (Osiągalny):</strong> Rozważ zasoby, umiejętności i ograniczenia
          </div>
          <div>
            <strong>Relevant (Istotny):</strong> Dopasuj do szerszych celów i priorytetów
          </div>
          <div>
            <strong>Time-bound (Czasowy):</strong> Ustaw konkretne terminy i kamienie milowe
          </div>
          <div>
            <strong>Przegląd:</strong> Regularnie oceniaj i udoskonalaj swoje cele
          </div>
        </div>
      </div>
    </PageShell>
  );
}
