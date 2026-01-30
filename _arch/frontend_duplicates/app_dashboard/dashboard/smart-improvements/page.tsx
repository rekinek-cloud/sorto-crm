'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  BoltIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

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
          title: 'Increase website conversion rate by 15%',
          description: 'Improve landing page optimization and user experience to boost conversion from 2.3% to 2.65% by Q2 end',
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
          title: 'Launch mobile app',
          description: 'Develop and release iOS and Android mobile application',
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
          title: 'Get better at time management',
          description: 'Improve productivity and organization',
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
        setSelectedGoal(mockGoals[1]); // Select the mobile app goal which needs improvement
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
            suggestion: "Define specific features, platforms, and target audience",
            originalText: "Launch mobile app",
            improvedText: "Launch iOS and Android mobile app with core features (user authentication, offline sync, push notifications) for existing web users by Q3 2024",
            explanation: "Specifies platforms, key features, and target audience",
            priority: 'HIGH',
            applied: false
          },
          {
            id: '2',
            goalId,
            dimension: 'measurable',
            currentScore: 40,
            targetScore: 90,
            suggestion: "Add concrete metrics and success criteria",
            originalText: "Develop and release iOS and Android mobile application",
            improvedText: "Develop and release mobile app achieving 1,000 downloads in first month, 4.5+ app store rating, and 60% feature adoption rate",
            explanation: "Includes specific download targets, quality metrics, and usage indicators",
            priority: 'HIGH',
            applied: false
          },
          {
            id: '3',
            goalId,
            dimension: 'timeBound',
            currentScore: 65,
            targetScore: 85,
            suggestion: "Add specific milestones and deadlines",
            originalText: "by Q3 2024",
            improvedText: "Beta release by August 15, 2024; App store submission by September 1; Full launch by September 30, 2024",
            explanation: "Breaks down timeline into specific milestones with clear deadlines",
            priority: 'MEDIUM',
            applied: false
          },
          {
            id: '4',
            goalId,
            dimension: 'achievable',
            currentScore: 70,
            targetScore: 80,
            suggestion: "Consider resource constraints and validate feasibility",
            originalText: "Develop and release iOS and Android mobile application",
            improvedText: "Develop MVP mobile app with 2 developers over 4 months, focusing on core features validated through user testing",
            explanation: "Accounts for team size, timeline, and scope validation",
            priority: 'MEDIUM',
            applied: false
          }
        ],
        overallImpact: 25,
        generatedAt: new Date().toISOString()
      };

      setImprovements(mockImprovements);
      setIsGenerating(false);
      toast.success('Improvements generated successfully!');
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

    // Update goal score
    setSelectedGoal(prev => {
      if (!prev) return prev;
      
      const updatedScore = { ...prev.smartScore };
      updatedScore[improvement.dimension] = improvement.targetScore;
      
      // Recalculate overall score
      const dimensions = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const;
      const average = dimensions.reduce((sum, dim) => sum + updatedScore[dim], 0) / dimensions.length;
      updatedScore.overall = Math.round(average);

      return {
        ...prev,
        smartScore: updatedScore
      };
    });

    toast.success('Improvement applied to goal!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMART Improvements</h1>
          <p className="text-gray-600">AI-powered suggestions to enhance your goals</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedGoal && (
            <button
              onClick={() => generateImprovements(selectedGoal.id)}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <BoltIcon className="w-5 h-5 mr-2" />
                  Generate Improvements
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Goals ({goals.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedGoal?.id === goal.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
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
                      <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                      <span className={`text-sm font-medium ${getScoreColor(goal.smartScore.overall)}`}>
                        {goal.smartScore.overall}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {Object.entries(goal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                        <div key={dimension} className="text-center">
                          <div className={`font-medium ${getScoreColor(score)}`}>{score}</div>
                          <div className="text-gray-500 capitalize">{dimension.charAt(0)}</div>
                        </div>
                      ))}
                    </div>
                    
                    {goal.smartScore.overall < 70 && (
                      <div className="flex items-center text-xs text-orange-600">
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Needs improvement
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedGoal.title}</h3>
                    <p className="text-gray-600 mt-1">{selectedGoal.description}</p>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(selectedGoal.smartScore.overall)}`}>
                    {selectedGoal.smartScore.overall}%
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {Object.entries(selectedGoal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                    <div key={dimension} className="text-center">
                      <div className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
                      <div className="text-sm text-gray-600 capitalize">{dimension}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
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
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Improvement Suggestions ({improvements.improvements.length})
                      </h3>
                      <div className="text-sm text-gray-500">
                        Generated: {formatDate(improvements.generatedAt)}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <div className="flex items-center">
                        <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-900 font-medium">
                          Potential improvement: +{improvements.overallImpact} points overall
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {improvements.improvements.map((improvement, index) => (
                        <motion.div
                          key={improvement.id}
                          className="border border-gray-200 rounded-lg p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-semibold text-gray-900 capitalize">
                                {improvement.dimension}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(improvement.priority)}`}>
                                {improvement.priority}
                              </span>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className={getScoreColor(improvement.currentScore)}>
                                  {improvement.currentScore}
                                </span>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
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
                                className="btn btn-outline text-sm py-1 px-2"
                              >
                                <PencilIcon className="w-4 h-4 mr-1" />
                                Preview
                              </button>
                              <button
                                onClick={() => applyImprovement(improvement)}
                                disabled={improvement.applied}
                                className={`btn text-sm py-1 px-2 ${
                                  improvement.applied 
                                    ? 'btn-outline opacity-50 cursor-not-allowed' 
                                    : 'btn-primary'
                                }`}
                              >
                                {improvement.applied ? (
                                  <>
                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                    Applied
                                  </>
                                ) : (
                                  'Apply'
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-2">{improvement.suggestion}</p>
                          <p className="text-sm text-gray-600">{improvement.explanation}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Improvements</h3>
                  <p className="text-gray-600 mb-4">
                    Click "Generate Improvements" to get AI-powered suggestions for this goal
                  </p>
                  <button
                    onClick={() => generateImprovements(selectedGoal.id)}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <BoltIcon className="w-5 h-5 mr-2" />
                        Generate Improvements
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Goal</h3>
              <p className="text-gray-600">Choose a goal from the list to generate improvements</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparisonModal && selectedImprovement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedImprovement.dimension.charAt(0).toUpperCase() + selectedImprovement.dimension.slice(1)} Improvement Preview
                  </h3>
                  <button
                    onClick={() => setShowComparisonModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Current Version</h4>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-900">{selectedImprovement.originalText}</p>
                      <div className="mt-2 text-sm text-red-700">
                        Score: {selectedImprovement.currentScore}/100
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Improved Version</h4>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-900">{selectedImprovement.improvedText}</p>
                      <div className="mt-2 text-sm text-green-700">
                        Score: {selectedImprovement.targetScore}/100
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Why This Improvement Helps</h4>
                  <p className="text-gray-700">{selectedImprovement.explanation}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    applyImprovement(selectedImprovement);
                    setShowComparisonModal(false);
                  }}
                  disabled={selectedImprovement.applied}
                  className="btn btn-primary flex-1"
                >
                  {selectedImprovement.applied ? 'Already Applied' : 'Apply Improvement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Improvement Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 SMART Improvement Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Specific:</strong> Use concrete details, numbers, and clear outcomes
          </div>
          <div>
            <strong>Measurable:</strong> Include metrics, KPIs, and tracking methods
          </div>
          <div>
            <strong>Achievable:</strong> Consider resources, skills, and constraints
          </div>
          <div>
            <strong>Relevant:</strong> Align with broader objectives and priorities
          </div>
          <div>
            <strong>Time-bound:</strong> Set specific deadlines and milestones
          </div>
          <div>
            <strong>Review:</strong> Regularly assess and refine your goals
          </div>
        </div>
      </div>
    </motion.div>
  );
}