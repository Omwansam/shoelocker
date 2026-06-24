import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FreeShippingNote } from './FreeShippingNote.jsx';
import { useCart } from '../hooks/useCart.js';
import { fetchRecentProducts } from '../utils/api.js';
import { formatPrice } from '../utils/format.js';

export function CartDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    items,
    addItem,
    updateQty,
    removeItem,
    subtotal,
    itemCount,
  } = useCart();
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const lastFocus = useRef(/** @type {HTMLElement | null} */ (null));
  const [suggestions, setSuggestions] = useState(/** @type {any[]} */ ([]));

  const inCartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  useEffect(() => {
    if (!drawerOpen) return;
    const ac = new AbortController();
    fetchRecentProducts({ limit: 12, signal: ac.signal, throwOnError: true })
      .then((list) =>
        setSuggestions(list.filter((p) => !inCartIds.has(p.id)).slice(0, 4)),
      )
      .catch(() => setSuggestions([]));
    return () => ac.abort();
  }, [drawerOpen, inCartIds]);

  useEffect(() => {
    if (!drawerOpen) return;
    lastFocus.current = document.activeElement;
    const t = setTimeout(() => panelRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      lastFocus.current?.focus?.();
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        aria-label="Close cart overlay"
        onClick={closeDrawer}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl outline-none animate-fade-rise"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <h2 id="cart-drawer-title" className="text-lg font-semibold">
            Your cart
            {itemCount > 0 ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-black transition hover:bg-neutral-50"
            aria-label="Close cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M6 6h15l-1.5 9h-11z" />
                  <path d="M6 6 5 3H2" />
                </svg>
              </div>
              <p className="mt-4 text-base font-semibold text-black">
                Your cart is empty
              </p>
              <p className="mt-1 max-w-xs text-sm text-neutral-600">
                Drop in a fresh pair — new releases and classics are one tap
                away.
              </p>
              <Link
                to="/shop"
                onClick={closeDrawer}
                className="mt-6 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
              >
                Shop sneakers
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((line) => (
                <li
                  key={line.lineId}
                  className="flex gap-3 rounded-xl border border-neutral-200 p-3 shadow-sm"
                >
                  <img
                    src={line.snapshot.image}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      {line.snapshot.brand}
                    </p>
                    <p className="truncate font-semibold text-black">
                      {line.snapshot.name}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Size {line.size} (men's US scale)
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatPrice(line.snapshot.price)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="sr-only">Quantity</span>
                      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-0.5">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-40"
                          aria-label="Decrease quantity"
                          disabled={line.qty <= 1}
                          onClick={() =>
                            updateQty(line.lineId, line.qty - 1, { announce: true })
                          }
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-neutral-800 transition hover:bg-neutral-100 disabled:opacity-40"
                          aria-label="Increase quantity"
                          disabled={line.qty >= 99}
                          onClick={() =>
                            updateQty(line.lineId, line.qty + 1, { announce: true })
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.lineId, { announce: true })}
                        className="text-sm font-medium text-brand-red transition hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && suggestions.length > 0 ? (
            <section className="mt-6 border-t border-neutral-200 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                Quick add
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                One tap — same toasts as the shop wall.
              </p>
              <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {suggestions.map((p) => {
                  const size = p.sizes[0] ?? '';
                  return (
                    <li
                      key={p.id}
                      className="w-36 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
                    >
                      <img
                        src={p.image}
                        alt=""
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="space-y-2 p-2">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-black">
                          {p.name}
                        </p>
                        <p className="text-[11px] font-bold text-neutral-900">
                          {formatPrice(p.price)}
                        </p>
                        <button
                          type="button"
                          onClick={() => addItem(p, size, 1)}
                          className="w-full rounded-lg bg-black py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-neutral-900"
                        >
                          Add · {size}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Subtotal</span>
              <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
            </div>
            <FreeShippingNote subtotal={subtotal} className="mt-2" />
            <p className="mt-1 text-xs text-neutral-500">
              VAT &amp; courier fees quoted at checkout.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="flex h-11 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white transition hover:bg-brand-red-hover"
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="flex h-11 items-center justify-center rounded-full border border-neutral-300 text-sm font-semibold text-black transition hover:bg-white"
              >
                View full cart
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
