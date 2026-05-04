import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  mockOrders,
  ORDER_STATUSES,
} from '../../data/adminMock.js';
import {
  getEffectiveOrderStatus,
  useAdminOrderStatuses,
} from '../../hooks/useAdminOrderStatuses.js';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile, rowsToCsv } from '../../utils/csv.js';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const rawStatus = params.get('status');
  /** @type {'All' | (typeof ORDER_STATUSES)[number]} */
  const activeFilter =
    rawStatus && ORDER_STATUSES.includes(rawStatus)
      ? /** @type {(typeof ORDER_STATUSES)[number]} */ (rawStatus)
      : 'All';

  const [searchDraft, setSearchDraft] = useState(params.get('q') ?? '');
  const { patches, setStatus } = useAdminOrderStatuses();

  function applySearch(e) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchDraft.trim()) next.set('q', searchDraft.trim());
    else next.delete('q');
    setParams(next);
  }

  function setFilter(label) {
    const next = new URLSearchParams(params);
    if (label === 'All') next.delete('status');
    else next.set('status', label);
    setParams(next);
  }

  const filtered = useMemo(() => {
    return mockOrders.filter((o) => {
      const st = getEffectiveOrderStatus(o, patches);
      if (activeFilter !== 'All' && st !== activeFilter) return false;
      if (!q) return true;
      const blob = `${o.id} ${o.customer} ${o.customerEmail ?? ''} ${o.phone} ${o.city} ${o.county}`.toLowerCase();
      return blob.includes(q);
    });
  }, [activeFilter, q, patches]);

  function exportVisible() {
    const header = [
      'Order',
      'Placed',
      'Customer',
      'Phone',
      'City',
      'Status',
      'Total_KES',
    ];
    const body = filtered.map((o) => {
      const st = getEffectiveOrderStatus(o, patches);
      return [
        o.id,
        o.placedAt,
        o.customer,
        o.phone,
        o.city,
        st,
        o.totalKes,
      ];
    });
    downloadTextFile(
      `shoelocker-orders-filtered-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Orders</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Search, fulfilment filters &amp; CSV — line items inside each order.
          </p>
        </div>
        <button
          type="button"
          onClick={exportVisible}
          className="h-10 self-start rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold hover:bg-neutral-50 lg:self-auto"
        >
          Export filtered ({filtered.length})
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={applySearch} className="flex w-full max-w-md gap-2">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Order #, phone, customer, email…"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
          />
          <button
            type="submit"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {(['All', ...ORDER_STATUSES]).map((label) => (
            <FilterChip
              key={label}
              label={label}
              active={
                label === 'All'
                  ? activeFilter === 'All'
                  : activeFilter === label
              }
              onClick={() => setFilter(label)}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr className="text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Placed</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Lines</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-neutral-600">
                    No orders match — clear search or widen filters.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const st = getEffectiveOrderStatus(o, patches);
                  return (
                    <tr key={o.id} className="hover:bg-neutral-50/80">
                      <td className="px-4 py-3 font-semibold tabular-nums text-neutral-950">
                        <Link to={`/admin/orders/${o.id}`} className="hover:text-brand-red hover:underline">
                          {o.id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {new Date(o.placedAt).toLocaleString('en-KE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 text-neutral-800">{o.customer}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {o.phone}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{o.city}</td>
                      <td className="px-4 py-3 tabular-nums text-neutral-600">
                        {o.lines}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <OrderStatusPill status={st} />
                          <select
                            aria-label={`Status for ${o.id}`}
                            value={st}
                            onChange={(e) => setStatus(o.id, /** @type {typeof ORDER_STATUSES[number]} */ (e.target.value))}
                            className="max-w-[140px] rounded-lg border border-neutral-200 px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-brand-red/25"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatPrice(o.totalKes)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** @param {{ label: string, active: boolean, onClick: () => void }} props */
function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white'
          : 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300'
      }
    >
      {label}
    </button>
  );
}
