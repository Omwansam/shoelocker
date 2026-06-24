import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DeveloperCredit } from '../components/DeveloperCredit.jsx';
import {
  getPostLoginDestination,
  isAdminUser,
  loginRequest,
  registerRequest,
} from '../utils/authApi.js';

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = useMemo(() => {
    const fromQuery = searchParams.get('from');
    if (fromQuery?.startsWith('/admin') && fromQuery !== '/admin/login') return fromQuery;
    if (typeof location.state?.from === 'string') return location.state.from;
    return '/shop';
  }, [searchParams, location.state]);
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedInAsAdmin, setSignedInAsAdmin] = useState(false);

  useEffect(() => {
    if (!location.state?.signedOut) return;
    setSubmitted(false);
    setEmail('');
    setPassword('');
    setError('');
    setMessage('You have been signed out. Sign in again to continue.');
    navigate('/sign-in', { replace: true, state: { from: location.state?.from } });
  }, [location.state?.signedOut, location.state?.from, navigate]);

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
        const destination = getPostLoginDestination(user, returnTo);
        const admin = isAdminUser(user);
        setSignedInAsAdmin(admin);
        setMessage(
          admin
            ? `Welcome back, ${user?.username || user?.email || 'admin'}!`
            : `Welcome back, ${user?.username || user?.email || 'user'}!`,
        );
        setSubmitted(true);
        setTimeout(() => navigate(destination), 1200);
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
            {signedInAsAdmin ? (
              <Link
                to="/admin/dashboard"
                className="rounded-full bg-brand-red py-3 text-sm font-bold uppercase text-white transition hover:bg-brand-red-hover"
              >
                Go to admin portal
              </Link>
            ) : (
              <Link
                to="/shop"
                className="rounded-full bg-brand-red py-3 text-sm font-bold uppercase text-white transition hover:bg-brand-red-hover"
              >
                Continue shopping
              </Link>
            )}
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
          {message && mode === 'login' && !error ? (
            <p className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">{message}</p>
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wider text-neutral-500"
              >
                Password
              </label>
              {mode === 'login' ? (
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-red transition hover:underline"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-3 pr-10 text-sm shadow-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-700"
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
            className="w-full rounded-full bg-neutral-950 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      )}
      <DeveloperCredit variant="muted" className="mt-10 text-center" />
    </div>
  );
}
