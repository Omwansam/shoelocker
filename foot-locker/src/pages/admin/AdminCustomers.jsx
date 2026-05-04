import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCustomers } from '../../data/adminMock.js';
import { formatPrice } from '../../utils/format.js';

export function AdminCustomers() {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return mockCustomers;
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.city.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Customers</h1>
        <p className="mt-1 text-sm text-neutral-600">
          CRM-style cards — drill into historical orders via email shortcut.
        </p>
      </div>

      <div className="max-w-md">
        <label className="text-xs font-semibold uppercase text-neutral-500">
          Filter
        </label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email or city…"
          className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-600">
          No profiles match — clear the filter field.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <article
              key={c.email}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="font-semibold text-neutral-950">{c.name}</p>
              <p className="mt-1 text-sm text-neutral-600">{c.email}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {c.city}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Orders</dt>
                  <dd className="font-bold tabular-nums text-neutral-950">
                    {c.orders}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Lifetime</dt>
                  <dd className="font-bold tabular-nums text-neutral-950">
                    {formatPrice(c.lifetimeKes)}
                  </dd>
                </div>
              </dl>
              <Link
                to={`/admin/orders?q=${encodeURIComponent(c.email)}`}
                className="mt-4 inline-flex text-xs font-bold uppercase tracking-wide text-brand-red hover:underline"
              >
                Search orders →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
