import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { fetchProducts } from '../utils/api.js';

/**
 * Loads catalog from the backend API.
 */
export function useProducts(opts = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchProducts({ signal, throwOnError: true });
        setProducts(list);
      } catch (e) {
        if (axios.isCancel(e)) return;
        setError('Could not load products. Pull to retry.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refetch = useCallback(() => {
    const ac = new AbortController();
    void load(ac.signal);
  }, [load]);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return useMemo(
    () => ({
      products,
      data: products,
      loading,
      error,
      refetch,
    }),
    [products, loading, error, refetch],
  );
}
