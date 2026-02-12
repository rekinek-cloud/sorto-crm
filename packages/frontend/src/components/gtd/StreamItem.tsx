'use client';

import React from 'react';
import { Stream } from '@/types/gtd';
import {
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Copy,
  BadgeCheck,
  Clock,
  FileText
} from 'lucide-react';

interface StreamItemProps {
  stream: Stream;
  onEdit: (stream: Stream) => void;
  onDelete: (streamId: string) => void;
  onArchive: (streamId: string, archive: boolean) => void;
  onDuplicate: (streamId: string) => void;
  onSelect?: (stream: Stream) => void;
}

export default function StreamItem({
  stream,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onSelect
}: StreamItemProps) {
  const getStatusIcon = () => {
    const status = stream.status as string;
    switch (status) {
      case 'FLOWING':
      case 'ACTIVE':
        return <BadgeCheck className="h-5 w-5 text-blue-500" />;
      case 'FROZEN':
      case 'ARCHIVED':
        return <Archive className="h-5 w-5 text-slate-500" />;
      case 'TEMPLATE':
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    const status = stream.status as string;
    switch (status) {
      case 'FLOWING':
      case 'ACTIVE':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'FROZEN':
      case 'ARCHIVED':
        return `${baseClasses} bg-slate-100 text-slate-800`;
      case 'TEMPLATE':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getStatusLabel = () => {
    const status = stream.status as string;
    switch (status) {
      case 'FLOWING':
      case 'ACTIVE':
        return 'Płynący';
      case 'FROZEN':
      case 'ARCHIVED':
        return 'Zamrożony';
      case 'TEMPLATE':
        return 'Szablon';
      default:
        return status;
    }
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(stream);
    }
  };

  return (
    <div 
      className={`p-4 hover:bg-gray-50 ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Color indicator */}
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: stream.color }}
          ></div>
          
          {/* Stream info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {stream.name}
              </h3>
              {getStatusIcon()}
              <span className={getStatusBadge()}>
                {getStatusLabel()}
              </span>
            </div>
            
            {stream.description && (
              <p className="text-gray-600 text-sm mt-1 truncate">
                {stream.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Utworzono: {new Date(stream.createdAt).toLocaleDateString('pl-PL')}</span>
              <span>Zmieniono: {new Date(stream.updatedAt).toLocaleDateString('pl-PL')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(stream);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edytuj strumień"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(stream.id);
            }}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
            title="Duplikuj strumień"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const s = stream.status as string;
              onArchive(stream.id, s !== 'ARCHIVED' && s !== 'FROZEN');
            }}
            className="p-2 text-gray-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
            title={(stream.status as string) === 'ARCHIVED' || (stream.status as string) === 'FROZEN' ? 'Odmroź strumień' : 'Zamroź strumień'}
          >
            {(stream.status as string) === 'ARCHIVED' || (stream.status as string) === 'FROZEN' ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(stream.id);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Usuń strumień"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}