import { SUPPORT_EMAIL } from './brand.js';
import {
  COUNTRY,
  CURRENCY_CODE,
  FREE_SHIPPING_MIN_KES,
  MARKET_LOCALE,
} from './market.js';

/** Fallbacks when the API is unavailable — kept in sync with backend DEFAULT_SETTINGS. */
export const DEFAULT_STORE_SETTINGS = {
  country: COUNTRY,
  currency: CURRENCY_CODE,
  locale: MARKET_LOCALE,
  free_shipping_threshold: FREE_SHIPPING_MIN_KES,
  support_email: SUPPORT_EMAIL,
  mpesa_enabled: true,
  cod_enabled: true,
};
