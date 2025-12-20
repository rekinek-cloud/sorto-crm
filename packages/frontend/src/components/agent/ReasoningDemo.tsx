'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { reasoning } from '@/lib/api/ragClient';

// =============================================================================
// REASONING DEMO - Multi-step Reasoning
// =============================================================================

interface ComplexityAnalysis {
  is_complex: boolean;
  complexity_score: number;
  total_steps: number;
  sub_queries: Array<{
    step: number;
    query: string;
    reasoning: string;
    depends_on: number[];
    entity_type: string | null;
    expected_output: string;
  }>;
  final_synthesis: string;
}

interface ReasoningResult {
  original_query: string;
  plan: any;  // Dict[str, Any] from backend
  results: Array<any>;  // List[Dict[str, Any]] from backend
  final_answer: string;
  total_steps: number;
  successful_steps: number;
  total_time_ms: number;
}

const EXAMPLE_QUERIES = [
  "Porównaj naszą wydajność Q1 vs Q2 i wyjaśnij główne różnice",
  "Dlaczego spadły przychody w zeszłym miesiącu i co powinniśmy zrobić?",
  "Pokaż top performerów i wyjaśnij ich czynniki sukcesu",
  "Jakie są główne przyczyny opóźnień w projektach i jak je rozwiązać?"
];

export default function ReasoningDemo() {
  const [query, setQuery] = useState('');
  const [complexityResult, setComplexityResult] = useState<ComplexityAnalysis | null>(null);
  const [reasoningResult, setReasoningResult] = useState<ReasoningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeComplexity = async () => {
    if (!query.trim()) {
      toast.error('Wprowadź zapytanie do analizy');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await reasoning.analyzeComplexity(query, {});
      setComplexityResult(result);
      toast.success('Analiza kompleksowości ukończona!');
    } catch (error: any) {
      console.error('Error analyzing complexity:', error);
      toast.error(error.response?.data?.detail || 'Błąd analizy kompleksowości');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecuteReasoning = async () => {
    if (!query.trim()) {
      toast.error('Wprowadź zapytanie do wykonania');
      return;
    }

    setLoading(true);
    try {
      // Mock userId and organizationId (w produkcji pobierane z auth)
      const result = await reasoning.execute(query, 'user123', 'org456', {});
      setReasoningResult(result);
      toast.success('Rozumowanie ukończone!');
    } catch (error: any) {
      console.error('Error executing reasoning:', error);
      toast.error(error.response?.data?.detail || 'Błąd wykonania rozumowania');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: string) => {
    setQuery(example);
    setComplexityResult(null);
    setReasoningResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>🧠</span>
          <span>Multi-step Reasoning</span>
        </h2>
        <p className="text-gray-700">
          System analizuje złożone zapytania, rozbija je na kroki i wykonuje sekwencyjne rozumowanie
        </p>
      </Card>

      {/* Example Queries */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">📝 Przykładowe zapytania:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAMPLE_QUERIES.map((example, idx) => (
            <Button
              key={idx}
              variant="outline"
              onClick={() => loadExample(example)}
              className="text-left h-auto py-3 px-4 text-sm hover:bg-purple-50"
            >
              {example}
            </Button>
          ))}
        </div>
      </Card>

      {/* Query Input */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">🎯 Twoje zapytanie:</h3>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wpisz złożone zapytanie wymagające wieloetapowej analizy..."
          className="w-full p-4 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleAnalyzeComplexity}
            disabled={analyzing || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {analyzing ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Analizuję...</span>
              </>
            ) : (
              '🔍 Analyze Complexity'
            )}
          </Button>
          <Button
            onClick={handleExecuteReasoning}
            disabled={loading || !query.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Wykonuję...</span>
              </>
            ) : (
              '▶️ Execute Reasoning'
            )}
          </Button>
        </div>
      </Card>

      {/* Complexity Analysis Result */}
      {complexityResult && (
        <Card className="p-6 border-2 border-indigo-200 bg-indigo-50">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Analiza Kompleksowości</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-bold ${complexityResult.is_complex ? 'text-orange-600' : 'text-green-600'}`}>
                {complexityResult.is_complex ? '🔥 Złożone' : '✅ Proste'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Complexity Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {complexityResult.complexity_score.toFixed(1)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600">Liczba kroków</p>
              <p className="text-lg font-bold text-blue-600">
                {complexityResult.total_steps} {complexityResult.total_steps === 1 ? 'krok' : 'kroków'}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📋 Plan kroków rozumowania:</h4>
            <ol className="space-y-3">
              {complexityResult.sub_queries.map((sq, idx) => (
                <li key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex gap-2 items-start">
                    <span className="font-bold text-purple-600 min-w-[60px]">Krok {sq.step}:</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{sq.query}</p>
                      <p className="text-sm text-gray-600 mt-1">💡 {sq.reasoning}</p>
                      {sq.entity_type && (
                        <p className="text-xs text-blue-600 mt-1">📊 Typ: {sq.entity_type}</p>
                      )}
                      {sq.depends_on && sq.depends_on.length > 0 && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ Zależy od kroków: {sq.depends_on.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {complexityResult.final_synthesis && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg mt-4 border-2 border-purple-300">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>🎯</span>
                <span>Plan syntezy:</span>
              </h4>
              <p className="text-gray-700">{complexityResult.final_synthesis}</p>
            </div>
          )}
        </Card>
      )}

      {/* Reasoning Result */}
      {reasoningResult && (
        <Card className="p-6 border-2 border-purple-200 bg-purple-50">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>Wynik Rozumowania</span>
          </h3>

          {/* Execution Plan */}
          {reasoningResult.plan && (
            <div className="mb-6 bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>Plan rozumowania:</span>
              </h4>
              <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto max-h-48">
                {JSON.stringify(reasoningResult.plan, null, 2)}
              </pre>
            </div>
          )}

          {/* Execution Results */}
          {reasoningResult.results && reasoningResult.results.length > 0 && (
            <div className="mb-6 space-y-3">
              <h4 className="font-semibold">📝 Wyniki kroków:</h4>
              {reasoningResult.results.map((result, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Final Answer */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span>✅</span>
              <span>Końcowa Odpowiedź:</span>
            </h4>
            <p className="text-gray-800 leading-relaxed text-lg">
              {reasoningResult.final_answer}
            </p>
          </div>

          {/* Metadata */}
          <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span>📊 Kroków: {reasoningResult.total_steps}</span>
            <span>✅ Sukces: {reasoningResult.successful_steps}/{reasoningResult.total_steps}</span>
            <span>⏱️ Czas: {(reasoningResult.total_time_ms / 1000).toFixed(2)}s</span>
          </div>
        </Card>
      )}
    </div>
  );
}
