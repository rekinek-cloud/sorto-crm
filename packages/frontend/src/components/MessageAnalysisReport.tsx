'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface MessageAnalysisReport {
  // Sentiment Analysis
  sentiment?: {
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
    score: number;
    confidence: number;
    magnitude: number;
  };

  // Task Detection
  extractedTasks?: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    context?: string;
    dueDate?: string;
    estimatedTime?: number;
  }>;

  // Message Categorization
  category?: {
    primary: 'PROJECT_MANAGEMENT' | 'CLIENT_COMMUNICATION' | 'INTERNAL_OPERATIONS' | 'TECHNICAL' | 'ADMINISTRATIVE';
    businessValue: 'HIGH' | 'MEDIUM' | 'LOW';
    tags: string[];
    confidence: number;
  };

  // Urgency Analysis
  urgencyAnalysis?: {
    score: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
  };

  // Content Analysis
  contentAnalysis?: {
    summary: string;
    keyTopics: string[];
    readingTime: number;
    wordCount: number;
    actionItems: string[];
    questions: string[];
  };

  // CRM Analysis
  crmAnalysis?: {
    contactDetected?: {
      name: string;
      email: string;
      confidence: number;
      matched: boolean;
    };
    companyDetected?: {
      name: string;
      domain: string;
      confidence: number;
      matched: boolean;
    };
    dealPotential?: {
      likelihood: number;
      estimatedValue?: number;
      stage: string;
      indicators: string[];
    };
  };

  // SMART Analysis (if tasks were created)
  smartAnalysis?: {
    overallScore: number;
    breakdown: {
      specific: { score: number; feedback: string };
      measurable: { score: number; feedback: string };
      achievable: { score: number; feedback: string };
      relevant: { score: number; feedback: string };
      timeBound: { score: number; feedback: string };
    };
    recommendations: string[];
  };

  // Processing Results
  processingResults?: {
    tasksCreated: number;
    contactsCreated: number;
    companiesCreated: number;
    dealsCreated: number;
    rulesApplied: string[];
    automatedActions: string[];
  };

  // Meta Information
  analyzedAt: string;
  processingTime: number;
  version: string;
}

interface Props {
  messageId: string;
  analysis?: MessageAnalysisReport;
  onAnalysisUpdate?: (analysis: MessageAnalysisReport) => void;
}

