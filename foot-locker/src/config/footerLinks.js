/**
 * Dedicated storefront content pages — each maps a URL to a support article slug.
 * @typedef {'help' | 'company' | 'policy'} ContentTone
 */

/** @typedef {{ path: string, slug: string, eyebrow: string, tone: ContentTone, footerLabel: string, related?: string[] }} ContentPageConfig */

/** @type {ContentPageConfig[]} */
export const contentPages = [
  {
    path: '/contact',
    slug: 'contact',
    eyebrow: 'Customer care',
    tone: 'help',
    footerLabel: 'Contact us',
    related: ['orders', 'shipping', 'pickup'],
  },
  {
    path: '/order-status',
    slug: 'orders',
    eyebrow: 'Your orders',
    tone: 'help',
    footerLabel: 'Order status',
    related: ['contact', 'shipping', 'returns'],
  },
  {
    path: '/shipping',
    slug: 'shipping',
    eyebrow: 'Delivery',
    tone: 'help',
    footerLabel: 'Shipping info',
    related: ['pickup', 'orders', 'returns'],
  },
  {
    path: '/store-pickup',
    slug: 'pickup',
    eyebrow: 'Click & collect',
    tone: 'help',
    footerLabel: 'Store pickup',
    related: ['stores', 'orders', 'contact'],
  },
  {
    path: '/returns',
    slug: 'returns',
    eyebrow: 'Peace of mind',
    tone: 'policy',
    footerLabel: 'Returns & exchanges',
    related: ['contact', 'shipping', 'terms'],
  },
  {
    path: '/about',
    slug: 'about',
    eyebrow: 'Our story',
    tone: 'company',
    footerLabel: 'Our story',
    related: ['careers', 'stores', 'brands'],
  },
  {
    path: '/careers',
    slug: 'careers',
    eyebrow: 'Join the team',
    tone: 'company',
    footerLabel: 'Careers',
    related: ['about', 'contact', 'affiliates'],
  },
  {
    path: '/affiliates',
    slug: 'affiliates',
    eyebrow: 'Partners',
    tone: 'company',
    footerLabel: 'Affiliates',
    related: ['about', 'contact', 'careers'],
  },
  {
    path: '/gift-cards',
    slug: 'gift-cards',
    eyebrow: 'Gifting',
    tone: 'help',
    footerLabel: 'Gift cards',
    related: ['rewards', 'shop', 'contact'],
  },
  {
    path: '/terms',
    slug: 'terms',
    eyebrow: 'Legal',
    tone: 'policy',
    footerLabel: 'Terms of use',
    related: ['privacy', 'returns', 'accessibility'],
  },
  {
    path: '/privacy',
    slug: 'privacy',
    eyebrow: 'Legal',
    tone: 'policy',
    footerLabel: 'Privacy',
    related: ['terms', 'accessibility', 'contact'],
  },
  {
    path: '/accessibility',
    slug: 'accessibility',
    eyebrow: 'Inclusive design',
    tone: 'policy',
    footerLabel: 'Accessibility',
    related: ['contact', 'privacy', 'terms'],
  },
];

/** @type {Record<string, ContentPageConfig>} */
export const contentPagesByPath = Object.fromEntries(
  contentPages.map((page) => [page.path, page]),
);

/** @type {Record<string, ContentPageConfig>} */
export const contentPagesBySlug = Object.fromEntries(
  contentPages.map((page) => [page.slug, page]),
);

/** Related link paths — special storefront routes not in contentPages */
export const storefrontShortcuts = {
  stores: '/stores',
  brands: '/brands',
  rewards: '/rewards',
  shop: '/shop?type=shoes',
  support: '/support',
};

/** @type {{ title: string, links: [string, string][] }[]} */
export const footerColumns = [
  {
    title: 'Help',
    links: contentPages
      .filter((p) =>
        ['contact', 'orders', 'shipping', 'pickup', 'returns'].includes(p.slug),
      )
      .sort(
        (a, b) =>
          ['contact', 'orders', 'shipping', 'pickup', 'returns'].indexOf(a.slug) -
          ['contact', 'orders', 'shipping', 'pickup', 'returns'].indexOf(b.slug),
      )
      .map((p) => [p.footerLabel, p.path]),
  },
  {
    title: 'About',
    links: contentPages
      .filter((p) => ['about', 'careers', 'affiliates'].includes(p.slug))
      .sort(
        (a, b) =>
          ['about', 'careers', 'affiliates'].indexOf(a.slug) -
          ['about', 'careers', 'affiliates'].indexOf(b.slug),
      )
      .map((p) => [p.footerLabel, p.path]),
  },
  {
    title: 'Shop',
    links: [
      [contentPagesBySlug['gift-cards'].footerLabel, contentPagesBySlug['gift-cards'].path],
      ['Coupons & sale', '/sale'],
      ['Store locator', '/stores'],
      ['Brands', '/brands'],
      ['Kickback Rewards', '/rewards'],
      ["Men's shoes", '/shop?category=men&type=shoes'],
      ["Women's shoes", '/shop?category=women&type=shoes'],
      ["Kids' shoes", '/shop?category=kids&type=shoes'],
      ['Apparel', '/apparel'],
      ['New releases', '/releases'],
    ],
  },
  {
    title: 'Legal',
    links: contentPages
      .filter((p) => ['terms', 'privacy', 'accessibility'].includes(p.slug))
      .sort(
        (a, b) =>
          ['terms', 'privacy', 'accessibility'].indexOf(a.slug) -
          ['terms', 'privacy', 'accessibility'].indexOf(b.slug),
      )
      .map((p) => [p.footerLabel, p.path]),
  },
];

/** @type {[string, string][]} */
export const footerQuickLinks = [
  ['Support hub', '/support'],
  ['Stores', '/stores'],
  ['Rewards', '/rewards'],
  ['Brands', '/brands'],
  ['Shop shoes', '/shop?type=shoes'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
];

/** @param {string} href */
export function footerLinkTo(href) {
  return href;
}
