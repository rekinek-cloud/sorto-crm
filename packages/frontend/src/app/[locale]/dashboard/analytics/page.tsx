'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { motion } from 'framer-motion';
import GoalRecommendations from '@/components/dashboard/GoalRecommendations';
import ProductivityAnalytics from '@/components/dashboard/ProductivityAnalytics';
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';

const analyticsViews = [
  {
    id: 'productivity',
    name: 'Analiza produktywnosci',
    description: 'Wglad w wzorce pracy oparty na AI',
    icon: BarChart3,
    color: 'blue',
    bgActive: 'bg-blue-50 dark:bg-blue-900/20',
    borderActive: 'border-blue-500 dark:border-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconBgActive: 'bg-blue-500 dark:bg-blue-600',
    iconText: 'text-blue-600 dark:text-blue-400',
    textActive: 'text-blue-900 dark:text-blue-100',
    descActive: 'text-blue-700 dark:text-blue-300',
  },
  {
    id: 'goals',
    name: 'Rekomendacje celow',
    description: 'Spersonalizowane sugestie celow na podstawie aktywnosci',
    icon: Sparkles,
    color: 'purple',
    bgActive: 'bg-purple-50 dark:bg-purple-900/20',
    borderActive: 'border-purple-500 dark:border-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconBgActive: 'bg-purple-500 dark:bg-purple-600',
    iconText: 'text-purple-600 dark:text-purple-400',
    textActive: 'text-purple-900 dark:text-purple-100',
    descActive: 'text-purple-700 dark:text-purple-300',
  },
  {
    id: 'projects',
    name: 'Predykcja sukcesu',
    description: 'Analiza prawdopodobienstwa sukcesu projektow',
    icon: TrendingUp,
    color: 'emerald',
    bgActive: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderActive: 'border-emerald-500 dark:border-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconBgActive: 'bg-emerald-500 dark:bg-emerald-600',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    textActive: 'text-emerald-900 dark:text-emerald-100',
    descActive: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'realtime',
    name: 'KPI w czasie rzeczywistym',
    description: 'Metryki wydajnosci na zywo i alerty',
    icon: Zap,
    color: 'orange',
    bgActive: 'bg-orange-50 dark:bg-orange-900/20',
    borderActive: 'border-orange-500 dark:border-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconBgActive: 'bg-orange-500 dark:bg-orange-600',
    iconText: 'text-orange-600 dark:text-orange-400',
    textActive: 'text-orange-900 dark:text-orange-100',
    descActive: 'text-orange-700 dark:text-orange-300',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const { user, isLoading } = useRequireAuth();
  const [activeView, setActiveView] = useState('productivity');

  if (isLoading) {
    return (
      <PageShell>
        <SkeletonPage />
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'productivity':
        return <ProductivityAnalytics />;
      case 'goals':
        return <GoalRecommendations />;
      case 'projects':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Predykcja sukcesu projektow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ogolny wynik zdrowia portfela */}
              <motion.div
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Wynik zdrowia portfela</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Analiza AI</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">87%</div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Ogolne prawdopodobienstwo sukcesu</p>
                  <div className="mt-4 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div className="bg-emerald-500 dark:bg-emerald-400 h-3 rounded-full transition-all duration-1000" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </motion.div>

              {/* Analiza ryzyka */}
              <motion.div
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Analiza ryzyka</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Dostepnosc zasobow', risk: 'Srednie', color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Presja terminow', risk: 'Wysokie', color: 'text-red-600 dark:text-red-400' },
                    { label: 'Lancuch zaleznosci', risk: 'Niskie', color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Rozszerzanie zakresu', risk: 'Srednie', color: 'text-amber-600 dark:text-amber-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className={`text-sm font-medium ${item.color}`}>{item.risk} ryzyko</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Predykcje poszczegolnych projektow */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Predykcje sukcesu projektow</h3>
              <div className="space-y-4">
                {[
                  { name: 'Modernizacja systemu CRM', probability: 92, risk: 'Niskie', daysLeft: 45, confidence: 'Wysoka' },
                  { name: 'Rozwoj aplikacji mobilnej', probability: 78, risk: 'Srednie', daysLeft: 67, confidence: 'Srednia' },
                  { name: 'Projekt migracji danych', probability: 65, risk: 'Wysokie', daysLeft: 23, confidence: 'Srednia' },
                  { name: 'Wdrozenie audytu bezpieczenstwa', probability: 89, risk: 'Niskie', daysLeft: 12, confidence: 'Wysoka' },
                ].map((project, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="p-4 bg-slate-50/80 dark:bg-slate-700/30 border border-slate-200/50 dark:border-slate-600/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          project.risk === 'Niskie' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          project.risk === 'Srednie' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {project.risk} ryzyko
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{project.daysLeft} dni</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400 text-xs">Prawdopodobienstwo sukcesu</span>
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-xs">{project.probability}%</span>
                        </div>
                        <div className="bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              project.probability >= 80 ? 'bg-emerald-500 dark:bg-emerald-400' :
                              project.probability >= 60 ? 'bg-amber-500 dark:bg-amber-400' :
                              'bg-red-500 dark:bg-red-400'
                            }`}
                            style={{ width: `${project.probability}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Pewnosc AI</div>
                        <div className={`text-sm font-medium ${
                          project.confidence === 'Wysoka' ? 'text-emerald-600 dark:text-emerald-400' :
                          project.confidence === 'Srednia' ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {project.confidence}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Rekomendacje ML */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-500 dark:bg-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Rekomendacje ML</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300">Rozwaz przeniesienie zasobow z audytu bezpieczenstwa do migracji danych dla lepszych wynikow</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Projekt aplikacji mobilnej wykazuje oznaki rozszerzania zakresu - zalecane natychmiastowe uzgodnienie z interesariuszami</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Projekt CRM jest na dobrej drodze do wczesnego ukonczenia - rozwaz przyspieszenie zaleznych projektow</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      case 'realtime':
        return (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* KPI na zywo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Aktywne zadania', value: '23', change: '+2', changeLabel: 'od wczoraj',
                  changeColor: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-400',
                  icon: CheckCircle2
                },
                {
                  label: 'Wskaznik ukonczenia', value: '87%', change: '+5%', changeLabel: 'ten tydzien',
                  changeColor: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-blue-400',
                  icon: Target
                },
                {
                  label: 'Czas skupienia', value: '5.2h', change: '-0.8h', changeLabel: 'dzisiaj',
                  changeColor: 'text-red-600 dark:text-red-400', dotColor: 'bg-purple-400',
                  icon: Clock
                },
                {
                  label: 'Predkosc projektu', value: '12.4', change: '+1.2', changeLabel: 'pkt/tydzien',
                  changeColor: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-orange-400',
                  icon: Activity
                },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.label}</h3>
                      </div>
                      <div className={`w-2 h-2 ${kpi.dotColor} rounded-full animate-pulse`}></div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{kpi.value}</div>
                    <div className="flex items-center text-xs">
                      <span className={kpi.changeColor}>{kpi.change}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1">{kpi.changeLabel}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Aktywnosc w czasie rzeczywistym */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Aktywnosc na zywo</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ostatnia aktualizacja: teraz</span>
                </div>
                <div className="space-y-3">
                  {[
                    { time: '2 min temu', action: 'Zadanie ukonczone', item: 'Przeglad budzetu Q4', type: 'success' },
                    { time: '5 min temu', action: 'Projekt zaktualizowany', item: 'Modernizacja CRM', type: 'info' },
                    { time: '8 min temu', action: 'Spotkanie rozpoczete', item: 'Tygodniowa synchronizacja zespolu', type: 'warning' },
                    { time: '12 min temu', action: 'Zadanie utworzone', item: 'Przygotuj prezentacje dla klienta', type: 'info' },
                    { time: '15 min temu', action: 'Cel osiagniety', item: 'Ukonczenie 80% tygodniowych zadan', type: 'success' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'success' ? 'bg-emerald-400' :
                        activity.type === 'warning' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-slate-100">{activity.action}: <span className="font-medium">{activity.item}</span></p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Alerty wydajnosci */}
              <motion.div
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Inteligentne alerty</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">3 aktywne</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-200">Projekt zagrozony</p>
                        <p className="text-xs text-red-700 dark:text-red-300">Projekt migracji danych jest 3 dni za harmonogramem</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Niski czas skupienia</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">Dzisiejszy czas skupienia jest 40% ponizej sredniej</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Zaległe zadania</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">5 zadan przekroczylo termin wykonania</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Wykres produktywnosci w czasie rzeczywistym */}
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Dzisiejsza krzywa produktywnosci</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Aktualizacja na zywo</span>
                </div>
              </div>

              {/* Prosty wykres produktywnosci */}
              <div className="h-64 flex items-end gap-1">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i;
                  const currentHour = new Date().getHours();
                  const height = Math.random() * 80 + 20;
                  const isCurrentHour = hour === currentHour;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isCurrentHour ? 'bg-blue-500 dark:bg-blue-400 animate-pulse' :
                          hour <= currentHour ? 'bg-blue-300 dark:bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {hour.toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Szczytowe godziny produktywnosci: <span className="font-medium text-slate-900 dark:text-slate-100">9:00 - 11:00</span>
                </p>
              </div>
            </motion.div>

            {/* Status systemu */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500 dark:bg-emerald-600 rounded-xl">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Silnik analityki czasu rzeczywistego</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Wszystkie systemy operacyjne &middot; Ostatnia aktualizacja: {new Date().toLocaleTimeString('pl-PL')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">99.9% uptime</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Czas odpowiedzi: 45ms</div>
                  </div>
                  <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      default:
        return <ProductivityAnalytics />;
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Analityka"
        subtitle="Wglad w produktywnosc i trendy AI"
        icon={BarChart3}
        iconColor="text-cyan-600"
        breadcrumbs={[{ label: 'Analityka' }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              AI Online
            </span>
          </div>
        }
      />

      {/* Nawigacja zakladek */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {analyticsViews.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;

            return (
              <motion.button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? `${view.borderActive} ${view.bgActive}`
                    : 'border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? `${view.iconBgActive} text-white`
                        : `${view.iconBg} ${view.iconText}`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium text-sm transition-colors ${
                        isActive ? view.textActive : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {view.name}
                    </h3>
                    <p
                      className={`text-xs mt-1 transition-colors ${
                        isActive ? view.descActive : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {view.description}
                    </p>
                  </div>
                </div>

                {/* Wskaznik aktywnej zakladki */}
                {isActive && (
                  <motion.div
                    className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${
                      view.color === 'blue' ? 'bg-blue-500' :
                      view.color === 'purple' ? 'bg-purple-500' :
                      view.color === 'emerald' ? 'bg-emerald-500' :
                      'bg-orange-500'
                    }`}
                    layoutId="activeAnalyticsTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Zawartosc aktywnego widoku */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderActiveView()}
      </motion.div>

      {/* Informacja o mozliwosciach AI */}
      <motion.div
        className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Zasilane zaawansowanym AI
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Nasz silnik analityczny wykorzystuje algorytmy uczenia maszynowego do analizy wzorcow produktywnosci,
              przewidywania wynikow projektow i rekomendowania spersonalizowanych celow dla maksymalnej efektywnosci.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Rozpoznawanie wzorcow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Analityka predykcyjna</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Spersonalizowane wglady</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
}
