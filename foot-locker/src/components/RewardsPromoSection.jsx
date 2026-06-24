import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_NAME, REWARDS_PROGRAM } from '../config/brand.js';
import { fetchRewards } from '../utils/api.js';

/** Stylized member pass — earn rate + perks from live program data. */
/** @param {{ programName: string, pointsDivisor: number, perks: string[], loading: boolean }} props */
function KickbackPass({ programName, pointsDivisor, perks, loading }) {
  if (loading) {
    return (
      <div
        className="mx-auto aspect-[4/5] max-w-[320px] animate-pulse rounded-3xl border border-white/10 bg-white/5 lg:mx-0 lg:max-w-none"
        aria-hidden
      />
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[340px] lg:mx-0 lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-3 rounded-[2rem] opacity-60 blur-2xl"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, rgb(230 0 18 / 0.45) 0%, transparent 55%, rgb(255 255 255 / 0.08) 100%)',
        }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-neutral-900 shadow-[0_32px_64px_-16px_rgb(0_0_0_/_0.65)]">
        <div
          className="absolute inset-0 opacity-30"
          aria-hidden
          style={{
            background:
              'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgb(255 255 255 / 0.03) 8px, rgb(255 255 255 / 0.03) 9px)',
          }}
        />

        <div className="relative border-b border-white/10 bg-gradient-to-br from-brand-red via-[#a8000f] to-neutral-950 px-6 py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/75">
            Member pass
          </p>
          <p className="mt-2 font-[800] uppercase leading-none tracking-tighter text-white [font-stretch:condensed] sm:text-3xl">
            {programName}
          </p>
        </div>

        <div className="relative space-y-5 px-6 py-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              Earn rate
            </p>
            <p className="mt-1.5 text-3xl font-[800] tracking-tight text-white">
              1 pt
              <span className="text-lg font-semibold text-neutral-400">
                {' '}
                / KSh {pointsDivisor.toLocaleString()}
              </span>
            </p>
          </div>

          <ul className="space-y-2">
            {(perks.length ? perks : ['Points on every qualifying order', 'Free to join']).map(
              (perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-2 text-sm leading-snug text-neutral-300"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
                    aria-hidden
                  />
                  {perk}
                </li>
              ),
            )}
          </ul>

          <div className="flex items-end justify-between gap-4 border-t border-dashed border-white/15 pt-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-neutral-600">
                {COMPANY_NAME}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">One account · Shop &amp; earn</p>
            </div>
            <div
              className="flex h-10 w-16 items-end justify-between gap-0.5 opacity-40"
              aria-hidden
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-white"
                  style={{ height: `${28 + ((i * 7) % 24)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RewardsPromoSection() {
  const [program, setProgram] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetchRewards({ signal: ac.signal })
      .then(({ program: p }) => setProgram(p))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setProgram(null);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const programName = program?.program_name || REWARDS_PROGRAM;
  const pointsDivisor = program?.points_divisor || 100;

  const passPerks = useMemo(() => {
    const fromTiers = (program?.tiers ?? [])
      .flatMap((t) => t.perks ?? [])
      .filter(Boolean)
      .slice(0, 3);
    if (fromTiers.length) return fromTiers;
    return ['Perks on qualifying footwear & gear', 'Same login as checkout'];
  }, [program]);

  return (
    <section
      aria-labelledby="kickback-home-heading"
      className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-white"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'linear-gradient(180deg, rgb(12 12 12) 0%, rgb(18 18 18) 40%, rgb(10 10 10) 100%), radial-gradient(ellipse 55% 45% at 15% 50%, rgb(230 0 18 / 0.14), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
              {programName}
            </p>

            <h2
              id="kickback-home-heading"
              className="mt-3 font-[800] uppercase leading-[0.9] tracking-tighter [font-stretch:condensed] sm:text-5xl lg:text-[3.25rem]"
            >
              Earn points on
              <span className="mt-1 block text-white/95">footwear &amp; gear</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              Members get perks on every qualifying purchase.*
              {' '}Join free with your {COMPANY_NAME} account — same login as checkout when we
              wire payments.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-red px-9 text-[13px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
              >
                Join free
              </Link>
              <Link
                to="/rewards"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-8 text-[13px] font-bold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/5"
              >
                How it works
              </Link>
            </div>

            <p className="mt-8 max-w-lg text-[11px] leading-relaxed text-neutral-600">
              *Reward rules apply; see {programName} for tier details once live.
            </p>
          </div>

          <div className="lg:col-span-5">
            <KickbackPass
              programName={programName}
              pointsDivisor={pointsDivisor}
              perks={passPerks}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
