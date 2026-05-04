import {
  deviceShare,
  funnelSteps,
  revenueSeries14d,
  sessionsSeries14d,
  trafficSources,
} from '../../data/adminMock.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { SimpleDonut } from '../../components/admin/SimpleDonut.jsx';

export function AdminAnalytics() {
  const donutColors = ['#e60012', '#171717', '#059669', '#0284c7', '#a16207'];
  const donutSegments = trafficSources.map((s, i) => ({
    label: s.source,
    pct: s.share,
    color: donutColors[i % donutColors.length],
  }));

  const maxFunnel = Math.max(...funnelSteps.map((f) => f.count), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Acquisition, funnel, and device mix — static demo payloads you can swap
          for live BI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Revenue &amp; visits</h2>
          <p className="text-xs text-neutral-500">Rolling 14 days</p>
          <div className="mt-6 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Revenue (KSh)
              </p>
              <SimpleBarChart data={revenueSeries14d} barClass="bg-brand-red" valuePrefix="" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Sessions
              </p>
              <SimpleBarChart data={sessionsSeries14d} barClass="bg-neutral-950" valuePrefix="" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Traffic sources</h2>
          <p className="text-xs text-neutral-500">Attributed sessions</p>
          <div className="mt-6">
            <SimpleDonut segments={donutSegments} />
          </div>
          <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            {trafficSources.map((t) => (
              <li key={t.source} className="flex justify-between gap-2">
                <span className="text-neutral-600">{t.source}</span>
                <span className="font-medium tabular-nums text-neutral-950">
                  {t.sessions.toLocaleString('en-KE')} visits
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Conversion funnel</h2>
          <p className="text-xs text-neutral-500">
            Relative volume — modeled conversion {funnelSteps[4].rate}% sessions → orders
          </p>
          <ul className="mt-6 space-y-4">
            {funnelSteps.map((f) => (
              <li key={f.step}>
                <div className="flex justify-between text-sm font-medium">
                  <span>{f.step}</span>
                  <span className="tabular-nums text-neutral-600">{f.count.toLocaleString('en-KE')}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-brand-red"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Device share</h2>
          <p className="text-xs text-neutral-500">Safaricom Android vs iOS modeled</p>
          <div className="mt-8 space-y-5">
            {deviceShare.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="tabular-nums text-neutral-600">{d.pct}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-950"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-neutral-500">
            Tip: overlay M-Pesa pay-by-link completion here when payments go live —
            correlate with courier SLA.
          </p>
        </section>
      </div>
    </div>
  );
}
