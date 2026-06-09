/** Product department constants shared across storefront and admin. */

/** @typedef {'shoes' | 'apparel' | 'accessories'} ProductType */

export const PRODUCT_TYPES = /** @type {const} */ ({
  SHOES: 'shoes',
  APPAREL: 'apparel',
  ACCESSORIES: 'accessories',
});

/** @type {{ id: string, label: string, match?: RegExp }[]} */
export const APPAREL_STYLES = [
  { id: 'all', label: 'All apparel' },
  { id: 'hoodies', label: 'Hoodies', match: /hoodie/i },
  { id: 'tees', label: 'T-shirts', match: /tee|t-shirt/i },
  { id: 'shorts', label: 'Shorts', match: /short/i },
  { id: 'jackets', label: 'Jackets', match: /jacket|windrunner|windbreaker/i },
  { id: 'pants', label: 'Pants & joggers', match: /jogger|pant/i },
];

/** @param {{ productType?: ProductType }} product */
export function isApparel(product) {
  return product.productType === PRODUCT_TYPES.APPAREL;
}

/** @param {ProductType | undefined} productType */
export function sizeLabelForType(productType) {
  if (productType === PRODUCT_TYPES.APPAREL) {
    return 'Size (S–XXL standard fit)';
  }
  if (productType === PRODUCT_TYPES.ACCESSORIES) {
    return 'Size';
  }
  return "Size (US men's scale — stocked like Nike Kenya & adidas KE)";
}

/** @param {ProductType | undefined} productType */
export function departmentLabel(productType) {
  if (productType === PRODUCT_TYPES.APPAREL) return 'Apparel';
  if (productType === PRODUCT_TYPES.ACCESSORIES) return 'Accessories';
  return 'Shoes';
}

/** @param {{ name?: string, description?: string }} product @param {string} styleId */
export function matchesApparelStyle(product, styleId) {
  if (styleId === 'all') return true;
  const style = APPAREL_STYLES.find((s) => s.id === styleId);
  if (!style?.match) return true;
  const blob = `${product.name ?? ''} ${product.description ?? ''}`;
  return style.match.test(blob);
}
