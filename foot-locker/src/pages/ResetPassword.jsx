import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DeveloperCredit } from '../components/DeveloperCredit.jsx';
import { resetPasswordRequest } from '../utils/authApi.js';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest({ token, password });
      setDone(true);
      setTimeout(() => navigate('/sign-in'), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center sm:px-6 lg:px-8">
        <h1 className="font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
          Invalid reset link
        </h1>
        <p className="mt-4 text-sm text-neutral-600">
          This password reset link is missing or incomplete. Request a new one from the
          forgot password page.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 inline-flex rounded-full bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
        Account recovery
      </p>
      <h1 className="mt-3 text-center font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
        Set new password
      </h1>
      <p className="mt-3 text-center text-sm text-neutral-600">
        Choose a strong password you haven&apos;t used on ShoeLocker before.
      </p>

      {done ? (
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center animate-fade-rise">
          <p className="font-semibold text-neutral-950">Password updated</p>
          <p className="mt-2 text-sm text-neutral-600">Redirecting you to sign in…</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-[var(--shadow-card)]"
        >
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div>
            <label
              htmlFor="new-password"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              New password
            </label>
            <div className="relative mt-2">
              <input
                id="new-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-3 pr-10 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-neutral-950 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>

          <p className="text-center text-sm text-neutral-600">
            Link expired?{' '}
            <Link to="/forgot-password" className="font-semibold text-brand-red hover:underline">
              Request a new one
            </Link>
          </p>
        </form>
      )}

      <DeveloperCredit variant="muted" className="mt-10 text-center" />
    </div>
  );
}
