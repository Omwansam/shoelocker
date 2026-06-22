import { departmentLabel } from './productTypes.js';

const GENDER_LABELS = {
  men: "Men's",
  women: "Women's",
  kids: "Kids'",
};

/**
 * Where a product appears on the customer storefront.
 * @param {{ category?: string, productType?: string, isNew?: boolean, slug?: string }} opts
 */
export function getStorefrontPlacements({ category = 'men', productType = 'shoes', isNew = false, slug = '' }) {
  const gender = GENDER_LABELS[category] || category;
  const dept = departmentLabel(productType);
  const handle = slug || 'product-handle';
  /** @type {{ area: string, label: string, href: string, description?: string }[]} */
  const placements = [];

  placements.push({
    area: 'Navigation',
    label: `${gender} shop`,
    href: `/shop?category=${category}`,
    description: 'Main nav mega menu & mobile menu',
  });

  if (productType === 'shoes' || productType === 'accessories') {
    placements.push({
      area: 'Shop',
      label: `${gender} · ${dept}`,
      href: `/shop?category=${category}&type=${productType}`,
      description: 'Shop wall with gender + type filters',
    });
  }

  if (productType === 'apparel') {
    placements.push({
      area: 'Apparel',
      label: `${gender} clothing`,
      href: `/apparel?category=${category}`,
      description: 'Dedicated apparel page',
    });
  }

  if (productType === 'shoes') {
    placements.push({
      area: 'Shop default',
      label: 'All shoes browse',
      href: '/shop',
      description: 'Default shop page (shoes department)',
    });
  }

  placements.push({
    area: 'Product',
    label: 'Detail page',
    href: `/product/${handle}`,
    description: 'PDP, cart, wishlist, and checkout',
  });

  if (isNew) {
    placements.push({
      area: 'Homepage',
      label: 'New arrivals',
      href: '/',
      description: 'Home featured grid when “New arrival” is on',
    });
  }

  return placements;
}

/** Short summary for list tables */
export function placementSummary(category, productType) {
  const gender = GENDER_LABELS[category] || category;
  const dept = departmentLabel(productType);
  return `${gender} · ${dept}`;
}
