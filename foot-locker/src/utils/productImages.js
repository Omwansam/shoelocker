import API_CONFIG from '../config/api.js';

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
