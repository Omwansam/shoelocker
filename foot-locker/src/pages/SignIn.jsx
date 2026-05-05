import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../config/brand.js';
import { loginRequest, registerRequest } from '../utils/authApi.js';

export function SignIn() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerRequest({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
        });
        setMessage('Account created successfully. You can now sign in.');
        setMode('login');
      } else {
        const payload = await loginRequest(email, password);
        const user = payload?.user;
        setMessage(`Welcome back, ${user?.username || user?.email || 'user'}!`);
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
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
      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${mode === 'login' ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-700'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${mode === 'register' ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-700'}`}
        >
          Register
        </button>
      </div>

      {submitted ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center animate-fade-rise">
          <p className="font-semibold text-neutral-950">
            You&apos;re signed in
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {message || 'Your account is connected to backend auth.'}
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
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          {message && mode === 'register' ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
          ) : null}
          {mode === 'register' ? (
            <>
              <div>
                <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-neutral-500">First name</label>
                  <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15" />
                </div>
                <div>
                  <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Last name</label>
                  <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15" />
                </div>
              </div>
            </>
          ) : null}
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
          {mode === 'register' ? (
            <>
              <div>
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Phone</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15" />
              </div>
              <div>
                <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-neutral-500">Address</label>
                <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15" />
              </div>
            </>
          ) : null}
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
            disabled={loading}
            className="w-full rounded-full bg-neutral-950 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
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
