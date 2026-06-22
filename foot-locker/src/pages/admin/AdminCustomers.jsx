import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import { fetchAdminCustomers } from '../../utils/api.js';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';

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
    <AdminPage>
      <AdminPageHeader
        title="Customers"
        description="CRM directory synced from live authentication and order data."
        badge={
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
            {customers.length} total
          </span>
        }
      />

      <form onSubmit={handleSearchSubmit} className="flex max-w-md gap-2">
        <AdminInput id="crm-search" className="flex-1" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Username or email…" />
        <AdminButton variant="dark" type="submit">Search</AdminButton>
      </form>

      {loading ? (
        <AdminLoading label="Loading customers…" minHeight="min-h-[250px]" />
      ) : error ? (
        <AdminAlert>{error}</AdminAlert>
      ) : customers.length === 0 ? (
        <AdminCard>
          <div className="py-8 text-center text-neutral-600">
            <p className="font-semibold text-neutral-950">No profiles found</p>
            <p className="mt-2 text-sm">No customers matched your query &ldquo;{q}&rdquo;.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <AdminCard key={c.email} padding className="transition hover:-translate-y-0.5 hover:shadow-lg">
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
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

