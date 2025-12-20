'use client';

import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { UserAvatar } from '../shared/UserAvatar';
import { PriorityIndicator } from '../shared/PriorityIndicator';
import { GTDContextBadge } from '../shared/GTDContextBadge';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  nextAction: {
    gtdContext: string;
    description: string;
  };
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  aiInsights: Array<{
    type: string;
    confidence: number;
    description: string;
  }>;
}

interface KanbanCardProps {
  deal: Deal;
  index: number;
  boardType: 'sales_pipeline' | 'gtd_context' | 'priority' | 'deal_size';
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  deal,
  index,
  boardType
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-600 bg-red-100';
    if (daysUntil <= 1) return 'text-orange-600 bg-orange-100';
    if (daysUntil <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getAIConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const daysUntilDue = getDaysUntilDue(deal.dueDate);
  const dueDateColor = getDueDateColor(daysUntilDue);

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          }`}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Card Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                {deal.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {deal.company}
              </p>
            </div>
            <PriorityIndicator priority={deal.priority} size="sm" />
          </div>

          {/* Value and Probability */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-indigo-600">
              {formatCurrency(deal.value)}
            </span>
            {boardType === 'sales_pipeline' && (
              <span className="text-xs text-gray-500">
                {deal.probability}% szans
              </span>
            )}
          </div>

          {/* GTD Context and Next Action */}
          <div className="mb-3">
            <GTDContextBadge context={deal.nextAction.gtdContext} size="sm" />
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {deal.nextAction.description}
            </p>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs px-2 py-1 rounded-full ${dueDateColor}`}>
              {daysUntilDue === 0 ? 'Dziś' : 
               daysUntilDue === 1 ? 'Jutro' :
               daysUntilDue < 0 ? `Spóźnione ${Math.abs(daysUntilDue)}d` :
               `Za ${daysUntilDue}d`}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(deal.dueDate)}
            </span>
          </div>

          {/* Assignee */}
          <div className="flex items-center justify-between">
            <UserAvatar 
              user={deal.assignee}
              size="sm"
              showName={false}
            />
            
            {/* AI Insights */}
            {deal.aiInsights.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">🤖</span>
                <span className={`text-xs px-1 py-0.5 rounded ${
                  getAIConfidenceColor(deal.aiInsights[0].confidence)
                }`}>
                  {deal.aiInsights[0].confidence}%
                </span>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                {/* AI Insights */}
                {deal.aiInsights.map((insight, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-medium text-gray-700">
                      {insight.type === 'win_probability' ? '🎯 Prawdopodobieństwo' :
                       insight.type === 'sentiment' ? '😊 Sentyment' :
                       insight.type}:
                    </span>
                    <span className="ml-1 text-gray-600">
                      {insight.description}
                    </span>
                    <span className={`ml-2 px-1 py-0.5 rounded ${
                      getAIConfidenceColor(insight.confidence)
                    }`}>
                      {insight.confidence}%
                    </span>
                  </div>
                ))}

                {/* Quick Actions */}
                <div className="flex space-x-2 mt-3">
                  <button 
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement call action
                    }}
                  >
                    📞 Zadzwoń
                  </button>
                  <button 
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement email action
                    }}
                  >
                    📧 Email
                  </button>
                  <button 
                    className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement meeting action
                    }}
                  >
                    🤝 Spotkanie
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};