'use client';

import { useState } from 'react';
// import { X } from 'lucide-react';
import type { InboxItem, ProcessInboxItemInput } from '@/lib/api/sourceInbox';
import { sourceInboxApi } from '@/lib/api/sourceInbox';

interface ProcessInboxModalProps {
  item: InboxItem;
  onClose: () => void;
  onComplete: () => void;
}

type Decision = ProcessInboxItemInput['decision'];

export default function ProcessInboxModal({ item, onClose, onComplete }: ProcessInboxModalProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Task data
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskContext, setTaskContext] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  
  // Project data
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  // Someday/Maybe data
  const [somedayTitle, setSomedayTitle] = useState('');
  const [somedayDescription, setSomedayDescription] = useState('');
  
  // Reference data
  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceTopic, setReferenceTopic] = useState('');

  const handleProcess = async () => {
    if (!decision) return;
    
    setProcessing(true);
    try {
      const input: ProcessInboxItemInput = { decision };
      
      // Add specific data based on decision
      switch (decision) {
        case 'DO':
        case 'DEFER':
        case 'DELEGATE':
          input.taskData = {
            title: taskTitle || item.content.substring(0, 100),
            description: taskDescription || item.note,
            priority: taskPriority,
            dueDate: taskDueDate || undefined,
            context: taskContext || undefined,
            assignedToId: decision === 'DELEGATE' ? taskAssignee : undefined
          };
          break;
          
        case 'PROJECT':
          input.projectData = {
            name: projectName || item.content.substring(0, 50),
            description: projectDescription || item.content
          };
          break;
          
        case 'SOMEDAY':
          input.somedayMaybeData = {
            title: somedayTitle || item.content.substring(0, 100),
            description: somedayDescription || item.note
          };
          break;
          
        case 'REFERENCE':
          input.referenceData = {
            title: referenceTitle || item.content.substring(0, 100),
            content: item.content,
            topic: referenceTopic || undefined
          };
          break;
      }
      
      await sourceInboxApi.processItem(item.id, input);
      onComplete();
    } catch (error: any) {
      console.error('Error processing item:', error);
      alert('Błąd podczas przetwarzania elementu');
    } finally {
      setProcessing(false);
    }
  };

  const decisions: Array<{ value: Decision; label: string; icon: string; description: string }> = [
    { value: 'DO', label: 'Zrób', icon: '✅', description: 'Przekształć w zadanie do wykonania teraz' },
    { value: 'DEFER', label: 'Odłóż', icon: '⏰', description: 'Zaplanuj na później' },
    { value: 'DELEGATE', label: 'Deleguj', icon: '👥', description: 'Przypisz komuś innemu' },
    { value: 'DELETE', label: 'Usuń', icon: '🗑️', description: 'Nie wymaga działania' },
    { value: 'REFERENCE', label: 'Referencja', icon: '📚', description: 'Zachowaj jako materiał referencyjny' },
    { value: 'PROJECT', label: 'Projekt', icon: '📁', description: 'Wymaga wielu kroków' },
    { value: 'SOMEDAY', label: 'Kiedyś/Może', icon: '💭', description: 'Może zrobię w przyszłości' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Przetwarzanie elementu Inbox</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Item content */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Element do przetworzenia:</h3>
              <p className="text-gray-900">{item.content}</p>
              {item.note && (
                <p className="text-sm text-gray-600 mt-2">{item.note}</p>
              )}
            </div>
            
            {/* Decision selection */}
            <div>
              <h3 className="font-medium mb-3">Co chcesz z tym zrobić?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {decisions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDecision(d.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      decision === d.value 
                        ? 'border-primary-600 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{d.icon}</div>
                    <div className="font-medium">{d.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{d.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Decision-specific forms */}
            {(decision === 'DO' || decision === 'DEFER' || decision === 'DELEGATE') && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Szczegóły zadania</h3>
                <input
                  type="text"
                  placeholder="Tytuł zadania"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                <textarea
                  placeholder="Opis (opcjonalny)"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="LOW">Niski priorytet</option>
                    <option value="MEDIUM">Średni priorytet</option>
                    <option value="HIGH">Wysoki priorytet</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Termin"
                  />
                </div>
                {decision === 'DELEGATE' && (
                  <input
                    type="text"
                    placeholder="Przypisz do (email lub ID)"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                )}
              </div>
            )}
            
            {decision === 'PROJECT' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Szczegóły projektu</h3>
                <input
                  type="text"
                  placeholder="Nazwa projektu"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                <textarea
                  placeholder="Opis projektu"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            )}
            
            {decision === 'SOMEDAY' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Szczegóły Kiedyś/Może</h3>
                <input
                  type="text"
                  placeholder="Tytuł"
                  value={somedayTitle}
                  onChange={(e) => setSomedayTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                <textarea
                  placeholder="Notatki"
                  value={somedayDescription}
                  onChange={(e) => setSomedayDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            )}
            
            {decision === 'REFERENCE' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Szczegóły referencji</h3>
                <input
                  type="text"
                  placeholder="Tytuł"
                  value={referenceTitle}
                  onChange={(e) => setReferenceTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Temat/Kategoria"
                  value={referenceTopic}
                  onChange={(e) => setReferenceTopic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Anuluj
          </button>
          <button
            onClick={handleProcess}
            disabled={!decision || processing}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Przetwarzanie...' : 'Przetwórz'}
          </button>
        </div>
      </div>
    </div>
  );
}