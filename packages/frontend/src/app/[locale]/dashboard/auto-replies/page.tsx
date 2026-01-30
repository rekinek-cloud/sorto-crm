'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  BeakerIcon,
  ClockIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface AutoReplyConditions {
  fromEmail?: string;
  fromDomain?: string;
  subject?: string;
  subjectContains?: string[];
  bodyContains?: string[];
  hasAttachment?: boolean;
  timeRange?: {
    start?: string;
    end?: string;
    timezone?: string;
  };
  daysOfWeek?: number[];
}

interface AutoReplyConfig {
  template: string;
  subject?: string;
  delay: number;
  onlyBusinessHours: boolean;
  maxRepliesPerSender: number;
  cooldownPeriod: number;
}

interface AutoReplyActions {
  markAsRead?: boolean;
  addLabel?: string;
  createTask?: boolean;
  taskTitle?: string;
  taskContext?: string;
  notifyUsers?: string[];
}

interface AutoReply {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: AutoReplyConditions;
  replyConfig: AutoReplyConfig;
  actions?: AutoReplyActions;
  _count?: { executions: number };
  createdAt: string;
  updatedAt: string;
}

export default function AutoRepliesPage() {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReply | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRuleId, setTestRuleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 50,
    // Conditions
    fromEmail: '',
    fromDomain: '',
    subjectContains: '',
    bodyContains: '',
    // Reply config
    template: '',
    replySubject: '',
    delay: 0,
    onlyBusinessHours: false,
    maxRepliesPerSender: 0,
    cooldownPeriod: 3600,
    // Actions
    markAsRead: false,
    addLabel: '',
    createTask: false,
  });

  useEffect(() => {
    loadAutoReplies();
  }, []);

  const loadAutoReplies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auto-replies');
      const data = response.data.autoReplies || [];
      // Parse JSON fields
      setAutoReplies(data.map((ar: any) => ({
        ...ar,
        conditions: typeof ar.conditions === 'string' ? JSON.parse(ar.conditions) : ar.conditions,
        replyConfig: typeof ar.replyConfig === 'string' ? JSON.parse(ar.replyConfig) : ar.replyConfig,
        actions: ar.actions ? (typeof ar.actions === 'string' ? JSON.parse(ar.actions) : ar.actions) : undefined,
      })));
    } catch (error) {
      console.error('Failed to load auto-replies:', error);
      toast.error('Nie udalo sie zaladowac regul');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Nazwa jest wymagana');
      return;
    }
    if (!formData.template.trim()) {
      toast.error('Szablon odpowiedzi jest wymagany');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        enabled: formData.enabled,
        priority: formData.priority,
        conditions: {
          fromEmail: formData.fromEmail || undefined,
          fromDomain: formData.fromDomain || undefined,
          subjectContains: formData.subjectContains ? formData.subjectContains.split(',').map(s => s.trim()) : undefined,
          bodyContains: formData.bodyContains ? formData.bodyContains.split(',').map(s => s.trim()) : undefined,
        },
        replyConfig: {
          template: formData.template,
          subject: formData.replySubject || undefined,
          delay: formData.delay,
          onlyBusinessHours: formData.onlyBusinessHours,
          maxRepliesPerSender: formData.maxRepliesPerSender,
          cooldownPeriod: formData.cooldownPeriod,
        },
        actions: {
          markAsRead: formData.markAsRead,
          addLabel: formData.addLabel || undefined,
          createTask: formData.createTask,
        },
      };

      if (editingRule) {
        await apiClient.put(`/auto-replies/${editingRule.id}`, payload);
        toast.success('Regula zaktualizowana');
      } else {
        await apiClient.post('/auto-replies', payload);
        toast.success('Regula utworzona');
      }

      resetForm();
      loadAutoReplies();
    } catch (error) {
      console.error('Failed to save auto-reply:', error);
      toast.error('Nie udalo sie zapisac reguly');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunac te regule?')) return;

    try {
      await apiClient.delete(`/auto-replies/${id}`);
      toast.success('Regula usunieta');
      loadAutoReplies();
    } catch (error) {
      toast.error('Nie udalo sie usunac reguly');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiClient.post(`/auto-replies/${id}/toggle`);
      toast.success('Status zmieniony');
      loadAutoReplies();
    } catch (error) {
      toast.error('Nie udalo sie zmienic statusu');
    }
  };

  const handleEdit = (rule: AutoReply) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      priority: rule.priority,
      fromEmail: rule.conditions.fromEmail || '',
      fromDomain: rule.conditions.fromDomain || '',
      subjectContains: rule.conditions.subjectContains?.join(', ') || '',
      bodyContains: rule.conditions.bodyContains?.join(', ') || '',
      template: rule.replyConfig.template,
      replySubject: rule.replyConfig.subject || '',
      delay: rule.replyConfig.delay,
      onlyBusinessHours: rule.replyConfig.onlyBusinessHours,
      maxRepliesPerSender: rule.replyConfig.maxRepliesPerSender,
      cooldownPeriod: rule.replyConfig.cooldownPeriod,
      markAsRead: rule.actions?.markAsRead || false,
      addLabel: rule.actions?.addLabel || '',
      createTask: rule.actions?.createTask || false,
    });
    setShowForm(true);
  };

  const handleTest = (id: string) => {
    setTestRuleId(id);
    setTestModalOpen(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      priority: 50,
      fromEmail: '',
      fromDomain: '',
      subjectContains: '',
      bodyContains: '',
      template: '',
      replySubject: '',
      delay: 0,
      onlyBusinessHours: false,
      maxRepliesPerSender: 0,
      cooldownPeriod: 3600,
      markAsRead: false,
      addLabel: '',
      createTask: false,
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auto-odpowiedzi</h1>
            <p className="text-sm text-gray-600">Automatyczne odpowiedzi na przychodzace emaile</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nowa regula
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingRule ? 'Edytuj regule' : 'Nowa regula auto-odpowiedzi'}
              </h2>

              <div className="space-y-4">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="np. Odpowiedz na zapytania"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Opcjonalny opis reguly"
                  />
                </div>

                {/* Conditions */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Warunki</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Od adresu email</label>
                      <input
                        type="email"
                        value={formData.fromEmail}
                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="konkretny@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Od domeny</label>
                      <input
                        type="text"
                        value={formData.fromDomain}
                        onChange={(e) => setFormData({ ...formData, fromDomain: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Temat zawiera (przecinki)</label>
                      <input
                        type="text"
                        value={formData.subjectContains}
                        onChange={(e) => setFormData({ ...formData, subjectContains: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="zapytanie, oferta, cennik"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tresc zawiera (przecinki)</label>
                      <input
                        type="text"
                        value={formData.bodyContains}
                        onChange={(e) => setFormData({ ...formData, bodyContains: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="prosze o kontakt, potrzebuje"
                      />
                    </div>
                  </div>
                </div>

                {/* Reply config */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Konfiguracja odpowiedzi</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Temat odpowiedzi</label>
                    <input
                      type="text"
                      value={formData.replySubject}
                      onChange={(e) => setFormData({ ...formData, replySubject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Re: {{subject}}"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">Szablon odpowiedzi *</label>
                    <textarea
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={5}
                      placeholder="Dziekujemy za wiadomosc. Odpowiemy najszybciej jak to mozliwe.&#10;&#10;Pozdrawiamy,&#10;Zespol"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Opoznienie (sekundy)</label>
                      <input
                        type="number"
                        value={formData.delay}
                        onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Cooldown (sekundy)</label>
                      <input
                        type="number"
                        value={formData.cooldownPeriod}
                        onChange={(e) => setFormData({ ...formData, cooldownPeriod: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.onlyBusinessHours}
                        onChange={(e) => setFormData({ ...formData, onlyBusinessHours: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Tylko w godzinach pracy</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Akcje dodatkowe</h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.markAsRead}
                        onChange={(e) => setFormData({ ...formData, markAsRead: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Oznacz jako przeczytane</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.createTask}
                        onChange={(e) => setFormData({ ...formData, createTask: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Utworz zadanie</span>
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">Dodaj etykiete</label>
                    <input
                      type="text"
                      value={formData.addLabel}
                      onChange={(e) => setFormData({ ...formData, addLabel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="np. auto-reply"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRule ? 'Zapisz' : 'Utworz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : autoReplies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Brak regul auto-odpowiedzi</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Dodaj pierwsza regule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {autoReplies.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white rounded-xl border ${rule.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'} p-4 hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`mt-1 p-2 rounded-lg transition-colors ${
                      rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {rule.enabled ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        Priorytet: {rule.priority}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        Wykonan: {rule._count?.executions || 0}
                      </span>
                      {rule.replyConfig.delay > 0 && (
                        <span>Opoznienie: {rule.replyConfig.delay}s</span>
                      )}
                      {rule.replyConfig.onlyBusinessHours && (
                        <span>Tylko w godzinach pracy</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(rule.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Testuj"
                  >
                    <BeakerIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edytuj"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Usun"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
