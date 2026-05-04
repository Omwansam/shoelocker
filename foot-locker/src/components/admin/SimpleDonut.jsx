/** @param {{ segments: { label: string, pct: number, color: string }[] }} props */
export function SimpleDonut({ segments }) {
  const total = segments.reduce((a, s) => a + s.pct, 0) || 1;
  const norm = segments.map((s) => ({
    ...s,
    pct: (s.pct / total) * 100,
  }));

  const gradientStops = norm.reduce(
    (acc, s) => {
      const start = acc.offset;
      const end = start + s.pct;
      return {
        offset: end,
        parts: [...acc.parts, `${s.color} ${start}%`, `${s.color} ${end}%`],
      };
    },
    { offset: 0, parts: /** @type {string[]} */ ([]) },
  ).parts;

  const style = {
    background: `conic-gradient(${gradientStops.join(', ')})`,
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className="relative mx-auto size-36 shrink-0 rounded-full shadow-inner sm:mx-0"
        style={style}
        aria-hidden
      >
        <div className="absolute inset-5 rounded-full bg-white" />
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-neutral-700">
              {s.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-neutral-950">
              {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
