import { useEffect, useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile } from '../../utils/csv.js';
import { exportAdminReport, fetchOrderStats } from '../../utils/api.js';

export function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchOrderStats(30);
        if (active) setStats(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function handleExport(type) {
    setExporting(type);
    setError(null);
    try {
      const res = await exportAdminReport(type, 30);
      if (res?.success && res.data) {
        downloadTextFile(res.filename || `${type}-report.csv`, res.data);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Reports &amp; export</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Live operational snapshots and CSV downloads from the backend.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">Orders (30d)</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {loading ? '…' : stats?.total_orders ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">Delivered (30d)</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {loading ? '…' : stats?.completed_orders ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">Revenue (30d)</p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {loading ? '…' : formatPrice(stats?.total_revenue ?? 0)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Downloads</h2>
        <p className="mt-1 text-sm text-neutral-600">
          CSV exports generated server-side from live database records.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {['sales', 'inventory', 'customers'].map((type) => (
            <button
              key={type}
              type="button"
              disabled={exporting === type}
              onClick={() => handleExport(type)}
              className={
                type === 'sales'
                  ? 'rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50'
                  : 'rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50'
              }
            >
              {exporting === type ? 'Exporting…' : `Export ${type}`}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
