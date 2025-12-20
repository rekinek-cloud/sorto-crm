import React, { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, Loader2, Mic } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

interface ProjectAnalysis {
  projectName: string;
  clientName?: string;
  budget?: number;
  duration?: string;
  currency?: string;
  features: string[];
  suggestedTasks: Array<{
    title: string;
    description: string;
    estimatedHours: number;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
  nextSteps: string[];
  riskFactors?: string[];
}

interface VoiceProjectCreatorProps {
  onProjectCreated?: (project: any) => void;
  onClose?: () => void;
}

const VoiceProjectCreator: React.FC<VoiceProjectCreatorProps> = ({ 
  onProjectCreated, 
  onClose 
}) => {
  const [step, setStep] = useState<'recording' | 'processing' | 'analysis' | 'creating' | 'success'>('recording');
  const [transcription, setTranscription] = useState<string>('');
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string>('');
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);

  const handleAudioSave = async (audioBlob: Blob, duration: number) => {
    setStep('processing');
    setError('');

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/v1/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeResult = await transcribeResponse.json();
      const transcribedText = transcribeResult.data.text;
      setTranscription(transcribedText);

      // Step 2: Analyze project
      setStep('analysis');
      
      const analyzeResponse = await fetch('/api/v1/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: transcribedText,
          context: 'Użytkownik opisuje nowy projekt do realizacji w systemie CRM.'
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze project');
      }

      const analyzeResult = await analyzeResponse.json();
      setAnalysis(analyzeResult.data);
      setStep('analysis');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania');
      setStep('recording');
    }
  };

  const handleCreateProject = async () => {
    if (!analysis) return;

    setStep('creating');
    setError('');

    try {
      const response = await fetch('/api/v1/ai/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          autoCreate: autoCreateTasks
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      setStep('success');
      
      if (onProjectCreated) {
        onProjectCreated(result.data.project);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tworzenia projektu');
      setStep('analysis');
    }
  };

  const handleStartOver = () => {
    setStep('recording');
    setTranscription('');
    setAnalysis(null);
    setError('');
  };

  const renderContent = () => {
    switch (step) {
      case 'recording':
        return (
          <div>
            <VoiceRecorder onSave={handleAudioSave} onCancel={onClose} />
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Wskazówki dla lepszych rezultatów:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Wyraźnie wymów nazwę projektu i klienta</li>
                <li>• Podaj budżet i czas realizacji jeśli znasz</li>
                <li>• Opisz główne funkcjonalności</li>
                <li>• Wspomniej o technologiach lub wymaganiach</li>
              </ul>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 size={48} className="mx-auto text-primary-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Przetwarzanie nagrania...</h3>
            <p className="text-gray-600">Konwertuję głos na tekst przy pomocy AI</p>
          </div>
        );

      case 'analysis':
        return (
          <div className="text-center py-8">
            <Brain size={48} className="mx-auto text-primary-600 animate-pulse mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analizuję projekt...</h3>
            <p className="text-gray-600">AI wyciąga informacje o projekcie z Twojej notatki</p>
          </div>
        );

      case 'creating':
        return (
          <div className="text-center py-8">
            <Loader2 size={48} className="mx-auto text-primary-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tworzę projekt...</h3>
            <p className="text-gray-600">Zapisuję projekt w systemie CRM</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Projekt utworzony pomyślnie!</h3>
            <p className="text-gray-600 mb-4">Twój projekt został dodany do systemu CRM</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Zamknij
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Utwórz kolejny
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Utwórz projekt z notatki głosowej
        </h2>
        <p className="text-gray-600">
          Opowiedz o swoim projekcie, a AI automatycznie utworzy go w systemie CRM
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { key: 'recording', label: 'Nagrywanie', icon: Mic },
            { key: 'processing', label: 'Przetwarzanie', icon: Brain },
            { key: 'analysis', label: 'Analiza', icon: CheckCircle },
            { key: 'success', label: 'Gotowe', icon: CheckCircle }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step === key ? 'bg-primary-600 text-white' :
                ['processing', 'analysis', 'creating', 'success'].indexOf(step) > index ? 'bg-green-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                <Icon size={20} />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">{label}</span>
              {index < 3 && <div className="flex-1 h-0.5 bg-gray-200 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
          <AlertCircle size={20} className="text-red-600 mt-0.5 mr-3" />
          <div>
            <h4 className="font-medium text-red-900">Wystąpił błąd</h4>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Transcription Display */}
      {transcription && step !== 'recording' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Transkrypcja:</h4>
          <p className="text-gray-700 italic">"{transcription}"</p>
        </div>
      )}

      {/* Analysis Display */}
      {analysis && (step === 'analysis' || step === 'creating' || step === 'success') && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-4">📋 Analiza AI projektu:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Nazwa projektu:</strong> {analysis.projectName}
            </div>
            {analysis.clientName && (
              <div>
                <strong>Klient:</strong> {analysis.clientName}
              </div>
            )}
            {analysis.budget && (
              <div>
                <strong>Budżet:</strong> {analysis.budget} {analysis.currency || 'PLN'}
              </div>
            )}
            {analysis.duration && (
              <div>
                <strong>Czas realizacji:</strong> {analysis.duration}
              </div>
            )}
          </div>

          {analysis.features.length > 0 && (
            <div className="mb-4">
              <strong>Funkcjonalności:</strong>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                {analysis.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestedTasks.length > 0 && (
            <div className="mb-4">
              <strong>Proponowane zadania ({analysis.suggestedTasks.length}):</strong>
              <ul className="list-disc list-inside ml-4 text-gray-700">
                {analysis.suggestedTasks.map((task, index) => (
                  <li key={index}>
                    {task.title} ({task.estimatedHours}h, {task.priority})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 'analysis' && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="autoCreateTasks"
                  checked={autoCreateTasks}
                  onChange={(e) => setAutoCreateTasks(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="autoCreateTasks" className="text-sm text-gray-700">
                  Automatycznie utwórz wszystkie proponowane zadania
                </label>
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCreateProject}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Utwórz projekt
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Nagrywaj ponownie
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default VoiceProjectCreator;