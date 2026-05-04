/** Staff console — demo auth (replace with real SSO / API in production). */

import { NEWSLETTER_STORAGE_KEY, WISHLIST_STORAGE_KEY } from './storefrontStorageKeys.js';
import { ORDER_HISTORY_STORAGE_KEY } from '../utils/ordersHistory.js';

export const ADMIN_SESSION_STORAGE_KEY = 'shoelocker-admin-session-v1';

/** Mutable demo payloads (inventory, fulfilment tweaks, etc.) — clear from Settings */
export const ADMIN_INVENTORY_STORAGE_KEY = 'shoelocker-admin-inventory-v1';
export const ADMIN_ORDER_STATUS_STORAGE_KEY = 'shoelocker-admin-order-status-v1';
export const ADMIN_PROMOTIONS_STORAGE_KEY = 'shoelocker-admin-promotions-v1';
export const ADMIN_CATALOG_STORAGE_KEY = 'shoelocker-admin-catalog-v1';

/** Clears persisted admin demo keys (does not sign you out). */
export function resetAdminPersistedDemo() {
  if (!globalThis.localStorage) return;
  globalThis.localStorage.removeItem(ADMIN_INVENTORY_STORAGE_KEY);
  globalThis.localStorage.removeItem(ADMIN_ORDER_STATUS_STORAGE_KEY);
  globalThis.localStorage.removeItem(ADMIN_PROMOTIONS_STORAGE_KEY);
  globalThis.localStorage.removeItem(ADMIN_CATALOG_STORAGE_KEY);
  globalThis.localStorage.removeItem(ORDER_HISTORY_STORAGE_KEY);
  globalThis.localStorage.removeItem(WISHLIST_STORAGE_KEY);
  globalThis.localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
}

/** Set `VITE_ADMIN_PASSWORD` in `.env` for deployment; default for local demo. */
export function getAdminDemoPassword() {
  const fromEnv = import.meta.env.VITE_ADMIN_PASSWORD;
  return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : 'shoelocker-admin';
}
