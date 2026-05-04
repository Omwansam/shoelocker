import { Link } from 'react-router-dom';
import { COMPANY_NAME, REWARDS_PROGRAM } from '../config/brand.js';

const perks = [
  'Earn 1 Kickback point for every KSh 100 spent online (tracked in this prototype UI only).',
  'Birthday bonus and early access SMS for Nairobi +254 members when drops land.',
  'Unlock free nationwide courier once you cross our annual spend tiers — mirrors real loyalty math in KSh.',
];

export function Rewards() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-red">
          {REWARDS_PROGRAM}
        </p>
        <h1 className="mt-3 max-w-2xl text-pretty font-[800] uppercase leading-tight tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-5xl">
          Get more with every pair you cop
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          {COMPANY_NAME} members stack perks in Kenyan Shillings — built for
          Safaricom-friendly accounts. This screen is front-end only; join via
          sign-in to preview the flow.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/sign-in"
            className="inline-flex rounded-full bg-brand-red px-8 py-3 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
          >
            Join {REWARDS_PROGRAM}
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center rounded-full border-2 border-neutral-950 px-8 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
          >
            Start earning
          </Link>
        </div>
      </div>

      <section className="py-14">
        <h2 className="font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
          Why join
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {perks.map((t) => (
            <li
              key={t}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm leading-relaxed text-neutral-700"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
