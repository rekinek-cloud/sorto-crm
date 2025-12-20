'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface ReviewItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: boolean;
  actionRequired?: boolean;
  count?: number;
}

interface WeeklyReviewData {
  lastReviewDate?: string;
  totalInboxItems: number;
  unprocessedTasks: number;
  completedThisWeek: number;
  overdueItems: number;
  waitingForItems: number;
  somedayMaybeItems: number;
  reviewProgress: number;
}

export default function WeeklyReviewPage() {
  const [reviewData, setReviewData] = useState<WeeklyReviewData>({
    totalInboxItems: 0,
    unprocessedTasks: 0,
    completedThisWeek: 0,
    overdueItems: 0,
    waitingForItems: 0,
    somedayMaybeItems: 0,
    reviewProgress: 0
  });
  
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const reviewSteps: ReviewItem[] = [
    {
      id: '1',
      category: 'Get Clear',
      title: 'Process Inbox to Zero',
      description: 'Clarify all items in your inbox and convert them to actionable tasks',
      completed: false,
      actionRequired: true
    },
    {
      id: '2', 
      category: 'Get Clear',
      title: 'Review Email Inbox',
      description: 'Process all unread emails and create tasks as needed',
      completed: false,
      actionRequired: true
    },
    {
      id: '3',
      category: 'Get Clear',
      title: 'Empty Physical Inboxes',
      description: 'Collect and process items from physical inboxes, notebooks, sticky notes',
      completed: false
    },
    {
      id: '4',
      category: 'Get Current',
      title: 'Review Next Actions Lists',
      description: 'Go through all contexts (@calls, @computer, @errands) and update',
      completed: false,
      actionRequired: true
    },
    {
      id: '5',
      category: 'Get Current', 
      title: 'Review Waiting For List',
      description: 'Check on delegated items and follow up as needed',
      completed: false,
      actionRequired: true
    },
    {
      id: '6',
      category: 'Get Current',
      title: 'Review Project Lists',
      description: 'Ensure each project has a clear next action',
      completed: false,
      actionRequired: true
    },
    {
      id: '7',
      category: 'Get Current',
      title: 'Review Calendar',
      description: 'Look at past and future calendar entries for action items',
      completed: false
    },
    {
      id: '8',
      category: 'Get Creative',
      title: 'Review Someday/Maybe',
      description: 'Activate projects that are now relevant, archive outdated ones',
      completed: false,
      actionRequired: true
    },
    {
      id: '9',
      category: 'Get Creative',
      title: 'Brainstorm New Projects',
      description: 'Consider new opportunities, goals, and creative ideas',
      completed: false
    },
    {
      id: '10',
      category: 'Get Creative',
      title: 'Plan Next Week',
      description: 'Set priorities and focus areas for the coming week',
      completed: false
    }
  ];

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app would call API
      setReviewData({
        lastReviewDate: '2024-01-08T10:00:00Z',
        totalInboxItems: 12,
        unprocessedTasks: 5,
        completedThisWeek: 23,
        overdueItems: 3,
        waitingForItems: 8,
        somedayMaybeItems: 15,
        reviewProgress: 0
      });
      
      setReviewItems(reviewSteps);
    } catch (error: any) {
      console.error('Error loading review data:', error);
      toast.error('Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const startReview = () => {
    setReviewStarted(true);
    setCurrentStep(0);
    toast.success('Weekly review started! Follow the checklist to complete.');
  };

  const completeStep = (stepId: string) => {
    setReviewItems(prev => 
      prev.map(item => 
        item.id === stepId 
          ? { ...item, completed: true }
          : item
      )
    );
    
    const nextIncompleteStep = reviewItems.findIndex((item, index) => 
      index > currentStep && !item.completed
    );
    
    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep);
    }
    
    const completedCount = reviewItems.filter(item => item.completed).length + 1;
    const progress = Math.round((completedCount / reviewItems.length) * 100);
    
    setReviewData(prev => ({ ...prev, reviewProgress: progress }));
    
    if (completedCount === reviewItems.length) {
      toast.success('🎉 Weekly review completed! Great job staying organized.');
    }
  };

  const resetReview = () => {
    setReviewStarted(false);
    setCurrentStep(0);
    setReviewItems(reviewSteps);
    setReviewData(prev => ({ ...prev, reviewProgress: 0 }));
  };

  const getStepIcon = (category: string) => {
    switch (category) {
      case 'Get Clear': return '🧹';
      case 'Get Current': return '🔄';
      case 'Get Creative': return '💡';
      default: return '✅';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-gray-300';
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
          <h1 className="text-2xl font-bold text-gray-900">Weekly Review</h1>
          <p className="text-gray-600">Get clear, get current, and get creative</p>
        </div>
        {!reviewStarted ? (
          <button onClick={startReview} className="btn btn-primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Start Review
          </button>
        ) : (
          <button onClick={resetReview} className="btn btn-secondary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Review
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {reviewStarted && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Review Progress</h2>
            <span className="text-sm font-medium text-gray-600">
              {reviewData.reviewProgress}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(reviewData.reviewProgress)}`}
              style={{ width: `${reviewData.reviewProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📥</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{reviewData.totalInboxItems}</div>
              <div className="text-sm text-gray-500">Inbox Items</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">⏳</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-orange-600">{reviewData.waitingForItems}</div>
              <div className="text-sm text-gray-500">Waiting For</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">✅</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{reviewData.completedThisWeek}</div>
              <div className="text-sm text-gray-500">Completed This Week</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">🚨</div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{reviewData.overdueItems}</div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Checklist */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {reviewStarted ? 'Weekly Review Checklist' : 'Review Overview'}
          </h2>
          {reviewData.lastReviewDate && (
            <p className="text-sm text-gray-600 mt-1">
              Last review: {new Date(reviewData.lastReviewDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {reviewItems.map((item, index) => (
            <div key={item.id} className={`p-6 ${reviewStarted && currentStep === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    <div className="text-2xl">{getStepIcon(item.category)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {item.category}
                      </span>
                      {item.actionRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Action Required
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                    {item.count && (
                      <p className="text-sm text-blue-600 mt-2">
                        {item.count} items to review
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  {item.completed ? (
                    <div className="flex items-center text-green-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : reviewStarted ? (
                    <button
                      onClick={() => completeStep(item.id)}
                      className="btn btn-sm btn-primary"
                    >
                      Complete
                    </button>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Weekly Review Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Schedule consistently:</strong> Set a recurring time each week (Friday afternoon or Sunday evening works well)
          </div>
          <div>
            <strong>Create the right environment:</strong> Find a quiet space where you won't be interrupted
          </div>
          <div>
            <strong>Don't rush:</strong> A thorough review typically takes 1-2 hours
          </div>
          <div>
            <strong>Stay focused:</strong> Resist the urge to start working on tasks during the review
          </div>
        </div>
      </div>
    </div>
  );
}