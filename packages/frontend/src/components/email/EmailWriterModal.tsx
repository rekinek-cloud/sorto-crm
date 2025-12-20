'use client';

import React, { useState, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Copy, Check, FileText, Zap, X, Cpu, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalMessage?: {
    id: string;
    subject?: string;
    content?: string;
    fromName?: string;
    fromAddress?: string;
  };
  onEmailGenerated?: (email: string) => void;
}

const EmailWriterModal: React.FC<EmailWriterModalProps> = ({
  isOpen,
  onClose,
  originalMessage,
  onEmailGenerated
}) => {
  const [rawThoughts, setRawThoughts] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // AI Provider states
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('MOCK');
  const [loadingProviders, setLoadingProviders] = useState(false);

  const tones = [
    { id: 'professional', label: 'Profesjonalny', description: 'Jasny i odpowiedni dla biznesu', icon: '💼' },
    { id: 'warm', label: 'Ciepły', description: 'Przyjazny i przystępny', icon: '😊' },
    { id: 'concise', label: 'Zwięzły', description: 'Krótki i konkretny', icon: '⚡' },
    { id: 'formal', label: 'Formalny', description: 'Tradycyjny i pełen szacunku', icon: '🎩' },
    { id: 'casual', label: 'Casualowy', description: 'Swobodny i konwersacyjny', icon: '☕' },
    { id: 'persuasive', label: 'Przekonujący', description: 'Angażujący i przekonywujący', icon: '🎯' }
  ];

  // Load AI providers on component mount
  useEffect(() => {
    if (isOpen) {
      loadAIProviders();
    }
  }, [isOpen]);

  const loadAIProviders = async () => {
    setLoadingProviders(true);
    try {
      // Try to get providers from AI Config
      const response = await fetch('/api/v1/admin/ai-config/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const providers = data.data || data || [];
        console.log('🔌 Loaded AI providers:', providers);
        
        // Add MOCK option and AI providers
        const allProviders = [
          { 
            id: 'MOCK', 
            name: 'MOCK', 
            displayName: 'Szablony lokalne (MOCK)',
            description: 'Używa lokalnych szablonów polskich',
            enabled: true 
          },
          ...providers.filter((p: any) => p.enabled)
        ];
        
        setAiProviders(allProviders);
        
        // Set first available AI provider as default if available
        const firstAIProvider = providers.find((p: any) => p.enabled && p.id !== 'MOCK');
        if (firstAIProvider) {
          setSelectedProvider(firstAIProvider.id);
        }
      } else {
        console.warn('Could not load AI providers, using MOCK only');
        setAiProviders([{ 
          id: 'MOCK', 
          name: 'MOCK', 
          displayName: 'Szablony lokalne (MOCK)',
          description: 'Używa lokalnych szablonów polskich',
          enabled: true 
        }]);
      }
    } catch (error: any) {
      console.error('Error loading AI providers:', error);
      setAiProviders([{ 
        id: 'MOCK', 
        name: 'MOCK', 
        displayName: 'Szablony lokalne (MOCK)',
        description: 'Używa lokalnych szablonów polskich',
        enabled: true 
      }]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const generateEmail = async () => {
    if (!rawThoughts.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Prepare request payload
      const payload: any = {
        rawThoughts: rawThoughts,
        tone: selectedTone,
        originalMessage: originalMessage ? {
          subject: originalMessage.subject,
          content: originalMessage.content,
          fromName: originalMessage.fromName,
          fromAddress: originalMessage.fromAddress
        } : null
      };
      
      // Add AI provider info if not MOCK
      if (selectedProvider !== 'MOCK') {
        payload.providerId = selectedProvider;
        payload.organizationId = localStorage.getItem('organizationId') || 'org-1'; // Fallback to default org
      }
      
      console.log('📨 Generating email with provider:', selectedProvider, payload);
      
      // API call do systemu AI
      const response = await fetch('/api/v1/ai/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas generowania emaila');
      }

      const data = await response.json();
      setGeneratedEmail(data.generatedEmail || data.email || 'Błąd podczas generowania emaila');
      
      // Log generation metadata
      if (data.metadata) {
        console.log('✅ Email generated:', {
          source: data.metadata.source,
          tone: data.metadata.tone,
          provider: selectedProvider
        });
      }
    } catch (error: any) {
      console.error('Error generating email:', error);
      setGeneratedEmail('Przepraszamy, wystąpił błąd podczas generowania emaila. Spróbuj ponownie.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const regenerateEmail = () => {
    if (rawThoughts.trim()) {
      generateEmail();
    }
  };

  const handleUseEmail = () => {
    if (generatedEmail && onEmailGenerated) {
      onEmailGenerated(generatedEmail);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/60 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    AI Email Assistant
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {originalMessage ? 'Odpowiedz na wiadomość za pomocą AI' : 'Utwórz wiadomość za pomocą AI'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Original Message Preview */}
            {originalMessage && (
              <div className="mt-4 p-4 bg-white/60 rounded-lg border border-slate-200">
                <div className="text-sm text-slate-600 mb-2">Odpowiadasz na:</div>
                <div className="text-sm">
                  <div className="font-medium">{originalMessage.subject || 'Bez tematu'}</div>
                  <div className="text-slate-500">Od: {originalMessage.fromName} &lt;{originalMessage.fromAddress}&gt;</div>
                  {originalMessage.content && (
                    <div className="mt-2 text-slate-600 line-clamp-3">
                      {originalMessage.content.substring(0, 200)}...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Input Section */}
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-slate-800">Twoje myśli</h3>
                  </div>
                  
                  <div className="flex-1 mb-4">
                    <textarea
                      value={rawThoughts}
                      onChange={(e) => setRawThoughts(e.target.value)}
                      placeholder="Napisz co chcesz przekazać... Na przykład: 'Potrzebuję kontynuacji rozmowy o propozycji projektu z zeszłego tygodnia. Chcę poznać harmonogram i następne kroki.'"
                      className="w-full h-32 resize-none border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  {/* Tone Selection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-600 mb-3">Wybierz ton</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tones.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => setSelectedTone(tone.id)}
                          className={`p-3 rounded-lg text-left transition-all duration-200 ${
                            selectedTone === tone.id
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{tone.icon}</span>
                            <span className="font-medium text-sm">{tone.label}</span>
                          </div>
                          <p className={`text-xs ${
                            selectedTone === tone.id ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {tone.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Provider Selection */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-purple-500" />
                      <h4 className="text-sm font-medium text-slate-600">AI Provider</h4>
                      {loadingProviders && (
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {aiProviders.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => setSelectedProvider(provider.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                            selectedProvider === provider.id
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {provider.id === 'MOCK' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                            <span className="font-medium text-sm">
                              {provider.displayName || provider.name}
                            </span>
                          </div>
                          <p className={`text-xs ${
                            selectedProvider === provider.id ? 'text-purple-100' : 'text-slate-500'
                          }`}>
                            {provider.description || `AI Provider: ${provider.name}`}
                          </p>
                        </button>
                      ))}
                      {aiProviders.length === 0 && !loadingProviders && (
                        <div className="text-center py-4 text-slate-500 text-sm">
                          Brak dostępnych AI providers
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateEmail}
                    disabled={!rawThoughts.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 px-6 rounded-lg 
                             hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generuję...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generuj Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output Section */}
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Send className="w-5 h-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-slate-800">Wygenerowany Email</h3>
                    </div>
                    
                    {generatedEmail && (
                      <div className="flex gap-2">
                        <button
                          onClick={regenerateEmail}
                          className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Wygeneruj ponownie"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Skopiuj do schowka"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto border border-slate-200">
                    {generatedEmail ? (
                      <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                          {generatedEmail}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                          </div>
                          <p className="text-slate-500 text-lg mb-2">Twój dopracowany email pojawi się tutaj</p>
                          <p className="text-slate-400 text-sm">Wpisz swoje myśli i wybierz ton, aby rozpocząć</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {generatedEmail && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleUseEmail}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Użyj tego emaila
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Skopiowano!' : 'Kopiuj'}
                      </button>
                    </div>
                  )}

                  {copied && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Email skopiowany do schowka!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmailWriterModal;