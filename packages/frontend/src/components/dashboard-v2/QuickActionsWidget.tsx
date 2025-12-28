/**
 * QuickActionsWidget - Quick action buttons
 */

'use client';

import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  hoverColor: string;
  path?: string;
  onClick?: () => void;
}

interface QuickActionsWidgetProps {
  onCreateTask?: () => void;
  onCreateDeal?: () => void;
  onCreateMeeting?: () => void;
  onCreateNote?: () => void;
}

const defaultActions: QuickAction[] = [
  {
    id: 'task',
    icon: '✅',
    label: 'Zadanie',
    color: 'bg-blue-50 text-blue-600',
    hoverColor: 'hover:bg-blue-100'
  },
  {
    id: 'deal',
    icon: '💰',
    label: 'Deal',
    color: 'bg-green-50 text-green-600',
    hoverColor: 'hover:bg-green-100'
  },
  {
    id: 'meeting',
    icon: '📅',
    label: 'Spotkanie',
    color: 'bg-purple-50 text-purple-600',
    hoverColor: 'hover:bg-purple-100'
  },
  {
    id: 'note',
    icon: '📝',
    label: 'Notatka',
    color: 'bg-orange-50 text-orange-600',
    hoverColor: 'hover:bg-orange-100'
  }
];

// Action button component
function ActionButton({ action, onClick }: { action: QuickAction; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-3 rounded-xl
        ${action.color} ${action.hoverColor}
        transition-colors min-w-[70px]
      `}
    >
      <span className="text-2xl mb-1">{action.icon}</span>
      <span className="text-xs font-medium">{action.label}</span>
    </motion.button>
  );
}

export function QuickActionsWidget({
  onCreateTask,
  onCreateDeal,
  onCreateMeeting,
  onCreateNote
}: QuickActionsWidgetProps) {
  const router = useRouter();

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'task':
        if (onCreateTask) {
          onCreateTask();
        } else {
          router.push('/dashboard/tasks?create=true');
        }
        break;
      case 'deal':
        if (onCreateDeal) {
          onCreateDeal();
        } else {
          router.push('/dashboard/deals?create=true');
        }
        break;
      case 'meeting':
        if (onCreateMeeting) {
          onCreateMeeting();
        } else {
          router.push('/dashboard/calendar?create=meeting');
        }
        break;
      case 'note':
        if (onCreateNote) {
          onCreateNote();
        } else {
          router.push('/dashboard/source?create=note');
        }
        break;
    }
  };

  return (
    <BentoCard
      title="Quick Actions"
      icon="⚡"
      variant="glass"
    >
      <div className="grid grid-cols-2 gap-2 h-full">
        {defaultActions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={() => handleAction(action.id)}
          />
        ))}
      </div>
    </BentoCard>
  );
}

export default QuickActionsWidget;
