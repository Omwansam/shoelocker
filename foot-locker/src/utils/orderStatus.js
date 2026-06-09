/** Backend order status values */
export const BACKEND_ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

/** Human-readable labels for admin UI */
export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Out for delivery',
  delivered: 'Fulfilled',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

/** @param {string | null | undefined} status */
export function labelForOrderStatus(status) {
  if (!status) return 'Pending';
  const key = String(status).toLowerCase();
  return ORDER_STATUS_LABELS[key] || status;
}

/** @param {string | null | undefined} status */
export function normalizeOrderStatus(status) {
  if (!status) return 'pending';
  const key = String(status).toLowerCase();
  return BACKEND_ORDER_STATUSES.includes(key) ? key : 'pending';
}
