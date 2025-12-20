'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { reports } from '@/lib/api/ragClient';

// =============================================================================
// REPORTS DEMO - Agent Reports
// =============================================================================

type ReportType = 'weekly' | 'pipeline' | 'productivity' | 'time-management';

interface WeeklyReport {
  success: boolean;
  report_type: string;
  period: string;
  summary: string;
  key_metrics: Record<string, any>;
  top_achievements: string[];
  areas_for_improvement: string[];
  next_week_focus: string[];
}

interface PipelineReport {
  success: boolean;
  report_type: string;
  total_deals: number;
  total_value: number;
  deals_by_stage: Record<string, number>;
  conversion_rates: Record<string, number>;
  at_risk_deals: any[];
  hot_opportunities: any[];
  recommendations: string[];
  forecast?: any;
}

interface ProductivityReport {
  success: boolean;
  report_type: string;
  period_days: number;
  tasks_completed: number;
  completion_rate: number;
  productivity_score: number;
  focus_time_hours: number;
  top_productive_days: string[];
  insights: string[];
}

interface TimeManagementReport {
  success: boolean;
  report_type: string;
  period_days: number;
  total_hours_tracked: number;
  hours_by_category: Record<string, number>;
  energy_alignment_score: number;
  context_switches: number;
  optimization_opportunities: string[];
}

