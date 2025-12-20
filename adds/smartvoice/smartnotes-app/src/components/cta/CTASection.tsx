import React, { useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import type { CTAProps } from '../../types';

const CTASection: React.FC<CTAProps> = ({ onInstall, loading = false, installed = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Gotowy na inteligentne notatki?
        </h3>
        <p className="text-gray-600 mb-6">
          Dołącz do tysięcy użytkowników, którzy już zrewolucjonizowali sposób robienia notatek
        </p>
        
        <div className="space-y-4">
          {!installed ? (
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={onInstall}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`w-full ${isHovered ? 'shadow-2xl' : ''}`}
            >
              <Download className="mr-2" size={20} />
              Pobierz SmartNotes za darmo
            </Button>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle size={24} />
              <span className="font-semibold">Aplikacja zainstalowana!</span>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>⭐ 4.9/5 ocena</span>
            <span>•</span>
            <span>10k+ pobrań</span>
            <span>•</span>
            <span>Darmowa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;