'use client';

import React, { useState } from 'react';
import { PreciseGoal } from '@/types/streams';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PauseCircleIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface GoalCardProps {
  goal: PreciseGoal;
  onEdit: (goal: PreciseGoal) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, currentValue: number) => void;
  onAchieve: (id: string) => void;
  onClick?: (goal: PreciseGoal) => void;
}

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateProgress,
  onAchieve,
  onClick,
}: GoalCardProps) {
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(goal.currentValue);

  const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const isOverdue = new Date(goal.deadline) < new Date() && goal.status === 'active';
  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusConfig = () => {
    switch (goal.status) {
      case 'active':
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          label: 'Aktywny',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
        };
      case 'achieved':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          label: 'Osiągnięty',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
        };
      case 'failed':
        return {
          icon: <XCircleIcon className="w-4 h-4" />,
          label: 'Nieosiągnięty',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
        };
      case 'paused':
        return {
          icon: <PauseCircleIcon className="w-4 h-4" />,
          label: 'Wstrzymany',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleProgressSubmit = () => {
    onUpdateProgress(goal.id, progressValue);
    setIsUpdatingProgress(false);
  };

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-cyan-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Nie propaguj kliknięcia jeśli kliknięto na przycisk
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    onClick?.(goal);
  };

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </div>

            {/* Stream */}
            {goal.stream && (
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: goal.stream.color }}
                />
                <span className="text-sm text-gray-600">{goal.stream.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edytuj"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Usuń"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body - RZUT */}
      <div className="p-4 space-y-3">
        {/* R - Rezultat */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">R</span>
            <span className="text-xs text-gray-500">Rezultat</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{goal.result}</p>
        </div>

        {/* Z - Zmierzalność */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">Z</span>
            <span className="text-xs text-gray-500">Zmierzalność</span>
          </div>
          <p className="text-sm text-gray-700">{goal.measurement}</p>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
            <span className={`font-medium ${progress >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Update Progress */}
        {goal.status === 'active' && (
          <div className="pt-2">
            {isUpdatingProgress ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  min={0}
                  max={goal.targetValue}
                />
                <button
                  onClick={handleProgressSubmit}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => {
                    setIsUpdatingProgress(false);
                    setProgressValue(goal.currentValue);
                  }}
                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                >
                  Anuluj
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsUpdatingProgress(true)}
                className="w-full px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
              >
                <ChartBarIcon className="w-3.5 h-3.5" />
                Aktualizuj postęp
              </button>
            )}
          </div>
        )}

        {/* Achieve Button */}
        {goal.status === 'active' && progress >= 100 && (
          <button
            onClick={() => onAchieve(goal.id)}
            className="w-full px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Oznacz jako osiągnięty
          </button>
        )}
      </div>

      {/* Footer - U & T */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between text-xs">
          {/* U - Ujście (deadline) */}
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>
              {new Date(goal.deadline).toLocaleDateString('pl-PL')}
              {goal.status === 'active' && (
                <span className="ml-1">
                  ({daysLeft > 0 ? `za ${daysLeft} dni` : daysLeft === 0 ? 'dzisiaj' : 'po terminie'})
                </span>
              )}
            </span>
          </div>

          {/* T - Tło */}
          {goal.background && (
            <div className="text-gray-500 truncate max-w-[150px]" title={goal.background}>
              {goal.background}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
