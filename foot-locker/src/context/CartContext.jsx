import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emitCartAnnounce } from '../utils/cartAnnounce.js';
import { CartContext } from './cartContext.js';

const CART_STORAGE_KEY = 'shoelocker-cart-v1';

/**
 * @typedef {import('../data/products.js').products extends (infer P)[] ? P : never} Product
 */

/**
 * @typedef {{
 *   lineId: string,
 *   productId: string,
 *   size: string,
 *   qty: number,
 *   snapshot: {
 *     name: string,
 *     brand: string,
 *     price: number,
 *     image: string,
 *   },
 * }} CartLineItem
 */

function lineKey(productId, size) {
  return `${productId}::${size}`;
}

/** @returns {CartLineItem[]} */
function readStoredItems() {
  try {
    const raw = globalThis.localStorage?.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {CartLineItem[]} items */
function writeStoredItems(items) {
  try {
    globalThis.localStorage?.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / privacy mode */
  }
}

/**
 * @typedef {{
 *   addItem: (product: Product, size: string, qty?: number, options?: { announce?: boolean }) => void,
 *   removeItem: (lineIdArg: string, options?: { announce?: boolean }) => void,
 *   updateQty: (lineIdArg: string, qty: number, options?: { announce?: boolean }) => void,
 *   clearCart: () => void,
 *   drawerOpen: boolean,
 *   openDrawer: () => void,
 *   closeDrawer: () => void,
 *   toggleDrawer: () => void,
 *   itemCount: number,
 *   subtotal: number,
 * }} Actions
 */

/** @param {{ children: React.ReactNode }} props */
export function CartProvider({ children }) {
  const [items, setItems] = useState(
    /** @type {CartLineItem[]} */ (() => readStoredItems()),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    writeStoredItems(items);
  }, [items]);

  const addItem = useCallback((product, size, qty = 1, options = {}) => {
    const { announce = true } = options;
    if (!product?.sizes?.includes(size)) return;
    const lid = lineKey(product.id, size);
    const snap = {
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
    };
    const prev = itemsRef.current;
    const idx = prev.findIndex((x) => x.lineId === lid);
    const merged = idx !== -1;
    let next;
    if (idx === -1) {
      next = [
        ...prev,
        {
          lineId: lid,
          productId: product.id,
          size,
          qty: Math.min(99, qty),
          snapshot: snap,
        },
      ];
    } else {
      next = prev.map((x, i) =>
        i === idx
          ? {
              ...x,
              qty: Math.min(99, x.qty + qty),
              snapshot: snap,
            }
          : x,
      );
    }
    itemsRef.current = next;
    setItems(next);

    if (announce) {
      globalThis.queueMicrotask(() => {
        emitCartAnnounce({
          kind: merged ? 'merge' : 'add',
          name: product.name,
        });
      });
    }
  }, []);

  const removeItem = useCallback((lineIdArg, options = {}) => {
    const { announce = false } = options;
    const prev = itemsRef.current;
    const line = prev.find((x) => x.lineId === lineIdArg);
    const next = prev.filter((x) => x.lineId !== lineIdArg);
    itemsRef.current = next;
    setItems(next);
    if (announce && line) {
      globalThis.queueMicrotask(() => {
        emitCartAnnounce({ kind: 'remove', name: line.snapshot.name });
      });
    }
  }, []);

  const updateQty = useCallback((lineIdArg, qty, options = {}) => {
    const { announce = false } = options;
    if (!Number.isFinite(qty)) return;
    const nextQty = Math.max(0, Math.min(99, Math.floor(qty)));
    const prev = itemsRef.current;
    const line = prev.find((x) => x.lineId === lineIdArg);
    let next;
    if (nextQty === 0) {
      next = prev.filter((x) => x.lineId !== lineIdArg);
    } else {
      next = prev.map((x) =>
        x.lineId === lineIdArg ? { ...x, qty: nextQty } : x,
      );
    }
    itemsRef.current = next;
    setItems(next);
    if (!announce || !line) return;
    globalThis.queueMicrotask(() => {
      emitCartAnnounce({
        kind: nextQty === 0 ? 'remove' : 'qty',
        name: line.snapshot.name,
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((a, x) => a + x.qty, 0);
    const subtotal = items.reduce((a, x) => a + x.snapshot.price * x.qty, 0);
    /** @type {Actions & { items: CartLineItem[] }} */
    const v = {
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      itemCount,
      subtotal,
    };
    return v;
  }, [
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    drawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  ]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}
