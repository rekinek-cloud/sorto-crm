'use client';

import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Zap, 
  Calendar, 
  CheckCircle, 
  Folder, 
  Users, 
  Settings,
  Sparkles,
  Mic,
  Clock,
  ArrowRight,
  Hash
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  action: () => void;
  category: 'navigation' | 'creation' | 'ai' | 'quick-action';
  keywords: string[];
  shortcut?: string;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'teal';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = {
  ai: { name: '🤖 AI Assistant', color: 'text-purple-400' },
  navigation: { name: '🧭 Nawigacja', color: 'text-blue-400' },
  creation: { name: '✨ Utworz', color: 'text-green-400' },
  'quick-action': { name: '⚡ Szybkie akcje', color: 'text-amber-400' },
};

export default function EnhancedCommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced AI Commands
  const aiCommands: Command[] = [
    {
      id: 'ai-create-task-smart',
      title: 'Smart Task Creator',
      subtitle: 'Opisz zadanie naturalnie, AI utworzy pełny task',
      icon: Sparkles,
      action: () => handleAICommand('smart-create'),
      category: 'ai',
      keywords: ['ai', 'create', 'task', 'smart', 'natural'],
      shortcut: '⌘T',
      color: 'purple'
    },
    {
      id: 'ai-analyze-context',
      title: 'Context Analysis',
      subtitle: 'AI przeanalizuje aktualny kontekst i zasugeruje działania',
      icon: Zap,
      action: () => handleAICommand('context-analysis'),
      category: 'ai',
      keywords: ['ai', 'analyze', 'context', 'suggestions'],
      shortcut: '⌘A',
      color: 'purple'
    },
    {
      id: 'ai-optimize-workflow',
      title: 'Workflow Optimizer',
      subtitle: 'Optymalizuj swój workflow na podstawie wzorców',
      icon: Settings,
      action: () => handleAICommand('optimize-workflow'),
      category: 'ai',
      keywords: ['ai', 'optimize', 'workflow', 'patterns'],
      color: 'purple'
    },
  ];

  // Enhanced Navigation Commands
  const navigationCommands: Command[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Główny pulpit z przeglądem',
      icon: Hash,
      action: () => router.push('/dashboard/'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'overview'],
      shortcut: '⌘H',
      color: 'blue'
    },
    {
      id: 'nav-tasks',
      title: 'Zadania',
      subtitle: 'Lista wszystkich zadań i akcji',
      icon: CheckCircle,
      action: () => router.push('/dashboard/gtd/next-actions/'),
      category: 'navigation',
      keywords: ['tasks', 'actions', 'gtd'],
      shortcut: '⌘T',
      color: 'blue'
    },
    {
      id: 'nav-projects',
      title: 'Projekty',
      subtitle: 'Zarządzanie projektami',
      icon: Folder,
      action: () => router.push('/dashboard/projects/'),
      category: 'navigation',
      keywords: ['projects', 'manage'],
      shortcut: '⌘P',
      color: 'blue'
    },
    {
      id: 'nav-communication',
      title: 'Komunikacja',
      subtitle: 'Centrum komunikacji',
      icon: Users,
      action: () => router.push('/dashboard/communication/'),
      category: 'navigation',
      keywords: ['communication', 'messages'],
      shortcut: '⌘M',
      color: 'blue'
    },
  ];

  // Quick Action Commands
  const quickActionCommands: Command[] = [
    {
      id: 'quick-new-task',
      title: 'Nowe zadanie',
      subtitle: 'Szybko utworz nowe zadanie',
      icon: CheckCircle,
      action: () => handleQuickAction('new-task'),
      category: 'creation',
      keywords: ['new', 'task', 'create'],
      shortcut: '⌘N',
      color: 'green'
    },
    {
      id: 'quick-schedule',
      title: 'Zaplanuj spotkanie',
      subtitle: 'Dodaj wydarzenie do kalendarza',
      icon: Calendar,
      action: () => handleQuickAction('schedule'),
      category: 'creation',
      keywords: ['schedule', 'meeting', 'calendar'],
      shortcut: '⌘S',
      color: 'green'
    },
    {
      id: 'quick-timer',
      title: 'Uruchom timer',
      subtitle: 'Rozpocznij pomiar czasu pracy',
      icon: Clock,
      action: () => handleQuickAction('timer'),
      category: 'quick-action',
      keywords: ['timer', 'time', 'track'],
      shortcut: '⌘R',
      color: 'amber'
    },
  ];

  const allCommands = [...aiCommands, ...navigationCommands, ...quickActionCommands];

  const filteredCommands = query === ''
    ? allCommands
    : allCommands.filter((command) =>
        command.title.toLowerCase().includes(query.toLowerCase()) ||
        command.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
      );

  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  const handleAICommand = async (type: string) => {
    setIsProcessing(true);
    console.log('AI Command:', type);
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  const handleQuickAction = (type: string) => {
    console.log('Quick Action:', type);
    onClose();
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice recognition implementation would go here
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="glass-modal w-full max-w-2xl transform overflow-hidden p-0">
                <Combobox value={selectedCommand} onChange={setSelectedCommand}>
                  {/* Search Header */}
                  <div className="flex items-center border-b border-white/10 px-6 py-4">
                    <Search className="h-5 w-5 text-white/50 mr-3" />
                    <Combobox.Input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-lg"
                      placeholder="Wpisz komendę lub opisz co chcesz zrobić..."
                      onChange={(event) => setQuery(event.target.value)}
                      value={query}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleVoiceInput}
                      className={`ml-3 p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/70'
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Processing State */}
                  {isProcessing && (
                    <div className="px-6 py-8 text-center">
                      <div className="loading-spinner mx-auto mb-4"></div>
                      <p className="text-white/70">AI przetwarza polecenie...</p>
                    </div>
                  )}

                  {/* Commands List */}
                  {!isProcessing && (
                    <Combobox.Options static className="max-h-96 overflow-y-auto py-4">
                      {Object.entries(groupedCommands).map(([category, commands]) => (
                        <div key={category} className="mb-6">
                          {/* Category Header */}
                          <div className="px-6 mb-3">
                            <h3 className={`text-sm font-medium ${categories[category as keyof typeof categories].color}`}>
                              {categories[category as keyof typeof categories].name}
                            </h3>
                          </div>

                          {/* Commands in Category */}
                          <div className="space-y-1 px-2">
                            {commands.map((command) => {
                              const Icon = command.icon;
                              return (
                                <Combobox.Option
                                  key={command.id}
                                  value={command}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none rounded-xl mx-4 px-4 py-3 transition-all duration-200 ${
                                      active 
                                        ? 'bg-white/10 scale-[1.02]' 
                                        : 'hover:bg-white/5'
                                    }`
                                  }
                                >
                                  {({ active }) => (
                                    <motion.div
                                      whileHover={{ x: 4 }}
                                      className="flex items-center justify-between"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${
                                          command.color === 'purple' ? 'bg-purple-500/20' :
                                          command.color === 'blue' ? 'bg-blue-500/20' :
                                          command.color === 'green' ? 'bg-green-500/20' :
                                          command.color === 'amber' ? 'bg-amber-500/20' :
                                          command.color === 'rose' ? 'bg-rose-500/20' :
                                          'bg-teal-500/20'
                                        }`}>
                                          <Icon className={`h-4 w-4 ${
                                            command.color === 'purple' ? 'text-purple-400' :
                                            command.color === 'blue' ? 'text-blue-400' :
                                            command.color === 'green' ? 'text-green-400' :
                                            command.color === 'amber' ? 'text-amber-400' :
                                            command.color === 'rose' ? 'text-rose-400' :
                                            'text-teal-400'
                                          }`} />
                                        </div>
                                        <div>
                                          <div className="text-white font-medium">
                                            {command.title}
                                          </div>
                                          {command.subtitle && (
                                            <div className="text-white/60 text-sm">
                                              {command.subtitle}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        {command.shortcut && (
                                          <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                                            {command.shortcut}
                                          </div>
                                        )}
                                        {active && (
                                          <ArrowRight className="h-4 w-4 text-white/50" />
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </Combobox.Option>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </Combobox.Options>
                  )}

                  {/* Empty State */}
                  {!isProcessing && filteredCommands.length === 0 && query !== '' && (
                    <div className="px-6 py-14 text-center">
                      <Sparkles className="mx-auto h-12 w-12 text-white/30 mb-4" />
                      <p className="text-white/70 text-lg mb-2">Nie znaleziono komend</p>
                      <p className="text-white/50 text-sm">
                        Spróbuj innego słowa kluczowego lub użyj AI do utworzenia nowego zadania
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-white/10 px-6 py-3">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <div className="flex items-center space-x-4">
                        <span>↑↓ nawigacja</span>
                        <span>⏎ wykonaj</span>
                        <span>esc zamknij</span>
                      </div>
                      <div className="text-white/30">
                        {filteredCommands.length} komend
                      </div>
                    </div>
                  </div>
                </Combobox>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}