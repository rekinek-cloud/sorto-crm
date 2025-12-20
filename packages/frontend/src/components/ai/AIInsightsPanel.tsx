'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  Gem, 
  Lightbulb,
  Phone,
  Mail,
  Calendar,
  Plus,
  DollarSign,
  Bell,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'prediction' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  data: any;
  actions: AIAction[];
  context: {
    streamId?: string;
    taskId?: string;
    contactId?: string;
    companyId?: string;
    dealId?: string;
  };
  createdAt: string;
  streamName?: string;
}

interface AIAction {
  type: 'call' | 'email' | 'schedule' | 'create_task' | 'update_deal' | 'notify';
  label: string;
  data: any;
  primary?: boolean;
}

interface AIInsightsPanelProps {
  streamId?: string;
  scope?: 'stream' | 'global';
  className?: string;
}

const insightIcons = {
  alert: AlertTriangle,
  opportunity: TrendingUp,
  prediction: Gem,
  recommendation: Lightbulb
};

const priorityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white', 
  medium: 'bg-yellow-500 text-black',
  low: 'bg-gray-500 text-white'
};

const actionIcons = {
  call: Phone,
  email: Mail,
  schedule: Calendar,
  create_task: Plus,
  update_deal: DollarSign,
  notify: Bell
};

export function AIInsightsPanel({ streamId, scope = 'global', className }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [meta, setMeta] = useState<any>({});

  useEffect(() => {
    loadInsights();
  }, [streamId, scope, filter]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const endpoint = scope === 'stream' && streamId 
        ? `/api/v1/ai-insights/streams/${streamId}`
        : '/api/v1/ai-insights/global';
      
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('types', filter);
      }
      params.append('limit', '20');

      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.data.insights || []);
        setMeta(data.data.meta || {});
      }
    } catch (error: any) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: AIAction, insightId: string) => {
    setExecuting(insightId);
    try {
      const response = await fetch('/api/v1/ai-insights/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionType: action.type,
          actionData: action.data,
          insightId
        })
      });

      if (response.ok) {
        // Show success feedback
        const updatedInsights = insights.map(insight => 
          insight.id === insightId 
            ? { ...insight, executed: true }
            : insight
        );
        setInsights(updatedInsights);
        
        // Reload insights to get updated data
        setTimeout(() => loadInsights(), 1000);
      }
    } catch (error: any) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecuting(null);
    }
  };

  const getInsightIcon = (type: string) => {
    const Icon = insightIcons[type as keyof typeof insightIcons] || Lightbulb;
    return <Icon className="h-5 w-5" />;
  };

  const getActionIcon = (type: string) => {
    const Icon = actionIcons[type as keyof typeof actionIcons] || Plus;
    return <Icon className="h-4 w-4" />;
  };

  const formatConfidence = (confidence: number) => {
    return `${confidence}% confidence`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Analyzing data patterns..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            🤖 AI Insights
            {meta.total > 0 && (
              <Badge variant="secondary">{meta.total}</Badge>
            )}
          </span>
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Types</option>
              <option value="alert">Alerts</option>
              <option value="opportunity">Opportunities</option>
              <option value="prediction">Predictions</option>
              <option value="recommendation">Recommendations</option>
            </select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadInsights}
            >
              Refresh
            </Button>
          </div>
        </CardTitle>
        
        {meta.total > 0 && (
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {meta.highPriority || 0} high priority
            </span>
            <span className="flex items-center gap-1">
              <Gem className="h-4 w-4 text-blue-500" />
              {meta.avgConfidence || 0}% avg confidence
            </span>
            {scope === 'global' && meta.streamsAnalyzed && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {meta.streamsAnalyzed} streams analyzed
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gem className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet.</p>
            <p className="text-sm">AI is analyzing your data patterns...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'alert' ? 'bg-red-100 text-red-600' :
                      insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                      insight.type === 'prediction' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {insight.title}
                        </h4>
                        <Badge 
                          className={priorityColors[insight.priority]}
                          variant="secondary"
                        >
                          {insight.priority}
                        </Badge>
                        {insight.streamName && (
                          <Badge variant="outline">
                            {insight.streamName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatConfidence(insight.confidence)}</div>
                    <div>{new Date(insight.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Context Data */}
                {insight.data && Object.keys(insight.data).length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded text-sm">
                    {insight.type === 'alert' && insight.data.overdueTasks && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{insight.data.overdueTasks.length} tasks overdue</span>
                        {insight.data.totalValue && (
                          <span className="text-red-600 font-medium">
                            • ${insight.data.totalValue.toLocaleString()} at risk
                          </span>
                        )}
                      </div>
                    )}
                    
                    {insight.type === 'opportunity' && insight.data.deals && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>{insight.data.deals.length} high-value deals</span>
                        <span className="text-green-600 font-medium">
                          • ${insight.data.deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0).toLocaleString()} potential
                        </span>
                      </div>
                    )}

                    {insight.type === 'prediction' && insight.data.prediction && (
                      <div className="flex items-center gap-2">
                        <Gem className="h-4 w-4 text-blue-500" />
                        <span>
                          {insight.data.prediction.daysOff > 0 ? 'Delayed by' : 'Ahead by'} {Math.abs(Math.round(insight.data.prediction.daysOff))} days
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {insight.actions && insight.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {insight.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.primary ? "default" : "outline"}
                        size="sm"
                        onClick={() => executeAction(action, insight.id)}
                        disabled={executing === insight.id}
                        className="flex items-center gap-1"
                      >
                        {executing === insight.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          getActionIcon(action.type)
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Executed indicator */}
                {(insight as any).executed && (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Action executed successfully
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}