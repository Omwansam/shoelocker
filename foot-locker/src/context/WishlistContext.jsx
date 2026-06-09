import { useCallback, useEffect, useMemo, useState } from 'react';
import { WishlistContext } from './wishlistContext.js';
import { isLoggedIn } from '../utils/auth.js';
import {
  addWishlistItem,
  fetchWishlist,
  removeWishlistItem,
} from '../utils/api.js';

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
  const [products, setProducts] = useState([]);

  useEffect(() => {
    function onChange() {
      setIds(readIds());
    }
    globalThis.addEventListener(CHANGE, onChange);
    return () => {
      globalThis.removeEventListener(CHANGE, onChange);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    let active = true;
    async function load() {
      try {
        const items = await fetchWishlist();
        if (!active) return;
        setProducts(items);
        const slugIds = items.map((p) => p.id);
        writeIds(slugIds);
        setIds(slugIds);
      } catch {
        // Keep local state if API unavailable
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(async (id, backendProductId) => {
    const removing = ids.includes(id);
    const next = removing ? ids.filter((x) => x !== id) : [...ids, id];
    writeIds(next);
    setIds(next);

    if (!isLoggedIn() || !backendProductId) return;

    try {
      if (removing) {
        await removeWishlistItem(backendProductId);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        await addWishlistItem(backendProductId);
      }
    } catch {
      writeIds(ids);
      setIds(ids);
    }
  }, [ids]);

  const value = useMemo(
    () => ({
      ids,
      products,
      has,
      toggle,
      count: ids.length,
    }),
    [ids, products, has, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
