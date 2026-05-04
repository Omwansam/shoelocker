/** @typedef {{ title: string, href: string }[]} MegaLinks */

/** @typedef {{ heading: string, links: MegaLinks }} MegaColumn */

/** @type {{ men: MegaColumn[], women: MegaColumn[], kids: MegaColumn[] }} */
export const megaColumns = {
  men: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Basketball', href: '/shop?category=men' },
        { title: 'Casual', href: '/shop?category=men' },
        { title: 'Running', href: '/shop?category=men' },
        { title: "All Men's Shoes", href: '/shop?category=men' },
      ],
    },
    {
      heading: 'Shop by size',
      links: [
        { title: '7', href: '/shop?category=men' },
        { title: '8', href: '/shop?category=men' },
        { title: '9', href: '/shop?category=men' },
        { title: '10', href: '/shop?category=men' },
        { title: '11', href: '/shop?category=men' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New Arrivals', href: '/releases' },
        { title: 'Top rated styles', href: '/shop' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
  women: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Running', href: '/shop?category=women' },
        { title: 'Casual', href: '/shop?category=women' },
        { title: "All Women's Shoes", href: '/shop?category=women' },
      ],
    },
    {
      heading: 'Shop by size',
      links: [
        { title: '6', href: '/shop?category=women' },
        { title: '7', href: '/shop?category=women' },
        { title: '8', href: '/shop?category=women' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New Arrivals', href: '/releases' },
        { title: 'White shoes', href: '/shop?category=women' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
  kids: [
    {
      heading: 'Shoes',
      links: [
        { title: 'Basketball', href: '/shop?category=kids' },
        { title: 'Casual', href: '/shop?category=kids' },
        { title: "All Kid's Shoes", href: '/shop?category=kids' },
      ],
    },
    {
      heading: 'Sizes',
      links: [
        { title: 'Big kids', href: '/shop?category=kids' },
        { title: 'Little kids', href: '/shop?category=kids' },
      ],
    },
    {
      heading: 'Featured',
      links: [
        { title: 'New Arrivals', href: '/releases' },
        { title: 'Sale', href: '/sale' },
      ],
    },
  ],
};

/** @type {MegaLinks} */
export const megaBrands = [
  { title: 'Nike', href: '/shop?brand=Nike' },
  { title: 'adidas', href: '/shop?brand=adidas' },
  { title: 'New Balance', href: '/shop?brand=New%20Balance' },
  { title: 'Puma', href: '/shop?brand=Puma' },
  { title: 'ASICS', href: '/shop?brand=ASICS' },
  { title: 'Converse', href: '/shop?brand=Converse' },
];

/** @type {MegaLinks} */
export const megaNewTrending = [
  { title: 'New arrivals', href: '/releases' },
  { title: 'Performance picks', href: '/shop?category=men' },
  { title: 'Low profile classics', href: '/shop?category=women' },
  { title: 'Basketball vibes', href: '/shop?category=men' },
];
