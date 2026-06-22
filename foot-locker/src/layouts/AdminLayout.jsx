import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogoMark } from '../components/LogoMark.jsx';
import { AdminIcon } from '../components/admin/AdminIcons.jsx';
import { ADMIN_NAV_SECTIONS, ADMIN_ROUTE_TITLES } from '../components/admin/adminNav.js';
import { useAdminAuth } from '../hooks/useAdminAuth.js';
import { useAdminInventory } from '../hooks/useAdminInventory.js';
import { fetchAdminOrders } from '../utils/api.js';

function initialsFromEmail(email) {
  const local = String(email || 'A').split('@')[0] || 'A';
  return local.slice(0, 2).toUpperCase();
}

function useBreadcrumbs() {
  const { pathname } = useLocation();
  return useMemo(() => {
    const parts = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
    if (!parts.length) return [{ label: 'Dashboard', to: '/admin/dashboard' }];
    const crumbs = [{ label: 'Admin', to: '/admin/dashboard' }];
    let path = '/admin';
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      path += `/${part}`;
      if (/^\d+$/.test(part)) {
        crumbs.push({ label: `ORD-${part.padStart(3, '0')}`, to: path });
        continue;
      }
      const label = ADMIN_ROUTE_TITLES[part] || part.charAt(0).toUpperCase() + part.slice(1);
      crumbs.push({ label, to: path });
    }
    return crumbs;
  }, [pathname]);
}

export function AdminLayout() {
  const { session, logout } = useAdminAuth();
  const { lowStockProducts } = useAdminInventory();
  const [mobileNav, setMobileNav] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const breadcrumbs = useBreadcrumbs();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchAdminOrders({ status: 'pending', per_page: 1 });
        if (active) setPendingOrderCount(Number(data?.pagination?.total || 0));
      } catch {
        if (active) setPendingOrderCount(0);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const badges = {
    pendingOrders: pendingOrderCount,
    lowStock: lowStockProducts.length,
  };

  return (
    <div className="admin-shell flex min-h-dvh">
      <aside
        className={
          mobileNav
            ? 'admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col lg:static'
            : 'admin-sidebar hidden w-[17.5rem] flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:flex'
        }
      >
        <div className="relative border-b border-white/[0.06] px-5 py-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand-red/20 to-transparent" />
          <div className="relative flex items-center justify-between gap-3">
            <Link to="/admin/dashboard" className="min-w-0 no-underline" onClick={() => setMobileNav(false)}>
              <LogoMark to="" variant="invert" compact className="min-w-0" />
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
            Operations console
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          {ADMIN_NAV_SECTIONS.map((group) => (
            <div key={group.section} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileNav(false)}
                      className={({ isActive }) =>
                        [
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'admin-nav-active bg-white/[0.08] text-white shadow-inner'
                            : 'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={
                              isActive
                                ? 'text-brand-red'
                                : 'text-neutral-500 transition group-hover:text-neutral-300'
                            }
                          >
                            <AdminIcon name={item.icon} className="size-[1.125rem]" />
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {badge > 0 ? (
                            <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-red-800 text-xs font-bold text-white">
              {initialsFromEmail(session?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Staff</p>
              <p className="truncate text-xs text-neutral-500">{session?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Dismiss menu"
          onClick={() => setMobileNav(false)}
        />
      ) : null}

      <div className="admin-main flex min-h-dvh flex-1 flex-col lg:pl-[17.5rem]">
        <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl p-2 text-neutral-600 transition hover:bg-neutral-100 lg:hidden"
                onClick={() => setMobileNav(true)}
                aria-label="Open navigation"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <nav className="hidden items-center gap-1 text-xs text-neutral-500 sm:flex" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.to} className="flex items-center gap-1">
                      {i > 0 ? <span className="text-neutral-300">/</span> : null}
                      {i === breadcrumbs.length - 1 ? (
                        <span className="font-semibold text-neutral-800">{crumb.label}</span>
                      ) : (
                        <Link to={crumb.to} className="hover:text-neutral-800">
                          {crumb.label}
                        </Link>
                      )}
                    </span>
                  ))}
                </nav>
                <p className="text-sm font-semibold text-neutral-950 sm:hidden">
                  {breadcrumbs[breadcrumbs.length - 1]?.label}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/"
                className="hidden items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
              >
                <AdminIcon name="storefront" className="size-4" />
                Storefront
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
