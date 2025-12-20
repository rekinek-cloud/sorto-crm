export interface SmartMailboxRule {
  id?: string
  field: string
  operator: string
  value: string
  logicOperator?: 'AND' | 'OR'
  ruleOrder?: number
}

export interface SmartMailbox {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  isBuiltIn: boolean
  isActive: boolean
  displayOrder: number
  userId?: string
  organizationId: string
  lastAccessedAt?: string
  accessCount: number
  createdAt: string
  updatedAt: string
  rules: SmartMailboxRule[]
  count?: number
}

export interface SmartMailboxItemProps {
  mailbox: SmartMailbox
  isActive: boolean
  isCustom?: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export interface SmartMailboxListProps {
  selectedMailboxId?: string
  onSelectMailbox: (mailboxId: string) => void
}

export const mailboxColors = {
  red: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-700',
    border: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-500/30'
  },
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-700',
    border: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/30'
  },
  green: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-700',
    border: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/30'
  },
  yellow: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-700',
    border: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/30'
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-700',
    border: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/30'
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-700',
    border: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/30'
  },
  gray: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-700',
    border: 'border-slate-500/30',
    hoverBg: 'hover:bg-slate-500/30'
  }
}

export const ruleFields = [
  { value: 'urgencyScore', label: 'Urgency Score' },
  { value: 'actionNeeded', label: 'Action Needed' },
  { value: 'autoProcessed', label: 'AI Analyzed' },
  { value: 'needsResponse', label: 'Needs Response' },
  { value: 'priority', label: 'Priority' },
  { value: 'receivedAt', label: 'Received Date' },
  { value: 'attachments', label: 'Attachments' },
  { value: 'contact.isVIP', label: 'VIP Contact' },
  { value: 'subject', label: 'Subject' },
  { value: 'content', label: 'Content' },
  { value: 'fromAddress', label: 'From Address' }
]

export const ruleOperators = {
  urgencyScore: [
    { value: 'greater_than', label: 'większe niż' },
    { value: 'less_than', label: 'mniejsze niż' },
    { value: 'equals', label: 'równe' },
    { value: 'between', label: 'między' },
    { value: 'not_equals', label: 'różne od' }
  ],
  actionNeeded: [
    { value: 'equals', label: 'jest' },
    { value: 'not_equals', label: 'nie jest' }
  ],
  autoProcessed: [
    { value: 'equals', label: 'jest' },
    { value: 'not_equals', label: 'nie jest' }
  ],
  needsResponse: [
    { value: 'equals', label: 'jest' },
    { value: 'not_equals', label: 'nie jest' }
  ],
  priority: [
    { value: 'equals', label: 'jest' },
    { value: 'not_equals', label: 'nie jest' },
    { value: 'in', label: 'w zbiorze' },
    { value: 'not_in', label: 'nie w zbiorze' }
  ],
  receivedAt: [
    { value: 'equals', label: 'jest' },
    { value: 'greater_than', label: 'po dacie' },
    { value: 'less_than', label: 'przed datą' },
    { value: 'between', label: 'między datami' },
    { value: 'in_last_days', label: 'w ostatnich dniach' }
  ],
  attachments: [
    { value: 'not_empty', label: 'ma załączniki' },
    { value: 'empty', label: 'bez załączników' },
    { value: 'count_greater_than', label: 'więcej niż X załączników' }
  ],
  'contact.isVIP': [
    { value: 'equals', label: 'jest' },
    { value: 'not_equals', label: 'nie jest' }
  ],
  subject: [
    { value: 'contains', label: 'zawiera' },
    { value: 'not_contains', label: 'nie zawiera' },
    { value: 'starts_with', label: 'zaczyna się od' },
    { value: 'ends_with', label: 'kończy się na' },
    { value: 'equals', label: 'równe' },
    { value: 'regex', label: 'pasuje do wzorca' },
    { value: 'is_empty', label: 'jest puste' },
    { value: 'is_not_empty', label: 'nie jest puste' }
  ],
  content: [
    { value: 'contains', label: 'zawiera' },
    { value: 'not_contains', label: 'nie zawiera' },
    { value: 'regex', label: 'pasuje do wzorca' },
    { value: 'word_count_greater_than', label: 'więcej niż X słów' },
    { value: 'is_empty', label: 'jest puste' }
  ],
  fromAddress: [
    { value: 'equals', label: 'równe' },
    { value: 'not_equals', label: 'różne od' },
    { value: 'contains', label: 'zawiera' },
    { value: 'not_contains', label: 'nie zawiera' },
    { value: 'ends_with', label: 'kończy się na' },
    { value: 'in', label: 'w liście adresów' },
    { value: 'regex', label: 'pasuje do wzorca' }
  ]
}