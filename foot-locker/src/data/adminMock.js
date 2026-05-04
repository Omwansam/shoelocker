/**
 * Deterministic mock analytics & ops data for the staff console (KES / Kenya).
 * Replace with API responses when backend exists.
 */

import { getProductById } from './products.js';
import { mergeCatalogList } from '../utils/catalogStorage.js';

/** @typedef {'Fulfilled' | 'Processing' | 'Out for delivery' | 'Cancelled'} OrderStatus */

/** @typedef {{
 *   productId: string,
 *   name: string,
 *   brand: string,
 *   size: string,
 *   qty: number,
 *   unitPriceKes: number,
 *   lineTotalKes: number,
 * }} OrderLineItem */

/**
 * @param {string} productId
 * @param {string} size
 * @param {number} [qty]
 */
function line(productId, size, qty = 1) {
  const p = getProductById(productId);
  if (!p) throw new Error(`Unknown product ${productId}`);
  return {
    productId,
    name: p.name,
    brand: p.brand,
    size,
    qty,
    unitPriceKes: p.price,
    lineTotalKes: p.price * qty,
  };
}

/** @type {OrderStatus[]} */
export const ORDER_STATUSES = /** @type {const} */ ([
  'Processing',
  'Out for delivery',
  'Fulfilled',
  'Cancelled',
]);

function sumItems(/** @type {OrderLineItem[]} */ items) {
  return items.reduce((s, i) => s + i.lineTotalKes, 0);
}

/** @type {{
 *   id: string,
 *   placedAt: string,
 *   customer: string,
 *   phone: string,
 *   city: string,
 *   county: string,
 *   customerEmail: string,
 *   shippingAddress: string,
 *   courier: string,
 *   paymentMethod: string,
 *   mpesaRef?: string,
 *   status: OrderStatus,
 *   items: OrderLineItem[],
 *   staffNotes?: string,
 *   timeline: { at: string, label: string }[],
 * }[]} */
