import { useMemo } from 'react';
import { compareSizes } from '../utils/catalogFilters.js';

/**
 * @typedef {{
 *   brand: string,
 *   size: string,
 *   category: string,
 *   price: 'any'|'under100'|'100-150'|'over150'|'sale',
 * }} FilterState
 */

/** @typedef {'featured'|'price-asc'|'price-desc'|'newest'} SortBy */

/**
 * @param {{
 *   brandsInCatalog: string[],
 *   sizesInCatalog: string[],
 *   filters: FilterState,
 *   onFiltersChange: (patch: Partial<FilterState>) => void,
 *   sortBy: SortBy,
 *   onSortChange: (s: SortBy) => void,
 *   priceLockedSale?: boolean,
 *   brandLocked?: boolean,
 * }} props
 */
export function Filters({
  brandsInCatalog,
  sizesInCatalog,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  priceLockedSale = false,
  brandLocked = false,
}) {
  const brandOpts = useMemo(
    () => [...brandsInCatalog].sort((a, b) => a.localeCompare(b)),
    [brandsInCatalog],
  );
  const sizeOpts = useMemo(
    () => [...sizesInCatalog].sort(compareSizes),
    [sizesInCatalog],
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Brand">
          <select
            value={filters.brand}
            disabled={brandLocked}
            onChange={(e) =>
              onFiltersChange({ brand: e.target.value })
            }
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
          >
            <option value="all">All brands</option>
            {brandOpts.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Size">
          <select
            value={filters.size}
            onChange={(e) =>
              onFiltersChange({ size: e.target.value })
            }
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm"
          >
            <option value="all">All sizes</option>
            {sizeOpts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category">
          <select
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({ category: e.target.value })
            }
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm"
          >
            <option value="all">All categories</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
          </select>
        </Field>

        <Field label="Price">
          <select
            value={filters.price}
            disabled={priceLockedSale}
            onChange={(e) =>
              onFiltersChange({
                price:
                  /** @type {FilterState['price']} */ (e.target.value),
              })
            }
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
          >
            <option value="any">Any price</option>
            <option value="sale">Sale (under KSh 22,000)</option>
            <option value="under100">Under KSh 15,000</option>
            <option value="100-150">KSh 15,000 – 24,999</option>
            <option value="over150">KSh 25,000+</option>
          </select>
        </Field>
      </div>

      <Field label="Sort">
        <select
          value={sortBy}
          onChange={(e) =>
            onSortChange(
              /** @type {SortBy} */ (e.target.value),
            )
          }
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm lg:w-52"
          aria-label="Sort products"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
          <option value="newest">New arrivals</option>
        </select>
      </Field>
    </div>
  );
}

/** @param {{ label: string, children: React.ReactNode }} p */
function Field({ label, children }) {
  return (
    <fieldset className="space-y-1.5 border-0 p-0">
      <legend className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
