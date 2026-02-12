'use client';

import React, { useState } from 'react';
import { SmartAnalysisResult } from '@/lib/api/smart';
import { smartApi } from '@/lib/api/smart';
import { toast } from 'react-hot-toast';
import {
  X,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Trophy,
  RefreshCw
} from 'lucide-react';

interface SmartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'task' | 'project';
  itemTitle: string;
  currentAnalysis?: SmartAnalysisResult | null;
  onAnalysisComplete?: (analysis: SmartAnalysisResult) => void;
}

export default function SmartAnalysisModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
  currentAnalysis,
  onAnalysisComplete
}: SmartAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<SmartAnalysisResult | null>(currentAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      let result;
      if (itemType === 'task') {
        result = await smartApi.analyzeTask(itemId);
        setAnalysis(result.analysis);
      } else {
        result = await smartApi.analyzeProject(itemId);
        setAnalysis(result.analysis);
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.analysis);
      }
      
      toast.success(`${itemType === 'task' ? 'Task' : 'Project'} analyzed successfully`);
    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast.error('Failed to analyze item');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const criteriaData = analysis ? [
    { name: 'Specific', key: 'specific' as const, icon: '🎯' },
    { name: 'Measurable', key: 'measurable' as const, icon: '📊' },
    { name: 'Achievable', key: 'achievable' as const, icon: '✅' },
    { name: 'Relevant', key: 'relevant' as const, icon: '🔗' },
    { name: 'Time-bound', key: 'timeBound' as const, icon: '⏰' }
  ] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">SMART Analysis</h2>
              <p className="text-sm text-gray-600">{itemTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!analysis ? (
            // Initial state - no analysis yet
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Analyze SMART Goals
              </h3>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Get detailed insights on how well this {itemType} meets SMART criteria 
                (Specific, Measurable, Achievable, Relevant, Time-bound).
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <BarChart3 className="h-5 w-5" />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Start Analysis'}</span>
              </button>
            </div>
          ) : (
            // Analysis results
            <div className="space-y-8">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Overall SMART Score</h3>
                    <p className="text-gray-600 mt-1">{analysis.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}/100
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{getScoreLabel(analysis.overallScore)}</p>
                  </div>
                </div>
              </div>

              {/* SMART Criteria Breakdown */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Criteria Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {criteriaData.map((criterion) => {
                    const data = analysis.criteria[criterion.key];
                    return (
                      <div key={criterion.key} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{criterion.icon}</span>
                            <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                          </div>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(data.score)}`}>
                            {data.score}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{data.analysis}</p>
                        {data.suggestions.length > 0 && (
                          <div className="space-y-1">
                            {data.suggestions.slice(0, 2).map((suggestion, idx) => (
                              <p key={idx} className="text-xs text-gray-500 flex items-start space-x-1">
                                <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{suggestion}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                {analysis.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Strengths</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysis.weaknesses.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Areas for Improvement</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-red-800">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Recommendations</h4>
                  </div>
                  <ul className="space-y-3">
                    {analysis.recommendations.map((recommendation, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-blue-800">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-analyze Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>{isAnalyzing ? 'Re-analyzing...' : 'Re-analyze'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}