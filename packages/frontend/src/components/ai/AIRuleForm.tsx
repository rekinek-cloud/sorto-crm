'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { aiRulesApi, AIRule, CreateRuleRequest, RuleCondition, RuleAction, ModuleField } from '@/lib/api/aiRules';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Settings,
} from 'lucide-react';

interface AIRuleFormProps {
  rule?: AIRule;
  onSubmit: (rule: AIRule) => void;
  onCancel: () => void;
}

const modules = [
  { value: 'projects', label: 'Projekty', icon: '📁' },
  { value: 'tasks', label: 'Zadania', icon: '✅' },
  { value: 'deals', label: 'Deale', icon: '💰' },
  { value: 'contacts', label: 'Kontakty', icon: '👤' },
  { value: 'communication', label: 'Komunikacja', icon: '📧' },
];

const operators = [
  { value: 'equals', label: 'Równa się' },
  { value: 'not_equals', label: 'Nie równa się' },
  { value: 'contains', label: 'Zawiera' },
  { value: 'not_contains', label: 'Nie zawiera' },
  { value: 'greater_than', label: 'Większe niż' },
  { value: 'less_than', label: 'Mniejsze niż' },
  { value: 'is_empty', label: 'Jest puste' },
  { value: 'is_not_empty', label: 'Nie jest puste' },
];

const actionTypes = [
  { value: 'ai-analysis', label: 'Analiza AI', icon: '🤖', description: 'Uruchom analizę AI z custom promptem' },
  { value: 'add-tag', label: 'Dodaj tag', icon: '🏷️', description: 'Automatycznie dodaj tag do elementu' },
  { value: 'send-notification', label: 'Wyślij powiadomienie', icon: '🔔', description: 'Wyślij powiadomienie do użytkownika' },
  { value: 'create-task', label: 'Utwórz zadanie', icon: '✅', description: 'Automatycznie utwórz nowe zadanie' },
  { value: 'update-status', label: 'Zaktualizuj status', icon: '📝', description: 'Zmień status elementu' },
  { value: 'custom-webhook', label: 'Custom webhook', icon: '🔗', description: 'Wywołaj zewnętrzny webhook' },
];

