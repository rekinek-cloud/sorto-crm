import React from 'react';
import { Button } from '../ui/Button';
import {
  Minus,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Pause
} from 'lucide-react';

interface GraphControlsProps {
  depth: number;
  onDepthChange: (depth: number) => void;
  filters: Set<string>;
  onFiltersChange: (filters: Set<string>) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  physics: boolean;
  onPhysicsChange: (enabled: boolean) => void;
  availableTypes: string[];
}

const typeLabels: Record<string, string> = {
  project: 'Projekty',
  task: 'Zadania',
  contact: 'Kontakty',
  company: 'Firmy',
  deal: 'Deale',
  document: 'Dokumenty',
  meeting: 'Spotkania',
  communication: 'Komunikacja'
};

export function GraphControls({
  depth,
  onDepthChange,
  filters,
  onFiltersChange,
  showLabels,
  onShowLabelsChange,
  physics,
  onPhysicsChange,
  availableTypes
}: GraphControlsProps) {
  const toggleFilter = (type: string) => {
    const newFilters = new Set(filters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    onFiltersChange(newFilters);
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Głębokość:</span>
          <Button
            onClick={() => onDepthChange(Math.max(1, depth - 1))}
            variant="outline"
            size="sm"
            disabled={depth <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="font-medium w-8 text-center">{depth}</span>
          <Button
            onClick={() => onDepthChange(Math.min(5, depth + 1))}
            variant="outline"
            size="sm"
            disabled={depth >= 5}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        <Button
          onClick={() => onShowLabelsChange(!showLabels)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          {showLabels ? (
            <>
              <Eye className="w-3 h-3" />
              <span>Ukryj etykiety</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Pokaż etykiety</span>
            </>
          )}
        </Button>

        <Button
          onClick={() => onPhysicsChange(!physics)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          {physics ? (
            <>
              <Sparkles className="w-3 h-3" />
              <span>Wyłącz fizykę</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" />
              <span>Włącz fizykę</span>
            </>
          )}
        </Button>
      </div>

      {availableTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filtry:</span>
          {availableTypes.map(type => (
            <Button
              key={type}
              onClick={() => toggleFilter(type)}
              variant={filters.has(type) ? 'secondary' : 'default'}
              size="sm"
              className="text-xs"
            >
              {typeLabels[type] || type}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}