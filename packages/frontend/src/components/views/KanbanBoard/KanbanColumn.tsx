'use client';

import React from 'react';
import { DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';

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

interface KanbanColumnData {
  id: string;
  title: string;
  deals: Deal[];
  totalValue: number;
  color: string;
  order: number;
}

interface KanbanColumnProps {
  column: KanbanColumnData;
  provided: DroppableProvided;
  snapshot: DroppableStateSnapshot;
  boardType: 'sales_pipeline' | 'gtd_context' | 'priority' | 'deal_size';
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  provided,
  snapshot,
  boardType
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-200';
      case 'high': return 'bg-orange-100 border-orange-200';
      case 'medium': return 'bg-green-100 border-green-200';
      case 'low': return 'bg-blue-100 border-blue-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getGTDContextColor = (context: string) => {
    if (context.includes('calls')) return 'bg-red-100 border-red-200';
    if (context.includes('email')) return 'bg-blue-100 border-blue-200';
    if (context.includes('meeting')) return 'bg-green-100 border-green-200';
    if (context.includes('proposal')) return 'bg-orange-100 border-orange-200';
    return 'bg-gray-100 border-gray-200';
  };

  const getColumnBackgroundColor = () => {
    if (snapshot.isDraggingOver) {
      return 'bg-indigo-50 border-indigo-200';
    }
    
    switch (boardType) {
      case 'gtd_context':
        return getGTDContextColor(column.id);
      case 'priority':
        return getPriorityColor(column.id);
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-4 min-h-[500px] transition-colors ${getColumnBackgroundColor()}`}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900" style={{ color: column.color }}>
            {column.title}
          </h3>
          <span className="text-sm text-gray-500">
            {column.deals.length}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <div>Wartość: {column.totalValue.toLocaleString()} PLN</div>
          {boardType === 'sales_pipeline' && (
            <div>Śr. prawdopodobieństwo: {
              column.deals.length > 0 
                ? Math.round(column.deals.reduce((sum, deal) => sum + deal.probability, 0) / column.deals.length)
                : 0
            }%</div>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className="space-y-3"
      >
        {column.deals.map((deal, index) => (
          <KanbanCard
            key={deal.id}
            deal={deal}
            index={index}
            boardType={boardType}
          />
        ))}
        {provided.placeholder}
      </div>

      {/* Empty State */}
      {column.deals.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-sm">Brak dealów</p>
        </div>
      )}
    </div>
  );
};