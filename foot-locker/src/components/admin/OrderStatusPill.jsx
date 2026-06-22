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
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
      : normalized === 'cancelled' || status === 'Cancelled'
        ? 'bg-neutral-100 text-neutral-600 ring-neutral-200'
        : normalized === 'shipped' || status === 'Out for delivery'
          ? 'bg-sky-50 text-sky-800 ring-sky-200/80'
          : normalized === 'returned'
            ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
            : 'bg-amber-50 text-amber-900 ring-amber-200/80';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}
