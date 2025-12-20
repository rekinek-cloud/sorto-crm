'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HelpContextType {
  isOpen: boolean;
  currentPage: string;
  openHelp: (pageId?: string) => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  setCurrentPage: (pageId: string) => void;
  helpHistory: string[];
  clearHistory: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

interface HelpProviderProps {
  children: ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('');
  const [helpHistory, setHelpHistory] = useState<string[]>([]);

  const openHelp = useCallback((pageId?: string) => {
    if (pageId) {
      setCurrentPage(pageId);
      setHelpHistory(prev => [...prev, pageId].slice(-10)); // Zachowaj ostatnie 10
    }
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const clearHistory = useCallback(() => {
    setHelpHistory([]);
  }, []);

  const value: HelpContextType = {
    isOpen,
    currentPage,
    openHelp,
    closeHelp,
    toggleHelp,
    setCurrentPage,
    helpHistory,
    clearHistory
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}