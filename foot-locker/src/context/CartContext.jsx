import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emitCartAnnounce } from '../utils/cartAnnounce.js';
import { CartContext } from './cartContext.js';
import { isLoggedIn } from '../utils/auth.js';
import {
  addCartItem,
  clearServerCart,
  loadPersistedCart,
  removeCartItem,
  updateCartItem,
} from '../utils/api.js';

/**
 * @typedef {import('../types/product.js').Product} Product
 */

/**
 * @typedef {{
 *   lineId: string,
 *   productId: string,
 *   backendProductId?: number,
 *   serverCartItemId?: number,
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

const GUEST_CART_KEY = 'shoelocker-cart';

function lineKey(productId, size) {
  return `${productId}::${size}`;
}

/** @returns {CartLineItem[]} */
function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** @param {CartLineItem[]} items */
function writeGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    //
  }
}

/** @param {{ children: React.ReactNode }} props */
export function CartProvider({ children }) {
  const [items, setItems] = useState(/** @type {CartLineItem[]} */ ([]));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refetchServerCart = useCallback(async () => {
    const lines = await loadPersistedCart();
    itemsRef.current = lines;
    setItems(lines);
  }, []);

  const loadCart = useCallback(async () => {
    if (isLoggedIn()) {
      try {
        let lines = await loadPersistedCart();
        if (!lines.length) {
          const guest = readGuestCart();
          if (guest.length) {
            for (const line of guest) {
              if (!line.backendProductId) continue;
              await addCartItem({
                product_id: line.backendProductId,
                quantity: line.qty,
                size: line.size,
                image_url: line.snapshot?.image,
              });
            }
            lines = await loadPersistedCart();
            writeGuestCart([]);
          }
        }
        itemsRef.current = lines;
        setItems(lines);
      } catch {
        setItems([]);
      }
    } else {
      const guest = readGuestCart();
      itemsRef.current = guest;
      setItems(guest);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    function onAuthChange() {
      void loadCart();
    }
    globalThis.addEventListener('shoelocker-auth-changed', onAuthChange);
    return () => globalThis.removeEventListener('shoelocker-auth-changed', onAuthChange);
  }, [loadCart]);

  useEffect(() => {
    if (!hydrated || isLoggedIn()) return;
    writeGuestCart(items);
  }, [items, hydrated]);

  const addItem = useCallback(async (product, size, qty = 1, options = {}) => {
    const { announce = true } = options;
    if (!product?.sizes?.includes(size)) return;

    if (isLoggedIn() && product.product_id) {
      try {
        await addCartItem({
          product_id: product.product_id,
          quantity: qty,
          size,
          image_url: product.image,
        });
        await refetchServerCart();
        if (announce) {
          globalThis.queueMicrotask(() => {
            emitCartAnnounce({ kind: 'add', name: product.name });
          });
        }
      } catch (err) {
        console.warn('Failed to sync cart add:', err);
      }
      return;
    }

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
          backendProductId: product.product_id,
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
              backendProductId: product.product_id ?? x.backendProductId,
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
  }, [refetchServerCart]);

  const removeItem = useCallback(async (lineIdArg, options = {}) => {
    const { announce = false } = options;
    const prev = itemsRef.current;
    const line = prev.find((x) => x.lineId === lineIdArg);

    if (isLoggedIn() && line?.serverCartItemId) {
      try {
        await removeCartItem(line.serverCartItemId);
        await refetchServerCart();
        if (announce && line) {
          globalThis.queueMicrotask(() => {
            emitCartAnnounce({ kind: 'remove', name: line.snapshot.name });
          });
        }
      } catch (err) {
        console.warn('Failed to sync cart remove:', err);
      }
      return;
    }

    const next = prev.filter((x) => x.lineId !== lineIdArg);
    itemsRef.current = next;
    setItems(next);
    if (announce && line) {
      globalThis.queueMicrotask(() => {
        emitCartAnnounce({ kind: 'remove', name: line.snapshot.name });
      });
    }
  }, [refetchServerCart]);

  const updateQty = useCallback(async (lineIdArg, qty, options = {}) => {
    const { announce = false } = options;
    if (!Number.isFinite(qty)) return;
    const nextQty = Math.max(0, Math.min(99, Math.floor(qty)));
    const prev = itemsRef.current;
    const line = prev.find((x) => x.lineId === lineIdArg);

    if (isLoggedIn() && line?.serverCartItemId) {
      try {
        if (nextQty === 0) {
          await removeCartItem(line.serverCartItemId);
        } else {
          await updateCartItem(line.serverCartItemId, nextQty);
        }
        await refetchServerCart();
        if (announce && line) {
          globalThis.queueMicrotask(() => {
            emitCartAnnounce({
              kind: nextQty === 0 ? 'remove' : 'qty',
              name: line.snapshot.name,
            });
          });
        }
      } catch (err) {
        console.warn('Failed to sync cart update:', err);
      }
      return;
    }

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
  }, [refetchServerCart]);

  const clearCart = useCallback(async () => {
    if (isLoggedIn()) {
      try {
        await clearServerCart();
      } catch (err) {
        console.warn('Failed to clear server cart:', err);
      }
    }
    itemsRef.current = [];
    setItems([]);
    if (!isLoggedIn()) {
      writeGuestCart([]);
    }
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((a, x) => a + x.qty, 0);
    const subtotal = items.reduce((a, x) => a + x.snapshot.price * x.qty, 0);
    return {
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
      hydrated,
    };
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
    hydrated,
  ]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}
