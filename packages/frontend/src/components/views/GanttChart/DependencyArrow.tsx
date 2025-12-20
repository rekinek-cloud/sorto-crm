'use client';

import React from 'react';
import { Dependency, GanttTask } from '@/types/views';

interface DependencyArrowProps {
  dependency: Dependency;
  fromTask: GanttTask;
  toTask: GanttTask;
  fromTaskPosition: { left: number; width: number; top: number };
  toTaskPosition: { left: number; width: number; top: number };
  onRemove?: (dependency: Dependency) => void;
  className?: string;
}

export default function DependencyArrow({
  dependency,
  fromTask,
  toTask,
  fromTaskPosition,
  toTaskPosition,
  onRemove,
  className = ''
}: DependencyArrowProps) {
  // Calculate connection points based on dependency type
  const getConnectionPoints = () => {
    const taskHeight = 30;
    const taskCenterY = taskHeight / 2;

    let startX: number, startY: number, endX: number, endY: number;

    switch (dependency.type) {
      case 'finish-to-start':
        // From end of first task to start of second task
        startX = fromTaskPosition.left + fromTaskPosition.width;
        startY = fromTaskPosition.top + taskCenterY;
        endX = toTaskPosition.left;
        endY = toTaskPosition.top + taskCenterY;
        break;
      case 'start-to-start':
        // From start of first task to start of second task
        startX = fromTaskPosition.left;
        startY = fromTaskPosition.top + taskCenterY;
        endX = toTaskPosition.left;
        endY = toTaskPosition.top + taskCenterY;
        break;
      case 'finish-to-finish':
        // From end of first task to end of second task
        startX = fromTaskPosition.left + fromTaskPosition.width;
        startY = fromTaskPosition.top + taskCenterY;
        endX = toTaskPosition.left + toTaskPosition.width;
        endY = toTaskPosition.top + taskCenterY;
        break;
      default:
        startX = fromTaskPosition.left + fromTaskPosition.width;
        startY = fromTaskPosition.top + taskCenterY;
        endX = toTaskPosition.left;
        endY = toTaskPosition.top + taskCenterY;
    }

    return { startX, startY, endX, endY };
  };

  const { startX, startY, endX, endY } = getConnectionPoints();

  // Create path for arrow with rounded corners
  const createPath = () => {
    const offsetX = 20; // Horizontal offset for rounded path
    const offsetY = Math.abs(endY - startY) > 5 ? 15 : 0; // Vertical offset for multi-row connections
    
    if (Math.abs(endY - startY) <= 5) {
      // Same row - simple horizontal line with slight curve
      const midX = (startX + endX) / 2;
      return `M ${startX} ${startY} 
              Q ${midX} ${startY - 10} ${endX - 10} ${endY}
              L ${endX} ${endY}`;
    } else {
      // Different rows - L-shaped path with rounded corners
      const cornerX = startX + offsetX;
      return `M ${startX} ${startY}
              L ${cornerX} ${startY}
              Q ${cornerX + 5} ${startY} ${cornerX + 5} ${startY + (endY > startY ? 5 : -5)}
              L ${cornerX + 5} ${endY - (endY > startY ? 5 : -5)}
              Q ${cornerX + 5} ${endY} ${cornerX + 10} ${endY}
              L ${endX - 10} ${endY}
              L ${endX} ${endY}`;
    }
  };

  const getArrowColor = () => {
    switch (dependency.type) {
      case 'finish-to-start':
        return '#3B82F6'; // blue
      case 'start-to-start':
        return '#10B981'; // green
      case 'finish-to-finish':
        return '#F59E0B'; // yellow
      default:
        return '#6B7280'; // gray
    }
  };

  const getStrokeStyle = () => {
    switch (dependency.type) {
      case 'start-to-start':
        return '5,5'; // dashed
      case 'finish-to-finish':
        return '3,3'; // dotted
      default:
        return ''; // solid
    }
  };

  const svgBounds = {
    left: Math.min(startX, endX) - 20,
    top: Math.min(startY, endY) - 20,
    width: Math.abs(endX - startX) + 40,
    height: Math.abs(endY - startY) + 40
  };

  return (
    <div
      className={`absolute pointer-events-none z-10 ${className}`}
      style={{
        left: svgBounds.left,
        top: svgBounds.top,
        width: svgBounds.width,
        height: svgBounds.height
      }}
    >
      <svg
        width={svgBounds.width}
        height={svgBounds.height}
        className="overflow-visible"
      >
        <defs>
          {/* Arrow markers for different dependency types */}
          <marker
            id={`arrowhead-${dependency.type}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
            fill={getArrowColor()}
          >
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>

          {/* Glow filter for better visibility */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Dependency path */}
        <path
          d={createPath()}
          stroke={getArrowColor()}
          strokeWidth="2"
          fill="none"
          strokeDasharray={getStrokeStyle()}
          markerEnd={`url(#arrowhead-${dependency.type})`}
          filter="url(#glow)"
          className="transition-all duration-200 hover:stroke-width-3"
        />

        {/* Lag indicator */}
        {dependency.lag > 0 && (
          <g>
            <circle
              cx={(startX + endX) / 2 - svgBounds.left}
              cy={(startY + endY) / 2 - svgBounds.top}
              r="8"
              fill="white"
              stroke={getArrowColor()}
              strokeWidth="1"
            />
            <text
              x={(startX + endX) / 2 - svgBounds.left}
              y={(startY + endY) / 2 - svgBounds.top}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-medium"
              fill={getArrowColor()}
            >
              +{dependency.lag}
            </text>
          </g>
        )}

        {/* Hover area for interaction */}
        {onRemove && (
          <g className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
            <path
              d={createPath()}
              stroke="transparent"
              strokeWidth="10"
              fill="none"
              onClick={() => onRemove(dependency)}
            />
            
            {/* Delete button */}
            <circle
              cx={(startX + endX) / 2 - svgBounds.left}
              cy={(startY + endY) / 2 - svgBounds.top}
              r="10"
              fill="red"
              onClick={() => onRemove(dependency)}
            />
            <text
              x={(startX + endX) / 2 - svgBounds.left}
              y={(startY + endY) / 2 - svgBounds.top}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-bold"
              fill="white"
              onClick={() => onRemove(dependency)}
            >
              ×
            </text>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      <div className="absolute opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20 bg-gray-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap"
           style={{
             left: (startX + endX) / 2 - svgBounds.left - 50,
             top: (startY + endY) / 2 - svgBounds.top - 30
           }}>
        <div className="font-medium">
          {fromTask.name} → {toTask.name}
        </div>
        <div className="text-gray-300">
          Type: {dependency.type.replace('-', ' to ')}
          {dependency.lag > 0 && ` | Lag: ${dependency.lag} days`}
        </div>
      </div>
    </div>
  );
}