'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { motion } from 'framer-motion';
import GoalRecommendations from '@/components/dashboard/GoalRecommendations';
import ProductivityAnalytics from '@/components/dashboard/ProductivityAnalytics';
import {
  ChartBarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const analyticsViews = [
  {
    id: 'productivity',
    name: 'Productivity Analytics',
    description: 'AI-powered insights into your work patterns',
    icon: ChartBarIcon,
    color: 'blue'
  },
  {
    id: 'goals',
    name: 'Goal Recommendations',
    description: 'Personalized goal suggestions based on your activity',
    icon: SparklesIcon,
    color: 'purple'
  },
  {
    id: 'projects',
    name: 'Project Success Prediction',
    description: 'ML-powered project success probability analysis',
    icon: ArrowTrendingUpIcon,
    color: 'green'
  },
  {
    id: 'realtime',
    name: 'Real-time KPIs',
    description: 'Live performance metrics and alerts',
    icon: BoltIcon,
    color: 'orange'
  }
];

export default function AnalyticsPage() {
  const { user, isLoading } = useRequireAuth();
  const [activeView, setActiveView] = useState('productivity');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'productivity':
        return <ProductivityAnalytics />;
      case 'goals':
        return <GoalRecommendations />;
      case 'projects':
        return (
          <div className="space-y-6">
            {/* Project Success Prediction */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Project Health */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Portfolio Health Score</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">AI Analyzed</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">87%</div>
                  <p className="text-gray-600 text-sm">Overall success probability</p>
                  <div className="mt-4 bg-gray-200 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resource Availability</span>
                    <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Timeline Pressure</span>
                    <span className="text-sm font-medium text-red-600">High Risk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dependency Chain</span>
                    <span className="text-sm font-medium text-green-600">Low Risk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scope Creep</span>
                    <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Project Predictions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Success Predictions</h3>
              <div className="space-y-4">
                {[
                  { name: 'CRM System Modernization', probability: 92, risk: 'Low', daysLeft: 45, confidence: 'High' },
                  { name: 'Mobile App Development', probability: 78, risk: 'Medium', daysLeft: 67, confidence: 'Medium' },
                  { name: 'Data Migration Project', probability: 65, risk: 'High', daysLeft: 23, confidence: 'Medium' },
                  { name: 'Security Audit Implementation', probability: 89, risk: 'Low', daysLeft: 12, confidence: 'High' },
                ].map((project, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          project.risk === 'Low' ? 'bg-green-100 text-green-700' :
                          project.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {project.risk} Risk
                        </span>
                        <span className="text-sm text-gray-600">{project.daysLeft} days left</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Success Probability</span>
                          <span className="font-medium text-gray-900">{project.probability}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              project.probability >= 80 ? 'bg-green-500' :
                              project.probability >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${project.probability}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">AI Confidence</div>
                        <div className={`text-sm font-medium ${
                          project.confidence === 'High' ? 'text-green-600' :
                          project.confidence === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {project.confidence}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ML Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ML Recommendations</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">• Consider reallocating resources from Security Audit to Data Migration for better outcomes</p>
                    <p className="text-sm text-gray-700">• Mobile App project shows signs of scope creep - recommend immediate stakeholder alignment</p>
                    <p className="text-sm text-gray-700">• CRM project is on track for early completion - consider moving up dependent projects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'realtime':
        return (
          <div className="space-y-6">
            {/* Live KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Tasks */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Active Tasks</h3>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">23</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+2</span>
                  <span className="text-gray-600 ml-1">from yesterday</span>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">87%</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+5%</span>
                  <span className="text-gray-600 ml-1">this week</span>
                </div>
              </div>

              {/* Focus Time */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Focus Time</h3>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">5.2h</div>
                <div className="flex items-center text-sm">
                  <span className="text-red-600">-0.8h</span>
                  <span className="text-gray-600 ml-1">today</span>
                </div>
              </div>

              {/* Project Velocity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Project Velocity</h3>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">12.4</div>
                <div className="flex items-center text-sm">
                  <span className="text-green-600">+1.2</span>
                  <span className="text-gray-600 ml-1">points/week</span>
                </div>
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Live Activity Feed</h3>
                  <span className="text-xs text-gray-500">Last updated: now</span>
                </div>
                <div className="space-y-3">
                  {[
                    { time: '2 min ago', action: 'Task completed', item: 'Review Q4 budget proposal', type: 'success' },
                    { time: '5 min ago', action: 'Project updated', item: 'CRM Modernization', type: 'info' },
                    { time: '8 min ago', action: 'Meeting started', item: 'Weekly team sync', type: 'warning' },
                    { time: '12 min ago', action: 'Task created', item: 'Prepare client presentation', type: 'info' },
                    { time: '15 min ago', action: 'Goal achieved', item: 'Complete 80% of weekly tasks', type: 'success' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'success' ? 'bg-green-400' :
                        activity.type === 'warning' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.action}: <span className="font-medium">{activity.item}</span></p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Smart Alerts</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">3 Active</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-red-900">Project at Risk</p>
                        <p className="text-xs text-red-700">Data Migration project is 3 days behind schedule</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Focus Time Low</p>
                        <p className="text-xs text-yellow-700">Today's focus time is 40% below average</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-orange-900">Overdue Tasks</p>
                        <p className="text-xs text-orange-700">5 tasks are past their due date</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Charts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Productivity Curve</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live updating</span>
                </div>
              </div>
              
              {/* Simple productivity chart representation */}
              <div className="h-64 flex items-end space-x-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  const currentHour = new Date().getHours();
                  const height = Math.random() * 80 + 20; // Mock data
                  const isCurrentHour = hour === currentHour;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-sm ${
                          isCurrentHour ? 'bg-blue-500 animate-pulse' :
                          hour <= currentHour ? 'bg-blue-300' : 'bg-gray-200'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">
                        {hour.toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Peak productivity hours: <span className="font-medium text-gray-900">9 AM - 11 AM</span>
                </p>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <BoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Real-time Analytics Engine</h3>
                    <p className="text-sm text-gray-600">All systems operational • Last update: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">99.9% Uptime</div>
                    <div className="text-xs text-gray-600">Response time: 45ms</div>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <ProductivityAnalytics />;
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                AI Analytics Dashboard 🤖
              </h1>
              <p className="text-gray-600 mt-1">
                Advanced insights powered by artificial intelligence and machine learning
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                AI Online
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsViews.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <motion.button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-sm ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        {view.name}
                      </h3>
                      <p
                        className={`text-xs mt-1 ${
                          isActive ? 'text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        {view.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-lg"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </motion.div>

        {/* Active View Content */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderActiveView()}
        </motion.div>

        {/* AI Capabilities Info */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Powered by Advanced AI
              </h3>
              <p className="text-gray-700 mb-4">
                Our analytics engine uses machine learning algorithms to analyze your productivity patterns,
                predict project outcomes, and recommend personalized goals for maximum effectiveness.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600">Pattern Recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-600">Predictive Analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-600">Personalized Insights</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}