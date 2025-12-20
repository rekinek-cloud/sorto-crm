'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// =============================================================================
// TEAM COLLABORATION DEMO - Team load & task distribution
// =============================================================================

interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  capacity_hours_week: number;
}

interface TaskLoad {
  user_id: string;
  total_tasks: number;
  active_tasks: number;
  utilization_percent: number;
  stress_level: string;
}

interface TeamLoad {
  team_id: string;
  team_name: string;
  member_loads: TaskLoad[];
  utilization_avg: number;
  balance_score: number;
  bottlenecks: string[];
}

interface TaskDistributionSuggestion {
  task_title: string;
  suggested_assignee: string;
  reasoning: string;
  confidence: number;
}

interface TeamInsight {
  insight_type: string;
  severity: string;
  title: string;
  description: string;
  recommendations: string[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    user_id: '1',
    name: 'Anna Kowalska',
    email: 'anna@company.com',
    role: 'DEVELOPER',
    skills: ['React', 'Node.js', 'Python'],
    capacity_hours_week: 40
  },
  {
    user_id: '2',
    name: 'Piotr Nowak',
    email: 'piotr@company.com',
    role: 'DEVELOPER',
    skills: ['React', 'TypeScript'],
    capacity_hours_week: 40
  },
  {
    user_id: '3',
    name: 'Maria Kowalczyk',
    email: 'maria@company.com',
    role: 'QA',
    skills: ['Testing', 'Automation'],
    capacity_hours_week: 40
  },
  {
    user_id: '4',
    name: 'Jan Wiśniewski',
    email: 'jan@company.com',
    role: 'DESIGNER',
    skills: ['UI/UX', 'Figma'],
    capacity_hours_week: 40
  }
];

const MOCK_TASKS = [
  { id: '1', assigned_to: '1', status: 'IN_PROGRESS', title: 'Fix login bug' },
  { id: '2', assigned_to: '1', status: 'IN_PROGRESS', title: 'Implement dashboard' },
  { id: '3', assigned_to: '1', status: 'IN_PROGRESS', title: 'Add validation' },
  { id: '4', assigned_to: '1', status: 'IN_PROGRESS', title: 'Code review' },
  { id: '5', assigned_to: '1', status: 'IN_PROGRESS', title: 'Fix API integration' },
  { id: '6', assigned_to: '1', status: 'IN_PROGRESS', title: 'Update docs' },
  { id: '7', assigned_to: '2', status: 'IN_PROGRESS', title: 'Create component' },
  { id: '8', assigned_to: '2', status: 'IN_PROGRESS', title: 'Write tests' },
  { id: '9', assigned_to: '3', status: 'IN_PROGRESS', title: 'Test feature X' },
  { id: '10', assigned_to: '4', status: 'TODO', title: 'Design mockup' },
];

const NEW_TASKS = [
  { id: 'new1', title: 'Implement user authentication', priority: 'HIGH', estimated_hours: 8, required_skills: ['Node.js', 'Security'] },
  { id: 'new2', title: 'Design new landing page', priority: 'MEDIUM', estimated_hours: 6, required_skills: ['UI/UX', 'Figma'] },
  { id: 'new3', title: 'Write API tests', priority: 'MEDIUM', estimated_hours: 4, required_skills: ['Testing', 'Automation'] },
];