const rawOrders = [
  {
    id: 'SL-KE-10482',
    placedAt: '2026-05-15T09:42:00+03:00',
    customer: 'Kevin Omondi',
    phone: '+254 722 118 440',
    city: 'Nairobi',
    county: 'Nairobi',
    customerEmail: 'k.omondi@email.ke',
    shippingAddress: 'Kilimani, Wood Avenue Court, Apt 4B',
    courier: 'Fargo Courier',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'QGH2XK2AB1',
    status: 'Processing',
    staffNotes: 'Customer requested evening drop — call before dispatch.',
    items: [line('nk-air-max-270', '10', 1), line('jm-997h', '9', 1)],
    timeline: [
      { at: '2026-05-15T09:42:00+03:00', label: 'Order placed (checkout demo)' },
      { at: '2026-05-15T09:50:00+03:00', label: 'Payment confirmed — M-Pesa' },
      { at: '2026-05-15T10:05:00+03:00', label: 'Warehouse pick started' },
    ],
  },
  {
    id: 'SL-KE-10481',
    placedAt: '2026-05-15T08:05:00+03:00',
    customer: 'Aisha Mohammed',
    phone: '+254 711 902 331',
    city: 'Mombasa',
    county: 'Mombasa',
    customerEmail: 'a.mohammed@email.ke',
    shippingAddress: 'Nyali, Links Road, near City Mall',
    courier: 'G4S Kenya',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'TRK9PL44Q2',
    status: 'Out for delivery',
    items: [line('ad-ultraboost-light', '9', 1)],
    timeline: [
      { at: '2026-05-15T08:05:00+03:00', label: 'Order placed' },
      { at: '2026-05-15T09:00:00+03:00', label: 'Packed — handoff to courier' },
      { at: '2026-05-15T11:20:00+03:00', label: 'Out for delivery (Coast route)' },
    ],
  },
  {
    id: 'SL-KE-10479',
    placedAt: '2026-05-14T19:22:00+03:00',
    customer: 'Brian Kipchoge',
    phone: '+254 733 661 009',
    city: 'Eldoret',
    county: 'Uasin Gishu',
    customerEmail: 'b.kip@email.ke',
    shippingAddress: 'Eldoret town, Oloo Street, behind market',
    courier: 'Wells Fargo',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'PQA88LM90Z',
    status: 'Fulfilled',
    items: [
      line('as-gel-kayano', '9', 1),
      line('ad-samba-og', '7', 1),
      line('rb-club-c', '8', 1),
    ],
    timeline: [
      { at: '2026-05-14T19:22:00+03:00', label: 'Order placed' },
      { at: '2026-05-15T07:00:00+03:00', label: 'Delivered — signed BRK' },
    ],
  },
  {
    id: 'SL-KE-10476',
    placedAt: '2026-05-14T14:01:00+03:00',
    customer: 'Grace Wanjiru',
    phone: '+254 745 009 112',
    city: 'Nairobi',
    county: 'Kiambu',
    customerEmail: 'g.wanjiru@email.ke',
    shippingAddress: 'Ruiru Kamakis, Palm Ridge gate B',
    courier: 'Fargo Courier',
    paymentMethod: 'M-Pesa Paybill',
    mpesaRef: 'SLP-77821',
    status: 'Fulfilled',
    items: [line('nk-air-max-270', '8.5', 1)],
    timeline: [
      { at: '2026-05-14T14:01:00+03:00', label: 'Order placed' },
      { at: '2026-05-14T17:30:00+03:00', label: 'Collected at Two Rivers (pickup pilot)' },
    ],
  },
  {
    id: 'SL-KE-10470',
    placedAt: '2026-05-14T11:33:00+03:00',
    customer: 'Jay Patel',
    phone: '+254 798 220 445',
    city: 'Kisumu',
    county: 'Kisumu',
    customerEmail: 'jay.p@email.ke',
    shippingAddress: 'Milimani Estate, Ondiek Highway',
    courier: 'G4S Kenya',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'KXJ22109PL',
    status: 'Processing',
    items: [
      line('nk-dunk-low', '7.5', 1),
      line('cv-chuck70', '6.5', 1),
    ],
    timeline: [
      { at: '2026-05-14T11:33:00+03:00', label: 'Order placed' },
      { at: '2026-05-14T12:00:00+03:00', label: 'Payment held — fraud check cleared' },
    ],
  },
  {
    id: 'SL-KE-10465',
    placedAt: '2026-05-13T17:50:00+03:00',
    customer: 'Faith Akinyi',
    phone: '+254 701 334 778',
    city: 'Kisumu',
    county: 'Kisumu',
    customerEmail: 'f.akinyi@email.ke',
    shippingAddress: 'Kondele, Jomo Kenyatta Highway',
    courier: '—',
    paymentMethod: 'M-Pesa (reversed)',
    status: 'Cancelled',
    staffNotes: 'Customer cancelled before pick — stock released.',
    items: [line('vl-old-skool', '7', 1)],
    timeline: [
      { at: '2026-05-13T17:50:00+03:00', label: 'Order placed' },
      { at: '2026-05-13T18:10:00+03:00', label: 'Cancellation requested' },
      { at: '2026-05-13T18:12:00+03:00', label: 'Refund initiated (mock)' },
    ],
  },
  {
    id: 'SL-KE-10458',
    placedAt: '2026-05-13T09:12:00+03:00',
    customer: 'Ian Mutua',
    phone: '+254 720 884 001',
    city: 'Nairobi',
    county: 'Nairobi',
    customerEmail: 'ian.m@email.ke',
    shippingAddress: 'Kilimani, Galana Road',
    courier: 'Fargo Courier',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'ZQ99WW11',
    status: 'Fulfilled',
    items: [
      line('nk-vapormax', '10', 1),
      line('ad-campus-00s', '5Y', 1),
      line('nk-blazer-mid', '5Y', 1),
      line('pm-suede-classic', '4Y', 1),
    ],
    timeline: [
      { at: '2026-05-13T09:12:00+03:00', label: 'Order placed' },
      { at: '2026-05-13T14:00:00+03:00', label: 'Delivered' },
    ],
  },
  {
    id: 'SL-KE-10451',
    placedAt: '2026-05-12T21:08:00+03:00',
    customer: 'Mercy Chebet',
    phone: '+254 729 445 220',
    city: 'Nakuru',
    county: 'Nakuru',
    customerEmail: 'm.chebet@email.ke',
    shippingAddress: 'Milimani, behind Buffalo Mall',
    courier: 'Wells Fargo',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'NAK-44012',
    status: 'Out for delivery',
    items: [line('pm-rs-x', '6.5', 1), line('ad-samba-og', '6', 1)],
    timeline: [
      { at: '2026-05-12T21:08:00+03:00', label: 'Order placed' },
      { at: '2026-05-13T08:00:00+03:00', label: 'Packed' },
      { at: '2026-05-13T15:45:00+03:00', label: 'Rift Valley line — dispatched' },
    ],
  },
  {
    id: 'SL-KE-10448',
    placedAt: '2026-05-12T10:02:00+03:00',
    customer: 'Peter Njoroge',
    phone: '+254 712 889 341',
    city: 'Thika',
    county: 'Kiambu',
    customerEmail: 'p.njoroge@email.ke',
    shippingAddress: 'Thika Makongeni, Pine Estate',
    courier: 'G4S Kenya',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'THK-90211',
    status: 'Processing',
    items: [line('rb-club-c', '9', 2)],
    timeline: [
      { at: '2026-05-12T10:02:00+03:00', label: 'Order placed' },
      { at: '2026-05-12T10:30:00+03:00', label: 'Payment confirmed' },
    ],
  },
  {
    id: 'SL-KE-10441',
    placedAt: '2026-05-11T16:40:00+03:00',
    customer: 'Winnie Adhiambo',
    phone: '+254 722 661 908',
    city: 'Nairobi',
    county: 'Nairobi',
    customerEmail: 'w.adhiambo@email.ke',
    shippingAddress: 'Karen, Hardy Post Office box route',
    courier: 'Fargo Courier',
    paymentMethod: 'M-Pesa',
    mpesaRef: 'KAREN-661',
    status: 'Fulfilled',
    items: [line('nk-dunk-low', '9', 1), line('nk-vapormax', '11', 1)],
    timeline: [
      { at: '2026-05-11T16:40:00+03:00', label: 'Order placed' },
      { at: '2026-05-11T22:15:00+03:00', label: 'Delivered' },
    ],
  },
];

