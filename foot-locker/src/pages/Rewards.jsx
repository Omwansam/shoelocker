import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_NAME, REWARDS_PROGRAM } from '../config/brand.js';
import { fetchRewards } from '../utils/api.js';
import { formatPrice } from '../utils/format.js';

export function Rewards() {
  const [program, setProgram] = useState(/** @type {any} */ (null));
  const [member, setMember] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetchRewards({ signal: ac.signal })
      .then(({ program: p, member: m }) => {
        setProgram(p);
        setMember(m);
      })
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const programName = program?.program_name || REWARDS_PROGRAM;
  const tiers = program?.tiers || [];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-red">
          {programName}
        </p>
        <h1 className="mt-3 max-w-2xl text-pretty font-[800] uppercase leading-tight tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-5xl">
          Get more with every pair you cop
        </h1>
        <p className="mt-6 max-w-xl text-lg text-neutral-600">
          {COMPANY_NAME} members stack perks in Kenyan Shillings — built for
          Safaricom-friendly accounts. Earn {programName} points on every order
          and climb tiers as you shop.
        </p>

        {member ? (
          <div className="mt-10 grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-950 p-8 text-white sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                {member.first_name ? `${member.first_name}'s points` : 'Your points'}
              </p>
              <p className="mt-2 text-4xl font-[800] tracking-tight">
                {member.points.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Current tier
              </p>
              <p className="mt-2 text-2xl font-[800] uppercase tracking-tight text-brand-red [font-stretch:condensed]">
                {member.current_tier || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                {member.next_tier ? `Spend to ${member.next_tier}` : 'Top tier reached'}
              </p>
              <p className="mt-2 text-2xl font-[800] tracking-tight">
                {member.next_tier ? formatPrice(member.spend_to_next_tier_kes) : '🏆'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/sign-in"
              className="inline-flex rounded-full bg-brand-red px-8 py-3 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
            >
              Join {programName}
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-full border-2 border-neutral-950 px-8 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
            >
              Start earning
            </Link>
          </div>
        )}
      </div>

      <section className="py-14">
        <h2 className="font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
          Membership tiers
        </h2>
        {loading ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-56 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
              />
            ))}
          </ul>
        ) : tiers.length === 0 ? (
          <p className="mt-8 text-neutral-600">
            Reward tiers are being updated. Check back soon.
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {tiers.map((tier) => {
              const reached = member && member.total_spent_kes >= tier.min_spend_kes;
              return (
                <li
                  key={tier.id}
                  className={`rounded-2xl border p-6 ${
                    reached
                      ? 'border-brand-red bg-brand-red/5'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed]">
                      {tier.name}
                    </h3>
                    {reached ? (
                      <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Unlocked
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {tier.min_spend_kes > 0
                      ? `Spend ${formatPrice(tier.min_spend_kes)}+ to unlock`
                      : 'Free to join'}
                    {tier.points_multiplier && tier.points_multiplier !== 1
                      ? ` · ${tier.points_multiplier}x points`
                      : ''}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-neutral-700">
                    {(tier.perks || []).map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <span aria-hidden className="text-brand-red">
                          •
                        </span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
