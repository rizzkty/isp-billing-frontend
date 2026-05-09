import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export function useDataFetch(endpoint, options = {}) {
  const { perPage = 10, autoFetch = true } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoint, {
        params: { page, per_page: perPage }
      });

      // Handle different response formats
      const result = response.data;
      if (Array.isArray(result)) {
        setData(result);
        setTotalPages(1);
      } else if (result.data) {
        setData(result.data);
        setTotalPages(result.last_page || Math.ceil(result.total / perPage) || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, perPage]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);

  const goToPage = (page) => {
    setCurrentPage(page);
    fetchData(page);
  };

  const refresh = () => fetchData(currentPage);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    refresh,
    isEmpty: !loading && data.length === 0
  };
}

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}