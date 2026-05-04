import { Link } from 'react-router-dom';
import {
  activityFeedSeed,
  dashboardKpis,
  getTopProductsByRevenue,
  mockOrders,
  revenueSeries14d,
  sessionsSeries14d,
} from '../../data/adminMock.js';
import { formatPrice } from '../../utils/format.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';
import { useAdminOrderStatuses } from '../../hooks/useAdminOrderStatuses.js';
import { useAdminInventory } from '../../hooks/useAdminInventory.js';

function pctDelta(current, prior) {
  if (prior === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export function AdminDashboard() {
  const revDelta = pctDelta(dashboardKpis.revenue7d, dashboardKpis.revenuePrior7d);
  const ordDelta = pctDelta(dashboardKpis.orders7d, dashboardKpis.ordersPrior7d);
  const top = getTopProductsByRevenue();
  const recent = mockOrders.slice(0, 5);
  const { getStatus } = useAdminOrderStatuses();
  const { lowStockProducts, getStock } = useAdminInventory();

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Last 7 days vs prior week — illustrative KPIs tuned for Kenyan Shillings.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue (7d)"
          value={formatPrice(dashboardKpis.revenue7d)}
          hint="Nationwide storefront + Nairobi DC"
          trend={{
            label: `${revDelta >= 0 ? '↑' : '↓'} ${Math.abs(revDelta)}% vs prior week`,
            positive: revDelta >= 0,
          }}
        />
        <StatCard
          title="Orders (7d)"
          value={`${dashboardKpis.orders7d}`}
          trend={{
            label: `${ordDelta >= 0 ? '↑' : '↓'} ${Math.abs(ordDelta)}% vs prior week`,
            positive: ordDelta >= 0,
          }}
        />
        <StatCard
          title="Avg order value"
          value={formatPrice(dashboardKpis.avgOrderValueKes)}
          hint="Excludes cancelled"
        />
        <StatCard
          title="Dispatch queue"
          value={`${dashboardKpis.pendingDispatch} orders`}
          hint={`Median pack time ~${dashboardKpis.fulfilmentSlaHours}h`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">
            Gross sales (14d)
          </h2>
          <p className="text-xs text-neutral-500">Kenyan Shillings, nightly close</p>
          <div className="mt-6">
            <SimpleBarChart
              data={revenueSeries14d}
              barClass="bg-neutral-950"
              valuePrefix="KSh "
            />
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">
            Sessions (14d)
          </h2>
          <p className="text-xs text-neutral-500">Unique browsers, modeled</p>
          <div className="mt-6">
            <SimpleBarChart
              data={sessionsSeries14d}
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
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-3 font-medium tabular-nums">
                      <Link
                        className="text-neutral-950 hover:text-brand-red hover:underline"
                        to={`/admin/orders/${o.id}`}
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-neutral-700">{o.customer}</td>
                    <td className="py-3 pr-3 text-neutral-600">{o.city}</td>
                    <td className="py-3 pr-3">
                      <OrderStatusPill status={getStatus(o)} />
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums">
                      {formatPrice(o.totalKes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Top SKUs</h2>
          <p className="text-xs text-neutral-500">By revenue — mock velocity</p>
          <ul className="mt-4 space-y-3">
            {top.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-neutral-800">
                    {p.brand} — {p.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-neutral-950">
                    {formatPrice(p.revenueKes)}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{p.units} units</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Live feed</h2>
          <p className="text-xs text-neutral-500">Ops-style pulse (static seed)</p>
          <ul className="mt-4 space-y-4">
            {activityFeedSeed.map((a) => (
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
            SKUs under 8 units (includes your manual adjustments)
          </p>
          {lowStockProducts.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-600">
              All tracked SKUs are above the danger line.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStockProducts.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/admin/products"
                    className="text-sm font-medium text-neutral-900 hover:text-brand-red"
                  >
                    {p.brand} — {p.name}
                  </Link>
                  <p className="text-xs text-amber-800">
                    {getStock(p.id)} units on hand
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
