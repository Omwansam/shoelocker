import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast.js';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { subscribeNewsletter } from '../utils/api.js';
import { COMPANY_NAME, TAGLINE } from '../config/brand.js';
import { footerColumns, footerQuickLinks } from '../config/footerLinks.js';
import { LogoMark } from './LogoMark.jsx';
import { DeveloperCredit } from './DeveloperCredit.jsx';

const social = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/',
    icon: (
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 2.5a5.5 5.5 0 1 1 0 11.001 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7.001 3.5 3.5 0 0 0 0-7zM17.5 6.5h.01" />
    ),
  },
  {
    name: 'X',
    href: 'https://x.com/',
    icon: (
      <path d="M4 4l7.07 9.52L4 20h2.5l5.74-7.62L16.93 20H20l-7.35-9.92L20 4h-2.5l-5.32 7.15L7.07 4H4z" />
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/',
    icon: (
      <path d="M10 15V9l6 3-6 3zm10-5.2c0-1.5-.2-2.5-.5-3.3-.3-.8-.9-1.4-1.7-1.7-.8-.3-2.5-.5-5.8-.5s-5 .2-5.8.5c-.8.3-1.4.9-1.7 1.7-.3.8-.5 1.8-.5 3.3s.2 2.5.5 3.3c.3.8.9 1.4 1.7 1.7.8.3 2.5.5 5.8.5s5-.2 5.8-.5c.8-.3 1.4-.9 1.7-1.7.3-.8.5-1.8.5-3.3z" />
    ),
  },
];

const footCol = footerColumns;

/** @param {{ href: string, label: string }} props */
function FooterLink({ href, label }) {
  const cls =
    'group inline-flex items-center gap-1.5 text-sm text-neutral-600 transition hover:text-neutral-950';
  const arrow = (
    <span
      aria-hidden
      className="text-neutral-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-brand-red"
    >
      →
    </span>
  );

  if (href.startsWith('/')) {
    return (
      <Link to={href} className={cls}>
        {label}
        {arrow}
      </Link>
    );
  }
  return (
    <a href={href} className={cls}>
      {label}
      {arrow}
    </a>
  );
}

export function Footer() {
  const { show } = useToast();
  const { settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSuccess, setNewsSuccess] = useState('');
  const [newsError, setNewsError] = useState('');

  const supportEmail = settings.support_email || 'hello@shoelocker.ke';

  async function onNewsletterSubmit(e) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    setNewsLoading(true);
    setNewsError('');
    setNewsSuccess('');
    try {
      const result = await subscribeNewsletter(v);
      const msg =
        result.message || `You're on the list — drops and restocks headed to ${v}.`;
      setNewsSuccess(msg);
      show(msg, 'success');
      setEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not subscribe';
      setNewsError(msg);
      show(msg, 'error');
    } finally {
      setNewsLoading(false);
    }
  }

  return (
    <footer className="mt-auto">
      {/* Link grid */}
      <div className="border-t border-neutral-200 bg-neutral-100">
        <div
          className="pointer-events-none h-1 w-full bg-gradient-to-r from-brand-red via-brand-red/40 to-transparent"
          aria-hidden
        />
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8 lg:px-8 lg:py-16">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block transition opacity-100 hover:opacity-90">
              <LogoMark variant="footer" showTagline={false} />
            </Link>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              {TAGLINE}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600">
              {COMPANY_NAME} curates performance and lifestyle sneakers with a
              wall-worthy shopping experience. Product names and logos belong to
              their respective owners.
            </p>
            <p className="mt-4">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-950 hover:shadow"
              >
                <span className="text-brand-red" aria-hidden>
                  ✉
                </span>
                {supportEmail}
              </a>
            </p>
            <div className="mt-6 flex gap-2.5">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-md"
                  aria-label={s.name}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {footCol.map((col) => (
            <div key={col.title}>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-950">
                <span className="h-3 w-0.5 rounded-full bg-brand-red" aria-hidden />
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink href={href} label={label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 55% 80% at 100% 50%, rgb(230 0 18 / 0.22), transparent 60%), radial-gradient(ellipse 40% 60% at 0% 100%, rgb(255 255 255 / 0.04), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
                Newsletter
              </p>
              <h2 className="mt-2 font-[800] uppercase leading-[0.95] tracking-tighter [font-stretch:condensed] sm:text-3xl">
                Nairobi drops
                <span className="block text-white/90">&amp; coast restocks</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400">
                One email on release weeks — heat alerts, restock pings, and member
                perks. No spam; unsubscribe when preferences ship.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {['Drop alerts', 'KES pricing', 'Kenya-wide'].map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7">
              {newsSuccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-8 text-center lg:text-left">
                  <p className="font-semibold text-emerald-300">You&apos;re subscribed</p>
                  <p className="mt-2 text-sm text-neutral-300">{newsSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setNewsSuccess('')}
                    className="mt-5 text-[12px] font-bold uppercase tracking-wide text-white/70 hover:text-white"
                  >
                    Subscribe another email
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={onNewsletterSubmit}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
                >
                  {newsError ? (
                    <p className="mb-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">
                      {newsError}
                    </p>
                  ) : null}
                  <label
                    htmlFor="footer-news-email"
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400"
                  >
                    Email address
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <input
                      id="footer-news-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.ke"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={newsLoading}
                      className="min-w-0 flex-1 rounded-xl border border-white/15 bg-neutral-900 px-4 py-3.5 text-sm text-white shadow-inner outline-none transition placeholder:text-neutral-500 focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/20 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={newsLoading}
                      className="shrink-0 rounded-full bg-brand-red px-8 py-3.5 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover disabled:opacity-60"
                    >
                      {newsLoading ? 'Joining…' : 'Subscribe'}
                    </button>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">
                    By subscribing you agree to receive marketing email from {COMPANY_NAME}.
                    Saved to our subscriber list via the store API.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-200 bg-white">
        <div
          className="h-px w-full bg-gradient-to-r from-brand-red/60 via-brand-red/20 to-transparent"
          aria-hidden
        />
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <nav
            aria-label="Footer quick links"
            className="flex flex-wrap items-center justify-center gap-2 border-b border-neutral-100 pb-6 sm:justify-start"
          >
            {footerQuickLinks.map(([label, href]) => (
              <Link
                key={label}
                to={href}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700 transition hover:border-neutral-400 hover:bg-white hover:text-neutral-950 hover:shadow-sm"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <p className="text-sm font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed]">
                © {new Date().getFullYear()} {COMPANY_NAME}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                All rights reserved. Product names and logos are trademarks of
                their respective owners.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:col-span-4 lg:justify-center">
              {[
                { label: 'Prices in KES', accent: true },
                { label: settings.country || 'Kenya', accent: false },
                { label: 'Live catalog', accent: false },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    chip.accent
                      ? 'border-brand-red/25 bg-brand-red/5 text-brand-red'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                  }`}
                >
                  {chip.accent ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-red"
                      aria-hidden
                    />
                  ) : null}
                  {chip.label}
                </span>
              ))}
            </div>

            <div className="text-center lg:col-span-4 lg:text-right">
              <DeveloperCredit variant="muted" className="inline-block" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
