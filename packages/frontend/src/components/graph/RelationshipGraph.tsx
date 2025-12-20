'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  ArrowsPointingInIcon, 
  ArrowsPointingOutIcon,
  FunnelIcon,
  ArrowPathIcon,
  PhotoIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useRelationshipData } from '../../hooks/useRelationshipData';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';
import { nodeConfig, linkConfig, getNodeColor, getNodeIcon } from './graphConfig';
import toast from 'react-hot-toast';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

interface RelationshipGraphProps {
  entityId: string;
  entityType: 'project' | 'task' | 'contact' | 'company' | 'deal' | 'stream';
  depth?: number;
  onNodeClick?: (node: any) => void;
}

export function RelationshipGraph({ 
  entityId, 
  entityType, 
  depth = 2,
  onNodeClick 
}: RelationshipGraphProps) {
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [graphDepth, setGraphDepth] = useState(depth);
  const [showLabels, setShowLabels] = useState(true);
  const [physics, setPhysics] = useState(true);

  const { data, loading, error, refetch } = useRelationshipData(entityId, entityType, graphDepth);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 32, height: Math.min(height - 32, 600) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const filteredData = useMemo(() => {
    if (!data || filters.size === 0) return data;

    const filteredNodes = data.nodes.filter(node => !filters.has(node.type));
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(
      link => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node.id);
    if (onNodeClick) {
      onNodeClick(node);
    } else {
      const url = `/${node.type}s/${node.originalId}`;
      window.open(url, '_blank');
    }
  }, [onNodeClick]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const centerGraph = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  const resetGraph = useCallback(() => {
    setFilters(new Set());
    setSelectedNode(null);
    setGraphDepth(depth);
    refetch();
  }, [depth, refetch]);

  const exportImage = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `graph-${entityType}-${entityId}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Graf został wyeksportowany!');
        }
      });
    }
  }, [entityId, entityType]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    const isSelected = node.id === selectedNode;
    const isHovered = node.id === hoveredNode;
    const isMainNode = node.id === `${entityType}-${entityId}`;
    
    const size = isMainNode ? 8 : 6;
    const color = getNodeColor(node.type);
    
    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * (isSelected ? 1.5 : 1), 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    if (isSelected || isHovered || isMainNode) {
      ctx.strokeStyle = isMainNode ? '#fbbf24' : '#3b82f6';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    // Icon
    const icon = getNodeIcon(node.type);
    if (icon) {
      ctx.font = `${fontSize * 1.5}px Font Awesome`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, node.x, node.y);
    }

    // Label
    if (showLabels || isSelected || isHovered) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, node.x, node.y + size + 2);
    }
  }, [selectedNode, hoveredNode, entityType, entityId, showLabels]);

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center h-96">
        <LoadingSpinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Błąd ładowania danych: {error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Spróbuj ponownie
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          Mapa Powiązań
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={centerGraph}
            variant="outline"
            size="sm"
            title="Wycentruj graf"
          >
            <ArrowsPointingInIcon className="w-4 h-4" />
          </Button>
          <Button
            onClick={exportImage}
            variant="outline"
            size="sm"
            title="Eksportuj jako obraz"
          >
            <PhotoIcon className="w-4 h-4" />
          </Button>
          <Button
            onClick={resetGraph}
            variant="outline"
            size="sm"
            title="Resetuj graf"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <GraphControls
        depth={graphDepth}
        onDepthChange={setGraphDepth}
        filters={filters}
        onFiltersChange={setFilters}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        physics={physics}
        onPhysicsChange={setPhysics}
        availableTypes={Array.from(new Set(data?.nodes.map(n => n.type) || []))}
      />

      <div ref={containerRef} className="relative border rounded-lg bg-gray-50 overflow-hidden">
        {filteredData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              if (typeof node.x === 'number' && typeof node.y === 'number') {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
                ctx.fill();
              }
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoveredNode(node?.id?.toString() || null)}
            onBackgroundClick={handleBackgroundClick}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkWidth={(link: any) => link.strength || 1}
            linkColor={() => '#94a3b8'}
            enableNodeDrag={physics}
            enablePanInteraction={true}
            enableZoomInteraction={true}
            cooldownTicks={100}
            d3VelocityDecay={0.3}
          />
        )}
        
        <GraphLegend />
        
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
            <h4 className="font-semibold mb-2">Szczegóły węzła</h4>
            <p className="text-sm text-gray-600">
              {filteredData?.nodes.find(n => n.id === selectedNode)?.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Typ: {filteredData?.nodes.find(n => n.id === selectedNode)?.type}
            </p>
            <Button
              onClick={() => handleNodeClick(filteredData?.nodes.find(n => n.id === selectedNode))}
              size="sm"
              className="mt-2 w-full"
            >
              Otwórz szczegóły
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          Węzłów: {filteredData?.nodes.length || 0} | 
          Połączeń: {filteredData?.links.length || 0} | 
          Głębokość: {graphDepth}
        </p>
      </div>
    </Card>
  );
}