import React from 'react';
import { Brain, FileText } from 'lucide-react';

interface AppIconProps {
  type: 'smart' | 'traditional';
  size?: number;
  className?: string;
}

const AppIcon: React.FC<AppIconProps> = ({ type, size = 48, className = '' }) => {
  if (type === 'smart') {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl pulse-gradient"></div>
        <div className="relative bg-white rounded-xl p-3 shadow-lg">
          <Brain 
            size={size} 
            className="text-indigo-600 animate-pulse-slow" 
          />
        </div>
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          SMART
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gray-100 rounded-xl p-3 shadow-sm">
        <FileText 
          size={size} 
          className="text-gray-600" 
        />
      </div>
    </div>
  );
};

export default AppIcon;