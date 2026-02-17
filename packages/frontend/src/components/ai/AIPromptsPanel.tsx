'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  FlaskConical,
  Clock,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Search,
} from 'lucide-react';

// Types
interface AIPrompt {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  version: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isSystem: boolean;
  systemPrompt: string | null;
  userPromptTemplate: string;
  variables: Record<string, any>;
  defaultModel: string | null;
  defaultTemperature: number;
  maxTokens: number;
  outputSchema: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptVersion {
  id: string;
  version: number;
  systemPrompt: string | null;
  userPromptTemplate: string;
  variables: Record<string, any>;
  changeReason: string | null;
  createdAt: string;
  changedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CompiledPrompt {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Category labels
const categoryLabels: Record<string, string> = {
  SOURCE: 'Zrodlo',
  STREAM: 'Strumienie',
  TASK: 'Zadania',
  REVIEW: 'Przeglady',
  CRM: 'CRM',
  DAY_PLANNER: 'Day Planner',
  GOALS: 'Cele',
  SYSTEM: 'System',
  UNIVERSAL: 'Uniwersalne',
  EMAIL: 'Email',
};

// Status badges
const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktywny',
  INACTIVE: 'Nieaktywny',
  ARCHIVED: 'Zarchiwizowany',
};

export function AIPromptsPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const searchParams = useSearchParams();

  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Test state
  const [testingPrompt, setTestingPrompt] = useState<AIPrompt | null>(null);
  const [testData, setTestData] = useState<string>('{}');
  const [testResult, setTestResult] = useState<CompiledPrompt | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Versions state
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Filters — initialize search from URL param (e.g. ?search=EMAIL_POST_BUSINESS)
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams?.get('search') || '');

