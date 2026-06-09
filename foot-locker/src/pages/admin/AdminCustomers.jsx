import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCustomers } from '../../data/adminMock.js';
import { formatPrice } from '../../utils/format.js';
import { fetchAdminCustomers } from '../../utils/api.js';

export function AdminCustomers() {
  const [searchDraft, setSearchDraft] = useState('');
  const [q, setQ] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await fetchAdminCustomers({ search: q });
        if (active && res && res.customers) {
          setCustomers(res.customers);
        } else if (active) {
          setError(res?.error || 'Failed to fetch customer database');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to connect to customer API');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCustomers();
    return () => {
      active = false;
    };
  }, [q]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setQ(searchDraft.trim());
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Customers</h1>
          <p className="mt-1 text-sm text-neutral-600">
            CRM Customer Directory fetched from live authentication databases.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
          Total Customers: {customers.length}
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex max-w-md gap-2">
        <div className="flex-1">
          <label htmlFor="crm-search" className="sr-only">Search Customers</label>
          <input
            id="crm-search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Username, email or city…"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-neutral-950 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
          <p className="text-sm text-neutral-500">Querying customer CRM profiles...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-6 text-center text-neutral-600">
          <p className="font-semibold text-neutral-950">Failed to load CRM data</p>
          <p className="mt-2 text-xs text-neutral-500">{error}</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-600">
          <p className="font-semibold">No profiles found</p>
          <p className="mt-2 text-sm">No customers matched your query "{q}". Try widening your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <article
              key={c.email}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-neutral-950">{c.username}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                }`}>
                  {c.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600 truncate">{c.email}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {c.city || 'Nairobi'}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Orders</dt>
                  <dd className="font-bold tabular-nums text-neutral-950">
                    {c.order_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Lifetime</dt>
                  <dd className="font-bold tabular-nums text-neutral-950">
                    {formatPrice(c.total_spent)}
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

