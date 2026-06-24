/**
 * Build shop URLs for storefront brand records (catalog API filter).
 * @param {string} catalogBrand
 * @param {{ displayName?: string }} [options]
 */
export function brandShopHref(catalogBrand, options = {}) {
  const params = new URLSearchParams();
  params.set('brand', catalogBrand);
  params.set('type', 'shoes');
  if (
    options.displayName &&
    options.displayName.trim().toLowerCase() !== catalogBrand.trim().toLowerCase()
  ) {
    params.set('name', options.displayName.trim());
  }
  return `/shop?${params.toString()}`;
}

/** @param {Record<string, unknown>} brand */
export function normalizeStorefrontBrand(brand) {
  const slug = String(brand.slug || brand.id || '');
  const label = String(brand.label || '');
  return {
    id: slug || label,
    slug: slug || label,
    label,
    catalogBrand: String(brand.catalogBrand || brand.catalog_brand || label),
    image: String(brand.image || brand.image_url || ''),
    tagline: String(brand.tagline || ''),
    accent: String(brand.accent || brand.accent_color || '#e60012'),
  };
}

/** @param {Record<string, unknown>} brand */
export function brandNavLink(brand) {
  const normalized = normalizeStorefrontBrand(brand);
  return {
    title: normalized.label,
    href: brandShopHref(normalized.catalogBrand, { displayName: normalized.label }),
  };
}
