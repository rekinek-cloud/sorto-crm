'use client';

import { useState } from 'react';
import { Plus, NotePencil, Handshake, X } from 'phosphor-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/client';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'note' | 'deal';
}

function QuickAddModal({ isOpen, onClose, type }: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeConfig = {
    task: { label: 'Zadanie', placeholder: 'Co trzeba zrobić?', icon: Plus, color: 'blue' },
    note: { label: 'Notatka', placeholder: 'O czym chcesz zanotować?', icon: NotePencil, color: 'green' },
    deal: { label: 'Deal', placeholder: 'Nazwa transakcji...', icon: Handshake, color: 'purple' },
  };

  const config = typeConfig[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = type === 'task'
        ? '/tasks'
        : type === 'note'
        ? '/source'
        : '/tasks';  // Deal tworzy zadanie typu deal

      const body = type === 'task'
        ? { title, status: 'TODO', priority: 'MEDIUM' }
        : type === 'note'
        ? { content: title, sourceType: 'NOTE' }
        : { title, status: 'TODO', priority: 'MEDIUM', description: 'Deal utworzony przez Quick Actions' };

      await apiClient.post(endpoint, body);

      toast.success(`${config.label} dodane!`);
      setTitle('');
      onClose();
    } catch (error) {
      toast.error(`Błąd dodawania ${config.label.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                <div className={`px-4 py-3 bg-${config.color}-50 border-b border-${config.color}-100 flex items-center justify-between`}>
                  <Dialog.Title className={`text-lg font-semibold text-${config.color}-700 flex items-center gap-2`}>
                    <config.icon weight="bold" className="w-5 h-5" />
                    Szybkie dodawanie: {config.label}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X weight="bold" className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim() || isSubmitting}
                      className={`px-4 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                      {isSubmitting ? 'Dodawanie...' : 'Dodaj'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function QuickActions() {
  const [modalType, setModalType] = useState<'task' | 'note' | 'deal' | null>(null);

  const actions = [
    { type: 'task' as const, label: 'Zadanie', icon: Plus, color: 'blue', shortcut: 'T' },
    { type: 'note' as const, label: 'Notatka', icon: NotePencil, color: 'green', shortcut: 'N' },
    { type: 'deal' as const, label: 'Deal', icon: Handshake, color: 'purple', shortcut: 'D' },
  ];

  return (
    <>
      <div className="flex items-center gap-1">
        {actions.map((action) => (
          <button
            key={action.type}
            onClick={() => setModalType(action.type)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg
              bg-${action.color}-50 text-${action.color}-700
              hover:bg-${action.color}-100
              border border-${action.color}-200
              transition-all duration-150
            `}
            title={`Dodaj ${action.label} (Alt+${action.shortcut})`}
          >
            <action.icon weight="bold" className="w-4 h-4" />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {modalType && (
        <QuickAddModal
          isOpen={true}
          onClose={() => setModalType(null)}
          type={modalType}
        />
      )}
    </>
  );
}
