import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';
import { fetchAdminDashboardOverview, fetchProducts } from '../../utils/api.js';

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const [res, products] = await Promise.all([
          fetchAdminDashboardOverview(),
          fetchProducts({ throwOnError: true }),
        ]);
        if (active && res && res.success) {
          setData(res.data);
          setLowStock(
            products
              .filter((p) => (p.stock_quantity ?? 0) <= 8)
              .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0)),
          );
        } else if (active) {
          setError(res?.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to fetch dashboard overview');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
        <p className="text-sm font-medium text-neutral-600">Loading live operations dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-6 text-center animate-fade-rise">
        <h3 className="text-lg font-semibold text-neutral-900">Dashboard Offline</h3>
        <p className="mt-2 text-sm text-neutral-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover"
        >
          Retry connection
        </button>
      </div>
    );
  }

  const getStatByTitle = (title) => data?.stats?.find((s) => s.title === title);

  const revenueFormatted = getStatByTitle('Total Revenue')?.value || 'KSh 0';
  const avgOrderValueFormatted = getStatByTitle('Avg Order Value')?.value || 'KSh 0';
  const totalOrders = getStatByTitle('Total Orders')?.value || '0';
  const activeCustomers = getStatByTitle('Active Customers')?.value || '0';

  const revenueChangeStr = getStatByTitle('Total Revenue')?.change || '0%';
  const ordersChangeStr = getStatByTitle('Total Orders')?.change || '0%';

  const revenueTrendUp = getStatByTitle('Total Revenue')?.trend === 'up';
  const ordersTrendUp = getStatByTitle('Total Orders')?.trend === 'up';

  const dynamicRevenueSeries =
    data?.salesData?.length > 0
      ? data.salesData.map((d) => ({ label: d.date, value: d.revenue }))
      : [];

  const dynamicSessionsSeries =
    data?.salesData?.length > 0
      ? data.salesData.map((d) => ({ label: d.date, value: d.orders }))
      : [];

  const transformedRecentOrders =
    data?.recentOrders?.length > 0
      ? data.recentOrders.map((o) => {
          const numericAmount =
            parseFloat(String(o.amount).replace(/[^0-9.]/g, '')) || 0;
          const orderNum = String(o.id || '').replace(/\D/g, '') || o.id;
          return {
            id: o.id,
            orderId: orderNum,
            customer: o.customer,
            status: o.status,
            totalKes: numericAmount,
          };
        })
      : [];

  const transformedTopProducts =
    data?.topProducts?.length > 0
      ? data.topProducts.map((p) => ({
          id: p.name,
          brand: 'ShoeLocker',
          name: p.name,
          revenueKes: p.revenue,
          units: p.sales,
        }))
      : [];

  const transformedAlerts =
    data?.alerts?.length > 0
      ? data.alerts.map((a, idx) => ({
          id: `alert-${idx}`,
          text: a.message,
          at: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        }))
      : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-rise">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Real-time operations feed connected to SQLite backend.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Connection
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue (30d)"
          value={revenueFormatted}
          hint="Nationwide storefront + Nairobi DC"
          trend={{
            label: `${revenueTrendUp ? '↑' : '↓'} ${revenueChangeStr.replace(/[+-]/g, '')} vs prior period`,
            positive: revenueTrendUp,
          }}
        />
        <StatCard
          title="Orders (30d)"
          value={`${totalOrders}`}
          trend={{
            label: `${ordersTrendUp ? '↑' : '↓'} ${ordersChangeStr.replace(/[+-]/g, '')} vs prior period`,
            positive: ordersTrendUp,
          }}
        />
        <StatCard
          title="Avg order value"
          value={avgOrderValueFormatted}
          hint="Excludes cancelled"
        />
        <StatCard
          title="Active Customers"
          value={`${activeCustomers}`}
          hint="Ordering this period"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">
            Gross sales trend
          </h2>
          <p className="text-xs text-neutral-500">Kenyan Shillings, daily totals</p>
          <div className="mt-6">
            <SimpleBarChart
              data={dynamicRevenueSeries}
              barClass="bg-neutral-950"
              valuePrefix="KSh "
            />
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">
            Activity / Sessions
          </h2>
          <p className="text-xs text-neutral-500">Daily conversion pipeline visits</p>
          <div className="mt-6">
            <SimpleBarChart
              data={dynamicSessionsSeries}
              barClass="bg-emerald-600"
              valuePrefix=""
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-950">
              Recent orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-3 pr-3 font-semibold">Order</th>
                  <th className="pb-3 pr-3 font-semibold">Customer</th>
                  <th className="pb-3 pr-3 font-semibold">City</th>
                  <th className="pb-3 pr-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transformedRecentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-neutral-500">
                      No recent orders yet.
                    </td>
                  </tr>
                ) : (
                  transformedRecentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 pr-3 font-medium tabular-nums">
                        <Link
                          className="text-neutral-950 hover:text-brand-red hover:underline"
                          to={`/admin/orders/${o.orderId}`}
                        >
                          {o.id}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-neutral-700">{o.customer}</td>
                      <td className="py-3 pr-3 text-neutral-600">—</td>
                      <td className="py-3 pr-3">
                        <OrderStatusPill status={o.status} />
                      </td>
                      <td className="py-3 text-right font-semibold tabular-nums">
                        {formatPrice(o.totalKes)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Top SKUs</h2>
          <p className="text-xs text-neutral-500">By revenue — database rank</p>
          <ul className="mt-4 space-y-3">
            {transformedTopProducts.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-neutral-800">
                    {p.brand} — {p.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-neutral-950">
                    {formatPrice(p.revenueKes)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{p.units} units sold</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Ops Alerts &amp; Activity</h2>
          <p className="text-xs text-neutral-500">Real-time system health checks</p>
          <ul className="mt-4 space-y-4">
            {transformedAlerts.map((a) => (
              <li key={a.id} className="border-l-2 border-brand-red pl-3">
                <p className="text-sm text-neutral-800">{a.text}</p>
                <p className="text-[11px] text-neutral-500">
                  {new Date(a.at).toLocaleString('en-KE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-950">Low stock</h2>
            <Link
              to="/admin/products"
              className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline"
            >
              Inventory
            </Link>
          </div>
          <p className="text-xs text-neutral-500">
            SKUs under 8 units (includes manual adjustments)
          </p>
          {lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-600">
              All tracked SKUs are above the danger line.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/admin/products/${p.product_id}/edit`}
                    className="text-sm font-medium text-neutral-900 hover:text-brand-red"
                  >
                    {p.brand} — {p.name}
                  </Link>
                  <p className="text-xs text-amber-800">
                    {p.stock_quantity ?? 0} units on hand
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

