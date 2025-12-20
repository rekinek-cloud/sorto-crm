import React, { useState } from 'react';
import { Loader2, FileText, Brain, Tag } from 'lucide-react';
import { transcribeAudio, generateSummary, extractKeywords } from '../../utils/transcription';
import type { TranscriptionResult } from '../../utils/transcription';
import Button from '../common/Button';

interface TranscriptionViewProps {
  audioBlob: Blob | null;
  onTranscriptionComplete?: (result: TranscriptionResult, summary: string, keywords: string[]) => void;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ 
  audioBlob, 
  onTranscriptionComplete 
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const result = await transcribeAudio(audioBlob);
      setTranscriptionResult(result);
      
      // Auto-generate summary and keywords
      setIsGeneratingSummary(true);
      const [summaryText, keywordList] = await Promise.all([
        generateSummary(result.text),
        Promise.resolve(extractKeywords(result.text))
      ]);
      
      setSummary(summaryText);
      setKeywords(keywordList);
      setIsGeneratingSummary(false);

      if (onTranscriptionComplete) {
        onTranscriptionComplete(result, summaryText, keywordList);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  if (!audioBlob) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Nagraj audio aby rozpocząć transkrypcję</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Transkrypcja AI
        </h3>
      </div>

      {!transcriptionResult && !isTranscribing && (
        <div className="text-center">
          <Button
            onClick={handleTranscribe}
            variant="primary"
            size="lg"
            className="flex items-center space-x-2 mx-auto"
          >
            <Brain size={20} />
            <span>Rozpocznij transkrypcję</span>
          </Button>
        </div>
      )}

      {isTranscribing && (
        <div className="text-center py-8">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Przetwarzanie audio przez AI...</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {transcriptionResult && (
        <div className="space-y-6">
          {/* Transcription Text */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="mr-2" size={20} />
              Transkrypcja
              <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                {Math.round(transcriptionResult.confidence * 100)}% pewności
              </span>
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                {transcriptionResult.text}
              </p>
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Brain className="mr-2" size={20} />
              Streszczenie AI
              {isGeneratingSummary && <Loader2 className="ml-2 animate-spin" size={16} />}
            </h4>
            <div className="bg-indigo-50 p-4 rounded-lg">
              {isGeneratingSummary ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  <span className="text-gray-600">Generowanie streszczenia...</span>
                </div>
              ) : (
                <p className="text-indigo-800 font-medium">
                  {summary}
                </p>
              )}
            </div>
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Tag className="mr-2" size={20} />
                Kluczowe słowa
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Speaker Detection */}
          {transcriptionResult.speakers && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                Rozpoznani mówcy
              </h4>
              <div className="space-y-2">
                {transcriptionResult.speakers.map((speaker, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg">
                    <span className="font-medium text-blue-800">{speaker.speaker}:</span>
                    <span className="ml-2 text-gray-700">
                      {speaker.segments[0]?.text || 'Brak tekstu'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionView;