import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar.jsx';
import { brandShopHref } from '../utils/brandShop.js';
import { useStorefrontBrands } from '../hooks/useStorefrontBrands.js';
import {
  FALLBACK_PRODUCT_IMAGE,
  productDisplayImage,
} from '../utils/productImages.js';

/** @param {{ brand: { label: string, tagline?: string, image: string, catalogBrand?: string, accent?: string, slug?: string, id?: string }, size?: 'hero'|'side' }} props */
function SpotlightCard({ brand, size = 'side' }) {
  const href = brandShopHref(brand.catalogBrand, {
    displayName: brand.label,
  });
  const image = productDisplayImage(brand.image);
  const accent = brand.accent || '#e60012';
  const isHero = size === 'hero';

  return (
    <Link
      to={href}
      className={`group relative flex overflow-hidden rounded-3xl bg-neutral-900 ${
        isHero ? 'min-h-[420px] lg:min-h-full' : 'min-h-[200px]'
      }`}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-50"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isHero
            ? `linear-gradient(125deg, ${accent}dd 0%, rgb(0 0 0 / 0.55) 48%, rgb(0 0 0 / 0.92) 100%)`
            : `linear-gradient(160deg, ${accent}cc 0%, rgb(0 0 0 / 0.75) 60%, rgb(0 0 0 / 0.95) 100%)`,
        }}
      />
      <div
        className="absolute left-0 top-0 h-1 w-full opacity-90"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div
        className={`relative flex h-full w-full flex-col justify-between ${
          isHero ? 'p-8 sm:p-10' : 'p-6'
        }`}
      >
        <span className="w-fit rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
          Spotlight
        </span>
        <div>
          <h2
            className={`font-[800] uppercase leading-[0.92] tracking-tighter text-white [font-stretch:condensed] ${
              isHero ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {brand.label}
          </h2>
          {brand.tagline ? (
            <p
              className={`mt-3 text-white/80 ${
                isHero ? 'max-w-md text-base sm:text-lg' : 'max-w-[220px] text-sm'
              }`}
            >
              {brand.tagline}
            </p>
          ) : null}
          <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 transition group-hover:text-white">
            Shop {brand.label}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** @param {{ brand: { label: string, tagline?: string, image: string, catalogBrand?: string, accent?: string, slug?: string, id?: string }, href: string }} props */
function DirectoryCard({ brand, href }) {
  const image = productDisplayImage(brand.image);
  const accent = brand.accent || '#e60012';

  return (
    <Link
      to={href}
      className="brands-directory-card group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-neutral-950 p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${accent}55 0%, transparent 55%)`,
          }}
          aria-hidden
        />
        <img
          src={image}
          alt=""
          className="relative z-[1] max-h-[72%] w-full object-contain drop-shadow-[0_12px_24px_rgb(0_0_0_/_0.35)] transition duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
      </div>
      <div className="flex flex-1 flex-col justify-between border-t border-neutral-100 p-5">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            Footwear
          </p>
          <h3 className="mt-1 font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed] sm:text-xl">
            {brand.label}
          </h3>
          {brand.tagline ? (
            <p className="mt-2 line-clamp-2 text-sm leading-snug text-neutral-600">
              {brand.tagline}
            </p>
          ) : null}
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand-red">
          Shop catalog
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

