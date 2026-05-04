import { createContext } from 'react';

/**
 * @typedef {{
 *   ids: string[],
 *   has: (id: string) => boolean,
 *   toggle: (id: string) => void,
 *   count: number,
 * }} WishlistValue
 */

export const WishlistContext = /** @type {import('react').Context<WishlistValue | undefined>} */ (
  createContext(undefined)
);
