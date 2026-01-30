'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon,
  RocketLaunchIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

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
          title: 'Increase website conversion rate by 15%',
          description: 'Improve landing page optimization and user experience to boost conversion from 2.3% to 2.65% by Q2 end',
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
          title: 'Launch mobile app',
          description: 'Develop and release iOS and Android mobile application',
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
          title: 'Reduce customer support response time to under 2 hours',
          description: 'Implement automated ticketing system and hire 2 additional support agents to achieve average response time of under 2 hours',
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
            feedback: "Goal clearly defines what will be improved (conversion rate) and by how much (15%). Well-defined target.",
            improvements: [
              "Consider specifying which pages or user segments to focus on",
              "Define what constitutes a 'conversion' more precisely"
            ]
          },
          measurable: {
            score: 95,
            feedback: "Excellent measurability with specific percentage targets (2.3% to 2.65%). Easy to track progress.",
            improvements: [
              "Consider adding intermediate milestones",
              "Define measurement frequency (daily, weekly)"
            ]
          },
          achievable: {
            score: 75,
            feedback: "15% improvement is ambitious but achievable with proper optimization efforts. Realistic given current baseline.",
            improvements: [
              "Validate feasibility with historical data",
              "Consider resource requirements for implementation",
              "Break down into smaller incremental goals"
            ]
          },
          relevant: {
            score: 90,
            feedback: "Highly relevant to business growth and revenue. Directly impacts bottom line and user experience.",
            improvements: [
              "Connect to broader business objectives",
              "Consider impact on other metrics"
            ]
          },
          timeBound: {
            score: 80,
            feedback: "Clear deadline specified (Q2 end). Sufficient time frame for implementation and measurement.",
            improvements: [
              "Add specific date instead of quarter reference",
              "Include milestone dates for progress check-ins"
            ]
          }
        },
        overallRecommendations: [
          "Break down the goal into weekly or bi-weekly milestones",
          "Define specific tactics: A/B testing, user research, design changes",
          "Set up automated tracking and reporting",
          "Consider potential obstacles and mitigation strategies",
          "Align with marketing and design teams for resource allocation"
        ],
        lastAnalyzed: new Date().toISOString()
      };

      setAnalysis(mockAnalysis);
    }, 300);
  };

  const runAnalysis = async (goalId: string) => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      toast.success('SMART analysis completed!');
      loadAnalysis(goalId);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error('Goal title is required');
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
    toast.success('Goal created! Run analysis to get SMART score.');
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
          <h1 className="text-2xl font-bold text-gray-900">SMART Analysis</h1>
          <p className="text-gray-600">Detailed analysis and scoring for SMART goals</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="btn btn-outline"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Goal
          </button>
          {selectedGoal && (
            <button
              onClick={() => runAnalysis(selectedGoal.id)}
              disabled={isAnalyzing}
              className="btn btn-primary"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <BoltIcon className="w-5 h-5 mr-2" />
                  Run Analysis
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
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedGoal?.id === goal.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
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
                      <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        goal.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                        goal.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-3 h-3 mr-1" />
                        {goal.smartScore.overall}% SMART
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {formatDate(goal.deadline)}
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-primary-600 h-1 rounded-full transition-all duration-300"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedGoal.title}</h3>
                    <p className="text-gray-600 mt-1">{selectedGoal.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(selectedGoal.smartScore.overall)}`}>
                    {selectedGoal.smartScore.overall}% SMART
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(selectedGoal.smartScore).filter(([key]) => key !== 'overall').map(([dimension, score]) => (
                    <div key={dimension} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{score}</div>
                      <div className="text-sm text-gray-600 capitalize">{dimension}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
                  <p className="text-sm text-gray-500">Last analyzed: {formatDate(analysis.lastAnalyzed)}</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {Object.entries(analysis.analysis).map(([dimension, data]) => (
                    <div key={dimension} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 capitalize">{dimension}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(data.score)}`}>
                          {data.score}/100
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{data.feedback}</p>
                      
                      {data.improvements.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Improvement Suggestions:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Overall Recommendations</h3>
                <ul className="space-y-2 text-blue-800">
                  {analysis.overallRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Goal to Analyze</h3>
              <p className="text-gray-600">Choose a goal from the list to see detailed SMART analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New Goal</h3>
                <button
                  onClick={() => setShowNewGoalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Increase sales by 20%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Describe your goal in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="btn btn-primary flex-1"
                disabled={!newGoal.title.trim()}
              >
                Create Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}