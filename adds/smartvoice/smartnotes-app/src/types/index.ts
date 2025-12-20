export interface AppFeature {
  text: string;
  positive: boolean;
}

export interface AppColumnProps {
  name: string;
  icon: React.ReactNode;
  features: AppFeature[];
  verdict: 'positive' | 'negative';
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
}

export interface CTAProps {
  onInstall: () => void;
  loading?: boolean;
  installed?: boolean;
}

export interface Recording {
  id: string;
  title: string;
  timestamp: Date;
  duration: number;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  speakers?: string[];
  tags?: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  recording?: Recording;
  timestamp: Date;
  lastModified: Date;
  tags: string[];
  category?: string;
}