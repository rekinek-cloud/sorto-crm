'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  UserIcon,
  BuildingOfficeIcon,
  FolderIcon,
  CheckIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { graphApi, type GraphNode, type GraphLink } from '@/lib/api/graph';

// Types imported from @/lib/api/graph
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const entityTypes = [
  { id: 'contact', name: 'Kontakt', icon: UserIcon, color: '#3B82F6' },
  { id: 'company', name: 'Firma', icon: BuildingOfficeIcon, color: '#10B981' },
  { id: 'project', name: 'Projekt', icon: FolderIcon, color: '#8B5CF6' },
  { id: 'task', name: 'Zadanie', icon: CheckIcon, color: '#F59E0B' },
  { id: 'deal', name: 'Transakcja', icon: CurrencyDollarIcon, color: '#EC4899' },
  { id: 'stream', name: 'Stream', icon: Squares2X2Icon, color: '#6366F1' },
];

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<string>('contact');
  const [entityId, setEntityId] = useState<string>('');
  const [depth, setDepth] = useState<number>(2);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadGraph = useCallback(async () => {
    if (!entityId.trim()) {
      toast.error('Wprowadz ID encji');
      return;
    }

    try {
      setLoading(true);
      const result = await graphApi.getRelationships(entityId, entityType, depth);

      if (result.success) {
        setGraphData(result.data);
        if (result.data.nodes.length === 0) {
          toast.error('Nie znaleziono danych dla tej encji');
        }
      }
    } catch (error) {
      console.error('Failed to load graph:', error);
      toast.error('Nie udalo sie zaladowac grafu');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, depth]);

  // Simple canvas-based graph rendering
  useEffect(() => {
    if (!canvasRef.current || graphData.nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Calculate node positions in a circle
    const nodePositions: Record<string, { x: number; y: number }> = {};
    const radius = Math.min(width, height) / 3;
    const angleStep = (2 * Math.PI) / graphData.nodes.length;

    graphData.nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2;
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Draw links
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    graphData.links.forEach((link) => {
      const source = nodePositions[link.source];
      const target = nodePositions[link.target];
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const pos = nodePositions[node.id];
      const entityConfig = entityTypes.find((e) => e.id === node.type);
      const color = entityConfig?.color || '#6B7280';

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 24, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Selected highlight
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#1F2937';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = '#1F2937';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.substring(0, 15), pos.x, pos.y + 40);

      // Type label
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type, pos.x, pos.y + 52);
    });

    // Handle click
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of graphData.nodes) {
        const pos = nodePositions[node.id];
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance <= 24) {
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [graphData, selectedNode]);

  const getEntityIcon = (type: string) => {
    const config = entityTypes.find((e) => e.id === type);
    return config?.icon || MapIcon;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <MapIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Graf relacji</h1>
          <p className="text-sm text-gray-600">Wizualizacja polaczen miedzy encjami</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ encji</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {entityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">ID encji</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Wprowadz ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Glebokosc</label>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value={1}>1 poziom</option>
              <option value={2}>2 poziomy</option>
              <option value={3}>3 poziomy</option>
              <option value={4}>4 poziomy</option>
              <option value={5}>5 poziomow</option>
            </select>
          </div>

          <button
            onClick={loadGraph}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
            Szukaj
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph Canvas */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {graphData.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
              <MapIcon className="h-16 w-16 text-gray-300 mb-4" />
              <p>Wprowadz ID encji i kliknij "Szukaj"</p>
              <p className="text-sm text-gray-400 mt-1">Graf relacji pojawi sie tutaj</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full h-[500px]"
            />
          )}
        </div>

        {/* Details Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Szczegoly
          </h3>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  {React.createElement(getEntityIcon(selectedNode.type), {
                    className: 'h-8 w-8',
                    style: { color: entityTypes.find((e) => e.id === selectedNode.type)?.color },
                  })}
                  <div>
                    <p className="font-medium text-gray-900">{selectedNode.name}</p>
                    <p className="text-sm text-gray-500">{selectedNode.type}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono text-gray-700">{selectedNode.originalId.substring(0, 8)}...</span>
                  </div>
                  {selectedNode.metadata?.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-gray-700">{selectedNode.metadata.status}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setEntityId(selectedNode.originalId);
                  setEntityType(selectedNode.type);
                }}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Ustaw jako centrum
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Kliknij na wezel, aby zobaczyc szczegoly</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda</h4>
            <div className="space-y-2">
              {entityTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-gray-600">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {graphData.nodes.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Statystyki</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Wezly:</span>
                  <span className="font-medium text-gray-900">{graphData.nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Polaczenia:</span>
                  <span className="font-medium text-gray-900">{graphData.links.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
