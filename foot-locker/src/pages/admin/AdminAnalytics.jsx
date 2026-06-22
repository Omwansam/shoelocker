import { useEffect, useState } from 'react';
import { fetchAdminAnalytics } from '../../utils/api.js';
import { formatPrice } from '../../utils/format.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { SimpleDonut } from '../../components/admin/SimpleDonut.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';

export function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchAdminAnalytics({ days: 30 });
        if (active && res?.success) setData(res.data);
        else if (active) setError(res?.error || 'Failed to load analytics');
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <AdminLoading label="Loading analytics…" />;

  if (error) {
    return (
      <AdminPage>
        <AdminAlert>{error}</AdminAlert>
      </AdminPage>
    );
  }

  const overview = data?.overview || {};
  const salesTrend = data?.sales_trend || [];
  const categoryPerf = data?.category_performance || [];
  const segments = data?.customer_segments || [];

  const revenueSeries = salesTrend.map((d) => ({
    label: d.date?.slice(5) || d.date,
    value: d.revenue || 0,
  }));

  const sessionsSeries = salesTrend.map((d) => ({
    label: d.date?.slice(5) || d.date,
    value: d.orders || 0,
  }));

  const totalCategoryRevenue = categoryPerf.reduce((s, c) => s + (c.revenue || 0), 0) || 1;
  const donutColors = ['#e60012', '#171717', '#059669', '#0284c7', '#a16207'];
  const donutSegments = categoryPerf.slice(0, 5).map((c, i) => ({
    label: c.name,
    pct: Math.round(((c.revenue || 0) / totalCategoryRevenue) * 100),
    color: donutColors[i % donutColors.length],
  }));

  const maxSegment = Math.max(...segments.map((s) => s.count), 1);

  return (
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description="Sales trends, category performance, and customer segments from the backend."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Orders (30d)" value={String(overview.total_orders ?? 0)} accent="sky" />
        <StatCard title="Revenue (30d)" value={formatPrice(overview.total_revenue ?? 0)} accent="red" />
        <StatCard title="Customers" value={String(overview.total_customers ?? 0)} accent="emerald" />
        <StatCard title="Products" value={String(overview.total_products ?? 0)} accent="dark" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminCard title="Revenue & orders" subtitle="Rolling 30 days from database" className="lg:col-span-2">
          <div className="mt-6 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Revenue (KSh)
              </p>
              <SimpleBarChart data={revenueSeries} barClass="bg-brand-red" valuePrefix="KSh " />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Orders
              </p>
              <SimpleBarChart data={sessionsSeries} barClass="bg-neutral-950" valuePrefix="" />
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Category revenue" subtitle="Share of order revenue">
          {donutSegments.length ? (
            <>
              <div className="mt-6">
                <SimpleDonut segments={donutSegments} />
              </div>
              <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                {categoryPerf.slice(0, 5).map((c) => (
                  <li key={c.name} className="flex justify-between gap-2">
                    <span className="text-neutral-600">{c.name}</span>
                    <span className="font-medium tabular-nums text-neutral-950">
                      {formatPrice(c.revenue || 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-sm text-neutral-500">No category data yet.</p>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Customer segments" subtitle="By spend in the last 30 days (database)">
        <ul className="mt-6 space-y-4">
          {segments.map((s) => (
            <li key={s.segment}>
              <div className="flex justify-between text-sm font-medium">
                <span>{s.segment}</span>
                <span className="tabular-nums text-neutral-600">{s.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-brand-red"
                  style={{ width: `${(s.count / maxSegment) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
    </AdminPage>
  );
}
