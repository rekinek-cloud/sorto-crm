'use client';

import React, { useState, useEffect } from 'react';
import { smartApi, SmartReportsResponse } from '@/lib/api/smart';
import SmartScoreBadge from './SmartScoreBadge';
import SmartAnalysisModal from './SmartAnalysisModal';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

type ReportType = 'tasks' | 'projects';

export default function SmartReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('tasks');
  const [reportsData, setReportsData] = useState<SmartReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState('smartScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, [reportType, selectedScoreRange, sortBy, sortOrder, currentPage]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      };

      if (selectedScoreRange !== 'all') {
        filters.scoreRange = selectedScoreRange;
      }

      let data;
      if (reportType === 'tasks') {
        data = await smartApi.getTaskReports(filters);
      } else {
        data = await smartApi.getProjectReports(filters);
      }
      
      setReportsData(data);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = (item: any) => {
    setSelectedItem(item);
    setShowAnalysisModal(true);
  };

  const handleBulkAnalyze = async () => {
    if (!reportsData) return;

    const items = reportType === 'tasks' ? reportsData.tasks : reportsData.projects;
    if (!items || items.length === 0) return;

    const itemIds = items
      .filter(item => !item.smartScore) // Only analyze items without scores
      .map(item => item.id)
      .slice(0, reportType === 'tasks' ? 50 : 20); // Respect API limits

    if (itemIds.length === 0) {
      toast('All visible items already have SMART scores');
      return;
    }

    try {
      setLoading(true);
      if (reportType === 'tasks') {
        await smartApi.bulkAnalyzeTasks(itemIds);
      } else {
        await smartApi.bulkAnalyzeProjects(itemIds);
      }
      
      toast.success(`Analyzed ${itemIds.length} ${reportType}`);
      loadReports(); // Refresh data
    } catch (error: any) {
      console.error('Error bulk analyzing:', error);
      toast.error('Failed to analyze items');
    } finally {
      setLoading(false);
    }
  };

  const getScoreRangeLabel = (range: string) => {
    switch (range) {
      case '80-100': return 'Excellent (80-100)';
      case '60-79': return 'Good (60-79)';
      case '40-59': return 'Fair (40-59)';
      case '0-39': return 'Poor (0-39)';
      default: return 'All Scores';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderStatistics = () => {
    if (!reportsData?.statistics) return null;

    const { statistics } = reportsData;
    const total = statistics.distribution.excellent + statistics.distribution.good + 
                  statistics.distribution.fair + statistics.distribution.poor;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Średni wynik RZUT</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.averageScore}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Doskonałe</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.distribution.excellent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Dobre</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.distribution.good}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Łącznie analizowanych</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalAnalyzed}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !reportsData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analiza Celów Precyzyjnych (RZUT)</h2>
          <p className="text-gray-600">Śledź i ulepszaj cele: Rezultat • Zmierzalność • Ujście • Tło</p>
        </div>
        <button
          onClick={handleBulkAnalyze}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <ChartBarIcon className="h-5 w-5" />
          )}
          Analizuj zbiorowo
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setReportType('tasks');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              reportType === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Zadania
          </button>
          <button
            onClick={() => {
              setReportType('projects');
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              reportType === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderIcon className="h-5 w-5 inline mr-2" />
            Strumienie projektowe
          </button>
        </nav>
      </div>

      {/* Statistics */}
      {renderStatistics()}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedScoreRange}
              onChange={(e) => {
                setSelectedScoreRange(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Wszystkie wyniki</option>
              <option value="80-100">Doskonałe (80-100)</option>
              <option value="60-79">Dobre (60-79)</option>
              <option value="40-59">Przeciętne (40-59)</option>
              <option value="0-39">Słabe (0-39)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sortuj wg:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="smartScore">Wynik RZUT</option>
              <option value="title">Tytuł</option>
              <option value="createdAt">Data utworzenia</option>
              <option value="updatedAt">Data aktualizacji</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Malejąco</option>
              <option value="asc">Rosnąco</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {reportsData && (reportType === 'tasks' ? reportsData.tasks : reportsData.projects)?.length === 0 ? (
          <div className="p-8 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Brak analizowanych {reportType === 'tasks' ? 'zadań' : 'strumieni'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Rozpocznij analizę aby zobaczyć wyniki RZUT.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {reportType === 'tasks' ? 'Zadanie' : 'Strumień'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wynik RZUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorytet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktualizacja
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportsData && (reportType === 'tasks' ? reportsData.tasks : reportsData.projects)?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reportType === 'tasks' ? item.title : item.name}
                          </div>
                          {item.stream && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.stream.color }}
                              />
                              {item.stream.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SmartScoreBadge
                        score={item.smartScore}
                        onClick={() => handleAnalyzeClick(item)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {reportsData?.pagination && reportsData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {reportsData.pagination.page} of {reportsData.pagination.pages}
            ({reportsData.pagination.total} total)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(reportsData.pagination.pages, prev + 1))}
              disabled={currentPage >= reportsData.pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && selectedItem && (
        <SmartAnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          itemId={selectedItem.id}
          itemType={reportType === 'tasks' ? 'task' : 'project'}
          itemTitle={reportType === 'tasks' ? selectedItem.title : selectedItem.name}
          currentAnalysis={selectedItem.smartAnalysis}
          onAnalysisComplete={() => {
            setShowAnalysisModal(false);
            loadReports();
          }}
        />
      )}
    </div>
  );
}