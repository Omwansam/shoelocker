import { useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { getAdminDemoPassword } from '../../config/admin.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function AdminLogin() {
  const { session, login } = useAdminAuth();
  const [email, setEmail] = useState('ops@shoelocker.ke');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [params] = useSearchParams();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const raw = params.get('from');
    if (raw?.startsWith('/admin') && raw !== '/admin/login') return raw;
    return '/admin/dashboard';
  }, [params]);

  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(false);
    const ok = login(email, password);
    if (!ok) setError(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-brand-red">
          Staff console
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold tracking-tight">
          ShoeLocker Kenya
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Dashboard, analytics &amp; orders — demo password is set locally.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          {error ? (
            <p className="rounded-lg bg-brand-red/20 px-3 py-2 text-sm font-medium text-red-100">
              Incorrect password — check{' '}
              <code className="rounded bg-black/30 px-1">VITE_ADMIN_PASSWORD</code>{' '}
              or use the dev default below.
            </p>
          ) : null}
          <div>
            <label
              htmlFor="adm-email"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              Staff email
            </label>
            <input
              id="adm-email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-3 text-sm text-white outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30"
            />
          </div>
          <div>
            <label
              htmlFor="adm-pass"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
            >
              Password
            </label>
            <input
              id="adm-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-3 text-sm text-white outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30"
            />
          </div>
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-brand-red text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
          >
            Enter admin
          </button>
          <p className="text-center text-xs text-neutral-500">
            Default password:{' '}
            <code className="text-neutral-300">{getAdminDemoPassword()}</code>
          </p>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link to="/" state={{ from: location }} className="text-white underline-offset-4 hover:underline">
            Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
