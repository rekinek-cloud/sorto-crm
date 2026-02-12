'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonPage } from '@/components/ui/SkeletonLoader';
import {
  Calendar,
  BarChart3,
  Trophy,
  Rocket,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Clock,
  Eye,
  SlidersHorizontal,
  Save,
} from 'lucide-react';

interface QuarterlyStats {
  completedProjects: number;
  activeProjects: number;
  completedGoals: number;
  newAreasEstablished: number;
  overallGrowth: number;
  strategicAlignment: number;
}

interface ReviewSection {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
}

interface QuarterlyGoal {
  id: string;
  title: string;
  progress: number;
  status: 'completed' | 'on-track' | 'behind' | 'at-risk';
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

export default function QuarterlyReviewPage() {
  const [currentQuarter, setCurrentQuarter] = useState(() => {
    const now = new Date();
    return Math.floor(now.getMonth() / 3) + 1;
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<QuarterlyStats | null>(null);
  const [goals, setGoals] = useState<QuarterlyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [notes, setNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadQuarterlyData();
  }, [currentQuarter, currentYear]);

  const loadQuarterlyData = async () => {
    setTimeout(() => {
      setStats({
        completedProjects: 8,
        activeProjects: 5,
        completedGoals: 12,
        newAreasEstablished: 3,
        overallGrowth: 23,
        strategicAlignment: 85
      });

      setGoals([
        { id: '1', title: 'Zwiekszyc produktywnosc zespolu o 25%', progress: 90, status: 'on-track' },
        { id: '2', title: 'Uruchomic nowa linie produktowa', progress: 100, status: 'completed' },
        { id: '3', title: 'Ekspansja na 3 nowe rynki', progress: 65, status: 'behind' },
        { id: '4', title: 'Redukcja kosztow operacyjnych o 15%', progress: 45, status: 'at-risk' },
        { id: '5', title: 'Poprawic satysfakcje klientow do 90%', progress: 95, status: 'completed' },
      ]);

      setReviewSections([
        { id: 'vision', title: 'Przeglad wizji i celu', completed: false },
        { id: 'goals', title: 'Ocena celow kwartalnych', completed: false },
        { id: 'projects', title: 'Przeglad glownych projektow', completed: false },
        { id: 'areas', title: 'Obszary odpowiedzialnosci', completed: false },
        { id: 'systems', title: 'Systemy i procesy', completed: false },
        { id: 'learning', title: 'Nauka i rozwoj', completed: false },
        { id: 'strategic', title: 'Planowanie strategiczne', completed: false },
        { id: 'next-quarter', title: 'Planowanie nastepnego kwartalu', completed: false },
      ]);

      setIsLoading(false);
    }, 500);
  };

  const getQuarterName = (quarter: number, year: number) => {
    return `Q${quarter} ${year}`;
  };

  const getGoalStatusVariant = (status: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'on-track': return 'info';
      case 'behind': return 'warning';
      case 'at-risk': return 'error';
      default: return 'default';
    }
  };

  const getGoalStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Ukonczone';
      case 'on-track': return 'Na dobrej drodze';
      case 'behind': return 'Opoznione';
      case 'at-risk': return 'Zagrozone';
      default: return status;
    }
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

