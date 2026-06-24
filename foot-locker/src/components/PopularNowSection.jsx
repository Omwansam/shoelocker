import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PopularRailCard } from './PopularProductCard.jsx';
import { fetchPopularNow } from '../utils/api.js';

/** Always show exactly this many product cards on the homepage. */
const DISPLAY_LIMIT = 4;

function RailSkeleton() {
  return (
    <>
      <div className="-mx-4 flex snap-x gap-4 overflow-hidden px-4 lg:hidden">
        {Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
          <div
            key={i}
            className="h-[380px] w-[72vw] max-w-[270px] shrink-0 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        {Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
          <div
            key={i}
            className="h-[380px] animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </>
  );
}

export function PopularNowSection() {
  const [rotationPool, setRotationPool] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const displayed = useMemo(
    () => rotationPool.slice(0, DISPLAY_LIMIT),
    [rotationPool],
  );

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setLoadError(false);
    fetchPopularNow({ signal: ac.signal })
      .then((list) => setRotationPool(list))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setRotationPool([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const tickerNames = displayed.map((p) => p.name).join(' · ');

  const productRail = loading ? (
    <RailSkeleton />
  ) : displayed.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-14 text-center">
      <p className="text-sm text-neutral-400">
        {loadError
          ? 'Could not load the rotation from the store. Make sure the backend is running, then refresh.'
          : 'The rotation fills as orders come in. Check back soon or browse the full catalog.'}
      </p>
      <Link
        to="/shop"
        className="mt-5 inline-flex h-11 items-center rounded-full bg-brand-red px-8 text-[12px] font-bold uppercase tracking-wide text-white"
      >
        Browse shop
      </Link>
    </div>
  ) : (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-neutral-950 to-transparent lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-neutral-950 to-transparent lg:hidden"
        aria-hidden
      />

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] lg:mx-0 lg:hidden lg:px-0">
        {displayed.map((p, index) => (
          <PopularRailCard key={p.id} product={p} index={index} />
        ))}
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2 lg:gap-5">
        {displayed.map((p, index) => (
          <PopularRailCard key={p.id} product={p} index={index} />
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500 lg:hidden">
        Swipe the rail →
      </p>
    </div>
  );

  return (
    <section
      id="popular-now"
      aria-labelledby="popular-now-heading"
      className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-white scroll-mt-[var(--storefront-nav-height)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background:
            'linear-gradient(105deg, rgb(230 0 18 / 0.12) 0%, transparent 42%), linear-gradient(180deg, rgb(12 12 12) 0%, rgb(23 23 23) 100%)',
        }}
      />

      {displayed.length > 0 && !loading ? (
        <div
          className="relative overflow-hidden border-b border-white/10 bg-black/40 py-2.5"
          aria-hidden
        >
          <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap">
            <span className="px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
              {tickerNames} · {tickerNames}
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Weekly rotation
            </p>
            <h2
              id="popular-now-heading"
              className="mt-2 font-[800] uppercase leading-[0.92] tracking-tighter [font-stretch:condensed] sm:text-4xl lg:text-5xl"
            >
              Popular right now
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
              Four pairs on the wall — the top movers from a live rotation
              powered by checkout data. Scroll the rail; each drop gets its own
              moment.
            </p>

            <div className="mt-6 space-y-3 border-l-2 border-brand-red/60 pl-4">
              <p className="text-xs leading-relaxed text-neutral-500">
                No ranks, no gimmicks — just what customers are actually buying
                from Nairobi to the coast.
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600">
                {loading
                  ? '—'
                  : `${DISPLAY_LIMIT} on display${
                      rotationPool.length > DISPLAY_LIMIT
                        ? ` · ${rotationPool.length} in rotation`
                        : ''
                    }`}
              </p>
            </div>

            <Link
              to="/shop"
              className="mt-8 inline-flex h-11 items-center rounded-full border border-white/25 px-7 text-[12px] font-bold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/5"
            >
              Explore shop
            </Link>
          </div>

          <div className="lg:col-span-8">{productRail}</div>
        </div>
      </div>
    </section>
  );
}
