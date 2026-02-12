'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  Calendar,
  BarChart3,
  Trophy,
  Rocket,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  SlidersHorizontal,
  Save,
} from 'lucide-react';

interface MonthlyStats {
  completedProjects: number;
  completedTasks: number;
  completedHabits: number;
  overdueTasks: number;
  newAreasIdentified: number;
  productivityScore: number;
}

interface ReviewSection {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

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

export default function MonthlyReviewPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [notes, setNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadMonthlyData();
  }, [currentMonth]);

  const loadMonthlyData = async () => {
    setTimeout(() => {
      setStats({
        completedProjects: 3,
        completedTasks: 127,
        completedHabits: 18,
        overdueTasks: 8,
        newAreasIdentified: 2,
        productivityScore: 78
      });

      setReviewSections([
        { id: 'achievements', title: 'Glowne osiagniecia', completed: false },
        { id: 'projects', title: 'Przeglad projektow', completed: false },
        { id: 'areas', title: 'Obszary odpowiedzialnosci', completed: false },
        { id: 'habits', title: 'Sledzenie nawykow', completed: false },
        { id: 'challenges', title: 'Wyzwania i blokery', completed: false },
        { id: 'lessons', title: 'Wyciagniete wnioski', completed: false },
        { id: 'planning', title: 'Planowanie nastepnego miesiaca', completed: false },
      ]);

      setIsLoading(false);
    }, 500);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  };

  const toggleSection = (sectionId: string) => {
    setReviewSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, completed: !section.completed }
        : section
    ));
  };

  const completedSections = reviewSections.filter(s => s.completed).length;
  const progressPercentage = reviewSections.length > 0 ? (completedSections / reviewSections.length) * 100 : 0;

  const achievementTemplates = [
    "Ukonczony projekt: Redesign strony z wyprzedzeniem harmonogramu",
    "Wdrozenie nowej rutyny porannej z 90% konsekwencja",
    "Poprawa wskaznikow satysfakcji klientow o 15%",
    "Uruchomienie nowej funkcji produktu uzywanej przez 500+ uzytkownikow",
    "Redukcja zaleglosci w zadaniach o 40%"
  ];

  const challengeTemplates = [
    "Zarzadzanie czasem w okresach natezenia pracy",
    "Luki komunikacyjne z czlonkami zespolu zdalnego",
    "Trudnosci w utrzymaniu rownotagi praca-zycie",
    "Wyzwania techniczne z nowymi narzedziami/systemami",
    "Niejasne priorytety prowadzace do przelaczania kontekstu"
  ];

  return (
    <PageShell>
      <PageHeader
        title="Przeglad miesieczny"
        subtitle="Miesieczna analiza i cele strategiczne"
        icon={Calendar}
        iconColor="text-purple-600"
        breadcrumbs={[
          { label: 'Przeglady', href: '/dashboard/reviews' },
          { label: 'Miesieczny' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={currentMonth.getMonth()}
              onChange={(e) => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(parseInt(e.target.value));
                setCurrentMonth(newDate);
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleDateString('pl-PL', { month: 'long' })}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                toast.success('Przeglad miesieczny zapisany!');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Zapisz przeglad
            </button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonPage />
      ) : (
        <motion.div variants={containerAnimation} initial="hidden" animate="show" className="space-y-6">
          {/* Progress Overview */}
          <motion.div variants={itemAnimation}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Postep przegladu</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {completedSections} z {reviewSections.length} sekcji ukonczonych
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reviewSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedSection === section.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : section.completed
                        ? 'border-green-200 dark:border-green-700/30 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {section.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                      )}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Statistics */}
          {stats && (
            <motion.div variants={itemAnimation} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                label="Projekty"
                value={stats.completedProjects}
                icon={Trophy}
                iconColor="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                label="Zadania"
                value={stats.completedTasks}
                icon={CheckCircle}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Nawyki"
                value={stats.completedHabits}
                icon={SlidersHorizontal}
                iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <StatCard
                label="Zalegle"
                value={stats.overdueTasks}
                icon={AlertTriangle}
                iconColor="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400"
              />
              <StatCard
                label="Nowe obszary"
                value={stats.newAreasIdentified}
                icon={Lightbulb}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
              />
              <StatCard
                label="Wynik"
                value={`${stats.productivityScore}%`}
                icon={BarChart3}
                iconColor="text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
              />
            </motion.div>
          )}

          {/* Review Content */}
          <motion.div variants={itemAnimation}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              {selectedSection === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Podsumowanie przegladu</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Wypelnij kazda sekcje przegladu miesiecznego, aby przeanalizowac postepy i zaplanowac nastepny miesiac.
                    Ten kompleksowy przeglad pomoze Ci w optymalizacji produktywnosci.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Najwazniejsze w tym miesiacu</h4>
                      <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Ukonczone {stats?.completedProjects} projekty</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Ukonczone {stats?.completedTasks} zadan</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Utrzymane {stats?.completedHabits} nawykow</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Osiagniety wynik {stats?.productivityScore}%</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Obszary wymagajace uwagi</h4>
                      <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> {stats?.overdueTasks} zaleglych zadan wymaga uwagi</li>
                        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-slate-400" /> Przeglad i aktualizacja priorytetow</li>
                        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-slate-400" /> Identyfikacja nowych obszarow</li>
                        <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-slate-400" /> Plan poprawy nawykow na nastepny miesiac</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'achievements' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Glowne osiagniecia</h3>
                    <button
                      onClick={() => toggleSection('achievements')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'achievements')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'achievements')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie byly Twoje najwieksze sukcesy w tym miesiacu?
                      </label>
                      <textarea
                        value={notes.achievements || ''}
                        onChange={(e) => setNotes(prev => ({...prev, achievements: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Wymien glowne osiagniecia, ukonczone projekty i wazne kamienie milowe..."
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Przyklady osiagniec:</h4>
                      <ul className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                        {achievementTemplates.map((template, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Trophy className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            {template}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'challenges' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wyzwania i blokery</h3>
                    <button
                      onClick={() => toggleSection('challenges')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'challenges')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'challenges')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie przeszkody napotkales?
                      </label>
                      <textarea
                        value={notes.challenges || ''}
                        onChange={(e) => setNotes(prev => ({...prev, challenges: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Opisz wyzwania, blokery i obszary, w ktorych mieles trudnosci..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jak mozesz rozwiazac te wyzwania?
                      </label>
                      <textarea
                        value={notes.solutions || ''}
                        onChange={(e) => setNotes(prev => ({...prev, solutions: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Nakresl potencjalne rozwiazania i strategie na nastepny miesiac..."
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Typowe wyzwania:</h4>
                      <ul className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                        {challengeTemplates.map((template, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            {template}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'planning' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Planowanie nastepnego miesiaca</h3>
                    <button
                      onClick={() => toggleSection('planning')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'planning')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'planning')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Top 3 priorytety na nastepny miesiac
                        </label>
                        <textarea
                          value={notes.priorities || ''}
                          onChange={(e) => setNotes(prev => ({...prev, priorities: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="1. Priorytet pierwszy...&#10;2. Priorytet drugi...&#10;3. Priorytet trzeci..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Nowe projekty do rozpoczecia
                        </label>
                        <textarea
                          value={notes.newProjects || ''}
                          onChange={(e) => setNotes(prev => ({...prev, newProjects: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Lista nowych projektow do zainicjowania..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Korekty nawykow
                        </label>
                        <textarea
                          value={notes.habitChanges || ''}
                          onChange={(e) => setNotes(prev => ({...prev, habitChanges: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Nawyki do poprawy, modyfikacji lub dodania..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Cele nauki
                        </label>
                        <textarea
                          value={notes.learning || ''}
                          onChange={(e) => setNotes(prev => ({...prev, learning: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Umiejetnosci do rozwoju, kursy, ksiazki do przeczytania..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other sections */}
              {!['overview', 'achievements', 'challenges', 'planning'].includes(selectedSection) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {reviewSections.find(s => s.id === selectedSection)?.title}
                    </h3>
                    <button
                      onClick={() => toggleSection(selectedSection)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === selectedSection)?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === selectedSection)?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Notatki z przegladu
                    </label>
                    <textarea
                      value={notes[selectedSection] || ''}
                      onChange={(e) => setNotes(prev => ({...prev, [selectedSection]: e.target.value}))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder={`Dodaj swoje przemyslenia na temat: ${reviewSections.find(s => s.id === selectedSection)?.title.toLowerCase()}...`}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageShell>
  );
}
