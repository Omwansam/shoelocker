import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SALE_MAX_KES } from '../config/market.js';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productImages.js';
import { formatPrice } from '../utils/format.js';

const AUTO_MS = 6500;
const SWIPE_THRESHOLD = 48;

const SLIDES = [
  {
    id: 'sale',
    overline: 'Limited time',
    title: 'Sale wall is live',
    highlight: 'Up to 40% off',
    subtitle:
      'Heat under ' +
      formatPrice(SALE_MAX_KES) +
      ' — Nairobi dispatch & nationwide courier in KES.',
    ctaPrimary: { label: 'Shop the sale', to: '/sale' },
    ctaSecondary: [
      { label: 'Under ' + formatPrice(SALE_MAX_KES), to: '/sale' },
      { label: 'New arrivals', to: '/shop?new=1&sort=newest' },
    ],
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=85',
    imageAlt: 'Red Nike sneaker on bold studio backdrop',
    accent: '#e60012',
  },
  {
    id: 'jordan',
    overline: 'Court heritage',
    title: 'Retro heat returns',
    highlight: 'Signature silhouettes',
    subtitle:
      'Low-profile classics and championship DNA — built for rotation, styled for the street.',
    ctaPrimary: { label: 'Shop basketball', to: '/shop?category=men' },
    ctaSecondary: [{ label: 'Jordan picks', to: '/shop?brand=Nike' }],
    image:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=2400',
    imageAlt: 'White high-top basketball sneaker on display',
    accent: '#f97316',
  },
  {
    id: 'lifestyle',
    overline: 'Everyday motion',
    title: 'Run the city',
    highlight: 'All-day comfort',
    subtitle:
      'Cushioned rides and breathable uppers — morning miles to midnight moves across Kenya.',
    ctaPrimary: { label: 'Shop running', to: '/shop?category=women' },
    ctaSecondary: [{ label: 'Lifestyle picks', to: '/shop' }],
    image:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=2400&q=85',
    imageAlt: 'Green and white lifestyle sneaker product shot',
    accent: '#22c55e',
  },
  {
    id: 'drops',
    overline: 'Fresh on the wall',
    title: 'New season drops',
    highlight: 'Just landed',
    subtitle:
      'First look at the pairs everyone will be asking about — cop before sizes disappear.',
    ctaPrimary: { label: 'See new arrivals', to: '/shop?new=1&sort=newest' },
    ctaSecondary: [{ label: 'Full catalog', to: '/shop' }],
    image:
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=2400',
    imageAlt: 'Colorful sneaker collection on shelf',
    accent: '#a855f7',
  },
];

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** @param {{ src: string, alt?: string, className?: string, eager?: boolean }} props */
function CarouselImage({ src, alt = '', className = '', eager = false }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onError={() => {
        if (imgSrc !== FALLBACK_PRODUCT_IMAGE) setImgSrc(FALLBACK_PRODUCT_IMAGE);
      }}
    />
  );
}

/**
 * Full-bleed hero carousel — premium footwear retail homepage pattern.
 */
