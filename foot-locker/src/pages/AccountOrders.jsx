import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format.js';
import {
  readOrdersHistory,
  subscribeOrdersHistoryChange,
} from '../utils/ordersHistory.js';

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
  const [orders, setOrders] = useState(() => readOrdersHistory());

  useEffect(
    () => subscribeOrdersHistoryChange(() => setOrders(readOrdersHistory())),
    [],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Order history</h1>
      <p className="mt-2 text-neutral-600">
        Web checkout orders saved in this browser. Staff tools use a separate demo queue.
      </p>

      {!orders.length ? (
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
              key={o.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-black">{o.id}</p>
                <p className="text-xs text-neutral-500">{formatDate(o.placedAt)}</p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {o.customerName} · {o.phone}
              </p>
              <p className="mt-3 text-sm text-neutral-700">{o.address}</p>
              <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                {o.lines.map((line) => (
                  <li key={`${line.productId}-${line.size}`} className="flex justify-between gap-3">
                    <span className="min-w-0 text-neutral-800">
                      {line.brand} {line.name} · US {line.size} × {line.qty}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatPrice(line.lineTotalKes)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(o.subtotalKes)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
