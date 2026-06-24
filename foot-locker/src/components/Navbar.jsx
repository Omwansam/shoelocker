import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { REWARDS_PROGRAM } from '../config/brand.js';
import { formatPrice } from '../utils/format.js';
import { LogoMark } from './LogoMark.jsx';
import { MegaPanel } from './MegaNav.jsx';
import { NavSearchForm } from './NavSearchForm.jsx';
import { megaColumns, navQuickLinks } from '../data/megaNavData.js';

/** Primary site chrome — mega nav, utility strip, quick links */

/** @typedef {'men'|'women'|'kids'|'apparel'|'brands'|'newtrend'|null} MegaActive */

function UtilityDot() {
  return <span className="nav-utility-dot" aria-hidden />;
}

/** @param {{ to: string, label: string, accent?: boolean }} props */
function QuickStripLink({ to, label, accent }) {
  const { pathname, search, hash } = useLocation();
  const current = `${pathname}${search}${hash}`;
  const active = current === to || (to.includes('#') && hash && to.endsWith(hash));

  return (
    <Link
      to={to}
      className={`shrink-0 snap-start rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition sm:text-[12px] ${
        active
          ? 'bg-neutral-950 text-white shadow-sm'
          : accent
            ? 'text-brand-red hover:bg-red-50'
            : 'text-neutral-700 hover:bg-white hover:text-neutral-950 hover:shadow-sm'
      }`}
    >
      {label}
    </Link>
  );
}

function MegaChevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`ml-0.5 opacity-60 transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Navbar() {
  const { itemCount, openDrawer, drawerOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isLoggedIn, logout } = useAuth();
  const { settings } = useStoreSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mega, setMega] = useState(/** @type {MegaActive} */ (null));
  const closeTimer = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const location = useLocation();

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
    <header className="sticky top-0 z-[60] shadow-[0_1px_0_rgb(0_0_0_/_0.06)]">
      {/* Utility strip */}
      <div className="border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-[11px] font-medium text-neutral-300">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="flex flex-wrap items-center gap-x-2 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
              Free delivery
            </span>
            <span className="text-neutral-400">
              Orders over {formatPrice(settings.free_shipping_threshold)} · {settings.country}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-y-1">
            <Link to="/stores" className="transition hover:text-white">
              Find a store
            </Link>
            <UtilityDot />
            {isLoggedIn ? (
              <Link to="/account" className="transition hover:text-white">
                My account
              </Link>
            ) : (
              <Link to="/sign-in" className="transition hover:text-white">
                Sign in
              </Link>
            )}
            <UtilityDot />
            <Link to="/wishlist" className="inline-flex items-center gap-1 transition hover:text-white">
              Wishlist
              {wishlistCount > 0 ? (
                <span className="rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </Link>
            {isLoggedIn ? (
              <>
                <UtilityDot />
                <button
                  type="button"
                  onClick={logout}
                  className="transition hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : null}
            <UtilityDot />
            <Link
              to="/rewards"
              className="font-semibold text-white transition hover:text-brand-red"
            >
              {REWARDS_PROGRAM}
            </Link>
          </div>
        </div>
      </div>

      {/* Primary + quick strip */}
      <div
        className={`relative bg-white transition-shadow ${mega ? 'shadow-lg' : ''}`}
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <LogoMark variant="nav" className="gap-2.5" />

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
                className={`inline-flex items-center border-b-[3px] px-3 py-4 text-[13px] font-bold uppercase tracking-tight transition hover:bg-neutral-50 [font-stretch:condensed] ${
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
                <MegaChevron open={mega === item.key} />
              </button>
            ))}

            <button
              type="button"
              className={`inline-flex items-center border-b-[3px] px-3 py-4 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                mega === 'apparel'
                  ? 'border-brand-red text-neutral-950'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50'
              }`}
              aria-expanded={mega === 'apparel'}
              onFocus={() => openMega('apparel')}
              onMouseEnter={() => openMega('apparel')}
            >
              Apparel
              <MegaChevron open={mega === 'apparel'} />
            </button>

            <Link
              to="/sale"
              className="flex items-center border-b-[3px] border-transparent px-3 py-4 text-[13px] font-bold uppercase tracking-tight text-brand-red [font-stretch:condensed] transition hover:bg-red-50"
            >
              Sale
            </Link>

            <NavLink
              to="/releases"
              className={({ isActive }) =>
                `flex items-center border-b-[3px] px-3 py-4 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
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
              className={`inline-flex items-center border-b-[3px] px-3 py-4 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                mega === 'brands'
                  ? 'border-brand-red text-neutral-950'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50'
              }`}
              aria-expanded={mega === 'brands'}
              onFocus={() => openMega('brands')}
              onMouseEnter={() => openMega('brands')}
            >
              Brands
              <MegaChevron open={mega === 'brands'} />
            </button>

            <button
              type="button"
              className={`inline-flex items-center border-b-[3px] px-3 py-4 text-[13px] font-bold uppercase tracking-tight [font-stretch:condensed] ${
                mega === 'newtrend'
                  ? 'border-brand-red text-neutral-950'
                  : 'border-transparent text-neutral-800 hover:bg-neutral-50'
              }`}
              aria-expanded={mega === 'newtrend'}
              onFocus={() => openMega('newtrend')}
              onMouseEnter={() => openMega('newtrend')}
            >
              New &amp; trending
              <MegaChevron open={mega === 'newtrend'} />
            </button>
          </nav>

          <NavSearchForm className="mx-2 hidden min-w-0 max-w-md flex-1 lg:block" />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 transition hover:border-neutral-950 lg:hidden"
              aria-label="Search products"
              onClick={() => {
                setMobileSearchOpen(true);
                setMobileOpen(true);
              }}
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
            </button>

            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-black transition hover:border-neutral-950"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 lg:hidden"
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
        <div className="border-t border-neutral-200 bg-neutral-100/90">
          <div className="nav-quick-strip mx-auto flex max-w-[1440px] snap-x items-center gap-1 overflow-x-auto px-3 py-2 lg:px-8">
            {navQuickLinks.map((item) => (
              <QuickStripLink
                key={item.label}
                to={item.href}
                label={item.label}
                accent={item.accent}
              />
            ))}
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-fl-nav"
          className="max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-neutral-200 bg-white lg:hidden"
        >
          <div className="border-b border-neutral-100 px-4 py-4">
            <NavSearchForm
              autoFocus={mobileSearchOpen}
              onSubmitted={() => {
                setMobileOpen(false);
                setMobileSearchOpen(false);
              }}
            />
          </div>
          <div className="space-y-1 px-4 py-4">
            {(
              /** @type {{ key: MegaActive, label: string, href: string }[]} */ ([
                { key: 'men', label: "Men's", href: '/shop?category=men&type=shoes' },
                { key: 'women', label: "Women's", href: '/shop?category=women&type=shoes' },
                { key: 'kids', label: "Kids'", href: '/shop?category=kids&type=shoes' },
              ])
            ).map((item) => (
              <div key={item.key} className="rounded-xl border border-neutral-100">
                <Link
                  to={item.href}
                  className="block px-3 py-3 font-bold uppercase"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                <div className="grid grid-cols-2 gap-1 border-t border-neutral-100 px-2 pb-2 pt-1">
                  {(megaColumns[item.key] ?? []).flatMap((col) =>
                    col.links.slice(0, 2).map((link) => (
                      <Link
                        key={`${item.key}-${link.title}`}
                        to={link.href}
                        className="rounded-lg px-2 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.title}
                      </Link>
                    )),
                  )}
                </div>
              </div>
            ))}
            <Link
              to="/apparel"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Apparel
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
              to="/shop?type=shoes"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Shop all shoes
            </Link>
            <NavLink
              to="/stores"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Stores
            </NavLink>
            <Link
              to={isLoggedIn ? '/account' : '/sign-in'}
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              {isLoggedIn ? 'My account' : 'Sign in'}
            </Link>
            {isLoggedIn ? (
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-3 text-left font-bold uppercase"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
              >
                Sign out
              </button>
            ) : null}
            <Link
              to="/wishlist"
              className="block rounded-lg px-3 py-3 font-bold uppercase"
              onClick={() => setMobileOpen(false)}
            >
              Wishlist
              {wishlistCount > 0 ? ` (${wishlistCount})` : ''}
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
