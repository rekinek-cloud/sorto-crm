'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KnowledgeChat } from '@/components/ai/KnowledgeChat';
import { AISettingsPanel } from '@/components/ai/AISettingsPanel';
import { AISuggestionPanel } from '@/components/ai/AISuggestionPanel';
import { StreamRulesPanel } from '@/components/ai/StreamRulesPanel';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import {
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  MessageSquare,
  Users,
  DollarSign,
  Clock,
  Settings,
  Bot,
  Inbox,
  Cog,
  GitBranch
} from 'lucide-react';

type TabType = 'chat' | 'suggestions' | 'automation' | 'settings';

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedContext, setSelectedContext] = useState<'general' | 'projects' | 'deals' | 'tasks'>('general');

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

  useEffect(() => {
    if (activeTab === 'suggestions') {
      loadSuggestions();
      loadPatterns();
    } else if (activeTab === 'settings') {
      loadPatterns();
    }
  }, [activeTab]);

  const demoSuggestion = {
    suggestedAction: 'SCHEDULE' as const,
    suggestedStream: 'Praca',
    suggestedPriority: 'HIGH' as const,
    suggestedTags: ['pilne', 'spotkanie'],
    suggestedDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    extractedTasks: ['Przygotować prezentację', 'Wysłać zaproszenia'],
    confidence: 85,
    reasoning: 'Na podstawie treści e-maila wykryto prośbę o spotkanie. Sugerowane zaplanowanie na podstawie kalendarza.'
  };

  const tabs = [
    { id: 'chat' as const, name: 'Chat AI', icon: MessageSquare },
    { id: 'suggestions' as const, name: 'Sugestie', icon: Bot, badge: pendingSuggestions.length || undefined },
    { id: 'automation' as const, name: 'Automatyzacja', icon: Cog },
    { id: 'settings' as const, name: 'Ustawienia', icon: Settings }
  ];

  const contexts = [
    {
      id: 'general' as const,
      name: 'Ogólne',
      icon: Brain,
      color: 'bg-blue-100 text-blue-700',
      description: 'Ogólna analiza biznesowa i raporty'
    },
    {
      id: 'projects' as const,
      name: 'Projekty',
      icon: Target,
      color: 'bg-blue-100 text-blue-700',
      description: 'Analiza ryzyka i rekomendacje projektowe'
    },
    {
      id: 'deals' as const,
      name: 'Sprzedaż',
      icon: DollarSign,
      color: 'bg-blue-100 text-blue-700',
      description: 'Pipeline sprzedażowy i prognozy'
    },
    {
      id: 'tasks' as const,
      name: 'Zadania',
      icon: Zap,
      color: 'bg-blue-100 text-blue-700',
      description: 'Priorytetyzacja i produktywność'
    }
  ];

  const capabilities = [
    {
      icon: TrendingUp,
      title: 'Analiza predykcyjna',
      description: 'Przewidywanie sukcesu projektów i prawdopodobieństwa zamknięcia transakcji'
    },
    {
      icon: BarChart3,
      title: 'Analiza ryzyka',
      description: 'Identyfikacja zagrożonych projektów i potencjalnych problemów'
    },
    {
      icon: Sparkles,
      title: 'Rekomendacje',
      description: 'Spersonalizowane sugestie na podstawie wzorców danych'
    },
    {
      icon: MessageSquare,
      title: 'Język naturalny',
      description: 'Zadawaj pytania po polsku i otrzymuj szczegółowe odpowiedzi'
    }
  ];

  const exampleQuestions = [
    "Które projekty są zagrożone opóźnieniem?",
    "Co powinienem zrobić najpierw jutro?",
    "Jakie transakcje mają największą szansę na zamknięcie?",
    "Jak wygląda moja produktywność w tym tygodniu?",
    "Które zadania są po terminie?"
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600">Inteligentny asystent do analizy danych</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Analiza AI
          </Badge>
          <Badge variant="outline">
            Język naturalny
          </Badge>
          <Badge variant="outline">
            Human-in-the-Loop
          </Badge>
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
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
                {tab.badge && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
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
                          ? 'border-blue-500 bg-blue-50'
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
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Możliwości
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {capabilities.map((capability, index) => {
                    const Icon = capability.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
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
                    <MessageSquare className="h-5 w-5 text-blue-600" />
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

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Oczekujące sugestie
            </h2>
            {pendingSuggestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Brak oczekujących sugestii</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Sugestie pojawią się gdy AI przeanalizuje nowe elementy
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
                  <Bot className="h-5 w-5 text-blue-600" />
                  Jak działają sugestie?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <p>
                  <strong>Human-in-the-Loop</strong> oznacza, że AI proponuje akcje,
                  ale to Ty decydujesz co z nimi zrobić.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>AI analizuje</strong> - Asystent przegląda nowe elementy
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Reguły działają</strong> - Automatyzacje generują propozycje
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>Ty decydujesz</strong> - Akceptujesz, modyfikujesz lub odrzucasz
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>AI się uczy</strong> - System dostosowuje się do preferencji
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Zarządzaj regułami</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Twórz reguły które automatycznie generują sugestie.
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
                    <BarChart3 className="h-5 w-5 text-blue-600" />
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

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Cog className="h-6 w-6 text-blue-600" />
                Automatyzacja
              </h2>
              <p className="text-gray-600 mt-1">
                Reguły automatyzacji zintegrowane z AI
              </p>
            </div>
          </div>

          <StreamRulesPanel />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Reguły AI</h3>
                    <p className="text-sm text-gray-600">
                      AI analizuje treść i automatycznie klasyfikuje elementy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Routing</h3>
                    <p className="text-sm text-gray-600">
                      Automatyczne przypisywanie do odpowiednich kategorii
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Workflow</h3>
                    <p className="text-sm text-gray-600">
                      Złożone automatyzacje z wieloma krokami
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AISettingsPanel />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Poziomy autonomii
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 0 - Wyłączony</p>
                    <p className="text-gray-600">AI nie generuje żadnych sugestii</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium">Poziom 1 - Sugestie (domyślny)</p>
                    <p className="text-gray-600">AI sugeruje, Ty zatwierdzasz każdą akcję</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 2 - Auto + Log</p>
                    <p className="text-gray-600">AI wykonuje akcje automatycznie, możesz je cofnąć</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Poziom 3 - Auto cicha</p>
                    <p className="text-gray-600">AI działa w tle bez powiadomień</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">
                  <strong>Wskazówka:</strong> Zacznij od poziomu 1 i zwiększaj autonomię
                  gdy zobaczysz, że AI dobrze rozumie Twoje preferencje.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Automatyzacja</h3>
                    <p className="text-sm text-gray-700 mb-2">
                      Wszystkie reguły są dostępne w zakładce Automatyzacja powyżej.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('automation')}
                    >
                      <Cog className="h-4 w-4 mr-1" />
                      Przejdź do Automatyzacji
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Info Banner - only show on chat tab */}
      {activeTab === 'chat' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Inteligentna analiza danych</h3>
                <p className="text-gray-700 mb-3">
                  Asystent AI analizuje dane z całej bazy i odpowiada na pytania
                  w naturalnym języku. Automatyzacje generują sugestie, które zatwierdzasz w jednym miejscu.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Analiza predykcyjna</Badge>
                  <Badge variant="secondary">Raporty w czasie rzeczywistym</Badge>
                  <Badge variant="secondary">Human-in-the-Loop</Badge>
                  <Badge variant="secondary">Automatyzacja</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
