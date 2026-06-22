import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const links = [
  ['/account/orders', 'Orders'],
  ['/account/profile', 'Profile'],
  ['/account/addresses', 'Addresses'],
];

export function AccountLayout() {
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">My account</h1>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <Link
          to="/shop"
          className="rounded-full px-4 py-2 text-sm font-semibold text-brand-red hover:underline"
        >
          Continue shopping
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950"
        >
          Sign out
        </button>
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
