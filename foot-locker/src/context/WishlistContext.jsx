import { useCallback, useEffect, useMemo, useState } from 'react';
import { WishlistContext } from './wishlistContext.js';

const CHANGE = 'shoelocker-wishlist-changed';
let memoryIds = [];

/** @returns {string[]} */
function readIds() {
  return memoryIds;
}

/** @param {string[]} ids */
function writeIds(ids) {
  memoryIds = ids;
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
    function onChange() {
      setIds(readIds());
    }
    globalThis.addEventListener(CHANGE, onChange);
    return () => {
      globalThis.removeEventListener(CHANGE, onChange);
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
