import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SALE_MAX_KES } from '../config/market.js';
import { formatPrice } from '../utils/format.js';

const AUTO_MS = 7000;

/**
 * Full-bleed hero rotator modeled after footwear retail homepages (promo carousel).
 */
export function HeroCarousel() {
  const slides = useMemo(
    () => [
      {
        id: '1',
        overline: 'Last chance — sale wall',
        title: 'Styles at unbeatable prices',
        subtitle:
          'Nairobi-fast dispatch & nationwide courier — curated heat in Kenyan Shillings.',
        ctaPrimary: { label: 'Shop the sale wall', to: '/sale' },
        ctaSecondary: [
          { label: `Under ${formatPrice(SALE_MAX_KES)} picks`, to: '/sale' },
          { label: 'New arrivals', to: '/releases' },
        ],
        image:
          'https://images.unsplash.com/photo-1542293787930-d4de152d8f8f?auto=format&fit=crop&w=2400&q=85',
      },
      {
        id: '2',
        overline: 'Spotlight',
        title: "Retro heat that returns to the wall",
        subtitle:
          'Low-profile classics and court DNA — built for the rotation, styled for the street.',
        ctaPrimary: { label: 'Shop Jordan-inspired picks', to: '/shop?brand=Nike' },
        ctaSecondary: [
          { label: 'Signature basketball vibe', to: '/shop?category=men' },
        ],
        image:
          'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=2400&q=85',
      },
      {
        id: '3',
        overline: 'Performance meets lifestyle',
        title: 'Comfy all season',
        subtitle:
          'Cushioned rides and breathable uppers — from morning miles to midnight moves.',
        ctaPrimary: { label: 'Shop running & casual', to: '/shop?category=women' },
        ctaSecondary: [{ label: 'Top brands', to: '/#brands' }],
        image:
          'https://images.unsplash.com/photo-1542293787930-deb6d840c7c6?auto=format&fit=crop&w=2400&q=85',
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = slides[index];

  const go = useCallback(
    /** @param {number} delta */
    (delta) => {
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="relative isolate border-b border-black/80 bg-neutral-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        key={current.id}
        src={current.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55 animate-fade-rise"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />

      <div className="relative mx-auto grid min-h-[min(460px,calc(100svh-8rem))] max-w-[1440px] items-center px-4 py-14 sm:px-6 lg:min-h-[min(540px,calc(100svh-6rem))] lg:grid-cols-2 lg:px-8 lg:py-20">
        <div className="max-w-xl text-white animate-fade-rise">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-red">
            {current.overline}
          </p>
          <h2 className="mt-4 text-pretty font-[800] uppercase leading-none tracking-tight text-white [font-stretch:condensed] sm:text-4xl md:text-5xl lg:text-[3.35rem]">
            {current.title}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-200">
            {current.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={current.ctaPrimary.to}
              className="inline-flex h-11 min-w-[168px] items-center justify-center border-2 border-white bg-white px-6 text-[13px] font-bold uppercase tracking-wide text-black transition hover:bg-neutral-100"
            >
              {current.ctaPrimary.label}
            </Link>
            {current.ctaSecondary?.map((c) => (
              <Link
                key={c.to + c.label}
                to={c.to}
                className="inline-flex h-11 items-center px-5 text-[12px] font-bold uppercase tracking-wider text-white underline-offset-4 transition hover:text-brand-red hover:underline"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-6 px-4 sm:justify-between sm:px-8">
        <div className="flex gap-2" role="tablist" aria-label="Promo slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === index ? 'bg-brand-red ring-2 ring-white/70' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="flex h-9 items-center gap-2 rounded border border-white/30 bg-black/30 px-3 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-black/50"
            aria-pressed={paused}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center rounded border border-white/30 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center rounded border border-white/30 bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
