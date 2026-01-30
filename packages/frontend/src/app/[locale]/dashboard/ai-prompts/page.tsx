'use client';

import React, { useState, useEffect } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  BeakerIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  XMarkIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { aiPromptsApi, AIPrompt, CreatePromptData, UpdatePromptData } from '@/lib/api/aiPrompts';

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [formData, setFormData] = useState<CreatePromptData>({
    code: '',
    name: '',
    description: '',
    category: '',
    systemPrompt: '',
    userPromptTemplate: '',
    defaultModel: 'gpt-4o-mini',
    defaultTemperature: 0.3,
    maxTokens: 1000,
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promptsRes, categoriesRes] = await Promise.all([
        aiPromptsApi.getPrompts({ category: selectedCategory || undefined }),
        aiPromptsApi.getCategories(),
      ]);
      setPrompts(promptsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      toast.error('Nie udalo sie zaladowac promptow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.code || !formData.name || !formData.userPromptTemplate) {
        toast.error('Wypelnij wymagane pola');
        return;
      }
      await aiPromptsApi.createPrompt(formData);
      toast.success('Prompt utworzony');
      setIsCreating(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Blad tworzenia promptu');
    }
  };

  const handleUpdate = async () => {
    if (!selectedPrompt) return;
    try {
      await aiPromptsApi.updatePrompt(selectedPrompt.code, formData as UpdatePromptData);
      toast.success('Prompt zaktualizowany');
      setIsEditing(false);
      setSelectedPrompt(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Blad aktualizacji');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Czy na pewno chcesz usunac ten prompt?')) return;
    try {
      await aiPromptsApi.deletePrompt(code);
      toast.success('Prompt zarchiwizowany');
      loadData();
    } catch (error) {
      toast.error('Blad usuwania');
    }
  };

  const handleTest = async () => {
    if (!selectedPrompt) return;
    try {
      setIsTesting(true);
      const result = await aiPromptsApi.testPrompt(selectedPrompt.code, {
        testData: { name: 'Test', email: 'test@example.com' },
      });
      setTestResult(result.data);
    } catch (error) {
      toast.error('Blad testowania');
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: '',
      systemPrompt: '',
      userPromptTemplate: '',
      defaultModel: 'gpt-4o-mini',
      defaultTemperature: 0.3,
      maxTokens: 1000,
    });
  };

  const openEditModal = (prompt: AIPrompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      code: prompt.code,
      name: prompt.name,
      description: prompt.description || '',
      category: prompt.category || '',
      systemPrompt: prompt.systemPrompt || '',
      userPromptTemplate: prompt.userPromptTemplate,
      defaultModel: prompt.defaultModel,
      defaultTemperature: prompt.defaultTemperature,
      maxTokens: prompt.maxTokens,
    });
    setIsEditing(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prompty AI</h1>
            <p className="text-sm text-gray-600">Zarzadzaj szablonami promptow AI</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Nowy prompt
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Wszystkie
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ChatBubbleBottomCenterTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak promptow</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                    {prompt.isSystem && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                  <code className="text-xs text-gray-500">{prompt.code}</code>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(prompt)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!prompt.isSystem && (
                    <button
                      onClick={() => handleDelete(prompt.code)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {prompt.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{prompt.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                {prompt.category && (
                  <span className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    {prompt.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CodeBracketIcon className="h-3 w-3" />
                  {prompt.defaultModel}
                </span>
                <span>v{prompt.version}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isCreating ? 'Nowy prompt' : 'Edytuj prompt'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedPrompt(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kod *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    disabled={isEditing}
                    placeholder="NAZWA_PROMPTU"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <select
                    value={formData.defaultModel}
                    onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.defaultTemperature}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultTemperature: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Prompt Template *
                </label>
                <textarea
                  value={formData.userPromptTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, userPromptTemplate: e.target.value })
                  }
                  rows={5}
                  placeholder="Uzyj {{zmienna}} dla zmiennych"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedPrompt(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Anuluj
              </button>
              <button
                onClick={isCreating ? handleCreate : handleUpdate}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {isCreating ? 'Utworz' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
