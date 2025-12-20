'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

interface WikiPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  wikiPage?: any;
}

const WIKI_CATEGORIES = [
  { id: 'GETTING_STARTED', name: 'Getting Started', icon: '🚀', color: 'bg-green-50 border-green-200' },
  { id: 'USER_GUIDE', name: 'User Guide', icon: '📖', color: 'bg-blue-50 border-blue-200' },
  { id: 'API_DOCS', name: 'API Documentation', icon: '🔧', color: 'bg-purple-50 border-purple-200' },
  { id: 'TROUBLESHOOTING', name: 'Troubleshooting', icon: '🔍', color: 'bg-orange-50 border-orange-200' },
  { id: 'FAQ', name: 'FAQ', icon: '❓', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'COMPANY', name: 'Company Info', icon: '🏢', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'PRODUCT', name: 'Product Info', icon: '📦', color: 'bg-cyan-50 border-cyan-200' },
  { id: 'PROCESSES', name: 'Processes', icon: '⚙️', color: 'bg-red-50 border-red-200' }
] as const;

export default function WikiPageModal({ isOpen, onClose, onSuccess, mode = 'create', wikiPage }: WikiPageModalProps) {
  const [formData, setFormData] = useState({
    title: wikiPage?.title || '',
    slug: wikiPage?.slug || '',
    content: wikiPage?.content || '',
    category: wikiPage?.category || 'USER_GUIDE',
    summary: wikiPage?.summary || '',
    tags: wikiPage?.tags?.join(', ') || '',
    isPublic: wikiPage?.isPublic || false
  });
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: mode === 'create' ? generateSlug(title) : prev.slug // Only auto-generate for new pages
    }));
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

    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        slug: generateSlug(formData.slug), // Ensure slug is properly formatted
        tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
      };

      let response;
      if (mode === 'edit' && wikiPage?.id) {
        response = await apiClient.put(`/knowledge/wiki/${wikiPage.slug}`, payload);
      } else {
        response = await apiClient.post('/knowledge/wiki', payload);
      }

      toast.success(mode === 'edit' ? 'Wiki page updated successfully' : 'Wiki page created successfully');
      setFormData({
        title: '',
        slug: '',
        content: '',
        category: 'USER_GUIDE',
        summary: '',
        tags: '',
        isPublic: false
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving wiki page:', error);
      if (error.response?.data?.error?.includes('slug')) {
        toast.error('A page with this slug already exists. Please use a different title or slug.');
      } else {
        toast.error('Failed to save wiki page');
      }
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
              📚 {mode === 'edit' ? 'Edit Wiki Page' : 'Create New Wiki Page'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter page title..."
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="page-url-slug"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Will be accessible at: /wiki/{formData.slug || 'page-slug'}
                  </p>
                </div>
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
                  placeholder="Brief description of the wiki page..."
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {WIKI_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.category === category.id
                          ? category.color + ' ring-2 ring-blue-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content * <span className="text-xs text-gray-500">(Markdown supported)</span>
                </label>
                <textarea
                  id="content"
                  rows={12}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="# Page Title

## Section 1
Content here...

## Section 2
More content...

**Bold text**, *italic text*

- List item 1
- List item 2

[Link text](https://example.com)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use Markdown syntax for formatting. Headers will automatically appear in the table of contents.
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Public Access */}
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700">
                    Make publicly accessible (no login required)
                  </label>
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
                  {loading ? 'Saving...' : mode === 'edit' ? 'Update Wiki Page' : 'Create Wiki Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}