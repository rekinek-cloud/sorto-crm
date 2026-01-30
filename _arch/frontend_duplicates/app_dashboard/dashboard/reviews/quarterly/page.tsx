'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ChartBarIcon,
  TrophyIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface QuarterlyStats {
  completedProjects: number;
  activeProjects: number;
  completedGoals: number;
  newAreasEstablished: number;
  overallGrowth: number;
  strategicAlignment: number;
}

interface ReviewSection {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

interface QuarterlyGoal {
  id: string;
  title: string;
  progress: number;
  status: 'completed' | 'on-track' | 'behind' | 'at-risk';
}

export default function QuarterlyReviewPage() {
  const [currentQuarter, setCurrentQuarter] = useState(() => {
    const now = new Date();
    return Math.floor(now.getMonth() / 3) + 1;
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<QuarterlyStats | null>(null);
  const [goals, setGoals] = useState<QuarterlyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [notes, setNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadQuarterlyData();
  }, [currentQuarter, currentYear]);

  const loadQuarterlyData = async () => {
    setTimeout(() => {
      setStats({
        completedProjects: 8,
        activeProjects: 5,
        completedGoals: 12,
        newAreasEstablished: 3,
        overallGrowth: 23,
        strategicAlignment: 85
      });

      setGoals([
        { id: '1', title: 'Increase team productivity by 25%', progress: 90, status: 'on-track' },
        { id: '2', title: 'Launch new product line', progress: 100, status: 'completed' },
        { id: '3', title: 'Expand to 3 new markets', progress: 65, status: 'behind' },
        { id: '4', title: 'Reduce operational costs by 15%', progress: 45, status: 'at-risk' },
        { id: '5', title: 'Improve customer satisfaction to 90%', progress: 95, status: 'completed' },
      ]);

      setReviewSections([
        { id: 'vision', title: 'Vision & Purpose Review', completed: false },
        { id: 'goals', title: 'Quarterly Goals Assessment', completed: false },
        { id: 'projects', title: 'Major Projects Review', completed: false },
        { id: 'areas', title: 'Areas of Responsibility', completed: false },
        { id: 'systems', title: 'Systems & Processes', completed: false },
        { id: 'learning', title: 'Learning & Development', completed: false },
        { id: 'strategic', title: 'Strategic Planning', completed: false },
        { id: 'next-quarter', title: 'Next Quarter Planning', completed: false },
      ]);

      setIsLoading(false);
    }, 500);
  };

  const getQuarterName = (quarter: number, year: number) => {
    return `Q${quarter} ${year}`;
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'on-track': return 'text-blue-600 bg-blue-100';
      case 'behind': return 'text-yellow-600 bg-yellow-100';
      case 'at-risk': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleSection = (sectionId: string) => {
    setReviewSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, completed: !section.completed }
        : section
    ));
  };

