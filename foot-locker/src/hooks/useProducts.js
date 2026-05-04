import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { subscribeCatalogChange } from '../utils/catalogStorage.js';
import { fetchProducts } from '../utils/api.js';

/**
 * Loads catalog via axios-backed mock API.
 * @param {{ delayMs?: number }} [opts]
 */
export function useProducts(opts = {}) {
  const delayMs = opts.delayMs ?? 400;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchProducts({ signal, delayMs });
        setProducts(list);
      } catch (e) {
        if (axios.isCancel(e)) return;
        setError('Could not load products. Pull to retry.');
      } finally {
        setLoading(false);
      }
    },
    [delayMs],
  );

  const refetch = useCallback(() => {
    const ac = new AbortController();
    void load(ac.signal);
  }, [load]);

  useEffect(() => {
    const ac = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mock API bootstrap
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  useEffect(() => subscribeCatalogChange(() => refetch()), [refetch]);

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
