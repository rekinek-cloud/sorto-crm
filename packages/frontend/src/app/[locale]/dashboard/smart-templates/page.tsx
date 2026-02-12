'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Trophy,
  Briefcase,
  Heart,
  GraduationCap,
  DollarSign,
  Users,
  RefreshCw,
  Search,
  Target,
  Rocket,
  LayoutTemplate,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';

interface GoalTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  template: {
    title: string;
    description: string;
    timeframe: string;
    measurableMetrics: string[];
    keyMilestones: string[];
    successCriteria: string[];
  };
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  usageCount: number;
  lastUsed?: string;
}

interface CustomTemplate {
  name: string;
  category: string;
  description: string;
  title: string;
  templateDescription: string;
  timeframe: string;
  metrics: string;
  milestones: string;
  criteria: string;
}

export default function SmartTemplatesPage() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplate, setNewTemplate] = useState<CustomTemplate>({
    name: '',
    category: 'Biznes',
    description: '',
    title: '',
    templateDescription: '',
    timeframe: '',
    metrics: '',
    milestones: '',
    criteria: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setTimeout(() => {
      const mockTemplates: GoalTemplate[] = [
        {
          id: '1',
          name: 'Wzrost przychodów',
          category: 'Biznes',
          description: 'Zwiększenie przychodów firmy poprzez strategiczne inicjatywy',
          icon: DollarSign,
          iconColor: '#10b981',
          template: {
            title: 'Zwiększyć przychody z [PRODUKT/USŁUGA] o [X]% w [OKRESIE]',
            description: 'Osiągnąć [KONKRETNĄ KWOTĘ] przychodów ze sprzedaży [PRODUKTU/USŁUGI] wdrażając [STRATEGIĘ] i docierając do [RYNKU DOCELOWEGO] poprzez [KANAŁY]',
            timeframe: '[X] miesięcy/kwartałów',
            measurableMetrics: [
              'Miesięczny przychód powtarzalny (MRR)',
              'Procentowy wzrost całkowitych przychodów',
              'Koszt pozyskania klienta (CAC)',
              'Średnia wartość zamówienia (AOV)',
              'Poprawa wskaźnika konwersji'
            ],
            keyMilestones: [
              'Q1: Uruchomienie nowych kampanii marketingowych',
              'Q2: Osiągnięcie 50% docelowego wzrostu',
              'Q3: Optymalizacja strategii cenowej',
              'Q4: Osiągnięcie pełnego celu przychodowego'
            ],
            successCriteria: [
              'Przychody wzrosły o docelowy procent',
              'Utrzymanie lub poprawa marż zysku',
              'Ocena satysfakcji klientów powyżej 8/10',
              'Ustanowienie zrównoważonej trajektorii wzrostu'
            ]
          },
          estimatedDuration: '6-12 miesięcy',
          difficulty: 'Intermediate',
          usageCount: 47,
          lastUsed: new Date(Date.now() - 864000000).toISOString()
        },
        {
          id: '2',
          name: 'Zdrowie i fitness',
          category: 'Osobiste',
          description: 'Osiągnięcie konkretnych celów zdrowotnych i fitnessowych',
          icon: Heart,
          iconColor: '#ef4444',
          template: {
            title: 'Osiągnąć [KONKRETNY CEL FITNESS] do [DATY]',
            description: 'Osiągnąć [KONKRETNY MIERZALNY CEL] poprzez regularne [ĆWICZENIA] i [PLAN ŻYWIENIA] śledząc postępy za pomocą [METODY POMIARU]',
            timeframe: '[X] tygodni/miesięcy',
            measurableMetrics: [
              'Utrata/przyrost wagi w kg',
              'Procent tkanki tłuszczowej',
              'Częstotliwość treningów tygodniowo',
              'Metryki wydajności (powtórzenia, czas, dystans)',
              'Poziom energii (skala 1-10)'
            ],
            keyMilestones: [
              'Tydzień 4: Ustanowienie stałej rutyny',
              'Tydzień 8: Osiągnięcie 50% celu',
              'Tydzień 12: Osiągnięcie 75% celu',
              'Tydzień 16: Osiągnięcie pełnego celu'
            ],
            successCriteria: [
              'Docelowa waga/pomiar osiągnięty',
              'Zrównoważone nawyki ustanowione',
              'Poprawa ogólnych wskaźników zdrowia',
              'Utrzymanie motywacji i konsekwencji'
            ]
          },
          estimatedDuration: '3-6 miesięcy',
          difficulty: 'Beginner',
          usageCount: 89,
          lastUsed: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '3',
          name: 'Rozwój umiejętności',
          category: 'Zawodowe',
          description: 'Opanowanie nowych umiejętności zawodowych lub technologii',
          icon: GraduationCap,
          iconColor: '#3b82f6',
          template: {
            title: 'Opanować [UMIEJĘTNOŚĆ/TECHNOLOGIĘ] do poziomu [BIEGŁOŚCI] do [DATY]',
            description: 'Rozwinąć ekspertyzę w [KONKRETNEJ UMIEJĘTNOŚCI] poprzez [METODĘ NAUKI] i wykazać biegłość przez [KONKRETNY WYNIK/PROJEKT]',
            timeframe: '[X] miesięcy',
            measurableMetrics: [
              'Ukończenie certyfikacji',
              'Elementy portfolio projektów',
              'Oceny rówieśników/mentora',
              'Wskaźnik sukcesu praktycznego zastosowania',
              'Wyniki testów wiedzy'
            ],
            keyMilestones: [
              'Miesiąc 1: Ukończenie nauki podstaw',
              'Miesiąc 2: Budowa pierwszego praktycznego projektu',
              'Miesiąc 3: Pozyskanie feedbacku i iteracja',
              'Miesiąc 4: Osiągnięcie certyfikacji/oceny'
            ],
            successCriteria: [
              'Certyfikacja lub formalne uznanie osiągnięte',
              'Pomyślne zastosowanie umiejętności w realnym projekcie',
              'Pozytywny feedback od rówieśników/mentorów',
              'Pewność do uczenia lub mentoringu innych'
            ]
          },
          estimatedDuration: '3-6 miesięcy',
          difficulty: 'Intermediate',
          usageCount: 65,
          lastUsed: new Date(Date.now() - 432000000).toISOString()
        },
        {
          id: '4',
          name: 'Premiera produktu',
          category: 'Biznes',
          description: 'Pomyślne uruchomienie nowego produktu lub usługi',
          icon: Rocket,
          iconColor: '#8b5cf6',
          template: {
            title: 'Uruchomić [NAZWA PRODUKTU] i osiągnąć [METRYKĘ SUKCESU] do [DATY]',
            description: 'Pomyślnie opracować, przetestować i uruchomić [PRODUKT] skierowany do [ODBIORCÓW] z celami [KONKRETNE METRYKI] w ciągu [OKRESU]',
            timeframe: '[X] miesięcy od koncepcji do premiery',
            measurableMetrics: [
              'Ukończone kamienie milowe rozwoju produktu',
              'Oceny feedbacku użytkowników beta',
              'Rejestracje/sprzedaż w dniu premiery',
              'Oceny satysfakcji klientów',
              'Wskaźnik penetracji rynku'
            ],
            keyMilestones: [
              'Faza 1: Rozwój i testowanie produktu',
              'Faza 2: Wydanie beta i feedback',
              'Faza 3: Uruchomienie kampanii marketingowej',
              'Faza 4: Oficjalna premiera produktu'
            ],
            successCriteria: [
              'Produkt spełnia standardy jakości',
              'Cele premierowe osiągnięte',
              'Pozytywne przyjęcie na rynku',
              'Zrównoważone pozyskiwanie klientów'
            ]
          },
          estimatedDuration: '9-18 miesięcy',
          difficulty: 'Advanced',
          usageCount: 23,
          lastUsed: new Date(Date.now() - 1296000000).toISOString()
        },
        {
          id: '5',
          name: 'Budowanie zespołu',
          category: 'Przywództwo',
          description: 'Budowanie i rozwijanie wysoko wydajnych zespołów',
          icon: Users,
          iconColor: '#f59e0b',
          template: {
            title: 'Zbudować wysoko wydajny zespół [TYP ZESPOŁU] o wielkości [ROZMIAR] do [DATY]',
            description: 'Zrekrutować, rozwinąć i zoptymalizować zespół [ROZMIAR] osiągający [METRYKI WYDAJNOŚCI] przy utrzymaniu [CELÓW KULTUROWYCH]',
            timeframe: '[X] miesięcy',
            measurableMetrics: [
              'Wyniki wydajności zespołu',
              'Oceny satysfakcji pracowników',
              'Wskaźnik retencji',
              'Wskaźnik realizacji celów',
              'Indeks współpracy zespołowej'
            ],
            keyMilestones: [
              'Miesiąc 1: Zdefiniowanie ról i rekrutacja',
              'Miesiąc 2: Onboarding i szkolenie zespołu',
              'Miesiąc 3: Ustanowienie procesów i kultury',
              'Miesiąc 6: Osiągnięcie docelowej wydajności'
            ],
            successCriteria: [
              'Wszystkie stanowiska obsadzone jakościowymi kandydatami',
              'Zespół osiąga cele wydajnościowe',
              'Wysokie oceny satysfakcji pracowników',
              'Silna kultura zespołowa ustanowiona'
            ]
          },
          estimatedDuration: '6-12 miesięcy',
          difficulty: 'Advanced',
          usageCount: 31,
          lastUsed: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: '6',
          name: 'Kształtowanie nawyków',
          category: 'Osobiste',
          description: 'Ustanowienie pozytywnych codziennych nawyków',
          icon: RefreshCw,
          iconColor: '#06b6d4',
          template: {
            title: 'Ustanowić rutynę [NAWYK] z częstotliwością [CZĘSTOTLIWOŚĆ] przez [CZAS]',
            description: 'Zbudować zrównoważoną praktykę [NAWYK] wykonywaną [CZĘSTOTLIWOŚĆ] i śledzoną przez [METODĘ] aby osiągnąć [KORZYŚĆ/WYNIK]',
            timeframe: '[X] dni/tygodni',
            measurableMetrics: [
              'Dzienny wskaźnik realizacji (%)',
              'Tygodniowy wynik konsekwencji',
              'Miesięczna ocena siły nawyku',
              'Pomiary wyników',
              'Integracja ze stosem nawyków'
            ],
            keyMilestones: [
              'Tydzień 1: Skupienie na codziennym wykonaniu',
              'Tydzień 3: Ustanowienie sygnału nawyku',
              'Tydzień 6: Automatyczny wzorzec zachowania',
              'Tydzień 12: Trwała integracja nawyku'
            ],
            successCriteria: [
              'Nawyk wykonywany konsekwentnie przez docelowy okres',
              'Automatyczne zachowanie bez świadomego wysiłku',
              'Pozytywny wpływ na pożądany wynik',
              'Integracja z istniejącymi rutynami'
            ]
          },
          estimatedDuration: '66-90 dni',
          difficulty: 'Beginner',
          usageCount: 156,
          lastUsed: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      setTemplates(mockTemplates);
      setIsLoading(false);
    }, 500);
  };

  const categories = ['all', 'Biznes', 'Osobiste', 'Zawodowe', 'Przywództwo'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);

    setTemplates(prev => prev.map(t =>
      t.id === template.id
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
        : t
    ));
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error('Nazwa szablonu jest wymagana');
      return;
    }

    const template: GoalTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      category: newTemplate.category,
      description: newTemplate.description,
      icon: Target,
      iconColor: '#6b7280',
      template: {
        title: newTemplate.title,
        description: newTemplate.templateDescription,
        timeframe: newTemplate.timeframe,
        measurableMetrics: newTemplate.metrics.split('\n').filter(m => m.trim()),
        keyMilestones: newTemplate.milestones.split('\n').filter(m => m.trim()),
        successCriteria: newTemplate.criteria.split('\n').filter(c => c.trim())
      },
      estimatedDuration: 'Niestandardowy',
      difficulty: 'Intermediate',
      usageCount: 0
    };

    setTemplates(prev => [template, ...prev]);
    setNewTemplate({
      name: '',
      category: 'Biznes',
      description: '',
      title: '',
      templateDescription: '',
      timeframe: '',
      metrics: '',
      milestones: '',
      criteria: ''
    });
    setShowCreateModal(false);
    toast.success('Szablon niestandardowy utworzony!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'Advanced': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'Początkujący';
      case 'Intermediate': return 'Średniozaawansowany';
      case 'Advanced': return 'Zaawansowany';
      default: return difficulty;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Szablony SMART"
        subtitle="Gotowe szablony do popularnych typów celów"
        icon={LayoutTemplate}
        iconColor="text-purple-600"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Utwórz szablon
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategoria:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Wszystkie kategorie' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Szukaj szablonów..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleUseTemplate(template)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: template.iconColor }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{template.name}</h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{template.category}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(template.difficulty)}`}>
                  {getDifficultyLabel(template.difficulty)}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{template.description}</p>

              <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Czas trwania:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{template.estimatedDuration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Użyto:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{template.usageCount} razy</span>
                </div>
                {template.lastUsed && (
                  <div className="flex items-center justify-between">
                    <span>Ostatnio użyto:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(template.lastUsed)}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Użyj szablonu
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-12 text-center">
          <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Nie znaleziono szablonów</h3>
          <p className="text-slate-600 dark:text-slate-400">Spróbuj dostosować kryteria wyszukiwania lub filtrowania</p>
        </div>
      )}

      {/* Template Detail Modal */}
      <AnimatePresence>
        {showTemplateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: selectedTemplate.iconColor }}
                    >
                      {React.createElement(selectedTemplate.icon, { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTemplate.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Szablon {selectedTemplate.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Szablon tytułu celu</h4>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg font-mono text-sm">
                    {selectedTemplate.template.title}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Szablon opisu</h4>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg font-mono text-sm">
                    {selectedTemplate.template.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Mierzalne metryki</h4>
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {selectedTemplate.template.measurableMetrics.map((metric, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-indigo-600 dark:text-indigo-400 mr-2">&#8226;</span>
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Kluczowe kamienie milowe</h4>
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {selectedTemplate.template.keyMilestones.map((milestone, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 dark:text-green-400 mr-2">&#8226;</span>
                          {milestone}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Kryteria sukcesu</h4>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {selectedTemplate.template.successCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Czas trwania</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{selectedTemplate.estimatedDuration}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Trudność</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{getDifficultyLabel(selectedTemplate.difficulty)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Liczba użyć</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{selectedTemplate.usageCount}</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Zamknij
                </button>
                <button
                  onClick={() => {
                    toast.success('Szablon skopiowany! Utwórz cel na jego podstawie.');
                    setShowTemplateModal(false);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Użyj tego szablonu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Template Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utwórz niestandardowy szablon</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nazwa szablonu *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="np. Kampania marketingowa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Kategoria
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Biznes">Biznes</option>
                      <option value="Osobiste">Osobiste</option>
                      <option value="Zawodowe">Zawodowe</option>
                      <option value="Przywództwo">Przywództwo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Opis
                  </label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="Krótki opis tego szablonu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Szablon tytułu celu
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="np. Uruchomić [PRODUKT] i osiągnąć [METRYKĘ] do [DATY]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Szablon opisu
                  </label>
                  <textarea
                    value={newTemplate.templateDescription}
                    onChange={(e) => setNewTemplate({ ...newTemplate, templateDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={3}
                    placeholder="Szczegółowy szablon opisu z placeholderami"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mierzalne metryki (jedna na linię)
                  </label>
                  <textarea
                    value={newTemplate.metrics}
                    onChange={(e) => setNewTemplate({ ...newTemplate, metrics: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={4}
                    placeholder={"Procentowy wzrost przychodów\nWskaźnik pozyskania klientów\nMetryki zaangażowania użytkowników"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kluczowe kamienie milowe (jeden na linię)
                  </label>
                  <textarea
                    value={newTemplate.milestones}
                    onChange={(e) => setNewTemplate({ ...newTemplate, milestones: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={4}
                    placeholder={"Miesiąc 1: Ukończenie planowania\nMiesiąc 2: Uruchomienie wersji beta\nMiesiąc 3: Pełne wdrożenie"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Kryteria sukcesu (jedno na linię)
                  </label>
                  <textarea
                    value={newTemplate.criteria}
                    onChange={(e) => setNewTemplate({ ...newTemplate, criteria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    rows={3}
                    placeholder={"Docelowe metryki osiągnięte\nStandardy jakości spełnione\nSatysfakcja interesariuszy utrzymana"}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  disabled={!newTemplate.name.trim()}
                >
                  Utwórz szablon
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
