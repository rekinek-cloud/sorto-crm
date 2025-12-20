'use client';

import React from 'react';
import { TaskItem } from './TaskItem';
import { GTDContextBadge } from '../shared/GTDContextBadge';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  gtdContext: string;
  estimatedTime: number;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate?: Date;
  deal?: {
    id: string;
    title: string;
    company: string;
  };
  project?: {
    id: string;
    title: string;
  };
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

interface GTDContextSection {
  context: string;
  icon: string;
  description: string;
  tasks: Task[];
  estimatedTime: number;
  optimalTiming: string;
  color: string;
}

interface GTDContextListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
}

export const GTDContextList: React.FC<GTDContextListProps> = ({
  tasks,
  onTaskComplete
}) => {
  const getContextConfig = (context: string) => {
    const normalized = context.toLowerCase().replace('@', '');
    
    switch (normalized) {
      case 'calls':
      case 'call':
        return {
          icon: '📞',
          description: 'Rozmowy telefoniczne z klientami i partnerami',
          optimalTiming: 'Rano (9:00-11:00)',
          color: 'border-red-200 bg-red-50'
        };
      case 'email':
      case 'emails':
        return {
          icon: '📧',
          description: 'Korespondencja elektroniczna i odpowiedzi',
          optimalTiming: 'Dowolny moment',
          color: 'border-blue-200 bg-blue-50'
        };
      case 'meeting':
      case 'meetings':
        return {
          icon: '🤝',
          description: 'Spotkania face-to-face i prezentacje',
          optimalTiming: 'Popołudnie (14:00-17:00)',
          color: 'border-green-200 bg-green-50'
        };
      case 'computer':
        return {
          icon: '💻',
          description: 'Praca przy komputerze, dokumenty, analizy',
          optimalTiming: 'Blok czasowy 2-3h',
          color: 'border-purple-200 bg-purple-50'
        };
      case 'proposal':
      case 'proposals':
        return {
          icon: '📄',
          description: 'Przygotowanie ofert i dokumentów',
          optimalTiming: 'Koncentracja, bez zakłóceń',
          color: 'border-orange-200 bg-orange-50'
        };
      case 'errands':
        return {
          icon: '🚗',
          description: 'Sprawy poza biurem, wizyty, dostawy',
          optimalTiming: 'W trasie lub po godzinach',
          color: 'border-yellow-200 bg-yellow-50'
        };
      case 'waiting':
        return {
          icon: '⏳',
          description: 'Oczekiwanie na odpowiedzi lub działania innych',
          optimalTiming: 'Review cotygodniowy',
          color: 'border-gray-200 bg-gray-50'
        };
      case 'reading':
        return {
          icon: '📚',
          description: 'Dokumenty do przeczytania i analiza',
          optimalTiming: 'Spokojny moment',
          color: 'border-indigo-200 bg-indigo-50'
        };
      case 'planning':
        return {
          icon: '🎯',
          description: 'Planowanie strategiczne i organizacja',
          optimalTiming: 'Początek tygodnia',
          color: 'border-teal-200 bg-teal-50'
        };
      case 'office':
        return {
          icon: '🏢',
          description: 'Zadania wymagające obecności w biurze',
          optimalTiming: 'Godziny biurowe',
          color: 'border-slate-200 bg-slate-50'
        };
      case 'home':
        return {
          icon: '🏠',
          description: 'Zadania możliwe do wykonania w domu',
          optimalTiming: 'Praca zdalna',
          color: 'border-emerald-200 bg-emerald-50'
        };
      case 'online':
        return {
          icon: '🌐',
          description: 'Zadania internetowe i digital marketing',
          optimalTiming: 'Dowolny moment online',
          color: 'border-cyan-200 bg-cyan-50'
        };
      default:
        return {
          icon: '📋',
          description: 'Inne zadania',
          optimalTiming: 'Dowolny moment',
          color: 'border-gray-200 bg-gray-50'
        };
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Grupuj zadania według kontekstu GTD
  const groupTasksByContext = () => {
    const contexts = [...new Set(tasks.map(task => task.gtdContext))];
    
    return contexts.map(context => {
      const contextTasks = tasks.filter(task => task.gtdContext === context);
      const config = getContextConfig(context);
      
      return {
        context,
        ...config,
        tasks: contextTasks.sort((a, b) => {
          // Sortuj według priorytetu, potem według terminu
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // Jeśli priorytety są równe, sortuj według terminu
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          return 0;
        }),
        estimatedTime: contextTasks.reduce((sum, task) => sum + task.estimatedTime, 0)
      };
    }).filter(section => section.tasks.length > 0);
  };

  const sections = groupTasksByContext();

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Brak zadań w kontekstach GTD
        </h3>
        <p className="text-gray-600">
          Dodaj zadania z kontekstami GTD, aby zobaczyć je pogrupowane według metodologii David Allen'a.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Konteksty GTD
        </h2>
        <p className="text-gray-600 mb-4">
          Zadania pogrupowane według kontekstów metodologii Getting Things Done
        </p>
        
        {/* Summary */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Kontekstów: {sections.length}</span>
          <span>Zadań: {tasks.length}</span>
          <span>Łączny czas: {formatTime(sections.reduce((sum, section) => sum + section.estimatedTime, 0))}</span>
        </div>
      </div>

      {/* Context Sections */}
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.context} className={`border-2 rounded-lg ${section.color}`}>
            {/* Section Header */}
            <div className="p-4 border-b border-current border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {section.context}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {section.tasks.length} {section.tasks.length === 1 ? 'zadanie' : 'zadań'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(section.estimatedTime)}
                  </div>
                </div>
              </div>

              {/* Optimal Timing */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-700">
                  Optymalny czas:
                </span>
                <span className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded">
                  {section.optimalTiming}
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white bg-opacity-40">
              <div className="divide-y divide-gray-200">
                {section.tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GTD Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          💡 Wskazówki GTD
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Grupuj podobne zadania (np. wszystkie @calls razem)</li>
          <li>• Wybierz kontekst na podstawie dostępnego czasu i energii</li>
          <li>• @calls najlepiej rano, @reading gdy masz spokój</li>
          <li>• Przegląj @waiting cotygodniowo</li>
          <li>• Używaj @errands gdy jesteś poza biurem</li>
        </ul>
      </div>
    </div>
  );
};