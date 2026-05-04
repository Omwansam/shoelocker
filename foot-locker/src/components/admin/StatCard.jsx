/** @param {{ title: string, value: string, hint?: string, trend?: { label: string, positive?: boolean } }} props */
export function StatCard({ title, value, hint, trend }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-950">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
      {trend ? (
        <p
          className={
            trend.positive === false
              ? 'mt-2 text-xs font-medium text-amber-700'
              : 'mt-2 text-xs font-medium text-emerald-700'
          }
        >
          {trend.label}
        </p>
      ) : null}
    </div>
  );
}
