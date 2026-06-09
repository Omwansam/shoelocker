import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BACKEND_ORDER_STATUSES, labelForOrderStatus } from '../../utils/orderStatus.js';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../utils/api.js';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile, rowsToCsv } from '../../utils/csv.js';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const rawStatus = params.get('status');
  const activeFilter =
    rawStatus && BACKEND_ORDER_STATUSES.includes(rawStatus) ? rawStatus : 'All';

  const [searchDraft, setSearchDraft] = useState(q);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders({
        per_page: 100,
        search: q || undefined,
        status: activeFilter !== 'All' ? activeFilter : undefined,
      });
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [q, activeFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

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

  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, order_status: newStatus } : o,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  function exportVisible() {
    const header = ['Order', 'Placed', 'Customer', 'Email', 'Status', 'Lines', 'Total_KES'];
    const body = orders.map((o) => [
      `ORD-${String(o.order_id).padStart(3, '0')}`,
      o.order_date,
      o.user?.username || '',
      o.user?.email || '',
      o.order_status,
      o.items_count,
      o.total_amount,
    ]);
    downloadTextFile(
      `shoelocker-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  const filterLabels = useMemo(
    () => [
      { key: 'All', label: 'All' },
      ...BACKEND_ORDER_STATUSES.map((s) => ({ key: s, label: labelForOrderStatus(s) })),
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Orders</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Live orders from the backend — search, filter, and update fulfilment status.
          </p>
        </div>
        <button
          type="button"
          onClick={exportVisible}
          disabled={!orders.length}
          className="h-10 self-start rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50 lg:self-auto"
        >
          Export ({orders.length})
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={applySearch} className="flex w-full max-w-md gap-2">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Order #, email, username…"
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
          {filterLabels.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              active={activeFilter === key}
              onClick={() => setFilter(key)}
            />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr className="text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Placed</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Lines</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-600">
                      No orders match — clear search or widen filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const orderLabel = `ORD-${String(o.order_id).padStart(3, '0')}`;
                    return (
                      <tr key={o.order_id} className="hover:bg-neutral-50/80">
                        <td className="px-4 py-3 font-semibold tabular-nums text-neutral-950">
                          <Link
                            to={`/admin/orders/${o.order_id}`}
                            className="hover:text-brand-red hover:underline"
                          >
                            {orderLabel}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          {o.order_date
                            ? new Date(o.order_date).toLocaleString('en-KE', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-neutral-800">{o.user?.username || '—'}</td>
                        <td className="px-4 py-3 text-neutral-600">{o.user?.email || '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-neutral-600">{o.items_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <OrderStatusPill status={o.order_status} />
                            <select
                              aria-label={`Status for ${orderLabel}`}
                              value={o.order_status || 'pending'}
                              onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                              className="max-w-[140px] rounded-lg border border-neutral-200 px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-brand-red/25"
                            >
                              {BACKEND_ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {labelForOrderStatus(s)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatPrice(Number(o.total_amount) || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders/${o.order_id}`}
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
        )}
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
