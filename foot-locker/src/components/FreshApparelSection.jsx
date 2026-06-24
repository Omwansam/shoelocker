import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApparelProductCard } from './ApparelProductCard.jsx';
import { ProductGridSkeleton } from './ProductGridSkeleton.jsx';
import { APPAREL_STYLES } from '../config/productTypes.js';
import { fetchProducts } from '../utils/api.js';
import { FALLBACK_PRODUCT_IMAGE, productDisplayImage } from '../utils/productImages.js';

const APPAREL_SPOTLIGHTS = [
  {
    id: 'hoodies',
    label: 'Hoodies',
    hint: 'Fleece layers',
    href: '/apparel?style=hoodies',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=85',
  },
  {
    id: 'tees',
    label: 'Tees',
    hint: 'Daily rotation',
    href: '/apparel?style=tees',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=85',
  },
  {
    id: 'jackets',
    label: 'Jackets',
    hint: 'Outerwear',
    href: '/apparel?style=jackets',
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=85',
  },
  {
    id: 'shorts',
    label: 'Shorts',
    hint: 'Track & street',
    href: '/apparel?style=shorts',
    image:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=85',
  },
];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1400&q=85';

/** @param {{ label: string, hint: string, image: string, href: string }} props */
function ApparelStyleChip({ label, hint, image, href }) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:border-white/25 hover:bg-white/10"
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
          }}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-[800] uppercase tracking-tight text-white [font-stretch:condensed]">
          {label}
        </span>
        <span className="block text-[11px] text-neutral-400">{hint}</span>
      </span>
      <span
        aria-hidden
        className="ml-auto shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 group-hover:text-white"
      >
        →
      </span>
    </Link>
  );
}

/** @param {any[]} products */
function spotlightImagesFromCatalog(products) {
  return APPAREL_SPOTLIGHTS.map((spot) => {
    const style = APPAREL_STYLES.find((s) => s.id === spot.id);
    if (!style?.match) return spot;
    const match = products.find((p) =>
      style.match.test(`${p.name ?? ''} ${p.description ?? ''}`),
    );
    if (!match?.image) return spot;
    return { ...spot, image: productDisplayImage(match.image) };
  });
}

export function FreshApparelSection() {
  const [products, setProducts] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetchProducts({
      productType: 'apparel',
      perPage: 12,
      signal: ac.signal,
      throwOnError: true,
    })
      .then((list) => setProducts(list.slice(0, 4)))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setProducts([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const spotlights = useMemo(
    () => spotlightImagesFromCatalog(products),
    [products],
  );
  const heroImage = products[0]?.image
    ? productDisplayImage(products[0].image)
    : HERO_IMAGE;
  const hasProducts = products.length > 0;

  return (
    <section
      aria-label="Fresh apparel"
      className="relative overflow-hidden border-y border-neutral-800 bg-neutral-950 text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 10% 20%, rgb(230 0 18 / 0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgb(255 255 255 / 0.06), transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img
                src={heroImage}
                alt=""
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/11]"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-brand-red px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                New
              </span>
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
                New department
              </p>
              <h2 className="mt-2 font-[800] uppercase tracking-tighter [font-stretch:condensed] sm:text-4xl">
                Fresh apparel
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
                Hoodies, tees, jackets, and more — sized S–XXL with the same
                brands and KES pricing you trust from the shoe wall.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {spotlights.map((spot) => (
                  <ApparelStyleChip key={spot.id} {...spot} />
                ))}
              </div>

              <Link
                to="/apparel"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-white text-[13px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-100 sm:w-auto sm:px-8"
              >
                Shop all apparel
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                  On the rack now
                </p>
                <p className="mt-1 text-lg font-[800] uppercase tracking-tight text-white [font-stretch:condensed]">
                  Staff picks
                </p>
              </div>
              <Link
                to="/apparel"
                className="hidden text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline sm:inline-flex"
              >
                View department →
              </Link>
            </div>

            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : hasProducts ? (
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:items-start sm:overflow-visible sm:px-0 lg:gap-5">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="w-[58vw] max-w-[240px] shrink-0 snap-center sm:w-auto sm:max-w-none"
                  >
                    <ApparelProductCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center">
                <p className="text-sm text-neutral-400">
                  New apparel drops land here first — browse the full department
                  for hoodies, tees, jackets, and more.
                </p>
                <Link
                  to="/apparel"
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-[12px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-100"
                >
                  Shop apparel
                </Link>
              </div>
            )}

            <p className="mt-6 text-center sm:hidden">
              <Link
                to="/apparel"
                className="text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
              >
                View full apparel department →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
