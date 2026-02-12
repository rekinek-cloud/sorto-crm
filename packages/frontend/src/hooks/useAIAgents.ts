'use client';
import { useState, useEffect, useCallback } from 'react';
import { aiAgentsApi } from '@/lib/api/aiAgents';
import { AIAgent, AIAgentTask, AIAgentMessage, AIAgentTemplate } from '@/types/holding';

export function useAIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiAgentsApi.getAgents();
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
}

export function useAIAgentTasks(agentId: string) {
  const [tasks, setTasks] = useState<AIAgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const data = await aiAgentsApi.getAgentTasks(agentId);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, refetch: fetchTasks };
}

export function useAIMessages(unreadOnly = false) {
  const [messages, setMessages] = useState<AIAgentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiAgentsApi.getMessages({ unreadOnly });
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  return { messages, loading, refetch: fetchMessages };
}

export function useAIAgentTemplates() {
  const [templates, setTemplates] = useState<AIAgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAgentsApi.getTemplates()
      .then(setTemplates)
      .catch(err => console.error('Failed to load templates:', err))
      .finally(() => setLoading(false));
  }, []);

  return { templates, loading };
}
