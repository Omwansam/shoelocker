/** Curated shop landing presets — used by homepage promos and `/shop?collection=…`. */

/** @typedef {'men'|'women'|'kids'} ShopGender */
/** @typedef {'shoes'|'apparel'|'accessories'|'all'} ShopProductType */
/** @typedef {'newest'|'price-asc'|'price-desc'|'featured'} ShopSort */

/**
 * @typedef {{
 *   title: string,
 *   description: string,
 *   category?: ShopGender | null,
 *   productType?: ShopProductType,
 *   sort?: ShopSort,
 * }} ShopCollection
 */

/** @type {Record<string, ShopCollection>} */
export const SHOP_COLLECTIONS = {
  basketball: {
    title: "Men's basketball shoes",
    description:
      'High-traction soles, ankle support, and tunnel-walk energy — hardwood heat in Kenyan sizes.',
    category: 'men',
    productType: 'shoes',
  },
  running: {
    title: "Women's running & lifestyle",
    description:
      'Cushioned rides for morning miles, errands, and long Nairobi days — filter by brand and size.',
    category: 'women',
    productType: 'shoes',
  },
  court: {
    title: 'Court heat',
    description:
      'High-traction soles, ankle support, and tunnel-walk energy — hardwood-ready pairs in every size.',
    category: 'men',
    productType: 'shoes',
  },
  city: {
    title: 'City runners',
    description:
      'Cushioned rides for morning miles, errands, and long Nairobi days — lifestyle and running picks.',
    category: 'women',
    productType: 'shoes',
  },
  retro: {
    title: 'Retro classics',
    description:
      'Low-profile legends and colorways that never leave rotation — sorted with the newest drops first.',
    category: null,
    productType: 'shoes',
    sort: 'newest',
  },
};

/** @param {string | null | undefined} key */
export function resolveShopCollection(key) {
  if (!key || !(key in SHOP_COLLECTIONS)) return null;
  return SHOP_COLLECTIONS[/** @type {keyof typeof SHOP_COLLECTIONS} */ (key)];
}

/** @param {keyof typeof SHOP_COLLECTIONS} id */
export function shopCollectionHref(id) {
  const col = SHOP_COLLECTIONS[id];
  if (!col) return '/shop';

  const params = new URLSearchParams();
  params.set('collection', id);
  if (col.category) params.set('category', col.category);
  if (col.productType && col.productType !== 'all') {
    params.set('type', col.productType);
  }
  if (col.sort && col.sort !== 'featured') {
    params.set('sort', col.sort);
  }
  return `/shop?${params.toString()}`;
}
