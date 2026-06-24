import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { searchProducts } from '../utils/api.js';

/**
 * Search the product catalog via the backend API.
 * @param {string} query
 * @param {{ enabled?: boolean, limit?: number, minLength?: number }} [opts]
 */
export function useProductSearch(query, opts = {}) {
  const enabled = opts.enabled !== false;
  const limit = opts.limit ?? 48;
  const minLength = opts.minLength ?? 1;
  const trimmed = query.trim();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [source, setSource] = useState(/** @type {'api' | 'local' | null} */ (null));

  const load = useCallback(
    async (signal) => {
      if (!enabled || trimmed.length < minLength) {
        setProducts([]);
        setError(null);
        setSource(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await searchProducts(trimmed, { signal, perPage: limit });
        setProducts(result.products);
        setSource(result.source);
      } catch (e) {
        if (axios.isCancel(e)) return;
        setError('Search is temporarily unavailable. Try again in a moment.');
        setProducts([]);
        setSource(null);
      } finally {
        setLoading(false);
      }
    },
    [enabled, trimmed, minLength, limit],
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return useMemo(
    () => ({
      products,
      loading,
      error,
      source,
      refetch: () => {
        const ac = new AbortController();
        void load(ac.signal);
      },
    }),
    [products, loading, error, source, load],
  );
}
