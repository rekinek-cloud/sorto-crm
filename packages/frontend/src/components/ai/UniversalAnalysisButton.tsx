'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Settings,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api/client';

interface AnalysisOption {
  type: string;
  name: string;
  description: string;
  estimatedTime: string;
  aiModel: string;
}

interface UniversalAnalysisButtonProps {
  module: 'projects' | 'tasks' | 'deals' | 'contacts' | 'communication';
  itemId: string;
  itemData?: Record<string, any>;
  component?: string;
  variant?: 'button' | 'icon' | 'compact';
  onAnalysisComplete?: (results: any) => void;
}

export default function UniversalAnalysisButton({
  module,
  itemId,
  itemData,
  component,
  variant = 'button',
  onAnalysisComplete
}: UniversalAnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableAnalyses, setAvailableAnalyses] = useState<AnalysisOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const loadAnalysisOptions = async () => {
    if (availableAnalyses.length > 0) return;
    
    setLoadingOptions(true);
    try {
      const response = await api.get('/universal-rules/available');
      const moduleAnalyses = response.data.data[module] || [];
      setAvailableAnalyses(moduleAnalyses);
    } catch (error: any) {
      toast.error('Błąd podczas ładowania opcji analizy');
      console.error('Nie udało się załadować opcji analizy:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const runAnalysis = async (analysisType?: string, customPrompt?: string) => {
    setIsAnalyzing(true);
    setIsOpen(false);

    try {
      const response = await api.post('/universal-rules/analyze', {
        module,
        component,
        itemId,
        analysisType,
        customPrompt
      });

      if (response.data.success) {
        toast.success(`Analiza zakończona! Wykonano ${response.data.successfulRules} reguł`);
        onAnalysisComplete?.(response.data.results);
      } else {
        toast.error('Analiza nie powiodła się');
      }
    } catch (error: any) {
      toast.error('Błąd podczas analizy');
      console.error('Analiza nie powiodła się:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAnalysis = () => {
    runAnalysis(); // Run all applicable rules
  };

  const handleOptionClick = () => {
    setIsOpen(true);
    loadAnalysisOptions();
  };

  // Render different variants
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleQuickAnalysis}
          disabled={isAnalyzing}
          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
          title="Uruchom analizę AI"
        >
          {isAnalyzing ? (
            <Settings className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </button>

        {/* Options Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Analiza AI - {module}
                </h3>
              </div>
              
              <div className="p-6">
                {loadingOptions ? (
                  <div className="text-center py-4">
                    <Settings className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Ładowanie opcji...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableAnalyses.map((analysis) => (
                      <button
                        key={analysis.type}
                        onClick={() => runAnalysis(analysis.type)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{analysis.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {analysis.estimatedTime}
                              </span>
                              <span>{analysis.aiModel}</span>
                            </div>
                          </div>
                          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleQuickAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
        >
          {isAnalyzing ? (
            <Settings className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Analizuj</span>
        </button>

        <button
          onClick={handleOptionClick}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          title="Opcje analizy"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleQuickAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Settings className="w-5 h-5 animate-spin" />
              <span>Analizowanie...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analiza AI</span>
            </>
          )}
        </button>

        <button
          onClick={handleOptionClick}
          disabled={isAnalyzing}
          className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Opcje analizy"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Detailed Options Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  <Sparkles className="w-6 h-6 inline mr-2 text-purple-500" />
                  Analiza AI - {module.charAt(0).toUpperCase() + module.slice(1)}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loadingOptions ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-4">Ładowanie dostępnych analiz...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Dostępne analizy:</h4>
                    <div className="grid gap-4">
                      {availableAnalyses.map((analysis) => (
                        <motion.button
                          key={analysis.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => runAnalysis(analysis.type)}
                          className="text-left p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-2">{analysis.name}</h5>
                              <p className="text-sm text-gray-600 mb-3">{analysis.description}</p>
                              <div className="flex items-center space-x-6 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {analysis.estimatedTime}
                                </span>
                                <span className="flex items-center">
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  {analysis.aiModel}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Sparkles className="w-8 h-8 text-purple-500" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Lub uruchom szybką analizę:</h4>
                    <button
                      onClick={() => runAnalysis()}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Uruchom wszystkie dostępne analizy</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}