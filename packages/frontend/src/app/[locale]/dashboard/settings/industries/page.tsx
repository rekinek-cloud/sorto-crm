'use client';

import React, { useState, useEffect } from 'react';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  TagIcon,
  CubeIcon,
  ChartBarIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { industriesApi, IndustryTemplate, IndustryCategory } from '@/lib/api/industries';

export default function IndustriesPage() {
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [categories, setCategories] = useState<IndustryCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadByCategory(selectedCategory);
    } else {
      loadAll();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        industriesApi.getAll(),
        industriesApi.getCategories(),
      ]);
      setTemplates(templatesData.templates || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Nie udalo sie zaladowac szablonow');
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const data = await industriesApi.getAll();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadByCategory = async (category: string) => {
    try {
      setLoading(true);
      const data = await industriesApi.getByCategory(category);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (template: IndustryTemplate) => {
    if (applying) return;

    try {
      setApplying(true);
      const result = await industriesApi.applyTemplate(template.slug);

      if (result.success) {
        toast.success(result.message || 'Szablon zastosowany pomyslnie');
        setAppliedTemplate(template.slug);
        setSelectedTemplate(null);
      } else {
        toast.error(result.message || 'Nie udalo sie zastosowac szablonu');
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Wystapil blad podczas stosowania szablonu');
    } finally {
      setApplying(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'IT & Software': <CubeIcon className="h-5 w-5" />,
      'E-commerce': <Squares2X2Icon className="h-5 w-5" />,
      'Marketing': <ChartBarIcon className="h-5 w-5" />,
      'Sales': <TagIcon className="h-5 w-5" />,
    };
    return icons[category] || <BuildingOffice2Icon className="h-5 w-5" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Szablony branzowe</h1>
          <p className="text-sm text-gray-600">Wybierz szablon dopasowany do Twojej branzy</p>
        </div>
      </div>

      {/* Applied notification */}
      {appliedTemplate && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Szablon zastosowany</p>
            <p className="text-sm text-green-600">Twoje srodowisko zostalo skonfigurowane</p>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Kategorie</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Wszystkie
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat.category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(cat.category)}
              {cat.category}
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BuildingOffice2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak dostepnych szablonow</p>
          <p className="text-sm text-gray-400 mt-2">Dodaj szablony branzowe w panelu administratora</p>
        </div>
      ) : (
        /* Templates grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                appliedTemplate === template.slug
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: template.color + '20' }}
                  >
                    {template.icon || '🏢'}
                  </div>
                  {appliedTemplate === template.slug && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  )}
                  {template.isPremium && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
                      <SparklesIcon className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {template.description || 'Szablon konfiguracyjny'}
                </p>
              </div>

              {/* Stats */}
              <div className="p-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {template.streams?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Streamow</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {template.pipelineStages?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Etapow</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {template.customFields?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Pol</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template detail modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div
              className="p-6 border-b"
              style={{ backgroundColor: selectedTemplate.color + '10' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: selectedTemplate.color + '30' }}
                  >
                    {selectedTemplate.icon || '🏢'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    <p className="text-sm text-gray-600">{selectedTemplate.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              {selectedTemplate.description && (
                <p className="mt-4 text-gray-600">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-6">
              {/* Streams */}
              {selectedTemplate.streams && selectedTemplate.streams.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Streamy GTD</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.streams.map((stream, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stream.color }}
                        />
                        <span className="text-sm text-gray-700">{stream.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{stream.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline stages */}
              {selectedTemplate.pipelineStages && selectedTemplate.pipelineStages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Etapy Pipeline</h3>
                  <div className="flex gap-1">
                    {selectedTemplate.pipelineStages.map((stage, i) => (
                      <div
                        key={i}
                        className="flex-1 p-2 rounded-lg text-center text-sm"
                        style={{ backgroundColor: stage.color + '20', color: stage.color }}
                      >
                        <p className="font-medium truncate">{stage.name}</p>
                        <p className="text-xs opacity-70">{stage.probability}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task categories */}
              {selectedTemplate.taskCategories && selectedTemplate.taskCategories.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Kategorie zadan</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.taskCategories.map((cat, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom fields */}
              {selectedTemplate.customFields && selectedTemplate.customFields.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Pola niestandardowe</h3>
                  <div className="space-y-2">
                    {selectedTemplate.customFields.map((field, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{field.label}</span>
                        <span className="text-xs text-gray-400 uppercase">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleApplyTemplate(selectedTemplate)}
                disabled={applying || appliedTemplate === selectedTemplate.slug}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Stosuje...
                  </>
                ) : appliedTemplate === selectedTemplate.slug ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Zastosowany
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Zastosuj szablon
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
