import { Link } from 'react-router-dom';
import {
  megaBrands,
  megaColumns,
  megaNewTrending,
} from '../data/megaNavData.js';

const linkCls =
  'block rounded px-1 py-0.5 text-[13px] text-neutral-800 transition hover:bg-neutral-100 hover:text-black';

/** @typedef {{ title: string, href: string }[]} MegaLinks */

/** @typedef {{ heading: string, links: MegaLinks }} MegaColumn */

/**
 * @typedef {'men'|'women'|'kids'|'brands'|'newtrend'|null} MegaKey
 */

/**
 * @param {{ active: MegaKey }} props
 */
export function MegaPanel({ active }) {
  if (!active) return null;

  if (active === 'brands') {
    return (
      <div
        role="presentation"
        className="animate-fade-rise border-t border-neutral-200 bg-white shadow-xl"
      >
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <Column
            heading="Brands"
            links={megaBrands}
          />
          <div className="hidden lg:block lg:col-span-2" />
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed]">
              Releases
            </p>
            <p className="mt-2 text-neutral-600">
              Track the hottest drops — new pairs hit the grid every season.
            </p>
            <Link
              to="/releases"
              className="mt-3 inline-block text-[13px] font-bold text-brand-red underline underline-offset-4"
            >
              View new &amp; trending
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (active === 'newtrend') {
    return (
      <div className="animate-fade-rise border-t border-neutral-200 bg-white shadow-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap gap-8 px-6 py-8">
          <Column heading="Popular now" links={megaNewTrending} />
          <Column
            heading="Shops"
            links={[
              { title: 'Sale', href: '/sale' },
              { title: 'Signature basketball style', href: '/shop?category=men' },
              { title: 'Kids essentials', href: '/shop?category=kids' },
            ]}
          />
        </div>
      </div>
    );
  }

  /** @type {MegaColumn[]} */
  const cols =
    megaColumns[/** @type {'men' | 'women' | 'kids'} */ (active)] ?? [];

  return (
    <div className="animate-fade-rise border-t border-neutral-200 bg-white shadow-xl">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {cols.map((c) => (
          <Column key={c.heading} heading={c.heading} links={c.links} />
        ))}
      </div>
    </div>
  );
}

/** @param {{ heading: string, links: MegaLinks }} props */
function Column({ heading, links }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
        {heading}
      </p>
      <ul className="mt-3 space-y-1.5">
        {links.map((l) => (
          <li key={l.title}>
            <Link to={l.href} className={linkCls}>
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