export default function ReportsDemo() {
  const [activeTab, setActiveTab] = useState<ReportType>('weekly');
  const [loading, setLoading] = useState(false);

  // Weekly Report State
  const [weekOffset, setWeekOffset] = useState(0);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);

  // Pipeline Report State
  const [includeForecast, setIncludeForecast] = useState(true);
  const [pipelineReport, setPipelineReport] = useState<PipelineReport | null>(null);

  // Productivity Report State
  const [productivityDays, setProductivityDays] = useState(7);
  const [productivityReport, setProductivityReport] = useState<ProductivityReport | null>(null);

  // Time Management Report State
  const [timeDays, setTimeDays] = useState(7);
  const [timeReport, setTimeReport] = useState<TimeManagementReport | null>(null);

  const handleGenerateWeekly = async () => {
    setLoading(true);
    try {
      const result = await reports.generateWeekly('user123', 'org456', weekOffset);
      setWeeklyReport(result);
      toast.success('Raport tygodniowy wygenerowany!');
    } catch (error: any) {
      console.error('Error generating weekly report:', error);
      toast.error(error.response?.data?.detail || 'Błąd generowania raportu');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePipeline = async () => {
    setLoading(true);
    try {
      const result = await reports.generatePipeline('user123', 'org456', includeForecast);
      setPipelineReport(result);
      toast.success('Raport pipeline wygenerowany!');
    } catch (error: any) {
      console.error('Error generating pipeline report:', error);
      toast.error(error.response?.data?.detail || 'Błąd generowania raportu');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProductivity = async () => {
    setLoading(true);
    try {
      const result = await reports.generateProductivity('user123', 'org456', productivityDays);
      setProductivityReport(result);
      toast.success('Raport produktywności wygenerowany!');
    } catch (error: any) {
      console.error('Error generating productivity report:', error);
      toast.error(error.response?.data?.detail || 'Błąd generowania raportu');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimeManagement = async () => {
    setLoading(true);
    try {
      const result = await reports.generateTimeManagement('user123', 'org456', timeDays);
      setTimeReport(result);
      toast.success('Raport zarządzania czasem wygenerowany!');
    } catch (error: any) {
      console.error('Error generating time management report:', error);
      toast.error(error.response?.data?.detail || 'Błąd generowania raportu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>📈</span>
          <span>Agent Reports</span>
        </h2>
        <p className="text-gray-700">
          Kompleksowe raporty wydajności, pipeline, produktywności i zarządzania czasem
        </p>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: 'weekly', label: 'Weekly Report', icon: '📊' },
            { value: 'pipeline', label: 'Pipeline Report', icon: '💰' },
            { value: 'productivity', label: 'Productivity', icon: '⚡' },
            { value: 'time-management', label: 'Time Management', icon: '⏰' }
          ].map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as ReportType)}
              variant={activeTab === tab.value ? 'default' : 'outline'}
              className={`${activeTab === tab.value ? 'bg-orange-600' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Weekly Report Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">📊 Weekly Performance Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tydzień (0 = bieżący, -1 = poprzedni, itd.)
                </label>
                <select
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="0">Bieżący tydzień</option>
                  <option value="-1">Tydzień -1</option>
                  <option value="-2">Tydzień -2</option>
                  <option value="-3">Tydzień -3</option>
                  <option value="-4">Tydzień -4</option>
                </select>
              </div>
              <Button
                onClick={handleGenerateWeekly}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '📊 Generate Weekly Report'}
              </Button>
            </div>
          </Card>

          {weeklyReport && (
            <Card className="p-6 border-2 border-orange-200 bg-orange-50">
              <h4 className="font-bold text-xl mb-4">📊 Raport tygodniowy - {weeklyReport.period}</h4>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">📝 Podsumowanie:</h5>
                <p className="text-gray-700">{weeklyReport.summary}</p>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-3">📊 Kluczowe metryki:</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(weeklyReport.key_metrics).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600">{key}</p>
                      <p className="text-lg font-bold text-orange-600">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mb-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🏆</span>
                  <span>Top Achievements:</span>
                </h5>
                <ul className="space-y-2">
                  {weeklyReport.top_achievements.map((achievement, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>✅</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mb-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Areas for Improvement:</span>
                </h5>
                <ul className="space-y-2">
                  {weeklyReport.areas_for_improvement.map((area, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>🔸</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Next Week Focus:</span>
                </h5>
                <ul className="space-y-2">
                  {weeklyReport.next_week_focus.map((focus, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Pipeline Report Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">💰 Pipeline Report</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeForecast}
                  onChange={(e) => setIncludeForecast(e.target.checked)}
                  className="w-5 h-5"
                />
                <label className="text-sm font-medium">Include forecast</label>
              </div>
              <Button
                onClick={handleGeneratePipeline}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '💰 Generate Pipeline Report'}
              </Button>
            </div>
          </Card>

          {pipelineReport && (
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <h4 className="font-bold text-xl mb-4">💰 Pipeline Report</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Deals</p>
                  <p className="text-4xl font-bold text-green-600">{pipelineReport.total_deals}</p>
                </div>
                <div className="bg-white p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="text-4xl font-bold text-green-600">
                    ${pipelineReport.total_value.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-3">📊 Deals by Stage:</h5>
                <div className="space-y-2">
                  {Object.entries(pipelineReport.deals_by_stage).map(([stage, count]) => (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="w-32 text-sm font-medium">{stage}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(Number(count) / pipelineReport.total_deals) * 100}%` }}
                        >
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-3">📈 Conversion Rates:</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(pipelineReport.conversion_rates).map(([stage, rate]) => (
                    <div key={stage} className="p-3 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600">{stage}</p>
                      <p className="text-lg font-bold text-green-600">{(Number(rate) * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {pipelineReport.at_risk_deals.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 mb-4">
                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>At-Risk Deals:</span>
                  </h5>
                  <div className="space-y-2">
                    {pipelineReport.at_risk_deals.map((deal: any, idx) => (
                      <div key={idx} className="bg-white p-3 rounded">
                        <p className="font-medium">{deal.name || `Deal ${idx + 1}`}</p>
                        <p className="text-sm text-gray-600">{deal.reason || 'At risk'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pipelineReport.hot_opportunities.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300 mb-4">
                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                    <span>🔥</span>
                    <span>Hot Opportunities:</span>
                  </h5>
                  <div className="space-y-2">
                    {pipelineReport.hot_opportunities.map((opp: any, idx) => (
                      <div key={idx} className="bg-white p-3 rounded">
                        <p className="font-medium">{opp.name || `Opportunity ${idx + 1}`}</p>
                        <p className="text-sm text-gray-600">{opp.reason || 'High potential'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>✅</span>
                  <span>Recommendations:</span>
                </h5>
                <ul className="space-y-2">
                  {pipelineReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Productivity Report Tab */}
      {activeTab === 'productivity' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">⚡ Productivity Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Liczba dni (1-30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={productivityDays}
                  onChange={(e) => setProductivityDays(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <Button
                onClick={handleGenerateProductivity}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '⚡ Generate Productivity Report'}
              </Button>
            </div>
          </Card>

          {productivityReport && (
            <Card className="p-6 border-2 border-purple-200 bg-purple-50">
              <h4 className="font-bold text-xl mb-4">⚡ Productivity Report ({productivityReport.period_days} dni)</h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Tasks Completed</p>
                  <p className="text-3xl font-bold text-purple-600">{productivityReport.tasks_completed}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(productivityReport.completion_rate * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Productivity Score</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(productivityReport.productivity_score * 100).toFixed(0)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Focus Time</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {productivityReport.focus_time_hours}h
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Completion Rate Progress:</h5>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-purple-600 h-6 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${productivityReport.completion_rate * 100}%` }}
                  >
                    <span className="text-white text-sm font-bold">
                      {(productivityReport.completion_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mb-4">
                <h5 className="font-semibold mb-3">🏆 Top Productive Days:</h5>
                <div className="flex flex-wrap gap-2">
                  {productivityReport.top_productive_days.map((day, idx) => (
                    <span key={idx} className="px-4 py-2 bg-green-600 text-white rounded-full font-semibold">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>Insights:</span>
                </h5>
                <ul className="space-y-2">
                  {productivityReport.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Time Management Report Tab */}
      {activeTab === 'time-management' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">⏰ Time Management Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Liczba dni (1-30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={timeDays}
                  onChange={(e) => setTimeDays(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <Button
                onClick={handleGenerateTimeManagement}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : '⏰ Generate Time Management Report'}
              </Button>
            </div>
          </Card>

          {timeReport && (
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <h4 className="font-bold text-xl mb-4">⏰ Time Management Report ({timeReport.period_days} dni)</h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-600">{timeReport.total_hours_tracked}h</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Energy Alignment</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(timeReport.energy_alignment_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Context Switches</p>
                  <p className="text-3xl font-bold text-blue-600">{timeReport.context_switches}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-xs text-gray-600 mb-1">Avg per Day</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(timeReport.total_hours_tracked / timeReport.period_days).toFixed(1)}h
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-3">⏱️ Hours by Category:</h5>
                <div className="space-y-2">
                  {Object.entries(timeReport.hours_by_category).map(([category, hours]) => {
                    const percentage = (Number(hours) / timeReport.total_hours_tracked) * 100;
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <span className="w-32 text-sm font-medium">{category}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-bold">{hours}h</span>
                          </div>
                        </div>
                        <span className="w-16 text-sm text-gray-600 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-2">Energy Alignment Score:</h5>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${timeReport.energy_alignment_score * 100}%` }}
                  >
                    <span className="text-white text-sm font-bold">
                      {(timeReport.energy_alignment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>Optimization Opportunities:</span>
                </h5>
                <ul className="space-y-2">
                  {timeReport.optimization_opportunities.map((opp, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span>•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
