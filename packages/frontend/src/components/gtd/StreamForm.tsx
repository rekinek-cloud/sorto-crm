'use client';

import React, { useState, useEffect } from 'react';
import { Stream } from '@/types/streams';
import { X, Sparkles } from 'lucide-react';
import { streamsApi } from '@/lib/api/streams';
import { toast } from 'react-hot-toast';

interface StreamFormProps {
  stream?: Stream;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6B7280', // gray
];

const PRESET_ICONS = [
  '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', ''
];

interface AISuggestion {
  name: string;
  description: string;
  color: string;
  icon: string;
  suggestedTasks?: { title: string; priority: string }[];
  reasoning?: string;
}

export default function StreamForm({ stream, onSubmit, onCancel }: StreamFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  useEffect(() => {
    if (stream) {
      setFormData({
        name: stream.name,
        description: stream.description || '',
        color: stream.color,
        icon: stream.icon || '',
        status: stream.status as 'ACTIVE' | 'ARCHIVED' | 'TEMPLATE',
      });
    }
  }, [stream]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa strumienia jest wymagana';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nazwa musi miec co najmniej 2 znaki';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nazwa musi byc krotsza niz 100 znakow';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Opis musi byc krotszy niz 500 znakow';
    }

    if (!formData.color.match(/^#[0-9A-F]{6}$/i)) {
      newErrors.color = 'Wybierz prawidlowy kolor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon || undefined,
        status: formData.status,
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAISuggest = async () => {
    if (!aiInput.trim() || aiInput.length < 3) {
      toast.error('Wprowadz co najmniej 3 znaki opisu');
      return;
    }

    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/v1/streams/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ input: aiInput }),
      });

      if (!response.ok) {
        throw new Error('AI suggestion failed');
      }

      const data = await response.json();

      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
        // Auto-fill the form with AI suggestion
        setFormData(prev => ({
          ...prev,
          name: data.suggestion.name || prev.name,
          description: data.suggestion.description || prev.description,
          color: data.suggestion.color || prev.color,
          icon: data.suggestion.icon || prev.icon,
        }));
        toast.success('AI zaproponowalo strumien!');
      } else {
        toast.error('Nie udalo sie uzyskac sugestii');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Blad podczas generowania sugestii AI');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({
        ...prev,
        name: aiSuggestion.name || prev.name,
        description: aiSuggestion.description || prev.description,
        color: aiSuggestion.color || prev.color,
        icon: aiSuggestion.icon || prev.icon,
      }));
      toast.success('Sugestia zastosowana');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {stream ? 'Edytuj strumien' : 'Nowy strumien'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* AI Assistant Section - only for new streams */}
            {!stream && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Asystent AI</span>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Opisz czego dotyczy strumien, a AI zaproponuje nazwe, opis i kolor.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="np. Projekt dla klienta ABC, marketing..."
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAISuggest}
                    disabled={isLoadingAI || aiInput.length < 3}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    {isLoadingAI ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Generuje...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Sugeruj</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestion Result */}
                {aiSuggestion && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sugestia AI:</span>
                      <button
                        type="button"
                        onClick={applySuggestion}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Zastosuj ponownie
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: aiSuggestion.color }}
                      />
                      {aiSuggestion.icon && <span>{aiSuggestion.icon}</span>}
                      <span className="font-medium text-gray-900">{aiSuggestion.name}</span>
                    </div>
                    {aiSuggestion.reasoning && (
                      <p className="text-xs text-gray-500 mt-1">{aiSuggestion.reasoning}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa strumienia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Wprowadz nazwe strumienia..."
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Opis
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Opcjonalny opis..."
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/500 znakow
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kolor
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#000000"
                    pattern="^#[0-9A-F]{6}$"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleChange('color', color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                        formData.color === color ? 'border-gray-600 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              {errors.color && (
                <p className="mt-1 text-sm text-red-600">{errors.color}</p>
              )}
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ikona (opcjonalnie)
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Wpisz emoji lub ikone..."
                  maxLength={10}
                />
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_ICONS.map((icon, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleChange('icon', icon)}
                      className={`w-8 h-8 rounded-lg border text-lg hover:bg-gray-50 transition-colors ${
                        formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Aktywny (plynacy)</option>
                <option value="TEMPLATE">Szablon</option>
                <option value="ARCHIVED">Zarchiwizowany (zamrozony)</option>
              </select>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Podglad</h4>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-100">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  {formData.icon ? (
                    <span className="text-xl">{formData.icon}</span>
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: formData.color }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {formData.name || 'Nazwa strumienia'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      formData.status === 'TEMPLATE' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.status === 'ACTIVE' ? 'Plynacy' :
                       formData.status === 'TEMPLATE' ? 'Szablon' : 'Zamrozony'}
                    </span>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Zapisywanie...' : stream ? 'Zapisz zmiany' : 'Utworz strumien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
