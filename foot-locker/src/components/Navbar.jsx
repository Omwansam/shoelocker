import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { REWARDS_PROGRAM } from '../config/brand.js';
import { FREE_SHIPPING_MIN_KES } from '../config/market.js';
import { LogoMark } from './LogoMark.jsx';
import { MegaPanel } from './MegaNav.jsx';

/** Primary site chrome — mega nav, utility strip, quick links */

/** @typedef {'men'|'women'|'kids'|'brands'|'newtrend'|null} MegaActive */

export function Navbar() {
  const { itemCount, openDrawer, drawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState(/** @type {MegaActive} */ (null));
  const closeTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const location = useLocation();
  const navigate = useNavigate();

  const closeMega = useCallback(() => setMega(null), [setMega]);

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(null), 160);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  /** @param {MegaActive} key */
  function openMega(key) {
    cancelClose();
    setMega(key);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dismiss flyout on route change
    closeMega();
  }, [closeMega, location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') closeMega();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeMega]);

  return (
    <header className="sticky top-0 z-[60] shadow-sm">
      <div className="bg-neutral-950 text-[11px] font-medium text-neutral-300">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 py-2 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="uppercase tracking-wider text-neutral-300">
            <span className="font-semibold text-brand-red">Free delivery</span>
            {' '}
            on orders over KSh {FREE_SHIPPING_MIN_KES.toLocaleString('en-KE')} —
            Kenya nationwide
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 sm:items-center">
            <Link to="/stores" className="transition hover:text-white">
              Find a store
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link to="/sign-in" className="transition hover:text-white">
              Sign in
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link to="/wishlist" className="transition hover:text-white">
              Wishlist
              {wishlistCount > 0 ? (
                <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link to="/account/orders" className="transition hover:text-white">
              My orders
            </Link>
            <span className="hidden text-neutral-600 sm:inline" aria-hidden>
              |
            </span>
            <Link to="/admin/login" className="transition hover:text-white">
              Admin
            </Link>
            <span className="text-neutral-600" aria-hidden>
              |
            </span>
            <Link
              to="/rewards"
              className="font-semibold text-white transition hover:text-brand-red"
            >
              Join {REWARDS_PROGRAM}
            </Link>
          </div>
        </div>
      </div>

      {/* Primary */}
      <div
        className="relative bg-white"
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <LogoMark variant="nav" />

          <nav
            className="hidden items-stretch gap-0 lg:flex"
            aria-label="Shop categories"
            onMouseEnter={cancelClose}
          >
            {(
              /** @type {{ key: MegaActive, label: string }[]} */ ([
                { key: 'men', label: "Men's" },
                { key: 'women', label: "Women's" },
                { key: 'kids', label: "Kids'" },
              ])
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`border-b-[3px] px-4 py-6 text-[13px] font-bold uppercase tracking-tight transition hover:bg-neutral-50 [font-stretch:condensed] ${
                  mega === item.key
                    ? 'border-brand-red text-neutral-950'
                    : 'border-transparent text-neutral-800'
                }`}
                aria-expanded={mega === item.key}
                aria-controls="mega-flyout"
                onFocus={() => openMega(item.key)}
                onMouseEnter={() => openMega(item.key)}
              >
                {item.label}
              </button>
            ))}

            <Link
              to="/sale"
              className="flex items-center border-b-[3px] border-transparent px-4 py-6 text-[13px] font-bold uppercase tracking-tight text-brand-red [font-stretch:condensed] transition hover:bg-red-50"
            >
              Sale
            </Link>

            <NavLink
              to="/releases"
              className={({ isActive }) =>
                `flex items-center border-b-[3px] px-4 py-6 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                  isActive
                    ? 'border-brand-red text-neutral-950'
                    : 'border-transparent text-neutral-800 hover:bg-neutral-50'
                }`
              }
            >
              Releases
            </NavLink>

            <button
              type="button"
              className={`border-b-[3px] px-4 py-6 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                mega === 'brands'
                  ? 'border-brand-red text-neutral-950'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50'
              }`}
              aria-expanded={mega === 'brands'}
              onFocus={() => openMega('brands')}
              onMouseEnter={() => openMega('brands')}
            >
              Brands
            </button>

            <button
              type="button"
              className={`border-b-[3px] px-4 py-6 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                mega === 'newtrend'
                  ? 'border-brand-red text-neutral-950'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50'
              }`}
              aria-expanded={mega === 'newtrend'}
              onFocus={() => openMega('newtrend')}
              onMouseEnter={() => openMega('newtrend')}
            >
              New &amp; trending
            </button>
          </nav>

          <form
            key={
              location.pathname === '/search'
                ? `nav-search-${location.search}`
                : 'nav-search'
            }
            className="mx-2 hidden min-w-0 max-w-md flex-1 lg:block"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(
                new FormData(e.currentTarget).get('q') ?? '',
              ).trim();
              navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
            }}
          >
            <label htmlFor="nav-site-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4-4" />
                </svg>
              </span>
              <input
                id="nav-site-search"
                name="q"
                type="search"
                defaultValue={
                  location.pathname === '/search'
                    ? new URLSearchParams(location.search).get('q') ?? ''
                    : ''
                }
                placeholder="Search brands, styles…"
                className="h-10 w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-900 shadow-inner outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
              />
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/search"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-950 lg:hidden"
              aria-label="Search products"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4-4" />
              </svg>
            </Link>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-black transition hover:border-neutral-950 sm:h-11 sm:w-11"
              aria-label={`Cart, ${itemCount} items`}
              aria-expanded={drawerOpen}
              onClick={openDrawer}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M6 6h15l-1.5 9h-11z" />
                <path d="M6 6 5 3H2" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-fl-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((x) => !x)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                {mobileOpen ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Fly-out */}
        <div id="mega-flyout">
          <MegaPanel active={mega} />
        </div>

        {/* Quick strip */}
        <div className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-1 gap-y-1 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 sm:text-[12px] sm:tracking-wider lg:px-8">
            {[
              ["Men's", '/shop?category=men'],
              ["Women's", '/shop?category=women'],
              ["Kids'", '/shop?category=kids'],
              ['Stores', '/stores'],
              ['New arrivals', '/releases'],
              ['Releases', '/releases'],
              ['Sale', '/sale'],
              ['Basketball', '/shop?category=men'],
            ].map(([label, href]) => (
              <Link
                key={label}
                to={href}
                className="rounded px-3 py-1.5 transition hover:bg-neutral-200/80"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-fl-nav"
          className="max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-neutral-200 bg-white lg:hidden"
        >
          <div className="space-y-1 px-4 py-4">
            <Link
              to="/shop?category=men"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Men&apos;s
            </Link>
            <Link
              to="/shop?category=women"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Women&apos;s
            </Link>
            <Link
              to="/shop?category=kids"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Kids&apos;
            </Link>
            <Link
              to="/sale"
              className="block rounded-lg px-3 py-3 font-bold uppercase text-brand-red"
              onClick={() => setMobileOpen(false)}
            >
              Sale
            </Link>
            <Link
              to="/releases"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Releases
            </Link>
            <Link
              to="/shop"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Shop all
            </Link>
            <NavLink
              to="/stores"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Stores
            </NavLink>
            <Link
              to="/sign-in"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/search"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/wishlist"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Wishlist
              {wishlistCount > 0 ? ` (${wishlistCount})` : ''}
            </Link>
            <Link
              to="/account/orders"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              My orders
            </Link>
            <Link
              to="/admin/login"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
            <Link
              to="/rewards"
              className="block rounded-lg px-3 py-3 font-bold uppercase text-brand-red"
              onClick={() => setMobileOpen(false)}
            >
              {REWARDS_PROGRAM}
            </Link>
            <NavLink
              to="/cart"
              className="block rounded-lg border border-neutral-200 px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Cart
            </NavLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
