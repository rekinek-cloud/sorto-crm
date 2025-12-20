import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AIProvider } from '@/lib/api/aiConfig';

interface AIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: Omit<AIProvider, 'id' | 'createdAt' | 'updatedAt'>) => void;
  provider?: AIProvider | null;
}

export default function AIProviderModal({ isOpen, onClose, onSave, provider }: AIProviderModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    authType: 'api-key' as 'api-key' | 'oauth' | 'custom',
    enabled: true,
    configSchema: {} as Record<string, any>,
    supportedModels: [] as string[],
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 10000,
    },
  });

  const [newModel, setNewModel] = useState('');
  const [configJson, setConfigJson] = useState('{}');

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        description: provider.description || '',
        apiEndpoint: provider.apiEndpoint || '',
        apiKey: (provider.configSchema as any)?.apiKey || '',
        authType: provider.authType || 'api-key',
        enabled: provider.enabled !== undefined ? provider.enabled : true,
        configSchema: provider.configSchema || {},
        supportedModels: provider.supportedModels || [],
        rateLimit: provider.rateLimit || { requestsPerMinute: 60, tokensPerMinute: 10000 },
      });
      setConfigJson(JSON.stringify(provider.configSchema || {}, null, 2));
    } else {
      setFormData({
        name: '',
        description: '',
        apiEndpoint: '',
        apiKey: '',
        authType: 'api-key',
        enabled: true,
        configSchema: {},
        supportedModels: [],
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 10000,
        },
      });
      setConfigJson('{}');
    }
  }, [provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedConfig = JSON.parse(configJson);
      
      // Dodaj klucz API do konfiguracji
      if (formData.apiKey && formData.authType === 'api-key') {
        parsedConfig.apiKey = formData.apiKey;
      }
      
      // Usuń apiKey z formData - zostanie dodany do configSchema
      const { apiKey, ...providerData } = formData;
      
      onSave({
        ...providerData,
        configSchema: parsedConfig,
      });
    } catch (error: any) {
      alert('Nieprawidłowy format JSON w konfiguracji');
    }
  };

  const addModel = () => {
    if (newModel && !(formData.supportedModels || []).includes(newModel)) {
      setFormData({
        ...formData,
        supportedModels: [...(formData.supportedModels || []), newModel],
      });
      setNewModel('');
    }
  };

  const removeModel = (model: string) => {
    setFormData({
      ...formData,
      supportedModels: (formData.supportedModels || []).filter((m) => m !== model),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {provider ? 'Edytuj providera AI' : 'Dodaj nowego providera AI'}
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
                Nazwa providera *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="np. OpenAI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ autoryzacji *
              </label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="api-key">Klucz API</option>
                <option value="oauth">OAuth</option>
                <option value="custom">Niestandardowy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint API *
            </label>
            <input
              type="url"
              required
              value={formData.apiEndpoint}
              onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Klucz API *
            </label>
            <input
              type="password"
              required={formData.authType === 'api-key'}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Klucz API zostanie bezpiecznie zaszyfrowany
            </p>
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
              placeholder="Opisz tego providera..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obsługiwane modele
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.supportedModels || []).map((model) => (
                <span
                  key={model}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded flex items-center space-x-1"
                >
                  <span>{model}</span>
                  <button
                    type="button"
                    onClick={() => removeModel(model)}
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
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Dodaj model"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addModel();
                  }
                }}
              />
              <button
                type="button"
                onClick={addModel}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Dodaj
              </button>
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
              Schemat konfiguracji (JSON)
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder='{\n  "apiKey": "string",\n  "organization": "string"\n}'
            />
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
              Provider aktywny
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
              {provider ? 'Zapisz zmiany' : 'Dodaj providera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}