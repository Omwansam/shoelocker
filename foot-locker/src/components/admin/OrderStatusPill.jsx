/** @param {{ status: string }} props */
export function OrderStatusPill({ status }) {
  const cls =
    status === 'Fulfilled'
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
      : status === 'Cancelled'
        ? 'bg-neutral-100 text-neutral-700 ring-neutral-200'
        : status === 'Out for delivery'
          ? 'bg-sky-50 text-sky-800 ring-sky-100'
          : 'bg-amber-50 text-amber-900 ring-amber-100';

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