export default function TeamCollaborationDemo() {
  const [teamLoad, setTeamLoad] = useState<TeamLoad | null>(null);
  const [distributions, setDistributions] = useState<TaskDistributionSuggestion[]>([]);
  const [insights, setInsights] = useState<TeamInsight[]>([]);
  const [loadingLoad, setLoadingLoad] = useState(false);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const handleAnalyzeTeamLoad = async () => {
    setLoadingLoad(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/team/analyze-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: 'team_1',
          team_name: 'Development Team',
          members: TEAM_MEMBERS,
          tasks_data: MOCK_TASKS
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setTeamLoad(data);
      toast.success('Analiza zespołu ukończona!');
    } catch (error: any) {
      console.error('Team load analysis error:', error);
      toast.error(error.message || 'Błąd analizy zespołu');
    } finally {
      setLoadingLoad(false);
    }
  };

  const handleSuggestDistribution = async () => {
    if (!teamLoad) {
      toast.error('Najpierw wykonaj analizę zespołu!');
      return;
    }

    setLoadingDistribution(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/team/suggest-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_load: teamLoad,
          new_tasks: NEW_TASKS
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setDistributions(data);
      toast.success(`Wygenerowano ${data.length} sugestii dystrybucji!`);
    } catch (error: any) {
      console.error('Task distribution error:', error);
      toast.error(error.message || 'Błąd sugestii dystrybucji');
    } finally {
      setLoadingDistribution(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!teamLoad) {
      toast.error('Najpierw wykonaj analizę zespołu!');
      return;
    }

    setLoadingInsights(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/team/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_load: teamLoad
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setInsights(data);
      toast.success(`Wygenerowano ${data.length} insights!`);
    } catch (error: any) {
      console.error('Team insights error:', error);
      toast.error(error.message || 'Błąd generowania insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>👥</span>
          <span>Team Collaboration</span>
        </h2>
        <p className="text-gray-700">
          AI analizuje obciążenie zespołu, sugeruje dystrybucję zadań i wykrywa bottlenecki
        </p>
      </Card>

      {/* Team Analysis Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>Analiza obciążenia zespołu</span>
        </h3>

        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">👥 Zespół ({TEAM_MEMBERS.length} członków):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.user_id} className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-gray-600">{member.role}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {member.capacity_hours_week}h/tyg
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {member.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleAnalyzeTeamLoad}
          disabled={loadingLoad}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {loadingLoad ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Analizuję...</span>
            </>
          ) : (
            '📊 Analizuj obciążenie zespołu'
          )}
        </Button>

        {/* Team Load Result */}
        {teamLoad && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-indigo-200">
                <p className="text-xs text-gray-600 mb-1">Średnie wykorzystanie</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {teamLoad.utilization_avg.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <p className="text-xs text-gray-600 mb-1">Balance Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {(teamLoad.balance_score * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-red-200">
                <p className="text-xs text-gray-600 mb-1">Bottlenecks</p>
                <p className="text-2xl font-bold text-red-600">
                  {teamLoad.bottlenecks.length}
                </p>
              </div>
            </div>

            {/* Member Loads */}
            <div className="bg-white p-4 rounded-lg border-2 border-indigo-200">
              <h4 className="font-semibold mb-3">📋 Obciążenie członków:</h4>
              <div className="space-y-3">
                {teamLoad.member_loads.map((load) => {
                  const member = TEAM_MEMBERS.find(m => m.user_id === load.user_id);
                  return (
                    <div key={load.user_id} className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{member?.name}</span>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          load.stress_level === 'CRITICAL' ? 'bg-red-500 text-white' :
                          load.stress_level === 'HIGH' ? 'bg-orange-500 text-white' :
                          load.stress_level === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {load.stress_level}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <span>✅ {load.active_tasks} aktywnych</span>
                        <span>📊 {load.utilization_percent.toFixed(0)}% wykorzystania</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            load.utilization_percent > 100 ? 'bg-red-500' :
                            load.utilization_percent > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(load.utilization_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSuggestDistribution}
                disabled={loadingDistribution}
                className="bg-green-600 hover:bg-green-700"
              >
                {loadingDistribution ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generuję...</span>
                  </>
                ) : (
                  '🎯 Sugeruj dystrybucję zadań'
                )}
              </Button>
              <Button
                onClick={handleGenerateInsights}
                disabled={loadingInsights}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loadingInsights ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generuję...</span>
                  </>
                ) : (
                  '💡 Wygeneruj insights'
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Task Distribution Suggestions */}
      {distributions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>Sugestie dystrybucji zadań ({distributions.length})</span>
          </h3>

          <div className="space-y-3">
            {distributions.map((dist, idx) => {
              const member = TEAM_MEMBERS.find(m => m.user_id === dist.suggested_assignee || m.name === dist.suggested_assignee);
              return (
                <div key={idx} className="bg-white p-4 rounded-lg border-2 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{dist.task_title}</h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {(dist.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">Przypisz do:</span>
                    <span className="font-semibold text-green-700">{member?.name || dist.suggested_assignee}</span>
                    <span className="text-xs text-gray-500">({member?.role})</span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    💡 {dist.reasoning}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Team Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>Team Insights ({insights.length})</span>
          </h3>

          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-lg border-2 ${
                  insight.severity === 'CRITICAL' ? 'bg-red-50 border-red-300' :
                  insight.severity === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                  insight.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-blue-50 border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{insight.title}</h4>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      insight.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                      insight.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                      insight.severity === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {insight.severity}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-white text-gray-700">
                      {insight.insight_type}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{insight.description}</p>
                {insight.recommendations.length > 0 && (
                  <div className="bg-white p-3 rounded">
                    <p className="text-xs font-semibold text-gray-700 mb-1">📋 Rekomendacje:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {insight.recommendations.map((rec, recIdx) => (
                        <li key={recIdx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
