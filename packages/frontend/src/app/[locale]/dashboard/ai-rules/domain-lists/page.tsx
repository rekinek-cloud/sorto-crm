'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  emailDomainRulesApi,
  EmailDomainRule,
  DomainRulesStats,
} from '@/lib/api/emailDomainRulesApi';
import { aiSuggestionsApi, AISuggestion } from '@/lib/api/aiSuggestionsApi';
import {
  PlusIcon,
  TrashIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type ListTab = 'BLACKLIST' | 'WHITELIST' | 'VIP';

const listTabs: { id: ListTab; name: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: 'BLACKLIST', name: 'Czarna lista', icon: ShieldExclamationIcon, color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'WHITELIST', name: 'Biala lista', icon: ShieldCheckIcon, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'VIP', name: 'VIP', icon: StarIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
];

export default function DomainListsPage() {
  const [activeTab, setActiveTab] = useState<ListTab>('BLACKLIST');
  const [rules, setRules] = useState<EmailDomainRule[]>([]);
  const [stats, setStats] = useState<DomainRulesStats | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newClassification, setNewClassification] = useState('');
  const [newReason, setNewReason] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesData, statsData] = await Promise.all([
        emailDomainRulesApi.getRules({ listType: activeTab, search: search || undefined }),
        emailDomainRulesApi.getStats(),
      ]);
      setRules(rulesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load domain rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await aiSuggestionsApi.getSuggestions({ status: 'PENDING', type: 'BLACKLIST_DOMAIN', limit: 10 });
      setSuggestions(data);
    } catch {
      // Ignore - suggestions are optional
    }
  }, []);

  useEffect(() => {
    loadData();
    loadSuggestions();
  }, [loadData, loadSuggestions]);

  const handleAdd = async () => {
    if (!newPattern.trim()) return;

    try {
      await emailDomainRulesApi.createRule({
        pattern: newPattern.trim(),
        listType: activeTab,
        classification: newClassification || undefined,
        reason: newReason || undefined,
      });
      toast.success('Dodano do listy');
      setShowAddDialog(false);
      setNewPattern('');
      setNewClassification('');
      setNewReason('');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Blad dodawania';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunac ten wpis?')) return;
    try {
      await emailDomainRulesApi.deleteRule(id);
      toast.success('Usunieto');
      loadData();
    } catch {
      toast.error('Blad usuwania');
    }
  };

  const handleAcceptSuggestion = async (id: string) => {
    try {
      await aiSuggestionsApi.acceptSuggestion(id);
      toast.success('Sugestia zaakceptowana');
      setSuggestions(prev => prev.filter(s => s.id !== id));
      loadData();
    } catch {
      toast.error('Blad akceptowania sugestii');
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    try {
      await aiSuggestionsApi.rejectSuggestion(id);
      toast.success('Sugestia odrzucona');
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Blad odrzucania sugestii');
    }
  };

  const currentTab = listTabs.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/ai-rules"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Listy domen</h1>
            <p className="text-gray-600">Zarzadzaj czarna lista, biala lista i VIP domen/emaili</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600"
        >
          <PlusIcon className="w-5 h-5" />
          Dodaj
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {listTabs.map(tab => {
            const Icon = tab.icon;
            const count = tab.id === 'BLACKLIST' ? stats.blacklist : tab.id === 'WHITELIST' ? stats.whitelist : stats.vip;
            return (
              <div key={tab.id} className={`p-4 rounded-lg border ${tab.bgColor}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${tab.color}`} />
                  <div>
                    <p className="text-sm text-gray-600">{tab.name}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Lacznie</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {listTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? `border-purple-500 ${tab.color}`
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Szukaj wzorca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : rules.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <currentTab.icon className={`w-12 h-12 mx-auto mb-3 ${currentTab.color} opacity-30`} />
            <p>Brak wpisow na liscie {currentTab.name.toLowerCase()}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Wzorzec</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Typ</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Klasyfikacja</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Zrodlo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Dopasowania</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-900">{rule.pattern}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                      {rule.patternType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{rule.classification || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      rule.source === 'AI_SUGGESTED' ? 'bg-purple-100 text-purple-700' :
                      rule.source === 'AUTO_LEARNED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rule.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{rule.matchCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-purple-600">AI</span> Sugestie domen
          </h3>
          {suggestions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-gray-600">{s.description}</p>
                <p className="text-xs text-gray-500 mt-1">Pewnosc: {s.confidence}%</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptSuggestion(s.id)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Akceptuj
                </button>
                <button
                  onClick={() => handleRejectSuggestion(s.id)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Odrzuc
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Dodaj do: {currentTab.name}
              </h3>
              <button onClick={() => setShowAddDialog(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wzorzec (email, domena lub wildcard)
                </label>
                <input
                  type="text"
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  placeholder="np. spam.com, *@newsletter.pl, user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typ zostanie wykryty automatycznie: * = wildcard, @ = email, reszta = domena
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klasyfikacja (opcjonalne)
                </label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- Brak --</option>
                  <option value="SPAM">SPAM</option>
                  <option value="NEWSLETTER">NEWSLETTER</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="NOTIFICATION">NOTIFICATION</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Powod (opcjonalne)
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="np. Niechciane newslettery"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Anuluj
              </button>
              <button
                onClick={handleAdd}
                disabled={!newPattern.trim()}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