/** Exported orders with totals derived from lines */
export const mockOrders = rawOrders.map((o) => ({
  ...o,
  lines: o.items.length,
  totalKes: sumItems(o.items),
}));

/** @param {string} id */
export function getMockOrderById(id) {
  return mockOrders.find((o) => o.id === id) ?? null;
}

/** Last 14 days revenue (KSh) — weekday-ish pattern */
export const revenueSeries14d = [
  { label: 'May 2', value: 428_000 },
  { label: 'May 3', value: 392_000 },
  { label: 'May 4', value: 465_000 },
  { label: 'May 5', value: 518_000 },
  { label: 'May 6', value: 611_000 },
  { label: 'May 7', value: 734_000 },
  { label: 'May 8', value: 698_000 },
  { label: 'May 9', value: 523_000 },
  { label: 'May 10', value: 489_000 },
  { label: 'May 11', value: 544_000 },
  { label: 'May 12', value: 582_000 },
  { label: 'May 13', value: 659_000 },
  { label: 'May 14', value: 702_000 },
  { label: 'May 15', value: 758_000 },
];

/** Sessions (site visits) same window */
export const sessionsSeries14d = revenueSeries14d.map((d, i) => ({
  label: d.label,
  value: Math.round(d.value / 820 + 1800 + i * 12),
}));

const sum = (/** @type {{ value: number }[]} */ arr, start, end) =>
  arr.slice(start, end).reduce((a, x) => a + x.value, 0);

export const dashboardKpis = {
  revenue7d: sum(revenueSeries14d, 7, 14),
  revenuePrior7d: sum(revenueSeries14d, 0, 7),
  orders7d: 284,
  ordersPrior7d: 241,
  sessions7d: sum(sessionsSeries14d, 7, 14),
  avgOrderValueKes: 18420,
  fulfilmentSlaHours: 26,
  pendingDispatch: 37,
};

/** @type {{ source: string, share: number, sessions: number }[]} */
export const trafficSources = [
  { source: 'Organic search', share: 42, sessions: 8420 },
  { source: 'Direct / app', share: 28, sessions: 5610 },
  { source: 'Instagram & TikTok', share: 18, sessions: 3610 },
  { source: 'Email & SMS', share: 12, sessions: 2400 },
];

