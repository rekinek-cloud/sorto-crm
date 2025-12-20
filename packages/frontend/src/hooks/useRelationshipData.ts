import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import toast from 'react-hot-toast';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  originalId: string;
  metadata?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function useRelationshipData(
  entityId: string,
  entityType: string,
  depth: number = 2
) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/graph/relationships`, {
        params: {
          entityId,
          entityType,
          depth
        }
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch graph data');
      }
    } catch (err: any) {
      console.error('Graph API Error:', err);
      setError(err.message || 'Failed to load relationship data');
      toast.error('Nie udało się załadować danych powiązań');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, depth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}