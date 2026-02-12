'use client';

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRuleTest } from '@/hooks/useRuleTest';

interface RuleTestRunnerProps {
  ruleId: string;
}

export function RuleTestRunner({ ruleId }: RuleTestRunnerProps) {
  const { isRunning, result, error, runTest, reset } = useRuleTest();
  const [entityType, setEntityType] = useState('EMAIL');
  const [testData, setTestData] = useState(JSON.stringify({
    sender: { email: 'test@example.com', domain: 'example.com' },
    subject: 'Test email subject',
    body: 'This is a test email body for rule testing.',
  }, null, 2));

  const handleRun = async () => {
    try {
      const parsed = JSON.parse(testData);
      await runTest(ruleId, entityType, parsed);
    } catch {
      // JSON parse error handled by display
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          <option value="EMAIL">Email</option>
          <option value="DOCUMENT">Dokument</option>
          <option value="OFFER">Oferta</option>
        </select>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Testowanie...' : 'Uruchom test'}
        </button>
        {(result || error) && (
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            Resetuj
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Dane testowe (JSON)
        </label>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 text-sm font-mono border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Blad testu</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">Test zakonczony</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.testResult?.finalClass && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Klasa</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{result.testResult.finalClass}</p>
              </div>
            )}
            {result.testResult?.finalConfidence != null && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pewnosc</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {(result.testResult.finalConfidence * 100).toFixed(0)}%
                </p>
              </div>
            )}
            {result.testResult?.addedToRag != null && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">RAG</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {result.testResult.addedToRag ? 'Tak' : 'Nie'}
                </p>
              </div>
            )}
            {result.testResult?.addedToFlow != null && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Flow</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {result.testResult.addedToFlow ? 'Tak' : 'Nie'}
                </p>
              </div>
            )}
          </div>

          <details className="group">
            <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
              Pelne wyniki (JSON)
            </summary>
            <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
