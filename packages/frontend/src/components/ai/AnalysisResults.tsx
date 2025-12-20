'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface AnalysisResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  executedActions: {
    actionId: string;
    type: string;
    result: any;
    error?: string;
  }[];
  aiResponses?: {
    promptId: string;
    modelId: string;
    response: string;
    tokensUsed: number;
    executionTime: number;
  }[];
  priority?: number;
  metadata: {
    executionTime: number;
    context: any;
  };
}

interface AnalysisResultsProps {
  results: AnalysisResult[];
  module: string;
  itemId: string;
  onClose?: () => void;
}

export default function AnalysisResults({ results, module, itemId, onClose }: AnalysisResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [expandedAI, setExpandedAI] = useState<Set<string>>(new Set());

  const toggleResult = (ruleId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedResults(newExpanded);
  };

  const toggleAI = (responseId: string) => {
    const newExpanded = new Set(expandedAI);
    if (newExpanded.has(responseId)) {
      newExpanded.delete(responseId);
    } else {
      newExpanded.add(responseId);
    }
    setExpandedAI(newExpanded);
  };

  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  const totalAIResponses = results.reduce((sum, r) => sum + (r.aiResponses?.length || 0), 0);
  const totalExecutionTime = results.reduce((sum, r) => sum + r.metadata.executionTime, 0);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Wyniki analizy AI
              </h3>
              <p className="text-sm text-gray-600">
                {module} • {itemId}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successfulResults.length}</div>
            <div className="text-sm text-gray-600">Udanych reguł</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{failedResults.length}</div>
            <div className="text-sm text-gray-600">Nieudanych reguł</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalAIResponses}</div>
            <div className="text-sm text-gray-600">Odpowiedzi AI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{(totalExecutionTime / 1000).toFixed(1)}s</div>
            <div className="text-sm text-gray-600">Czas wykonania</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <SparklesIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Brak wyników analizy</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <motion.div
                key={result.ruleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
              >
                {/* Rule Header */}
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleResult(result.ruleId)}
                >
                  <div className="flex items-center space-x-3">
                    {result.success ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-500" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{result.ruleName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {result.metadata.executionTime}ms
                        </span>
                        <span>Priorytet: {result.priority || 0}</span>
                        <span>{result.executedActions.length} akcji</span>
                        {result.aiResponses && result.aiResponses.length > 0 && (
                          <span className="flex items-center text-purple-600">
                            <SparklesIcon className="w-4 h-4 mr-1" />
                            {result.aiResponses.length} AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {expandedResults.has(result.ruleId) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedResults.has(result.ruleId) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 ml-9 space-y-4"
                    >
                      {/* Executed Actions */}
                      {result.executedActions.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Wykonane akcje:</h5>
                          <div className="space-y-2">
                            {result.executedActions.map((action) => (
                              <div 
                                key={action.actionId}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {action.type}
                                  </span>
                                  {action.error && (
                                    <p className="text-sm text-red-600 mt-1">{action.error}</p>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {action.error ? 'Błąd' : 'Sukces'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Responses */}
                      {result.aiResponses && result.aiResponses.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Odpowiedzi AI:</h5>
                          <div className="space-y-3">
                            {result.aiResponses.map((aiResponse, index) => (
                              <div key={`${aiResponse.promptId}_${index}`} className="border border-gray-200 rounded-lg">
                                <div 
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleAI(`${result.ruleId}_${index}`)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <CpuChipIcon className="w-5 h-5 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {aiResponse.modelId}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {aiResponse.tokensUsed} tokenów • {aiResponse.executionTime}ms
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DocumentTextIcon className="w-4 h-4 text-gray-400" />
                                    {expandedAI.has(`${result.ruleId}_${index}`) ? (
                                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedAI.has(`${result.ruleId}_${index}`) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="px-3 pb-3"
                                    >
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                          {aiResponse.response}
                                        </pre>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
        <p className="text-sm text-gray-500">
          Analiza zakończona • {new Date().toLocaleString('pl-PL')}
        </p>
      </div>
    </div>
  );
}