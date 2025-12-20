'use client';

/**
 * GTDStreamCard - Karta wyświetlająca stream z funkcjonalnością GTD
 * Pokazuje rolę GTD, konfigurację, metryki i szybkie akcje
 */

import React, { useState } from 'react';
import {
  FolderIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  CogIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PauseCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import { GTDRole, StreamType } from '@/types/gtd';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
// Removed date-fns import due to dependency issues

interface GTDStreamCardProps {
  stream: {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    status: string;
    gtdRole?: GTDRole;
    streamType?: StreamType;
    gtdConfig?: any;
    createdAt: string;
    updatedAt: string;
    _count?: {
      tasks: number;
      projects: number;
      messages?: number;
    };
    stats?: {
      taskCompletionRate?: number;
      avgProcessingTime?: number;
      pendingItems?: number;
    };
  };
  onEdit?: (streamId: string) => void;
  onDelete?: (streamId: string) => void;
  onOpenConfig?: (streamId: string) => void;
  onViewHierarchy?: (streamId: string) => void;
  onMigrate?: (streamId: string) => void;
  onOpen?: (streamId: string) => void;
  onFreeze?: (streamId: string) => void;
  onUnfreeze?: (streamId: string) => void;
}

const GTDStreamCard: React.FC<GTDStreamCardProps> = ({
  stream,
  onEdit,
  onDelete,
  onOpenConfig,
  onViewHierarchy,
  onMigrate,
  onOpen,
  onFreeze,
  onUnfreeze
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Ikony dla różnych ról GTD
  const getGTDIcon = (role?: GTDRole) => {
    switch (role) {
      case 'INBOX':
        return <InboxIcon className="w-5 h-5" />;
      case 'NEXT_ACTIONS':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'WAITING_FOR':
        return <ClockIcon className="w-5 h-5" />;
      case 'SOMEDAY_MAYBE':
        return <StarIcon className="w-5 h-5" />;
      case 'PROJECTS':
        return <FolderIcon className="w-5 h-5" />;
      case 'CONTEXTS':
        return <Squares2X2Icon className="w-5 h-5" />;
      case 'AREAS':
        return <ChartBarIcon className="w-5 h-5" />;
      case 'REFERENCE':
        return <ArchiveBoxIcon className="w-5 h-5" />;
      default:
        return <FolderIcon className="w-5 h-5" />;
    }
  };

  // Kolory badge dla różnych typów streamów
  const getStreamTypeColor = (type?: StreamType): "default" | "outline" | "destructive" | "secondary" | "success" | "warning" | "info" => {
    switch (type) {
      case 'WORKSPACE':
        return 'secondary';
      case 'PROJECT':
        return 'success';
      case 'AREA':
        return 'warning';
      case 'CONTEXT':
        return 'info';
      default:
        return 'default';
    }
  };

  // Formatowanie roli GTD
  const formatGTDRole = (role?: GTDRole) => {
    if (!role) return 'Brak roli GTD';
    return role.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Obliczanie completion rate
  const completionRate = stream.stats?.taskCompletionRate || 0;
  const isGTDEnabled = !!stream.gtdRole;

  return (
    <Card 
      className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onOpen && onOpen(stream.id)}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${stream.color}20` }}
            >
              <div style={{ color: stream.color }}>
                {getGTDIcon(stream.gtdRole)}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stream.name}</h3>
              {stream.description && (
                <p className="text-sm text-gray-500 mt-1">{stream.description}</p>
              )}
            </div>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                {onEdit && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edytuj</span>
                  </button>
                )}
                {onOpenConfig && isGTDEnabled && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenConfig(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <CogIcon className="w-4 h-4" />
                    <span>Ustawienia strumienia</span>
                  </button>
                )}
                {onViewHierarchy && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHierarchy(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    <span>Hierarchia</span>
                  </button>
                )}
                {onMigrate && !isGTDEnabled && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMigrate(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Migruj do GTD</span>
                  </button>
                )}
                {stream.status !== 'FROZEN' && onFreeze && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFreeze(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <PauseCircleIcon className="w-4 h-4" />
                    <span>Zamroź strumień</span>
                  </button>
                )}
                {stream.status === 'FROZEN' && onUnfreeze && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnfreeze(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <PlayCircleIcon className="w-4 h-4" />
                    <span>Odmroź strumień</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(stream.id);
                      setShowMenu(false);
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Usuń</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isGTDEnabled && (
            <Badge variant="default">
              {formatGTDRole(stream.gtdRole)}
            </Badge>
          )}
          {stream.streamType && (
            <Badge variant={getStreamTypeColor(stream.streamType)}>
              {stream.streamType}
            </Badge>
          )}
          {stream.status === 'ARCHIVED' && (
            <Badge variant="default">Zarchiwizowany</Badge>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stream._count?.tasks || 0}
            </div>
            <div className="text-sm text-gray-500">Zadań</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stream._count?.projects || 0}
            </div>
            <div className="text-sm text-gray-500">Projektów</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stream.stats?.pendingItems || 0}
            </div>
            <div className="text-sm text-gray-500">Oczekujących</div>
          </div>
        </div>

        {/* Progress bar */}
        {isGTDEnabled && completionRate > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Postęp</span>
              <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* GTD Configuration Preview */}
        {isGTDEnabled && stream.gtdConfig && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm">
              {stream.gtdConfig.inboxBehavior?.autoProcessing && (
                <div className="flex items-center space-x-2 text-green-600">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Auto-przetwarzanie włączone</span>
                </div>
              )}
              {stream.gtdConfig.reviewFrequency && (
                <div className="text-gray-600 mt-1">
                  Przegląd: {stream.gtdConfig.reviewFrequency}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {stream.stats?.avgProcessingTime && (
              <>
                <ClockIcon className="w-4 h-4" />
                <span>~{Math.round(stream.stats.avgProcessingTime)}min</span>
              </>
            )}
          </div>
          <div>
            Zaktualizowano {new Date(stream.updatedAt).toLocaleDateString('pl-PL')}
          </div>
        </div>
      </div>

      {/* Color stripe */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: stream.color }}
      />
    </Card>
  );
};

export default GTDStreamCard;