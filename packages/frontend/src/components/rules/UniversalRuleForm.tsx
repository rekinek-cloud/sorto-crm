/**
 * Universal Rules Manager - Dynamic Form Renderer
 * Inteligentny formularz adaptujący się do typu reguły
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';
import {
  X,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings as CogIcon
} from 'lucide-react';
import {
  Cog,
  Mail,
  MessageSquare,
  Brain,
  Inbox,
  GitBranch,
  Bell,
  Plug,
  Settings,
  Sparkles
} from 'lucide-react';

// Mapowanie nazw ikon na komponenty Lucide
const iconMap: Record<string, any> = {
  'cog': Cog,
  'mail': Mail,
  'reply': MessageSquare,
  'brain': Brain,
  'inbox': Inbox,
  'workflow': GitBranch,
  'bell': Bell,
  'plug': Plug,
  'settings': Settings
};
import { 
  getRuleTypeConfig, 
  getAllRuleTypes, 
  generateRuleJson,
  type RuleTypeConfig,
  type FieldConfig,
  type ActionConfig 
} from './RuleTypeConfigs';

interface UniversalRuleFormProps {
  onSubmit: (ruleData: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  supportedModels?: string[];
  configSchema?: {
    models?: Array<{ id: string; name: string; description?: string }>;
  };
}

interface AIModel {
  id: string;
  name: string;
  description?: string;
  providerId: string;
}

// Predefiniowane modele dla znanych providerów
const PREDEFINED_MODELS: Record<string, AIModel[]> = {
  'openai': [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Najnowszy i najpotężniejszy model OpenAI', providerId: 'openai' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Zaawansowany model do złożonych zadań', providerId: 'openai' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Zoptymalizowany GPT-4', providerId: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Mniejszy, szybszy GPT-4o', providerId: 'openai' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Szybki i ekonomiczny model', providerId: 'openai' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'GPT-3.5 z większym kontekstem', providerId: 'openai' },
  ],
  'anthropic': [
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Najpotężniejszy model Anthropic', providerId: 'anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Zbalansowany model', providerId: 'anthropic' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Szybki i lekki model', providerId: 'anthropic' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Ulepszona wersja Sonnet', providerId: 'anthropic' },
  ],
  'google': [
    { id: 'gemini-pro', name: 'Gemini Pro', description: 'Model Google do tekstu', providerId: 'google' },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Model multimodalny', providerId: 'google' },
    { id: 'gemini-ultra', name: 'Gemini Ultra', description: 'Najpotężniejszy model Google', providerId: 'google' },
  ],
  'mistral': [
    { id: 'mistral-large', name: 'Mistral Large', description: 'Flagowy model Mistral', providerId: 'mistral' },
    { id: 'mistral-medium', name: 'Mistral Medium', description: 'Zbalansowany model', providerId: 'mistral' },
    { id: 'mistral-small', name: 'Mistral Small', description: 'Ekonomiczny model', providerId: 'mistral' },
    { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', description: 'Model MoE', providerId: 'mistral' },
  ],
  'default': [
    { id: 'default-model', name: 'Model domyślny', description: 'Używa domyślnego modelu providera', providerId: 'default' },
  ]
};

const UniversalRuleForm: React.FC<UniversalRuleFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    description: '',
    ruleType: '',
    triggerType: 'EVENT_BASED',
    priority: 50,
    actionType: '',
    ...initialData
  });

  const [selectedRuleConfig, setSelectedRuleConfig] = useState<RuleTypeConfig | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionConfig | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [fallbackModels, setFallbackModels] = useState<AIModel[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Funkcja do pobrania modeli dla danego providera
  const getModelsForProvider = (providerId: string, providerName: string): AIModel[] => {
    // Najpierw sprawdź czy provider ma zdefiniowane modele
    const provider = aiProviders.find(p => p.id === providerId);
    if (provider?.supportedModels && provider.supportedModels.length > 0) {
      return provider.supportedModels.map(modelId => ({
        id: modelId,
        name: modelId,
        providerId: providerId
      }));
    }

    // Użyj predefiniowanych modeli na podstawie nazwy providera
    const normalizedName = providerName.toLowerCase();
    if (normalizedName.includes('openai')) {
      return PREDEFINED_MODELS['openai'];
    } else if (normalizedName.includes('anthropic') || normalizedName.includes('claude')) {
      return PREDEFINED_MODELS['anthropic'];
    } else if (normalizedName.includes('google') || normalizedName.includes('gemini')) {
      return PREDEFINED_MODELS['google'];
    } else if (normalizedName.includes('mistral')) {
      return PREDEFINED_MODELS['mistral'];
    }

    return PREDEFINED_MODELS['default'];
  };

  // Function to load AI providers
  const loadAiProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await apiClient.get('/admin/ai-config/providers');
      if (response.data.success) {
        const enabledProviders = response.data.data.filter((p: AIProvider) => p.enabled === true);
        setAiProviders(enabledProviders);
      } else if (Array.isArray(response.data)) {
        const enabledProviders = response.data.filter((p: AIProvider) => p.enabled === true);
        setAiProviders(enabledProviders);
      }
    } catch (error: any) {
      console.error('Failed to load AI providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Aktualizuj dostępne modele gdy zmieni się provider
  useEffect(() => {
    if (formData.aiProviderId) {
      const provider = aiProviders.find(p => p.id === formData.aiProviderId);
      if (provider) {
        const models = getModelsForProvider(provider.id, provider.name);
        setAvailableModels(models);
        // Resetuj wybrany model jeśli nie jest dostępny
        if (formData.aiModelId && !models.find(m => m.id === formData.aiModelId)) {
          setFormData(prev => ({ ...prev, aiModelId: '' }));
        }
      }
    } else {
      setAvailableModels([]);
    }
  }, [formData.aiProviderId, aiProviders]);

  // Aktualizuj modele zapasowe gdy zmieni się fallback provider
  useEffect(() => {
    if (formData.fallbackProviderId) {
      const provider = aiProviders.find(p => p.id === formData.fallbackProviderId);
      if (provider) {
        const models = getModelsForProvider(provider.id, provider.name);
        setFallbackModels(models);
      }
    } else {
      setFallbackModels([]);
    }
  }, [formData.fallbackProviderId, aiProviders]);

  // Function to populate AI provider options in rule config
  const populateAiProviderOptions = (config: RuleTypeConfig) => {
    const providerOptions = aiProviders.map(provider => ({
      value: provider.id,
      label: provider.description || provider.name
    }));

    // Aktualizuj wszystkie akcje z polem aiProviderId
    config.actions.forEach(action => {
      action.fields.forEach(field => {
        if (field.name === 'aiProviderId' || field.name === 'fallbackProviderId') {
          field.options = providerOptions;
        }
      });
    });

    // Aktualizuj advanced settings
    config.advancedSettings.forEach(setting => {
      if (setting.name === 'fallbackProviderId') {
        setting.options = providerOptions;
      }
    });
  };

  // Load AI providers on component mount
  useEffect(() => {
    loadAiProviders();
  }, []);

  // Load rule type config when ruleType changes
  useEffect(() => {
    if (formData.ruleType) {
      const config = getRuleTypeConfig(formData.ruleType);
      setSelectedRuleConfig(config);
      
      // Populate AI provider options if this is AI_RULE
      if (formData.ruleType === 'AI_RULE' && config) {
        populateAiProviderOptions(config);
      }
      
      // Reset action when rule type changes
      setSelectedAction(null);
      setFormData(prev => ({ ...prev, actionType: '' }));
    }
  }, [formData.ruleType, aiProviders]);

  // Load action config when actionType changes
  useEffect(() => {
    if (selectedRuleConfig && formData.actionType) {
      const action = selectedRuleConfig.actions.find(a => a.name === formData.actionType);
      setSelectedAction(action || null);
    }
  }, [selectedRuleConfig, formData.actionType]);

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name) newErrors.name = 'Nazwa jest wymagana';
    if (!formData.ruleType) newErrors.ruleType = 'Typ reguły jest wymagany';
    if (!formData.triggerType) newErrors.triggerType = 'Wyzwalacz jest wymagany';
    if (!formData.actionType) newErrors.actionType = 'Akcja jest wymagana';

    // Action-specific validation
    if (selectedAction) {
      selectedAction.fields.forEach(field => {
        if (field.required && !formData[field.name]) {
          newErrors[field.name] = `${field.label} jest wymagane`;
        }
        
        // Custom validation
        if (field.validation?.custom && formData[field.name]) {
          const customError = field.validation.custom(formData[field.name]);
          if (customError) newErrors[field.name] = customError;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const ruleJson = generateRuleJson(formData.ruleType, formData);
      await onSubmit(ruleJson);
    } catch (error: any) {
      console.error('Error submitting rule:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Nie udało się zapisać reguły. Spróbuj ponownie.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] || field.defaultValue || '';
    const error = errors[field.name];

    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleInputChange(field.name, e.target.value);
      }
    };

    // Dynamiczne opcje dla pól związanych z AI
    const getDynamicOptions = () => {
      if (field.name === 'aiProviderId' || field.name === 'fallbackProviderId') {
        return aiProviders.map(provider => ({
          value: provider.id,
          label: provider.description || provider.name
        }));
      }
      if (field.name === 'aiModelId') {
        return availableModels.map(model => ({
          value: model.id,
          label: model.description ? `${model.name} - ${model.description}` : model.name
        }));
      }
      if (field.name === 'fallbackModelId') {
        return fallbackModels.map(model => ({
          value: model.id,
          label: model.description ? `${model.name} - ${model.description}` : model.name
        }));
      }
      return field.options || [];
    };

    // Sprawdź czy pole powinno być wyłączone (np. model bez wybranego providera)
    const isDisabled = () => {
      if (field.name === 'aiModelId' && !formData.aiProviderId) return true;
      if (field.name === 'fallbackModelId' && !formData.fallbackProviderId) return true;
      return false;
    };

    return (
      <div key={field.name} className="space-y-2">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'text' && (
          <Input
            {...commonProps}
            type="text"
            value={value}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            {...commonProps}
            value={value}
            rows={3}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 ${error ? 'border-red-500' : ''}`}
          />
        )}

        {field.type === 'number' && (
          <Input
            {...commonProps}
            type="number"
            value={value}
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.name === 'temperature' ? 0.1 : 1}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'select' && (
          <select
            {...commonProps}
            value={value}
            disabled={isDisabled()}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 ${error ? 'border-red-500' : ''} ${isDisabled() ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">
              {isDisabled()
                ? (field.name.includes('Model') ? 'Najpierw wybierz providera...' : 'Wybierz...')
                : 'Wybierz...'
              }
            </option>
            {getDynamicOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        
        {field.type === 'multiselect' && (
          <Input
            {...commonProps}
            type="text"
            value={value}
            placeholder={field.placeholder + ' (oddziel przecinkami)'}
            className={error ? 'border-red-500' : ''}
          />
        )}
        
        {field.type === 'boolean' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              checked={value}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor={field.name} className="text-sm text-gray-600">
              Włącz
            </label>
          </div>
        )}

        {field.description && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            {field.description}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  // Generate JSON preview
  const getJsonPreview = () => {
    if (!formData.ruleType) return null;
    return generateRuleJson(formData.ruleType, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex">
        
        {/* Main Form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  {isEditing ? 'Edytuj Regułę' : 'Nowa Reguła Automatyzacji'}
                </h2>
                <p className="text-gray-600 mt-1">
                  Stwórz inteligentną regułę automatyzacji
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showJsonPreview ? 'Ukryj' : 'Podgląd'} JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Podstawowe informacje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa reguły *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="np. Auto-zadania z pilnych emaili"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorytet
                    </label>
                    <Input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      min="0"
                      max="100"
                      placeholder="0-100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Szczegółowy opis działania reguły..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rule Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Typ reguły</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {getAllRuleTypes().map(config => (
                    <div
                      key={config.name}
                      onClick={() => handleInputChange('ruleType', config.name)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.ruleType === config.name
                          ? `border-${config.color}-500 bg-${config.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-2">
                          {(() => {
                            const IconComponent = iconMap[config.icon] || Cog;
                            return <IconComponent className="h-6 w-6 text-blue-600" />;
                          })()}
                        </div>
                        <div className="font-medium text-sm">{config.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {config.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.ruleType && (
                  <p className="text-xs text-red-500 mt-2">{errors.ruleType}</p>
                )}
              </CardContent>
            </Card>

            {/* Trigger Type */}
            <Card>
              <CardHeader>
                <CardTitle>Wyzwalacz</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  name="triggerType"
                  value={formData.triggerType}
                  onChange={(e) => handleInputChange('triggerType', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="EVENT_BASED">EVENT_BASED - Reakcja na zdarzenie</option>
                  <option value="MANUAL">MANUAL - Ręczne uruchomienie</option>
                  <option value="AUTOMATIC">AUTOMATIC - Ciągłe działanie</option>
                  <option value="SCHEDULED">SCHEDULED - Harmonogram czasowy</option>
                  <option value="WEBHOOK">WEBHOOK - Webhook zewnętrzny</option>
                  <option value="API_CALL">API_CALL - Wywołanie API</option>
                </select>
              </CardContent>
            </Card>

            {/* Dynamic Conditions */}
            {selectedRuleConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Warunki ({selectedRuleConfig.name})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRuleConfig.conditionFields.map(renderField)}
                </CardContent>
              </Card>
            )}

            {/* Action Selection */}
            {selectedRuleConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Akcje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ akcji *
                    </label>
                    <select
                      name="actionType"
                      value={formData.actionType}
                      onChange={(e) => handleInputChange('actionType', e.target.value)}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2 ${errors.actionType ? 'border-red-500' : ''}`}
                    >
                      <option value="">Wybierz akcję...</option>
                      {selectedRuleConfig.actions.map(action => (
                        <option key={action.name} value={action.name}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                    {errors.actionType && (
                      <p className="text-xs text-red-500 mt-1">{errors.actionType}</p>
                    )}
                  </div>

                  {/* Dynamic Action Fields */}
                  {selectedAction && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{selectedAction.label}</h4>
                        <Badge variant="outline">{selectedAction.description}</Badge>
                      </div>
                      {selectedAction.fields.map(renderField)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Advanced Settings */}
            {selectedRuleConfig && (
              <Card>
                <CardHeader>
                  <CardTitle 
                    className="cursor-pointer flex items-center justify-between"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <span className="flex items-center gap-2">
                      <CogIcon className="h-5 w-5" />
                      Ustawienia zaawansowane
                    </span>
                    <span className="text-sm text-gray-500">
                      {showAdvanced ? 'Ukryj' : 'Pokaż'}
                    </span>
                  </CardTitle>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-4">
                    {selectedRuleConfig.advancedSettings.map(renderField)}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isEditing ? 'Zapisz Zmiany' : 'Utwórz Regułę'}
              </Button>
            </div>
          </form>
        </div>

        {/* JSON Preview Sidebar */}
        {showJsonPreview && (
          <div className="w-96 border-l bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Podgląd JSON
              </h3>
              <div className="bg-white rounded border p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(getJsonPreview(), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalRuleForm;