import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BACKEND_ORDER_STATUSES, labelForOrderStatus } from '../../utils/orderStatus.js';
import { fetchAdminOrderById, updateAdminOrderStatus } from '../../utils/api.js';
import { formatPrice } from '../../utils/format.js';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';

export function AdminOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminOrderById(orderId);
        if (active) setOrder(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
          setOrder(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [orderId]);

  async function handleStatusChange(newStatus) {
    if (!order) return;
    try {
      await updateAdminOrderStatus(order.order_id, newStatus);
      setOrder((prev) => (prev ? { ...prev, order_status: newStatus } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (!order || !orderId) {
    return <Navigate to="/admin/orders" replace />;
  }

  const displayId = order.id || `ORD-${String(order.order_id).padStart(3, '0')}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-rise">
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            ← Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold tabular-nums text-neutral-950">{displayId}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Placed{' '}
            {order.order_date
              ? new Date(order.order_date).toLocaleString('en-KE', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Fulfilment status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrderStatusPill status={order.order_status} />
            <select
              aria-label="Update status"
              value={order.order_status || 'pending'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            >
              {BACKEND_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelForOrderStatus(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Line items</h2>
          <ul className="divide-y divide-neutral-100">
            {(order.items || []).map((item, idx) => (
              <li
                key={`${item.product_id}-${item.size}-${idx}`}
                className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-neutral-950">
                    {item.brand} — {item.name}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {item.size ? `Size ${item.size} × ` : ''}{item.quantity}
                  </p>
                  {item.product_slug ? (
                    <Link
                      to={`/product/${item.product_slug}`}
                      className="mt-1 inline-block text-xs font-semibold text-brand-red hover:underline"
                    >
                      View product
                    </Link>
                  ) : null}
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p className="text-neutral-500">{formatPrice(item.price)} each</p>
                  <p className="font-semibold text-neutral-950">
                    {formatPrice(item.line_total || item.price * item.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-neutral-200 pt-4 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(Number(order.total_amount) || 0)}</span>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium">{order.user?.username || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd>
                  {order.user?.email ? (
                    <a className="font-medium text-brand-red" href={`mailto:${order.user.email}`}>
                      {order.user.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Address</dt>
                <dd className="font-medium leading-snug">{order.shipping_address || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Method</dt>
                <dd className="font-medium">{order.payment_method || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Status</dt>
                <dd className="font-medium">{order.payment_status || '—'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
