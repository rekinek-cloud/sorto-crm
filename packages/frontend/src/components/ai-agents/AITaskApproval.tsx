'use client';

import { useState } from 'react';
import { X, CheckCircle2, XCircle, Bot, FileText, AlertTriangle } from 'lucide-react';
import { AIAgentTask } from '@/types/holding';

interface Props {
  task: AIAgentTask;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

const taskStatusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Oczekuje', color: 'text-gray-500' },
  IN_PROGRESS: { label: 'W toku', color: 'text-blue-600' },
  WAITING_APPROVAL: { label: 'Czeka na zatwierdzenie', color: 'text-amber-600' },
  COMPLETED: { label: 'Ukończone', color: 'text-emerald-600' },
  FAILED: { label: 'Błąd', color: 'text-red-600' },
  CANCELLED: { label: 'Anulowane', color: 'text-gray-400' },
};

export default function AITaskApproval({ task, onApprove, onReject, onClose }: Props) {
  const [modifications, setModifications] = useState('');
  const [showModifications, setShowModifications] = useState(false);

  const status = taskStatusLabels[task.status] || taskStatusLabels.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Zatwierdzenie zadania</h2>
              <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Task type */}
          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Typ zadania
            </label>
            <p className="mt-1 text-sm font-medium text-gray-900">{task.type}</p>
          </div>

          {/* Agent info */}
          {task.agent && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-lg">
                {task.agent.avatar || '\u{1F916}'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{task.agent.name}</p>
                <p className="text-xs text-gray-400">Agent AI</p>
              </div>
              <Bot className="w-4 h-4 text-purple-400 ml-auto" />
            </div>
          )}

          {/* Input summary */}
          {task.input && Object.keys(task.input).length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Dane wejściowe
              </label>
              <div className="mt-1.5 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                {Object.entries(task.input).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 py-1">
                    <span className="text-xs font-medium text-gray-500 min-w-[80px]">{key}:</span>
                    <span className="text-xs text-gray-700">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output/Result preview */}
          {(task.output || task.result) && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Wynik
              </label>
              <div className="mt-1.5 px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
                {task.result ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.result}</p>
                ) : (
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(task.output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          {task.prompt && (
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Prompt
              </label>
              <p className="mt-1 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                {task.prompt}
              </p>
            </div>
          )}

          {/* Modifications textarea */}
          <div>
            {!showModifications ? (
              <button
                onClick={() => setShowModifications(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Dodaj modyfikacje
              </button>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Modyfikacje (opcjonalne)
                </label>
                <textarea
                  value={modifications}
                  onChange={(e) => setModifications(e.target.value)}
                  placeholder="Opisz wymagane zmiany..."
                  rows={3}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onReject}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors duration-150 border border-red-100"
          >
            <XCircle className="w-4 h-4" />
            Odrzuć
          </button>
          <button
            onClick={onApprove}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors duration-150 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Zatwierdź
          </button>
        </div>
      </div>
    </div>
  );
}
