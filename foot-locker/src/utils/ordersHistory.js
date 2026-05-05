/** Customer-facing order history (in-memory only). */

const CHANGE = 'shoelocker-order-history-changed';
/** @type {StoredOrder[]} */
let memoryOrders = [];

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
  return memoryOrders;
}

/** @param {StoredOrder[]} orders */
function writeOrdersHistory(orders) {
  memoryOrders = orders;
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
