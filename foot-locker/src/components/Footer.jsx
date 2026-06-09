import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast.js';
import { persistNewsletterSignup } from '../utils/newsletterStorage.js';
import {
  COMPANY_NAME,
  REWARDS_PROGRAM,
  SUPPORT_EMAIL,
} from '../config/brand.js';
import { LogoMark } from './LogoMark.jsx';

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

const footCol = /** @type {const} */ ([
  {
    title: 'Help',
    links: [
      ['Contact us', '/support#contact'],
      ['Order status', '/account/orders'],
      ['Shipping info', '/support#shipping'],
      ['Store pickup', '/support#pickup'],
      ['Returns & exchanges', '/support#returns'],
    ],
  },
  {
    title: 'About',
    links: [
      ['Our story', '/support#about'],
      ['Careers', '/support#careers'],
      ['Affiliates', '/support#affiliates'],
    ],
  },
  {
    title: 'Shop',
    links: [
      ['Gift cards', '/support#gift-cards'],
      ['Coupons & sale', '/sale'],
      ['Store locator', '/stores'],
      ["Men's shoes", '/shop?category=men'],
      ["Women's shoes", '/shop?category=women'],
      ["Kids' shoes", '/shop?category=kids'],
      ['Apparel', '/apparel'],
      ['Hoodies', '/apparel?style=hoodies'],
      ['Sale apparel', '/apparel'],
    ],
  },
  {
    title: 'Legal information',
    links: [
      ['Terms of use', '/support#terms'],
      ['Privacy', '/support#privacy'],
      ['Accessibility', '/support#accessibility'],
    ],
  },
]);

export function Footer() {
  const { show } = useToast();
  const [email, setEmail] = useState('');

  function onNewsletterSubmit(e) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    const result = persistNewsletterSignup(v);
    if (!result.ok) {
      show(result.error, 'error');
      return;
    }
    if (result.already) {
      show(
        `${result.email} is already subscribed — you're still on the list for Kenya drops.`,
        'info',
      );
    } else {
      show(
        `Saved locally — we'll email ${result.email} when campaigns go live (demo storage).`,
        'success',
      );
    }
    setEmail('');
  }

  return (
    <footer className="mt-auto bg-neutral-100">
      <div className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-12 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
                {REWARDS_PROGRAM}
              </p>
              <p className="mt-3 text-xl font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed]">
                Earn points on footwear &amp; gear
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Members get perks on every qualifying purchase.* Join free with
                your {COMPANY_NAME} account — same login as checkout when we wire
                payments.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/rewards"
                className="inline-flex items-center rounded-full border border-neutral-900 bg-neutral-950 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
              >
                How it works
              </Link>
              <Link
                to="/rewards"
                className="inline-flex items-center border-2 border-neutral-900 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
              >
                Join free
              </Link>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            *Reward rules apply; see{' '}
            <Link to="/rewards" className="underline">
              {REWARDS_PROGRAM}
            </Link>{' '}
            for tier details once live.
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-300 bg-neutral-100">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-6 lg:px-8">
          <div className="lg:col-span-2">
            <LogoMark variant="footer" showTagline={false} />
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              {COMPANY_NAME} curates performance and lifestyle sneakers with a
              wall-worthy shopping experience. Product names and logos belong to
              their respective owners.
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-brand-red hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <div className="mt-5 flex gap-3">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-black transition hover:border-neutral-950"
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-950">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link
                        to={href}
                        className="text-neutral-700 transition hover:text-black hover:underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-neutral-700 transition hover:text-black">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-300 bg-white">
          <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-red">
                  Newsletter
                </p>
                <p className="mt-2 text-lg font-bold text-neutral-950">
                  Nairobi drops &amp; coast restocks
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  One email on release weeks — no spam. Unsubscribe anytime once we ship
                  preferences.
                </p>
              </div>
              <form
                className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
                onSubmit={onNewsletterSubmit}
              >
                <label htmlFor="footer-news-email" className="sr-only">
                  Email for newsletter
                </label>
                <input
                  id="footer-news-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-300 bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-8 text-xs text-neutral-600 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
            <p className="max-w-xl">
              Prices and availability shown in this storefront are for demonstration.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
