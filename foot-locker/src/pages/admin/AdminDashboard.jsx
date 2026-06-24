import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { SimpleDonut } from '../../components/admin/SimpleDonut.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { OrderStatusPill } from '../../components/admin/OrderStatusPill.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import { AdminTable, AdminTableHead, AdminTableBody, AdminTh, AdminTd } from '../../components/admin/ui/AdminTable.jsx';
import { ADMIN_CONSOLE_NAME } from '../../config/adminBrand.js';
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
        if (active) setError(err.message || 'Failed to fetch dashboard overview');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <AdminLoading label="Loading operations dashboard…" />;

  if (error) {
    return (
      <AdminPage>
        <AdminCard>
          <div className="py-8 text-center">
            <h3 className="text-lg font-semibold text-neutral-900">Dashboard unavailable</h3>
            <p className="mt-2 text-sm text-neutral-600">{error}</p>
            <AdminButton variant="primary" className="mt-5" onClick={() => window.location.reload()}>
              Retry connection
            </AdminButton>
          </div>
        </AdminCard>
      </AdminPage>
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
          const numericAmount = parseFloat(String(o.amount).replace(/[^0-9.]/g, '')) || 0;
          const orderNum = String(o.id || '').replace(/\D/g, '') || o.id;
          return { id: o.id, orderId: orderNum, customer: o.customer, status: o.status, totalKes: numericAmount };
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

  const categoryData = data?.categoryData || [];
  const regionalData = data?.regionalData || [];
  const totalCategoryRevenue = categoryData.reduce((s, c) => s + (c.sales || 0), 0) || 1;
  const donutColors = ['#e60012', '#171717', '#059669', '#0284c7', '#a16207'];
  const donutSegments = categoryData.slice(0, 5).map((c, i) => ({
    label: c.name,
    pct: Math.round(((c.sales || 0) / totalCategoryRevenue) * 100),
    color: donutColors[i % donutColors.length],
  }));

  return (
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description={`${ADMIN_CONSOLE_NAME} command center — live revenue, orders, and inventory for ShoeLocker.`}
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/team"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              Team
            </Link>
            <Link
              to="/admin/orders"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              View orders
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          ['/admin/products', 'Products'],
          ['/admin/suppliers', 'Suppliers'],
          ['/admin/content', 'Content'],
          ['/admin/settings', 'Settings'],
        ].map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-brand-red/30 hover:text-brand-red"
          >
            {label}
          </Link>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue (30d)"
          value={revenueFormatted}
          hint="Nationwide storefront"
          accent="red"
          trend={{
            label: `${revenueTrendUp ? '↑' : '↓'} ${revenueChangeStr.replace(/[+-]/g, '')} vs prior`,
            positive: revenueTrendUp,
          }}
        />
        <StatCard
          title="Orders (30d)"
          value={`${totalOrders}`}
          accent="sky"
          trend={{
            label: `${ordersTrendUp ? '↑' : '↓'} ${ordersChangeStr.replace(/[+-]/g, '')} vs prior`,
            positive: ordersTrendUp,
          }}
        />
        <StatCard title="Avg order value" value={avgOrderValueFormatted} hint="Excludes cancelled" accent="emerald" />
        <StatCard title="Active customers" value={`${activeCustomers}`} hint="Ordering this period" accent="dark" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Gross sales trend" subtitle="Kenyan Shillings, daily totals">
          <SimpleBarChart data={dynamicRevenueSeries} barClass="bg-neutral-950" valuePrefix="KSh " />
        </AdminCard>
        <AdminCard title="Order activity" subtitle="Daily order volume">
          <SimpleBarChart data={dynamicSessionsSeries} barClass="bg-emerald-600" valuePrefix="" />
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard title="Category revenue" subtitle="From database orders" className="lg:col-span-1">
          {donutSegments.length ? (
            <>
              <SimpleDonut segments={donutSegments} />
              <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                {categoryData.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex justify-between gap-2">
                    <span className="text-neutral-600">{c.name}</span>
                    <span className="font-medium tabular-nums">{formatPrice(c.sales || 0)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-neutral-500">No category sales in this period.</p>
          )}
        </AdminCard>

        <AdminCard title="Sales by county" subtitle="Kenya regional breakdown" className="lg:col-span-2">
          {regionalData.length ? (
            <ul className="space-y-4">
              {regionalData.map((r) => (
                <li key={r.region}>
                  <div className="flex justify-between text-sm font-medium">
                    <span>{r.region}</span>
                    <span className="tabular-nums text-neutral-600">{r.orders} orders · {formatPrice(r.sales)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-brand-red"
                      style={{
                        width: `${Math.max(8, (r.sales / (regionalData[0]?.sales || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">No regional data yet — run demo seed.</p>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard
          className="lg:col-span-2"
          title="Recent orders"
          subtitle="Latest transactions from checkout"
          action={
            <Link to="/admin/orders" className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline">
              View all
            </Link>
          }
          padding={false}
        >
          <AdminTable minWidth="min-w-[520px]">
            <AdminTableHead>
              <AdminTh>Order</AdminTh>
              <AdminTh>Customer</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh className="text-right">Total</AdminTh>
            </AdminTableHead>
            <AdminTableBody>
              {transformedRecentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                    No recent orders yet.
                  </td>
                </tr>
              ) : (
                transformedRecentOrders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-neutral-50/80">
                    <AdminTd className="font-semibold tabular-nums">
                      <Link className="text-neutral-950 hover:text-brand-red hover:underline" to={`/admin/orders/${o.orderId}`}>
                        {o.id}
                      </Link>
                    </AdminTd>
                    <AdminTd className="text-neutral-700">{o.customer}</AdminTd>
                    <AdminTd><OrderStatusPill status={o.status} /></AdminTd>
                    <AdminTd className="text-right font-semibold tabular-nums">{formatPrice(o.totalKes)}</AdminTd>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminCard>

        <AdminCard title="Top SKUs" subtitle="By revenue">
          <ul className="space-y-4">
            {transformedTopProducts.map((p, i) => (
              <li key={p.id} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-neutral-800">{p.brand} — {p.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatPrice(p.revenueKes)}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{p.units} units sold</p>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Ops alerts" subtitle="System activity">
          <ul className="space-y-4">
            {transformedAlerts.length ? transformedAlerts.map((a) => (
              <li key={a.id} className="border-l-2 border-brand-red pl-4">
                <p className="text-sm text-neutral-800">{a.text}</p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  {new Date(a.at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </li>
            )) : (
              <p className="text-sm text-neutral-500">No alerts right now.</p>
            )}
          </ul>
        </AdminCard>

        <AdminCard
          title="Low stock"
          subtitle="SKUs under 8 units"
          action={
            <Link to="/admin/products" className="text-xs font-bold uppercase tracking-wide text-brand-red hover:underline">
              Inventory
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <p className="text-sm text-neutral-600">All tracked SKUs are above the danger line.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50/80 px-3 py-2.5">
                  <Link to={`/admin/products/${p.product_id}/edit`} className="text-sm font-medium text-neutral-900 hover:text-brand-red">
                    {p.brand} — {p.name}
                  </Link>
                  <span className="shrink-0 text-xs font-bold text-amber-800">{p.stock_quantity ?? 0} left</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}
