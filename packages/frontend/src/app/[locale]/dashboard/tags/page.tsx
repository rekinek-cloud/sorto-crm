'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Tag,
  Pencil,
  Trash2,
  Hash,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { tagsApi, type Tag as ApiTag } from '@/lib/api/tags';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface TagItem extends ApiTag {
  usageCount: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | undefined>();
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

  const handleEditTag = (tag: TagItem) => {
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
    <PageShell>
      <PageHeader
        title="Zarządzanie tagami"
        subtitle="Organizuj i kategoryzuj zadania za pomocą tagów"
        icon={Tag}
        iconColor="text-blue-600"
        actions={
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Utwórz tag
          </button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wszystkich tagów</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tags.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Hash className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Łączne użycia</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalUsage}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Najczęściej użyty</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {mostUsedTag ? mostUsedTag.usageCount : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Średnie użycia</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {tags.length > 0 ? Math.round(totalUsage / tags.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Tag className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Brak utworzonych tagów</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Utwórz tagi, aby organizować i kategoryzować swoje zadania.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Utwórz pierwszy tag
          </button>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Wszystkie tagi ({tags.length})</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedTags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  className="group relative p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all duration-200 bg-white/50 dark:bg-slate-800/50"
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
                        className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
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

                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Użyto {tag.usageCount} raz{tag.usageCount !== 1 ? 'y' : ''}
                  </div>

                  {/* Usage bar */}
                  <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                {editingTag ? 'Edytuj tag' : 'Utwórz nowy tag'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nazwa tagu
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="np. pilne, spotkanie, badania"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kolor
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: newTagColor }}
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-16 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {defaultColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded border-2 transition-all ${
                          newTagColor === color ? 'border-slate-900 dark:border-slate-100 scale-110' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Podgląd
                  </label>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: newTagColor }}
                  >
                    #{newTagName || 'nazwa-tagu'}
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
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!newTagName.trim()}
                >
                  {editingTag ? 'Zaktualizuj' : 'Utwórz'} tag
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}