  // Categories
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadPrompts();
      loadCategories();
    }
  }, [isAdmin, categoryFilter]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('status', 'ACTIVE');

      const response = await apiClient.get(`/ai/prompts?${params.toString()}`);
      setPrompts(response.data.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load prompts:', err);
      setError('Nie udalo sie zaladowac promptow');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/ai/prompts/meta/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadPromptDetails = async (code: string): Promise<AIPrompt | null> => {
    try {
      const response = await apiClient.get(`/ai/prompts/${code}`);
      return response.data.data;
    } catch (err) {
      console.error('Failed to load prompt details:', err);
      return null;
    }
  };

  const loadVersions = async (code: string) => {
    try {
      setVersionsLoading(true);
      const response = await apiClient.get(`/ai/prompts/${code}/versions`);
      setVersions(response.data.data || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleEdit = async (prompt: AIPrompt) => {
    const details = await loadPromptDetails(prompt.code);
    if (details) {
      setEditingPrompt(details);
      setIsCreating(false);
    }
  };

  const handleCreate = () => {
    setEditingPrompt({
      id: '',
      code: '',
      name: '',
      description: '',
      category: 'UNIVERSAL',
      version: 1,
      status: 'ACTIVE',
      isSystem: false,
      systemPrompt: '',
      userPromptTemplate: '',
      variables: {},
      defaultModel: 'gpt-4o-mini',
      defaultTemperature: 0.3,
      maxTokens: 1000,
      outputSchema: null,
      createdAt: '',
      updatedAt: '',
    });
    setIsCreating(true);
  };

  const handleSave = async (promptData: Partial<AIPrompt>) => {
    try {
      if (isCreating) {
        await apiClient.post('/ai/prompts', promptData);
      } else if (editingPrompt) {
        await apiClient.put(`/ai/prompts/${editingPrompt.code}`, promptData);
      }
      setEditingPrompt(null);
      setIsCreating(false);
      loadPrompts();
    } catch (err: any) {
      console.error('Failed to save prompt:', err);
      alert(err.response?.data?.message || 'Nie udalo sie zapisac prompta');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Czy na pewno chcesz zarchiwizowac ten prompt?')) return;

    try {
      await apiClient.delete(`/ai/prompts/${code}`);
      loadPrompts();
    } catch (err: any) {
      console.error('Failed to delete prompt:', err);
      alert(err.response?.data?.message || 'Nie udalo sie usunac prompta');
    }
  };

  const handleTest = async (prompt: AIPrompt) => {
    const details = await loadPromptDetails(prompt.code);
    if (details) {
      setTestingPrompt(details);
      const initialData: Record<string, string> = {};
      if (details.variables) {
        Object.keys(details.variables).forEach((key) => {
          initialData[key] = `[${key}]`;
        });
      }
      setTestData(JSON.stringify(initialData, null, 2));
      setTestResult(null);
    }
  };

  const runTest = async () => {
    if (!testingPrompt) return;

    try {
      setTestLoading(true);
      let parsedData = {};
      try {
        parsedData = JSON.parse(testData);
      } catch {
        alert('Niepoprawny format JSON');
        return;
      }

      const response = await apiClient.post(`/ai/prompts/${testingPrompt.code}/test`, {
        testData: parsedData,
      });
      setTestResult(response.data.data);
    } catch (err: any) {
      console.error('Test failed:', err);
      alert(err.response?.data?.message || 'Test nie powiodl sie');
    } finally {
      setTestLoading(false);
    }
  };

  const toggleVersions = async (code: string) => {
    if (showVersions === code) {
      setShowVersions(null);
    } else {
      setShowVersions(code);
      await loadVersions(code);
    }
  };

  const restoreVersion = async (code: string, version: number) => {
    if (!confirm(`Czy na pewno chcesz przywrocic wersje ${version}?`)) return;

    try {
      await apiClient.post(`/ai/prompts/${code}/restore/${version}`);
      loadPrompts();
      loadVersions(code);
    } catch (err: any) {
      console.error('Failed to restore version:', err);
      alert(err.response?.data?.message || 'Nie udalo sie przywrocic wersji');
    }
  };

  // Filter prompts by search
  const filteredPrompts = prompts.filter(p =>
    searchQuery === '' ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-3" />
          <p className="text-gray-600">Brak uprawnien do zarzadzania promptami.</p>
          <p className="text-sm text-gray-500 mt-1">Wymagana rola ADMIN lub OWNER.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-3">Ladowanie promptow...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-purple-600" />
            Szablony Promptow AI
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Zarzadzaj promptami uzywanymi przez system AI
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nowy Prompt
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj promptow..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat] || cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Prompts List */}
      <div className="space-y-3">
        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Brak promptow do wyswietlenia</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900">{prompt.name}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {prompt.code}
                      </code>
                      {prompt.isSystem && (
                        <Badge variant="secondary" className="text-xs">System</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {prompt.description || 'Brak opisu'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full ${statusStyles[prompt.status]}`}>
                        {statusLabels[prompt.status]}
                      </span>
                      {prompt.category && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                          {categoryLabels[prompt.category] || prompt.category}
                        </span>
                      )}
                      <span>v{prompt.version}</span>
                      <span>{prompt.defaultModel || 'gpt-4o-mini'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(prompt)}
                      title="Testuj"
                    >
                      <FlaskConical className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVersions(prompt.code)}
                      title="Historia wersji"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!prompt.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prompt.code)}
                        title="Archiwizuj"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVersions(prompt.code)}
                    >
                      {showVersions === prompt.code ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Versions Panel */}
                {showVersions === prompt.code && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Historia wersji</h4>
                    {versionsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto"></div>
                      </div>
                    ) : versions.length === 0 ? (
                      <p className="text-sm text-gray-500">Brak zapisanych wersji</p>
                    ) : (
                      <div className="space-y-2">
                        {versions.slice(0, 5).map((ver) => (
                          <div
                            key={ver.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                          >
                            <div>
                              <span className="font-medium">v{ver.version}</span>
                              <span className="text-gray-500 ml-2">
                                {new Date(ver.createdAt).toLocaleDateString()}
                              </span>
                              {ver.changedBy && (
                                <span className="text-gray-400 ml-2">
                                  {ver.changedBy.firstName}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => restoreVersion(prompt.code, ver.version)}
                              className="text-purple-600"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Przywroc
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editingPrompt && (
        <PromptEditorModal
          prompt={editingPrompt}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setEditingPrompt(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* Test Modal */}
      {testingPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Test: {testingPrompt.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setTestingPrompt(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dane testowe (JSON)
                  </label>
                  <textarea
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                    className="w-full h-48 font-mono text-sm border border-gray-300 rounded-lg p-3"
                    placeholder='{"context": "..."}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Zmienne: {Object.keys(testingPrompt.variables || {}).join(', ') || 'brak'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wynik kompilacji
                  </label>
                  {testResult ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500">System:</span>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-20">
                          {testResult.systemPrompt?.slice(0, 200) || '(brak)'}...
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">User:</span>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                          {testResult.userPrompt}
                        </pre>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>Model: {testResult.model}</span>
                        <span>Temp: {testResult.temperature}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                      Kliknij "Testuj"
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTestingPrompt(null)}>
                Zamknij
              </Button>
              <Button onClick={runTest} disabled={testLoading}>
                {testLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FlaskConical className="h-4 w-4 mr-2" />
                )}
                Testuj
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Prompt Editor Modal Component
interface V2Model {
  id: string;
  name: string;
  displayName: string;
  status: string;
  ai_providers: { name: string };
}

function PromptEditorModal({
  prompt,
  isCreating,
  onSave,
  onClose,
}: {
  prompt: AIPrompt;
  isCreating: boolean;
  onSave: (data: Partial<AIPrompt>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    code: prompt.code,
    name: prompt.name,
    description: prompt.description || '',
    category: prompt.category || 'UNIVERSAL',
    systemPrompt: prompt.systemPrompt || '',
    userPromptTemplate: prompt.userPromptTemplate || '',
    variables: JSON.stringify(prompt.variables || {}, null, 2),
    defaultModel: prompt.defaultModel || 'gpt-4o-mini',
    defaultTemperature: prompt.defaultTemperature,
    maxTokens: prompt.maxTokens,
    status: prompt.status,
  });

  const [saving, setSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState<V2Model[]>([]);

  useEffect(() => {
    apiClient.get('/ai-v2/models').then((res) => {
      const models = (res.data?.models || []).filter((m: V2Model) => m.status === 'ACTIVE');
      setAvailableModels(models);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let variables = {};
      try {
        variables = JSON.parse(formData.variables);
      } catch {
        alert('Niepoprawny format JSON dla zmiennych');
        setSaving(false);
        return;
      }

      const data: Partial<AIPrompt> = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        systemPrompt: formData.systemPrompt || null,
        userPromptTemplate: formData.userPromptTemplate,
        variables,
        defaultModel: formData.defaultModel,
        defaultTemperature: formData.defaultTemperature,
        maxTokens: formData.maxTokens,
        status: formData.status,
      };

      if (isCreating) {
        (data as any).code = formData.code;
      }

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {isCreating ? 'Nowy Prompt' : `Edycja: ${prompt.name}`}
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kod *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!isCreating}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono disabled:bg-gray-100"
                  placeholder="NAZWA_PROMPTA"
                  required
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="SOURCE">Zrodlo</option>
                  <option value="STREAM">Strumienie</option>
                  <option value="TASK">Zadania</option>
                  <option value="REVIEW">Przeglady</option>
                  <option value="GOALS">Cele</option>
                  <option value="CRM">CRM</option>
                  <option value="UNIVERSAL">Uniwersalne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={formData.defaultModel}
                  onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {availableModels.length > 0 ? (
                    Object.entries(
                      availableModels.reduce<Record<string, V2Model[]>>((acc, m) => {
                        const provider = m.ai_providers?.name || 'Other';
                        if (!acc[provider]) acc[provider] = [];
                        acc[provider].push(m);
                        return acc;
                      }, {})
                    ).map(([provider, models]) => (
                      <optgroup key={provider} label={provider}>
                        {models.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.displayName}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    <option value={formData.defaultModel}>{formData.defaultModel}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp</label>
                <input
                  type="number"
                  value={formData.defaultTemperature}
                  onChange={(e) => setFormData({ ...formData, defaultTemperature: parseFloat(e.target.value) })}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  min="1"
                  max="100000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                placeholder="Instrukcje systemowe..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt Template *</label>
              <textarea
                value={formData.userPromptTemplate}
                onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                placeholder="Szablon z {{zmiennymi}}..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Handlebars: {'{{zmienna}}'}, {'{{#if}}...{{/if}}'}, {'{{#each}}...{{/each}}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zmienne (JSON)</label>
              <textarea
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isCreating ? 'Utworz' : 'Zapisz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIPromptsPanel;
