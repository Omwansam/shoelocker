import { Link } from 'react-router-dom';
import { FALLBACK_PRODUCT_IMAGE } from '../utils/productImages.js';

const SHOP_CATEGORIES = [
  {
    id: 'men',
    title: "Men's",
    subtitle: 'Basketball · casual · trainers',
    href: '/shop?category=men&type=shoes',
    image:
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'women',
    title: "Women's",
    subtitle: 'Running · lifestyle · slides',
    href: '/shop?category=women&type=shoes',
    image:
      'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    id: 'kids',
    title: "Kids'",
    subtitle: 'Playground · school · sport',
    href: '/shop?category=kids&type=shoes',
    image:
      'https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=900',
  },
  {
    id: 'apparel',
    title: 'Apparel',
    subtitle: 'Hoodies · tees · jackets',
    href: '/apparel',
    image:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=85',
  },
];

const QUICK_LINKS = [
  {
    id: 'new',
    label: 'New arrivals',
    hint: 'Fresh on the wall',
    href: '/shop?new=1&sort=newest',
    variant: 'dark',
  },
  {
    id: 'releases',
    label: 'Drop calendar',
    hint: 'Limited pairs',
    href: '/releases',
    variant: 'outline',
  },
  {
    id: 'sale',
    label: 'Sale',
    hint: 'Best prices in KES',
    href: '/sale',
    variant: 'sale',
  },
];

/** @param {{ title: string, subtitle: string, image: string, href: string }} props */
function CategoryTile({ title, subtitle, image, href }) {
  return (
    <Link
      to={href}
      className="group relative flex aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:aspect-[4/5]"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 transition duration-500 group-hover:from-black/95 group-hover:via-black/45" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 transition group-hover:ring-white/25" />
      <div className="relative mt-auto w-full p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
          Shop
        </p>
        <h3 className="mt-1 font-[800] uppercase leading-none tracking-tight text-white [font-stretch:condensed] sm:text-xl">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-neutral-300 sm:text-xs">
          {subtitle}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-red opacity-0 transition group-hover:opacity-100">
          Explore
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

/** @param {{ label: string, hint: string, href: string, variant: string }} props */
function QuickLinkCard({ label, hint, href, variant }) {
  const styles =
    variant === 'sale'
      ? 'border-brand-red/30 bg-brand-red/5 hover:border-brand-red hover:bg-brand-red hover:text-white'
      : variant === 'dark'
        ? 'border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800'
        : 'border-neutral-200 bg-white hover:border-neutral-950 hover:bg-neutral-50';

  const hintClass =
    variant === 'sale'
      ? 'text-brand-red group-hover:text-white/80'
      : variant === 'dark'
        ? 'text-neutral-400'
        : 'text-neutral-500';

  return (
    <Link
      to={href}
      className={`group flex min-w-[148px] flex-1 flex-col justify-center rounded-2xl border px-4 py-4 transition sm:min-w-0 sm:px-5 sm:py-5 ${styles}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.18em] ${hintClass}`}
      >
        {hint}
      </p>
      <p className="mt-1 font-[800] uppercase tracking-tight [font-stretch:condensed] sm:text-lg">
        {label}
      </p>
      <span className="mt-2 text-[11px] font-semibold uppercase tracking-wide opacity-70 transition group-hover:opacity-100">
        Shop now →
      </span>
    </Link>
  );
}

export function CategoryShortcuts() {
  return (
    <section
      aria-label="Shop by category"
      className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Browse the wall
            </p>
            <h2 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
              Shop by category
            </h2>
            <p className="mt-2 max-w-lg text-sm text-neutral-600">
              Men&apos;s, women&apos;s, kids, and apparel — tap an aisle or jump
              straight to new drops and sale picks.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline sm:inline-flex"
          >
            Full catalog →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {SHOP_CATEGORIES.map((cat) => (
            <CategoryTile key={cat.id} {...cat} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
          {QUICK_LINKS.map((link) => (
            <QuickLinkCard key={link.id} {...link} />
          ))}
        </div>

        <p className="mt-6 text-center sm:hidden">
          <Link
            to="/shop"
            className="text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline"
          >
            View full catalog →
          </Link>
        </p>
      </div>
    </section>
  );
}

export { SHOP_CATEGORIES };
