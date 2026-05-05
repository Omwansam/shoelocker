import { useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function AdminLogin() {
  const { session, login } = useAdminAuth();
  const [email, setEmail] = useState('ops@shoelocker.ke');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Sign in failed');
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
              {error}
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
            <div className="relative mt-2">
              <input
                id="adm-pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-3 pr-10 text-sm text-white outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-200"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-brand-red text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
          >
            {loading ? 'Signing in...' : 'Enter admin'}
          </button>
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