export default function MessageAnalysisReport({ messageId, analysis: initialAnalysis, onAnalysisUpdate }: Props) {
  const [analysis, setAnalysis] = useState<MessageAnalysisReport | null>(initialAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!initialAnalysis && messageId) {
      loadAnalysis();
    }
  }, [messageId, initialAnalysis]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analysis/messages/${messageId}`);
      setAnalysis(response.data);
      onAnalysisUpdate?.(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('No analysis found for message');
      } else {
        console.error('Error loading analysis:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      toast.loading('Analyzing message with AI...', { id: 'message-analysis' });
      
      const response = await apiClient.post(`/analysis/messages/${messageId}/analyze`);
      
      // Enhanced response with CRM data
      const analysisResult = {
        ...response.data.analysis,
        crmAnalysis: response.data.crmData ? {
          contactDetected: response.data.crmData.contact ? {
            name: `${response.data.crmData.contact.firstName} ${response.data.crmData.contact.lastName}`,
            email: response.data.crmData.contact.email,
            confidence: 0.95,
            matched: !response.data.crmData.contact.tags?.includes('auto-created')
          } : undefined,
          companyDetected: response.data.crmData.company ? {
            name: response.data.crmData.company.name,
            domain: response.data.crmData.company.website || 'N/A',
            confidence: 0.90,
            matched: !response.data.crmData.company.tags?.includes('auto-created')
          } : undefined,
          dealPotential: response.data.crmData.deal ? {
            likelihood: 85,
            estimatedValue: response.data.crmData.deal.value,
            stage: response.data.crmData.deal.stage,
            indicators: ['Email inquiry', 'Business domain', 'Contact information']
          } : undefined
        } : undefined,
        processingResults: {
          tasksCreated: response.data.crmData?.task ? 1 : 0,
          contactsCreated: response.data.crmData?.contact?.tags?.includes('auto-created') ? 1 : 0,
          companiesCreated: response.data.crmData?.company?.tags?.includes('auto-created') ? 1 : 0,
          dealsCreated: response.data.crmData?.deal?.tags?.includes('auto-created') ? 1 : 0,
          rulesApplied: ['ai-classification', 'crm-linkage', 'sentiment-analysis'],
          automatedActions: response.data.processingResults?.map((r: any) => r.actionTaken) || []
        }
      };

      setAnalysis(analysisResult);
      onAnalysisUpdate?.(analysisResult);
      
      // Show detailed success message
      if (response.data.crmData?.contact) {
        const status = response.data.crmData.contact.status as string;
        const statusMessages: Record<string, string> = {
          'LEAD': '✅ Potential customer detected!',
          'INACTIVE': '⚠️ Marketing/spam email detected',
          'ARCHIVED': '📄 Business document processed',
          'ACTIVE': '👤 Contact added for review'
        };
        const statusMsg = statusMessages[status] || 'Contact processed';
        
        toast.success(`${statusMsg} Contact: ${response.data.crmData.contact.firstName} ${response.data.crmData.contact.lastName}`, { 
          id: 'message-analysis',
          duration: 5000 
        });
      } else {
        toast.success('AI analysis completed!', { id: 'message-analysis' });
      }
    } catch (error: any) {
      console.error('Error running analysis:', error);
      toast.error('Failed to analyze message', { id: 'message-analysis' });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-50';
      case 'NEGATIVE': return 'text-red-600 bg-red-50';
      case 'MIXED': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading && !analysis) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Loading analysis...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">AI Analysis</h4>
            <p className="text-sm text-gray-600">No analysis available for this message</p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="btn btn-sm btn-primary"
          >
            🤖 Analyze Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h4 className="font-medium text-gray-900">🤖 AI Analysis Report</h4>
            <span className="text-xs text-gray-500">
              Analyzed {new Date(analysis.analyzedAt).toLocaleString('pl-PL')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="btn btn-sm btn-outline"
              title="Re-analyze message"
            >
              {loading ? '🔄' : '🔄'} Refresh
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn btn-sm btn-outline"
            >
              {expanded ? '📤 Collapse' : '📥 Expand'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analysis.sentiment && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getSentimentColor(analysis.sentiment.label)}`}>
              <div className="flex items-center justify-between">
                <span>Sentiment</span>
                <span>{analysis.sentiment.label}</span>
              </div>
              <div className="text-xs opacity-75">
                {Math.round(analysis.sentiment.score * 100)}% confidence
              </div>
            </div>
          )}

          {analysis.urgencyAnalysis && (
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getUrgencyColor(analysis.urgencyAnalysis.score)}`}>
              <div className="flex items-center justify-between">
                <span>Urgency</span>
                <span>{analysis.urgencyAnalysis.score}%</span>
              </div>
              <div className="text-xs opacity-75">
                {analysis.urgencyAnalysis.score >= 80 ? 'Immediate action' : 
                 analysis.urgencyAnalysis.score >= 60 ? 'Soon' : 
                 analysis.urgencyAnalysis.score >= 40 ? 'Normal' : 'Low priority'}
              </div>
            </div>
          )}

          {analysis.category && (
            <div className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-600">
              <div className="flex items-center justify-between">
                <span>Category</span>
                <span className="text-xs">{analysis.category.primary}</span>
              </div>
              <div className="text-xs opacity-75">
                {analysis.category.businessValue} value
              </div>
            </div>
          )}

          {analysis.processingResults && (
            <div className="px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-600">
              <div className="flex items-center justify-between">
                <span>Processed</span>
                <span>{analysis.processingResults.tasksCreated}📋</span>
              </div>
              <div className="text-xs opacity-75">
                {analysis.processingResults.automatedActions.length} actions
              </div>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            
            {/* Extracted Tasks */}
            {analysis.extractedTasks && analysis.extractedTasks.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">📋 Extracted Tasks ({analysis.extractedTasks.length})</h5>
                <div className="space-y-2">
                  {analysis.extractedTasks.map((task, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-900">{task.title}</h6>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.context && (
                              <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                                {task.context}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                📅 {task.dueDate}
                              </span>
                            )}
                            {task.estimatedTime && (
                              <span className="text-xs text-gray-500">
                                ⏱️ {task.estimatedTime}min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Analysis */}
            {analysis.contentAnalysis && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">📄 Content Analysis</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-1">Summary</h6>
                      <p className="text-sm text-gray-600">{analysis.contentAnalysis.summary}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-1">Stats</h6>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📊 {analysis.contentAnalysis.wordCount} words</div>
                        <div>⏱️ {analysis.contentAnalysis.readingTime} min read</div>
                        <div>🔑 {analysis.contentAnalysis.keyTopics.length} key topics</div>
                      </div>
                    </div>
                  </div>
                  
                  {analysis.contentAnalysis.keyTopics.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Key Topics</h6>
                      <div className="flex flex-wrap gap-1">
                        {analysis.contentAnalysis.keyTopics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.contentAnalysis.actionItems.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Action Items</h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.contentAnalysis.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-600">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CRM Analysis */}
            {analysis.crmAnalysis && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">🏢 CRM Analysis</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.crmAnalysis.contactDetected && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-1">👤 Contact Detection</h6>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>{analysis.crmAnalysis.contactDetected.name}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              analysis.crmAnalysis.contactDetected.matched 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              {analysis.crmAnalysis.contactDetected.matched ? 'Matched' : 'New'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(analysis.crmAnalysis.contactDetected.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    )}

                    {analysis.crmAnalysis.companyDetected && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-1">🏢 Company Detection</h6>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>{analysis.crmAnalysis.companyDetected.name}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              analysis.crmAnalysis.companyDetected.matched 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              {analysis.crmAnalysis.companyDetected.matched ? 'Matched' : 'New'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(analysis.crmAnalysis.companyDetected.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {analysis.crmAnalysis.dealPotential && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-1">💰 Deal Potential</h6>
                      <div className="bg-white border border-gray-200 rounded p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Likelihood</span>
                          <span className="text-sm font-medium">{analysis.crmAnalysis.dealPotential.likelihood}%</span>
                        </div>
                        {analysis.crmAnalysis.dealPotential.estimatedValue && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Est. Value</span>
                            <span className="text-sm font-medium">${analysis.crmAnalysis.dealPotential.estimatedValue.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Stage</span>
                          <span className="text-sm font-medium">{analysis.crmAnalysis.dealPotential.stage}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SMART Analysis */}
            {analysis.smartAnalysis && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">🎯 SMART Analysis</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Overall SMART Score</span>
                    <span className="text-lg font-bold text-blue-600">{analysis.smartAnalysis.overallScore}%</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {Object.entries(analysis.smartAnalysis.breakdown).map(([criterion, data]) => (
                      <div key={criterion} className="text-center">
                        <div className="text-sm font-medium text-gray-700 capitalize mb-1">{criterion}</div>
                        <div className={`text-lg font-bold ${data.score >= 80 ? 'text-green-600' : data.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {data.score}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {analysis.smartAnalysis.recommendations.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.smartAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600">💡</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Results */}
            {analysis.processingResults && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">⚙️ Processing Results</h5>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.processingResults.tasksCreated}</div>
                      <div className="text-xs text-gray-600">Tasks Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.processingResults.contactsCreated}</div>
                      <div className="text-xs text-gray-600">Contacts Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysis.processingResults.companiesCreated}</div>
                      <div className="text-xs text-gray-600">Companies Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{analysis.processingResults.dealsCreated}</div>
                      <div className="text-xs text-gray-600">Deals Created</div>
                    </div>
                  </div>

                  {analysis.processingResults.automatedActions.length > 0 && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Automated Actions</h6>
                      <div className="flex flex-wrap gap-1">
                        {analysis.processingResults.automatedActions.map((action, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded">
                            ✓ {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Meta */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span>Analysis v{analysis.version} • Processing time: {analysis.processingTime}ms</span>
                <span>Updated: {new Date(analysis.analyzedAt).toLocaleString('pl-PL')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}