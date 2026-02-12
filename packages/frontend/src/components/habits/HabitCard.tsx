'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Habit, HabitEntry } from '@/lib/api/habits';
import { habitsApi } from '@/lib/api/habits';
import {
  Flame,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onEntryUpdate: () => void;
  onClick?: (habit: Habit) => void;
}

export default function HabitCard({ habit, onEdit, onDelete, onEntryUpdate, onClick }: HabitCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(habit);
  };
  
  // Get today's completion status
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayEntry = habit.entries?.find(entry => entry.date.startsWith(todayStr));
  const isCompletedToday = todayEntry?.completed || false;

  // Get last 7 days for mini calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const handleToggleToday = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      await habitsApi.createHabitEntry(habit.id, {
        date: todayStr,
        completed: !isCompletedToday
      });
      onEntryUpdate();
    } catch (error: any) {
      console.error('Error toggling habit:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const streakStyle = habitsApi.getStreakStyle(habit.currentStreak);
  const entryCount = habit._count?.entries || 0;

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  habit.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {habit.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {habit.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{habit.description}</p>
            )}
          </div>
          
          <div className="relative group">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => onEdit(habit)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(habit.id)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flame className={`w-5 h-5 ${streakStyle.color}`} />
            <span className="text-sm font-medium text-gray-700">
              {habitsApi.formatStreak(habit.currentStreak)}
            </span>
            <span className="text-lg">{streakStyle.emoji}</span>
          </div>
          
          <div className="text-sm text-gray-500">
            Best: {habit.bestStreak} days
          </div>
        </div>

        {/* Mini Calendar (Last 7 days) */}
        <div className="mb-4">
          <div className="flex items-center space-x-1">
            {last7Days.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const entry = habit.entries?.find(e => e.date.startsWith(dateStr));
              const isCompleted = entry?.completed || false;
              const isToday = dateStr === todayStr;
              
              return (
                <div
                  key={index}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                  title={date.toLocaleDateString()}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    date.getDate()
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Action */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Today</span>
          <button
            onClick={handleToggleToday}
            disabled={isToggling || !habit.isActive}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isCompletedToday
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isToggling ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isCompletedToday ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Mark Done</span>
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{entryCount}</div>
            <div className="text-xs text-gray-500">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {habit.frequency.toLowerCase()}
            </div>
            <div className="text-xs text-gray-500">Frequency</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>
              Started {new Date(habit.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>
              {habit.entries && habit.entries.length > 0
                ? `${habitsApi.calculateCompletionRate(
                    habit.entries.filter(e => e.completed),
                    habit.entries.length
                  )}% rate`
                : 'No data'
              }
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}