  const completedSections = reviewSections.filter(s => s.completed).length;
  const progressPercentage = (completedSections / reviewSections.length) * 100;

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
          <h1 className="text-2xl font-bold text-gray-900">Quarterly Review</h1>
          <p className="text-gray-600">Strategic review and planning for {getQuarterName(currentQuarter, currentYear)}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={currentQuarter}
            onChange={(e) => setCurrentQuarter(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>
          
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          
          <button
            onClick={() => {
              toast.success('Quarterly review saved!');
            }}
            className="btn btn-primary"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Save Review
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Progress</h3>
          <span className="text-sm text-gray-500">
            {completedSections} of {reviewSections.length} sections completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reviewSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedSection === section.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : section.completed
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {section.completed ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                )}
                <span className="text-sm font-medium">{section.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Goals Met</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedGoals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <LightBulbIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Areas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newAreasEstablished}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overallGrowth}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alignment</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.strategicAlignment}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quarterly Goals Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Goals Progress</h3>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{goal.title}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGoalStatusColor(goal.status)}`}>
                  {goal.status.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goal.status === 'completed' ? 'bg-green-500' :
                      goal.status === 'on-track' ? 'bg-blue-500' :
                      goal.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{goal.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {selectedSection === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Strategic Review Overview</h3>
            <p className="text-gray-600">
              This quarterly review focuses on strategic alignment, goal achievement, and long-term vision.
              Use this time to step back from daily operations and assess the bigger picture.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Quarter Highlights</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Completed {stats?.completedProjects} major projects</li>
                  <li>• Achieved {stats?.completedGoals} strategic goals</li>
                  <li>• {stats?.overallGrowth}% overall growth this quarter</li>
                  <li>• {stats?.strategicAlignment}% strategic alignment score</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Strategic Focus Areas</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Review vision and purpose alignment</li>
                  <li>• Assess goal achievement and learnings</li>
                  <li>• Evaluate systems and processes</li>
                  <li>• Plan strategic initiatives for next quarter</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'vision' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Vision & Purpose Review</h3>
              <button
                onClick={() => toggleSection('vision')}
                className={`btn ${reviewSections.find(s => s.id === 'vision')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'vision')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How well did your work align with your overall vision this quarter?
                </label>
                <textarea
                  value={notes.vision || ''}
                  onChange={(e) => setNotes(prev => ({...prev, vision: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Reflect on alignment between daily work and long-term vision..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What adjustments need to be made to better align with your purpose?
                </label>
                <textarea
                  value={notes.visionAdjustments || ''}
                  onChange={(e) => setNotes(prev => ({...prev, visionAdjustments: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Identify changes needed to improve alignment..."
                />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quarterly Goals Assessment</h3>
              <button
                onClick={() => toggleSection('goals')}
                className={`btn ${reviewSections.find(s => s.id === 'goals')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'goals')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which goals exceeded expectations and why?
                </label>
                <textarea
                  value={notes.exceededGoals || ''}
                  onChange={(e) => setNotes(prev => ({...prev, exceededGoals: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Analyze successful goals and success factors..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which goals fell short and what were the obstacles?
                </label>
                <textarea
                  value={notes.missedGoals || ''}
                  onChange={(e) => setNotes(prev => ({...prev, missedGoals: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Identify barriers and lessons learned..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key lessons learned about goal setting and achievement
                </label>
                <textarea
                  value={notes.goalLessons || ''}
                  onChange={(e) => setNotes(prev => ({...prev, goalLessons: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="What insights will improve future goal setting?"
                />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'strategic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Strategic Planning</h3>
              <button
                onClick={() => toggleSection('strategic')}
                className={`btn ${reviewSections.find(s => s.id === 'strategic')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'strategic')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What major trends or changes are affecting your strategic direction?
                </label>
                <textarea
                  value={notes.trends || ''}
                  onChange={(e) => setNotes(prev => ({...prev, trends: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Market trends, technology changes, competitive landscape..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What new opportunities have emerged?
                </label>
                <textarea
                  value={notes.opportunities || ''}
                  onChange={(e) => setNotes(prev => ({...prev, opportunities: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="New markets, partnerships, technologies, or capabilities..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What threats or risks need to be addressed?
                </label>
                <textarea
                  value={notes.risks || ''}
                  onChange={(e) => setNotes(prev => ({...prev, risks: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Competitive threats, resource constraints, market risks..."
                />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'next-quarter' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Next Quarter Planning</h3>
              <button
                onClick={() => toggleSection('next-quarter')}
                className={`btn ${reviewSections.find(s => s.id === 'next-quarter')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'next-quarter')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top 3 Strategic Priorities
                  </label>
                  <textarea
                    value={notes.strategicPriorities || ''}
                    onChange={(e) => setNotes(prev => ({...prev, strategicPriorities: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="1. Priority one...&#10;2. Priority two...&#10;3. Priority three..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Projects to Launch
                  </label>
                  <textarea
                    value={notes.newProjects || ''}
                    onChange={(e) => setNotes(prev => ({...prev, newProjects: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Major initiatives to start next quarter..."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capability Development Focus
                  </label>
                  <textarea
                    value={notes.capabilities || ''}
                    onChange={(e) => setNotes(prev => ({...prev, capabilities: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="Skills, systems, and processes to develop..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Requirements
                  </label>
                  <textarea
                    value={notes.resources || ''}
                    onChange={(e) => setNotes(prev => ({...prev, resources: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Budget, people, tools, and other resources needed..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other sections would be similar with specific content */}
        {!['overview', 'vision', 'goals', 'strategic', 'next-quarter'].includes(selectedSection) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewSections.find(s => s.id === selectedSection)?.title}
              </h3>
              <button
                onClick={() => toggleSection(selectedSection)}
                className={`btn ${reviewSections.find(s => s.id === selectedSection)?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === selectedSection)?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes
              </label>
              <textarea
                value={notes[selectedSection] || ''}
                onChange={(e) => setNotes(prev => ({...prev, [selectedSection]: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={6}
                placeholder={`Add your strategic thoughts about ${reviewSections.find(s => s.id === selectedSection)?.title.toLowerCase()}...`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}