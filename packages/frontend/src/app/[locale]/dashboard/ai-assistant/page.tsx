'use client';

/**
 * AI Asystent STREAMS
 * Zgodny z filozofią Human-in-the-Loop z spec_ai.md
 *
 * Zasada nadrzędna:
 * AI SUGERUJE → CZŁOWIEK DECYDUJE → AI SIĘ UCZY
 * Żadna akcja zewnętrzna bez zatwierdzenia użytkownika
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KnowledgeChat } from '@/components/ai/KnowledgeChat';
import { AISettingsPanel } from '@/components/ai/AISettingsPanel';
import { AISuggestionPanel } from '@/components/ai/AISuggestionPanel';
import { StreamRulesPanel } from '@/components/ai/StreamRulesPanel';
import { AIPromptsPanel } from '@/components/ai/AIPromptsPanel';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { aiRulesApi, AIRule } from '@/lib/api/aiRules';
import { emailDomainRulesApi, DomainRulesStats } from '@/lib/api/emailDomainRulesApi';
import { aiSuggestionsApi, AISuggestion } from '@/lib/api/aiSuggestionsApi';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  Waves,
  Circle,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Bot,
  Inbox,
  Cog,
  GitBranch,
  FileText
} from 'lucide-react';

type TabType = 'chat' | 'suggestions' | 'automation' | 'prompts' | 'settings';

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedContext, setSelectedContext] = useState<'general' | 'source' | 'streams' | 'goals'>('general');

  const [aiRulesSummary, setAiRulesSummary] = useState<AIRule[]>([]);
  const [domainStats, setDomainStats] = useState<DomainRulesStats | null>(null);
  const [pendingAiSuggestions, setPendingAiSuggestions] = useState<AISuggestion[]>([]);

  const {
    pendingSuggestions,
    loadSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    patterns,
    loadPatterns,
    isLoading,
    error
  } = useAIAssistant({ autoLoadPatterns: false, autoLoadSuggestions: false });

  const loadAutomationData = useCallback(async () => {
    try {
      const [rulesRes, statsRes, suggestionsRes] = await Promise.all([
        aiRulesApi.getRules({ limit: 5 }).catch(() => ({ rules: [], pagination: { total: 0, page: 1, limit: 5, pages: 0 } })),
        emailDomainRulesApi.getStats().catch(() => null),
        aiSuggestionsApi.getSuggestions({ status: 'PENDING', limit: 5 }).catch(() => []),
      ]);
      setAiRulesSummary(rulesRes.rules);
      setDomainStats(statsRes);
      setPendingAiSuggestions(suggestionsRes);
    } catch {
      // Non-critical, ignore
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      loadSuggestions();
      loadPatterns();
    } else if (activeTab === 'settings') {
      loadPatterns();
    } else if (activeTab === 'automation') {
      loadAutomationData();
    }
  }, [activeTab, loadAutomationData]);

  // Demo suggestion zgodna z STREAMS
  const demoSuggestion = {
    suggestedAction: 'SCHEDULE' as const,
    suggestedStream: 'Projekt Website',
    suggestedPriority: 'HIGH' as const,
    suggestedTags: ['pilne', 'spotkanie'],
    suggestedDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    extractedTasks: ['Przygotować prezentację', 'Wysłać zaproszenia'],
    confidence: 85,
    reasoning: 'Na podstawie treści wykryto prośbę o spotkanie. Sugeruję przepłynięcie do strumienia "Projekt Website".'
  };

  const tabs = [
    { id: 'chat' as const, name: 'Chat AI', icon: MessageSquare },
    { id: 'suggestions' as const, name: 'Sugestie', icon: Bot, badge: pendingSuggestions.length || undefined },
    { id: 'automation' as const, name: 'Automatyzacja', icon: Cog },
    { id: 'prompts' as const, name: 'Prompty', icon: FileText },
    { id: 'settings' as const, name: 'Ustawienia', icon: Settings }
  ];

  // Konteksty zgodne z metodologią STREAMS
  const contexts = [
    {
      id: 'general' as const,
      name: 'Ogólne',
      icon: Brain,
      color: 'bg-purple-100 text-purple-700',
      description: 'Analiza całego systemu i rekomendacje'
    },
    {
      id: 'source' as const,
      name: '⚪ Źródło',
      icon: Circle,
      color: 'bg-gray-100 text-gray-700',
      description: 'Analiza i routing elementów ze Źródła'
    },
    {
      id: 'streams' as const,
      name: '🌊 Strumienie',
      icon: Waves,
      color: 'bg-blue-100 text-blue-700',
      description: 'Stan strumieni, dopływy, zamrożone'
    },
    {
      id: 'goals' as const,
      name: '🎯 Cele RZUT',
      icon: Target,
      color: 'bg-green-100 text-green-700',
      description: 'Cele Precyzyjne: Rezultat, Zmierzalność, Ujście, Tło'
    }
  ];

  // Możliwości AI zgodne z Human-in-the-Loop i STREAMS
  const capabilities = [
    {
      icon: Circle,
      title: 'Routing ze Źródła',
      description: 'AI analizuje nowe elementy i sugeruje do którego strumienia skierować'
    },
    {
      icon: Waves,
      title: 'Analiza strumieni',
      description: 'Wykrywanie nieaktywnych strumieni, sugestie zamrożenia/odmrożenia'
    },
    {
      icon: Target,
      title: 'Doradca celów RZUT',
      description: 'Pomoc w definiowaniu celów: Rezultat, Zmierzalność, Ujście, Tło'
    },
    {
      icon: Calendar,
      title: 'Planowanie dnia',
      description: 'Optymalizacja planu dnia wg energii i priorytetów'
    }
  ];

  // Przykładowe pytania zgodne z metodologią STREAMS
  const exampleQuestions = [
    "Co jest w Źródle do przetworzenia?",
    "Które strumienie wymagają uwagi?",
    "Zasugeruj zamrożenie nieaktywnych strumieni",
    "Jak wygląda postęp moich celów RZUT?",
    "Co powinienem zrobić najpierw dzisiaj?"
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🤖 AI Asystent STREAMS</h1>
            <p className="text-gray-600">AI sugeruje → Ty decydujesz → AI się uczy</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Human-in-the-Loop
          </Badge>
          <Badge variant="outline">⚪ Źródło</Badge>
          <Badge variant="outline">🌊 Strumienie</Badge>
          <Badge variant="outline">🎯 Cele RZUT</Badge>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
                {tab.badge && (
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - CHAT */}
      {activeTab === 'chat' && (
        <>
          {/* Context Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Wybierz kontekst analizy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {contexts.map((context) => {
                  const Icon = context.icon;
                  return (
                    <button
                      key={context.id}
                      onClick={() => setSelectedContext(context.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedContext === context.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`inline-flex p-2 rounded-lg ${context.color} mb-2`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium mb-1">{context.name}</h3>
                      <p className="text-sm text-gray-600">{context.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Chat Interface */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <KnowledgeChat context={selectedContext} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Rules Panel */}
              <StreamRulesPanel compact onCreateRule={() => setActiveTab('automation')} />

              {/* Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Możliwości
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {capabilities.map((capability, index) => {
                    const Icon = capability.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{capability.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{capability.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Example Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Przykładowe pytania
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exampleQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 rounded text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        {question}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Tab Content - SUGGESTIONS */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Oczekujące sugestie
            </h2>
            {error ? (
              <Card className="border-red-200">
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-3" />
                  <p className="text-red-600 font-medium">Blad ladowania sugestii</p>
                  <p className="text-sm text-gray-500 mt-1">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => loadSuggestions()}>
                    Sprobuj ponownie
                  </Button>
                </CardContent>
              </Card>
            ) : pendingSuggestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Brak oczekujacych sugestii</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Sugestie pojawia sie gdy AI przeanalizuje nowe elementy ze Zrodla
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingSuggestions.map((suggestion) => (
                <AISuggestionPanel
                  key={suggestion.id}
                  suggestionId={suggestion.id}
                  suggestion={suggestion.suggestion}
                  onAccept={async (id) => {
                    await acceptSuggestion(id);
                    loadSuggestions();
                  }}
                  onReject={async (id) => {
                    await rejectSuggestion(id);
                    loadSuggestions();
                  }}
                />
              ))
            )}

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Przykład sugestii (demo):</p>
              <AISuggestionPanel
                suggestionId="demo-1"
                suggestion={demoSuggestion}
                onAccept={() => console.log('Demo accepted')}
                onReject={() => console.log('Demo rejected')}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Jak działają sugestie?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <p>
                  <strong>Human-in-the-Loop</strong> oznacza, że AI proponuje akcje
                  dotyczące routingu ze Źródła do Strumieni, ale to Ty decydujesz.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>AI analizuje</strong> - Asystent przegląda nowe elementy w Źródle
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Sugeruje strumień</strong> - Proponuje do którego strumienia przepłynie element
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>Ty decydujesz</strong> - Akceptujesz, modyfikujesz lub odrzucasz
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>AI się uczy</strong> - System dostosowuje się do Twoich preferencji
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Zarządzaj regułami</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Twórz reguły które automatycznie generują sugestie routingu.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('automation')}
                    >
                      <Cog className="h-4 w-4 mr-1" />
                      Otwórz Automatyzację
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {patterns && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Statystyki
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wszystkich sugestii:</span>
                    <Badge variant="secondary">{patterns.totalSuggestions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Zaakceptowanych:</span>
                    <Badge variant="outline" className="text-green-600">{patterns.totalAccepted}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wskaźnik akceptacji:</span>
                    <Badge variant="outline">{patterns.acceptanceRate.toFixed(0)}%</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab Content - AUTOMATION */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Cog className="h-6 w-6 text-purple-600" />
                Automatyzacja
              </h2>
              <p className="text-gray-600 mt-1">
                Reguly automatyzacji zintegrowane z AI dla routingu ze Zrodla do Strumieni
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/ai-rules">
                <Button variant="outline" size="sm">
                  <Bot className="h-4 w-4 mr-1" />
                  Reguly AI
                </Button>
              </Link>
              <Link href="/dashboard/ai-rules/domain-lists">
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-1" />
                  Listy domen
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Reguly AI</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {aiRulesSummary.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      {aiRulesSummary.filter(r => r.enabled).length} aktywnych
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Listy domen</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {domainStats?.total || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {domainStats ? `${domainStats.blacklist} czarna / ${domainStats.whitelist} biala / ${domainStats.vip} VIP` : 'Ladowanie...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Sugestie AI</h3>
                    <p className="text-2xl font-bold text-yellow-600">
                      {pendingAiSuggestions.length}
                    </p>
                    <p className="text-xs text-gray-500">oczekujacych na decyzje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending AI Suggestions */}
          {pendingAiSuggestions.length > 0 && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Oczekujace sugestie AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAiSuggestions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-gray-600">{s.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await aiSuggestionsApi.acceptSuggestion(s.id);
                          loadAutomationData();
                        }}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Akceptuj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await aiSuggestionsApi.rejectSuggestion(s.id);
                          loadAutomationData();
                        }}
                      >
                        Odrzuc
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Rules List */}
          {aiRulesSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4 text-purple-600" />
                  Ostatnie reguly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiRulesSummary.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium">{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{rule.executionCount} wykonan</span>
                        <span>{rule.successRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/ai-rules" className="block mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
                  Zobacz wszystkie reguly &rarr;
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stream Rules Panel */}
          <StreamRulesPanel />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Pipeline przetwarzania</h3>
                    <p className="text-sm text-gray-600">
                      4 etapy: CRM &rarr; Listy &rarr; Wzorce &rarr; AI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Routing ze Zrodla</h3>
                    <p className="text-sm text-gray-600">
                      Automatyczne kierowanie elementow do odpowiednich strumieni
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Human-in-the-Loop</h3>
                    <p className="text-sm text-gray-600">
                      AI sugeruje, Ty decydujesz i kontrolujesz
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content - PROMPTS */}
      {activeTab === 'prompts' && (
        <AIPromptsPanel />
      )}

      {/* Tab Content - SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AISettingsPanel />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Poziomy autonomii
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 0 - Wyłączony</p>
                    <p className="text-gray-600">AI nie generuje żadnych sugestii</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-medium">Poziom 1 - Sugestie (domyślny)</p>
                    <p className="text-gray-600">AI sugeruje routing ze Źródła, Ty zatwierdzasz</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 2 - Auto + Log</p>
                    <p className="text-gray-600">AI automatycznie routuje, możesz cofnąć przepływ</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 3 - Auto cicha</p>
                    <p className="text-gray-600">AI działa w tle bez powiadomień</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">
                  <strong>Wskazówka:</strong> Zacznij od poziomu 1 i zwiększaj autonomię
                  gdy zobaczysz, że AI dobrze rozumie Twoje strumienie i preferencje routingu.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4" />
                  Filozofia AI w STREAMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>AI analizuje Źródło i sugeruje strumień docelowy</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Ty zatwierdzasz lub korygjesz przepływ</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>AI uczy się z Twoich korekt</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span>Żadna akcja zewnętrzna bez Twojej zgody</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Info Banner - tylko w tab chat */}
      {activeTab === 'chat' && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">🤖 Asystent, nie Decydent</h3>
                <p className="text-gray-700 mb-3">
                  Ten AI działa według filozofii <strong>Human-in-the-Loop</strong>.
                  Analizuje Twoje Źródło, strumienie i cele RZUT, ale to Ty podejmujesz ostateczne decyzje.
                  Każda sugestia ma przyciski: <strong>[✓ Zatwierdź] [✎ Koryguj] [✗ Odrzuć]</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">⚪ Routing ze Źródła</Badge>
                  <Badge variant="secondary">🌊 Analiza strumieni</Badge>
                  <Badge variant="secondary">❄️ Sugestie zamrożenia</Badge>
                  <Badge variant="secondary">🎯 Doradca celów RZUT</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
