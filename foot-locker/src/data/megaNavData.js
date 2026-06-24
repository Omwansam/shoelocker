/** @typedef {{ title: string, href: string }[]} MegaLinks */

/** @typedef {{ heading: string, links: MegaLinks }} MegaColumn */

/** @type {{ men: MegaColumn[], women: MegaColumn[], kids: MegaColumn[], apparel: MegaColumn[] }} */
export const megaColumns = {
  men: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Basketball', href: '/shop?category=men&type=shoes' },
        { title: 'Casual', href: '/shop?category=men&type=shoes' },
        { title: 'Running', href: '/shop?category=men&type=shoes' },
        { title: "All men's shoes", href: '/shop?category=men&type=shoes' },
      ],
    },
    {
      heading: 'Apparel',
      links: [
        { title: "Men's hoodies", href: '/apparel?category=men&style=hoodies' },
        { title: "Men's tees", href: '/apparel?category=men&style=tees' },
        { title: "Men's shorts", href: '/apparel?category=men&style=shorts' },
        { title: "All men's apparel", href: '/apparel?category=men' },
      ],
    },
    {
      heading: 'Shop by size',
      links: [
        { title: 'UK 7', href: '/shop?category=men&type=shoes' },
        { title: 'UK 8', href: '/shop?category=men&type=shoes' },
        { title: 'UK 9', href: '/shop?category=men&type=shoes' },
        { title: 'UK 10', href: '/shop?category=men&type=shoes' },
        { title: 'UK 11', href: '/shop?category=men&type=shoes' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New arrivals', href: '/releases' },
        { title: 'New on shop', href: '/shop?category=men&new=1&sort=newest' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
  women: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Running', href: '/shop?category=women&type=shoes' },
        { title: 'Casual', href: '/shop?category=women&type=shoes' },
        { title: "All women's shoes", href: '/shop?category=women&type=shoes' },
      ],
    },
    {
      heading: 'Apparel',
      links: [
        { title: "Women's hoodies", href: '/apparel?category=women&style=hoodies' },
        { title: "Women's jackets", href: '/apparel?category=women&style=jackets' },
        { title: "Women's joggers", href: '/apparel?category=women&style=pants' },
        { title: "All women's apparel", href: '/apparel?category=women' },
      ],
    },
    {
      heading: 'Shop by size',
      links: [
        { title: 'UK 4', href: '/shop?category=women&type=shoes' },
        { title: 'UK 5', href: '/shop?category=women&type=shoes' },
        { title: 'UK 6', href: '/shop?category=women&type=shoes' },
        { title: 'UK 7', href: '/shop?category=women&type=shoes' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New arrivals', href: '/releases' },
        { title: 'New on shop', href: '/shop?category=women&new=1&sort=newest' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
  kids: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Basketball', href: '/shop?category=kids&type=shoes' },
        { title: 'Casual', href: '/shop?category=kids&type=shoes' },
        { title: "All kids' shoes", href: '/shop?category=kids&type=shoes' },
      ],
    },
    {
      heading: 'Apparel',
      links: [
        { title: "Kids' fleece", href: '/apparel?category=kids&style=hoodies' },
        { title: "Kids' tees", href: '/apparel?category=kids&style=tees' },
        { title: "All kids' apparel", href: '/apparel?category=kids' },
      ],
    },
    {
      heading: 'Sizes',
      links: [
        { title: 'Big kids', href: '/shop?category=kids&type=shoes' },
        { title: 'Little kids', href: '/shop?category=kids&type=shoes' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New arrivals', href: '/releases' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
  apparel: [
    {
      heading: 'Shop by style',
      links: [
        { title: 'Hoodies & fleece', href: '/apparel?style=hoodies' },
        { title: 'T-shirts', href: '/apparel?style=tees' },
        { title: 'Shorts', href: '/apparel?style=shorts' },
        { title: 'Jackets', href: '/apparel?style=jackets' },
        { title: 'Pants & joggers', href: '/apparel?style=pants' },
      ],
    },
    {
      heading: 'Shop by gender',
      links: [
        { title: "Men's apparel", href: '/apparel?category=men' },
        { title: "Women's apparel", href: '/apparel?category=women' },
        { title: "Kids' apparel", href: '/apparel?category=kids' },
        { title: 'All apparel', href: '/apparel' },
      ],
    },
    {
      heading: 'Also shop',
      links: [
        { title: 'Shoes', href: '/shop?type=shoes' },
        { title: 'New arrivals', href: '/releases' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
};

/** @type {MegaLinks} */
export const megaNewTrending = [
  { title: 'Popular right now', href: '/#popular-now' },
  { title: 'New arrivals', href: '/releases' },
  { title: 'New on shop', href: '/shop?new=1&sort=newest' },
  { title: 'Fresh apparel', href: '/apparel' },
  { title: 'Sale wall', href: '/sale' },
];

/** Quick strip + mobile shortcuts — all routes load API-backed pages */
export const navQuickLinks = [
  { label: "Men's", href: '/shop?category=men&type=shoes' },
  { label: "Women's", href: '/shop?category=women&type=shoes' },
  { label: "Kids'", href: '/shop?category=kids&type=shoes' },
  { label: 'Apparel', href: '/apparel' },
  { label: 'Stores', href: '/stores' },
  { label: 'New drops', href: '/releases' },
  { label: 'Sale', href: '/sale', accent: true },
  { label: 'Brands', href: '/brands' },
];

/** @type {Record<'men'|'women'|'kids', { label: string, href: string, blurb: string }>} */
export const megaShopAllCta = {
  men: {
    label: "Shop all men's",
    href: '/shop?category=men&type=shoes',
    blurb: 'Full footwear wall — live stock from the catalog API.',
  },
  women: {
    label: "Shop all women's",
    href: '/shop?category=women&type=shoes',
    blurb: 'Every women\'s pair in stock, priced in KES.',
  },
  kids: {
    label: "Shop all kids'",
    href: '/shop?category=kids&type=shoes',
    blurb: 'Youth sizes refreshed from the warehouse feed.',
  },
};
