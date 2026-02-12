'use client';

import React, { useState, useEffect } from 'react';
import { streamHierarchyApi, CreateStreamRelationRequest, StreamRelation } from '@/lib/api/streamHierarchy';
import { streamsApi } from '@/lib/api/streams';
import { Stream } from '@/types/gtd';
import { toast } from 'react-hot-toast';
import {
  X,
  Search,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface CreateStreamRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreamId: string;
  currentStreamName: string;
  onSuccess?: (relation: StreamRelation) => void;
}

interface SelectedPermission {
  dataScope: 'BASIC_INFO' | 'TASKS' | 'PROJECTS' | 'FINANCIAL' | 'METRICS' | 'COMMUNICATION' | 'PERMISSIONS' | 'CONFIGURATION' | 'AUDIT_LOGS';
  action: 'read' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE' | 'APPROVE' | 'AUDIT';
  granted: boolean;
}

const RELATION_TYPES = [
  {
    value: 'OWNS' as const,
    label: 'Owns',
    description: 'Full ownership - complete access and control',
    icon: '👑',
    color: 'text-red-600'
  },
  {
    value: 'MANAGES' as const,
    label: 'Manages',
    description: 'Management access - operational control',
    icon: '⚡',
    color: 'text-blue-600'
  },
  {
    value: 'BELONGS_TO' as const,
    label: 'Belongs To',
    description: 'Membership - limited access based on role',
    icon: '🏠',
    color: 'text-green-600'
  },
  {
    value: 'RELATED_TO' as const,
    label: 'Related To',
    description: 'Association - basic collaborative access',
    icon: '🔗',
    color: 'text-purple-600'
  },
  {
    value: 'DEPENDS_ON' as const,
    label: 'Depends On',
    description: 'Dependency - access to required data only',
    icon: '⚡',
    color: 'text-orange-600'
  },
  {
    value: 'SUPPORTS' as const,
    label: 'Supports',
    description: 'Support role - assistance and monitoring access',
    icon: '🤝',
    color: 'text-cyan-600'
  }
];

const INHERITANCE_RULES = [
  {
    value: 'INHERIT_DOWN' as const,
    label: 'Inherit Down',
    description: 'Permissions flow from parent to child'
  },
  {
    value: 'NO_INHERITANCE' as const,
    label: 'No Inheritance',
    description: 'No automatic permission inheritance'
  },
  {
    value: 'INHERIT_UP' as const,
    label: 'Inherit Up',
    description: 'Permissions flow from child to parent'
  },
  {
    value: 'INHERIT_BIDIRECTIONAL' as const,
    label: 'Bidirectional',
    description: 'Permissions flow in both directions'
  }
];

const DATA_SCOPES = [
  'BASIC_INFO', 'TASKS', 'PROJECTS', 'FINANCIAL', 'METRICS', 
  'COMMUNICATION', 'PERMISSIONS', 'CONFIGURATION', 'AUDIT_LOGS'
];

const ACTIONS = ['read', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'APPROVE', 'AUDIT'];

