'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  SprintBoard,
  ScrumColumn,
  ScrumTask,
  Priority
} from '@/types/views';

interface ScrumBoardProps {
  sprintBoard: SprintBoard;
  onTaskMove: (taskId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onTaskClick?: (task: ScrumTask) => void;
  onAddTask?: (columnId: string) => void;
  className?: string;
}

const priorityColors: Record<Priority, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const columnConfig = {
  product_backlog: { title: 'Product Backlog', icon: '📋', color: 'bg-gray-50' },
  sprint_backlog: { title: 'Sprint Backlog', icon: '📝', color: 'bg-blue-50' },
  in_progress: { title: 'In Progress', icon: '🔄', color: 'bg-yellow-50' },
  review: { title: 'Review', icon: '👀', color: 'bg-purple-50' },
  done: { title: 'Done', icon: '✅', color: 'bg-green-50' }
};

export default function ScrumBoard({ 
  sprintBoard, 
  onTaskMove, 
  onTaskClick,
  onAddTask,
  className = ''
}: ScrumBoardProps) {
  const [columns, setColumns] = useState<ScrumColumn[]>(sprintBoard.columns);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Update local state
    const newColumns = [...columns];
    const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId);
    const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId);

    const draggedTask = sourceColumn.tasks[source.index];
    
    // Remove from source
    newColumns[sourceColIndex].tasks.splice(source.index, 1);
    
    // Add to destination
    newColumns[destColIndex].tasks.splice(destination.index, 0, draggedTask);

    setColumns(newColumns);

    // Call parent handler
    onTaskMove(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  const calculateStoryPoints = (column: ScrumColumn): number => {
    return column.tasks.reduce((sum, task) => sum + task.storyPoints, 0);
  };

  const getTaskStatusColor = (task: ScrumTask): string => {
    if (task.blockers.length > 0) return 'border-l-4 border-red-500';
    if (task.actualHours && task.actualHours > task.estimatedHours) return 'border-l-4 border-orange-500';
    return 'border-l-4 border-blue-500';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Sprint Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sprint {sprintBoard.sprintNumber}
            </h1>
            <p className="text-gray-600 mt-1">{sprintBoard.goal}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sprintBoard.velocity}</div>
              <div className="text-sm text-gray-500">Velocity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((Date.now() - sprintBoard.startDate.getTime()) / (sprintBoard.endDate.getTime() - sprintBoard.startDate.getTime()) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>📅 {sprintBoard.startDate.toLocaleDateString()} - {sprintBoard.endDate.toLocaleDateString()}</span>
          <span>📊 {columns.reduce((sum, col) => sum + calculateStoryPoints(col), 0)} Story Points</span>
          <span>👥 {new Set(columns.flatMap(col => col.tasks.map(task => task.assignee.id))).size} Team Members</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full min-w-max">
            {columns.map((column) => {
              const config = columnConfig[column.name];
              const storyPoints = calculateStoryPoints(column);
              const isOverWipLimit = column.wipLimit && column.tasks.length > column.wipLimit;

              return (
                <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50 border-r border-gray-200">
                  {/* Column Header */}
                  <div className={`p-4 border-b border-gray-200 ${config.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{config.icon}</span>
                        <h3 className="font-semibold text-gray-900">{config.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {column.tasks.length}
                        </Badge>
                      </div>
                      {onAddTask && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onAddTask(column.id)}
                          className="h-6 w-6 p-0"
                        >
                          +
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{storyPoints} SP</span>
                      {column.wipLimit && (
                        <span className={isOverWipLimit ? 'text-red-600 font-semibold' : ''}>
                          WIP: {column.tasks.length}/{column.wipLimit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 h-full overflow-y-auto ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-3 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                              >
                                <Card 
                                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${getTaskStatusColor(task)}`}
                                  onClick={() => onTaskClick && onTaskClick(task)}
                                >
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                      {task.title}
                                    </h4>
                                    <div className="flex items-center space-x-1 ml-2">
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${priorityColors[task.priority]}`}
                                      >
                                        {task.priority}
                                      </Badge>
                                      <span className="text-xs font-semibold text-blue-600">
                                        {task.storyPoints}SP
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Labels */}
                                  {task.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {task.labels.slice(0, 3).map((label, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {label}
                                        </Badge>
                                      ))}
                                      {task.labels.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{task.labels.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* Blockers */}
                                  {task.blockers.length > 0 && (
                                    <div className="mb-2">
                                      <Badge variant="destructive" className="text-xs">
                                        🚫 {task.blockers.length} blocker{task.blockers.length > 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={task.assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.name)}&size=16`}
                                        alt={task.assignee.name}
                                        className="w-4 h-4 rounded-full"
                                      />
                                      <span>{task.assignee.name.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span>⏱️</span>
                                      <span>
                                        {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `${task.estimatedHours}h`}
                                      </span>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}