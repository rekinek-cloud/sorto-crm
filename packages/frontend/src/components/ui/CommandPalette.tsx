'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass,
  House,
  CircleDashed,
  CheckSquare,
  Folder,
  Envelope,
  Users,
  Buildings,
  Plus,
  Robot,
  Calendar,
  Waves,
  Lightning,
  Target,
  CaretRight,
  Command,
  ArrowUp,
  ArrowDown,
  ArrowElbowDownLeft,
} from 'phosphor-react';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  Icon: React.ComponentType<any>;
  action: () => void;
  category: 'navigation' | 'creation' | 'ai' | 'quick-action';
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Command examples - STREAMS methodology
  const aiCommands: Command[] = [
    {
      id: 'ai-create-task-from-text',
      title: 'Utwórz zadanie z tekstu',
      subtitle: 'AI wydobędzie szczegóły zadania z Twojego opisu',
      Icon: Robot,
      action: () => handleAICommand('create-task'),
      category: 'ai',
      keywords: ['ai', 'create', 'task', 'extract', 'streams'],
    },
    {
      id: 'ai-analyze-email',
      title: 'Analizuj email pod kątem zadań',
      subtitle: 'AI przeskanuje email i zasugeruje strumienie',
      Icon: Envelope,
      action: () => handleAICommand('analyze-email'),
      category: 'ai',
      keywords: ['ai', 'email', 'analyze', 'extract', 'tasks', 'streams'],
    },
    {
      id: 'ai-smart-schedule',
      title: 'Inteligentna optymalizacja harmonogramu',
      subtitle: 'AI zoptymalizuje Twój codzienny harmonogram',
      Icon: Calendar,
      action: () => handleAICommand('optimize-schedule'),
      category: 'ai',
      keywords: ['ai', 'schedule', 'optimize', 'calendar', 'time', 'day planner'],
    },
    {
      id: 'ai-stream-insights',
      title: 'Analiza strumieni',
      subtitle: 'AI przeanalizuje przepływ i zasugeruje optymalizacje',
      Icon: Waves,
      action: () => handleAICommand('stream-insights'),
      category: 'ai',
      keywords: ['ai', 'stream', 'insights', 'analysis', 'progress', 'flowing'],
    },
  ];

  // Navigation commands - STREAMS methodology
  const navigationCommands: Command[] = [
    {
      id: 'nav-dashboard',
      title: 'Przejdź do Pulpitu',
      Icon: House,
      action: () => router.push('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'overview', 'pulpit'],
    },
    {
      id: 'nav-source',
      title: 'Przejdź do Źródła',
      subtitle: 'Przetwórz nowe elementy',
      Icon: CircleDashed,
      action: () => router.push('/dashboard/source'),
      category: 'navigation',
      keywords: ['source', 'zrodlo', 'inbox', 'process', 'capture'],
    },
    {
      id: 'nav-streams',
      title: 'Przejdź do Strumieni',
      Icon: Waves,
      action: () => router.push('/dashboard/streams'),
      category: 'navigation',
      keywords: ['streams', 'strumienie', 'flowing', 'frozen'],
    },
    {
      id: 'nav-tasks',
      title: 'Przejdź do Zadań',
      Icon: CheckSquare,
      action: () => router.push('/dashboard/tasks'),
      category: 'navigation',
      keywords: ['tasks', 'zadania', 'todo', 'actions'],
    },
    {
      id: 'nav-projects',
      title: 'Przejdź do Projektów',
      Icon: Folder,
      action: () => router.push('/dashboard/projects'),
      category: 'navigation',
      keywords: ['projects', 'projekty', 'work', 'goals'],
    },
    {
      id: 'nav-goals',
      title: 'Przejdź do Celów',
      subtitle: 'Cele precyzyjne RZUT',
      Icon: Target,
      action: () => router.push('/dashboard/goals'),
      category: 'navigation',
      keywords: ['goals', 'cele', 'rzut', 'targets', 'objectives'],
    },
    {
      id: 'nav-companies',
      title: 'Przejdź do Firm',
      Icon: Buildings,
      action: () => router.push('/dashboard/companies'),
      category: 'navigation',
      keywords: ['companies', 'firmy', 'crm', 'business'],
    },
    {
      id: 'nav-contacts',
      title: 'Przejdź do Kontaktów',
      Icon: Users,
      action: () => router.push('/dashboard/contacts'),
      category: 'navigation',
      keywords: ['contacts', 'kontakty', 'people', 'crm'],
    },
  ];

  // Quick creation commands
  const creationCommands: Command[] = [
    {
      id: 'create-task',
      title: 'Utwórz nowe zadanie',
      Icon: Plus,
      action: () => handleQuickCreate('task'),
      category: 'creation',
      keywords: ['create', 'new', 'task', 'add', 'todo', 'nowe', 'zadanie'],
    },
    {
      id: 'create-stream',
      title: 'Utwórz nowy strumień',
      Icon: Waves,
      action: () => handleQuickCreate('stream'),
      category: 'creation',
      keywords: ['create', 'new', 'stream', 'add', 'strumien'],
    },
    {
      id: 'create-project',
      title: 'Utwórz nowy projekt',
      Icon: Folder,
      action: () => handleQuickCreate('project'),
      category: 'creation',
      keywords: ['create', 'new', 'project', 'add', 'projekt'],
    },
    {
      id: 'create-contact',
      title: 'Utwórz nowy kontakt',
      Icon: Users,
      action: () => handleQuickCreate('contact'),
      category: 'creation',
      keywords: ['create', 'new', 'contact', 'person', 'add', 'kontakt'],
    },
    {
      id: 'create-company',
      title: 'Utwórz nową firmę',
      Icon: Buildings,
      action: () => handleQuickCreate('company'),
      category: 'creation',
      keywords: ['create', 'new', 'company', 'organization', 'add', 'firma'],
    },
    {
      id: 'create-goal',
      title: 'Utwórz nowy cel (RZUT)',
      subtitle: 'Cel precyzyjny: Rezultat, Zmierzalność, Ujście, Tło',
      Icon: Target,
      action: () => handleQuickCreate('goal'),
      category: 'creation',
      keywords: ['create', 'new', 'goal', 'cel', 'rzut', 'target'],
    },
  ];

  // Quick action commands - STREAMS methodology
  const quickActionCommands: Command[] = [
    {
      id: 'quick-capture',
      title: 'Szybkie przechwytywanie',
      subtitle: 'Szybko przechwytuj myśli do Źródła',
      Icon: Lightning,
      action: () => handleQuickCapture(),
      category: 'quick-action',
      keywords: ['quick', 'capture', 'note', 'thought', 'idea', 'zrodlo'],
    },
    {
      id: 'weekly-review',
      title: 'Rozpocznij przegląd tygodniowy',
      Icon: Calendar,
      action: () => router.push('/dashboard/reviews/weekly'),
      category: 'quick-action',
      keywords: ['weekly', 'review', 'przeglad', 'planning'],
    },
    {
      id: 'day-planner',
      title: 'Otwórz Day Planner',
      subtitle: 'Zaplanuj dzień z AI',
      Icon: Calendar,
      action: () => router.push('/dashboard/day-planner'),
      category: 'quick-action',
      keywords: ['day', 'planner', 'daily', 'schedule', 'plan'],
    },
  ];

  const allCommands = [
    ...aiCommands,
    ...navigationCommands,
    ...creationCommands,
    ...quickActionCommands,
  ];

  const filteredCommands = query === ''
    ? allCommands
    : allCommands.filter((command) =>
        command.title.toLowerCase().includes(query.toLowerCase()) ||
        command.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        command.keywords.some(keyword =>
          keyword.toLowerCase().includes(query.toLowerCase())
        )
      );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryConfig = {
    ai: { label: 'Polecenia AI', Icon: Robot },
    navigation: { label: 'Nawigacja', Icon: House },
    creation: { label: 'Utwórz nowe', Icon: Plus },
    'quick-action': { label: 'Szybkie akcje', Icon: Lightning },
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAICommand = async (type: string) => {
    setIsProcessing(true);
    onClose();

    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      // Here you would implement actual AI functionality
      console.log(`AI command executed: ${type}`);
    }, 2000);
  };

  const handleQuickCreate = (type: string) => {
    onClose();
    // Navigate to creation form
    router.push(`/crm/dashboard/${type}s?create=true`);
  };

  const handleQuickCapture = () => {
    onClose();
    // Open quick capture modal - route to Source
    router.push('/dashboard/source?quick-capture=true');
  };

  const executeCommand = (command: Command) => {
    setSelectedCommand(command);
    command.action();
    onClose();
  };

  return (
    <>
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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                  <Combobox value={selectedCommand} onChange={executeCommand}>
                    <div className="relative">
                      <div className="flex items-center px-4 py-3 border-b border-gray-100">
                        <MagnifyingGlass size={20} weight="bold" className="text-gray-400 mr-3" />
                        <Combobox.Input
                          ref={inputRef}
                          className="w-full border-none bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-lg"
                          placeholder="Wpisz polecenie lub szukaj..."
                          onChange={(event) => setQuery(event.target.value)}
                          displayValue={() => query}
                        />
                        <kbd className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-mono text-gray-500">
                          ESC
                        </kbd>
                      </div>

                      <Combobox.Options className="max-h-96 overflow-y-auto py-2">
                        {Object.entries(groupedCommands).map(([category, commands]) => {
                          const config = categoryConfig[category as keyof typeof categoryConfig];
                          const CategoryIcon = config.Icon;
                          return (
                            <div key={category}>
                              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <CategoryIcon size={14} weight="bold" />
                                {config.label}
                              </div>
                              {commands.map((command) => {
                                const CommandIcon = command.Icon;
                                return (
                                  <Combobox.Option
                                    key={command.id}
                                    value={command}
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-3 px-4 ${
                                        active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                                      }`
                                    }
                                  >
                                    {({ active }) => (
                                      <div className="flex items-center space-x-3">
                                        <CommandIcon
                                          size={20}
                                          weight={active ? 'fill' : 'duotone'}
                                          className={active ? 'text-primary-600' : 'text-gray-500'}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium">{command.title}</div>
                                          {command.subtitle && (
                                            <div className="text-sm text-gray-500">{command.subtitle}</div>
                                          )}
                                        </div>
                                        {active && (
                                          <CaretRight size={16} weight="bold" className="text-primary-600" />
                                        )}
                                      </div>
                                    )}
                                  </Combobox.Option>
                                );
                              })}
                            </div>
                          );
                        })}

                        {filteredCommands.length === 0 && query !== '' && (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <MagnifyingGlass size={32} weight="duotone" className="mx-auto mb-2 text-gray-400" />
                            <p>Nie znaleziono poleceń dla "{query}"</p>
                            <p className="text-sm mt-1">Spróbuj innego terminu wyszukiwania</p>
                          </div>
                        )}
                      </Combobox.Options>
                    </div>
                  </Combobox>

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center gap-1">
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono border border-gray-200 rounded bg-white">
                          <ArrowUp size={10} />
                          <ArrowDown size={10} />
                        </span>
                        Nawiguj
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-xs font-mono border border-gray-200 rounded bg-white">
                          <ArrowElbowDownLeft size={12} />
                        </span>
                        Wykonaj
                      </span>
                    </div>
                    <div className="text-primary-600 font-medium flex items-center gap-1">
                      <Waves size={14} weight="duotone" />
                      {filteredCommands.length} poleceń
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* AI Processing Indicator */}
      {isProcessing && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span className="font-medium">AI przetwarza...</span>
        </div>
      )}
    </>
  );
}
