/** @typedef {{ title: string, href: string }[]} MegaLinks */

/** @typedef {{ heading: string, links: MegaLinks }} MegaColumn */

/** @type {{ men: MegaColumn[], women: MegaColumn[], kids: MegaColumn[], apparel: MegaColumn[] }} */
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
      heading: 'Apparel',
      links: [
        { title: "Kids' fleece sets", href: '/apparel?category=kids&style=hoodies' },
        { title: "Kids' tees", href: '/apparel?category=kids&style=tees' },
        { title: "All kids' apparel", href: '/apparel?category=kids' },
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
        { title: 'Shoes', href: '/shop' },
        { title: 'New arrivals', href: '/releases' },
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
  { title: 'Apparel drop', href: '/apparel' },
  { title: 'Basketball vibes', href: '/shop?category=men' },
];
