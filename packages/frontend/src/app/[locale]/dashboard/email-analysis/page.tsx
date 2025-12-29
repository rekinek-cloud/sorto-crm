'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface AnalysisStats {
  summary: {
    totalMessages: number;
    positiveMessages: number;
    negativeMessages: number;
    urgentMessages: number;
    tasksCreated: number;
    avgUrgencyScore: number;
  };
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categories: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  trends: {
    urgencyTrend: string;
    sentimentTrend: string;
    volumeTrend: string;
  };
}

interface Insight {
  type: string;
  title: string;
  description: string;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface MessageAnalysis {
  messageId: string;
  analysis: {
    sentiment: {
      label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
      score: number;
      confidence: number;
    };
    tasks: {
      hasTasks: boolean;
      extractedTasks: Array<{
        title: string;
        priority: string;
        confidence: number;
      }>;
    };
    category: {
      category: string;
      confidence: number;
      businessValue: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    urgencyScore: number;
    summary: string;
    recommendedActions: string[];
  };
}

export default function EmailAnalysisPage() {
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<MessageAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingBulk, setAnalyzingBulk] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalysisData();
  }, [timeRange]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app would call API endpoints
      setStats({
        summary: {
          totalMessages: 247,
          positiveMessages: 89,
          negativeMessages: 23,
          urgentMessages: 15,
          tasksCreated: 67,
          avgUrgencyScore: 34
        },
        sentiment: {
          positive: 89,
          negative: 23,
          neutral: 135
        },
        categories: [
          { name: 'Client Communication', count: 89, percentage: 36 },
          { name: 'Project Management', count: 67, percentage: 27 },
          { name: 'Technical', count: 45, percentage: 18 },
          { name: 'Administrative', count: 32, percentage: 13 },
          { name: 'Internal', count: 14, percentage: 6 }
        ],
        trends: {
          urgencyTrend: 'increasing',
          sentimentTrend: 'stable',
          volumeTrend: 'increasing'
        }
      });

      setInsights([
        {
          type: 'urgent',
          title: 'High Priority Messages',
          description: 'You have 3 urgent unread messages',
          action: 'Review urgent messages immediately',
          priority: 'HIGH'
        },
        {
          type: 'sentiment',
          title: 'Negative Sentiment Detected',
          description: '5 messages with negative sentiment need attention',
          action: 'Address customer concerns promptly',
          priority: 'MEDIUM'
        },
        {
          type: 'tasks',
          title: 'Unprocessed Action Items',
          description: '12 messages contain action items that haven\'t been converted to tasks',
          action: 'Review and create tasks from messages',
          priority: 'MEDIUM'
        }
      ]);

      setRecentAnalyses([
        {
          messageId: '1',
          analysis: {
            sentiment: { label: 'NEGATIVE', score: -0.6, confidence: 0.8 },
            tasks: { 
              hasTasks: true, 
              extractedTasks: [
                { title: 'Follow up on client issue', priority: 'HIGH', confidence: 0.9 }
              ]
            },
            category: { category: 'CLIENT_COMMUNICATION', confidence: 0.95, businessValue: 'HIGH' },
            urgencyScore: 85,
            summary: 'Client expressing frustration with delayed delivery. Immediate response required.',
            recommendedActions: ['Respond within 1 hour', 'Escalate to account manager', 'Create follow-up task']
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error loading analysis data:', error);
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const runBulkAnalysis = async () => {
    setAnalyzingBulk(true);
    try {
      // Mock bulk analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Bulk analysis completed for 50 messages');
      await loadAnalysisData();
    } catch (error: any) {
      console.error('Error running bulk analysis:', error);
      toast.error('Failed to run bulk analysis');
    } finally {
      setAnalyzingBulk(false);
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'POSITIVE': return 'text-green-600 bg-green-100';
      case 'NEGATIVE': return 'text-red-600 bg-red-100';
      case 'MIXED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Email Analysis</h1>
          <p className="text-gray-600">AI-powered analysis of your email communication</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button 
            onClick={runBulkAnalysis}
            disabled={analyzingBulk}
            className="btn btn-primary"
          >
            {analyzingBulk ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🔍 Key Insights</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'HIGH' ? 'border-red-500 bg-red-50' :
                  insight.priority === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                  'border-green-500 bg-green-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getPriorityIcon(insight.priority)}</span>
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          insight.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          insight.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                      <p className="text-blue-600 text-sm font-medium">{insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.summary.totalMessages}</div>
                <div className="text-sm text-gray-500">Total Messages</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">😊</div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-600">{stats.summary.positiveMessages}</div>
                <div className="text-sm text-gray-500">Positive Sentiment</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🚨</div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-red-600">{stats.summary.urgentMessages}</div>
                <div className="text-sm text-gray-500">Urgent Messages</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">✅</div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-600">{stats.summary.tasksCreated}</div>
                <div className="text-sm text-gray-500">Tasks Created</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        {stats && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sentiment Distribution</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Positive</span>
                  <span className="text-sm text-gray-600">{stats.sentiment.positive}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.sentiment.positive / stats.summary.totalMessages) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Neutral</span>
                  <span className="text-sm text-gray-600">{stats.sentiment.neutral}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${(stats.sentiment.neutral / stats.summary.totalMessages) * 100}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">Negative</span>
                  <span className="text-sm text-gray-600">{stats.sentiment.negative}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.sentiment.negative / stats.summary.totalMessages) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Distribution */}
        {stats && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Message Categories</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{category.count}</span>
                      <span className="text-xs text-gray-500">({category.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Analysis Results</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAnalyses.map((result, index) => (
              <div key={index} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSentimentColor(result.analysis.sentiment.label)}`}>
                          {result.analysis.sentiment.label}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(result.analysis.urgencyScore)}`}>
                          Urgency: {result.analysis.urgencyScore}%
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {result.analysis.category.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-3">{result.analysis.summary}</p>
                      
                      {result.analysis.tasks.hasTasks && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Detected Tasks:</h4>
                          <div className="space-y-1">
                            {result.analysis.tasks.extractedTasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-center space-x-2 text-sm">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-gray-700">{task.title}</span>
                                <span className="text-xs text-gray-500">({Math.round(task.confidence * 100)}% confidence)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Recommended Actions:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {result.analysis.recommendedActions.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🤖 AI Analysis Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Sentiment Analysis:</strong> Automatically detects positive, negative, and neutral emotions in messages
          </div>
          <div>
            <strong>Task Detection:</strong> Identifies actionable items and automatically creates GTD tasks
          </div>
          <div>
            <strong>Urgency Scoring:</strong> Calculates urgency based on keywords, punctuation, and context
          </div>
          <div>
            <strong>Smart Categorization:</strong> Classifies messages by type and business value
          </div>
        </div>
      </div>
    </div>
  );
}