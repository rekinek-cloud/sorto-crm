'use client';

import React, { useState } from 'react';
import { LightBulbIcon, SparklesIcon, ArrowTrendingUpIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Recommendation {
  id: string;
  type: 'productivity' | 'organization' | 'automation' | 'insight';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  category: string;
  aiConfidence: number;
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    type: 'productivity',
    title: 'Przenieś 5 zadań do strumienia "W trakcie"',
    description: 'Masz zadania w Inbox od ponad 3 dni. Rozważ ich przetworzenie lub delegowanie.',
    impact: 'high',
    effort: 'easy',
    category: 'Zadania',
    aiConfidence: 94
  },
  {
    id: '2',
    type: 'automation',
    title: 'Automatyzuj sortowanie emaili z domeny firma.pl',
    description: 'Otrzymujesz regularnie emaile z tej domeny. Utwórz regułę automatycznego sortowania.',
    impact: 'medium',
    effort: 'easy',
    category: 'Email',
    aiConfidence: 87
  },
  {
    id: '3',
    type: 'organization',
    title: 'Skonsoliduj podobne projekty',
    description: 'Wykryto 3 projekty o podobnym zakresie. Rozważ ich połączenie dla lepszej przejrzystości.',
    impact: 'medium',
    effort: 'medium',
    category: 'Projekty',
    aiConfidence: 78
  },
  {
    id: '4',
    type: 'insight',
    title: 'Najproduktywniejsze godziny: 9:00-11:00',
    description: 'Analiza pokazuje, że najlepiej pracujesz rano. Planuj trudne zadania w tym czasie.',
    impact: 'high',
    effort: 'easy',
    category: 'Analityka',
    aiConfidence: 91
  },
  {
    id: '5',
    type: 'productivity',
    title: 'Zaplanuj przegląd tygodniowy',
    description: 'Minęło 10 dni od ostatniego przeglądu. Regularne przeglądy zwiększają produktywność o 25%.',
    impact: 'high',
    effort: 'medium',
    category: 'GTD',
    aiConfidence: 96
  }
];

const typeIcons = {
  productivity: ArrowTrendingUpIcon,
  organization: LightBulbIcon,
  automation: SparklesIcon,
  insight: LightBulbIcon
};

const typeColors = {
  productivity: 'bg-green-100 text-green-700',
  organization: 'bg-blue-100 text-blue-700',
  automation: 'bg-purple-100 text-purple-700',
  insight: 'bg-amber-100 text-amber-700'
};

const typeLabels = {
  productivity: 'Produktywność',
  organization: 'Organizacja',
  automation: 'Automatyzacja',
  insight: 'Insight'
};

const impactColors = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-gray-600'
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAccept = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleDismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <LightBulbIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rekomendacje AI</h1>
            <p className="text-sm text-gray-600">Inteligentne sugestie poprawy produktywności</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isGenerating
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          <SparklesIcon className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Analizuję...' : 'Generuj nowe'}
        </button>
      </div>

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Podsumowanie AI</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-amber-600">{recommendations.length}</div>
            <div className="text-sm text-gray-600">Aktywne sugestie</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-green-600">
              {recommendations.filter(r => r.impact === 'high').length}
            </div>
            <div className="text-sm text-gray-600">Wysoki wpływ</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-blue-600">
              {recommendations.filter(r => r.effort === 'easy').length}
            </div>
            <div className="text-sm text-gray-600">Łatwe do wdrożenia</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-2xl font-bold text-purple-600">89%</div>
            <div className="text-sm text-gray-600">Śr. pewność AI</div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wszystko zrobione!</h3>
            <p className="text-gray-500">Przejrzałeś wszystkie rekomendacje. Wygeneruj nowe, aby otrzymać więcej sugestii.</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const Icon = typeIcons[rec.type];
            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${typeColors[rec.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[rec.type]}`}>
                        {typeLabels[rec.type]}
                      </span>
                      <span className="text-sm text-gray-500">{rec.category}</span>
                      <span className={`text-sm font-medium ${impactColors[rec.impact]}`}>
                        • {rec.impact === 'high' ? 'Wysoki wpływ' : rec.impact === 'medium' ? 'Średni wpływ' : 'Niski wpływ'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <SparklesIcon className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-gray-600">Pewność AI: {rec.aiConfidence}%</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Nakład: {rec.effort === 'easy' ? 'Łatwy' : rec.effort === 'medium' ? 'Średni' : 'Trudny'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(rec.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Zastosuj
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
