import React from 'react';
import AppColumn from './AppColumn';
import AppIcon from '../common/AppIcon';
import type { AppFeature } from '../../types';

const ComparisonView: React.FC = () => {
  const traditionalFeatures: AppFeature[] = [
    { text: "Tylko tekst", positive: false },
    { text: "Brak wsparcia spotkań", positive: false },
    { text: "Ręczne wpisywanie", positive: false },
    { text: "Podstawowe formatowanie", positive: false },
    { text: "Brak automatyzacji", positive: false },
    { text: "Jedna osoba na raz", positive: false }
  ];

  const smartFeatures: AppFeature[] = [
    { text: "Głos + tekst + AI", positive: true },
    { text: "Nagrywanie spotkań", positive: true },
    { text: "Automatyczna transkrypcja", positive: true },
    { text: "Inteligentne streszczenia", positive: true },
    { text: "Rozpoznawanie mówców", positive: true },
    { text: "Współpraca zespołowa", positive: true }
  ];

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Porównanie Aplikacji</h2>
        <p className="text-gray-600">Tradycyjne vs Inteligentne Notatki</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppColumn
          name="Tradycyjne Notatki"
          icon={<AppIcon type="traditional" />}
          features={traditionalFeatures}
          verdict="negative"
        />
        
        <AppColumn
          name="SmartNotes AI"
          icon={<AppIcon type="smart" />}
          features={smartFeatures}
          verdict="positive"
        />
      </div>
    </div>
  );
};

export default ComparisonView;