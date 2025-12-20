'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  document?: any;
}

const DOCUMENT_TYPES = [
  { id: 'NOTE', name: 'Note', icon: '📝', color: 'bg-blue-50 border-blue-200', description: 'Quick notes and memos' },
  { id: 'ARTICLE', name: 'Article', icon: '📄', color: 'bg-green-50 border-green-200', description: 'Detailed articles and guides' },
  { id: 'GUIDE', name: 'Guide', icon: '📋', color: 'bg-purple-50 border-purple-200', description: 'Step-by-step guides' },
  { id: 'TUTORIAL', name: 'Tutorial', icon: '🎓', color: 'bg-indigo-50 border-indigo-200', description: 'Learning materials' },
  { id: 'REFERENCE', name: 'Reference', icon: '📚', color: 'bg-cyan-50 border-cyan-200', description: 'Reference documentation' },
  { id: 'FAQ', name: 'FAQ', icon: '❓', color: 'bg-yellow-50 border-yellow-200', description: 'Frequently asked questions' },
  { id: 'POLICY', name: 'Policy', icon: '📜', color: 'bg-red-50 border-red-200', description: 'Company policies' },
  { id: 'PROCESS', name: 'Process', icon: '⚙️', color: 'bg-orange-50 border-orange-200', description: 'Business processes' },
  { id: 'TEMPLATE', name: 'Template', icon: '📋', color: 'bg-teal-50 border-teal-200', description: 'Document templates' },
  { id: 'REPORT', name: 'Report', icon: '📊', color: 'bg-pink-50 border-pink-200', description: 'Reports and analysis' }
] as const;

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', color: 'text-gray-600' },
  { value: 'REVIEW', label: 'Under Review', color: 'text-orange-600' },
  { value: 'PUBLISHED', label: 'Published', color: 'text-green-600' },
  { value: 'ARCHIVED', label: 'Archived', color: 'text-gray-500' }
];

export default function DocumentModal({ isOpen, onClose, onSuccess, mode = 'create', document }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    title: document?.title || '',
    summary: document?.summary || '',
    content: document?.content || '',
    type: document?.type || 'NOTE',
    status: document?.status || 'DRAFT',
    folderId: document?.folderId || '',
    tags: document?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);

  // Load folders on mount
  React.useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      const response = await apiClient.get('/knowledge/folders');
      setFolders(response.data.data || []);
    } catch (error: any) {
      console.error('Error loading folders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
      };

      let response;
      if (mode === 'edit' && document?.id) {
        response = await apiClient.put(`/knowledge/documents/${document.id}`, payload);
      } else {
        response = await apiClient.post('/knowledge/documents', payload);
      }

      toast.success(mode === 'edit' ? 'Document updated successfully' : 'Document created successfully');
      setFormData({
        title: '',
        summary: '',
        content: '',
        type: 'NOTE',
        status: 'DRAFT',
        folderId: '',
        tags: ''
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              📄 {mode === 'edit' ? 'Edit Document' : 'Create New Document'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter document title..."
                  required
                />
              </div>

              {/* Summary */}
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  Summary
                </label>
                <textarea
                  id="summary"
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief summary of the document..."
                />
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.type === type.id
                          ? type.color + ' ring-2 ring-blue-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="text-2xl mb-1">{type.icon}</span>
                        <span className="text-xs font-medium">{type.name}</span>
                        <span className="text-xs text-gray-500 mt-1">{type.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <textarea
                  id="content"
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Document content (supports Markdown)..."
                  required
                />
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folder */}
                <div>
                  <label htmlFor="folder" className="block text-sm font-medium text-gray-700">
                    Folder
                  </label>
                  <select
                    id="folder"
                    value={formData.folderId}
                    onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : mode === 'edit' ? 'Update Document' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}