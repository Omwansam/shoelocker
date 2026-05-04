import {
  CURRENCY_CODE,
  MARKET_LOCALE,
} from '../config/market.js';

/** @param {number} value — amount in KES */
export function formatPrice(value) {
  return new Intl.NumberFormat(MARKET_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
