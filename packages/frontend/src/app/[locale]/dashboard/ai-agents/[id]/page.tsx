'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Settings,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MessageSquare,
  Activity,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import { aiAgentsApi } from '@/lib/api/aiAgents';
import { AIAgent, AIAgentTask, AIAgentMessage, AI_CAPABILITIES } from '@/types/holding';
import toast from 'react-hot-toast';

const taskStatusConfig: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  PENDING: { label: 'Oczekuje', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  IN_PROGRESS: { label: 'W toku', icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50' },
  WAITING_APPROVAL: {
    label: 'Czeka na zatwierdzenie',
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  COMPLETED: {
    label: 'Ukończone',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  FAILED: { label: 'Błąd', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  CANCELLED: { label: 'Anulowane', icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50' },
};

const agentStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Aktywny', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Wstrzymany', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  DISABLED: { label: 'Wyłączony', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export default function AIAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [tasks, setTasks] = useState<AIAgentTask[]>([]);
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'settings' | 'messages'>('tasks');

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      const [agentData, tasksData] = await Promise.all([
        aiAgentsApi.getAgent(agentId),
        aiAgentsApi.getAgentTasks(agentId),
      ]);
      setAgent(agentData);
      setTasks(tasksData);
    } catch (err) {
      toast.error('Nie udało się pobrać danych agenta');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await aiAgentsApi.getMessages();
      setMessages(data.filter((m) => m.fromAgentId === agentId || m.toAgentId === agentId));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab, fetchMessages]);

  const handleToggleStatus = async () => {
    if (!agent) return;
    try {
      const newStatus = agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await aiAgentsApi.updateAgent(agentId, { status: newStatus as any });
      toast.success(newStatus === 'ACTIVE' ? 'Agent aktywowany' : 'Agent wstrzymany');
      fetchAgent();
    } catch (err) {
      toast.error('Nie udało się zmienić statusu');
    }
  };

  const handleToggleCapability = async (capId: string) => {
    if (!agent) return;
    const currentCaps = agent.capabilities || [];
    const newCaps = currentCaps.includes(capId)
      ? currentCaps.filter((c) => c !== capId)
      : [...currentCaps, capId];
    try {
      await aiAgentsApi.updateAgent(agentId, { capabilities: newCaps });
      toast.success('Uprawnienia zaktualizowane');
      fetchAgent();
    } catch (err) {
      toast.error('Nie udało się zaktualizować uprawnień');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20">
        <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Agent nie znaleziony</h2>
        <p className="text-sm text-gray-400 mb-4">Ten agent nie istnieje lub został usunięty</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Wróć
        </button>
      </div>
    );
  }

  const status = agentStatusConfig[agent.status] || agentStatusConfig.DISABLED;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Wróć do listy
      </button>

      {/* Agent header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-3xl">
              {agent.avatar || '\u{1F916}'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{agent.role}</p>
              {agent.description && (
                <p className="text-xs text-gray-400 mt-1 max-w-md">{agent.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                agent.status === 'ACTIVE'
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {agent.status === 'ACTIVE' ? (
                <>
                  <Pause className="w-4 h-4" /> Wstrzymaj
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Aktywuj
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{agent.tasksCompleted}</p>
            <p className="text-xs text-gray-400 mt-0.5">Zadań ukończonych</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{agent.successRate}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Skuteczność</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{agent.autonomyLevel}</p>
            <p className="text-xs text-gray-400 mt-0.5">Poziom autonomii</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{agent.capabilities?.length || 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Uprawnienia</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'tasks' as const, label: 'Zadania', icon: CheckCircle2 },
          { key: 'settings' as const, label: 'Ustawienia', icon: Settings },
          { key: 'messages' as const, label: 'Wiadomości', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tasks.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const taskStatus = taskStatusConfig[task.status] || taskStatusConfig.PENDING;
                const TaskIcon = taskStatus.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${taskStatus.bg}`}
                    >
                      <TaskIcon className={`w-4 h-4 ${taskStatus.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {task.createdAt
                          ? new Date(task.createdAt).toLocaleString('pl-PL')
                          : 'Brak daty'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${taskStatus.bg} ${taskStatus.color}`}
                    >
                      {taskStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Brak zadań</h3>
              <p className="text-xs text-gray-400">
                Ten agent nie wykonywał jeszcze żadnych zadań
              </p>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Autonomy level */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Poziom autonomii</h3>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={async () => {
                    try {
                      await aiAgentsApi.updateAgent(agentId, { autonomyLevel: level });
                      toast.success(`Poziom autonomii ustawiony na ${level}`);
                      fetchAgent();
                    } catch {
                      toast.error('Nie udało się zmienić poziomu');
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-150 ${
                    level <= agent.autonomyLevel
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <p className="text-lg font-bold">{level}</p>
                  <p className="text-[10px] mt-0.5">
                    {level === 1 && 'Minimalny'}
                    {level === 2 && 'Niski'}
                    {level === 3 && 'Średni'}
                    {level === 4 && 'Wysoki'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Uprawnienia
            </h3>
            <div className="space-y-2">
              {AI_CAPABILITIES.map((cap) => {
                const isEnabled = agent.capabilities?.includes(cap.id);
                return (
                  <div
                    key={cap.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-150 ${
                      isEnabled
                        ? 'border-purple-200 bg-purple-50/50'
                        : 'border-gray-100 bg-gray-50/30'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {cap.name}
                        {cap.requiresApproval && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            Wymaga zatwierdzenia
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{cap.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggleCapability(cap.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        isEnabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messages tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {messages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => {
                const isFromAgent = msg.fromAgentId === agentId;
                return (
                  <div key={msg.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isFromAgent ? (
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-xs">
                          {agent.avatar || '\u{1F916}'}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-blue-600" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {isFromAgent ? agent.name : 'Ty'}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {new Date(msg.createdAt).toLocaleString('pl-PL')}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          msg.type === 'ALERT'
                            ? 'bg-red-50 text-red-600'
                            : msg.type === 'APPROVAL_REQUEST'
                            ? 'bg-amber-50 text-amber-600'
                            : msg.type === 'RESULT'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {msg.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 pl-8">{msg.content}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Brak wiadomości</h3>
              <p className="text-xs text-gray-400">
                Nie ma jeszcze żadnych wiadomości z tym agentem
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