export function HeroCarousel() {
  const slides = useMemo(() => SLIDES, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(/** @type {number | null} */ (null));
  const sectionRef = useRef(/** @type {HTMLElement | null} */ (null));

  const current = slides[index];

  const goTo = useCallback(
    /** @param {number} next */
    (next) => {
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length],
  );

  const go = useCallback(
    /** @param {number} delta */
    (delta) => goTo(index + delta),
    [goTo, index],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => goTo(index + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, index, goTo]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [go]);

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null) return;
    const delta = end - start;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) go(delta > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="hero-carousel relative isolate flex min-h-0 flex-col overflow-hidden bg-neutral-950 outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background slides */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-slide-bg absolute inset-0 transition-opacity duration-[900ms] ease-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <CarouselImage
              src={slide.image}
              alt=""
              eager={i === 0}
              className={`hero-slide-img h-full w-full object-cover object-center ${
                i === index ? 'hero-ken-burns' : ''
              }`}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(105deg, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.65) 40%, rgb(0 0 0 / 0.25) 70%, transparent 100%)`,
              }}
            />
            <div
              className="absolute inset-0 opacity-40 mix-blend-soft-light"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 85% 50%, ${slide.accent}55, transparent 70%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-0 flex-1 max-w-[1440px] flex-col justify-end px-4 pb-28 pt-10 sm:px-6 lg:justify-center lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div key={current.id} className="hero-content-in max-w-xl text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md"
                style={{ boxShadow: `0 0 24px ${current.accent}33` }}
              >
                {current.overline}
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-white/50">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            <p
              className="mt-5 text-sm font-bold uppercase tracking-[0.18em] sm:text-base"
              style={{ color: current.accent }}
            >
              {current.highlight}
            </p>

            <h2 className="mt-3 text-pretty font-[800] uppercase leading-[0.95] tracking-tighter text-white [font-stretch:condensed] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              {current.title}
            </h2>

            <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
              {current.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={current.ctaPrimary.to}
                className="group inline-flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full bg-white px-7 text-[13px] font-bold uppercase tracking-wide text-neutral-950 shadow-lg shadow-black/30 transition hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98]"
              >
                {current.ctaPrimary.label}
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
              {current.ctaSecondary?.map((c) => (
                <Link
                  key={c.to + c.label}
                  to={c.to}
                  className="inline-flex h-12 items-center rounded-full border border-white/25 bg-white/5 px-5 text-[12px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured product image — all breakpoints */}
          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md" aria-hidden>
            <div
              key={`visual-${current.id}`}
              className="hero-content-in relative aspect-[4/5] max-h-[min(42vh,360px)] overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/50 sm:max-h-[min(48vh,420px)] lg:max-h-[min(58vh,540px)] lg:rounded-3xl"
            >
              <CarouselImage
                src={current.image}
                alt={current.imageAlt}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div
                className="absolute bottom-0 left-0 right-0 p-4 sm:p-6"
                style={{ borderTop: `3px solid ${current.accent}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                  Featured drop
                </p>
                <p className="mt-1 font-[800] uppercase tracking-tight text-white [font-stretch:condensed]">
                  {current.highlight}
                </p>
              </div>
            </div>
            <div
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl"
              style={{ backgroundColor: `${current.accent}66` }}
            />
            <div
              className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full blur-3xl"
              style={{ backgroundColor: `${current.accent}44` }}
            />
          </div>
        </div>
      </div>

      {/* Side arrows — desktop */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="hero-nav-btn absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="hero-nav-btn absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 lg:flex"
      >
        <ChevronRightIcon />
      </button>

      {/* Bottom controls — thumbnails left, play/arrows right */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-gradient-to-t from-black/90 to-black/40 px-4 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div
            className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 sm:gap-2"
            role="tablist"
            aria-label="Promo slides"
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                onClick={() => goTo(i)}
                className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 transition ${
                  i === index
                    ? 'border-white opacity-100'
                    : 'border-white/30 opacity-60 hover:border-white/55 hover:opacity-90'
                }`}
                style={
                  i === index
                    ? { boxShadow: `0 0 0 2px ${s.accent}88, 0 0 10px ${s.accent}44` }
                    : undefined
                }
              >
                <CarouselImage
                  src={s.image}
                  alt={s.imageAlt}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/10"
              aria-pressed={paused}
            >
              {paused ? (
                <>
                  <span aria-hidden>▶</span> Play
                </>
              ) : (
                <>
                  <span aria-hidden>⏸</span> Pause
                </>
              )}
            </button>
            <div className="flex gap-1.5 lg:hidden">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => go(-1)}
                className="hero-nav-btn flex h-8 w-8 items-center justify-center"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => go(1)}
                className="hero-nav-btn flex h-8 w-8 items-center justify-center"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
