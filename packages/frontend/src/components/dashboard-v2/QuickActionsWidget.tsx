'use client';

import React from 'react';
import { Plus, FileText, Users, Calendar, Mail, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

interface QuickActionsWidgetProps {
  onCreateTask?: () => void;
  onCreateDeal?: () => void;
  onCreateMeeting?: () => void;
  onCreateNote?: () => void;
  onCreateContact?: () => void;
}

export function QuickActionsWidget({
  onCreateTask,
  onCreateDeal,
  onCreateMeeting,
  onCreateNote,
  onCreateContact,
}: QuickActionsWidgetProps) {
  const actions: QuickAction[] = [
    {
      id: 'task',
      label: 'Zadanie',
      icon: Plus,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200',
      onClick: onCreateTask || (() => {}),
    },
    {
      id: 'deal',
      label: 'Deal',
      icon: Briefcase,
      color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200',
      onClick: onCreateDeal || (() => {}),
    },
    {
      id: 'meeting',
      label: 'Spotkanie',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200',
      onClick: onCreateMeeting || (() => {}),
    },
    {
      id: 'note',
      label: 'Notatka',
      icon: FileText,
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200',
      onClick: onCreateNote || (() => {}),
    },
    {
      id: 'contact',
      label: 'Kontakt',
      icon: Users,
      color: 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200',
      onClick: onCreateContact || (() => {}),
    },
  ];

  return (
    <BentoCard
      title="Szybkie akcje"
      subtitle="Utworz nowy element"
      icon={Plus}
      iconColor="text-green-600"
      variant="glass"
    >
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.onClick}
            className={"flex items-center gap-2 p-2.5 rounded-xl transition-colors " + action.color}
          >
            <action.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </BentoCard>
  );
}

export default QuickActionsWidget;
