import { Link } from 'react-router-dom';
import { useStorefrontBrands } from '../hooks/useStorefrontBrands.js';
import {
  megaColumns,
  megaNewTrending,
  megaShopAllCta,
} from '../data/megaNavData.js';

const linkCls =
  'group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950';

/** @typedef {{ title: string, href: string }[]} MegaLinks */

/** @typedef {{ heading: string, links: MegaLinks }} MegaColumn */

/**
 * @typedef {'men'|'women'|'kids'|'apparel'|'brands'|'newtrend'|null} MegaKey
 */

/**
 * @param {{ active: MegaKey }} props
 */
export function MegaPanel({ active }) {
  if (!active) return null;

  if (active === 'brands') {
    return <BrandsMegaPanel />;
  }

  if (active === 'apparel') {
    const cols = megaColumns.apparel;
    return (
      <div className="nav-mega-panel animate-fade-rise border-t border-neutral-200 bg-white shadow-[0_24px_48px_-12px_rgb(0_0_0_/_0.12)]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {cols.map((c) => (
            <Column key={c.heading} heading={c.heading} links={c.links} />
          ))}
          <MegaPromoCard
            eyebrow="Live catalog"
            title="All apparel"
            body="Hoodies, tees, jackets, and more — filtered from the product API."
            href="/apparel"
            cta="Shop apparel"
            compact
          />
        </div>
      </div>
    );
  }

  if (active === 'newtrend') {
    return (
      <div className="nav-mega-panel animate-fade-rise border-t border-neutral-200 bg-white shadow-[0_24px_48px_-12px_rgb(0_0_0_/_0.12)]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <Column heading="Trending now" links={megaNewTrending} />
          </div>
          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <MegaPromoCard
                eyebrow="Live rotation"
                title="Popular right now"
                body="Top four movers from order data on the homepage wall."
                href="/#popular-now"
                cta="See the rotation"
                dark
              />
              <MegaPromoCard
                eyebrow="Drop calendar"
                title="Limited releases"
                body="New pairs flagged in the catalog — same feed as the releases page."
                href="/releases"
                cta="View releases"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /** @type {MegaColumn[]} */
  const cols =
    megaColumns[/** @type {'men' | 'women' | 'kids'} */ (active)] ?? [];
  const cta = megaShopAllCta[/** @type {'men'|'women'|'kids'} */ (active)];

  return (
    <div className="nav-mega-panel animate-fade-rise border-t border-neutral-200 bg-white shadow-[0_24px_48px_-12px_rgb(0_0_0_/_0.12)]">
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {cols.map((c) => (
            <Column key={c.heading} heading={c.heading} links={c.links} />
          ))}
          {cta ? (
            <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-1">
              <MegaPromoCard
                eyebrow="Full catalog"
                title={cta.label}
                body={cta.blurb}
                href={cta.href}
                cta="Shop now"
                compact
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BrandsMegaPanel() {
  const { navBrands, loading, error, refetch } = useStorefrontBrands();

  return (
    <div
      role="presentation"
      className="nav-mega-panel animate-fade-rise border-t border-neutral-200 bg-white shadow-[0_24px_48px_-12px_rgb(0_0_0_/_0.12)]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="nav-mega-heading">Shop by brand</p>
            {error ? (
              <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {loading
                  ? Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-xl bg-neutral-100"
                        aria-hidden
                      />
                    ))
                  : navBrands.map((b) => (
                      <Link
                        key={b.title}
                        to={b.href}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-[12px] font-bold uppercase tracking-wide text-neutral-800 transition hover:border-brand-red/40 hover:bg-white hover:shadow-sm"
                      >
                        {b.title}
                      </Link>
                    ))}
              </div>
            )}
            <Link
              to="/brands"
              className="mt-5 inline-flex text-[12px] font-bold uppercase tracking-wide text-brand-red hover:underline"
            >
              Open brand directory →
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MegaPromoCard
              eyebrow="Brand directory"
              title="Official brand wall"
              body="Featured names, search, and a full roster — loaded from the storefront API."
              href="/brands"
              cta="Open brand directory"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** @param {{ heading: string, links: MegaLinks }} props */
function Column({ heading, links }) {
  return (
    <div className="min-w-0">
      <p className="nav-mega-heading">{heading}</p>
      <ul className="mt-3 space-y-0.5">
        {links.map((l) => (
          <li key={l.title}>
            <Link to={l.href} className={linkCls}>
              <span>{l.title}</span>
              <span
                aria-hidden
                className="shrink-0 text-neutral-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-brand-red"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @param {{ eyebrow: string, title: string, body: string, href: string, cta: string, dark?: boolean, compact?: boolean }} props */
function MegaPromoCard({ eyebrow, title, body, href, cta, dark, compact }) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border p-5 ${
        dark
          ? 'border-neutral-800 bg-neutral-950 text-white'
          : 'border-neutral-200 bg-gradient-to-br from-neutral-50 to-white'
      } ${compact ? 'p-4' : ''}`}
    >
      <div>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
            dark ? 'text-brand-red' : 'text-neutral-400'
          }`}
        >
          {eyebrow}
        </p>
        <p
          className={`mt-2 font-[800] uppercase leading-tight tracking-tight [font-stretch:condensed] ${
            dark ? 'text-white' : 'text-neutral-950'
          } ${compact ? 'text-lg' : 'text-xl'}`}
        >
          {title}
        </p>
        <p
          className={`mt-2 text-sm leading-snug ${
            dark ? 'text-neutral-400' : 'text-neutral-600'
          }`}
        >
          {body}
        </p>
      </div>
      <Link
        to={href}
        className={`mt-4 inline-flex text-[11px] font-bold uppercase tracking-wide ${
          dark ? 'text-white hover:text-brand-red' : 'text-brand-red hover:underline'
        }`}
      >
        {cta} →
      </Link>
    </div>
  );
}
