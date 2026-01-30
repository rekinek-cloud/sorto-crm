'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  BriefcaseIcon,
  HeartIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface GoalTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  iconColor: string;
  template: {
    title: string;
    description: string;
    timeframe: string;
    measurableMetrics: string[];
    keyMilestones: string[];
    successCriteria: string[];
  };
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  usageCount: number;
  lastUsed?: string;
}

interface CustomTemplate {
  name: string;
  category: string;
  description: string;
  title: string;
  templateDescription: string;
  timeframe: string;
  metrics: string;
  milestones: string;
  criteria: string;
}

export default function SmartTemplatesPage() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplate, setNewTemplate] = useState<CustomTemplate>({
    name: '',
    category: 'Business',
    description: '',
    title: '',
    templateDescription: '',
    timeframe: '',
    metrics: '',
    milestones: '',
    criteria: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setTimeout(() => {
      const mockTemplates: GoalTemplate[] = [
        {
          id: '1',
          name: 'Revenue Growth',
          category: 'Business',
          description: 'Increase business revenue through strategic initiatives',
          icon: '💰',
          iconColor: '#10b981',
          template: {
            title: 'Increase [PRODUCT/SERVICE] revenue by [X]% in [TIMEFRAME]',
            description: 'Achieve [SPECIFIC REVENUE AMOUNT] in [PRODUCT/SERVICE] sales by implementing [STRATEGY] and reaching [TARGET MARKET] through [CHANNELS]',
            timeframe: '[X] months/quarters',
            measurableMetrics: [
              'Monthly recurring revenue (MRR)',
              'Total revenue growth percentage',
              'Customer acquisition cost (CAC)',
              'Average order value (AOV)',
              'Conversion rate improvements'
            ],
            keyMilestones: [
              'Q1: Launch new marketing campaigns',
              'Q2: Achieve 50% of target growth',
              'Q3: Optimize pricing strategy',
              'Q4: Reach full revenue target'
            ],
            successCriteria: [
              'Revenue increased by target percentage',
              'Maintained or improved profit margins',
              'Customer satisfaction scores above 8/10',
              'Sustainable growth trajectory established'
            ]
          },
          estimatedDuration: '6-12 months',
          difficulty: 'Intermediate',
          usageCount: 47,
          lastUsed: new Date(Date.now() - 864000000).toISOString()
        },
        {
          id: '2',
          name: 'Health & Fitness',
          category: 'Personal',
          description: 'Achieve specific health and fitness targets',
          icon: '💪',
          iconColor: '#ef4444',
          template: {
            title: 'Achieve [SPECIFIC FITNESS GOAL] by [DATE]',
            description: 'Reach [SPECIFIC MEASURABLE TARGET] through consistent [EXERCISE TYPE] and [NUTRITION PLAN] while tracking progress with [MEASUREMENT METHOD]',
            timeframe: '[X] weeks/months',
            measurableMetrics: [
              'Weight loss/gain in pounds/kg',
              'Body fat percentage',
              'Workout frequency per week',
              'Performance metrics (reps, time, distance)',
              'Energy levels (1-10 scale)'
            ],
            keyMilestones: [
              'Week 4: Establish consistent routine',
              'Week 8: Achieve 50% of target',
              'Week 12: Reach 75% of goal',
              'Week 16: Achieve full target'
            ],
            successCriteria: [
              'Target weight/measurement achieved',
              'Sustainable habits established',
              'Improved overall health markers',
              'Maintained motivation and consistency'
            ]
          },
          estimatedDuration: '3-6 months',
          difficulty: 'Beginner',
          usageCount: 89,
          lastUsed: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '3',
          name: 'Skill Development',
          category: 'Professional',
          description: 'Master new professional skills or technologies',
          icon: '🎓',
          iconColor: '#3b82f6',
          template: {
            title: 'Master [SKILL/TECHNOLOGY] to [PROFICIENCY LEVEL] by [DATE]',
            description: 'Develop expertise in [SPECIFIC SKILL] through [LEARNING METHOD] and demonstrate proficiency by [CONCRETE OUTCOME/PROJECT]',
            timeframe: '[X] months',
            measurableMetrics: [
              'Certification completion',
              'Project portfolio items',
              'Peer/mentor assessment scores',
              'Practical application success rate',
              'Knowledge test scores'
            ],
            keyMilestones: [
              'Month 1: Complete foundational learning',
              'Month 2: Build first practical project',
              'Month 3: Seek feedback and iterate',
              'Month 4: Achieve certification/assessment'
            ],
            successCriteria: [
              'Certification or formal recognition achieved',
              'Successfully applied skills in real project',
              'Positive feedback from peers/mentors',
              'Confident to teach or mentor others'
            ]
          },
          estimatedDuration: '3-6 months',
          difficulty: 'Intermediate',
          usageCount: 65,
          lastUsed: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: '4',
          name: 'Product Launch',
          category: 'Business',
          description: 'Successfully launch a new product or service',
          icon: '🚀',
          iconColor: '#8b5cf6',
          template: {
            title: 'Launch [PRODUCT NAME] and achieve [SUCCESS METRIC] by [DATE]',
            description: 'Successfully develop, test, and launch [PRODUCT] targeting [AUDIENCE] with goals of [SPECIFIC METRICS] within [TIMEFRAME]',
            timeframe: '[X] months from concept to launch',
            measurableMetrics: [
              'Product development milestones completed',
              'Beta user feedback scores',
              'Launch day signups/sales',
              'Customer satisfaction ratings',
              'Market penetration rate'
            ],
            keyMilestones: [
              'Phase 1: Product development & testing',
              'Phase 2: Beta release & feedback',
              'Phase 3: Marketing campaign launch',
              'Phase 4: Official product launch'
            ],
            successCriteria: [
              'Product meets quality standards',
              'Launch targets achieved',
              'Positive market reception',
              'Sustainable customer acquisition'
            ]
          },
          estimatedDuration: '9-18 months',
          difficulty: 'Advanced',
          usageCount: 23,
          lastUsed: new Date(Date.now() - 1296000000).toISOString()
        },
        {
          id: '5',
          name: 'Team Building',
          category: 'Leadership',
          description: 'Build and develop high-performing teams',
          icon: '👥',
          iconColor: '#f59e0b',
          template: {
            title: 'Build a high-performing [TEAM TYPE] team of [SIZE] by [DATE]',
            description: 'Recruit, develop, and optimize a [TEAM SIZE] team achieving [PERFORMANCE METRICS] while maintaining [CULTURE GOALS]',
            timeframe: '[X] months',
            measurableMetrics: [
              'Team performance scores',
              'Employee satisfaction ratings',
              'Retention rate percentage',
              'Goal achievement rate',
              'Team collaboration index'
            ],
            keyMilestones: [
              'Month 1: Define roles and recruit',
              'Month 2: Onboard and train team',
              'Month 3: Establish processes and culture',
              'Month 6: Achieve target performance'
            ],
            successCriteria: [
              'All positions filled with quality hires',
              'Team achieves performance targets',
              'High employee satisfaction scores',
              'Strong team culture established'
            ]
          },
          estimatedDuration: '6-12 months',
          difficulty: 'Advanced',
          usageCount: 31,
          lastUsed: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: '6',
          name: 'Habit Formation',
          category: 'Personal',
          description: 'Establish positive daily habits',
          icon: '🔄',
          iconColor: '#06b6d4',
          template: {
            title: 'Establish [HABIT] routine with [FREQUENCY] for [DURATION]',
            description: 'Build a sustainable [HABIT] practice performed [FREQUENCY] and tracked through [METHOD] to achieve [BENEFIT/OUTCOME]',
            timeframe: '[X] days/weeks',
            measurableMetrics: [
              'Daily completion rate (%)',
              'Weekly consistency score',
              'Monthly habit strength rating',
              'Outcome measurements',
              'Habit stack integration'
            ],
            keyMilestones: [
              'Week 1: Daily execution focus',
              'Week 3: Habit cue establishment',
              'Week 6: Automatic behavior pattern',
              'Week 12: Sustained habit integration'
            ],
            successCriteria: [
              'Habit performed consistently for target period',
              'Automatic behavior without conscious effort',
              'Positive impact on desired outcome',
              'Integration with existing routines'
            ]
          },
          estimatedDuration: '66-90 days',
          difficulty: 'Beginner',
          usageCount: 156,
          lastUsed: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 500);
  };

  const categories = ['all', 'Business', 'Personal', 'Professional', 'Leadership'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
    
    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
        : t
    ));
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const template: GoalTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category,
      description: newTemplate.description,
      icon: '🎯',
      iconColor: '#6b7280',
      template: {
        title: newTemplate.title,
        description: newTemplate.templateDescription,
        timeframe: newTemplate.timeframe,
        measurableMetrics: newTemplate.metrics.split('\n').filter(m => m.trim()),
        keyMilestones: newTemplate.milestones.split('\n').filter(m => m.trim()),
        successCriteria: newTemplate.criteria.split('\n').filter(c => c.trim())
      },
      estimatedDuration: 'Custom',
      difficulty: 'Intermediate',
      usageCount: 0
    };

    setTemplates(prev => [template, ...prev]);
    setNewTemplate({
      name: '',
      category: 'Business',
      description: '',
      title: '',
      templateDescription: '',
      timeframe: '',
      metrics: '',
      milestones: '',
      criteria: ''
    });
    setShowCreateModal(false);
    toast.success('Custom template created!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
          <h1 className="text-2xl font-bold text-gray-900">SMART Templates</h1>
          <p className="text-gray-600">Ready-to-use templates for common goal types</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleUseTemplate(template)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: template.iconColor }}
                >
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className="text-sm text-gray-500">{template.category}</span>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <span>Duration:</span>
                <span className="font-medium">{template.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Used:</span>
                <span className="font-medium">{template.usageCount} times</span>
              </div>
              {template.lastUsed && (
                <div className="flex items-center justify-between">
                  <span>Last used:</span>
                  <span className="font-medium">{formatDate(template.lastUsed)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseTemplate(template);
                }}
                className="w-full btn btn-primary text-sm"
              >
                Use Template
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Template Detail Modal */}
      <AnimatePresence>
        {showTemplateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: selectedTemplate.iconColor }}
                    >
                      {selectedTemplate.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                      <p className="text-sm text-gray-500">{selectedTemplate.category} Template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Goal Title Template</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg font-mono text-sm">
                    {selectedTemplate.template.title}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description Template</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg font-mono text-sm">
                    {selectedTemplate.template.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Measurable Metrics</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {selectedTemplate.template.measurableMetrics.map((metric, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Milestones</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {selectedTemplate.template.keyMilestones.map((milestone, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Success Criteria</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {selectedTemplate.template.successCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-medium text-gray-900">{selectedTemplate.estimatedDuration}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Difficulty</div>
                    <div className="font-medium text-gray-900">{selectedTemplate.difficulty}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Times Used</div>
                    <div className="font-medium text-gray-900">{selectedTemplate.usageCount}</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success('Template copied! Create your goal based on this template.');
                    setShowTemplateModal(false);
                  }}
                  className="btn btn-primary flex-1"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Use This Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create Custom Template</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Marketing Campaign"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Business">Business</option>
                      <option value="Personal">Personal</option>
                      <option value="Professional">Professional</option>
                      <option value="Leadership">Leadership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Brief description of this template"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Title Template
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Launch [PRODUCT] and achieve [METRIC] by [DATE]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description Template
                  </label>
                  <textarea
                    value={newTemplate.templateDescription}
                    onChange={(e) => setNewTemplate({ ...newTemplate, templateDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Detailed template description with placeholders"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurable Metrics (one per line)
                  </label>
                  <textarea
                    value={newTemplate.metrics}
                    onChange={(e) => setNewTemplate({ ...newTemplate, metrics: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="Revenue growth percentage&#10;Customer acquisition rate&#10;User engagement metrics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Milestones (one per line)
                  </label>
                  <textarea
                    value={newTemplate.milestones}
                    onChange={(e) => setNewTemplate({ ...newTemplate, milestones: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="Month 1: Complete initial planning&#10;Month 2: Launch beta version&#10;Month 3: Full rollout"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Success Criteria (one per line)
                  </label>
                  <textarea
                    value={newTemplate.criteria}
                    onChange={(e) => setNewTemplate({ ...newTemplate, criteria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Target metrics achieved&#10;Quality standards met&#10;Stakeholder satisfaction maintained"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="btn btn-primary flex-1"
                  disabled={!newTemplate.name.trim()}
                >
                  Create Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}