export function Brands() {
  const { featured, allBrands, loading, error, refetch } = useStorefrontBrands();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBrands;
    return allBrands.filter((b) => {
      const blob = `${b.label} ${b.tagline || ''} ${b.catalogBrand || ''}`;
      return blob.toLowerCase().includes(q);
    });
  }, [allBrands, query]);

  const marqueeNames = useMemo(
    () => allBrands.map((b) => b.label).join(' · '),
    [allBrands],
  );

  const spotlight = featured.slice(0, 3);
  const heroBrand = spotlight[0];
  const sideBrands = spotlight.slice(1, 3);

  return (
    <div className="brands-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(rgb(230 0 18 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(230 0 18 / 0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-red/20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-[1440px] px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
          <nav className="text-sm text-neutral-400">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span className="text-white">Brands</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-brand-red">
                Official partners
              </p>
              <h1 className="mt-3 max-w-3xl text-pretty font-[800] uppercase leading-[0.9] tracking-tighter [font-stretch:condensed] sm:text-5xl lg:text-6xl">
                The brand directory
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                Every name on this wall links straight into the live shoe catalog —
                filtered, priced in KES, and ready to ship across Kenya.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <label htmlFor="brand-directory-search" className="sr-only">
                  Search brands
                </label>
                <SearchBar
                  id="brand-directory-search"
                  value={query}
                  onChange={setQuery}
                  placeholder="Nike, Jordan, adidas, ASICS…"
                />
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  {loading
                    ? 'Loading roster…'
                    : `${allBrands.length} brands · live catalog`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!loading && marqueeNames ? (
          <div
            className="relative overflow-hidden border-y border-white/10 bg-black/40 py-3"
            aria-hidden
          >
            <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap">
              <span className="px-6 text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">
                {marqueeNames} · {marqueeNames}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Spotlight */}
      {spotlight.length > 0 ? (
        <section className="border-b border-neutral-200 bg-neutral-100/80">
          <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
                  Featured spotlight
                </p>
                <h2 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
                  Headline names
                </h2>
              </div>
              <Link
                to="/shop?type=shoes"
                className="text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
              >
                Shop all footwear →
              </Link>
            </div>

            {loading ? (
              <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
                <div className="min-h-[420px] animate-pulse rounded-3xl bg-neutral-200 lg:col-span-7 lg:row-span-2" />
                <div className="min-h-[200px] animate-pulse rounded-3xl bg-neutral-200 lg:col-span-5" />
                <div className="min-h-[200px] animate-pulse rounded-3xl bg-neutral-200 lg:col-span-5" />
              </div>
            ) : (
              <div className="mt-10 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
                {heroBrand ? (
                  <div className="lg:col-span-7 lg:row-span-2">
                    <SpotlightCard brand={heroBrand} size="hero" />
                  </div>
                ) : null}
                {sideBrands.map((brand) => (
                  <div key={brand.slug || brand.id} className="lg:col-span-5">
                    <SpotlightCard brand={brand} size="side" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Full directory */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
            Full roster
          </p>
          <h2 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
            {query ? `Results for “${query.trim()}”` : 'Every brand we carry'}
          </h2>
          <p className="mt-3 text-neutral-600">
            Tap a card to open that brand&apos;s shoe wall — pulled from the same
            product API as search and checkout.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
            >
              Retry loading brands
            </button>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <li
                    key={i}
                    className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-100"
                  />
                ))
              : filtered.length === 0
                ? (
                    <li className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
                      No brands match &ldquo;{query.trim()}&rdquo;. Try another
                      name or{' '}
                      <button
                        type="button"
                        className="font-semibold text-brand-red underline"
                        onClick={() => setQuery('')}
                      >
                        clear search
                      </button>
                      .
                    </li>
                  )
                : filtered.map((brand) => (
                    <li key={brand.slug || brand.id || brand.label}>
                      <DirectoryCard
                        brand={brand}
                        href={brandShopHref(brand.catalogBrand, {
                          displayName: brand.label,
                        })}
                      />
                    </li>
                  ))}
          </ul>
        )}
      </section>

      {/* CTA band */}
      <section className="border-t border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Not sure where to start?
            </p>
            <p className="mt-2 font-[800] uppercase tracking-tight [font-stretch:condensed] sm:text-2xl">
              Browse the full shoe wall
            </p>
            <p className="mt-2 max-w-md text-sm text-neutral-400">
              Filter by size, category, and price in Kenyan Shillings — no mock
              inventory, ever.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/releases"
              className="rounded-full border border-white/20 px-6 py-3 text-[12px] font-bold uppercase tracking-wide transition hover:border-white hover:bg-white hover:text-neutral-950"
            >
              New releases
            </Link>
            <Link
              to="/shop?type=shoes"
              className="rounded-full bg-brand-red px-6 py-3 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
            >
              Shop all shoes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
