import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AIModel } from '@/lib/api/aiConfig';

interface AIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  model?: AIModel | null;
  providers: { id: string; name: string }[];
}

export default function AIModelModal({ isOpen, onClose, onSave, model, providers }: AIModelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    description: '',
    modelId: '',
    contextSize: 4096,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 1,
    costPer1kTokens: 0,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 10000,
    },
    capabilities: [] as string[],
  });

  const [newCapability, setNewCapability] = useState('');

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        provider: model.provider,
        description: model.description || '',
        modelId: model.modelId,
        contextSize: model.contextSize,
        maxTokens: model.maxTokens,
        temperature: model.temperature,
        topP: model.topP,
        costPer1kTokens: model.costPer1kTokens,
        enabled: model.enabled,
        rateLimit: model.rateLimit || { requestsPerMinute: 60, tokensPerMinute: 10000 },
        capabilities: model.capabilities || [],
      });
    } else {
      setFormData({
        name: '',
        provider: '',
        description: '',
        modelId: '',
        contextSize: 4096,
        maxTokens: 2048,
        temperature: 0.7,
        topP: 1,
        costPer1kTokens: 0,
        enabled: true,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 10000,
        },
        capabilities: [],
      });
    }
  }, [model]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addCapability = () => {
    if (newCapability && !formData.capabilities.includes(newCapability)) {
      setFormData({
        ...formData,
        capabilities: [...formData.capabilities, newCapability],
      });
      setNewCapability('');
    }
  };

  const removeCapability = (capability: string) => {
    setFormData({
      ...formData,
      capabilities: formData.capabilities.filter((c) => c !== capability),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {model ? 'Edytuj model AI' : 'Dodaj nowy model AI'}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa modelu *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="np. GPT-4 Turbo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider *
              </label>
              <select
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wybierz providera</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID modelu *
            </label>
            <input
              type="text"
              required
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="np. gpt-4-turbo-preview"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Opisz zastosowanie tego modelu..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rozmiar kontekstu (tokeny)
              </label>
              <input
                type="number"
                value={formData.contextSize}
                onChange={(e) => setFormData({ ...formData, contextSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max tokenów odpowiedzi
              </label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top P
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.topP}
                onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koszt/1k tokenów ($)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.costPer1kTokens}
                onChange={(e) => setFormData({ ...formData, costPer1kTokens: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Limity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Zapytania/minutę
                </label>
                <input
                  type="number"
                  value={formData.rateLimit.requestsPerMinute}
                  onChange={(e) => setFormData({
                    ...formData,
                    rateLimit: { ...formData.rateLimit, requestsPerMinute: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Tokeny/minutę
                </label>
                <input
                  type="number"
                  value={formData.rateLimit.tokensPerMinute}
                  onChange={(e) => setFormData({
                    ...formData,
                    rateLimit: { ...formData.rateLimit, tokensPerMinute: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Możliwości
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded flex items-center space-x-1"
                >
                  <span>{cap}</span>
                  <button
                    type="button"
                    onClick={() => removeCapability(cap)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="Dodaj możliwość"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCapability();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCapability}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Dodaj
              </button>
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
              Model aktywny
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              {model ? 'Zapisz zmiany' : 'Dodaj model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}