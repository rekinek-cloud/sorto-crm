'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StreamHierarchy, StreamWithRelations, streamHierarchyApi } from '@/lib/api/streamHierarchy';
import { toast } from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ShareIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface StreamHierarchyTreeProps {
  streamId: string;
  onCreateRelation?: (streamId: string) => void;
  onEditRelation?: (relationId: string) => void;
  showPermissions?: boolean;
}

interface TreeNodeProps {
  stream: StreamWithRelations;
  depth: number;
  isParent: boolean;
  onToggle: (streamId: string) => void;
  expanded: Set<string>;
  onCreateRelation?: (streamId: string) => void;
  onEditRelation?: (relationId: string) => void;
  onViewDetails?: (streamId: string) => void;
  showPermissions: boolean;
}

const getRelationTypeColor = (relationType: string) => {
  switch (relationType) {
    case 'OWNS': return 'text-red-600 bg-red-50 border-red-200';
    case 'MANAGES': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'BELONGS_TO': return 'text-green-600 bg-green-50 border-green-200';
    case 'RELATED_TO': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'DEPENDS_ON': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'SUPPORTS': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getRelationTypeIcon = (relationType: string) => {
  switch (relationType) {
    case 'OWNS': return '👑';
    case 'MANAGES': return '⚡';
    case 'BELONGS_TO': return '🏠';
    case 'RELATED_TO': return '🔗';
    case 'DEPENDS_ON': return '⚡';
    case 'SUPPORTS': return '🤝';
    default: return '🔗';
  }
};

const TreeNode: React.FC<TreeNodeProps> = ({
  stream,
  depth,
  isParent,
  onToggle,
  expanded,
  onCreateRelation,
  onEditRelation,
  onViewDetails,
  showPermissions
}) => {
  const isExpanded = expanded.has(stream.id);
  const hasChildren = isParent ? stream.childRelations.length > 0 : stream.parentRelations.length > 0;
  const relations = isParent ? stream.childRelations : stream.parentRelations;

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(stream.id);
    }
  };

  return (
    <div className="select-none">
      {/* Stream Node */}
      <div 
        className={`flex items-center py-2 px-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer group ${
          depth === 0 
            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
        style={{ marginLeft: `${depth * 24}px` }}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Button */}
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          )}
        </div>

        {/* Stream Color Indicator */}
        <div 
          className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundColor: stream.color }}
        ></div>

        {/* Stream Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">
              {stream.name}
            </h3>
            {stream.icon && (
              <span className="text-lg">{stream.icon}</span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              stream.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              stream.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {stream.status}
            </span>
          </div>
          {stream.description && (
            <p className="text-sm text-gray-600 truncate mt-1">
              {stream.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateRelation?.(stream.id);
            }}
            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
            title="Add relation"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(stream.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="View details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Child Relations */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {relations.map((relation) => {
            const relatedStream = isParent ? (relation as any).child : (relation as any).parent;
            return (
              <div key={relation.id} className="relative">
                {/* Relation Info */}
                <div 
                  className={`flex items-center py-2 px-3 ml-6 mr-2 rounded-lg border text-sm ${getRelationTypeColor(relation.relationType)}`}
                  style={{ marginLeft: `${(depth + 1) * 24}px` }}
                >
                  <span className="mr-2">{getRelationTypeIcon(relation.relationType)}</span>
                  <span className="font-medium">{relation.relationType}</span>
                  {relation.description && (
                    <span className="text-gray-600 ml-2">- {relation.description}</span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {!relation.isActive && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" title="Inactive relation" />
                    )}
                    <span className="text-xs">
                      {relation.inheritanceRule.replace('_', ' ').toLowerCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRelation?.(relation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded"
                      title="Edit relation"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Permissions Display */}
                {showPermissions && (relation as any).permissions && (relation as any).permissions.length > 0 && (
                  <div className="mt-1 ml-8 space-y-1" style={{ marginLeft: `${(depth + 2) * 24}px` }}>
                    {(relation as any).permissions.map((permission: any, idx: number) => (
                      <div key={idx} className={`flex items-center text-xs px-2 py-1 rounded ${
                        permission.granted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className="mr-1">{permission.granted ? '✓' : '✗'}</span>
                        <span className="font-medium">{permission.action}</span>
                        <span className="mx-1">on</span>
                        <span>{permission.dataScope}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recursive TreeNode */}
                <div className="mt-2">
                  <TreeNode
                    stream={relatedStream}
                    depth={depth + 1}
                    isParent={isParent}
                    onToggle={onToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    onViewDetails={onViewDetails}
                    showPermissions={showPermissions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function StreamHierarchyTree({
  streamId,
  onCreateRelation,
  onEditRelation,
  showPermissions = false
}: StreamHierarchyTreeProps) {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<StreamHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([streamId]));
  const [direction, setDirection] = useState<'up' | 'down' | 'both'>('both');
  const [depth, setDepth] = useState(3);
  const [includePermissions, setIncludePermissions] = useState(showPermissions);

  const handleViewDetails = (targetStreamId: string) => {
    router.push(`/crm/dashboard/streams/${targetStreamId}`);
  };

  useEffect(() => {
    loadHierarchy();
  }, [streamId, direction, depth, includePermissions]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      console.log('Loading hierarchy for stream:', streamId);
      const data = await streamHierarchyApi.getStreamHierarchy(streamId, {
        direction,
        depth,
        includePermissions
      });
      console.log('Hierarchy data loaded:', data);
      setHierarchy(data);
    } catch (error: any) {
      console.error('Error loading stream hierarchy:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      toast.error('Nie udało się załadować hierarchii stream');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (toggleStreamId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(toggleStreamId)) {
      newExpanded.delete(toggleStreamId);
    } else {
      newExpanded.add(toggleStreamId);
    }
    setExpanded(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hierarchy data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <ShareIcon className="h-5 w-5" />
            Stream Hierarchy
          </h3>
          <div className="flex items-center gap-4">
            {hierarchy.hasCycles && (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Cycles detected
              </div>
            )}
            <span className="text-sm text-gray-500">
              {hierarchy.totalRelations} relations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Direction Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Direction:</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="both">Both</option>
              <option value="up">Parents only</option>
              <option value="down">Children only</option>
            </select>
          </div>

          {/* Depth Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Depth:</label>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={1}>1 level</option>
              <option value={2}>2 levels</option>
              <option value={3}>3 levels</option>
              <option value={5}>5 levels</option>
              <option value={10}>10 levels</option>
            </select>
          </div>

          {/* Permissions Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includePermissions}
              onChange={(e) => setIncludePermissions(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Show permissions</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={loadHierarchy}
            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Parents Section */}
          {direction !== 'down' && hierarchy.parents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ChevronDownIcon className="h-4 w-4" />
                Parent Streams ({hierarchy.parents.length})
              </h4>
              <div className="space-y-2">
                {hierarchy.parents.map((parent) => (
                  <TreeNode
                    key={parent.id}
                    stream={parent}
                    depth={0}
                    isParent={false}
                    onToggle={handleToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    onViewDetails={handleViewDetails}
                    showPermissions={includePermissions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Current Stream */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4" />
              Current Stream
            </h4>
            <TreeNode
              stream={hierarchy.stream}
              depth={0}
              isParent={true}
              onToggle={handleToggle}
              expanded={expanded}
              onCreateRelation={onCreateRelation}
              onEditRelation={onEditRelation}
              onViewDetails={handleViewDetails}
              showPermissions={includePermissions}
            />
          </div>

          {/* Children Section */}
          {direction !== 'up' && hierarchy.children.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ChevronDownIcon className="h-4 w-4" />
                Child Streams ({hierarchy.children.length})
              </h4>
              <div className="space-y-2">
                {hierarchy.children.map((child) => (
                  <TreeNode
                    key={child.id}
                    stream={child}
                    depth={0}
                    isParent={true}
                    onToggle={handleToggle}
                    expanded={expanded}
                    onCreateRelation={onCreateRelation}
                    onEditRelation={onEditRelation}
                    onViewDetails={handleViewDetails}
                    showPermissions={includePermissions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {hierarchy.totalRelations === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ShareIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No hierarchy relations</h4>
              <p className="text-gray-600 mb-4">This stream doesn't have any parent or child relationships.</p>
              <button
                onClick={() => onCreateRelation?.(streamId)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create First Relation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}