import { useEffect, useState } from 'react';
import { fetchAdminAnalytics } from '../../utils/api.js';
import { formatPrice } from '../../utils/format.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { SimpleDonut } from '../../components/admin/SimpleDonut.jsx';

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

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-brand-red/20 bg-brand-red/5 p-6 text-center">
        <p className="text-sm text-neutral-700">{error}</p>
      </div>
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
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Live sales trends, category performance, and customer segments from the backend.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Orders (30d)" value={String(overview.total_orders ?? 0)} />
        <Stat label="Revenue (30d)" value={formatPrice(overview.total_revenue ?? 0)} />
        <Stat label="Customers" value={String(overview.total_customers ?? 0)} />
        <Stat label="Products" value={String(overview.total_products ?? 0)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Revenue &amp; orders</h2>
          <p className="text-xs text-neutral-500">Rolling 30 days</p>
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
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Category revenue</h2>
          <p className="text-xs text-neutral-500">Share of delivered-order revenue</p>
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
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Customer segments</h2>
        <p className="text-xs text-neutral-500">By lifetime order value (30d window)</p>
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
      </section>
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
