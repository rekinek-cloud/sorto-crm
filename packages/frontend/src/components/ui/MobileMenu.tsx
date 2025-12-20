'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Waves,
  CircleDashed,
  CheckSquare,
  Folder,
  Calendar,
  Target,
  Buildings,
  Users,
  Funnel,
  Handshake,
  Envelope,
  Tray,
  ChatCircle,
  ChartBar,
  CalendarBlank,
  Robot,
  Gear,
  Tag,
  Lightning,
  ArrowsClockwise,
  BookOpen,
  Clock,
} from 'phosphor-react';

// Menu sections using Phosphor Icons - STREAMS methodology
const menuSections = [
  {
    title: 'Strumienie',
    Icon: Waves,
    items: [
      { name: 'Źródło', href: '/dashboard/source', Icon: CircleDashed },
      { name: 'Wszystkie strumienie', href: '/dashboard/streams', Icon: Waves },
      { name: 'Zadania', href: '/dashboard/tasks', Icon: CheckSquare },
      { name: 'Projekty', href: '/dashboard/projects', Icon: Folder },
      { name: 'Kalendarz', href: '/dashboard/calendar', Icon: Calendar },
      { name: 'Cele', href: '/dashboard/goals', Icon: Target },
    ],
  },
  {
    title: 'CRM',
    Icon: Buildings,
    items: [
      { name: 'Firmy', href: '/dashboard/companies', Icon: Buildings },
      { name: 'Kontakty', href: '/dashboard/contacts', Icon: Users },
      { name: 'Pipeline', href: '/dashboard/pipeline', Icon: Funnel },
      { name: 'Transakcje', href: '/dashboard/deals', Icon: Handshake },
    ],
  },
  {
    title: 'Komunikacja',
    Icon: Envelope,
    items: [
      { name: 'Skrzynki', href: '/dashboard/mailboxes', Icon: Tray },
      { name: 'Kanały', href: '/dashboard/channels', Icon: ChatCircle },
    ],
  },
  {
    title: 'Przeglądy',
    Icon: ChartBar,
    items: [
      { name: 'Przegląd tygodniowy', href: '/dashboard/reviews/weekly', Icon: CalendarBlank },
      { name: 'Przegląd miesięczny', href: '/dashboard/reviews/monthly', Icon: Calendar },
    ],
  },
  {
    title: 'Planowanie',
    Icon: Clock,
    items: [
      { name: 'Day Planner', href: '/dashboard/day-planner', Icon: Clock },
    ],
  },
  {
    title: 'AI & Reguły',
    Icon: Robot,
    items: [
      { name: 'Reguły automatyzacji', href: '/dashboard/rules', Icon: Gear },
      { name: 'Asystent AI', href: '/dashboard/ai-assistant', Icon: Robot },
    ],
  },
  {
    title: 'Organizacja',
    Icon: Tag,
    items: [
      { name: 'Tagi', href: '/dashboard/tags', Icon: Tag },
      { name: 'Nawyki', href: '/dashboard/habits', Icon: Lightning },
      { name: 'Zadania cykliczne', href: '/dashboard/recurring-tasks', Icon: ArrowsClockwise },
      { name: 'Baza wiedzy', href: '/dashboard/knowledge-base', Icon: BookOpen },
    ],
  },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white rounded-t-3xl shadow-xl transition-all">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Waves size={24} weight="duotone" className="text-primary-600" />
                    Menu
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>

                {/* Menu Content */}
                <div className="max-h-[70vh] overflow-y-auto pb-20">
                  {menuSections.map((section) => {
                    const SectionIcon = section.Icon;
                    return (
                      <div key={section.title} className="border-b border-gray-50">
                        <button
                          onClick={() => toggleSection(section.title)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <SectionIcon size={22} weight="duotone" className="text-gray-600" />
                            <span className="font-medium text-gray-900">{section.title}</span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                              expandedSection === section.title ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <Transition
                          show={expandedSection === section.title}
                          enter="transition-all duration-200 ease-out"
                          enterFrom="max-h-0 opacity-0"
                          enterTo="max-h-96 opacity-100"
                          leave="transition-all duration-150 ease-in"
                          leaveFrom="max-h-96 opacity-100"
                          leaveTo="max-h-0 opacity-0"
                        >
                          <div className="overflow-hidden">
                            <div className="bg-gray-50/50">
                              {section.items.map((item) => {
                                const ItemIcon = item.Icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex items-center space-x-3 p-3 pl-12 transition-colors ${
                                      isActive
                                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <ItemIcon
                                      size={18}
                                      weight={isActive ? 'fill' : 'duotone'}
                                      className={isActive ? 'text-primary-600' : 'text-gray-500'}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </Transition>
                      </div>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
