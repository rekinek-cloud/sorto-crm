import React from 'react';
import { Check, X } from 'lucide-react';
import type { AppFeature } from '../../types';

interface FeatureListProps {
  features: AppFeature[];
}

const FeatureList: React.FC<FeatureListProps> = ({ features }) => {
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li 
          key={index}
          className={`flex items-center space-x-3 text-sm ${
            feature.positive ? 'text-green-700' : 'text-red-600'
          }`}
        >
          <div className={`flex-shrink-0 ${
            feature.positive ? 'text-green-500' : 'text-red-500'
          }`}>
            {feature.positive ? (
              <Check size={16} />
            ) : (
              <X size={16} />
            )}
          </div>
          <span>{feature.text}</span>
        </li>
      ))}
    </ul>
  );
};

export default FeatureList;