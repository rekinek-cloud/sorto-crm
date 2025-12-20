import React, { useState } from 'react';
import { Send, Sparkles, RefreshCw, Copy, Check, FileText, Zap } from 'lucide-react';

const EmailWriterApp = () => {
  const [rawThoughts, setRawThoughts] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const tones = [
    { id: 'professional', label: 'Professional', description: 'Clear and business-appropriate', icon: '💼' },
    { id: 'warm', label: 'Warm', description: 'Friendly and approachable', icon: '😊' },
    { id: 'concise', label: 'Concise', description: 'Brief and to the point', icon: '⚡' },
    { id: 'formal', label: 'Formal', description: 'Traditional and respectful', icon: '🎩' },
    { id: 'casual', label: 'Casual', description: 'Relaxed and conversational', icon: '☕' },
    { id: 'persuasive', label: 'Persuasive', description: 'Compelling and convincing', icon: '🎯' }
  ];

  const generateEmail = async () => {
    if (!rawThoughts.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Note: Replace with actual OpenAI API call
      const response = await window.claude.complete(`
        Transform the following raw thoughts into a polished email with a ${selectedTone} tone:
        
        Raw thoughts: "${rawThoughts}"
        
        Please respond with ONLY the email content, no additional text or formatting. Make it sound natural and ${selectedTone}.
      `);
      
      setGeneratedEmail(response);
    } catch (error) {
      console.error('Error generating email:', error);
      setGeneratedEmail('Sorry, there was an error generating your email. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                AI Email Assistant
              </h1>
              <p className="text-slate-500 text-sm">Transform your thoughts into polished emails</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-slate-800">Your Thoughts</h2>
              </div>
              
              <div className="flex-1 mb-6">
                <textarea
                  value={rawThoughts}
                  onChange={(e) => setRawThoughts(e.target.value)}
                  placeholder="Type what you want to say... For example: 'Need to follow up on the project proposal we discussed last week. Want to know timeline and next steps.'"
                  className="w-full h-full resize-none border-0 focus:ring-0 text-slate-700 placeholder-slate-400 text-lg leading-relaxed bg-transparent"
                  style={{ outline: 'none' }}
                />
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 mb-3">Select Tone</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-3 rounded-xl text-left transition-all duration-200 ${
                        selectedTone === tone.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-[1.02]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
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

              {/* Generate Button */}
              <button
                onClick={generateEmail}
                disabled={!rawThoughts.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-4 px-6 rounded-xl 
                         hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                         transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-slate-800">Generated Email</h2>
                </div>
                
                {generatedEmail && (
                  <div className="flex gap-2">
                    <button
                      onClick={regenerateEmail}
                      className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-slate-50/50 rounded-xl p-4 overflow-y-auto">
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
                      <p className="text-slate-500 text-lg mb-2">Your polished email will appear here</p>
                      <p className="text-slate-400 text-sm">Enter your thoughts and select a tone to get started</p>
                    </div>
                  </div>
                )}
              </div>

              {copied && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Email copied to clipboard!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailWriterApp;