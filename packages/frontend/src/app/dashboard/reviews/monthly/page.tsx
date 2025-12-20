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
  ArrowRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface MonthlyStats {
  completedProjects: number;
  completedTasks: number;
  completedHabits: number;
  overdueTasks: number;
  newAreasIdentified: number;
  productivityScore: number;
}

interface ReviewSection {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

export default function MonthlyReviewPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [notes, setNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadMonthlyData();
  }, [currentMonth]);

  const loadMonthlyData = async () => {
    // Mock data for demo
    setTimeout(() => {
      setStats({
        completedProjects: 3,
        completedTasks: 127,
        completedHabits: 18,
        overdueTasks: 8,
        newAreasIdentified: 2,
        productivityScore: 78
      });

      setReviewSections([
        { id: 'achievements', title: 'Major Achievements', completed: false },
        { id: 'projects', title: 'Project Review', completed: false },
        { id: 'areas', title: 'Areas of Responsibility', completed: false },
        { id: 'habits', title: 'Habit Tracking', completed: false },
        { id: 'challenges', title: 'Challenges & Blockers', completed: false },
        { id: 'lessons', title: 'Lessons Learned', completed: false },
        { id: 'planning', title: 'Next Month Planning', completed: false },
      ]);

      setIsLoading(false);
    }, 500);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
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

  const achievementTemplates = [
    "Completed project: Website redesign ahead of schedule",
    "Established new morning routine with 90% consistency", 
    "Improved client satisfaction scores by 15%",
    "Launched new product feature used by 500+ users",
    "Reduced task backlog by 40%"
  ];

  const challengeTemplates = [
    "Time management during busy periods",
    "Communication gaps with remote team members",
    "Difficulty maintaining work-life balance",
    "Technical challenges with new tools/systems",
    "Unclear priorities leading to context switching"
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Monthly Review</h1>
          <p className="text-gray-600">Comprehensive monthly progress review for {formatMonth(currentMonth)}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(parseInt(e.target.value));
              setCurrentMonth(newDate);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i} value={i}>
                {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              toast.success('Monthly review saved!');
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
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Habits</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedHabits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overdueTasks}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.newAreasIdentified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.productivityScore}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {selectedSection === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Overview</h3>
            <p className="text-gray-600">
              Complete each section of your monthly review to reflect on progress and plan for the upcoming month.
              This comprehensive review follows GTD methodology for optimal productivity insights.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">This Month's Highlights</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Completed {stats?.completedProjects} major projects</li>
                  <li>• Finished {stats?.completedTasks} tasks across all areas</li>
                  <li>• Maintained {stats?.completedHabits} habit streaks</li>
                  <li>• Achieved {stats?.productivityScore}% productivity score</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Areas for Attention</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• {stats?.overdueTasks} overdue tasks need addressing</li>
                  <li>• Review and update project priorities</li>
                  <li>• Identify new areas of responsibility</li>
                  <li>• Plan habit improvements for next month</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'achievements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Major Achievements</h3>
              <button
                onClick={() => toggleSection('achievements')}
                className={`btn ${reviewSections.find(s => s.id === 'achievements')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'achievements')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What were your biggest wins this month?
                </label>
                <textarea
                  value={notes.achievements || ''}
                  onChange={(e) => setNotes(prev => ({...prev, achievements: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="List your major accomplishments, completed projects, and significant milestones..."
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Achievement Examples:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {achievementTemplates.map((template, index) => (
                    <li key={index}>• {template}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Challenges & Blockers</h3>
              <button
                onClick={() => toggleSection('challenges')}
                className={`btn ${reviewSections.find(s => s.id === 'challenges')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'challenges')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What obstacles did you encounter?
                </label>
                <textarea
                  value={notes.challenges || ''}
                  onChange={(e) => setNotes(prev => ({...prev, challenges: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Describe challenges, blockers, and areas where you struggled..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How can you address these challenges?
                </label>
                <textarea
                  value={notes.solutions || ''}
                  onChange={(e) => setNotes(prev => ({...prev, solutions: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Outline potential solutions and strategies for next month..."
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Common Challenges:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {challengeTemplates.map((template, index) => (
                    <li key={index}>• {template}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'planning' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Next Month Planning</h3>
              <button
                onClick={() => toggleSection('planning')}
                className={`btn ${reviewSections.find(s => s.id === 'planning')?.completed ? 'btn-outline' : 'btn-primary'}`}
              >
                {reviewSections.find(s => s.id === 'planning')?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top 3 Priorities for Next Month
                  </label>
                  <textarea
                    value={notes.priorities || ''}
                    onChange={(e) => setNotes(prev => ({...prev, priorities: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="1. Priority one...&#10;2. Priority two...&#10;3. Priority three..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Projects to Start
                  </label>
                  <textarea
                    value={notes.newProjects || ''}
                    onChange={(e) => setNotes(prev => ({...prev, newProjects: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="List new projects you want to initiate..."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Adjustments
                  </label>
                  <textarea
                    value={notes.habitChanges || ''}
                    onChange={(e) => setNotes(prev => ({...prev, habitChanges: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Habits to improve, modify, or add..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Goals
                  </label>
                  <textarea
                    value={notes.learning || ''}
                    onChange={(e) => setNotes(prev => ({...prev, learning: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="Skills to develop, courses to take, books to read..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other sections would be similar with specific content for projects, areas, habits, lessons */}
        {!['overview', 'achievements', 'challenges', 'planning'].includes(selectedSection) && (
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
                placeholder={`Add your thoughts and observations about ${reviewSections.find(s => s.id === selectedSection)?.title.toLowerCase()}...`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}