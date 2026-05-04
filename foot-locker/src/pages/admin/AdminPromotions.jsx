import { useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import { useAdminPromotions } from '../../hooks/useAdminPromotions.js';

export function AdminPromotions() {
  const { allRowsForAdmin, addPromo, togglePromoActive, removeCustom } =
    useAdminPromotions();
  const [code, setCode] = useState('');
  const [kind, setKind] = useState(/** @type {'percent' | 'fixed'} */ ('percent'));
  const [value, setValue] = useState('10');
  const [minSpend, setMinSpend] = useState('8000');
  const [expires, setExpires] = useState('2026-12-31');
  const [err, setErr] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    setErr('');
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setErr('Code should be at least 3 characters.');
      return;
    }
    const v = Number(value);
    const m = Number(minSpend);
    if (!Number.isFinite(v) || v <= 0) {
      setErr('Value must be a positive number.');
      return;
    }
    if (!Number.isFinite(m) || m < 0) {
      setErr('Minimum spend must be zero or more.');
      return;
    }
    addPromo({
      code: c,
      kind,
      value: kind === 'percent' ? Math.min(90, v) : v,
      minSpendKes: m,
      expires,
      active: true,
    });
    setCode('');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Promotions</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Campaign codes for checkout — stored in this browser until you wire a
          discounts service.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create code</h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {err ? (
            <p className="sm:col-span-2 lg:col-span-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MADARAKA"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Type
            </label>
            <select
              value={kind}
              onChange={(e) =>
                setKind(/** @type {'percent' | 'fixed'} */ (e.target.value))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed KSh off</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Value
            </label>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Percent capped at 90 in this demo.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Minimum spend (KSh)
            </label>
            <input
              type="number"
              min={0}
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Expiry
            </label>
            <input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-10 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Add promotion
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Deal</th>
              <th className="px-4 py-3 font-semibold">Min spend</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {allRowsForAdmin.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50/80">
                <td className="px-4 py-3 font-mono font-bold">{row.code}</td>
                <td className="px-4 py-3">
                  {row.kind === 'percent'
                    ? `${row.value}% off`
                    : `${formatPrice(row.value)} off`}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatPrice(row.minSpendKes)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                  {row.expires}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {'isSeed' in row && row.isSeed ? 'Built-in seed' : 'Custom'}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      togglePromoActive(
                        row.id,
                        'isSeed' in row && row.isSeed,
                      )
                    }
                    className={
                      row.active
                        ? 'rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800'
                        : 'rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600'
                    }
                  >
                    {row.active ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {'isSeed' in row && row.isSeed ? (
                    <span className="text-xs text-neutral-400">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeCustom(row.id)}
                      className="text-xs font-semibold text-brand-red hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
