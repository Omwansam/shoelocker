import { Link } from 'react-router-dom';
import { shopCollectionHref } from '../config/shopCollections.js';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productImages.js';

const PROMO_BANNERS = [
  {
    id: 'basketball',
    overline: 'Signature hoops',
    title: 'Stay playoff ready',
    subtitle: 'High-traction soles and plush collars — cue the tunnel walk.',
    cta: "Shop men's basketball",
    href: shopCollectionHref('basketball'),
    image:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1600',
    accent: '#E31837',
  },
  {
    id: 'running',
    overline: 'Everyday comfort',
    title: 'Comfy all season',
    subtitle: 'Lifestyle runners tuned for errands, lounges, and long days.',
    cta: "Shop women's running",
    href: shopCollectionHref('running'),
    image:
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1600&q=85',
    accent: '#ffffff',
  },
];

/** @param {typeof PROMO_BANNERS[number]} props */
function PromoBanner({ overline, title, subtitle, cta, href, image, accent }) {
  return (
    <Link
      to={href}
      className="group relative flex min-h-[340px] overflow-hidden rounded-2xl bg-neutral-950 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:min-h-[400px] lg:min-h-[440px]"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25 transition duration-500 group-hover:from-black group-hover:via-black/65" />
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-90 transition group-hover:opacity-100"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 transition group-hover:ring-white/25" />

      <div className="relative flex h-full w-full flex-col justify-end p-6 sm:p-8 lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-red">
          {overline}
        </p>
        <h2 className="mt-2 max-w-sm text-pretty font-[800] uppercase leading-[0.95] tracking-tighter text-white [font-stretch:condensed] sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-[15px]">
          {subtitle}
        </p>
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-950 transition group-hover:bg-brand-red group-hover:text-white">
          {cta}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Two editorial promo columns directly below category shortcuts. */
export function DualPromoBanners() {
  return (
    <section
      aria-label="Featured shoe collections"
      className="border-b border-neutral-200 bg-white"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {PROMO_BANNERS.map((banner) => (
            <PromoBanner key={banner.id} {...banner} />
          ))}
        </div>
      </div>
    </section>
  );
}
