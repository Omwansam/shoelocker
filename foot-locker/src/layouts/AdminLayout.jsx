import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { COMPANY_NAME } from '../config/brand.js';
import { mockOrders } from '../data/adminMock.js';
import { LogoMark } from '../components/LogoMark.jsx';
import { useAdminAuth } from '../hooks/useAdminAuth.js';
import { useAdminInventory } from '../hooks/useAdminInventory.js';
import { useAdminOrderStatuses } from '../hooks/useAdminOrderStatuses.js';

const nav = /** @type {const} */ ([
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/orders', 'Orders'],
  ['/admin/products', 'Products'],
  ['/admin/customers', 'Customers'],
  ['/admin/promotions', 'Promotions'],
  ['/admin/reports', 'Reports'],
  ['/admin/settings', 'Settings'],
]);

export function AdminLayout() {
  const { session, logout } = useAdminAuth();
  const { lowStockProducts } = useAdminInventory();
  const { getStatus } = useAdminOrderStatuses();
  const [mobileNav, setMobileNav] = useState(false);

  const pendingOrderCount = useMemo(
    () => mockOrders.filter((o) => getStatus(o) === 'Processing').length,
    [getStatus],
  );

  return (
    <div className="flex min-h-dvh bg-neutral-100 text-neutral-900">
      <aside
        className={
          mobileNav
            ? 'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-950 text-white lg:static'
            : 'hidden w-64 flex-col bg-neutral-950 text-white lg:fixed lg:inset-y-0 lg:z-40 lg:flex'
        }
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-5">
          <Link
            to="/admin/dashboard"
            className="min-w-0 no-underline"
            onClick={() => setMobileNav(false)}
          >
            <LogoMark to="" variant="invert" compact className="min-w-0" />
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin">
          {nav.map(([to, label]) => {
            const badge =
              to === '/admin/orders'
                ? pendingOrderCount
                : to === '/admin/products'
                  ? lowStockProducts.length
                  : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin/dashboard'}
                onClick={() => setMobileNav(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive
                      ? 'bg-white text-neutral-950'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <span>{label}</span>
                {badge > 0 ? (
                  <span className="shrink-0 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold tabular-nums leading-none text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-neutral-500">
          <p className="font-semibold text-neutral-400">{COMPANY_NAME}</p>
          <p className="mt-1">Staff console</p>
        </div>
      </aside>

      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Dismiss menu"
          onClick={() => setMobileNav(false)}
        />
      ) : null}

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-widest text-brand-red">
                Admin
              </p>
              <p className="truncate text-xs text-neutral-500">
                Signed in as {session?.email}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:inline-block"
            >
              View storefront
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
