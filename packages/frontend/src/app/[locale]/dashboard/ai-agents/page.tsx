'use client';

import { Bot } from 'lucide-react';
import AIAgentPanel from '@/components/ai-agents/AIAgentPanel';

export default function AIAgentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Agenci</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Zarządzaj agentami AI wspierającymi Twój zespół
            </p>
          </div>
        </div>
      </div>

      <AIAgentPanel />
    </div>
  );
}
