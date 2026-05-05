/**
 * Client-side catalog overlay: add/edit/hide products (images, copy, sizes).
 * Merges with `seedProducts` from `data/products.js`.
 */

import { products as seedProducts } from '../data/products.js';

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   brand: string,
 *   price: number,
 *   category: 'men' | 'women' | 'kids',
 *   isNew: boolean,
 *   sizes: string[],
 *   description: string,
 *   image: string,
 *   hoverImage: string,
 *   gallery: string[],
 * }} Product
 */

/**
 * @typedef {{
 *   v: 1,
 *   additions: Product[],
 *   overrides: Record<string, Partial<Product>>,
 *   removedIds: string[],
 * }} CatalogDelta
 */

const EVENT = 'shoelocker-catalog-changed';
/** @type {CatalogDelta} */
let memoryDelta = emptyDelta();

/** @returns {CatalogDelta} */
export function readCatalogDelta() {
  return memoryDelta;
}

/** @returns {CatalogDelta} */
function emptyDelta() {
  return { v: 1, additions: [], overrides: {}, removedIds: [] };
}

/** @param {CatalogDelta} d */
export function writeCatalogDelta(d) {
  memoryDelta = d;
  globalThis.dispatchEvent(new CustomEvent(EVENT));
}

export function broadcastCatalogChange() {
  globalThis.dispatchEvent(new CustomEvent(EVENT));
}

/** @param {(draft: CatalogDelta) => void} fn */
export function mutateCatalog(fn) {
  const draft = readCatalogDelta();
  fn(draft);
  writeCatalogDelta(draft);
}

/** @param {string} url */
function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url).trim());
}

/**
 * @param {Partial<Product> & { id: string }} raw
 * @returns {Product}
 */
export function normalizeProductPayload(raw) {
  const id = String(raw.id ?? '').trim();
  const name = String(raw.name ?? '').trim();
  const brand = String(raw.brand ?? '').trim();
  const description = String(raw.description ?? '').trim();
  const category = /** @type {Product['category']} */ (
    ['men', 'women', 'kids'].includes(raw.category) ? raw.category : 'men'
  );
  const price = Math.max(1, Math.round(Number(raw.price) || 0));
  const isNew = Boolean(raw.isNew);
  const sizes = Array.isArray(raw.sizes)
    ? raw.sizes.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const galleryIn = Array.isArray(raw.gallery) ? raw.gallery : [];
  const imageIn = String(raw.image ?? '').trim();
  const hoverIn = String(raw.hoverImage ?? '').trim();

  const gallery = galleryIn
    .map((u) => String(u).trim())
    .filter((u) => isHttpUrl(u));
  const image = isHttpUrl(imageIn) ? imageIn : gallery[0] ?? '';
  const hoverImage =
    isHttpUrl(hoverIn) ? hoverIn : gallery[1] ?? image;

  const finalGallery =
    gallery.length > 0 ? [...new Set(gallery)] : image ? [image] : [];

  if (!id) throw new Error('Product requires an ID');
  if (!name || !brand) throw new Error('Name and brand are required');
  if (!sizes.length) throw new Error('Add at least one size');
  if (!finalGallery.length || !finalGallery.some(isHttpUrl)) {
    throw new Error('Add at least one valid image URL');
  }

  const primary = image || finalGallery[0];
  return {
    id,
    name,
    brand,
    price,
    category,
    isNew,
    sizes,
    description: description || 'No description supplied.',
    image: primary,
    hoverImage:
      hoverImage && isHttpUrl(hoverImage) ? hoverImage : finalGallery[1] ?? primary,
    gallery:
      finalGallery.length > 0 ? finalGallery : primary ? [primary] : [],
  };
}

/** @returns {Product[]} storefront-visible merged list */
export function mergeCatalogList() {
  const d = readCatalogDelta();

  /** @type {Product[]} */
  const fromSeed = seedProducts
    .filter((p) => !d.removedIds.includes(p.id))
    .map((p) => {
      const ov = d.overrides[p.id];
      const merged = ov ? { ...p, ...ov, id: p.id } : p;
      try {
        return normalizeProductPayload(merged);
      } catch {
        return merged;
      }
    });

  const adds = d.additions
    .filter((p) => p && typeof p.id === 'string' && !d.removedIds.includes(p.id))
    .map((p) => {
      try {
        return normalizeProductPayload(p);
      } catch {
        return p;
      }
    });

  return [...fromSeed, ...adds];
}

/** @param {string} id */
export function getMergedProductById(id) {
  return mergeCatalogList().find((p) => p.id === id) ?? null;
}

/** @returns {Set<string>} */
export function seedProductIdSet() {
  return new Set(seedProducts.map((p) => p.id));
}

/**
 * Hidden / removed previews for admin restoration UI
 * @returns {Product[]}
 */
export function getHiddenProductRows() {
  const d = readCatalogDelta();
  /** @type {Product[]} */
  const rows = [];

  for (const id of d.removedIds) {
    const seed = seedProducts.find((p) => p.id === id);
    const add = d.additions.find((p) => p.id === id);
    let raw =
      seed ?
        { ...seed, ...(d.overrides[id] ?? {}), id }
      : add ?
        add
      : null;
    if (!raw) continue;
    try {
      rows.push(normalizeProductPayload(/** @type {Product} */ (raw)));
    } catch {
      rows.push(/** @type {Product} */ (raw));
    }
  }
  return rows;
}

/** @param {string} name */
export function suggestProductId(name) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'style'}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Subscribe to merged catalog edits (same tab + admin saves). */
export function subscribeCatalogChange(/** @type {() => void} */ fn) {
  const h = () => fn();
  globalThis.window?.addEventListener(EVENT, h);
  return () => globalThis.window?.removeEventListener(EVENT, h);
}
