import {
  PRICE_MID_HIGH_KES,
  PRICE_MID_LOW_KES,
  PRICE_OVER_MIN_KES,
  SALE_MAX_KES,
  PRICE_UNDER_KES,
} from '../config/market.js';

/** @typedef {'any'|'under100'|'100-150'|'over150'|'sale'} PriceBracket */

/** Legacy keys preserved; thresholds are Kenyan Shilling (KES). */
/** @param {PriceBracket | string} bracket */
/** @param {number} price */
export function priceBracketMatch(bracket, price) {
  if (bracket === 'any') return true;
  if (bracket === 'under100') return price < PRICE_UNDER_KES;
  if (bracket === '100-150')
    return price >= PRICE_MID_LOW_KES && price <= PRICE_MID_HIGH_KES;
  if (bracket === 'over150') return price >= PRICE_OVER_MIN_KES;
  if (bracket === 'sale') return price <= SALE_MAX_KES;
  return true;
}

/** Rough sort for numeric and youth sizes together */
export function compareSizes(a, b) {
  const na = normalizeSize(a);
  const nb = normalizeSize(b);
  if (na !== nb) return na - nb;
  return String(a).localeCompare(String(b));
}

/** @param {string} s */
function normalizeSize(s) {
  const m = /^(\d+(?:\.\d)?)Y?$/i.exec(String(s));
  return m ? parseFloat(m[1]) : Number.NaN;
}
