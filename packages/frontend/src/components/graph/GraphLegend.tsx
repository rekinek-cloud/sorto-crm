import React from 'react';
import { nodeConfig } from './graphConfig';

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-md">
      <h4 className="text-xs font-semibold mb-2 text-gray-700">Legenda</h4>
      <div className="space-y-1">
        {Object.entries(nodeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-xs text-gray-600">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}