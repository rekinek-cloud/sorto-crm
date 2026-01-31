'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { tagsApi, type Tag as ApiTag } from '@/lib/api/tags';

interface Tag extends ApiTag {
  usageCount: number; // Extended locally, not from API
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | undefined>();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  const defaultColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const { data } = await tagsApi.getTags();
      // API doesn't provide usageCount, so we set it to 0
      setTags(data.map(tag => ({ ...tag, usageCount: 0 })));
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast.error('Nie udało się pobrać tagów');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Nazwa tagu jest wymagana');
      return;
    }

    try {
      await tagsApi.createTag({
        name: newTagName.trim().toLowerCase(),
        color: newTagColor,
      });
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsFormOpen(false);
      toast.success('Tag utworzony pomyślnie');
      loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Nie udało się utworzyć tagu');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten tag?')) return;

    try {
      await tagsApi.deleteTag(id);
      toast.success('Tag usunięty pomyślnie');
      loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error('Nie udało się usunąć tagu');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setIsFormOpen(true);
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !newTagName.trim()) return;

    try {
      await tagsApi.updateTag(editingTag.id, {
        name: newTagName.trim().toLowerCase(),
        color: newTagColor,
      });
      setEditingTag(undefined);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsFormOpen(false);
      toast.success('Tag zaktualizowany pomyślnie');
      loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast.error('Nie udało się zaktualizować tagu');
    }
  };

  const sortedTags = [...tags].sort((a, b) => b.usageCount - a.usageCount);
  const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const mostUsedTag = tags.reduce((max, tag) => tag.usageCount > max.usageCount ? tag : max, tags[0]);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags Management</h1>
          <p className="text-gray-600">Organize and categorize your tasks with tags</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Tag
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tags</p>
              <p className="text-2xl font-semibold text-gray-900">{tags.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HashtagIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUsage}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <div className="w-6 h-6 text-purple-600">🏆</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Most Used</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mostUsedTag ? mostUsedTag.usageCount : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <div className="w-6 h-6 text-yellow-600">📊</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tags.length > 0 ? Math.round(totalUsage / tags.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tags Created</h3>
          <p className="text-gray-600 mb-6">
            Create tags to organize and categorize your tasks for better management.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create First Tag
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Tags ({tags.length})</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedTags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  className="group relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Used {tag.usageCount} time{tag.usageCount !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Usage bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{ 
                        backgroundColor: tag.color,
                        width: `${mostUsedTag ? (tag.usageCount / mostUsedTag.usageCount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., urgent, meeting, research"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: newTagColor }}
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {defaultColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded border-2 transition-all ${
                          newTagColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: newTagColor }}
                  >
                    #{newTagName || 'tag-name'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingTag(undefined);
                    setNewTagName('');
                    setNewTagColor('#3B82F6');
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                  className="btn btn-primary flex-1"
                  disabled={!newTagName.trim()}
                >
                  {editingTag ? 'Update' : 'Create'} Tag
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}