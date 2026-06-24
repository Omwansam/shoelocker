import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DeveloperCredit } from '../components/DeveloperCredit.jsx';
import { forgotPasswordRequest } from '../utils/authApi.js';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDevResetUrl('');
    setLoading(true);
    try {
      const payload = await forgotPasswordRequest(email);
      setMessage(
        payload.message ||
          'If an account exists for that email, password reset instructions have been sent.',
      );
      if (payload.reset_url) {
        setDevResetUrl(payload.reset_url);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
        Account recovery
      </p>
      <h1 className="mt-3 text-center font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
        Forgot password
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-neutral-600">
        Enter the email on your ShoeLocker account. We&apos;ll send a secure link to
        choose a new password.
      </p>

      {sent ? (
        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center animate-fade-rise">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 4h16v16H4z" />
              <path d="m22 6-10 7L2 6" />
            </svg>
          </span>
          <p className="mt-4 font-semibold text-neutral-950">Check your inbox</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{message}</p>
          <p className="mt-4 text-xs text-neutral-500">
            The link expires in one hour. Didn&apos;t get it? Check spam or try again with
            the correct email.
          </p>
          {devResetUrl ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Dev reset link
              </p>
              <a
                href={devResetUrl}
                className="mt-2 block break-all text-sm font-semibold text-brand-red hover:underline"
              >
                {devResetUrl}
              </a>
            </div>
          ) : null}
          <Link
            to="/sign-in"
            className="mt-6 inline-flex rounded-full bg-neutral-950 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            Back to sign in
          </Link>
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
              htmlFor="forgot-email"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Email address
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.ke"
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-red py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-neutral-600">
            Remember your password?{' '}
            <Link to="/sign-in" className="font-semibold text-brand-red hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}

      <DeveloperCredit variant="muted" className="mt-10 text-center" />
    </div>
  );
}
