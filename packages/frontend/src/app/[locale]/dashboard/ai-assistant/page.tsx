'use client';

/**
 * AI Asystent STREAMS
 * Zgodny z filozofia Human-in-the-Loop z spec_ai.md
 *
 * Zasada nadrzedna:
 * AI SUGERUJE -> CZLOWIEK DECYDUJE -> AI SIE UCZY
 * Zadna akcja zewnetrzna bez zatwierdzenia uzytkownika
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { KnowledgeChat } from '@/components/ai/KnowledgeChat';
import { AISuggestionPanel } from '@/components/ai/AISuggestionPanel';
import { AIPersonalSettings } from '@/components/ai/AIPersonalSettings';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  BarChart3,
  Target,
  MessageSquare,
  Waves,
  Circle,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
  Bot,
  Inbox,
  Cog
} from 'lucide-react';

type TabType = 'chat' | 'suggestions' | 'settings';

const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedContext, setSelectedContext] = useState<'general' | 'source' | 'streams' | 'goals'>('general');

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
    suggestedStream: 'Projekt Website',
    suggestedPriority: 'HIGH' as const,
    suggestedTags: ['pilne', 'spotkanie'],
    suggestedDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    extractedTasks: ['Przygotowac prezentacje', 'Wyslac zaproszenia'],
    confidence: 85,
    reasoning: 'Na podstawie tresci wykryto prosbe o spotkanie. Sugeruje przeplyniecje do strumienia "Projekt Website".'
  };

  const tabs = [
    { id: 'chat' as const, name: 'Chat AI', icon: MessageSquare },
    { id: 'suggestions' as const, name: 'Sugestie', icon: Bot, badge: pendingSuggestions.length || undefined },
    { id: 'settings' as const, name: 'Ustawienia', icon: Settings }
  ];

  const contexts = [
    {
      id: 'general' as const,
      name: 'Ogolne',
      icon: Brain,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      description: 'Analiza calego systemu i rekomendacje'
    },
    {
      id: 'source' as const,
      name: 'Zrodlo',
      icon: Circle,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      description: 'Analiza i routing elementow ze Zrodla'
    },
    {
      id: 'streams' as const,
      name: 'Strumienie',
      icon: Waves,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      description: 'Stan strumieni, doplywy, zamrozone'
    },
    {
      id: 'goals' as const,
      name: 'Cele RZUT',
      icon: Target,
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      description: 'Cele Precyzyjne: Rezultat, Zmierzalnosc, Ujscie, Tlo'
    }
  ];

  const capabilities = [
    {
      icon: Circle,
      title: 'Routing ze Zrodla',
      description: 'AI analizuje nowe elementy i sugeruje do ktorego strumienia skierowac'
    },
    {
      icon: Waves,
      title: 'Analiza strumieni',
      description: 'Wykrywanie nieaktywnych strumieni, sugestie zamrozenia/odmrozenia'
    },
    {
      icon: Target,
      title: 'Doradca celow RZUT',
      description: 'Pomoc w definiowaniu celow: Rezultat, Zmierzalnosc, Ujscie, Tlo'
    },
    {
      icon: Calendar,
      title: 'Planowanie dnia',
      description: 'Optymalizacja planu dnia wg energii i priorytetow'
    }
  ];

  const exampleQuestions = [
    "Co jest w Zrodle do przetworzenia?",
    "Ktore strumienie wymagaja uwagi?",
    "Zasugeruj zamrozenie nieaktywnych strumieni",
    "Jak wyglada postep moich celow RZUT?",
    "Co powinienem zrobic najpierw dzisiaj?"
  ];

  return (
    <PageShell>
      <PageHeader
        title="AI Asystent"
        subtitle="Chat, sugestie i ustawienia osobiste AI"
        icon={Brain}
        iconColor="text-violet-600"
        breadcrumbs={[{ label: 'AI Asystent' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Human-in-the-Loop
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              Zrodlo
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Waves className="h-3 w-3" />
              Strumienie
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Cele RZUT
            </Badge>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="inline-flex bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
        </motion.div>

        {/* Tab Content - CHAT */}
        {activeTab === 'chat' && (
          <motion.div variants={containerAnimation} initial="hidden" animate="show" className="space-y-6">
            {/* Context Selection */}
            <motion.div variants={itemAnimation}>
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Wybierz kontekst analizy</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {contexts.map((context) => {
                    const Icon = context.icon;
                    return (
                      <button
                        key={context.id}
                        onClick={() => setSelectedContext(context.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedContext === context.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`inline-flex p-2 rounded-lg ${context.color} mb-2`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{context.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{context.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Main Chat Interface */}
            <motion.div variants={itemAnimation} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <KnowledgeChat context={selectedContext as any} />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Capabilities */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Mozliwosci
                  </h3>
                  <div className="space-y-4">
                    {capabilities.map((capability, index) => {
                      const Icon = capability.icon;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">{capability.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{capability.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Example Questions */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    Przykladowe pytania
                  </h3>
                  <div className="space-y-2">
                    {exampleQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info Banner */}
            <motion.div variants={itemAnimation}>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Asystent, nie Decydent
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                      Ten AI dziala wedlug filozofii <strong>Human-in-the-Loop</strong>.
                      Analizuje Twoje Zrodlo, strumienie i cele RZUT, ale to Ty podejmujesz ostateczne decyzje.
                      Kazda sugestia ma przyciski: <strong>[Zatwierdz] [Koryguj] [Odrzuc]</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Circle className="h-3 w-3" /> Routing ze Zrodla
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Waves className="h-3 w-3" /> Analiza strumieni
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Sugestie zamrozenia
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Target className="h-3 w-3" /> Doradca celow RZUT
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tab Content - SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Oczekujace sugestie
              </h2>
              {error ? (
                <div className="bg-white/80 backdrop-blur-xl border border-red-200 dark:border-red-700/30 dark:bg-slate-800/80 rounded-2xl shadow-sm">
                  <div className="py-8 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-3" />
                    <p className="text-red-600 dark:text-red-400 font-medium">Blad ladowania sugestii</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => loadSuggestions()}>
                      Sprobuj ponownie
                    </Button>
                  </div>
                </div>
              ) : pendingSuggestions.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm">
                  <div className="py-8 text-center">
                    <Inbox className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">Brak oczekujacych sugestii</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Sugestie pojawia sie gdy AI przeanalizuje nowe elementy ze Zrodla
                    </p>
                  </div>
                </div>
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
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Przyklad sugestii (demo):</p>
                <AISuggestionPanel
                  suggestionId="demo-1"
                  suggestion={demoSuggestion}
                  onAccept={() => console.log('Demo accepted')}
                  onReject={() => console.log('Demo rejected')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Jak dzialaja sugestie?
                </h3>
                <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>Human-in-the-Loop</strong> oznacza, ze AI proponuje akcje
                    dotyczace routingu ze Zrodla do Strumieni, ale to Ty decydujesz.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <strong>AI analizuje</strong> - Asystent przeglada nowe elementy w Zrodle
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <strong>Sugeruje strumien</strong> - Proponuje do ktorego strumienia przeplynie element
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <strong>Ty decydujesz</strong> - Akceptujesz, modyfikujesz lub odrzucasz
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <strong>AI sie uczy</strong> - System dostosowuje sie do Twoich preferencji
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Zarzadzaj regulami</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      Tworz reguly ktore automatycznie generuja sugestie routingu.
                    </p>
                    <Link href="/dashboard/ai-rules">
                      <Button variant="outline" size="sm">
                        <Cog className="h-4 w-4 mr-1" />
                        Otworz Automatyzacje
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {patterns && (
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Statystyki
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Wszystkich sugestii:</span>
                      <Badge variant="secondary">{patterns.totalSuggestions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Zaakceptowanych:</span>
                      <Badge variant="outline" className="text-green-600">{patterns.totalAccepted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Wskaznik akceptacji:</span>
                      <Badge variant="outline">{patterns.acceptanceRate.toFixed(0)}%</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab Content - SETTINGS */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <AIPersonalSettings />

            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Poziomy autonomii
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Poziom 0 - Wylaczony</p>
                    <p className="text-slate-500 dark:text-slate-400">AI nie generuje zadnych sugestii</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700/30">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Poziom 1 - Sugestie (domyslny)</p>
                    <p className="text-slate-500 dark:text-slate-400">AI sugeruje routing ze Zrodla, Ty zatwierdzasz</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Poziom 2 - Auto + Log</p>
                    <p className="text-slate-500 dark:text-slate-400">AI automatycznie routuje, mozesz cofnac przeplyw</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Poziom 3 - Auto cicha</p>
                    <p className="text-slate-500 dark:text-slate-400">AI dziala w tle bez powiadomien</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-2xl p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Wskazowka:</strong> Zacznij od poziomu 1 i zwiekszaj autonomie
                  gdy zobaczysz, ze AI dobrze rozumie Twoje strumienie i preferencje routingu.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-purple-200 dark:bg-slate-800/80 dark:border-purple-700/30 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Brain className="h-4 w-4" />
                  Filozofia AI w STREAMS
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">AI analizuje Zrodlo i sugeruje strumien docelowy</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">Ty zatwierdzasz lub korygujesz przeplyw</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">AI uczy sie z Twoich korekt</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">Zadna akcja zewnetrzna bez Twojej zgody</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
