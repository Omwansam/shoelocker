/** Cross-component cart UX announcements (toast bridge listens). */

export const CART_ANNOUNCE_EVENT = 'shoelocker-cart-announce';

/**
 * @param {{
 *   kind: 'add' | 'merge' | 'qty' | 'remove',
 *   name: string,
 * }} detail
 */
export function emitCartAnnounce(detail) {
  try {
    globalThis.dispatchEvent(new CustomEvent(CART_ANNOUNCE_EVENT, { detail }));
  } catch {
    //
  }
}
