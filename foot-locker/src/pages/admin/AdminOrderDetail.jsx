import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ORDER_STATUSES,
  getMockOrderById,
} from '../../data/adminMock.js';
import { useAdminOrderStatuses } from '../../hooks/useAdminOrderStatuses.js';
import { formatPrice } from '../../utils/format.js';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';

export function AdminOrderDetail() {
  const { orderId } = useParams();
  const raw = orderId ? getMockOrderById(orderId) : null;
  const { getStatus, setStatus } = useAdminOrderStatuses();

  if (!raw || !orderId) {
    return <Navigate to="/admin/orders" replace />;
  }

  const status = getStatus(raw);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-rise">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-brand-red hover:underline"
          >
            ← Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold tabular-nums text-neutral-950">
            {raw.id}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Placed{' '}
            {new Date(raw.placedAt).toLocaleString('en-KE', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Fulfilment status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrderStatusPill status={status} />
            <select
              aria-label="Update status"
              value={status}
              onChange={(e) =>
                setStatus(raw.id, /** @type {(typeof ORDER_STATUSES)[number]} */ (e.target.value))
              }
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-[11px] text-neutral-500">
            Persisted locally for this demo — resets from Settings.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Line items</h2>
          <ul className="divide-y divide-neutral-100">
            {raw.items.map((item, idx) => (
              <li
                key={`${item.productId}-${item.size}-${idx}`}
                className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-neutral-950">
                    {item.brand} — {item.name}
                  </p>
                  <p className="text-sm text-neutral-600">
                    Size {item.size} × {item.qty}
                  </p>
                  <Link
                    to={`/product/${item.productId}`}
                    className="mt-1 inline-block text-xs font-semibold text-brand-red hover:underline"
                  >
                    View product
                  </Link>
                </div>
                <div className="text-right text-sm tabular-nums">
                  <p className="text-neutral-500">
                    {formatPrice(item.unitPriceKes)} each
                  </p>
                  <p className="font-semibold text-neutral-950">
                    {formatPrice(item.lineTotalKes)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-neutral-200 pt-4 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(raw.totalKes)}</span>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium">{raw.customer}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Phone</dt>
                <dd>
                  <a className="font-medium text-brand-red" href={`tel:${raw.phone.replace(/\s/g, '')}`}>
                    {raw.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd>
                  <a className="font-medium text-brand-red" href={`mailto:${raw.customerEmail}`}>
                    {raw.customerEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Delivery</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Address</dt>
                <dd className="font-medium leading-snug">{raw.shippingAddress}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">City / county</dt>
                <dd>
                  {raw.city} · {raw.county}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Courier</dt>
                <dd>{raw.courier}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Method</dt>
                <dd className="font-medium">{raw.paymentMethod}</dd>
              </div>
              {raw.mpesaRef ? (
                <div>
                  <dt className="text-neutral-500">Reference</dt>
                  <dd className="font-mono tabular-nums">{raw.mpesaRef}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>

      {raw.staffNotes ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="font-semibold text-amber-950">Staff notes</h2>
          <p className="mt-2 text-sm text-amber-900">{raw.staffNotes}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-neutral-200 pl-4">
          {raw.timeline.map((t, i) => (
            <li key={`${t.at}-${i}`} className="relative">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-brand-red ring-4 ring-white" />
              <p className="text-sm font-medium text-neutral-950">{t.label}</p>
              <p className="text-xs text-neutral-500">
                {new Date(t.at).toLocaleString('en-KE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
