'use client';

import React, { useState } from 'react';
import { usePipelineStages } from '@/lib/contexts/PipelineStageContext';
import { pipelineStagesApi, PipelineStage, CreatePipelineStageRequest } from '@/lib/api/pipelineStages';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, ArrowUpDown, Check, X, SlidersHorizontal } from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface StageFormData {
  name: string;
  slug: string;
  probability: number;
  color: string;
  isClosed: boolean;
  isWon: boolean;
}

const DEFAULT_COLORS = [
  '#6B7280', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#10B981', '#EF4444', '#EC4899', '#14B8A6',
  '#F97316', '#06B6D4',
];

export default function PipelineSettingsPage() {
  const { stages, refetch } = usePipelineStages();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StageFormData>({
    name: '',
    slug: '',
    probability: 0,
    color: '#6B7280',
    isClosed: false,
    isWon: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      probability: 0,
      color: '#6B7280',
      isClosed: false,
      isWon: false,
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (stage: PipelineStage) => {
    setFormData({
      name: stage.name,
      slug: stage.slug,
      probability: stage.probability,
      color: stage.color,
      isClosed: stage.isClosed,
      isWon: stage.isWon,
    });
    setEditingId(stage.id);
    setIsCreating(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await pipelineStagesApi.createStage({
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        probability: formData.probability,
        color: formData.color,
        isClosed: formData.isClosed,
        isWon: formData.isWon,
      });
      toast.success('Stage created');
      resetForm();
      await refetch();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to create stage';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await pipelineStagesApi.updateStage(editingId, {
        name: formData.name.trim(),
        probability: formData.probability,
        color: formData.color,
        isClosed: formData.isClosed,
        isWon: formData.isWon,
      });
      toast.success('Stage updated');
      resetForm();
      await refetch();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to update stage';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stage: PipelineStage) => {
    if ((stage._count?.deals || 0) > 0) {
      toast.error(`Cannot delete "${stage.name}" - it has ${stage._count?.deals} deals`);
      return;
    }

    if (!confirm(`Delete stage "${stage.name}"? This cannot be undone.`)) return;

    try {
      await pipelineStagesApi.deleteStage(stage.id);
      toast.success('Stage deleted');
      if (editingId === stage.id) resetForm();
      await refetch();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to delete stage';
      toast.error(msg);
    }
  };

  const isEditing = editingId !== null || isCreating;

  return (
    <PageShell>
      <PageHeader
        title="Pipeline Stages"
        subtitle="Configure your sales pipeline stages and probabilities"
        icon={SlidersHorizontal}
        iconColor="text-blue-600"
        breadcrumbs={[{ label: 'Settings', href: '/dashboard/settings' }, { label: 'Pipeline' }]}
        actions={
          !isEditing ? (
            <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-5 h-5" />
              Add Stage
            </button>
          ) : undefined
        }
      />

      {/* Create / Edit Form */}
      {isEditing && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {isCreating ? 'New Stage' : 'Edit Stage'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="e.g. Qualified"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                placeholder="auto-generated"
                disabled={!!editingId}
              />
            </div>

            {/* Probability */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Probability (%) - {formData.probability}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <div className="flex gap-1 flex-wrap">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-slate-900 dark:border-slate-100 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="col-span-full flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isClosed}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isClosed: e.target.checked,
                    isWon: e.target.checked ? prev.isWon : false,
                    probability: e.target.checked ? (prev.isWon ? 100 : 0) : prev.probability,
                  }))}
                  className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Closed stage (deal is finished)</span>
              </label>
              {formData.isClosed && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isWon}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isWon: e.target.checked,
                      probability: e.target.checked ? 100 : 0,
                    }))}
                    className="rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Won (counts as revenue)</span>
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={resetForm} className="flex items-center gap-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={isCreating ? handleCreate : handleUpdate}
              disabled={isSubmitting || !formData.name.trim()}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isCreating ? 'Create Stage' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Stages List */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Stage</div>
            <div className="col-span-2">Probability</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Deals</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                editingId === stage.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Position */}
                <div className="col-span-1">
                  <span className="text-sm text-slate-400 dark:text-slate-500">{index + 1}</span>
                </div>

                {/* Name + Color */}
                <div className="col-span-3 flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{stage.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{stage.slug}</span>
                  </div>
                </div>

                {/* Probability */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${stage.probability}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{stage.probability}%</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  {stage.isClosed ? (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stage.isWon
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {stage.isWon ? 'Won' : 'Lost'}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      Open
                    </span>
                  )}
                </div>

                {/* Deals count */}
                <div className="col-span-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{stage._count?.deals || 0}</span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => startEdit(stage)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                    title="Edit stage"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(stage)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="Delete stage"
                    disabled={(stage._count?.deals || 0) > 0}
                  >
                    <Trash2 className={`w-4 h-4 ${(stage._count?.deals || 0) > 0 ? 'opacity-30' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No pipeline stages configured</p>
            <button onClick={startCreate} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
              Create First Stage
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-2xl">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Pipeline stages define the steps in your sales process.
          Each stage has a probability that represents the likelihood of winning a deal at that point.
          You need at least one &quot;Won&quot; and one &quot;Lost&quot; stage for proper deal tracking.
        </p>
      </div>
    </PageShell>
  );
}