/** Funnel — arbitrary but readable */
export const funnelSteps = [
  { step: 'Sessions', count: 18420, rate: 100 },
  { step: 'Product views', count: 42600, rate: 231 },
  { step: 'Add to cart', count: 3920, rate: 21 },
  { step: 'Checkout started', count: 1180, rate: 6.4 },
  { step: 'Paid orders', count: 284, rate: 1.5 },
];

/** Units “sold” mock tied to real SKUs */
export function getTopProductsByRevenue() {
  const products = mergeCatalogList();
  const weights = [1.4, 1.2, 1.15, 1.1, 1.05, 1, 0.95, 0.9];
  return [...products]
    .map((p, i) => {
      const w = weights[i % weights.length];
      const units = Math.round(48 * w + (i % 5) * 3);
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        units,
        revenueKes: units * p.price,
      };
    })
    .sort((a, b) => b.revenueKes - a.revenueKes)
    .slice(0, 6);
}

/** @type {{ name: string, email: string, city: string, orders: number, lifetimeKes: number }[]} */
export const mockCustomers = [
  {
    name: 'Kevin Omondi',
    email: 'k.omondi@email.ke',
    city: 'Nairobi',
    orders: 6,
    lifetimeKes: 142_400,
  },
  {
    name: 'Grace Wanjiru',
    email: 'g.wanjiru@email.ke',
    city: 'Nairobi',
    orders: 4,
    lifetimeKes: 98_200,
  },
  {
    name: 'Ian Mutua',
    email: 'ian.m@email.ke',
    city: 'Nairobi',
    orders: 9,
    lifetimeKes: 256_880,
  },
  {
    name: 'Jay Patel',
    email: 'jay.p@email.ke',
    city: 'Kisumu',
    orders: 3,
    lifetimeKes: 61_497,
  },
  {
    name: 'Faith Akinyi',
    email: 'f.akinyi@email.ke',
    city: 'Kisumu',
    orders: 2,
    lifetimeKes: 28_498,
  },
  {
    name: 'Mercy Chebet',
    email: 'm.chebet@email.ke',
    city: 'Nakuru',
    orders: 5,
    lifetimeKes: 89_995,
  },
  {
    name: 'Peter Njoroge',
    email: 'p.njoroge@email.ke',
    city: 'Thika',
    orders: 1,
    lifetimeKes: 26_998,
  },
  {
    name: 'Winnie Adhiambo',
    email: 'w.adhiambo@email.ke',
    city: 'Nairobi',
    orders: 3,
    lifetimeKes: 132_496,
  },
];

export const deviceShare = [
  { label: 'Mobile', pct: 78 },
  { label: 'Desktop', pct: 18 },
  { label: 'Tablet', pct: 4 },
];

/** Sidebar / dashboard pulse */
export const activityFeedSeed = [
  {
    id: 'a1',
    at: '2026-05-15T09:52:00+03:00',
    type: 'order',
    text: 'New order SL-KE-10482 — Nairobi Metro (KSh pick pending)',
  },
  {
    id: 'a2',
    at: '2026-05-15T08:08:00+03:00',
    type: 'dispatch',
    text: 'G4S Coastal batch closed — Mombasa 12 parcels',
  },
  {
    id: 'a3',
    at: '2026-05-14T22:05:00+03:00',
    type: 'inventory',
    text: 'Low stock ping: adidas Samba OG (women 6–7) ≤ 9 units',
  },
  {
    id: 'a4',
    at: '2026-05-14T18:40:00+03:00',
    type: 'payment',
    text: 'M-Pesa reconcile: Paybill ShoeLocker ****812 + KSh 1.82M',
  },
  {
    id: 'a5',
    at: '2026-05-14T12:05:00+03:00',
    type: 'support',
    text: '3 open Zendesk chats — SLA 12m avg',
  },
];

/** @typedef {{ id: string, code: string, kind: 'percent' | 'fixed', value: number, minSpendKes: number, expires: string, active: boolean }} PromoRow */

/** @type {PromoRow[]} */
export const promotionSeed = [
  {
    id: 'seed-kickback10',
    code: 'KICKBACK10',
    kind: 'percent',
    value: 10,
    minSpendKes: 8000,
    expires: '2026-06-30',
    active: true,
  },
  {
    id: 'seed-freeship',
    code: 'NAIROBI500',
    kind: 'fixed',
    value: 500,
    minSpendKes: 11000,
    expires: '2026-07-01',
    active: true,
  },
];
