'use client';

import React, { useEffect } from 'react';
import { useHelp } from '@/contexts/help/HelpContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface HelpButtonProps {
  pageId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function HelpButton({ 
  pageId, 
  position = 'bottom-right',
  className = '' 
}: HelpButtonProps) {
  const { openHelp, currentPage, setCurrentPage } = useHelp();

  // Automatycznie ustaw currentPage jeśli pageId jest podane
  useEffect(() => {
    if (pageId) {
      setCurrentPage(pageId);
    }
  }, [pageId, setCurrentPage]);

  const handleClick = () => {
    openHelp(pageId || currentPage);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed z-40 p-3 rounded-full 
        bg-indigo-600 hover:bg-indigo-700 
        text-white shadow-lg hover:shadow-xl
        transition-all duration-200 ease-in-out
        hover:scale-110 active:scale-95
        group
        ${positionClasses[position]}
        ${className}
      `}
      aria-label="Pomoc kontekstowa"
    >
      <QuestionMarkCircleIcon className="w-6 h-6" />
      
      {/* Pulsująca animacja dla przyciągnięcia uwagi */}
      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
      </span>
      
      {/* Tooltip */}
      <span className="
        absolute bottom-full right-0 mb-2 px-3 py-1 
        bg-gray-900 text-white text-sm rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity
        whitespace-nowrap pointer-events-none
      ">
        Pomoc (?)
      </span>
    </button>
  );
}