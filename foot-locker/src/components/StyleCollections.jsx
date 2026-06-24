import { Link } from 'react-router-dom';
import { shopCollectionHref } from '../config/shopCollections.js';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productImages.js';

const STYLE_COLLECTIONS = [
  {
    id: 'court',
    overline: 'On the hardwood',
    title: 'Court heat',
    subtitle: 'High-traction soles, ankle support, and tunnel-walk energy.',
    href: shopCollectionHref('court'),
    image:
      'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1400',
  },
  {
    id: 'city',
    overline: 'Everyday motion',
    title: 'City runners',
    subtitle: 'Cushioned rides for morning miles, errands, and long Nairobi days.',
    href: shopCollectionHref('city'),
    image:
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'retro',
    overline: 'Archive favorites',
    title: 'Retro classics',
    subtitle: 'Low-profile legends and colorways that never leave rotation.',
    href: shopCollectionHref('retro'),
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=85',
  },
  {
    id: 'sale',
    overline: 'Limited window',
    title: 'Sale steals',
    subtitle: 'Unbeatable KES prices — move fast before sizes disappear.',
    href: '/sale',
    image:
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1400',
    accent: true,
  },
];

/** @param {{ overline: string, title: string, subtitle: string, image: string, href: string, accent?: boolean }} props */
function CollectionCard({ overline, title, subtitle, image, href, accent = false }) {
  return (
    <Link
      to={href}
      className={`group relative flex min-h-[220px] overflow-hidden rounded-2xl bg-neutral-900 sm:min-h-[260px] ${
        accent ? 'ring-1 ring-brand-red/40' : ''
      }`}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <div
        className={`absolute inset-0 ${
          accent
            ? 'bg-gradient-to-t from-brand-red/90 via-black/70 to-black/30'
            : 'bg-gradient-to-t from-black/90 via-black/50 to-black/20'
        }`}
      />
      <div className="relative flex h-full w-full flex-col justify-end p-6 sm:p-8">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
            accent ? 'text-white/80' : 'text-brand-red'
          }`}
        >
          {overline}
        </p>
        <h3 className="mt-2 font-[800] uppercase leading-tight tracking-tighter text-white [font-stretch:condensed] sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-300">
          {subtitle}
        </p>
        <span className="mt-4 inline-flex w-fit items-center gap-1 border-b border-white/40 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-white transition group-hover:border-white">
          Shop collection
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Editorial style collections — distinct from demographic category shortcuts. */
export function StyleCollections() {
  return (
    <section
      aria-label="Shop by style"
      className="border-y border-neutral-200 bg-white"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Curated edits
            </p>
            <h2 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
              Shop by style
            </h2>
            <p className="mt-2 max-w-xl text-neutral-600">
              Not sure where to start? Browse by vibe — court, city miles, retro
              heat, or what&apos;s on sale right now.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline"
          >
            Explore all styles →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STYLE_COLLECTIONS.map((col) => (
            <CollectionCard key={col.id} {...col} />
          ))}
        </div>
      </div>
    </section>
  );
}
