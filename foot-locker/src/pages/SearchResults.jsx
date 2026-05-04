import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { useProducts } from '../hooks/useProducts.js';

export function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const { products, loading, error } = useProducts();

  const filtered = useMemo(() => {
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category ?? ''} ${p.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, q]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Search</h1>
      <form
        className="mt-6 flex max-w-xl gap-2"
        action="/search"
        method="get"
        role="search"
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={params.get('q') ?? ''}
          placeholder="Brand, style, silhouette…"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
        >
          Search
        </button>
      </form>

      {error ? (
        <p className="mt-8 text-sm text-red-700">{String(error.message ?? error)}</p>
      ) : null}

      {loading ? (
        <div className="mt-10">
          <ProductGridSkeleton count={8} />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-neutral-600">
            {q
              ? `Found ${filtered.length} result${filtered.length === 1 ? '' : 's'} for “${params.get('q')?.trim() ?? ''}”.`
              : 'Enter a query or browse categories from the nav.'}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!loading && q && filtered.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
              <p className="text-neutral-700">No matches — try a different keyword.</p>
              <Link
                to="/shop"
                className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline"
              >
                Shop all
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
