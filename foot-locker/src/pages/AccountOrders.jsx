import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format.js';
import { labelForOrderStatus } from '../utils/orderStatus.js';
import { isLoggedIn } from '../utils/auth.js';
import { fetchMyOrders } from '../utils/api.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function AccountOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      try {
        const list = await fetchMyOrders();
        if (active) setOrders(list);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!isLoggedIn()) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Order history</h1>
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-neutral-700">Sign in to view your order history.</p>
          <Link
            to="/sign-in"
            className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Order history</h1>
      <p className="mt-2 text-neutral-600">
        Orders placed through checkout, synced from your account.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
        </div>
      ) : !orders.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-neutral-700">No orders yet — your next checkout will appear here.</p>
          <Link
            to="/shop"
            className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((o) => (
            <li
              key={o.order_id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-black">{o.id}</p>
                <p className="text-xs text-neutral-500">{formatDate(o.date)}</p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                Status: {labelForOrderStatus(o.status)}
              </p>
              {o.shipping_address ? (
                <p className="mt-3 text-sm text-neutral-700">{o.shipping_address}</p>
              ) : null}
              <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                {(o.items || []).map((line) => (
                  <li key={`${line.product_id}-${line.name}`} className="flex justify-between gap-3">
                    <span className="min-w-0 text-neutral-800">
                      {line.name} × {line.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatPrice((line.price || 0) * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(o.total || 0)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
