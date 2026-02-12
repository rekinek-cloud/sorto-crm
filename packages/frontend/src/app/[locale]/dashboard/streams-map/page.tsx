'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map,
  ArrowRight,
  Plus,
  Layers,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface Stream {
  id: string;
  name: string;
  description?: string;
  color: string;
  gtdRole?: string;
  streamType?: string;
  status: string;
  _count?: {
    tasks: number;
    projects: number;
  };
}

interface StreamRelation {
  id: string;
  parentId: string;
  childId: string;
  relationType: string;
}

interface StreamNode {
  id: string;
  stream: Stream;
  x: number;
  y: number;
  children: StreamNode[];
  level: number;
}

const ROLE_COLORS: Record<string, string> = {
  INBOX: '#8B5CF6',
  PROJECTS: '#3B82F6',
  AREAS: '#10B981',
  REFERENCE: '#6B7280',
  SOMEDAY_MAYBE: '#06B6D4',
  NEXT_ACTIONS: '#F59E0B',
  WAITING_FOR: '#EF4444',
  CONTEXTS: '#EC4899',
  CUSTOM: '#8B5CF6',
};

const ROLE_LABELS: Record<string, string> = {
  INBOX: 'Zrodlo',
  PROJECTS: 'Projektowy',
  AREAS: 'Ciagly',
  REFERENCE: 'Referencyjny',
  SOMEDAY_MAYBE: 'Zamrozony',
  NEXT_ACTIONS: 'Zadania',
  WAITING_FOR: 'Oczekujace',
  CONTEXTS: 'Kontekst',
  CUSTOM: 'Wlasny',
};

