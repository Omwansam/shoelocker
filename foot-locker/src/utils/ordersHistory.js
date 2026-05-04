/** Customer-facing order history (checkout demo) — localStorage */

export const ORDER_HISTORY_STORAGE_KEY = 'shoelocker-order-history-v1';

const CHANGE = 'shoelocker-order-history-changed';

/**
 * @typedef {{
 *   productId: string,
 *   name: string,
 *   brand: string,
 *   size: string,
 *   qty: number,
 *   lineTotalKes: number,
 * }} OrderLineSnapshot
 */

/**
 * @typedef {{
 *   id: string,
 *   placedAt: string,
 *   customerName: string,
 *   phone: string,
 *   address: string,
 *   subtotalKes: number,
 *   lines: OrderLineSnapshot[],
 * }} StoredOrder
 */

function emitChange() {
  try {
    globalThis.dispatchEvent(new CustomEvent(CHANGE));
  } catch {
    //
  }
}

/** @returns {StoredOrder[]} */
export function readOrdersHistory() {
  try {
    const raw = globalThis.localStorage?.getItem(ORDER_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {StoredOrder[]} orders */
function writeOrdersHistory(orders) {
  try {
    globalThis.localStorage?.setItem(
      ORDER_HISTORY_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch {
    //
  }
  emitChange();
}

/**
 * @param {{
 *   customerName: string,
 *   phone: string,
 *   address: string,
 *   subtotalKes: number,
 *   lines: OrderLineSnapshot[],
 * }} payload
 * @returns {string} new order id
 */
export function appendOrderToHistory(payload) {
  const prev = readOrdersHistory();
  const id = `WEB-KE-${Date.now().toString(36).toUpperCase()}`;
  const next = [
    {
      id,
      placedAt: new Date().toISOString(),
      ...payload,
    },
    ...prev,
  ].slice(0, 50);
  writeOrdersHistory(next);
  return id;
}

export function subscribeOrdersHistoryChange(cb) {
  if (typeof globalThis.addEventListener !== 'function') return () => {};
  const handler = () => cb();
  globalThis.addEventListener(CHANGE, handler);
  return () => globalThis.removeEventListener(CHANGE, handler);
}
