import { Link } from 'react-router-dom';
import { brandShopHref } from '../utils/brandShop.js';
import { useStorefrontBrands } from '../hooks/useStorefrontBrands.js';
import {
  FALLBACK_PRODUCT_IMAGE,
  productDisplayImage,
} from '../utils/productImages.js';

/** @param {{ label: string, tagline: string, image: string, to: string, accent: string }} props */
function FeaturedBrandCard({ label, tagline, image, to, accent }) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-[200px] overflow-hidden rounded-2xl bg-neutral-900 sm:min-h-[240px]"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-55"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <div
        className="absolute inset-0 opacity-80 transition group-hover:opacity-90"
        style={{
          background: `linear-gradient(145deg, ${accent}cc 0%, rgb(0 0 0 / 0.85) 55%, rgb(0 0 0 / 0.95) 100%)`,
        }}
      />
      <div className="relative flex h-full w-full flex-col justify-between p-6 sm:p-7">
        <span className="w-fit rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
          Featured
        </span>
        <div>
          <h3 className="font-[800] uppercase leading-none tracking-tighter text-white [font-stretch:condensed] sm:text-3xl">
            {label}
          </h3>
          <p className="mt-2 max-w-[220px] text-sm leading-snug text-white/75">
            {tagline}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white opacity-80 transition group-hover:opacity-100">
            Shop {label}
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** GOAT-style shoe icon — admin image or catalog fallback. */
/** @param {{ id: string, label: string, image: string, href: string }} props */
function BrandShoeIcon({ label, image, href }) {
  return (
    <Link
      to={href}
      className="brand-shoe-wall__cell group"
      aria-label={`Shop all ${label} shoes`}
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
        }}
      />
      <span className="brand-shoe-wall__label">{label}</span>
    </Link>
  );
}

/** @param {{ loading: boolean, items: { id: string, label: string, image: string, href: string }[] }} props */
function BrandShoeWall({ loading, items }) {
  const showCrop = items.length > 33;

  return (
    <div
      className={`brand-shoe-wall ${showCrop ? 'brand-shoe-wall--cropped' : ''}`}
      role="list"
      aria-label="Shop by brand shoe icons"
    >
      {loading
        ? Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="brand-shoe-wall__skeleton" role="presentation" />
          ))
        : items.map((item) => (
            <BrandShoeIcon key={item.id} {...item} />
          ))}
    </div>
  );
}

export function BrandStrip() {
  const { featured, wall, loading, error, refetch } = useStorefrontBrands();

  const featuredCards = featured.slice(0, 3).map((brand) => ({
    label: brand.label,
    tagline: brand.tagline || '',
    image: productDisplayImage(brand.image),
    accent: brand.accent || '#e60012',
    to: brandShopHref(brand.catalogBrand, { displayName: brand.label }),
  }));

  const wallItems = wall.map((brand) => ({
    id: brand.id || brand.slug,
    label: brand.label,
    image: productDisplayImage(brand.image),
    href: brandShopHref(brand.catalogBrand, { displayName: brand.label }),
  }));

  return (
    <section
      id="brands"
      aria-labelledby="brand-strip-heading"
      className="border-y border-neutral-200 bg-neutral-50"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              Official heat
            </p>
            <h2
              id="brand-strip-heading"
              className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl"
            >
              Shop our top brands
            </h2>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              Global names, Nairobi-fast fulfilment — every price in Kenyan
              Shillings. Brand names belong to their owners.
            </p>
          </div>
          <Link
            to="/brands"
            className="hidden text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline sm:inline-flex"
          >
            All brands →
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-6 text-sm text-neutral-600">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
            >
              Retry loading brands
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {loading && featuredCards.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h-[200px] animate-pulse rounded-2xl bg-neutral-200 sm:min-h-[240px]"
                    aria-hidden
                  />
                ))
              : featuredCards.map((brand) => (
                  <FeaturedBrandCard key={brand.label} {...brand} />
                ))}
          </div>
        )}
      </div>

      <div className="mt-2 border-y border-neutral-200 bg-[#fafafa]">
        <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500">
            Tap a pair — shop that brand
          </p>
        </div>
        <BrandShoeWall loading={loading} items={wallItems} />
      </div>

      <p className="bg-neutral-50 py-6 text-center sm:hidden">
        <Link
          to="/brands"
          className="text-[13px] font-bold uppercase tracking-wide text-brand-red underline-offset-4 hover:underline"
        >
          Browse all brands →
        </Link>
      </p>
    </section>
  );
}
