import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { brandNavLink, normalizeStorefrontBrand } from '../utils/brandShop.js';
import { fetchStorefrontBrands } from '../utils/api.js';

/** @typedef {ReturnType<typeof normalizeStorefrontBrand>} StorefrontBrand */

/** @param {unknown} err */
function extractBrandError(err) {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = /** @type {{ data?: { error?: string } }} */ (err).response?.data;
    if (data?.error) return String(data.error);
  }
  if (err instanceof Error) return err.message;
  return 'Could not load brands from the server.';
}

export const StorefrontBrandsContext = createContext(
  /** @type {{
   *   featured: StorefrontBrand[],
   *   wall: StorefrontBrand[],
   *   allBrands: StorefrontBrand[],
   *   navBrands: { title: string, href: string }[],
   *   loading: boolean,
   *   error: string,
   *   refetch: () => Promise<void>,
   * } | null} */ (null),
);

/** @param {{ children: import('react').ReactNode }} props */
export function StorefrontBrandsProvider({ children }) {
  const [featured, setFeatured] = useState(/** @type {StorefrontBrand[]} */ ([]));
  const [wall, setWall] = useState(/** @type {StorefrontBrand[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStorefrontBrands({ signal });
      setFeatured((data.featured || []).map(normalizeStorefrontBrand).slice(0, 3));
      setWall((data.wall || []).map(normalizeStorefrontBrand));
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setFeatured([]);
      setWall([]);
      setError(extractBrandError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  const allBrands = useMemo(() => {
    const seen = new Set();
    /** @type {StorefrontBrand[]} */
    const list = [];
    for (const brand of [...featured, ...wall]) {
      const key = brand.slug || brand.id;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(brand);
    }
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [featured, wall]);

  const navBrands = useMemo(() => {
    const featuredKeys = new Set(featured.map((b) => b.slug || b.id));
    const ordered = [
      ...featured,
      ...wall.filter((b) => !featuredKeys.has(b.slug || b.id)),
    ];
    return ordered.slice(0, 9).map(brandNavLink);
  }, [featured, wall]);

  const value = useMemo(
    () => ({
      featured,
      wall,
      allBrands,
      navBrands,
      loading,
      error,
      refetch,
    }),
    [featured, wall, allBrands, navBrands, loading, error, refetch],
  );

  return (
    <StorefrontBrandsContext.Provider value={value}>
      {children}
    </StorefrontBrandsContext.Provider>
  );
}
