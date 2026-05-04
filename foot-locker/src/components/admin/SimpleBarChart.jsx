/** @param {{ data: { label: string, value: number }[], valuePrefix?: string, barClass?: string }} props */
export function SimpleBarChart({
  data,
  valuePrefix = '',
  barClass = 'bg-brand-red',
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className="flex h-52 items-end gap-1 sm:gap-2"
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, 6);
        return (
          <div
            key={d.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span className="max-w-full truncate text-[10px] font-medium tabular-nums text-neutral-600 sm:text-xs">
              {valuePrefix}
              {d.value.toLocaleString('en-KE')}
            </span>
            <div className="flex h-36 w-full items-end justify-center rounded-t-md bg-neutral-50">
              <div
                className={`w-[80%] max-w-9 rounded-t-md transition ${barClass}`}
                style={{ height: `${pct}%` }}
                title={`${d.label}: ${valuePrefix}${d.value.toLocaleString('en-KE')}`}
              />
            </div>
            <span className="max-w-full truncate text-[9px] text-neutral-500 sm:text-[10px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
