import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import type { HeaderProps } from '../../types';

const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, onMenu }) => {
  return (
    <header className="flex items-center justify-between p-4 text-white">
      <button 
        onClick={onBack}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>
      
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/80">{subtitle}</p>
        )}
      </div>
      
      <button 
        onClick={onMenu}
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    </header>
  );
};

export default Header;