export default function CreateStreamRelationModal({
  isOpen,
  onClose,
  currentStreamId,
  currentStreamName,
  onSuccess
}: CreateStreamRelationModalProps) {
  const [loading, setLoading] = useState(false);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [relationType, setRelationType] = useState<CreateStreamRelationRequest['relationType']>('RELATED_TO');
  const [relationDirection, setRelationDirection] = useState<'parent' | 'child'>('parent');
  const [description, setDescription] = useState('');
  const [inheritanceRule, setInheritanceRule] = useState<'NO_INHERITANCE' | 'INHERIT_DOWN' | 'INHERIT_UP' | 'INHERIT_BIDIRECTIONAL'>('INHERIT_DOWN');
  const [permissions, setPermissions] = useState<SelectedPermission[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationResult, setValidationResult] = useState<{ wouldCreateCycle: boolean; isValid: boolean } | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStreams();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedStream) {
      validateRelation();
    }
  }, [selectedStream, relationDirection]);

  const loadStreams = async () => {
    try {
      const response = await streamsApi.getStreams({ 
        status: 'ACTIVE',
        limit: 100 
      });
      // Filter out current stream
      setStreams(response.streams.filter(s => s.id !== currentStreamId));
    } catch (error: any) {
      console.error('Error loading streams:', error);
      toast.error('Failed to load streams');
    }
  };

  const validateRelation = async () => {
    if (!selectedStream) return;

    try {
      setValidating(true);
      const result = await streamHierarchyApi.validateCycle(
        relationDirection === 'parent' ? selectedStream.id : currentStreamId,
        relationDirection === 'parent' ? currentStreamId : selectedStream.id
      );
      setValidationResult(result);
    } catch (error: any) {
      console.error('Error validating relation:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStream) {
      toast.error('Please select a stream');
      return;
    }

    if (validationResult && validationResult.wouldCreateCycle) {
      toast.error('This relation would create a cycle in the hierarchy');
      return;
    }

    try {
      setLoading(true);

      const relationData: CreateStreamRelationRequest = {
        parentId: relationDirection === 'parent' ? selectedStream.id : currentStreamId,
        childId: relationDirection === 'parent' ? currentStreamId : selectedStream.id,
        relationType,
        description: description || undefined,
        inheritanceRule,
        permissions: permissions.length > 0 ? permissions : undefined
      };

      const relation = await streamHierarchyApi.createRelation(currentStreamId, relationData);
      
      toast.success(`Relation created: ${selectedStream.name} ${relationType.toLowerCase()} ${currentStreamName}`);
      onSuccess?.(relation);
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating relation:', error);
      toast.error(error.response?.data?.message || 'Failed to create relation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStream(null);
    setRelationType('RELATED_TO');
    setRelationDirection('parent');
    setDescription('');
    setInheritanceRule('INHERIT_DOWN');
    setPermissions([]);
    setShowAdvanced(false);
    setSearchTerm('');
    setValidationResult(null);
  };

  const addPermission = () => {
    setPermissions([...permissions, {
      dataScope: 'BASIC_INFO',
      action: 'read',
      granted: true
    }]);
  };

  const updatePermission = (index: number, field: keyof SelectedPermission, value: any) => {
    const updated = [...permissions];
    updated[index] = { ...updated[index], [field]: value };
    setPermissions(updated);
  };

  const removePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const filteredStreams = streams.filter(stream => 
    stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Stream Relation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Current Stream Info */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-900 mb-1">Current Stream</h3>
              <p className="text-indigo-700">{currentStreamName}</p>
            </div>

            {/* Relation Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation Direction
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="parent"
                    checked={relationDirection === 'parent'}
                    onChange={(e) => setRelationDirection(e.target.value as 'parent')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Add Parent</div>
                    <div className="text-sm text-gray-600">Selected stream will be parent of current stream</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="child"
                    checked={relationDirection === 'child'}
                    onChange={(e) => setRelationDirection(e.target.value as 'child')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Add Child</div>
                    <div className="text-sm text-gray-600">Selected stream will be child of current stream</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Stream Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Stream
              </label>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search streams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Stream List */}
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {filteredStreams.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No streams found
                  </div>
                ) : (
                  filteredStreams.map((stream) => (
                    <label 
                      key={stream.id}
                      className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedStream?.id === stream.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        value={stream.id}
                        checked={selectedStream?.id === stream.id}
                        onChange={() => setSelectedStream(stream)}
                        className="mr-3"
                      />
                      <div 
                        className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: stream.color }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{stream.name}</div>
                        {stream.description && (
                          <div className="text-sm text-gray-600 truncate">{stream.description}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{stream.status}</div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Validation Result */}
            {selectedStream && validationResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                validationResult.isValid 
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                  {validationResult.isValid 
                    ? 'Relation is valid - no cycles detected'
                    : 'Warning: This relation would create a cycle in the hierarchy'
                  }
                </span>
              </div>
            )}

            {validating && (
              <div className="text-center text-sm text-gray-500">
                Validating relation...
              </div>
            )}

            {/* Relation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RELATION_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      relationType === type.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      checked={relationType === type.value}
                      onChange={(e) => setRelationType(e.target.value as any)}
                      className="sr-only"
                    />
                    <span className="text-lg mr-3">{type.icon}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${type.color}`}>
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {type.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the nature of this relationship..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Info className="h-4 w-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                {/* Inheritance Rule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inheritance Rule
                  </label>
                  <select
                    value={inheritanceRule}
                    onChange={(e) => setInheritanceRule(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {INHERITANCE_RULES.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label} - {rule.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Custom Permissions
                    </label>
                    <button
                      type="button"
                      onClick={addPermission}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Permission
                    </button>
                  </div>
                  
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No custom permissions. Default permissions for {relationType} will be used.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                          <select
                            value={permission.action}
                            onChange={(e) => updatePermission(index, 'action', e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {ACTIONS.map(action => (
                              <option key={action} value={action}>{action}</option>
                            ))}
                          </select>
                          <span className="text-sm">on</span>
                          <select
                            value={permission.dataScope}
                            onChange={(e) => updatePermission(index, 'dataScope', e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {DATA_SCOPES.map(scope => (
                              <option key={scope} value={scope}>{scope}</option>
                            ))}
                          </select>
                          <select
                            value={permission.granted ? 'ALLOW' : 'DENY'}
                            onChange={(e) => updatePermission(index, 'granted', e.target.value === 'ALLOW')}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="ALLOW">Allow</option>
                            <option value="DENY">Deny</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removePermission(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStream || !!(validationResult && !validationResult.isValid)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Relation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}