export default function StreamsMapPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [relations, setRelations] = useState<StreamRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch streams and relations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch GTD streams
      const streamsResponse = await apiClient.get('/gtd-streams');
      const streamsData = streamsResponse.data.data || [];
      setStreams(streamsData);

      // Fetch relations
      try {
        const relationsResponse = await apiClient.get('/stream-relations');
        setRelations(relationsResponse.data.data || []);
      } catch {
        // Relations endpoint may not exist, that's ok
        setRelations([]);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      toast.error('Nie udalo sie pobrac strumieni');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build tree structure
  const buildTree = useCallback((): StreamNode[] => {
    if (streams.length === 0) return [];

    const childIds = new Set(relations.map(r => r.childId));
    const rootStreams = streams.filter(s => !childIds.has(s.id));

    // If no relations, show all streams as roots
    if (relations.length === 0) {
      return streams.map((stream, index) => ({
        id: stream.id,
        stream,
        x: 0,
        y: 0,
        children: [],
        level: 0,
      }));
    }

    const buildNode = (stream: Stream, level: number): StreamNode => {
      const childRelations = relations.filter(r => r.parentId === stream.id);
      const children = childRelations
        .map(r => streams.find(s => s.id === r.childId))
        .filter((s): s is Stream => s !== undefined)
        .map(s => buildNode(s, level + 1));

      return {
        id: stream.id,
        stream,
        x: 0,
        y: 0,
        children,
        level,
      };
    };

    return rootStreams.map(s => buildNode(s, 0));
  }, [streams, relations]);

  // Calculate positions for nodes
  const calculatePositions = useCallback((nodes: StreamNode[]): StreamNode[] => {
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 80;
    const HORIZONTAL_GAP = 60;
    const VERTICAL_GAP = 100;

    let currentY = 50;

    const positionNode = (node: StreamNode, x: number, y: number): number => {
      node.x = x;
      node.y = y;

      if (node.children.length === 0) {
        return y + NODE_HEIGHT + VERTICAL_GAP;
      }

      let childY = y;
      for (const child of node.children) {
        childY = positionNode(child, x + NODE_WIDTH + HORIZONTAL_GAP, childY);
      }

      // Center parent vertically among children
      if (node.children.length > 0) {
        const firstChildY = node.children[0].y;
        const lastChildY = node.children[node.children.length - 1].y;
        node.y = firstChildY + (lastChildY - firstChildY) / 2;
      }

      return childY;
    };

    for (const node of nodes) {
      currentY = positionNode(node, 50, currentY);
    }

    return nodes;
  }, []);

  const tree = calculatePositions(buildTree());

  // Flatten tree for rendering
  const flattenTree = (nodes: StreamNode[]): StreamNode[] => {
    const result: StreamNode[] = [];
    const traverse = (node: StreamNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };
    nodes.forEach(traverse);
    return result;
  };

  const allNodes = flattenTree(tree);

  // Get all edges
  const getEdges = (): { from: StreamNode; to: StreamNode }[] => {
    const edges: { from: StreamNode; to: StreamNode }[] = [];
    const traverse = (node: StreamNode) => {
      for (const child of node.children) {
        edges.push({ from: node, to: child });
        traverse(child);
      }
    };
    tree.forEach(traverse);
    return edges;
  };

  const edges = getEdges();

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(0.3, z + delta), 2));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate canvas size
  const canvasWidth = Math.max(...allNodes.map(n => n.x + 250), 800);
  const canvasHeight = Math.max(...allNodes.map(n => n.y + 100), 600);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Ladowanie mapy strumieni...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Mapa Strumieni"
        subtitle={`${streams.length} strumieni${relations.length > 0 ? ` / ${relations.length} powiazan` : ''}`}
        icon={Map}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/30 rounded-xl p-1">
              <button
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg"
                title="Pomniejsz"
              >
                <ZoomOut className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="px-2 text-sm text-slate-600 dark:text-slate-400 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg"
                title="Powieksz"
              >
                <ZoomIn className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={resetView}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg"
                title="Resetuj widok"
              >
                <Maximize2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Odswiez
            </button>

            <Link
              href="/dashboard/streams"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Layers className="h-4 w-4" />
              Strumienie
            </Link>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(ROLE_LABELS).slice(0, 6).map(([role, label]) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border dark:text-slate-300"
            style={{
              borderColor: ROLE_COLORS[role],
              backgroundColor: `${ROLE_COLORS[role]}10`
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ROLE_COLORS[role] }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Map Canvas */}
      {streams.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-4">
              <Map className="h-12 w-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Brak strumieni</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
              Utworz strumienie, aby zobaczyc mape wizualizujaca ich hierarchie.
            </p>
            <Link
              href="/dashboard/streams"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Utworz strumien
            </Link>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden relative"
          style={{ height: 'calc(100vh - 280px)', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* SVG for edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            width={canvasWidth}
            height={canvasHeight}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                />
              </marker>
            </defs>
            {edges.map((edge, i) => {
              const fromX = edge.from.x + 200;
              const fromY = edge.from.y + 35;
              const toX = edge.to.x;
              const toY = edge.to.y + 35;
              const midX = (fromX + toX) / 2;

              return (
                <path
                  key={i}
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {allNodes.map(node => {
              const color = node.stream.color || ROLE_COLORS[node.stream.gtdRole || 'CUSTOM'] || '#3B82F6';
              const isSelected = selectedStream?.id === node.stream.id;

              return (
                <div
                  key={node.id}
                  className={`absolute bg-white dark:bg-slate-800 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: 200,
                    borderColor: color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStream(isSelected ? null : node.stream);
                  }}
                >
                  {/* Color bar */}
                  <div
                    className="h-1.5 rounded-t-md"
                    style={{ backgroundColor: color }}
                  />

                  {/* Content */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate flex-1">
                        {node.stream.name}
                      </h3>
                      {node.stream.gtdRole && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {ROLE_LABELS[node.stream.gtdRole] || node.stream.gtdRole}
                        </span>
                      )}
                    </div>

                    {node.stream.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {node.stream.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                      {node.stream._count?.tasks !== undefined && (
                        <span>{node.stream._count.tasks} zadan</span>
                      )}
                      {node.children.length > 0 && (
                        <span>/ {node.children.length} podstrumieni</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected stream details */}
      {selectedStream && (
        <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-xl dark:bg-slate-800/90 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/30 p-4 w-80 z-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedStream.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {ROLE_LABELS[selectedStream.gtdRole || ''] || selectedStream.streamType}
              </p>
            </div>
            <button
              onClick={() => setSelectedStream(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ×
            </button>
          </div>

          {selectedStream.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedStream.description}</p>
          )}

          <div className="flex gap-2">
            <Link
              href={`/dashboard/streams/${selectedStream.id}`}
              className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
            >
              Otworz
            </Link>
            <button
              onClick={() => setSelectedStream(null)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