  return (
    <PageShell>
      <PageHeader
        title="Przeglad kwartalny"
        subtitle="Strategiczna ocena kwartalu"
        icon={Calendar}
        iconColor="text-amber-600"
        breadcrumbs={[
          { label: 'Przeglady', href: '/dashboard/reviews' },
          { label: 'Kwartalny' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={currentQuarter}
              onChange={(e) => setCurrentQuarter(parseInt(e.target.value))}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            >
              <option value={1}>Q1</option>
              <option value={2}>Q2</option>
              <option value={3}>Q3</option>
              <option value={4}>Q4</option>
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>

            <button
              onClick={() => {
                toast.success('Przeglad kwartalny zapisany!');
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
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
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
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
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
                label="Ukonczone"
                value={stats.completedProjects}
                icon={Trophy}
                iconColor="text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                label="Aktywne"
                value={stats.activeProjects}
                icon={Clock}
                iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                label="Cele osiagniete"
                value={stats.completedGoals}
                icon={SlidersHorizontal}
                iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400"
              />
              <StatCard
                label="Nowe obszary"
                value={stats.newAreasEstablished}
                icon={Lightbulb}
                iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
              />
              <StatCard
                label="Wzrost"
                value={`${stats.overallGrowth}%`}
                icon={TrendingUp}
                iconColor="text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400"
              />
              <StatCard
                label="Spojnosc"
                value={`${stats.strategicAlignment}%`}
                icon={Eye}
                iconColor="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400"
              />
            </motion.div>
          )}

          {/* Quarterly Goals Overview */}
          <motion.div variants={itemAnimation}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Postep celow kwartalnych</h3>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{goal.title}</h4>
                      <StatusBadge variant={getGoalStatusVariant(goal.status)}>
                        {getGoalStatusLabel(goal.status)}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'on-track' ? 'bg-blue-500' :
                            goal.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Review Content */}
          <motion.div variants={itemAnimation}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 dark:bg-slate-800/80 dark:border-slate-700/30 rounded-2xl shadow-sm p-6">
              {selectedSection === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Podsumowanie strategiczne</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Ten przeglad kwartalny skupia sie na spojnosci strategicznej, osiaganiu celow i dlugotterminowej wizji.
                    Wykorzystaj ten czas, aby oderwac sie od codziennych operacji i ocenic szerszy obraz.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Najwazniejsze w kwartale</h4>
                      <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Ukonczone {stats?.completedProjects} projektow</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Osiagniete {stats?.completedGoals} celow strategicznych</li>
                        <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" /> {stats?.overallGrowth}% wzrostu w kwartale</li>
                        <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-amber-500" /> {stats?.strategicAlignment}% spojnosci strategicznej</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Strategiczne obszary uwagi</h4>
                      <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <li className="flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-500" /> Przeglad spojnosci wizji i celu</li>
                        <li className="flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-500" /> Ocena osiagniec i wnioski</li>
                        <li className="flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-500" /> Ewaluacja systemow i procesow</li>
                        <li className="flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-500" /> Plan inicjatyw na nastepny kwartal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'vision' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Przeglad wizji i celu</h3>
                    <button
                      onClick={() => toggleSection('vision')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'vision')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'vision')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jak dobrze Twoja praca byla zgodna z ogolna wizja w tym kwartale?
                      </label>
                      <textarea
                        value={notes.vision || ''}
                        onChange={(e) => setNotes(prev => ({...prev, vision: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Przeanalizuj spojnosc miedzy codzienna praca a dlugotterminowa wizja..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie korekty sa potrzebne, aby lepiej realizowac cel?
                      </label>
                      <textarea
                        value={notes.visionAdjustments || ''}
                        onChange={(e) => setNotes(prev => ({...prev, visionAdjustments: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Zidentyfikuj zmiany potrzebne do poprawy spojnosci..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'goals' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ocena celow kwartalnych</h3>
                    <button
                      onClick={() => toggleSection('goals')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'goals')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'goals')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ktore cele przekroczyly oczekiwania i dlaczego?
                      </label>
                      <textarea
                        value={notes.exceededGoals || ''}
                        onChange={(e) => setNotes(prev => ({...prev, exceededGoals: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Przeanalizuj udane cele i czynniki sukcesu..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ktore cele nie zostaly osiagniete i jakie byly przeszkody?
                      </label>
                      <textarea
                        value={notes.missedGoals || ''}
                        onChange={(e) => setNotes(prev => ({...prev, missedGoals: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Zidentyfikuj bariery i wyciagniete wnioski..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Kluczowe wnioski dotyczace wyznaczania i osiagania celow
                      </label>
                      <textarea
                        value={notes.goalLessons || ''}
                        onChange={(e) => setNotes(prev => ({...prev, goalLessons: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Jakie spostrzezenia poprawia przyszle wyznaczanie celow?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'strategic' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Planowanie strategiczne</h3>
                    <button
                      onClick={() => toggleSection('strategic')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'strategic')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'strategic')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie glowne trendy lub zmiany wplywaja na Twoj kierunek strategiczny?
                      </label>
                      <textarea
                        value={notes.trends || ''}
                        onChange={(e) => setNotes(prev => ({...prev, trends: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Trendy rynkowe, zmiany technologiczne, krajobraz konkurencyjny..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie nowe mozliwosci sie pojawily?
                      </label>
                      <textarea
                        value={notes.opportunities || ''}
                        onChange={(e) => setNotes(prev => ({...prev, opportunities: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Nowe rynki, partnerstwa, technologie lub mozliwosci..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Jakie zagrozenia lub ryzyka wymagaja uwagi?
                      </label>
                      <textarea
                        value={notes.risks || ''}
                        onChange={(e) => setNotes(prev => ({...prev, risks: e.target.value}))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Zagrozenia konkurencyjne, ograniczenia zasobow, ryzyka rynkowe..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedSection === 'next-quarter' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Planowanie nastepnego kwartalu</h3>
                    <button
                      onClick={() => toggleSection('next-quarter')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        reviewSections.find(s => s.id === 'next-quarter')?.completed
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {reviewSections.find(s => s.id === 'next-quarter')?.completed ? 'Oznacz jako nieukonczone' : 'Oznacz jako ukonczone'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Top 3 priorytety strategiczne
                        </label>
                        <textarea
                          value={notes.strategicPriorities || ''}
                          onChange={(e) => setNotes(prev => ({...prev, strategicPriorities: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="1. Priorytet pierwszy...&#10;2. Priorytet drugi...&#10;3. Priorytet trzeci..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Kluczowe projekty do uruchomienia
                        </label>
                        <textarea
                          value={notes.newProjects || ''}
                          onChange={(e) => setNotes(prev => ({...prev, newProjects: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Glowne inicjatywy do rozpoczecia w nastepnym kwartale..."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Rozwoj kompetencji
                        </label>
                        <textarea
                          value={notes.capabilities || ''}
                          onChange={(e) => setNotes(prev => ({...prev, capabilities: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="Umiejetnosci, systemy i procesy do rozwoju..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Wymagane zasoby
                        </label>
                        <textarea
                          value={notes.resources || ''}
                          onChange={(e) => setNotes(prev => ({...prev, resources: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Budzet, ludzie, narzedzia i inne potrzebne zasoby..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other sections */}
              {!['overview', 'vision', 'goals', 'strategic', 'next-quarter'].includes(selectedSection) && (
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
                      placeholder={`Dodaj swoje strategiczne przemyslenia na temat: ${reviewSections.find(s => s.id === selectedSection)?.title.toLowerCase()}...`}
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
