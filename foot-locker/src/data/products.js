/**
 * Mock catalog — all `price` values are Kenyan Shillings (KES).
 */

export const products = [
  {
    id: 'nk-air-max-270',
    name: 'Air Max 270',
    brand: 'Nike',
    price: 23999,
    category: 'men',
    isNew: true,
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '11'],
    description:
      'Big Air underfoot and a stretchy inner sleeve create a sock-like fit with striking style.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'ad-ultraboost-light',
    name: 'Ultraboost Light',
    brand: 'adidas',
    price: 28999,
    category: 'men',
    isNew: false,
    sizes: ['7', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    description:
      'Responsive Boost midsole with Linear Energy Push for energized strides all day.',
    image:
      'https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'pm-rs-x',
    name: 'RS-X Reinvention',
    brand: 'Puma',
    price: 17499,
    category: 'women',
    isNew: false,
    sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8'],
    description:
      'Chunky tooling and bold overlays bring ’90s track DNA into a modern lifestyle silhouette.',
    image:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'jm-997h',
    name: '997H Essentials',
    brand: 'New Balance',
    price: 15499,
    category: 'men',
    isNew: true,
    sizes: ['7', '7.5', '8', '8.5', '9', '10', '10.5'],
    description:
      'Heritage-inspired lines with plush foam for everyday comfort.',
    image:
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-dunk-low',
    name: 'Dunk Low Retro',
    brand: 'Nike',
    price: 18499,
    category: 'women',
    isNew: true,
    sizes: ['5', '6', '6.5', '7', '7.5', '8', '9'],
    description:
      'Court DNA with padded low-cut collar for comfort on and off the hardwood.',
    image:
      'https://images.unsplash.com/photo-1595950653106-6c79ebd73435?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595950653106-6c79ebd73435?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1549294413-26f195200c54?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'ad-campus-00s',
    name: 'Campus 00s',
    brand: 'adidas',
    price: 17499,
    category: 'kids',
    isNew: false,
    sizes: ['3.5Y', '4Y', '5Y', '5.5Y', '6Y', '7Y'],
    description:
      'Soft suede upper with exaggerated proportions tuned for playgrounds and sidewalks.',
    image:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'as-gel-kayano',
    name: 'GEL-Kayano Legacy',
    brand: 'ASICS',
    price: 24999,
    category: 'men',
    isNew: false,
    sizes: ['7', '8', '8.5', '9', '9.5', '10', '11'],
    description:
      'Stability and GEL cushioning for smooth transitions from warmup to cooldown.',
    image:
      'https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1578608718682-7399c4f7d6d4?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578608718682-7399c4f7d6d4?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'cv-chuck70',
    name: 'Chuck 70 High',
    brand: 'Converse',
    price: 13999,
    category: 'women',
    isNew: false,
    sizes: ['5', '6', '6.5', '7', '7.5', '8'],
    description:
      'Premium canvas with vintage details and vulcanized sole for stacked style.',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1571077226622-5479d7e7d6e3?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571077226622-5479d7e7d6e3?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-blazer-mid',
    name: 'Blazer Mid ’77',
    brand: 'Nike',
    price: 16499,
    category: 'kids',
    isNew: true,
    sizes: ['3.5Y', '4Y', '4.5Y', '5Y', '6Y'],
    description:
      'Throwback hoops look with autoclave construction and grippy rubber outsole.',
    image:
      'https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600185365928-3a186820d81e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'rb-club-c',
    name: 'Club C Grounds UK',
    brand: 'Reebok',
    price: 13499,
    category: 'men',
    isNew: false,
    sizes: ['7', '7.5', '8', '9', '9.5', '10'],
    description:
      'Soft garment leather keeps the OG tennis profile refreshingly simple.',
    image:
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'vl-old-skool',
    name: 'Old Skool',
    brand: 'Vans',
    price: 11999,
    category: 'women',
    isNew: false,
    sizes: ['5', '6', '6.5', '7', '7.5', '8', '8.5'],
    description:
      'Iconic side stripe and durable suede/canvas mix for everyday wear.',
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'pm-suede-classic',
    name: 'Suede Classic XXl',
    brand: 'Puma',
    price: 12499,
    category: 'kids',
    isNew: false,
    sizes: ['3.5Y', '4Y', '5Y', '6Y'],
    description:
      'Soft suede heritage upper with tonal formstrip branding.',
    image:
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584735175315-9d661dfcfa86?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-vapormax',
    name: 'Air VaporMax Flyknit 3',
    brand: 'Nike',
    price: 33999,
    category: 'men',
    isNew: true,
    sizes: ['7', '8', '8.5', '9', '9.5', '10', '11', '12'],
    description:
      'Flyknit upper meets full-length Air for a futuristic ride.',
    image:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'ad-samba-og',
    name: 'Samba OG',
    brand: 'adidas',
    price: 15499,
    category: 'women',
    isNew: true,
    sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '9'],
    description:
      'Indoor-soccer roots meet street staples with supple leather and suede.',
    image:
      'https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1605348532760-6753e2cd4339?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579338559194-a869d0631d79?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515955656352-a1dc3cc67a96?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-tech-fleece-hoodie',
    name: 'Tech Fleece Full-Zip Hoodie',
    brand: 'Nike',
    price: 12499,
    category: 'men',
    productType: 'apparel',
    isNew: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Premium fleece with a streamlined fit — warm enough for Nairobi evenings, light enough to layer.',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1578587018453-892b-f19d874cef4?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'ad-essentials-tee',
    name: 'Essentials 3-Stripes Tee',
    brand: 'adidas',
    price: 4499,
    category: 'men',
    productType: 'apparel',
    isNew: false,
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Soft cotton jersey with signature 3-Stripes — a daily rotation staple.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1583743814966-6a5ac098195a?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-sportswear-jacket',
    name: 'Sportswear Windrunner Jacket',
    brand: 'Nike',
    price: 14999,
    category: 'women',
    productType: 'apparel',
    isNew: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Heritage chevron design with lightweight taffeta — packable weather protection.',
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'ad-crop-hoodie',
    name: 'Essentials Fleece Crop Hoodie',
    brand: 'adidas',
    price: 8999,
    category: 'women',
    productType: 'apparel',
    isNew: false,
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Relaxed crop silhouette in plush fleece — pairs with high-rise joggers or bike shorts.',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nk-kids-fleece-set',
    name: "Kids' Therma-FIT Fleece Set",
    brand: 'Nike',
    price: 7999,
    category: 'kids',
    productType: 'apparel',
    isNew: true,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Matching hoodie and joggers in soft fleece — playground-ready warmth.',
    image:
      'https://images.unsplash.com/photo-1519238263530-95a2d4a217d2?auto=format&fit=crop&w=900&q=80',
    hoverImage:
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519238263530-95a2d4a217d2?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

export function getProductById(id) {
  return products.find((p) => p.id === id) ?? null;
}
