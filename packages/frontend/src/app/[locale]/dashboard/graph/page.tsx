'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Map,
  Search,
  SlidersHorizontal,
  RefreshCw,
  User,
  Building2,
  Folder,
  Check,
  DollarSign,
  LayoutGrid,
  Network,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { graphApi, type GraphNode, type GraphLink } from '@/lib/api/graph';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

// Types imported from @/lib/api/graph
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const entityTypes = [
  { id: 'contact', name: 'Kontakt', icon: User, color: '#3B82F6' },
  { id: 'company', name: 'Firma', icon: Building2, color: '#10B981' },
  { id: 'project', name: 'Projekt', icon: Folder, color: '#8B5CF6' },
  { id: 'task', name: 'Zadanie', icon: Check, color: '#F59E0B' },
  { id: 'deal', name: 'Transakcja', icon: DollarSign, color: '#EC4899' },
  { id: 'stream', name: 'Stream', icon: LayoutGrid, color: '#6366F1' },
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
      const result = await graphApi.getRelationships({ entityId, entityType, depth });

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
    ctx.fillStyle = '#f8fafc';
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
    ctx.strokeStyle = '#cbd5e1';
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
      const color = entityConfig?.color || '#64748b';

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 24, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Selected highlight
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.substring(0, 15), pos.x, pos.y + 40);

      // Type label
      ctx.fillStyle = '#64748b';
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
    return config?.icon || Map;
  };

  return (
    <PageShell>
      <PageHeader
        title="Graf relacji"
        subtitle="Wizualizacja powiazan miedzy encjami"
        icon={Network}
        iconColor="text-indigo-600"
        breadcrumbs={[{ label: 'Graf relacji' }]}
      />

      <div className="space-y-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ encji</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              >
                {entityTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID encji</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="Wprowadz ID..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Glebokosc</label>
              <select
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              Szukaj
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
          {/* Graph Canvas */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
            {graphData.nodes.length === 0 ? (
              <div className="h-[500px] flex items-center justify-center">
                <EmptyState
                  icon={Network}
                  title="Wprowadz ID encji i kliknij Szukaj"
                  description="Graf relacji pojawi sie tutaj"
                />
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
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              Szczegoly
            </h3>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    {React.createElement(getEntityIcon(selectedNode.type), {
                      className: 'h-8 w-8',
                      style: { color: entityTypes.find((e) => e.id === selectedNode.type)?.color },
                    })}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{selectedNode.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedNode.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">ID:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{selectedNode.originalId.substring(0, 8)}...</span>
                    </div>
                    {selectedNode.metadata?.status && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <span className="text-slate-700 dark:text-slate-300">{selectedNode.metadata.status}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEntityId(selectedNode.originalId);
                    setEntityType(selectedNode.type);
                  }}
                  className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  Ustaw jako centrum
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">Kliknij na wezel, aby zobaczyc szczegoly</p>
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Legenda</h4>
              <div className="space-y-2">
                {entityTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-400">{type.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {graphData.nodes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Statystyki</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Wezly:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{graphData.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Polaczenia:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{graphData.links.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
