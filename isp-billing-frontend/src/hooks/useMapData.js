import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useMapData(refreshInterval = 30000) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMapData = useCallback(async () => {
    try {
      const response = await api.get('/network');
      setNodes(response.data.nodes || []);
      setEdges(response.data.edges || []);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data peta');
      console.error('Map data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData();

    // Auto-refresh interval
    const interval = setInterval(fetchMapData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMapData, refreshInterval]);

  return { nodes, edges, loading, error, refetch: fetchMapData };
}

export function useLiveMapData(refreshInterval = 5000) {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const response = await api.get('/network/map-live');
        setData(response.data);
      } catch (err) {
        console.error('Live map error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { ...data, loading };
}