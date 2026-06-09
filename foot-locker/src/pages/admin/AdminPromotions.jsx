import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import {
  createCoupon,
  deleteCoupon,
  fetchAdminCoupons,
  updateCoupon,
} from '../../utils/api.js';

function formatCouponDeal(coupon) {
  const type = String(coupon.discount_type || '').toLowerCase();
  if (type.includes('percent')) return `${coupon.discount_value}% off`;
  return `${formatPrice(coupon.discount_value)} off`;
}

function formatExpiry(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-KE');
  } catch {
    return iso.slice(0, 10);
  }
}

export function AdminPromotions() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [kind, setKind] = useState(/** @type {'percent' | 'fixed'} */ ('percent'));
  const [value, setValue] = useState('10');
  const [minSpend, setMinSpend] = useState('8000');
  const [expires, setExpires] = useState('2026-12-31');
  const [saving, setSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminCoupons();
      setCoupons(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setError('Code should be at least 3 characters.');
      return;
    }
    const v = Number(value);
    const m = Number(minSpend);
    if (!Number.isFinite(v) || v <= 0) {
      setError('Value must be a positive number.');
      return;
    }
    if (!Number.isFinite(m) || m < 0) {
      setError('Minimum spend must be zero or more.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createCoupon({
        code: c,
        discount_type: kind === 'percent' ? 'Percentage' : 'Fixed',
        discount_value: kind === 'percent' ? Math.min(90, v) : v,
        min_order_amount: m,
        valid_to: expires,
        is_active: true,
        usage_limit: 999,
      });
      setCode('');
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon) {
    try {
      await updateCoupon(coupon.coupon_id, { is_active: !coupon.is_active });
      setCoupons((prev) =>
        prev.map((row) =>
          row.coupon_id === coupon.coupon_id
            ? { ...row, is_active: !row.is_active }
            : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update coupon');
    }
  }

  async function handleDelete(couponId) {
    if (!globalThis.confirm('Delete this promotion code?')) return;
    try {
      await deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.coupon_id !== couponId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Promotions</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Campaign codes for checkout — synced with the backend coupon service.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Create code</h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold uppercase text-neutral-500">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MADARAKA"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-brand-red/25"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">Type</label>
            <select
              value={kind}
              onChange={(e) => setKind(/** @type {'percent' | 'fixed'} */ (e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed KSh off</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">Value</label>
            <input
              type="number"
              min={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
            />
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
            <label className="text-xs font-semibold uppercase text-neutral-500">Expiry</label>
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
              disabled={saving}
              className="h-10 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add promotion'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Deal</th>
                <th className="px-4 py-3 font-semibold">Min spend</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Uses left</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-neutral-600">
                    No promotion codes yet — create one above.
                  </td>
                </tr>
              ) : (
                coupons.map((row) => (
                  <tr key={row.coupon_id} className="hover:bg-neutral-50/80">
                    <td className="px-4 py-3 font-mono font-bold">{row.code}</td>
                    <td className="px-4 py-3">{formatCouponDeal(row)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.min_order_amount != null
                        ? formatPrice(row.min_order_amount)
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                      {formatExpiry(row.valid_to)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.usage_limit ?? '∞'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className={
                          row.is_active
                            ? 'rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800'
                            : 'rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600'
                        }
                      >
                        {row.is_active ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.coupon_id)}
                        className="text-xs font-semibold text-brand-red hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
