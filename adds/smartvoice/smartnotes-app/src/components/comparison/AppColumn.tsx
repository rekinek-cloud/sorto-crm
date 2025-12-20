import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { AppColumnProps } from '../../types';
import FeatureList from './FeatureList';

const AppColumn: React.FC<AppColumnProps> = ({ name, icon, features, verdict }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
        <div className="flex justify-center">
          {verdict === 'positive' ? (
            <CheckCircle className="text-green-500" size={24} />
          ) : (
            <XCircle className="text-red-500" size={24} />
          )}
        </div>
      </div>
      
      <div className="border-t pt-4">
        <FeatureList features={features} />
      </div>
    </div>
  );
};

export default AppColumn;