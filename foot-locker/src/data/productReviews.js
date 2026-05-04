/**
 * Demo reviews — keyed by catalog id when we have rich copy; otherwise PDP falls back.
 * @typedef {{ author: string, rating: number, title: string, body: string, at: string }} ProductReview
 */

/** @type {Record<string, ProductReview[]>} */
const BY_ID = {
  'nk-air-max-270': [
    {
      author: 'Brian M.',
      rating: 5,
      title: 'Comfort for Nairobi commutes',
      body: 'Wears well on tarmac and matatu runs. Air unit feels plush — true to size for me.',
      at: '2026-04-18',
    },
    {
      author: 'Grace W.',
      rating: 4,
      title: 'Bold look',
      body: 'Turns heads at the gym. Sizing matched what I use in Nike KE stores.',
      at: '2026-04-02',
    },
  ],
  'ad-ultraboost-light': [
    {
      author: 'Kevin O.',
      rating: 5,
      title: 'Daily driver',
      body: 'Boost never gets old. Logged 40km this month on these — knee feels fine.',
      at: '2026-05-01',
    },
    {
      author: 'Amina R.',
      rating: 4,
      title: 'Snug fit',
      body: 'Go half size up if you have a wide forefoot. Otherwise perfect for Eldoret chill.',
      at: '2026-03-22',
    },
  ],
  'pm-rs-x': [
    {
      author: 'Mercy C.',
      rating: 5,
      title: 'Retro chunky vibes',
      body: 'Love the colour pop. Easy to dress up or down for weekend runs in Nakuru.',
      at: '2026-04-28',
    },
  ],
  'nk-dunk-low': [
    {
      author: 'Ian M.',
      rating: 5,
      title: 'Wall-worthy',
      body: 'Leather breaks in nicely. Exactly what I expected from the pics.',
      at: '2026-05-10',
    },
    {
      author: 'Peter N.',
      rating: 4,
      title: 'Classic silhouette',
      body: 'Skate-ready stiffness out of the box; softened after a week.',
      at: '2026-04-14',
    },
  ],
};

/**
 * @param {string} productId
 * @param {string} productName
 * @returns {ProductReview[]}
 */
export function getReviewsForProduct(productId, productName) {
  const seeded = BY_ID[productId];
  if (seeded?.length) return seeded;
  return [
    {
      author: 'Verified shopper',
      rating: 5,
      title: `Solid pick: ${productName}`,
      body: 'Demo review — in production this pulls from verified purchases and moderation.',
      at: '2026-05-01',
    },
    {
      author: 'Style crew member',
      rating: 4,
      title: 'Fits the East Africa wall',
      body: 'Authentic feel and quick dispatch when our courier partners go live.',
      at: '2026-04-20',
    },
  ];
}
