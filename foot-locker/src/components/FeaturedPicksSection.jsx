import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FeaturedProductCard } from './FeaturedProductCard.jsx';
import { ProductGridSkeleton } from './ProductGridSkeleton.jsx';
import { fetchFeaturedPicks } from '../utils/api.js';

export function FeaturedPicksSection() {
  const [products, setProducts] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetchFeaturedPicks({ limit: 4, signal: ac.signal })
      .then((list) => setProducts(list))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setProducts([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  return (
    <section
      aria-labelledby="featured-picks-heading"
      className="relative overflow-hidden border-y border-neutral-200 bg-neutral-100"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 0% 0%, rgb(230 0 18 / 0.08), transparent 55%), radial-gradient(ellipse 45% 40% at 100% 100%, rgb(0 0 0 / 0.05), transparent 50%), linear-gradient(180deg, rgb(250 250 250) 0%, rgb(245 245 245) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Homepage wall
            </p>
            <h2
              id="featured-picks-heading"
              className="mt-2 font-[800] uppercase leading-[0.95] tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-4xl lg:text-[2.75rem]"
            >
              Featured picks
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
              New heat on the homepage wall — fresh drops and limited pairs
              hand-placed for your next cop.
            </p>
          </div>

          <Link
            to="/shop?new=1"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-full border-2 border-neutral-950 px-8 text-[12px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
          >
            View all new
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-sm text-neutral-600">
              New arrivals land here first. Check the shop for the latest drops.
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-red px-8 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-[var(--shadow-card)] sm:p-6 lg:p-8">
            <div
              className="pointer-events-none absolute inset-x-6 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-neutral-200 to-transparent lg:block"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-6 top-6 hidden text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-300 lg:block"
              aria-hidden
            >
              Wall display
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {products.map((p, index) => (
                <FeaturedProductCard
                  key={p.id}
                  product={p}
                  slot={index + 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
