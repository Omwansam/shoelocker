import {
  CURRENCY_CODE,
  MARKET_LOCALE,
} from '../config/market.js';

let activeLocale = MARKET_LOCALE;
let activeCurrency = CURRENCY_CODE;

/** @param {{ locale?: string, currency?: string }} config */
export function configureFormatting(config = {}) {
  if (config.locale) activeLocale = config.locale;
  if (config.currency) activeCurrency = config.currency;
}

/** @param {number} value — amount in store currency */
export function formatPrice(value) {
  return new Intl.NumberFormat(activeLocale, {
    style: 'currency',
    currency: activeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
