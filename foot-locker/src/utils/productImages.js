import API_CONFIG from '../config/api.js';

/** Verified fallback when a product or carousel image fails to load. */
export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85';

/** @param {string | null | undefined} src */
export function resolveProductImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  const base = API_CONFIG.baseURL.replace(/\/$/, '');
  const path = src.startsWith('/') ? src : `/${src}`;
  if (path.startsWith('/static/')) return `${base}${path}`;
  if (path.startsWith('/uploads/')) return `${base}/static${path}`;
  return `${base}/static${path}`;
}

/** @param {string | null | undefined} src */
export function productDisplayImage(src) {
  const resolved = resolveProductImageUrl(src);
  return resolved || FALLBACK_PRODUCT_IMAGE;
}