const aiModels = [
  { value: 'gpt-4', label: 'GPT-4', description: 'Najlepszy model do złożonych analiz' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Szybki i ekonomiczny' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', description: 'Dobry balans jakości i szybkości' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', description: 'Najszybszy model' },
];

export default function AIRuleForm({ rule, onSubmit, onCancel }: AIRuleFormProps) {
  const [formData, setFormData] = useState<CreateRuleRequest>({
    name: '',
    description: '',
    module: 'projects',
    trigger: 'manual',
    enabled: true,
    priority: 5,
    conditions: [],
    actions: [],
  });
  const [moduleFields, setModuleFields] = useState<ModuleField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Initialize form data once when rule changes
  useEffect(() => {
    if (rule) {
      logger.debug('Loading rule data', { ruleId: rule.id }, 'AIRuleForm');
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        module: rule.module || 'projects',
        component: rule.component,
        trigger: rule.trigger || 'manual',
        enabled: rule.enabled ?? true,
        priority: rule.priority || 5,
        conditions: rule.conditions || [],
        actions: rule.actions || [],
        aiPrompt: rule.aiPrompt,
        aiModel: rule.aiModel,
      });
    } else {
      // Reset form for new rule
      setFormData({
        name: '',
        description: '',
        module: 'projects',
        trigger: 'manual',
        enabled: true,
        priority: 5,
        conditions: [],
        actions: [],
      });
    }
  }, [rule?.id]); // Only depend on rule ID to prevent loops

  const loadModuleFields = useCallback(async (module: string) => {
    setIsLoadingFields(true);
    try {
      const fields = await aiRulesApi.getModuleFields(module);
      setModuleFields(fields);
    } catch (error: any) {
      logger.error('Failed to load module fields', error, 'AIRuleForm');
      // Ustaw podstawowe pola jako fallback
      setModuleFields([
        { name: 'name', label: 'Nazwa', type: 'string' },
        { name: 'status', label: 'Status', type: 'string' },
        { name: 'priority', label: 'Priorytet', type: 'string' },
        { name: 'createdAt', label: 'Data utworzenia', type: 'date' }
      ]);
      toast.error('Błąd podczas ładowania pól modułu - używam podstawowych pól');
    } finally {
      setIsLoadingFields(false);
    }
  }, []); // No dependencies needed since we pass module as parameter

  // Load module fields when module changes
  useEffect(() => {
    loadModuleFields(formData.module);
  }, [formData.module, loadModuleFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nazwa reguły jest wymagana');
      return;
    }
    if (formData.name.trim().length < 3 || formData.name.trim().length > 100) {
      toast.error('Nazwa reguły musi mieć od 3 do 100 znaków');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Opis reguły jest wymagany');
      return;
    }
    if (formData.description.trim().length < 10 || formData.description.trim().length > 500) {
      toast.error('Opis reguły musi mieć od 10 do 500 znaków');
      return;
    }
    if (formData.conditions.length === 0) {
      toast.error('Dodaj przynajmniej jeden warunek');
      return;
    }
    if (formData.actions.length === 0) {
      toast.error('Dodaj przynajmniej jedną akcję');
      return;
    }

    // Walidacja akcji AI
    for (const action of formData.actions) {
      if (action.type === 'ai-analysis') {
        if (!action.config.prompt || action.config.prompt.trim().length < 10) {
          toast.error('Prompt AI musi mieć przynajmniej 10 znaków');
          return;
        }
        // Model AI jest opcjonalny - jeśli nie wybrano, będzie użyty domyślny
        if (!action.config.modelId) {
          action.config.modelId = 'gpt-3.5-turbo'; // Domyślny model
        }
      }
      if (action.type === 'add-tag') {
        if (!action.config.tagName || action.config.tagName.trim().length === 0) {
          toast.error('Podaj nazwę tagu');
          return;
        }
      }
      if (action.type === 'send-notification') {
        if (!action.config.title || action.config.title.trim().length === 0) {
          toast.error('Podaj tytuł powiadomienia');
          return;
        }
        if (!action.config.message || action.config.message.trim().length === 0) {
          toast.error('Podaj treść powiadomienia');
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      logger.info('Saving AI rule', { formData }, 'AIRuleForm');
      let result: AIRule;
      if (rule) {
        logger.info('Updating existing AI rule', { ruleId: rule.id }, 'AIRuleForm');
        result = await aiRulesApi.updateRule(rule.id, formData);
        toast.success('Reguła została zaktualizowana');
      } else {
        logger.info('Creating new AI rule', undefined, 'AIRuleForm');
        result = await aiRulesApi.createRule(formData);
        toast.success('Reguła została utworzona');
      }
      logger.info('AI rule save successful', { result }, 'AIRuleForm');
      onSubmit(result);
    } catch (error: any) {
      logger.error('Failed to save AI rule', error, 'AIRuleForm');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(rule ? `Błąd podczas aktualizacji reguły: ${errorMessage}` : `Błąd podczas tworzenia reguły: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: moduleFields[0]?.name || 'status',
      operator: 'equals',
      value: '',
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = useCallback((index: number, updates: Partial<RuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  }, []);

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: 'ai-analysis',
      config: {},
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = useCallback((index: number, updates: Partial<RuleAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }));
  }, []);

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                <Sparkles className="w-6 h-6 inline mr-2 text-purple-500" />
                {rule ? 'Edytuj regułę AI' : 'Nowa reguła AI'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa reguły *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="np. Analiza SMART nowych projektów"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moduł *
                </label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    module: e.target.value as any,
                    conditions: [], // Reset conditions when module changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {modules.map(module => (
                    <option key={module.value} value={module.value}>
                      {module.icon} {module.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Opisz co robi ta reguła i kiedy się uruchamia"
                required
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="manual">👆 Ręczny</option>
                  <option value="automatic">🔄 Automatyczny</option>
                  <option value="both">🔀 Oba</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorytet
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value={1}>1 - Najwyższy</option>
                  <option value={2}>2 - Wysoki</option>
                  <option value={3}>3 - Średni-wysoki</option>
                  <option value={4}>4 - Średni</option>
                  <option value={5}>5 - Normalny</option>
                  <option value={6}>6 - Niski</option>
                  <option value={7}>7 - Bardzo niski</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Reguła aktywna</span>
                </label>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Warunki uruchomienia</h4>
                <button
                  type="button"
                  onClick={addCondition}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  disabled={isLoadingFields}
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj warunek</span>
                </button>
              </div>

              {isLoadingFields ? (
                <div className="text-center py-4">
                  <Settings className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Ładowanie pól modułu...</p>
                </div>
              ) : formData.conditions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Brak warunków. Dodaj pierwszy warunek aby określić kiedy reguła ma się uruchamiać.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={condition.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      {index > 0 && (
                        <select
                          value={condition.logicalOperator || 'AND'}
                          onChange={(e) => updateCondition(index, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {moduleFields.map(field => (
                          <option key={field.name} value={field.name}>
                            {field.label} ({field.type})
                          </option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Wartość"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Akcje do wykonania</h4>
                <button
                  type="button"
                  onClick={addAction}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj akcję</span>
                </button>
              </div>

              {formData.actions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Brak akcji. Dodaj akcję aby określić co ma się stać gdy warunki zostaną spełnione.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action, index) => (
                    <div key={action.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, { 
                            type: e.target.value as any,
                            config: {} // Reset config when type changes
                          })}
                          className="flex-1 mr-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {actionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Action-specific config */}
                      {action.type === 'ai-analysis' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model AI
                            </label>
                            <select
                              value={action.config.modelId || 'gpt-3.5-turbo'}
                              onChange={(e) => updateAction(index, { 
                                config: { ...action.config, modelId: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              {aiModels.map(model => (
                                <option key={model.value} value={model.value}>
                                  {model.label} - {model.description}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Prompt AI
                            </label>
                            <textarea
                              value={action.config.prompt || ''}
                              onChange={(e) => updateAction(index, { 
                                config: { ...action.config, prompt: e.target.value }
                              })}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Opisz co AI ma przeanalizować. Użyj {field} aby wstawić wartości z danych."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Możesz używać zmiennych jak {`{{name}}, {{status}}, {{description}}`} itp.
                            </p>
                          </div>
                        </div>
                      )}

                      {action.type === 'add-tag' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa tagu
                          </label>
                          <input
                            type="text"
                            value={action.config.tagName || ''}
                            onChange={(e) => updateAction(index, { 
                              config: { ...action.config, tagName: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="np. urgent, reviewed, {status}"
                          />
                        </div>
                      )}

                      {action.type === 'send-notification' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tytuł powiadomienia
                            </label>
                            <input
                              type="text"
                              value={action.config.title || ''}
                              onChange={(e) => updateAction(index, { 
                                config: { ...action.config, title: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="np. Nowy projekt wymaga uwagi"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Treść powiadomienia
                            </label>
                            <textarea
                              value={action.config.message || ''}
                              onChange={(e) => updateAction(index, { 
                                config: { ...action.config, message: e.target.value }
                              })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Projekt {name} wymaga analizy SMART"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-md hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Settings className="w-4 h-4 animate-spin inline mr-2" />
                  {rule ? 'Zapisywanie...' : 'Tworzenie...'}
                </>
              ) : (
                rule ? 'Zapisz zmiany' : 'Utwórz regułę'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}