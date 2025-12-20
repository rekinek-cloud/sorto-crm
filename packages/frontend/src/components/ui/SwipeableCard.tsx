'use client';

import React, { useState } from 'react';
import { motion, useAnimationControls, PanInfo } from 'framer-motion';
import { Check, X, Clock, ArrowRight, Star, Trash2 } from 'lucide-react';

interface SwipeAction {
  id: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right', actionId?: string) => void;
  disabled?: boolean;
  className?: string;
}

const defaultLeftActions: SwipeAction[] = [
  {
    id: 'complete',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    label: 'Ukończ',
    action: () => console.log('Complete action'),
  },
  {
    id: 'defer',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    label: 'Później',
    action: () => console.log('Defer action'),
  },
];

const defaultRightActions: SwipeAction[] = [
  {
    id: 'delete',
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    label: 'Usuń',
    action: () => console.log('Delete action'),
  },
  {
    id: 'archive',
    icon: ArrowRight,
    color: 'text-gray-600',
    bgColor: 'bg-gray-500',
    label: 'Archiwum',
    action: () => console.log('Archive action'),
  },
];

export function SwipeableCard({
  children,
  leftActions = defaultLeftActions,
  rightActions = defaultRightActions,
  onSwipe,
  disabled = false,
  className = '',
}: SwipeableCardProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null);
  const controls = useAnimationControls();

  const SWIPE_THRESHOLD = 100;
  const ACTION_THRESHOLD = 60;

  const handleDragStart = () => {
    if (disabled) return;
    setActiveAction(null);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const offset = info.offset.x;
    setDragOffset(offset);

    // Determine active action based on swipe direction and distance
    if (Math.abs(offset) > ACTION_THRESHOLD) {
      if (offset > 0 && leftActions.length > 0) {
        // Swiping right - show left actions
        const actionIndex = Math.min(
          Math.floor((offset - ACTION_THRESHOLD) / (SWIPE_THRESHOLD / leftActions.length)),
          leftActions.length - 1
        );
        setActiveAction(leftActions[actionIndex]);
      } else if (offset < 0 && rightActions.length > 0) {
        // Swiping left - show right actions
        const actionIndex = Math.min(
          Math.floor((Math.abs(offset) - ACTION_THRESHOLD) / (SWIPE_THRESHOLD / rightActions.length)),
          rightActions.length - 1
        );
        setActiveAction(rightActions[actionIndex]);
      }
    } else {
      setActiveAction(null);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Check if swipe was strong enough
    if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
      if (activeAction) {
        // Execute the action
        activeAction.action();
        onSwipe?.(offset > 0 ? 'right' : 'left', activeAction.id);
        
        // Animate completion
        controls.start({
          x: offset > 0 ? 300 : -300,
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.3 }
        });
        
        // Reset after animation
        setTimeout(() => {
          controls.start({
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3 }
          });
          setDragOffset(0);
          setActiveAction(null);
        }, 300);
      }
    } else {
      // Return to original position
      controls.start({
        x: 0,
        transition: {
          type: 'spring',
          stiffness: 500,
          damping: 30
        }
      });
      setDragOffset(0);
      setActiveAction(null);
    }
  };

  const getBackgroundColor = () => {
    if (!activeAction) return 'transparent';
    return activeAction.bgColor;
  };

  const getActionOpacity = () => {
    if (!activeAction) return 0;
    return Math.min(Math.abs(dragOffset) / SWIPE_THRESHOLD, 1);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action backgrounds */}
      {dragOffset > ACTION_THRESHOLD && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start pl-4 space-x-2"
          style={{
            backgroundColor: getBackgroundColor(),
            opacity: getActionOpacity(),
          }}
        >
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            const isActive = activeAction?.id === action.id;
            return (
              <motion.div
                key={action.id}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  opacity: isActive ? 1 : 0.6
                }}
                className="flex flex-col items-center text-white"
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {dragOffset < -ACTION_THRESHOLD && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end pr-4 space-x-2"
          style={{
            backgroundColor: getBackgroundColor(),
            opacity: getActionOpacity(),
          }}
        >
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            const isActive = activeAction?.id === action.id;
            return (
              <motion.div
                key={action.id}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  opacity: isActive ? 1 : 0.6
                }}
                className="flex flex-col items-center text-white"
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative bg-card border border-border glass-card ${className} ${
          disabled ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{
          zIndex: 10,
        }}
      >
        {children}
        
        {/* Swipe indicators */}
        {!disabled && (
          <>
            {/* Left indicator */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-30">
              <div className="flex space-x-1">
                {leftActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Icon key={action.id} className={`w-4 h-4 ${action.color}`} />
                  );
                })}
              </div>
            </div>
            
            {/* Right indicator */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-30">
              <div className="flex space-x-1">
                {rightActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Icon key={action.id} className={`w-4 h-4 ${action.color}`} />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// Preset components for common use cases
export function SwipeableTaskCard({ 
  children, 
  onComplete, 
  onDefer, 
  onDelete,
  className 
}: {
  children: React.ReactNode;
  onComplete?: () => void;
  onDefer?: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  const leftActions: SwipeAction[] = [
    {
      id: 'complete',
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      label: 'Ukończ',
      action: onComplete || (() => {}),
    },
    {
      id: 'defer',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      label: 'Później',
      action: onDefer || (() => {}),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'delete',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      label: 'Usuń',
      action: onDelete || (() => {}),
    },
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}

export function SwipeableEmailCard({ 
  children, 
  onArchive, 
  onStar, 
  onDelete,
  className 
}: {
  children: React.ReactNode;
  onArchive?: () => void;
  onStar?: () => void;
  onDelete?: () => void;
  className?: string;
}) {
  const leftActions: SwipeAction[] = [
    {
      id: 'star',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      label: 'Gwiazdka',
      action: onStar || (() => {}),
    },
    {
      id: 'archive',
      icon: ArrowRight,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      label: 'Archiwum',
      action: onArchive || (() => {}),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'delete',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      label: 'Usuń',
      action: onDelete || (() => {}),
    },
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}

export default SwipeableCard;