import { Link } from 'react-router-dom';
import { COMPANY_NAME, SUPPORT_EMAIL } from '../config/brand.js';

const sections = /** @type {const} */ ([
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <>
        Reach the {COMPANY_NAME} care desk at{` `}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-red">
          {SUPPORT_EMAIL}
        </a>{' '}
        or visit a{' '}
        <Link to="/stores" className="font-semibold text-brand-red hover:underline">
          retail location
        </Link>
        . EAT hours — typical reply same business day for Nairobi time.
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Order status',
    body: 'Once checkout supports live orders, tracking links will appear here and in confirmation email. For now, use the checkout mock to simulate a completed order.',
  },
  {
    id: 'shipping',
    title: 'Shipping info',
    body: `${COMPANY_NAME} dispatches from Nairobi with same-day handoff to couriers when stock is on-hand. Nairobi & Kiambu metro: 1–2 business days. Coast & western towns: 2–4 business days. Remote counties: up to 5 business days. All prices on site are in Kenyan Shillings (KSh) inclusive of VAT where applicable.`,
  },
  {
    id: 'pickup',
    title: 'Store pickup',
    body: 'Order online and collect at Two Rivers, Sarit, Nyali, Kisumu Mega, or Nakuru Westside during mall hours. Bring your order ID and national ID or passport for verification.',
  },
  {
    id: 'returns',
    title: 'Returns & exchanges',
    body: 'Unworn pairs in original box with tags may be exchanged within 14 days in-store (Nairobi branches) or returned within 30 days nationwide via our courier network. M-Pesa refunds follow when payment rails are connected.',
  },
  {
    id: 'about',
    title: 'About ShoeLocker',
    body: `${COMPANY_NAME} is a Kenya-first sneaker retailer blending global brands with local service — flagship web experience, nationwide delivery, and mall stores you can walk into.`,
  },
  {
    id: 'careers',
    title: 'Careers',
    body: 'We hire bold merchandisers and engineers — career listings would live here.',
  },
  {
    id: 'affiliates',
    title: 'Affiliates',
    body: 'Creator and partner applications will open seasonal drops — placeholder for future program details.',
  },
  {
    id: 'gift-cards',
    title: 'Gift cards',
    body: 'Digital gift cards can be redeemed online and in participating stores once payments go live.',
  },
  {
    id: 'terms',
    title: 'Terms of use',
    body: 'By using this site you agree to shop responsibly and respect brand guidelines. This build is for demonstration.',
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: 'This app does not use browser local storage for persisted user data; account and commerce data are backend-managed.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    body: `${COMPANY_NAME} targets WCAG-aligned patterns: keyboard focus, dialogs, skip links, and descriptive labels throughout the UI.`,
  },
]);

export function Support() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-4xl">
        Help &amp; policies
      </h1>
      <p className="mt-3 text-neutral-600">
        Quick answers for shoppers. Jump to a section or{' '}
        <Link to="/stores" className="font-semibold text-brand-red hover:underline">
          find a store
        </Link>
        .
      </p>

      <nav aria-label="On this page" className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          On this page
        </p>
        <ul className="mt-4 columns-2 gap-4 text-sm sm:columns-3">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-brand-red hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-14 space-y-16">
        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-28 border-b border-neutral-100 pb-16 last:border-0"
          >
            <h2 className="text-xl font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed]">
              {s.title}
            </h2>
            <div className="mt-4 text-sm leading-relaxed text-neutral-700">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
