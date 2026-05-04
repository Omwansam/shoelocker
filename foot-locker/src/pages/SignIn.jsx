import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../config/brand.js';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-center font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-600">
        Access your orders and {` `}
        <Link to="/rewards" className="font-semibold text-brand-red hover:underline">
          Kickback Rewards
        </Link>
        .
      </p>

      {submitted ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center animate-fade-rise">
          <p className="font-semibold text-neutral-950">
            You&apos;re signed in (mock)
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            No account is created — this is a front-end only flow. Use the links
            below to keep shopping.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/shop"
              className="rounded-full bg-brand-red py-3 text-sm font-bold uppercase text-white transition hover:bg-brand-red-hover"
            >
              Continue shopping
            </Link>
            <Link
              to="/"
              className="py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-950"
            >
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-[var(--shadow-card)]"
        >
          <div>
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-wider text-neutral-500"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-neutral-950 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            Sign in
          </button>
          <p className="text-center text-xs text-neutral-500">
            Forgot password? Contact{' '}
            <a className="text-brand-red" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
