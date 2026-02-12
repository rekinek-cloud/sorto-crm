'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import {
  Lightbulb,
  ArrowRight,
  Clock,
  Check,
  X,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface SmartCriteria {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

interface Milestone {
  title: string;
  description: string;
  targetDate: string;
  successCriteria: string;
}

interface GoalRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'PRODUCTIVITY' | 'LEARNING' | 'HEALTH' | 'CAREER' | 'BUSINESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedDuration: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  smartCriteria: SmartCriteria;
  potentialImpact: number;
  requiredResources: string[];
  milestones: Milestone[];
}

const categoryConfig = {
  PRODUCTIVITY: { color: 'blue', icon: '⚡', label: 'Productivity' },
  LEARNING: { color: 'green', icon: '📚', label: 'Learning' },
  HEALTH: { color: 'pink', icon: '💪', label: 'Health' },
  CAREER: { color: 'purple', icon: '🚀', label: 'Career' },
  BUSINESS: { color: 'orange', icon: '📊', label: 'Business' },
};

const priorityConfig = {
  HIGH: { color: 'red', label: 'High Priority' },
  MEDIUM: { color: 'yellow', label: 'Medium Priority' },
  LOW: { color: 'gray', label: 'Low Priority' },
};

export default function GoalRecommendations() {
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/ai/goal-recommendations');
      setRecommendations(response.data.data);
    } catch (error: any) {
      console.error('Failed to load goal recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissRecommendation = (id: string) => {
    setDismissedCards(prev => new Set([...prev, id]));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const visibleRecommendations = recommendations.filter(rec => !dismissedCards.has(rec.id));

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Goal Recommendations</h3>
              <p className="text-sm text-gray-600">Personalized goals based on your activity patterns</p>
            </div>
          </div>
          <button
            onClick={loadRecommendations}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {visibleRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recommendations available at the moment.</p>
            <button
              onClick={loadRecommendations}
              className="btn btn-primary btn-sm mt-3"
            >
              Generate Recommendations
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {visibleRecommendations.map((recommendation, index) => {
                const category = categoryConfig[recommendation.category];
                const priority = priorityConfig[recommendation.priority];
                const isExpanded = expandedCard === recommendation.id;

                return (
                  <motion.div
                    key={recommendation.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${category.color}-100 text-${category.color}-700`}>
                              {category.label}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priority.color}-100 text-${priority.color}-700`}>
                              {priority.label}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {recommendation.title}
                          </h4>
                          
                          <p className="text-gray-600 text-sm mb-3">
                            {recommendation.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{recommendation.estimatedDuration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <BarChart3 className="w-4 h-4" />
                              <span>{recommendation.confidence}% confidence</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : recommendation.id)}
                            className="btn btn-outline btn-sm"
                          >
                            {isExpanded ? 'Show Less' : 'Show Details'}
                          </button>
                          <button
                            onClick={() => dismissRecommendation(recommendation.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            {/* SMART Criteria */}
                            <div className="mb-6">
                              <h5 className="font-medium text-gray-900 mb-3">SMART Criteria</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(recommendation.smartCriteria).map(([key, value]) => (
                                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium text-sm text-gray-700 capitalize mb-1">
                                      {key === 'timeBound' ? 'Time-Bound' : key}
                                    </div>
                                    <div className="text-sm text-gray-600">{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Suggested Actions */}
                            <div className="mb-6">
                              <h5 className="font-medium text-gray-900 mb-3">Suggested Actions</h5>
                              <ul className="space-y-2">
                                {recommendation.suggestedActions.map((action, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Milestones */}
                            {recommendation.milestones.length > 0 && (
                              <div className="mb-6">
                                <h5 className="font-medium text-gray-900 mb-3">Key Milestones</h5>
                                <div className="space-y-3">
                                  {recommendation.milestones.map((milestone, idx) => (
                                    <div key={idx} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                      <div className="flex items-center justify-between mb-2">
                                        <h6 className="font-medium text-blue-900">{milestone.title}</h6>
                                        <span className="text-xs text-blue-700">
                                          {formatDate(milestone.targetDate)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-blue-800 mb-2">{milestone.description}</p>
                                      <p className="text-xs text-blue-600">
                                        Success: {milestone.successCriteria}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Impact and Resources */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Required Resources</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {recommendation.requiredResources.map((resource, idx) => (
                                    <li key={idx} className="flex items-start space-x-1">
                                      <span>•</span>
                                      <span>{resource}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Expected Impact</h5>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${recommendation.potentialImpact}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {recommendation.potentialImpact}%
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{recommendation.reasoning}</p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
                              <button className="btn btn-primary btn-sm">
                                Create Goal
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </button>
                              <button className="btn btn-outline btn-sm">
                                Save for Later
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}