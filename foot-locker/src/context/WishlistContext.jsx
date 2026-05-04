import { useCallback, useEffect, useMemo, useState } from 'react';
import { WISHLIST_STORAGE_KEY } from '../config/storefrontStorageKeys.js';
import { WishlistContext } from './wishlistContext.js';

const CHANGE = 'shoelocker-wishlist-changed';

/** @returns {string[]} */
function readIds() {
  try {
    const raw = globalThis.localStorage?.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** @param {string[]} ids */
function writeIds(ids) {
  try {
    globalThis.localStorage?.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    //
  }
  try {
    globalThis.dispatchEvent(new CustomEvent(CHANGE));
  } catch {
    //
  }
}

/** @param {{ children: import('react').ReactNode }} props */
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => readIds());

  useEffect(() => {
    function onStorage() {
      setIds(readIds());
    }
    globalThis.addEventListener('storage', onStorage);
    globalThis.addEventListener(CHANGE, onStorage);
    return () => {
      globalThis.removeEventListener('storage', onStorage);
      globalThis.removeEventListener(CHANGE, onStorage);
    };
  }, []);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeIds(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ids,
      has,
      toggle,
      count: ids.length,
    }),
    [ids, has, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
