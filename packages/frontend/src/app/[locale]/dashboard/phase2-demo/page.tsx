'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Mail,
  Clock,
  Command,
  Smartphone,
  Zap,
  Star
} from 'lucide-react';
import ResponsiveDashboard from '@/components/ui/ResponsiveDashboard';
import EnhancedCommandPalette from '@/components/ui/EnhancedCommandPalette';
import { SwipeableTaskCard, SwipeableEmailCard } from '@/components/ui/SwipeableCard';

export default function Phase2Demo() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Enhanced Dashboard Cards with calm colors
  const dashboardCards = [
    {
      id: 'active-users',
      title: 'Aktywni Użytkownicy',
      value: '2,847',
      change: '+12.5%',
      icon: '👥',
      color: 'blue' as const,
      href: '/dashboard/users',
    },
    {
      id: 'completed-tasks',
      title: 'Ukończone Zadania',
      value: '186',
      change: '+8.2%',
      icon: '✅',
      color: 'green' as const,
      href: '/dashboard/tasks',
    },
    {
      id: 'projects-progress',
      title: 'Projekty w Toku',
      value: '23',
      change: '+5.1%',
      icon: '📂',
      color: 'purple' as const,
      href: '/dashboard/projects',
    },
    {
      id: 'revenue',
      title: 'Miesięczny Przychód',
      value: '$45,231',
      change: '+15.7%',
      icon: '💰',
      color: 'teal' as const,
      href: '/dashboard/analytics',
    },
    {
      id: 'messages',
      title: 'Nowe Wiadomości',
      value: '12',
      change: '-2.3%',
      icon: '📧',
      color: 'amber' as const,
      href: '/dashboard/communication',
    },
    {
      id: 'meetings',
      title: 'Dzisiejsze Spotkania',
      value: '4',
      icon: '📅',
      color: 'rose' as const,
      href: '/dashboard/calendar',
    },
  ];

  const sampleTasks = [
    { id: 1, title: 'Przegląd propozycji klienta ABC', description: 'Analiza oferty i przygotowanie odpowiedzi' },
    { id: 2, title: 'Spotkanie zespołu o 14:00', description: 'Weekly sync z zespołem development' },
    { id: 3, title: 'Aktualizacja dokumentacji API', description: 'Dodanie nowych endpoints do docs' },
    { id: 4, title: 'Code review PR #245', description: 'Sprawdzenie zmian w module autoryzacji' },
  ];

  const sampleEmails = [
    { id: 1, from: 'jan.kowalski@firma.pl', subject: 'Propozycja współpracy', preview: 'Dzień dobry, chciałbym omówić możliwość...' },
    { id: 2, from: 'newsletter@tech.com', subject: 'Weekly Tech Update', preview: 'Najnowsze trendy w technologii...' },
    { id: 3, from: 'anna.nowak@klient.pl', subject: 'Pytanie o projekt', preview: 'Czy moglibyśmy umówić się na...' },
    { id: 4, from: 'system@app.com', subject: 'Backup completed', preview: 'Daily backup finished successfully...' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gradient-calm mb-4">
          🚀 Phase 2: Modern Components
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          Enhanced Dashboard Cards, Command Palette z AI, Mobile Gestures - spokojne kolory i nowoczesne interakcje
        </p>
      </motion.div>

      {/* Enhanced Dashboard Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
            📊 Enhanced Dashboard Cards
          </h2>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Glassmorphism + Spokojne kolory + Floating animations
          </div>
        </div>
        
        <ResponsiveDashboard cards={dashboardCards} />
      </motion.section>

      {/* Command Palette Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-16"
      >
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
              ⌘ Enhanced Command Palette
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCommandPalette(true)}
              className="btn-modern flex items-center space-x-2"
            >
              <Command className="w-4 h-4" />
              <span>Otwórz Paletkę</span>
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs">⌘K</kbd>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Zap className="w-5 h-5" />
                <span className="font-medium">AI Commands</span>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Smart Task Creator</li>
                <li>• Context Analysis</li>
                <li>• Workflow Optimizer</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Navigation</span>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Instant page switching</li>
                <li>• Keyboard shortcuts</li>
                <li>• Smart search</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Quick Actions</span>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Create new task</li>
                <li>• Schedule meeting</li>
                <li>• Start timer</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Mobile Gestures Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-16"
      >
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
              📱 Mobile Gesture System
            </h2>
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
              <Smartphone className="w-5 h-5" />
              <span className="text-sm">Swipe to interact</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Task Cards */}
            <div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Swipeable Task Cards
              </h3>
              <div className="space-y-4">
                {sampleTasks.map((task) => (
                  <SwipeableTaskCard
                    key={task.id}
                    onComplete={() => console.log('Task completed:', task.title)}
                    onDefer={() => console.log('Task deferred:', task.title)}
                    onDelete={() => console.log('Task deleted:', task.title)}
                    className="p-4"
                  >
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">
                        {task.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {task.description}
                      </p>
                    </div>
                  </SwipeableTaskCard>
                ))}
              </div>
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                👆 Swipe prawo: ✅ Ukończ, 🕐 Później | Swipe lewo: 🗑️ Usuń
              </div>
            </div>

            {/* Email Cards */}
            <div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-500" />
                Swipeable Email Cards
              </h3>
              <div className="space-y-4">
                {sampleEmails.map((email) => (
                  <SwipeableEmailCard
                    key={email.id}
                    onStar={() => console.log('Email starred:', email.subject)}
                    onArchive={() => console.log('Email archived:', email.subject)}
                    onDelete={() => console.log('Email deleted:', email.subject)}
                    className="p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-slate-800 dark:text-white text-sm">
                          {email.from}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          2h ago
                        </span>
                      </div>
                      <h5 className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                        {email.subject}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {email.preview}
                      </p>
                    </div>
                  </SwipeableEmailCard>
                ))}
              </div>
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                👆 Swipe prawo: ⭐ Gwiazdka, 📁 Archiwum | Swipe lewo: 🗑️ Usuń
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-8 text-center"
      >
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          ✨ Phase 2 Features Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Enhanced Cards</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Glassmorphism, spokojne kolory, floating animations, responsive design
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Command Palette</h3>
            <p className="text-slate-600 dark:text-slate-300">
              AI integration, voice input, kategoryzacja, keyboard shortcuts
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Mobile Gestures</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Swipe actions, visual feedback, customizable actions, native feel
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            🎨 Spokojne kolory • 📱 Mobile-first • ⚡ Performance optimized • ♿ Accessible
          </p>
        </div>
      </motion.div>

      {/* Command Palette */}
      <EnhancedCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Global keyboard shortcut */}
      <div className="fixed bottom-4 right-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCommandPalette(true)}
          className="glass p-3 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
          title="Open Command Palette (⌘K)"
        >
          <Command className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}