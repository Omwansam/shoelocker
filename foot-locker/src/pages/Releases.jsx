import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { useProducts } from '../hooks/useProducts.js';

export function Releases() {
  const { products, loading, error, refetch } = useProducts({ delayMs: 360 });

  const drops = useMemo(() => {
    return [...products]
      .filter((p) => p.isNew)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 animate-fade-rise">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
          Drop calendar
        </p>
        <h1 className="mt-2 text-pretty text-3xl font-[800] uppercase tracking-tight text-black [font-stretch:condensed] sm:text-4xl">
          Limited releases
        </h1>
        <p className="mt-2 max-w-xl text-neutral-600">
          Track the hottest drops — limited pairs and seasonal heat land on the
          wall first. Tap a style for sizes and KES pricing.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 font-medium text-brand-red underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : drops.length === 0 ? (
        <EmptyState
          title="No drops scheduled"
          description="Check back soon — new pairs hit the grid every season."
        >
          <Link
            to="/shop"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Browse full catalog
          </Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {drops.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-sm text-neutral-600">
        Want everything fresh?{' '}
        <Link
          to="/shop?new=1&sort=newest"
          className="font-semibold text-brand-red underline-offset-4 hover:underline"
        >
          Shop all new arrivals →
        </Link>
      </p>
    </div>
  );
}
