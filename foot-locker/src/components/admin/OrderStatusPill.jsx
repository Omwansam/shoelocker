/** @param {{ status: string }} props */
export function OrderStatusPill({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const label =
    normalized === 'delivered' ? 'Fulfilled'
    : normalized === 'shipped' ? 'Out for delivery'
    : normalized === 'cancelled' ? 'Cancelled'
    : normalized === 'returned' ? 'Returned'
    : normalized === 'processing' ? 'Processing'
    : normalized === 'pending' ? 'Pending'
    : status;

  const cls =
    normalized === 'delivered' || status === 'Fulfilled'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
      : normalized === 'cancelled' || status === 'Cancelled'
        ? 'bg-neutral-100 text-neutral-700 ring-neutral-200'
        : normalized === 'shipped' || status === 'Out for delivery'
          ? 'bg-sky-50 text-sky-800 ring-sky-100'
          : normalized === 'returned'
            ? 'bg-violet-50 text-violet-800 ring-violet-100'
            : 'bg-amber-50 text-amber-900 ring-amber-100';

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
