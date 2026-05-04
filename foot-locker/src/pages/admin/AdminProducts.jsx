import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getHiddenProductRows,
  mergeCatalogList,
  mutateCatalog,
  readCatalogDelta,
  seedProductIdSet,
} from '../../utils/catalogStorage.js';
import { formatPrice } from '../../utils/format.js';
import { useAdminInventory } from '../../hooks/useAdminInventory.js';
import { useCatalogRevision } from '../../hooks/useCatalogRevision.js';

/** @typedef {'all' | 'men' | 'women' | 'kids'} CatFilter */

/** @typedef {import('../../utils/catalogStorage.js').Product} Product */

export function AdminProducts() {
  const catalogRev = useCatalogRevision();
  const { getStock, setStock } = useAdminInventory();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(/** @type {CatFilter} */ ('all'));
  const [tab, setTab] = useState(/** @type {'live' | 'hidden'} */ ('live'));

  const merged = useMemo(() => {
    void catalogRev;
    return mergeCatalogList();
  }, [catalogRev]);
  const seeds = useMemo(() => seedProductIdSet(), []);
  const hiddenRows = useMemo(() => {
    void catalogRev;
    return getHiddenProductRows();
  }, [catalogRev]);
  const customIdSet = useMemo(() => {
    void catalogRev;
    return new Set(readCatalogDelta().additions.map((p) => p.id));
  }, [catalogRev]);

  const filtered = useMemo(() => {
    const base = tab === 'live' ? merged : hiddenRows;
    const needle = q.trim().toLowerCase();
    return base.filter((p) => {
      if (!p) return false;
      if (cat !== 'all' && p.category !== cat) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle)
      );
    });
  }, [tab, merged, hiddenRows, q, cat]);

  function hideSku(/** @type {string} */ id) {
    mutateCatalog((d) => {
      if (!d.removedIds.includes(id)) d.removedIds.push(id);
    });
  }

  function restoreSku(/** @type {string} */ id) {
    mutateCatalog((d) => {
      d.removedIds = d.removedIds.filter((x) => x !== id);
    });
  }

  function deleteCustom(/** @type {string} */ id) {
    if (!window.confirm(`Permanently remove custom SKU "${id}"?`)) return;
    mutateCatalog((d) => {
      d.additions = d.additions.filter((p) => p.id !== id);
      d.removedIds = d.removedIds.filter((x) => x !== id);
      delete d.overrides[id];
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-rise">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Products &amp; stock</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Add styles with photos (URLs), edit seeded SKUs or hide listings — changes hit
            the live storefront instantly in this prototype.
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-red-hover"
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {(
          /** @type {const} */ ([
            ['live', `Live (${merged.length})`],
            ['hidden', `Hidden (${hiddenRows.length})`],
          ])
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(/** @type {'live' | 'hidden'} */ (key))}
            className={
              tab === key
                ? 'rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white'
                : 'rounded-full px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100'
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Search
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, brand, SKU…"
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Category
          </label>
          <select
            value={cat}
            onChange={(e) =>
              setCat(/** @type {CatFilter} */ (e.target.value))
            }
            className="mt-2 block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-red/25 sm:w-44"
          >
            <option value="all">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr className="text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Thumb</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Cat</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-neutral-600">
                    Nothing here yet — widen filters or add a product.
                  </td>
                </tr>
              ) : (
                filtered.map((/** @type {Product} */ p) => {
                  const units = getStock(p.id);
                  const low = units < 8;
                  const seed = seeds.has(p.id);
                  const isCustomOnly = customIdSet.has(p.id);

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80">
                      <td className="px-4 py-2">
                        <img
                          src={p.image}
                          alt=""
                          width={52}
                          height={52}
                          className="size-[52px] rounded-lg border border-neutral-100 object-cover"
                          loading="lazy"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                        {p.id}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-950">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{p.brand}</td>
                      <td className="px-4 py-3 capitalize text-neutral-600">
                        {p.category}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        {tab === 'live' ?
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={units}
                              onChange={(e) => setStock(p.id, e.target.value)}
                              className={`w-20 rounded-lg border px-2 py-1 text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand-red/25 ${
                                low
                                  ? 'border-amber-400 bg-amber-50 text-amber-950'
                                  : 'border-neutral-200'
                              }`}
                            />
                            {low ?
                              <span className="text-[11px] font-bold uppercase text-amber-700">
                                Low
                              </span>
                            : null}
                          </div>
                        : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold uppercase text-neutral-500">
                        {seed ? 'Seed' : 'Custom'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="text-xs font-bold uppercase text-brand-red hover:underline"
                          >
                            Edit
                          </Link>
                          {tab === 'live' ?
                            <button
                              type="button"
                              onClick={() => hideSku(p.id)}
                              className="text-xs font-bold uppercase text-neutral-600 hover:text-neutral-950"
                            >
                              Hide
                            </button>
                          : (
                            <>
                              <button
                                type="button"
                                onClick={() => restoreSku(p.id)}
                                className="text-xs font-bold uppercase text-emerald-700 hover:underline"
                              >
                                Restore
                              </button>
                              {!seed && isCustomOnly ?
                                <button
                                  type="button"
                                  onClick={() => deleteCustom(p.id)}
                                  className="text-xs font-bold uppercase text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              : null}
                            </>
                          )}
                          <Link
                            to={`/product/${p.id}`}
                            className="text-xs font-bold uppercase text-neutral-500 hover:underline"
                          >
                            Store
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
