'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  FlaskConical,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { autoRepliesApi, type AutoReply } from '@/lib/api/autoReplies';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonPage';

// Types imported from @/lib/api/autoReplies

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
      const { autoReplies: data } = await autoRepliesApi.getAutoReplies();
      // Parse JSON fields if needed
      setAutoReplies((data || []).map((ar: any) => ({
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
        await autoRepliesApi.updateAutoReply(editingRule.id, payload);
        toast.success('Regula zaktualizowana');
      } else {
        await autoRepliesApi.createAutoReply(payload);
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
      await autoRepliesApi.deleteAutoReply(id);
      toast.success('Regula usunieta');
      loadAutoReplies();
    } catch (error) {
      toast.error('Nie udalo sie usunac reguly');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await autoRepliesApi.toggleAutoReply(id);
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
      delay: rule.replyConfig.delay ?? 0,
      onlyBusinessHours: rule.replyConfig.onlyBusinessHours ?? false,
      maxRepliesPerSender: rule.replyConfig.maxRepliesPerSender ?? 0,
      cooldownPeriod: rule.replyConfig.cooldownPeriod ?? 3600,
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

  if (loading) {
    return (
      <PageShell>
        <SkeletonPage rows={4} withStats={false} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Auto-odpowiedzi"
        subtitle="Automatyczne odpowiedzi na przychodzace emaile"
        icon={Mail}
        iconColor="text-blue-600"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nowa regula
          </button>
        }
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {editingRule ? 'Edytuj regule' : 'Nowa regula auto-odpowiedzi'}
              </h2>

              <div className="space-y-4">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nazwa *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="np. Odpowiedz na zapytania"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priorytet</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="Opcjonalny opis reguly"
                  />
                </div>

                {/* Conditions */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Warunki</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Od adresu email</label>
                      <input
                        type="email"
                        value={formData.fromEmail}
                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="konkretny@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Od domeny</label>
                      <input
                        type="text"
                        value={formData.fromDomain}
                        onChange={(e) => setFormData({ ...formData, fromDomain: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Temat zawiera (przecinki)</label>
                      <input
                        type="text"
                        value={formData.subjectContains}
                        onChange={(e) => setFormData({ ...formData, subjectContains: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="zapytanie, oferta, cennik"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Tresc zawiera (przecinki)</label>
                      <input
                        type="text"
                        value={formData.bodyContains}
                        onChange={(e) => setFormData({ ...formData, bodyContains: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="prosze o kontakt, potrzebuje"
                      />
                    </div>
                  </div>
                </div>

                {/* Reply config */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Konfiguracja odpowiedzi</h3>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Temat odpowiedzi</label>
                    <input
                      type="text"
                      value={formData.replySubject}
                      onChange={(e) => setFormData({ ...formData, replySubject: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Re: {{subject}}"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Szablon odpowiedzi *</label>
                    <textarea
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      rows={5}
                      placeholder="Dziekujemy za wiadomosc. Odpowiemy najszybciej jak to mozliwe.&#10;&#10;Pozdrawiamy,&#10;Zespol"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Opoznienie (sekundy)</label>
                      <input
                        type="number"
                        value={formData.delay}
                        onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Cooldown (sekundy)</label>
                      <input
                        type="number"
                        value={formData.cooldownPeriod}
                        onChange={(e) => setFormData({ ...formData, cooldownPeriod: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
                      <span className="text-sm text-slate-700 dark:text-slate-300">Tylko w godzinach pracy</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Akcje dodatkowe</h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.markAsRead}
                        onChange={(e) => setFormData({ ...formData, markAsRead: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Oznacz jako przeczytane</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.createTask}
                        onChange={(e) => setFormData({ ...formData, createTask: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Utworz zadanie</span>
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Dodaj etykiete</label>
                    <input
                      type="text"
                      value={formData.addLabel}
                      onChange={(e) => setFormData({ ...formData, addLabel: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="np. auto-reply"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
      {autoReplies.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
          <Mail className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Brak regul auto-odpowiedzi</p>
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
              className={`bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm ${!rule.enabled ? 'opacity-60' : ''} p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`mt-1 p-2 rounded-lg transition-colors ${
                      rule.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                    }`}
                  >
                    {rule.enabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{rule.name}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-xs rounded">
                        Priorytet: {rule.priority}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Wykonan: {rule._count?.executions || 0}
                      </span>
                      {(rule.replyConfig.delay ?? 0) > 0 && (
                        <span>Opoznienie: {rule.replyConfig.delay}s</span>
                      )}
                      {rule.replyConfig.onlyBusinessHours === true && (
                        <span>Tylko w godzinach pracy</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(rule.id)}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    title="Testuj"
                  >
                    <FlaskConical className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    title="Edytuj"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                    title="Usun"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
