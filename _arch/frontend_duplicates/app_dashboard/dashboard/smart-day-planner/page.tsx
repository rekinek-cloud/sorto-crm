'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Task {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}

export default function SmartDayPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          setError('Brak tokenu - zaloguj sie ponownie');
          setLoading(false);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await axios.get(`${baseUrl}/api/v1/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        });

        const data = response.data?.data;
        setTasks(data?.items || data || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err?.response?.data?.error || err?.message || 'Blad pobierania zadan');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Ladowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px' }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>Blad</h2>
          <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
        📅 Planer Dnia
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Planuj swój dzień według priorytetów strumieni i zadań
      </p>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <strong>Zadania ({tasks.length})</strong>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>📋</p>
            <p>Brak zadan</p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ fontWeight: '500', color: '#111827' }}>{task.title}</span>
                {task.priority && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: task.priority === 'HIGH' ? '#fef3c7' : '#e5e7eb',
                    color: task.priority === 'HIGH' ? '#92400e' : '#374151'
                  }}>
                    {task.priority}
                  </span>
                )}
                {task.status && (
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: task.status === 'DONE' ? '#d1fae5' : '#dbeafe',
                    color: task.status === 'DONE' ? '#065f46' : '#1e40af'
                  }}>
                    {task.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
