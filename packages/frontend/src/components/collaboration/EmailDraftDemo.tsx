'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// =============================================================================
// EMAIL DRAFT DEMO - Auto drafts & Smart replies
// =============================================================================

interface EmailDraftResult {
  subject: string;
  body: string;
  tone: string;
  confidence: number;
  suggestions: string[];
}

interface SmartReplyResult {
  reply_text: string;
  reply_type: string;
  confidence: number;
  reasoning: string;
  suggested_subject: string;
  follow_up_actions: string[];
}

const EXAMPLE_SCENARIOS = [
  {
    id: 'meeting_invite',
    title: 'Zaproszenie na spotkanie',
    purpose: 'MEETING_INVITE',
    topic: 'Quarterly Review Meeting',
    key_points: [
      'Discuss Q4 results',
      'Plan for Q1 2026',
      'Review team performance'
    ]
  },
  {
    id: 'follow_up',
    title: 'Follow-up po spotkaniu',
    purpose: 'FOLLOW_UP',
    topic: 'Next steps after client meeting',
    key_points: [
      'Thank for meeting',
      'Recap key decisions',
      'Propose next steps with timeline'
    ]
  },
  {
    id: 'proposal',
    title: 'Propozycja biznesowa',
    purpose: 'PROPOSAL',
    topic: 'CRM Implementation Proposal',
    key_points: [
      'Present solution benefits',
      'Outline implementation timeline',
      'Provide pricing options'
    ]
  }
];

const EXAMPLE_EMAILS = [
  {
    id: 'urgent_request',
    from: 'client@example.com',
    subject: 'Urgent: Need pricing by tomorrow',
    body: 'Hi, we need the final pricing for the CRM project by tomorrow morning. Can you send it ASAP?',
    intent: 'ACCEPT'
  },
  {
    id: 'meeting_request',
    from: 'manager@example.com',
    subject: 'Can we reschedule tomorrow\'s meeting?',
    body: 'Hi, something urgent came up. Can we move our 2PM meeting to Thursday at the same time?',
    intent: 'ACCEPT'
  }
];

export default function EmailDraftDemo() {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [draftResult, setDraftResult] = useState<EmailDraftResult | null>(null);
  const [replyResult, setReplyResult] = useState<SmartReplyResult | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);

  // Generate draft email
  const handleGenerateDraft = async () => {
    if (!selectedScenario) {
      toast.error('Wybierz scenariusz!');
      return;
    }

    const scenario = EXAMPLE_SCENARIOS.find(s => s.id === selectedScenario);
    if (!scenario) return;

    setLoadingDraft(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            purpose: scenario.purpose,
            topic: scenario.topic,
            key_points: scenario.key_points,
            tone: 'PROFESSIONAL',
            urgency: 'NORMAL'
          },
          recipients: [
            {
              email: 'recipient@example.com',
              name: 'Jan Kowalski',
              role: 'CLIENT'
            }
          ],
          sender_name: 'Anna Nowak',
          sender_email: 'anna.nowak@company.com'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setDraftResult(data);
      toast.success('Szkic wygenerowany!');
    } catch (error: any) {
      console.error('Draft generation error:', error);
      toast.error(error.message || 'Błąd generowania szkicu');
    } finally {
      setLoadingDraft(false);
    }
  };

  // Generate smart reply
  const handleGenerateReply = async () => {
    if (!selectedEmail) {
      toast.error('Wybierz email!');
      return;
    }

    const email = EXAMPLE_EMAILS.find(e => e.id === selectedEmail);
    if (!email) return;

    setLoadingReply(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/collaboration/email/smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_email: {
            from: email.from,
            subject: email.subject,
            body: email.body
          },
          user_intent: email.intent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setReplyResult(data);
      toast.success('Odpowiedź wygenerowana!');
    } catch (error: any) {
      console.error('Smart reply error:', error);
      toast.error(error.message || 'Błąd generowania odpowiedzi');
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span>📧</span>
          <span>Email Draft & Smart Replies</span>
        </h2>
        <p className="text-gray-700">
          AI generuje automatyczne szkice emaili i inteligentne odpowiedzi na podstawie kontekstu
        </p>
      </Card>

      {/* Draft Email Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>✍️</span>
          <span>Generowanie szkicu emaila</span>
        </h3>

        {/* Scenario Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz scenariusz:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXAMPLE_SCENARIOS.map((scenario) => (
              <Button
                key={scenario.id}
                variant={selectedScenario === scenario.id ? 'default' : 'outline'}
                onClick={() => setSelectedScenario(scenario.id)}
                className="h-auto py-3 px-4 text-left"
              >
                <div>
                  <div className="font-semibold">{scenario.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{scenario.topic}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerateDraft}
          disabled={loadingDraft || !selectedScenario}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loadingDraft ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Generuję szkic...</span>
            </>
          ) : (
            '✍️ Wygeneruj szkic'
          )}
        </Button>

        {/* Draft Result */}
        {draftResult && (
          <div className="mt-6 space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">TEMAT:</label>
                <p className="font-semibold text-gray-900">{draftResult.subject}</p>
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">TREŚĆ:</label>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-sm">
                  {draftResult.body}
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>📊 Confidence: {(draftResult.confidence * 100).toFixed(0)}%</span>
                <span>🎭 Tone: {draftResult.tone}</span>
              </div>
              {draftResult.suggestions && draftResult.suggestions.length > 0 && (
                <div className="mt-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">💡 Sugestie:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {draftResult.suggestions.map((sug, idx) => (
                      <li key={idx}>• {sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Smart Reply Section */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <span>🤖</span>
          <span>Inteligentna odpowiedź</span>
        </h3>

        {/* Email Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz otrzymany email:
          </label>
          <div className="space-y-2">
            {EXAMPLE_EMAILS.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email.id)}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all border-2
                  ${selectedEmail === email.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-500">From:</span>
                    <span className="text-sm font-semibold ml-2">{email.from}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    email.intent === 'ACCEPT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {email.intent}
                  </span>
                </div>
                <p className="font-semibold text-sm mb-1">{email.subject}</p>
                <p className="text-xs text-gray-600">{email.body}</p>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerateReply}
          disabled={loadingReply || !selectedEmail}
          className="bg-green-600 hover:bg-green-700"
        >
          {loadingReply ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Generuję odpowiedź...</span>
            </>
          ) : (
            '🤖 Wygeneruj odpowiedź'
          )}
        </Button>

        {/* Reply Result */}
        {replyResult && (
          <div className="mt-6 space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1">TEMAT ODPOWIEDZI:</label>
                <p className="font-semibold text-gray-900">{replyResult.suggested_subject}</p>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1">TREŚĆ ODPOWIEDZI:</label>
                <div className="bg-white p-4 rounded whitespace-pre-wrap text-sm">
                  {replyResult.reply_text}
                </div>
              </div>
              <div className="flex gap-4 text-sm mb-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full font-semibold">
                  {replyResult.reply_type}
                </span>
                <span className="text-gray-600">
                  📊 Confidence: {(replyResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">💡 Uzasadnienie:</p>
                <p className="text-sm text-gray-600">{replyResult.reasoning}</p>
              </div>
              {replyResult.follow_up_actions && replyResult.follow_up_actions.length > 0 && (
                <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-1">📋 Follow-up akcje:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {replyResult.follow_up_actions.map((action, idx) => (
                      <li key={idx}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
