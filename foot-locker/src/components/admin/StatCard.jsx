/** @param {{ title: string, value: string, hint?: string, trend?: { label: string, positive?: boolean }, icon?: import('react').ReactNode, accent?: 'red' | 'dark' | 'emerald' | 'sky' }} props */
export function StatCard({ title, value, hint, trend, icon, accent = 'dark' }) {
  const accents = {
    red: 'from-brand-red/10 to-transparent text-brand-red',
    dark: 'from-neutral-200/60 to-transparent text-neutral-700',
    emerald: 'from-emerald-500/10 to-transparent text-emerald-600',
    sky: 'from-sky-500/10 to-transparent text-sky-600',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_3px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.12)]">
      <div className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br ${accents[accent]}`} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{title}</p>
        {icon ? (
          <span className={`rounded-xl bg-gradient-to-br p-2 ${accents[accent]}`}>{icon}</span>
        ) : null}
      </div>
      <p className="relative mt-3 text-[1.65rem] font-bold leading-none tabular-nums tracking-tight text-neutral-950">
        {value}
      </p>
      {hint ? <p className="relative mt-2 text-xs text-neutral-500">{hint}</p> : null}
      {trend ? (
        <p
          className={
            trend.positive === false
              ? 'relative mt-3 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800'
              : 'relative mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800'
          }
        >
          {trend.label}
        </p>
      ) : null}
    </div>
  );
}
