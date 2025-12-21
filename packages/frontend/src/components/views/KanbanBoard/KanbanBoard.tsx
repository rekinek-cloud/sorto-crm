'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
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

interface KanbanColumnData {
  id: string;
  title: string;
  deals: Deal[];
  totalValue: number;
  color: string;
  order: number;
}

interface KanbanBoardProps {
  boardType?: 'sales_pipeline' | 'gtd_context' | 'priority' | 'deal_size';
  organizationId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  boardType = 'sales_pipeline',
  organizationId 
}) => {
  const [columns, setColumns] = useState<KanbanColumnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Definicje kolumn dla różnych typów board
  const getDefaultColumns = () => {
    switch (boardType) {
      case 'sales_pipeline':
        return [
          { id: 'lead', title: 'LEAD', color: '#64748B', order: 1 },
          { id: 'qualified', title: 'QUALIFIED', color: '#3B82F6', order: 2 },
          { id: 'proposal', title: 'PROPOSAL', color: '#F59E0B', order: 3 },
          { id: 'negotiation', title: 'NEGOTIATION', color: '#EF4444', order: 4 },
          { id: 'closed', title: 'CLOSED', color: '#10B981', order: 5 }
        ];
      case 'gtd_context':
        return [
          { id: 'calls', title: '📞 @CALLS', color: '#EF4444', order: 1 },
          { id: 'emails', title: '📧 @EMAILS', color: '#3B82F6', order: 2 },
          { id: 'meetings', title: '🤝 @MEETINGS', color: '#10B981', order: 3 },
          { id: 'proposals', title: '📄 @PROPOSALS', color: '#F59E0B', order: 4 }
        ];
      case 'priority':
        return [
          { id: 'urgent', title: '🔴 URGENT', color: '#DC2626', order: 1 },
          { id: 'high', title: '🟡 HIGH', color: '#F59E0B', order: 2 },
          { id: 'medium', title: '🟢 MEDIUM', color: '#10B981', order: 3 },
          { id: 'low', title: '🔵 LOW', color: '#3B82F6', order: 4 }
        ];
      case 'deal_size':
        return [
          { id: 'enterprise', title: '💎 ENTERPRISE', color: '#7C3AED', order: 1 },
          { id: 'large', title: '💰 LARGE', color: '#DC2626', order: 2 },
          { id: 'medium', title: '💵 MEDIUM', color: '#F59E0B', order: 3 },
          { id: 'small', title: '🪙 SMALL', color: '#10B981', order: 4 }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    loadKanbanData();
  }, [boardType, organizationId]);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from API
      const response = await fetch(`/crm/api/v1/views/kanban/${boardType}/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load kanban data');
      }

      // Set columns with real data from API
      setColumns(data.data.columns);
      
    } catch (err) {
      console.error('Error loading kanban data:', err);
      setError('Błąd ładowania danych Kanban');
      
      // Fallback to empty columns structure
      const defaultColumns = getDefaultColumns();
      const emptyColumns = defaultColumns.map(col => ({
        ...col,
        deals: [],
        totalValue: 0,
        count: 0
      }));
      setColumns(emptyColumns);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Znajdź deal
    const deal = columns
      .flatMap(col => col.deals)
      .find(d => d.id === draggableId);

    if (!deal) return;

    // Store original state for rollback
    const originalColumns = [...columns];

    // Aktualizuj stan lokalnie (optimistic update)
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        return {
          ...col,
          deals: col.deals.filter(d => d.id !== draggableId),
          totalValue: col.totalValue - deal.value
        };
      }
      if (col.id === destination.droppableId) {
        const newDeals = [...col.deals];
        newDeals.splice(destination.index, 0, deal);
        return {
          ...col,
          deals: newDeals,
          totalValue: col.totalValue + deal.value
        };
      }
      return col;
    });

    setColumns(newColumns);

    // Call API to update deal position
    try {
      const response = await fetch(`/crm/api/v1/views/kanban/${boardType}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dealId: draggableId,
          fromColumn: source.droppableId,
          toColumn: destination.droppableId,
          position: destination.index
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to move deal');
      }

      console.log(`Successfully moved deal ${draggableId} to column ${destination.droppableId}`);
      
    } catch (err) {
      console.error('Error updating deal position:', err);
      // Rollback to original state
      setColumns(originalColumns);
      
      // Show error message
      setError('Błąd podczas przenoszenia deala. Spróbuj ponownie.');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {boardType === 'sales_pipeline' && 'Pipeline Sprzedaży'}
          {boardType === 'gtd_context' && 'Pipeline - Konteksty'}
          {boardType === 'priority' && 'Pipeline Priorytetów'}
          {boardType === 'deal_size' && 'Pipeline Wielkości Dealów'}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Łączna wartość: {columns.reduce((sum, col) => sum + col.totalValue, 0).toLocaleString()} PLN</span>
          <span>Dealów: {columns.reduce((sum, col) => sum + col.deals.length, 0)}</span>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <KanbanColumn
                    column={column}
                    provided={provided}
                    snapshot={snapshot}
                    boardType={boardType}
                  />
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};