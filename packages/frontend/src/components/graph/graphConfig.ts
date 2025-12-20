export const nodeConfig = {
  project: {
    color: '#8b5cf6',
    label: 'Projekt',
    icon: '📁'
  },
  task: {
    color: '#3b82f6',
    label: 'Zadanie',
    icon: '✓'
  },
  contact: {
    color: '#10b981',
    label: 'Kontakt',
    icon: '👤'
  },
  company: {
    color: '#f59e0b',
    label: 'Firma',
    icon: '🏢'
  },
  deal: {
    color: '#ef4444',
    label: 'Deal',
    icon: '💰'
  },
  document: {
    color: '#6366f1',
    label: 'Dokument',
    icon: '📄'
  },
  meeting: {
    color: '#ec4899',
    label: 'Spotkanie',
    icon: '📅'
  },
  communication: {
    color: '#14b8a6',
    label: 'Komunikacja',
    icon: '💬'
  },
  stream: {
    color: '#84cc16',
    label: 'Strumień',
    icon: '🌊'
  },
  invoice: {
    color: '#f97316',
    label: 'Faktura',
    icon: '🧾'
  },
  offer: {
    color: '#06b6d4',
    label: 'Oferta',
    icon: '📋'
  }
};

export const linkConfig = {
  default: {
    color: '#94a3b8',
    width: 1
  },
  strong: {
    color: '#475569',
    width: 2
  },
  dependency: {
    color: '#ef4444',
    width: 2,
    dashed: true
  }
};

export function getNodeColor(type: string): string {
  return nodeConfig[type as keyof typeof nodeConfig]?.color || '#64748b';
}

export function getNodeIcon(type: string): string {
  return nodeConfig[type as keyof typeof nodeConfig]?.icon || '•';
}

export function getNodeLabel(type: string): string {
  return nodeConfig[type as keyof typeof nodeConfig]?.label || type;
}