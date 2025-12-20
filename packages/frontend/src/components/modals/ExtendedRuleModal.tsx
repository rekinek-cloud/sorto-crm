import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { CommunicationRule, AIPromptTemplate, PromptVariable } from '@/types/communicationRules';

interface ExtendedRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<CommunicationRule, 'id' | 'metadata'>) => void;
  rule?: CommunicationRule | null;
  aiModels: { id: string; name: string }[];
}

export default function ExtendedRuleModal({ isOpen, onClose, onSave, rule, aiModels }: ExtendedRuleModalProps) {
  const [formData, setFormData] = useState<Omit<CommunicationRule, 'id' | 'metadata'>>({
    name: '',
    description: '',
    scope: 'module',
    target: ['communication'],
    enabled: true,
    priority: 0,
    conditions: [],
    actions: [],
    aiPrompts: [],
  });

  const [showPromptForm, setShowPromptForm] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<AIPromptTemplate>>({
    name: '',
    description: '',
    template: '',
    variables: [],
    modelPreferences: {
      temperature: 0.7,
      maxTokens: 2048,
    },
    category: '',
    tags: [],
  });

  const [newVariable, setNewVariable] = useState<Partial<PromptVariable>>({
    name: '',
    type: 'string',
    required: true,
    description: '',
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        scope: rule.scope,
        target: rule.target,
        enabled: rule.enabled,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
        aiPrompts: rule.aiPrompts || [],
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addPrompt = () => {
    if (currentPrompt.name && currentPrompt.template) {
      const newPrompt: AIPromptTemplate = {
        id: `prompt_${Date.now()}`,
        name: currentPrompt.name!,
        description: currentPrompt.description,
        template: currentPrompt.template!,
        variables: currentPrompt.variables || [],
        modelPreferences: currentPrompt.modelPreferences,
        examples: [],
        category: currentPrompt.category,
        tags: currentPrompt.tags,
      };

      setFormData({
        ...formData,
        aiPrompts: [...(formData.aiPrompts || []), newPrompt],
      });

      setCurrentPrompt({
        name: '',
        description: '',
        template: '',
        variables: [],
        modelPreferences: {
          temperature: 0.7,
          maxTokens: 2048,
        },
        category: '',
        tags: [],
      });
      setShowPromptForm(false);
    }
  };

  const addVariable = () => {
    if (newVariable.name) {
      const variable: PromptVariable = {
        name: newVariable.name,
        type: newVariable.type as any,
        required: newVariable.required!,
        description: newVariable.description,
      };

      setCurrentPrompt({
        ...currentPrompt,
        variables: [...(currentPrompt.variables || []), variable],
      });

      setNewVariable({
        name: '',
        type: 'string',
        required: true,
        description: '',
      });
    }
  };

  const removePrompt = (promptId: string) => {
    setFormData({
      ...formData,
      aiPrompts: formData.aiPrompts?.filter(p => p.id !== promptId) || [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {rule ? 'Edytuj regułę' : 'Dodaj nową regułę'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Podstawowe informacje</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa reguły *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorytet
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Scope and Target */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Zakres i cele</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zakres
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="global">Globalny</option>
                  <option value="module">Moduł</option>
                  <option value="component">Komponent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cele
                </label>
                <div className="space-y-2">
                  {['communication', 'tasks', 'projects', 'deals', 'contacts', 'ai-prompts', 'all'].map((target) => (
                    <label key={target} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.target.includes(target as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, target: [...formData.target, target as any] });
                          } else {
                            setFormData({ ...formData, target: formData.target.filter(t => t !== target) });
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{target}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Prompts */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">Prompty AI</h4>
              <Button
                type="button"
                onClick={() => setShowPromptForm(!showPromptForm)}
                variant="secondary"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Dodaj prompt
              </Button>
            </div>

            {showPromptForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Nowy prompt AI</h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa promptu
                    </label>
                    <input
                      type="text"
                      value={currentPrompt.name}
                      onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Szablon promptu
                    </label>
                    <textarea
                      value={currentPrompt.template}
                      onChange={(e) => setCurrentPrompt({ ...currentPrompt, template: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      placeholder="Użyj {nazwaZmiennej} dla zmiennych"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zmienne
                    </label>
                    <div className="space-y-2 mb-2">
                      {currentPrompt.variables?.map((variable, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="font-mono">{variable.name}</span>
                          <span className="text-gray-500">({variable.type})</span>
                          {variable.required && <span className="text-red-500">*</span>}
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newVariable.name}
                        onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                        placeholder="Nazwa zmiennej"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={newVariable.type}
                        onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value as any })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                      <button
                        type="button"
                        onClick={addVariable}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                      >
                        Dodaj
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferowany model
                      </label>
                      <select
                        value={currentPrompt.modelPreferences?.preferredModelId || ''}
                        onChange={(e) => setCurrentPrompt({
                          ...currentPrompt,
                          modelPreferences: {
                            ...currentPrompt.modelPreferences,
                            preferredModelId: e.target.value,
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Dowolny</option>
                        {aiModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={currentPrompt.modelPreferences?.temperature || 0.7}
                        onChange={(e) => setCurrentPrompt({
                          ...currentPrompt,
                          modelPreferences: {
                            ...currentPrompt.modelPreferences,
                            temperature: parseFloat(e.target.value),
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max tokenów
                      </label>
                      <input
                        type="number"
                        value={currentPrompt.modelPreferences?.maxTokens || 2048}
                        onChange={(e) => setCurrentPrompt({
                          ...currentPrompt,
                          modelPreferences: {
                            ...currentPrompt.modelPreferences,
                            maxTokens: parseInt(e.target.value),
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      onClick={() => setShowPromptForm(false)}
                      variant="outline"
                      size="sm"
                    >
                      Anuluj
                    </Button>
                    <Button
                      type="button"
                      onClick={addPrompt}
                      variant="default"
                      size="sm"
                    >
                      Dodaj prompt
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {formData.aiPrompts?.map((prompt) => (
                <div key={prompt.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">{prompt.name}</h5>
                      {prompt.description && (
                        <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Zmienne: {prompt.variables.length}</span>
                        {prompt.modelPreferences?.preferredModelId && (
                          <span>Model: {aiModels.find(m => m.id === prompt.modelPreferences?.preferredModelId)?.name}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrompt(prompt.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
              Reguła aktywna
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="default"
            >
              {rule ? 'Zapisz zmiany' : 'Dodaj regułę'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}